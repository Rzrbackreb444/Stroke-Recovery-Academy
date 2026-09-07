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
import { ensureCanonicalStripeCatalog } from "../stripeCatalog";

export const SASQUATCH_PREMIUM_PRICE_AMOUNT = 1900;        // $19/mo
export const SASQUATCH_PREMIUM_ANNUAL_AMOUNT = 19000;      // $190/yr (~17% off)
export const SASQUATCH_PREMIUM_FEATURE = "sasquatch_premium";

type CachedPrices = { monthlyPriceId: string; annualPriceId: string };
let cachedPrices: CachedPrices | null = null;

export async function ensureSasquatchPremiumProduct(): Promise<string> {
  const { monthlyPriceId } = await ensureSasquatchPremiumPrices();
  return monthlyPriceId;
}

export async function ensureSasquatchPremiumPrices(): Promise<CachedPrices> {
  if (cachedPrices) return cachedPrices;
  const catalog = await ensureCanonicalStripeCatalog();
  cachedPrices = catalog.sasquatchPremium;
  return cachedPrices;
}

export async function getSasquatchPremiumPriceIds(): Promise<CachedPrices | null> {
  if (cachedPrices) return cachedPrices;
  return ensureSasquatchPremiumPrices();
}

// Back-compat shim for any caller that just wants the monthly price.
export async function getSasquatchPremiumPriceId(): Promise<string | null> {
  const prices = await getSasquatchPremiumPriceIds();
  return prices?.monthlyPriceId ?? null;
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
  if (eligiblePriceIds.size === 0) return false;

  if (!opts.skipCache) {
    const cached = entitlementCache.get(stripeCustomerId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
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
