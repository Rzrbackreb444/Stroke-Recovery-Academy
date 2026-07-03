import type { Express, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { isAuthenticated } from "./replitAuth";
import { getUserId } from "./lib/authUtils";
import { stripeService } from "./stripeService";
import {
  SASQUATCH_PREMIUM_PRICE_AMOUNT,
  SASQUATCH_PREMIUM_ANNUAL_AMOUNT,
  ensureSasquatchPremiumPrices,
  hasActiveSasquatchPremium,
  invalidateSasquatchPremium,
} from "./services/sasquatchPremiumService";
import {
  recordFunnelEvent,
  isValidFunnelEvent,
  isValidFunnelPlan,
  getFunnelSummary,
} from "./services/sasquatchFunnelService";
import { requireAdmin } from "./middleware/requireAdmin";
import { publicPostLimiter, paymentCheckoutLimiter, billingPortalLimiter } from "./middleware/publicRateLimit";

// 7-day free trial for first-time subscribers. Survivors get the full premium
// surface (unlimited Coach, unlimited Anchor renders, voice cloning, premium
// Campfire fires) for a week before the first $19 charge — removes the
// cold-start objection. Stripe enforces "one trial per customer" by default
// via the customer record, so re-subscribing after a cancel won't re-trial
// (Stripe returns a session without the trial). Anyone who wants to abuse
// this would need a fresh email + fresh Stripe customer.
const SASQUATCH_PREMIUM_TRIAL_DAYS = 7;

async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const email = u.email || `${userId}@no-email.local`;
  const customer = await stripeService.createCustomer(email, userId);
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));
  return customer.id;
}

export function registerSasquatchPremiumRoutes(app: Express) {
  // GET /api/sasquatch-premium/status — UI gate. Returns both monthly +
  // annual prices so the landing page can render a Monthly/Annual toggle
  // without a second roundtrip.
  app.get("/api/sasquatch-premium/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const customerId = u?.stripeCustomerId || null;
      const active = await hasActiveSasquatchPremium(customerId);
      res.json({
        active,
        priceCents: SASQUATCH_PREMIUM_PRICE_AMOUNT,
        priceUsd: SASQUATCH_PREMIUM_PRICE_AMOUNT / 100,
        annualCents: SASQUATCH_PREMIUM_ANNUAL_AMOUNT,
        annualUsd: SASQUATCH_PREMIUM_ANNUAL_AMOUNT / 100,
        annualMonthlyEquivalentUsd:
          Math.round((SASQUATCH_PREMIUM_ANNUAL_AMOUNT / 12) / 100 * 100) / 100,
        annualSavingsUsd:
          (SASQUATCH_PREMIUM_PRICE_AMOUNT * 12 - SASQUATCH_PREMIUM_ANNUAL_AMOUNT) / 100,
        trialDays: SASQUATCH_PREMIUM_TRIAL_DAYS,
      });
    } catch (err: any) {
      console.error("[sasquatch-premium] status failed", err?.message || err);
      res.status(500).json({ message: "Status lookup failed" });
    }
  });

  // POST /api/sasquatch-premium/checkout — create recurring checkout session.
  // Body: { plan?: 'monthly' | 'annual' } (default 'monthly'). Lazy-creates
  // BOTH Stripe prices on first call; subsequent calls hit the cache.
  app.post("/api/sasquatch-premium/checkout", isAuthenticated, paymentCheckoutLimiter, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const requestedPlan = req.body?.plan === "annual" ? "annual" : "monthly";
      // Promo code (Wave H). Optional, format-validated: only alphanumeric,
      // dash, and underscore allowed (matches all real Stripe promo code
      // formats). Length-capped at 64. Empty string → no code.
      const rawPromo = String(req.body?.promoCode ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 64);
      const promotionCode = rawPromo.length > 0 ? rawPromo : undefined;

      // Double-subscription guard — if the user already has an active
      // subscription, redirect them to the billing portal instead of creating
      // a new Stripe session. Prevents duplicate subscriptions.
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const existingCustomerId = u?.stripeCustomerId || null;
      if (existingCustomerId) {
        const alreadyActive = await hasActiveSasquatchPremium(existingCustomerId);
        if (alreadyActive) {
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          try {
            const portalSession = await stripeService.createCustomerPortalSession(
              existingCustomerId,
              `${baseUrl}/recovery/premium`,
            );
            return res.json({ url: portalSession.url, alreadyActive: true });
          } catch {
            return res.json({ alreadyActive: true });
          }
        }
      }

      let prices: { monthlyPriceId: string; annualPriceId: string };
      try {
        prices = await ensureSasquatchPremiumPrices();
      } catch (e: any) {
        console.error("[sasquatch-premium] product setup failed", e?.message || e);
        return res.status(503).json({ message: "Stripe billing not configured" });
      }
      const priceId =
        requestedPlan === "annual" ? prices.annualPriceId : prices.monthlyPriceId;

      const customerId = await getOrCreateStripeCustomer(userId);
      if (!customerId) return res.status(404).json({ message: "User not found" });

      // Money path → bypass cache + invalidate so stale "not active" reads
      // don't block a returning subscriber from re-subscribing after cancel.
      invalidateSasquatchPremium(customerId);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/recovery/premium?subscribed=1&plan=${requestedPlan}`,
        `${baseUrl}/recovery/premium?canceled=1`,
        "subscription",
        {
          trialDays: SASQUATCH_PREMIUM_TRIAL_DAYS,
          // Always allow the survivor to type a code on the Stripe page —
          // unless they're pre-applying one we already validated server-side.
          allowPromotionCodes: true,
          promotionCode,
        },
      );

      // Funnel: server-side record (more reliable than client-side because the
      // browser is about to hard-navigate to Stripe). Best-effort, swallowed.
      void recordFunnelEvent({
        userId,
        eventType: "checkout_click",
        plan: requestedPlan,
      });

      res.json({ url: session.url, plan: requestedPlan });
    } catch (err: any) {
      console.error("[sasquatch-premium] checkout failed", err?.message || err);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  // POST /api/sasquatch-premium/portal — Stripe customer portal for cancel /
  // payment-method update. Also invalidates entitlement cache so post-cancel
  // status flips quickly when the user returns.
  app.post("/api/sasquatch-premium/portal", isAuthenticated, billingPortalLimiter, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!u?.stripeCustomerId) {
        return res.status(404).json({ message: "No Stripe customer on file" });
      }
      invalidateSasquatchPremium(u.stripeCustomerId);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCustomerPortalSession(
        u.stripeCustomerId,
        `${baseUrl}/recovery/premium`,
      );
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[sasquatch-premium] portal failed", err?.message || err);
      res.status(500).json({ message: "Portal session failed" });
    }
  });

  // POST /api/sasquatch-premium/track — funnel telemetry. Body:
  //   { event: 'premium_page_view' | 'trial_start', plan?: 'monthly' | 'annual' }
  // checkout_click is recorded server-side from the /checkout endpoint; this
  // route handles the events that only the client knows about (page mount +
  // post-redirect ?subscribed=1). Auth-optional so anonymous page views still
  // count toward top of funnel. Always returns 204 to avoid leaking shape.
  app.post("/api/sasquatch-premium/track", publicPostLimiter, async (req: any, res: Response) => {
    try {
      const eventRaw = String(req.body?.event ?? "");
      const planRaw = String(req.body?.plan ?? "unknown");
      if (!isValidFunnelEvent(eventRaw)) return res.status(204).end();
      // checkout_click is recorded server-side only — refuse client posts
      // for it so we don't double-count or accept spoofed conversions.
      if (eventRaw === "checkout_click") return res.status(204).end();
      const plan = isValidFunnelPlan(planRaw) ? planRaw : "unknown";
      const userId = getUserId(req) || null;
      await recordFunnelEvent({ userId, eventType: eventRaw, plan });
      res.status(204).end();
    } catch (err: any) {
      console.warn("[sasquatch-premium] track failed", err?.message || err);
      res.status(204).end();
    }
  });

  // GET /api/sasquatch-premium/funnel — admin diagnostic. Counts by event +
  // plan for the last N days (default 30). Rendered server-side as JSON so
  // we can reach it from a curl/admin script without building a UI yet.
  app.get(
    "/api/sasquatch-premium/funnel",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      try {
        const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
        const summary = await getFunnelSummary(days);
        res.json({ days, summary });
      } catch (err: any) {
        console.error("[sasquatch-premium] funnel failed", err?.message || err);
        res.status(500).json({ message: "Funnel lookup failed" });
      }
    },
  );
}
