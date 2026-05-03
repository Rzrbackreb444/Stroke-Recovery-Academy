// Sasquatch Premium — single $19/mo SKU bundling unlimited AI Coach +
// unlimited Recovery Anchor renders + Voice Cloning + premium Campfire rooms.
//
// Mirrors the voice-clone entitlement pattern (Stripe-direct, 60s cache) so
// we don't need a webhook fulfillment write to grant entitlement — the
// authoritative source is Stripe's subscription status. This avoids races
// with `stripe-replit-sync` lag and respects cancel-at-period-end grace
// periods automatically.
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { getUncachableStripeClient } from "../stripeClient";

export const SASQUATCH_PREMIUM_PRICE_AMOUNT = 1900;
export const SASQUATCH_PREMIUM_FEATURE = "sasquatch_premium";

let cachedPriceId: string | null = null;

export async function ensureSasquatchPremiumProduct(): Promise<string> {
  if (cachedPriceId) return cachedPriceId;

  const existing = await db.execute(sql`
    SELECT pr.id as price_id
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND p.metadata->>'feature' = ${SASQUATCH_PREMIUM_FEATURE}
     LIMIT 1
  `);
  const row = (existing.rows as any[])[0];
  if (row?.price_id) {
    cachedPriceId = String(row.price_id);
    return cachedPriceId;
  }

  const stripe = await getUncachableStripeClient();
  const product = await stripe.products.create({
    name: "Sasquatch Premium — Unlimited Survivor Tools",
    description:
      "Unlimited AI Sasquatch Coach. Unlimited Recovery Anchor renders. Voice Cloning included. Premium Campfire circles (Coach Circle, Live with Nick). $19/mo.",
    metadata: { feature: SASQUATCH_PREMIUM_FEATURE, platform: "stroke-recovery-academy" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: SASQUATCH_PREMIUM_PRICE_AMOUNT,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { feature: SASQUATCH_PREMIUM_FEATURE },
  });
  cachedPriceId = price.id;
  return cachedPriceId;
}

export async function getSasquatchPremiumPriceId(): Promise<string | null> {
  if (cachedPriceId) return cachedPriceId;
  const existing = await db.execute(sql`
    SELECT pr.id as price_id
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
     WHERE p.active = true
       AND pr.active = true
       AND p.metadata->>'feature' = ${SASQUATCH_PREMIUM_FEATURE}
     LIMIT 1
  `);
  const row = (existing.rows as any[])[0];
  if (row?.price_id) {
    cachedPriceId = String(row.price_id);
    return cachedPriceId;
  }
  return null;
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
  const priceId = await getSasquatchPremiumPriceId();
  if (!priceId) return false;

  if (!opts.skipCache) {
    const cached = entitlementCache.get(stripeCustomerId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
  }

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
          if (item.price?.id === priceId) {
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
  entitlementCache.set(stripeCustomerId, {
    value: active,
    expiresAt: Date.now() + ENTITLEMENT_CACHE_MS,
  });
  return active;
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
