// Sasquatch Premium — single SKU, two billing intervals (monthly $19, annual
// $190 = ~17% discount vs $19×12=$228). Bundle: unlimited AI Coach + unlimited
// Recovery Anchor renders + Voice Cloning + premium Campfire rooms.
//
// Mirrors the voice-clone entitlement pattern (Stripe-direct, 60s cache) so
// we don't need a webhook fulfillment write to grant entitlement — the
// authoritative source is Stripe's subscription status. This avoids races
// with `stripe-replit-sync` lag and respects cancel-at-period-end grace
// periods automatically. The two prices live under the SAME Stripe product
// (different metadata.interval), so `hasActiveSasquatchPremium` accepts
// either — a user on annual gets the same entitlements as a user on monthly.
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { getUncachableStripeClient } from "../stripeClient";

import { FOUNDER_MONTHLY_CENTS } from "@shared/survivorOffer";

export const SASQUATCH_PREMIUM_PRICE_AMOUNT = 1900;        // $19/mo
export const SASQUATCH_PREMIUM_ANNUAL_AMOUNT = 19000;      // $190/yr (~17% off)
export const SASQUATCH_PREMIUM_FEATURE = "sasquatch_premium";

// ── Founder's Circle (high-touch anchor tier) ───────────────────────────────
// A SEPARATE Stripe product (not another price under the premium product) so
// the interval-based price mapping in loadExistingPrices() can't collide with
// the premium monthly price. Founder is a strict SUPERSET of premium: an
// active Founder subscription grants premium entitlement everywhere via the
// eligiblePriceIds union in hasActiveSasquatchPremium().
export const SASQUATCH_FOUNDER_PRICE_AMOUNT = FOUNDER_MONTHLY_CENTS; // $49/mo
export const SASQUATCH_FOUNDER_FEATURE = "sasquatch_founder";

let cachedFounderPriceId: string | null = null;

async function loadExistingFounderPrice(): Promise<string | null> {
  const rows = await db.execute(sql`
    SELECT pr.id as price_id
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND pr.recurring->>'interval' = 'month'
       AND p.metadata->>'feature' = ${SASQUATCH_FOUNDER_FEATURE}
     LIMIT 1
  `);
  const r = (rows.rows as any[])[0];
  return r ? String(r.price_id) : null;
}

export async function ensureSasquatchFounderPrice(): Promise<string> {
  if (cachedFounderPriceId) return cachedFounderPriceId;
  const existing = await loadExistingFounderPrice();
  if (existing) {
    cachedFounderPriceId = existing;
    return cachedFounderPriceId;
  }
  const stripe = await getUncachableStripeClient();
  const product = await stripe.products.create({
    name: "Sasquatch Founder's Circle — High-Touch Recovery",
    description:
      "Everything in Sasquatch Premium, plus a small Founder's Circle: direct line to Nick, priority in Live-with-Nick fires, and first access to new survivor tools.",
    metadata: { feature: SASQUATCH_FOUNDER_FEATURE, platform: "stroke-recovery-academy" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: SASQUATCH_FOUNDER_PRICE_AMOUNT,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { feature: SASQUATCH_FOUNDER_FEATURE, interval: "month" },
  });
  cachedFounderPriceId = price.id;
  return cachedFounderPriceId;
}

export async function getSasquatchFounderPriceId(): Promise<string | null> {
  if (cachedFounderPriceId) return cachedFounderPriceId;
  const existing = await loadExistingFounderPrice();
  if (existing) cachedFounderPriceId = existing;
  return cachedFounderPriceId;
}

type CachedPrices = { monthlyPriceId: string; annualPriceId: string };
let cachedPrices: CachedPrices | null = null;

async function loadExistingPrices(): Promise<{
  productId: string | null;
  monthlyPriceId: string | null;
  annualPriceId: string | null;
}> {
  const rows = await db.execute(sql`
    SELECT pr.id as price_id, pr.product as product_id,
           pr.recurring->>'interval' as interval,
           pr.metadata->>'interval' as meta_interval
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND p.metadata->>'feature' = ${SASQUATCH_PREMIUM_FEATURE}
  `);
  let productId: string | null = null;
  let monthlyPriceId: string | null = null;
  let annualPriceId: string | null = null;
  for (const r of rows.rows as any[]) {
    productId = String(r.product_id);
    const interval = r.interval || r.meta_interval;
    if (interval === "month") monthlyPriceId = String(r.price_id);
    else if (interval === "year") annualPriceId = String(r.price_id);
  }
  return { productId, monthlyPriceId, annualPriceId };
}

export async function ensureSasquatchPremiumProduct(): Promise<string> {
  const { monthlyPriceId } = await ensureSasquatchPremiumPrices();
  return monthlyPriceId;
}

export async function ensureSasquatchPremiumPrices(): Promise<CachedPrices> {
  if (cachedPrices) return cachedPrices;

  const existing = await loadExistingPrices();
  let productId = existing.productId;
  let monthlyPriceId = existing.monthlyPriceId;
  let annualPriceId = existing.annualPriceId;

  if (productId && monthlyPriceId && annualPriceId) {
    cachedPrices = { monthlyPriceId, annualPriceId };
    return cachedPrices;
  }

  const stripe = await getUncachableStripeClient();

  if (!productId) {
    const product = await stripe.products.create({
      name: "Sasquatch Premium — Unlimited Survivor Tools",
      description:
        "Unlimited AI Sasquatch Coach. Unlimited Recovery Anchor renders. Voice Cloning included. Premium Campfire circles (Coach Circle, Live with Nick).",
      metadata: { feature: SASQUATCH_PREMIUM_FEATURE, platform: "stroke-recovery-academy" },
    });
    productId = product.id;
  }

  if (!monthlyPriceId) {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: SASQUATCH_PREMIUM_PRICE_AMOUNT,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { feature: SASQUATCH_PREMIUM_FEATURE, interval: "month" },
    });
    monthlyPriceId = price.id;
  }

  if (!annualPriceId) {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: SASQUATCH_PREMIUM_ANNUAL_AMOUNT,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { feature: SASQUATCH_PREMIUM_FEATURE, interval: "year" },
    });
    annualPriceId = price.id;
  }

  cachedPrices = { monthlyPriceId, annualPriceId };
  return cachedPrices;
}

export async function getSasquatchPremiumPriceIds(): Promise<CachedPrices | null> {
  if (cachedPrices) return cachedPrices;
  const existing = await loadExistingPrices();
  if (existing.monthlyPriceId && existing.annualPriceId) {
    cachedPrices = {
      monthlyPriceId: existing.monthlyPriceId,
      annualPriceId: existing.annualPriceId,
    };
    return cachedPrices;
  }
  // Partial / legacy state — return monthly if that's all that exists so
  // entitlement checks still work, but signal incompleteness with null.
  return null;
}

// Back-compat shim for any caller that just wants the monthly price.
export async function getSasquatchPremiumPriceId(): Promise<string | null> {
  const prices = await getSasquatchPremiumPriceIds();
  if (prices) return prices.monthlyPriceId;
  const existing = await loadExistingPrices();
  return existing.monthlyPriceId;
}

// Short-lived in-memory cache. Money paths bypass via { skipCache: true }.
const entitlementCache = new Map<string, { value: boolean; expiresAt: number }>();
const ENTITLEMENT_CACHE_MS = 60_000;

export function invalidateSasquatchPremium(stripeCustomerId: string | null) {
  if (stripeCustomerId) entitlementCache.delete(stripeCustomerId);
}

export async function hasActiveSasquatchPremium(
  stripeCustomerId: string | null,
  opts: { skipCache?: boolean } = {},
): Promise<boolean> {
  if (!stripeCustomerId) return false;

  // Accept entitlement on EITHER price (monthly or annual). Falls back to
  // monthly-only if annual hasn't been provisioned yet (legacy state).
  const prices = await getSasquatchPremiumPriceIds();
  const eligiblePriceIds = new Set<string>();
  if (prices) {
    eligiblePriceIds.add(prices.monthlyPriceId);
    eligiblePriceIds.add(prices.annualPriceId);
  } else {
    const monthlyOnly = await getSasquatchPremiumPriceId();
    if (monthlyOnly) eligiblePriceIds.add(monthlyOnly);
  }
  // Founder ⊇ Premium — an active Founder subscription grants premium
  // entitlement. Additive + guarded: a founder-price lookup failure never
  // removes the premium price ids, so this can only ever widen access.
  try {
    const founderId = await getSasquatchFounderPriceId();
    if (founderId) eligiblePriceIds.add(founderId);
  } catch {
    /* founder is optional — never let it break the premium gate */
  }
  if (eligiblePriceIds.size === 0) return false;

  if (!opts.skipCache) {
    const cached = entitlementCache.get(stripeCustomerId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
  }

  // ── Durable lifecycle state (Task #3) ──────────────────────────────────
  // If a `sasquatch_premium_subscriptions` row exists for this customer it is
  // authoritative — it encodes grace periods on failed payments + explicit
  // downgrades that the raw `stripe.subscriptions` status can't express. No
  // row (or the table not yet provisioned) → fall through to the Stripe DB /
  // API path below (preserves fresh-checkout lag handling + legacy subs).
  // Entitlement logic is inlined here (rather than importing the lifecycle
  // service) to avoid a circular import.
  try {
    const st = await db.execute(sql`
      SELECT status, grace_period_end, downgraded_at
        FROM sasquatch_premium_subscriptions
       WHERE stripe_customer_id = ${stripeCustomerId}
       ORDER BY updated_at DESC LIMIT 1
    `);
    const row = (st.rows as any[])[0];
    if (row) {
      const status = String(row.status);
      let entitled: boolean;
      if (status === "active" || status === "trialing") {
        entitled = true;
      } else if ((status === "past_due" || status === "unpaid") && !row.downgraded_at) {
        const grace = row.grace_period_end ? Date.parse(String(row.grace_period_end)) : 0;
        entitled = grace > Date.now();
      } else {
        entitled = false; // canceled / paused / incomplete / downgraded
      }
      // Founder override: the lifecycle table only tracks PREMIUM subs
      // (syncPremiumSubFromStripe skips founder-price subscriptions), so a
      // stale/canceled premium row must never mask a live Founder sub — e.g.
      // a survivor who upgraded premium→Founder and then canceled the old
      // premium. Only runs when the row would deny, so the happy path stays
      // one DB read.
      if (!entitled) {
        try {
          if (await hasActiveSasquatchFounder(stripeCustomerId)) entitled = true;
        } catch {
          /* founder check is additive-only — never break the gate */
        }
      }
      entitlementCache.set(stripeCustomerId, {
        value: entitled,
        expiresAt: Date.now() + ENTITLEMENT_CACHE_MS,
      });
      return entitled;
    }
  } catch (e: any) {
    // Table may not exist yet, or a transient DB hiccup — fall through to the
    // Stripe-backed path so the gate degrades safely.
    console.warn(
      "[sasquatch-premium] lifecycle state lookup skipped:",
      e?.message || e,
    );
  }

  // ── Webhook-backed entitlement (Wave I) ────────────────────────────────
  // The `stripe-replit-sync` integration mirrors all Stripe state into the
  // `stripe.*` Postgres schema in near-realtime. Querying that locally is
  // ~1ms vs ~150ms for the Stripe REST API and costs nothing. We only fall
  // back to Stripe API if the DB lookup returns false — handles the 1-2s
  // lag window after a fresh checkout where the survivor's brand-new sub
  // hasn't sync'd yet (rare but real). On any DB error we ALSO fall back
  // to Stripe so the entitlement gate degrades safely.
  const eligibleArr = Array.from(eligiblePriceIds);
  let active = false;
  let dbFallbackNeeded = false;
  try {
    const r = await db.execute(sql`
      SELECT 1
        FROM stripe.subscriptions s
        JOIN stripe.subscription_items si ON si.subscription = s.id
       WHERE s.customer = ${stripeCustomerId}
         AND s.status IN ('active', 'trialing')
         AND si.price = ANY(${eligibleArr}::text[])
       LIMIT 1
    `);
    active = (r.rows?.length ?? 0) > 0;
    if (!active) dbFallbackNeeded = true; // only call Stripe when we'd otherwise deny
  } catch (e: any) {
    console.warn(
      "[sasquatch-premium] local entitlement lookup failed, falling back to Stripe:",
      e?.message || e,
    );
    dbFallbackNeeded = true;
  }

  if (!active && dbFallbackNeeded) {
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
            if (item.price?.id && eligiblePriceIds.has(item.price.id)) {
              active = true;
              break;
            }
          }
          if (active) break;
        }
        if (active) break;
      }
    } catch (e: any) {
      console.error("[sasquatch-premium] stripe sub lookup failed", e?.message || e);
      return false;
    }
  }

  entitlementCache.set(stripeCustomerId, {
    value: active,
    expiresAt: Date.now() + ENTITLEMENT_CACHE_MS,
  });
  return active;
}

// Founder-specific active check. Unlike hasActiveSasquatchPremium (which is
// satisfied by EITHER premium or founder), this only returns true when the
// customer has an active/trialing subscription on the FOUNDER price. Used by
// the checkout route to route already-Founder members to the billing portal
// instead of minting a duplicate Founder subscription (double-charge guard).
// Degrades to `false` on any missing-price / DB / Stripe failure so it can
// only ever block a duplicate, never wrongly deny a first-time checkout.
export async function hasActiveSasquatchFounder(
  stripeCustomerId: string | null,
): Promise<boolean> {
  if (!stripeCustomerId) return false;
  let founderId: string | null = null;
  try {
    founderId = await getSasquatchFounderPriceId();
  } catch {
    return false;
  }
  if (!founderId) return false;

  // Prefer the locally-mirrored stripe schema (~1ms); fall back to the Stripe
  // API only when the local lookup denies (handles fresh-checkout sync lag).
  try {
    const r = await db.execute(sql`
      SELECT 1
        FROM stripe.subscriptions s
        JOIN stripe.subscription_items si ON si.subscription = s.id
       WHERE s.customer = ${stripeCustomerId}
         AND s.status IN ('active', 'trialing')
         AND si.price = ${founderId}
       LIMIT 1
    `);
    if ((r.rows?.length ?? 0) > 0) return true;
  } catch (e: any) {
    console.warn(
      "[sasquatch-premium] local founder lookup failed, falling back to Stripe:",
      e?.message || e,
    );
  }

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
          if (item.price?.id === founderId) return true;
        }
      }
    }
  } catch (e: any) {
    console.error("[sasquatch-premium] founder stripe lookup failed", e?.message || e);
    return false;
  }
  return false;
}

// Resolve the customer's Founder subscription object from Stripe (live
// statuses preferred, newest-first fallback). Used by the cancel flow so a
// Founder-only member can self-serve cancel in-app instead of being told
// "nothing to cancel". Returns null on any missing-price / Stripe failure.
export async function resolveFounderStripeSubscription(
  stripeCustomerId: string | null,
): Promise<any | null> {
  if (!stripeCustomerId) return null;
  let founderId: string | null = null;
  try {
    founderId = await getSasquatchFounderPriceId();
  } catch {
    return null;
  }
  if (!founderId) return null;
  try {
    const stripe = await getUncachableStripeClient();
    const list = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 20,
    });
    const LIVE = new Set(["active", "trialing", "past_due", "unpaid", "paused"]);
    let fallback: any | null = null;
    for (const sub of list.data) {
      const isFounder = (sub.items?.data ?? []).some(
        (it: any) => it?.price?.id === founderId,
      );
      if (!isFounder) continue;
      if (LIVE.has(String(sub.status))) return sub;
      if (!fallback) fallback = sub;
    }
    return fallback;
  } catch (e: any) {
    console.warn(
      "[sasquatch-premium] founder sub resolve failed:",
      e?.message || e,
    );
    return null;
  }
}

// Convenience: load user → customerId → entitlement check. Used by the
// Recovery Anchor isPremium() bundle, the Coach daily-cap gate, and the
// Campfire premium-room gate. Returns false (not throws) on any DB / Stripe
// failure so a downstream outage degrades to "free tier" rather than 500.
export async function isSasquatchPremium(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const [u] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return await hasActiveSasquatchPremium(u?.stripeCustomerId || null);
  } catch (e: any) {
    console.warn("[sasquatch-premium] isSasquatchPremium failed:", e?.message || e);
    return false;
  }
}
