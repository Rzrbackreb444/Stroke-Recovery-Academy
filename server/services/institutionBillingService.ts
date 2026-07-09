// Institutional seat billing (Task #80) — per-seat Stripe subscription for an
// organization. The org pays for N survivor seats; N = organizations.seat_limit.
//
// Model:
//   * ONE Stripe product ("Institutional Survivor Seats") with a single monthly
//     per-unit price (metadata.feature = 'institution_seat'). Quantity = seats.
//   * Each org gets its own Stripe customer (metadata.orgId) so invoices/receipts
//     are cleanly scoped and reconcilable from the webhook.
//   * Seat-limit changes (admin or owner self-serve) call
//     `syncSeatSubscriptionQuantity` → `stripe.subscriptions.update` with
//     proration, so the invoice always reflects the current seat count.
//   * Stripe subscription status → organizations.billing_status is reconciled by
//     the webhook (`syncOrgBillingFromStripe`), keyed on the customer's orgId
//     metadata. Stripe is the source of truth for billing_status.
//
// Never trusts client-supplied price ids or amounts — the price is looked up /
// created server-side from a fixed catalog, mirroring sasquatchPremiumService.

import { db } from "../db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import * as inst from "./institutionService";

// Per-seat monthly price. Discounted vs the $19/mo individual survivor plan to
// reflect institutional bulk provisioning. Change here only — the price is
// created once in Stripe and thereafter loaded by metadata.feature.
export const INSTITUTION_SEAT_PRICE_AMOUNT = 1200; // $12/seat/mo
export const INSTITUTION_SEAT_FEATURE = "institution_seat";

let cachedSeatPriceId: string | null = null;

async function loadExistingSeatPrice(): Promise<string | null> {
  const rows = await db.execute(sql`
    SELECT pr.id AS price_id
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND pr.recurring->>'interval' = 'month'
       AND p.metadata->>'feature' = ${INSTITUTION_SEAT_FEATURE}
     LIMIT 1
  `);
  const r = (rows.rows as any[])[0];
  return r ? String(r.price_id) : null;
}

// Ensure the per-seat product+price exists in Stripe; return the price id.
export async function ensureInstitutionSeatPrice(): Promise<string> {
  if (cachedSeatPriceId) return cachedSeatPriceId;
  const existing = await loadExistingSeatPrice();
  if (existing) {
    cachedSeatPriceId = existing;
    return cachedSeatPriceId;
  }
  const stripe = await getUncachableStripeClient();
  const product = await stripe.products.create({
    name: "Institutional Survivor Seats",
    description:
      "Per-seat monthly access to Stroke Recovery Academy for the survivors an organization provisions. Billed by seat count.",
    metadata: { feature: INSTITUTION_SEAT_FEATURE, platform: "stroke-recovery-academy" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: INSTITUTION_SEAT_PRICE_AMOUNT,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { feature: INSTITUTION_SEAT_FEATURE, interval: "month" },
  });
  cachedSeatPriceId = price.id;
  return cachedSeatPriceId;
}

// Create (or reuse) a Stripe customer for the org. Stores the id on the org and
// tags it with orgId metadata for webhook reconciliation.
export async function getOrCreateOrgStripeCustomer(orgId: number): Promise<string> {
  const org = await inst.getOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.stripeCustomerId) return org.stripeCustomerId;
  const stripe = await getUncachableStripeClient();
  const customer = await stripe.customers.create({
    name: org.name,
    email: org.contactEmail || undefined,
    metadata: { orgId: String(orgId), feature: INSTITUTION_SEAT_FEATURE },
  });
  await inst.updateOrganization(orgId, { stripeCustomerId: customer.id });
  return customer.id;
}

// Find the org's active seat subscription in Stripe (source of truth), falling
// back to a customer-scoped list filtered to our seat price. Never trusts a
// client-supplied subscription id.
async function findSeatSubscription(customerId: string, priceId: string): Promise<any | null> {
  const stripe = await getUncachableStripeClient();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  const live = subs.data.filter((s: any) =>
    ["active", "trialing", "past_due", "unpaid", "paused"].includes(s.status),
  );
  const match = (arr: any[]) =>
    arr.find((s: any) => (s.items?.data || []).some((it: any) => it.price?.id === priceId));
  return match(live) || match(subs.data) || null;
}

// Create a Checkout session for a NEW seat subscription (mode=subscription,
// quantity = seats). If an active subscription already exists, callers should
// route to the billing portal instead. metadata.orgId is stamped on both the
// session and the subscription so the webhook can reconcile.
export async function createSeatCheckoutSession(
  orgId: number,
  seats: number,
  baseUrl: string,
): Promise<{ url: string | null }> {
  const priceId = await ensureInstitutionSeatPrice();
  const customerId = await getOrCreateOrgStripeCustomer(orgId);
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: Math.max(1, seats) }],
    client_reference_id: `org:${orgId}`,
    subscription_data: {
      metadata: { orgId: String(orgId), feature: INSTITUTION_SEAT_FEATURE },
    },
    metadata: { orgId: String(orgId), feature: INSTITUTION_SEAT_FEATURE },
    success_url: `${baseUrl}/institution?billing=success`,
    cancel_url: `${baseUrl}/institution?billing=canceled`,
  });
  return { url: session.url };
}

// Sync the org's seat subscription quantity to `seats` (proration on). No-op if
// the org has no active seat subscription (nothing to bill yet). Returns the
// resulting quantity, or null if there was no subscription to update.
export async function syncSeatSubscriptionQuantity(
  orgId: number,
  seats: number,
): Promise<number | null> {
  const org = await inst.getOrganization(orgId);
  if (!org?.stripeCustomerId) return null;
  const priceId = await ensureInstitutionSeatPrice();
  const sub = await findSeatSubscription(org.stripeCustomerId, priceId);
  if (!sub) return null;
  const item = (sub.items?.data || []).find((it: any) => it.price?.id === priceId);
  if (!item) return null;
  const qty = Math.max(1, seats);
  if (item.quantity === qty) return qty;
  const stripe = await getUncachableStripeClient();
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, quantity: qty }],
    proration_behavior: "create_prorations",
  });
  return qty;
}

// Billing portal for invoices/receipts, payment method, and cancel.
export async function createOrgBillingPortal(
  orgId: number,
  returnUrl: string,
): Promise<{ url: string }> {
  const customerId = await getOrCreateOrgStripeCustomer(orgId);
  const stripe = await getUncachableStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

// Owner-facing billing snapshot: subscription state + recent invoices/receipts.
export async function getOrgBilling(orgId: number): Promise<any> {
  const org = await inst.getOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  const seatUsage = await inst.getSeatUsage(orgId);
  const perSeatCents = INSTITUTION_SEAT_PRICE_AMOUNT;

  if (!org.stripeCustomerId) {
    return {
      billingStatus: org.billingStatus,
      hasSubscription: false,
      seatLimit: org.seatLimit,
      seatsUsed: seatUsage.used,
      perSeatCents,
      subscription: null,
      invoices: [],
    };
  }

  const priceId = await ensureInstitutionSeatPrice();
  const stripe = await getUncachableStripeClient();
  const sub = await findSeatSubscription(org.stripeCustomerId, priceId);

  let subscription: any = null;
  if (sub) {
    const item = (sub.items?.data || []).find((it: any) => it.price?.id === priceId);
    const quantity = item?.quantity ?? 0;
    subscription = {
      id: sub.id,
      status: sub.status,
      quantity,
      perSeatCents,
      monthlyTotalCents: quantity * perSeatCents,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    };
  }

  let invoices: any[] = [];
  try {
    const list = await stripe.invoices.list({ customer: org.stripeCustomerId, limit: 12 });
    invoices = list.data.map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountDueCents: inv.amount_due,
      amountPaidCents: inv.amount_paid,
      currency: inv.currency,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }));
  } catch {
    invoices = [];
  }

  return {
    billingStatus: org.billingStatus,
    hasSubscription: !!subscription,
    seatLimit: org.seatLimit,
    seatsUsed: seatUsage.used,
    perSeatCents,
    subscription,
    invoices,
  };
}

// Map a Stripe subscription status → our organizations.billing_status enum.
function mapBillingStatus(stripeStatus: string): "none" | "active" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

// Webhook reconciliation: given a Stripe subscription object, if it's a seat
// subscription, sync the org's billing_status + stripe_subscription_id, and
// mirror the seat quantity into seat_limit (Stripe is source of truth once a
// subscription exists). Keyed on the customer's orgId metadata. Best-effort.
export async function syncOrgBillingFromStripe(subscription: any): Promise<void> {
  if (!subscription || typeof subscription !== "object") return;
  const items = subscription.items?.data || [];
  const isSeatSub =
    subscription.metadata?.feature === INSTITUTION_SEAT_FEATURE ||
    items.some((it: any) => it.price?.metadata?.feature === INSTITUTION_SEAT_FEATURE);
  if (!isSeatSub) return;

  // Resolve orgId: prefer subscription metadata, else the customer's metadata.
  let orgId = Number(subscription.metadata?.orgId);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!Number.isFinite(orgId) && customerId) {
    try {
      const stripe = await getUncachableStripeClient();
      const customer: any = await stripe.customers.retrieve(customerId);
      orgId = Number(customer?.metadata?.orgId);
    } catch {
      /* fall through */
    }
  }
  if (!Number.isFinite(orgId)) return;

  const billingStatus = mapBillingStatus(String(subscription.status || ""));
  const seatItem = items.find((it: any) => it.price?.metadata?.feature === INSTITUTION_SEAT_FEATURE) || items[0];
  const quantity = Number(seatItem?.quantity);

  const patch: any = {
    billingStatus,
    stripeSubscriptionId: subscription.status === "canceled" ? null : subscription.id,
  };
  if (customerId) patch.stripeCustomerId = customerId;
  // Mirror seat quantity into seat_limit while the subscription is billable.
  if (Number.isFinite(quantity) && quantity > 0 && billingStatus !== "canceled") {
    patch.seatLimit = quantity;
  }
  await inst.updateOrganization(orgId, patch);
}
