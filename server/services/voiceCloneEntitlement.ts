import { db } from "../db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

export const VOICE_CLONE_SUB_PRICE_AMOUNT = 900;
export const VOICE_CLONE_PER_CLONE_PRICE_AMOUNT = 500;
export const VOICE_CLONE_SUB_FEATURE = "voice_clone_subscription";
export const VOICE_CLONE_PURCHASE_FEATURE = "voice_clone_purchase";

let cachedPriceIds: { subscriptionPriceId: string; perClonePriceId: string } | null = null;

export async function ensureVoiceCloneStripeProducts(): Promise<{
  subscriptionPriceId: string;
  perClonePriceId: string;
}> {
  if (cachedPriceIds) return cachedPriceIds;

  const stripe = await getUncachableStripeClient();

  const existing = await db.execute(sql`
    SELECT pr.id as price_id, p.metadata->>'feature' as feature
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND p.metadata->>'feature' IN (${VOICE_CLONE_SUB_FEATURE}, ${VOICE_CLONE_PURCHASE_FEATURE})
  `);

  let subscriptionPriceId: string | undefined;
  let perClonePriceId: string | undefined;
  for (const row of existing.rows as any[]) {
    if (row.feature === VOICE_CLONE_SUB_FEATURE) subscriptionPriceId = row.price_id;
    if (row.feature === VOICE_CLONE_PURCHASE_FEATURE) perClonePriceId = row.price_id;
  }

  if (!subscriptionPriceId) {
    const product = await stripe.products.create({
      name: "Survivor Voice Cloning — Monthly Add-On",
      description:
        "Use cloned voices across Anthem builder, Recovery Anchor, Motivation Studio, and AI Coach replies. $9/mo. New clones billed separately at $5 each.",
      metadata: { feature: VOICE_CLONE_SUB_FEATURE, platform: "stroke-recovery-academy" },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: VOICE_CLONE_SUB_PRICE_AMOUNT,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { feature: VOICE_CLONE_SUB_FEATURE },
    });
    subscriptionPriceId = price.id;
  }

  if (!perClonePriceId) {
    const product = await stripe.products.create({
      name: "Survivor Voice Clone — Single Mint",
      description: "One additional cloned voice slot for your account ($5 per clone).",
      metadata: { feature: VOICE_CLONE_PURCHASE_FEATURE, platform: "stroke-recovery-academy" },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: VOICE_CLONE_PER_CLONE_PRICE_AMOUNT,
      currency: "usd",
      metadata: { feature: VOICE_CLONE_PURCHASE_FEATURE },
    });
    perClonePriceId = price.id;
  }

  cachedPriceIds = { subscriptionPriceId, perClonePriceId };
  return cachedPriceIds;
}

export async function getVoiceClonePriceIds(): Promise<{
  subscriptionPriceId: string | null;
  perClonePriceId: string | null;
}> {
  if (cachedPriceIds) return cachedPriceIds;
  const result = await db.execute(sql`
    SELECT pr.id as price_id, p.metadata->>'feature' as feature
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND p.metadata->>'feature' IN (${VOICE_CLONE_SUB_FEATURE}, ${VOICE_CLONE_PURCHASE_FEATURE})
  `);
  let subscriptionPriceId: string | null = null;
  let perClonePriceId: string | null = null;
  for (const row of result.rows as any[]) {
    if (row.feature === VOICE_CLONE_SUB_FEATURE) subscriptionPriceId = row.price_id;
    if (row.feature === VOICE_CLONE_PURCHASE_FEATURE) perClonePriceId = row.price_id;
  }
  if (subscriptionPriceId && perClonePriceId) {
    cachedPriceIds = { subscriptionPriceId, perClonePriceId };
  }
  return { subscriptionPriceId, perClonePriceId };
}

// Short-lived in-memory cache for entitlement reads. Money paths (checkout,
// mint) bypass via { skipCache: true } so we never trust a stale entitlement
// when the user is about to be charged or to consume a slot. Read-only paths
// (entitlement endpoint, preview gate) tolerate up to 60s of staleness in
// exchange for avoiding a Stripe API round-trip on every preview click.
const entitlementCache = new Map<string, { value: boolean; expiresAt: number }>();
const ENTITLEMENT_CACHE_MS = 60_000;

export function invalidateVoiceCloneEntitlement(stripeCustomerId: string | null) {
  if (stripeCustomerId) entitlementCache.delete(stripeCustomerId);
}

export async function hasActiveVoiceCloneSubscription(
  stripeCustomerId: string | null,
  opts: { skipCache?: boolean } = {},
): Promise<boolean> {
  if (!stripeCustomerId) return false;
  const { subscriptionPriceId } = await getVoiceClonePriceIds();
  if (!subscriptionPriceId) return false;

  if (!opts.skipCache) {
    const cached = entitlementCache.get(stripeCustomerId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
  }

  // Authoritative check via Stripe API — avoids any sync lag and respects
  // post-cancellation grace periods automatically (status='active' continues
  // until current_period_end even after cancel-at-period-end is set).
  let active = false;
  try {
    const stripe = await getUncachableStripeClient();
    for (const status of ["active", "trialing"] as const) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status,
        limit: 20,
      });
      for (const sub of subs.data) {
        for (const item of sub.items.data) {
          if (item.price?.id === subscriptionPriceId) {
            active = true;
            break;
          }
        }
        if (active) break;
      }
      if (active) break;
    }
  } catch (e: any) {
    console.error("[voice-clone-entitlement] stripe sub lookup failed", e?.message || e);
    // Don't cache failures — next call should retry against Stripe.
    return false;
  }
  entitlementCache.set(stripeCustomerId, {
    value: active,
    expiresAt: Date.now() + ENTITLEMENT_CACHE_MS,
  });
  return active;
}

export async function verifyVoiceClonePurchaseSession(
  stripeCustomerId: string,
  sessionId: string,
): Promise<{ ok: true } | { ok: false; reason: string; status: number }> {
  const { perClonePriceId } = await getVoiceClonePriceIds();
  if (!perClonePriceId) {
    return { ok: false, reason: "Voice clone catalog not configured", status: 503 };
  }

  let session;
  try {
    const stripe = await getUncachableStripeClient();
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });
  } catch (e: any) {
    return { ok: false, reason: "Could not verify purchase session", status: 400 };
  }

  if (session.customer !== stripeCustomerId) {
    return { ok: false, reason: "Purchase session does not belong to this account", status: 403 };
  }
  if (session.mode !== "payment") {
    return { ok: false, reason: "Wrong session mode", status: 400 };
  }
  if (session.payment_status !== "paid" || session.status !== "complete") {
    return { ok: false, reason: "Purchase not completed", status: 402 };
  }

  const items = (session as any).line_items?.data || [];
  const matched = items.some((li: any) => li?.price?.id === perClonePriceId);
  if (!matched) {
    return { ok: false, reason: "Purchase is not for a voice clone slot", status: 400 };
  }

  return { ok: true };
}
