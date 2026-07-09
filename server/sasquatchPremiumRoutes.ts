import type { Express, Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { isAuthenticated } from "./replitAuth";
import { getUserId } from "./lib/authUtils";
import { stripeService } from "./stripeService";
import { getUncachableStripeClient } from "./stripeClient";
import {
  SASQUATCH_PREMIUM_PRICE_AMOUNT,
  SASQUATCH_PREMIUM_ANNUAL_AMOUNT,
  SASQUATCH_FOUNDER_PRICE_AMOUNT,
  ensureSasquatchPremiumPrices,
  ensureSasquatchFounderPrice,
  hasActiveSasquatchPremium,
  hasActiveSasquatchFounder,
  invalidateSasquatchPremium,
  resolveFounderStripeSubscription,
} from "./services/sasquatchPremiumService";
import {
  recordFunnelEvent,
  isValidFunnelEvent,
  isValidFunnelPlan,
  getFunnelSummary,
} from "./services/sasquatchFunnelService";
import {
  getSubStateByUserId,
  resolvePremiumStripeSubscription,
  syncPremiumSubFromStripe,
} from "./services/subscriptionLifecycleService";
import {
  FEEDBACK_MAX,
  isValidCancelReason,
  eligibleOffers,
  describeOffers,
  couponKindForPlan,
  ensureRetentionCoupon,
  recordRetentionEvent,
  hasAcceptedSaveOffer,
  PAUSE_DAYS,
  type SaveOffer,
} from "./services/retentionService";
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

// Resolve the survivor's premium subscription context for the cancel/retention
// flow. Prefers the durable state row's stripe_subscription_id; falls back to a
// Stripe list+filter (a customer may hold subscriptions for other products).
// Never trusts the client for the subscription id or customer id.
async function resolvePremiumContext(userId: string): Promise<{
  customerId: string | null;
  subId: string | null;
  state: Awaited<ReturnType<typeof getSubStateByUserId>>;
}> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const customerId = u?.stripeCustomerId || null;
  let state = await getSubStateByUserId(userId);
  let subId = state?.stripe_subscription_id || null;
  if (!subId && customerId) {
    const sub = await resolvePremiumStripeSubscription(customerId);
    subId = sub?.id || null;
    // Webhook-miss recovery: a live premium sub exists in Stripe but the
    // durable state row never landed. Backfill it so cancel/context (and the
    // offer/cancel/resume endpoints) see real status/plan/period fields
    // instead of treating the survivor as having no subscription.
    if (sub && !state) {
      try {
        await syncPremiumSubFromStripe(sub);
        state = await getSubStateByUserId(userId);
      } catch (e: any) {
        console.warn("[sasquatch-premium] context state backfill failed", e?.message || e);
      }
    }
  }
  // Founder webhook-miss backstop: Founder subs DO flow through the durable
  // lifecycle now (`syncPremiumSubFromStripe` recognizes the founder price and
  // writes a plan:"founder" row), so a Founder-only member is normally served
  // by the durable-row read above. This branch only fires when the founder
  // webhook never landed — resolve the Founder sub from Stripe, backfill the
  // durable row so subsequent cancel/resume/status reads hit the DB (no more
  // live-listing), then re-read. plan:"founder" also keys offer suppression.
  if (!subId && customerId) {
    const fSub = await resolveFounderStripeSubscription(customerId);
    if (fSub?.id) {
      subId = String(fSub.id);
      try {
        await syncPremiumSubFromStripe(fSub);
        const backfilled = await getSubStateByUserId(userId);
        if (backfilled) state = backfilled;
      } catch (e: any) {
        console.warn("[sasquatch-premium] founder context state backfill failed", e?.message || e);
      }
      // Defensive synthesis if the backfill couldn't persist a row (e.g. the
      // customer isn't yet linked to a user for the resolveUserId lookup).
      if (!state) {
        const unixToIso = (v: any): string | null =>
          typeof v === "number" && Number.isFinite(v) && v > 0
            ? new Date(v * 1000).toISOString()
            : null;
        state = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          status: String(fSub.status || "active"),
          plan: "founder",
          current_period_end: unixToIso(
            fSub.current_period_end ?? fSub.items?.data?.[0]?.current_period_end,
          ),
          trial_end: unixToIso(fSub.trial_end),
          cancel_at_period_end: !!fSub.cancel_at_period_end,
          payment_state: "ok",
          last_payment_failed_at: null,
          dunning_attempts: 0,
          grace_period_end: null,
          last_recovered_at: null,
          downgraded_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as NonNullable<Awaited<ReturnType<typeof getSubStateByUserId>>>;
      }
    }
  }
  return { customerId, subId, state };
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
      // Founder-specific flag so the client can show "Manage billing" (not
      // "Join") to an existing Founder, while still offering premium→founder
      // upgrades to premium-only subscribers (founderActive === false).
      const founderActive = active
        ? await hasActiveSasquatchFounder(customerId)
        : false;

      // Lifecycle state (Task #3) — lets the client render trial / past-due /
      // grace banners. Best-effort: a missing row or DB hiccup just omits the
      // extra fields, never fails the status call.
      let lifecycle: {
        status: string;
        plan: string;
        currentPeriodEnd: string | null;
        trialEnd: string | null;
        cancelAtPeriodEnd: boolean;
        pastDue: boolean;
        graceEnd: string | null;
        downgraded: boolean;
      } | null = null;
      try {
        const { getSubStateByUserId } = await import("./services/subscriptionLifecycleService");
        const st = await getSubStateByUserId(userId);
        if (st) {
          lifecycle = {
            status: st.status,
            plan: st.plan,
            currentPeriodEnd: st.current_period_end,
            trialEnd: st.trial_end,
            cancelAtPeriodEnd: st.cancel_at_period_end,
            pastDue: st.payment_state === "failed" && !st.downgraded_at,
            graceEnd: st.grace_period_end,
            downgraded: !!st.downgraded_at,
          };
        }
      } catch (e: any) {
        console.warn("[sasquatch-premium] status lifecycle lookup failed", e?.message || e);
      }

      res.json({
        active,
        founderActive,
        priceCents: SASQUATCH_PREMIUM_PRICE_AMOUNT,
        priceUsd: SASQUATCH_PREMIUM_PRICE_AMOUNT / 100,
        annualCents: SASQUATCH_PREMIUM_ANNUAL_AMOUNT,
        annualUsd: SASQUATCH_PREMIUM_ANNUAL_AMOUNT / 100,
        annualMonthlyEquivalentUsd:
          Math.round((SASQUATCH_PREMIUM_ANNUAL_AMOUNT / 12) / 100 * 100) / 100,
        annualSavingsUsd:
          (SASQUATCH_PREMIUM_PRICE_AMOUNT * 12 - SASQUATCH_PREMIUM_ANNUAL_AMOUNT) / 100,
        founderCents: SASQUATCH_FOUNDER_PRICE_AMOUNT,
        founderUsd: SASQUATCH_FOUNDER_PRICE_AMOUNT / 100,
        trialDays: SASQUATCH_PREMIUM_TRIAL_DAYS,
        lifecycle,
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

      const requestedTier = req.body?.tier === "founder" ? "founder" : "premium";
      const requestedPlan =
        requestedTier === "founder"
          ? "monthly"
          : req.body?.plan === "annual"
            ? "annual"
            : "monthly";
      // Promo code (Wave H). Optional, format-validated: only alphanumeric,
      // dash, and underscore allowed (matches all real Stripe promo code
      // formats). Length-capped at 64. Empty string → no code.
      const rawPromo = String(req.body?.promoCode ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 64);
      const promotionCode = rawPromo.length > 0 ? rawPromo : undefined;

      // Double-subscription guard. For premium: block if the customer already
      // has ANY active Sasquatch entitlement (premium OR founder). For founder:
      // block only if they already hold an active FOUNDER sub (a premium
      // subscriber upgrading to Founder is intentionally allowed to proceed —
      // Founder is a separate product; they cancel the old premium from the
      // portal). Either way, an already-subscribed customer is routed to the
      // billing portal instead of minting a duplicate, double-charging sub.
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const existingCustomerId = u?.stripeCustomerId || null;
      if (existingCustomerId) {
        const alreadyActive =
          requestedTier === "founder"
            ? await hasActiveSasquatchFounder(existingCustomerId)
            : await hasActiveSasquatchPremium(existingCustomerId);
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

      let priceId: string;
      try {
        if (requestedTier === "founder") {
          priceId = await ensureSasquatchFounderPrice();
        } else {
          const prices = await ensureSasquatchPremiumPrices();
          priceId =
            requestedPlan === "annual" ? prices.annualPriceId : prices.monthlyPriceId;
        }
      } catch (e: any) {
        console.error("[sasquatch-premium] product setup failed", e?.message || e);
        return res.status(503).json({ message: "Stripe billing not configured" });
      }

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
          // Founder is a high-touch tier billed immediately — no free trial.
          // Premium keeps the 7-day trial.
          trialDays: requestedTier === "founder" ? 0 : SASQUATCH_PREMIUM_TRIAL_DAYS,
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

      res.json({ url: session.url, plan: requestedPlan, tier: requestedTier });
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

  // ── Native cancel + retention flow (Task #18) ─────────────────────────────
  // Replaces the Stripe-portal round-trip with an in-app multi-step cancel:
  // reason → save offer → confirm. All money/offer decisions are server-side.

  // GET /cancel/context — what the cancel dialog needs: live status, plan,
  // access-until date, and the server-computed save offers this survivor
  // qualifies for. Offers are suppressed once one has been accepted or the sub
  // is already scheduled to cancel.
  app.get(
    "/api/sasquatch-premium/cancel/context",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const { subId, state } = await resolvePremiumContext(userId);
        if (!subId || !state) return res.json({ eligible: false });
        const plan = state.plan || "monthly";
        const status = state.status || "active";
        const cancelable = ["active", "trialing", "past_due", "paused"].includes(status);
        const alreadySaved = await hasAcceptedSaveOffer(subId);
        let offers = describeOffers(plan, status);
        if (alreadySaved || state.cancel_at_period_end) offers = [];
        res.json({
          eligible: cancelable,
          status,
          plan,
          currentPeriodEnd: state.current_period_end,
          trialEnd: state.trial_end,
          cancelAtPeriodEnd: state.cancel_at_period_end,
          alreadySaved,
          offers,
        });
      } catch (err: any) {
        console.error("[sasquatch-premium] cancel/context failed", err?.message || err);
        res.status(500).json({ message: "Cancel context failed" });
      }
    },
  );

  const reasonSchema = z.object({
    reason: z.string().refine(isValidCancelReason, "Invalid reason"),
    feedback: z.string().max(FEEDBACK_MAX).optional(),
  });

  // POST /cancel/reason — record the churn reason as the survivor advances past
  // the reason step. Fire-and-forget from the client's perspective; captured
  // even if they ultimately stay (so we learn what nearly churned them).
  app.post(
    "/api/sasquatch-premium/cancel/reason",
    isAuthenticated,
    billingPortalLimiter,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const parsed = reasonSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid reason" });
        const { subId, state } = await resolvePremiumContext(userId);
        await recordRetentionEvent({
          userId,
          subscriptionId: subId,
          plan: state?.plan ?? null,
          stage: "reason",
          reason: parsed.data.reason,
          feedback: parsed.data.feedback ?? null,
          outcome: "reason_captured",
        });
        res.json({ ok: true });
      } catch (err: any) {
        console.error("[sasquatch-premium] cancel/reason failed", err?.message || err);
        res.status(500).json({ message: "Could not record reason" });
      }
    },
  );

  const offerSchema = z.object({
    offer: z.enum(["pause", "discount"]),
    reason: z.string().optional(),
    feedback: z.string().max(FEEDBACK_MAX).optional(),
  });

  // POST /retention-offer — apply a save offer. Server re-derives eligibility
  // (never trusts the client's choice), enforces one accepted offer per
  // subscription, applies it in Stripe, THEN records the outcome.
  app.post(
    "/api/sasquatch-premium/retention-offer",
    isAuthenticated,
    billingPortalLimiter,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const parsed = offerSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid offer" });
        const offer = parsed.data.offer as SaveOffer;
        const { subId, state, customerId } = await resolvePremiumContext(userId);
        if (!subId || !state || !customerId) {
          return res.status(404).json({ message: "No subscription on file" });
        }
        const plan = state.plan || "monthly";
        const status = state.status || "active";
        if (!eligibleOffers(plan, status).includes(offer)) {
          return res.status(400).json({ message: "Offer not available for this plan" });
        }
        if (await hasAcceptedSaveOffer(subId)) {
          return res.status(409).json({ message: "A save offer was already applied" });
        }

        const stripe = await getUncachableStripeClient();
        let updated: any;
        if (offer === "discount") {
          const couponId = await ensureRetentionCoupon(couponKindForPlan(plan));
          // Basil: coupons attach via `discounts`, not the removed top-level
          // `coupon` field. Clear any pending cancel so the offer is a win-back.
          updated = await stripe.subscriptions.update(subId, {
            discounts: [{ coupon: couponId }],
            cancel_at_period_end: false,
          });
        } else {
          const resumesAt = Math.floor(Date.now() / 1000) + PAUSE_DAYS * 86400;
          updated = await stripe.subscriptions.update(subId, {
            pause_collection: { behavior: "void", resumes_at: resumesAt },
            cancel_at_period_end: false,
          });
        }

        await syncPremiumSubFromStripe(updated);
        invalidateSasquatchPremium(customerId);

        await recordRetentionEvent({
          userId,
          subscriptionId: subId,
          plan,
          stage: "offer",
          reason: parsed.data.reason ?? null,
          feedback: parsed.data.feedback ?? null,
          offer,
          outcome: offer === "pause" ? "paused" : "saved",
          metadata: { status },
        });
        res.json({ ok: true, offer });
      } catch (err: any) {
        console.error("[sasquatch-premium] retention-offer failed", err?.message || err);
        res.status(500).json({ message: "Could not apply offer" });
      }
    },
  );

  const cancelSchema = z.object({
    reason: z.string().optional(),
    feedback: z.string().max(FEEDBACK_MAX).optional(),
  });

  // POST /cancel — schedule cancel at period end (survivor keeps access until
  // the paid-through date). Idempotent: a repeat call on an already-canceling
  // sub returns the same shape without a second Stripe write.
  app.post(
    "/api/sasquatch-premium/cancel",
    isAuthenticated,
    billingPortalLimiter,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const parsed = cancelSchema.safeParse(req.body);
        const reason = parsed.success ? parsed.data.reason ?? null : null;
        const feedback = parsed.success ? parsed.data.feedback ?? null : null;

        const { subId, state, customerId } = await resolvePremiumContext(userId);
        if (!subId || !customerId) {
          return res.status(404).json({ message: "No subscription on file" });
        }
        if (state?.cancel_at_period_end) {
          return res.json({
            ok: true,
            cancelAtPeriodEnd: true,
            alreadyScheduled: true,
            currentPeriodEnd: state.current_period_end,
            trialEnd: state.trial_end,
            status: state.status,
          });
        }

        const stripe = await getUncachableStripeClient();
        const updated = await stripe.subscriptions.update(subId, {
          cancel_at_period_end: true,
        });
        await syncPremiumSubFromStripe(updated);
        invalidateSasquatchPremium(customerId);

        const after = await getSubStateByUserId(userId);
        await recordRetentionEvent({
          userId,
          subscriptionId: subId,
          plan: after?.plan ?? state?.plan ?? null,
          stage: "cancel",
          reason,
          feedback,
          outcome: "cancelled",
          metadata: { status: after?.status ?? state?.status },
        });
        res.json({
          ok: true,
          cancelAtPeriodEnd: true,
          // `after` is the durable row (founder + premium both persist one now);
          // fall back to the resolved context only for a webhook-lag race so the
          // "access until" date still renders.
          currentPeriodEnd: after?.current_period_end ?? state?.current_period_end ?? null,
          trialEnd: after?.trial_end ?? state?.trial_end ?? null,
          status: after?.status ?? state?.status ?? "active",
        });
      } catch (err: any) {
        console.error("[sasquatch-premium] cancel failed", err?.message || err);
        res.status(500).json({ message: "Cancel failed" });
      }
    },
  );

  // POST /resume — undo a scheduled cancel AND lift any pause. Sends both
  // cancel_at_period_end:false and pause_collection:'' (Stripe's unset idiom)
  // so a paused-then-resumed sub bills normally again.
  app.post(
    "/api/sasquatch-premium/resume",
    isAuthenticated,
    billingPortalLimiter,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const { subId, customerId } = await resolvePremiumContext(userId);
        if (!subId || !customerId) {
          return res.status(404).json({ message: "No subscription on file" });
        }
        const stripe = await getUncachableStripeClient();
        const updated = await stripe.subscriptions.update(subId, {
          cancel_at_period_end: false,
          pause_collection: "",
        });
        await syncPremiumSubFromStripe(updated);
        invalidateSasquatchPremium(customerId);

        const after = await getSubStateByUserId(userId);
        await recordRetentionEvent({
          userId,
          subscriptionId: subId,
          plan: after?.plan ?? null,
          stage: "resume",
          outcome: "resumed",
          metadata: { status: after?.status },
        });
        // `after` is the durable row (founder + premium both persist one now);
        // fall back to the fresh Stripe object only for a webhook-lag race so
        // the renewal date still renders.
        const updatedPeriodEnd =
          (updated as any)?.current_period_end ??
          (updated as any)?.items?.data?.[0]?.current_period_end ??
          null;
        res.json({
          ok: true,
          cancelAtPeriodEnd: false,
          currentPeriodEnd:
            after?.current_period_end ??
            (typeof updatedPeriodEnd === "number"
              ? new Date(updatedPeriodEnd * 1000).toISOString()
              : null),
          status: after?.status ?? (updated as any)?.status ?? "active",
        });
      } catch (err: any) {
        console.error("[sasquatch-premium] resume failed", err?.message || err);
        res.status(500).json({ message: "Resume failed" });
      }
    },
  );
}
