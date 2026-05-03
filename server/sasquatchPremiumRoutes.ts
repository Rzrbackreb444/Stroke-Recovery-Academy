import type { Express, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { isAuthenticated } from "./replitAuth";
import { getUserId } from "./lib/authUtils";
import { stripeService } from "./stripeService";
import {
  SASQUATCH_PREMIUM_PRICE_AMOUNT,
  ensureSasquatchPremiumProduct,
  hasActiveSasquatchPremium,
  invalidateSasquatchPremium,
} from "./services/sasquatchPremiumService";

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
  // GET /api/sasquatch-premium/status — UI gate
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
      });
    } catch (err: any) {
      console.error("[sasquatch-premium] status failed", err?.message || err);
      res.status(500).json({ message: "Status lookup failed" });
    }
  });

  // POST /api/sasquatch-premium/checkout — create recurring checkout session.
  // Lazy-creates the Stripe product+price on first call; subsequent calls
  // hit the cache. Success returns to /recovery/premium?subscribed=1 so the
  // landing page can flash a confirmation and re-fetch entitlement.
  app.post("/api/sasquatch-premium/checkout", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      let priceId: string;
      try {
        priceId = await ensureSasquatchPremiumProduct();
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
        `${baseUrl}/recovery/premium?subscribed=1`,
        `${baseUrl}/recovery/premium?canceled=1`,
        "subscription",
      );
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[sasquatch-premium] checkout failed", err?.message || err);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  // POST /api/sasquatch-premium/portal — Stripe customer portal for cancel /
  // payment-method update. Also invalidates entitlement cache so post-cancel
  // status flips quickly when the user returns.
  app.post("/api/sasquatch-premium/portal", isAuthenticated, async (req: any, res: Response) => {
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
}
