import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { z } from "zod";
import { db } from "../db";
import { getUserId } from "../lib/authUtils";
import {
  sasquatchStudioSubscriptions,
  sasquatchVoiceClones,
  sasquatchVoiceGenerations,
} from "@shared/schema";
import {
  STUDIO_TIERS,
  TIER_ORDER,
  TIER_RANK,
  resolveTier,
  featuresFor,
  lookupKeyFor,
  type StudioTier,
  type BillingPeriod,
} from "@shared/studioTiers";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import {
  cloneVoiceWithElevenLabs,
  synthesizeWithElevenLabs,
} from "../voiceService";

// Pull current_period_end safely across Stripe API versions: top-level on
// older versions, items.data[0].current_period_end on newer versions.
function readPeriodEnd(sub: any): Date | null {
  const candidates = [
    sub?.current_period_end,
    sub?.items?.data?.[0]?.current_period_end,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return new Date(c * 1000);
  }
  return null;
}

// Map a Stripe price → (tier, period). Cached at module scope; rebuilt on
// boot from STUDIO_TIERS lookup_keys so deploys are deterministic.
const PRICE_TO_TIER = new Map<string, { tier: StudioTier; period: BillingPeriod }>();

async function getOrCreateAllStudioPrices(): Promise<
  Record<StudioTier, Record<BillingPeriod, string>>
> {
  const stripe = await getUncachableStripeClient();
  // Find or create the parent product once.
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find((p) => p.name === "Sasquatch Studio");
  if (!product) {
    product = await stripe.products.create({
      name: "Sasquatch Studio",
      description:
        "Clone your voice. Build albums. Release like a label — built for stroke survivors.",
    });
  }
  const result: Record<StudioTier, Record<BillingPeriod, string>> = {
    creator: { monthly: "", annual: "" },
    pro: { monthly: "", annual: "" },
    label: { monthly: "", annual: "" },
  };
  for (const tier of TIER_ORDER) {
    for (const period of ["monthly", "annual"] as BillingPeriod[]) {
      const lookupKey = lookupKeyFor(tier, period);
      const tierDef = STUDIO_TIERS[tier];
      const amount =
        period === "monthly" ? tierDef.monthlyUsdCents : tierDef.annualUsdCents;
      const interval = period === "monthly" ? "month" : "year";
      const existing = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });
      let price = existing.data[0];
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          currency: "usd",
          unit_amount: amount,
          recurring: { interval: interval as any },
          lookup_key: lookupKey,
          nickname: `${tierDef.name} (${period})`,
        });
      }
      result[tier][period] = price.id;
      PRICE_TO_TIER.set(price.id, { tier, period });
    }
  }
  return result;
}

// Lazy bootstrap so we only hit Stripe on first checkout, not on cold boot.
let pricesCache: Record<StudioTier, Record<BillingPeriod, string>> | null = null;
async function getPriceFor(tier: StudioTier, period: BillingPeriod): Promise<string> {
  if (!pricesCache) pricesCache = await getOrCreateAllStudioPrices();
  return pricesCache[tier][period];
}

// Exported so the admin seed endpoint can pre-warm the live Stripe account.
export { getOrCreateAllStudioPrices };

// Resolve tier+period from the Stripe priceId stored on the subscription row.
// Falls back to a Stripe lookup_keys search if not in the in-process cache
// (e.g. process restarted after webhook fired with a price we hadn't created
// in this process yet).
async function tierFromPriceId(
  priceId: string | null | undefined
): Promise<{ tier: StudioTier; period: BillingPeriod } | null> {
  if (!priceId) return null;
  const cached = PRICE_TO_TIER.get(priceId);
  if (cached) return cached;
  // Warm the cache.
  await getOrCreateAllStudioPrices();
  return PRICE_TO_TIER.get(priceId) || null;
}

// Called by the Stripe webhook handler whenever a subscription event arrives.
// Looks up our row by stripe_customer_id and refreshes status/period_end so
// monthly renewals don't silently flip the user back to "inactive". Also
// re-derives the tier from the active price so upgrades/downgrades land here.
export async function syncStudioSubscriptionFromStripe(stripeSub: any) {
  try {
    if (!stripeSub?.customer) return;
    const customerId =
      typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;
    const stripeStatus = stripeSub.status as string | undefined;
    const ourStatus =
      stripeStatus === "trialing" || stripeStatus === "active"
        ? "active"
        : stripeStatus === "canceled"
          ? "canceled"
          : stripeStatus === "past_due" || stripeStatus === "unpaid"
            ? "past_due"
            : "inactive";
    const periodEnd = readPeriodEnd(stripeSub);
    const activePriceId =
      stripeSub?.items?.data?.[0]?.price?.id ||
      stripeSub?.plan?.id ||
      null;
    const tierMap = await tierFromPriceId(activePriceId);
    const updates: any = {
      status: ourStatus,
      stripeSubscriptionId: stripeSub.id,
      updatedAt: new Date(),
    };
    if (activePriceId) updates.stripePriceId = activePriceId;
    if (tierMap) {
      const f = featuresFor(tierMap.tier);
      updates.tier = tierMap.tier;
      updates.billingPeriod = tierMap.period;
      updates.monthlyCharacterCap = f.monthlyCharacterCap;
      updates.voicesAllowed = f.voicesAllowed;
      updates.albumsAllowed = f.albumsAllowed === -1 ? 9999 : f.albumsAllowed;
    }
    if (periodEnd) updates.currentPeriodEnd = periodEnd;
    if (ourStatus === "canceled") updates.canceledAt = new Date();
    // Reset character usage on a successful renewal (period_end advanced).
    if (ourStatus === "active" && periodEnd) {
      const [existing] = await db
        .select()
        .from(sasquatchStudioSubscriptions)
        .where(eq(sasquatchStudioSubscriptions.stripeCustomerId, customerId))
        .limit(1);
      if (
        existing?.currentPeriodEnd &&
        periodEnd.getTime() > existing.currentPeriodEnd.getTime()
      ) {
        updates.charactersUsedThisPeriod = 0;
      }
    }
    await db
      .update(sasquatchStudioSubscriptions)
      .set(updates)
      .where(eq(sasquatchStudioSubscriptions.stripeCustomerId, customerId));
  } catch (e) {
    console.warn("[sasq-studio] syncStudioSubscriptionFromStripe failed", e);
  }
}

async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  const [existing] = await db
    .select()
    .from(sasquatchStudioSubscriptions)
    .where(eq(sasquatchStudioSubscriptions.userId, userId))
    .limit(1);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const stripe = await getUncachableStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId, scope: "sasquatch_studio" },
  });
  return customer.id;
}

async function getActiveSub(userId: string) {
  const [row] = await db
    .select()
    .from(sasquatchStudioSubscriptions)
    .where(eq(sasquatchStudioSubscriptions.userId, userId))
    .limit(1);
  if (!row) return null;
  if (row.status !== "active") return null;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() < Date.now()) {
    return null;
  }
  return row;
}

// Public helper for other modules (album builder) to gate features.
export async function getActiveStudioSub(userId: string) {
  return getActiveSub(userId);
}
export async function requireActiveTier(
  userId: string
): Promise<{ row: any; tier: StudioTier }> {
  const row = await getActiveSub(userId);
  if (!row) throw Object.assign(new Error("Subscription required"), { status: 402 });
  const tier = resolveTier(row.tier);
  return { row, tier };
}

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const generateSchema = z.object({
  voiceId: z.string().min(8).max(80),
  text: z.string().trim().min(1).max(8000),
  kind: z
    .enum(["speech", "audiobook_chapter", "poem", "anthem_lyric", "affirmation"])
    .default("speech"),
  title: z.string().trim().max(200).optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
});

const checkoutSchema = z.object({
  tier: z.enum(["creator", "pro", "label"]).default("creator"),
  period: z.enum(["monthly", "annual"]).default("monthly"),
});

export function registerSasquatchStudioRoutes(
  app: Express,
  isAuthenticated: any,
  uploadsDir: string
) {
  const studioDir = path.join(uploadsDir, "sasquatch-studio");
  if (!fs.existsSync(studioDir)) fs.mkdirSync(studioDir, { recursive: true });

  // -------- Tier catalog (public, no auth) --------
  app.get("/api/sasquatch-studio/tiers", (_req, res) => {
    res.json({ tiers: STUDIO_TIERS, order: TIER_ORDER });
  });

  // -------- Status --------
  app.get(
    "/api/sasquatch-studio/me",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req)!;
      const [sub] = await db
        .select()
        .from(sasquatchStudioSubscriptions)
        .where(eq(sasquatchStudioSubscriptions.userId, userId))
        .limit(1);
      const voices = await db
        .select()
        .from(sasquatchVoiceClones)
        .where(
          and(
            eq(sasquatchVoiceClones.userId, userId),
            eq(sasquatchVoiceClones.status, "ready")
          )
        )
        .orderBy(desc(sasquatchVoiceClones.createdAt));
      const isActive =
        !!sub &&
        sub.status === "active" &&
        (!sub.currentPeriodEnd ||
          sub.currentPeriodEnd.getTime() > Date.now());
      const tier = resolveTier(sub?.tier);
      const features = featuresFor(tier);
      return res.json({
        active: isActive,
        tier,
        billingPeriod: (sub?.billingPeriod as BillingPeriod) || "monthly",
        features,
        subscription: sub
          ? {
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
              charactersUsedThisPeriod: sub.charactersUsedThisPeriod,
              monthlyCharacterCap: sub.monthlyCharacterCap,
              voicesAllowed: sub.voicesAllowed,
              albumsAllowed: sub.albumsAllowed,
              tier,
              billingPeriod: sub.billingPeriod,
            }
          : null,
        voices: voices.map((v) => ({
          id: v.id,
          name: v.name,
          description: v.description,
          elevenlabsVoiceId: v.elevenlabsVoiceId,
          createdAt: v.createdAt,
        })),
      });
    }
  );

  // -------- Subscribe / upgrade (Stripe Checkout) --------
  app.post(
    "/api/sasquatch-studio/checkout",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const email =
          req.user.claims.email ||
          req.body?.email ||
          `${userId}@unknown.local`;
        const parsed = checkoutSchema.safeParse(req.body || {});
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid tier/period" });
        }
        const { tier, period } = parsed.data;
        const priceId = await getPriceFor(tier, period);
        const customerId = await getOrCreateCustomer(userId, email);
        const stripe = await getUncachableStripeClient();
        const origin =
          req.headers.origin ||
          `https://${req.headers.host || "strokerecoveryacademy.com"}`;
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${origin}/sasquatch-studio?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/sasquatch-studio?canceled=1`,
          allow_promotion_codes: true,
          metadata: { userId, scope: "sasquatch_studio", tier, period },
        });
        // Pre-create row so we can update on verify.
        await db
          .insert(sasquatchStudioSubscriptions)
          .values({
            userId,
            email,
            status: "inactive",
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            tier,
            billingPeriod: period,
          })
          .onConflictDoUpdate({
            target: sasquatchStudioSubscriptions.userId,
            set: {
              email,
              stripeCustomerId: customerId,
              stripePriceId: priceId,
              tier,
              billingPeriod: period,
              updatedAt: new Date(),
            },
          });
        return res.json({ url: session.url });
      } catch (err: any) {
        console.error("[sasq-studio/checkout]", err);
        return res
          .status(500)
          .json({ error: err?.message || "Checkout failed" });
      }
    }
  );

  // -------- Verify checkout (called by success_url page) --------
  app.post(
    "/api/sasquatch-studio/verify",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const sessionId = String(req.body?.sessionId || "");
        if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
        const stripe = await getUncachableStripeClient();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription"],
        });
        if (session.metadata?.userId !== userId) {
          return res.status(403).json({ error: "Session does not belong to you" });
        }
        const sub: any = session.subscription;
        if (!sub || typeof sub === "string") {
          return res.status(400).json({ error: "No subscription on session" });
        }
        const periodEnd = readPeriodEnd(sub);
        const activePriceId =
          sub?.items?.data?.[0]?.price?.id || sub?.plan?.id || null;
        const tierMap = await tierFromPriceId(activePriceId);
        const tier = tierMap?.tier || (session.metadata?.tier as StudioTier) || "creator";
        const billingPeriod =
          tierMap?.period || (session.metadata?.period as BillingPeriod) || "monthly";
        const f = featuresFor(tier);
        await db
          .update(sasquatchStudioSubscriptions)
          .set({
            status:
              sub.status === "active" || sub.status === "trialing"
                ? "active"
                : sub.status,
            stripeSubscriptionId: sub.id,
            stripePriceId: activePriceId || undefined,
            currentPeriodEnd: periodEnd,
            tier,
            billingPeriod,
            monthlyCharacterCap: f.monthlyCharacterCap,
            voicesAllowed: f.voicesAllowed,
            albumsAllowed: f.albumsAllowed === -1 ? 9999 : f.albumsAllowed,
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(sasquatchStudioSubscriptions.userId, userId));
        return res.json({ ok: true, status: sub.status, tier });
      } catch (err: any) {
        console.error("[sasq-studio/verify]", err);
        return res.status(500).json({ error: err?.message || "Verify failed" });
      }
    }
  );

  // -------- Customer portal (cancel/manage/upgrade) --------
  app.post(
    "/api/sasquatch-studio/portal",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const [sub] = await db
          .select()
          .from(sasquatchStudioSubscriptions)
          .where(eq(sasquatchStudioSubscriptions.userId, userId))
          .limit(1);
        if (!sub?.stripeCustomerId) {
          return res.status(400).json({ error: "No subscription on file" });
        }
        const stripe = await getUncachableStripeClient();
        const origin =
          req.headers.origin ||
          `https://${req.headers.host || "strokerecoveryacademy.com"}`;
        const portal = await stripe.billingPortal.sessions.create({
          customer: sub.stripeCustomerId,
          return_url: `${origin}/sasquatch-studio`,
        });
        return res.json({ url: portal.url });
      } catch (err: any) {
        console.error("[sasq-studio/portal]", err);
        return res.status(500).json({ error: err?.message || "Portal failed" });
      }
    }
  );

  // -------- Voice clone --------
  app.post(
    "/api/sasquatch-studio/voices/clone",
    isAuthenticated,
    audioUpload.array("audio", 5),
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const active = await getActiveSub(userId);
        if (!active) {
          return res.status(402).json({ error: "Subscription required" });
        }
        const existingVoices = await db
          .select()
          .from(sasquatchVoiceClones)
          .where(
            and(
              eq(sasquatchVoiceClones.userId, userId),
              eq(sasquatchVoiceClones.status, "ready")
            )
          );
        if (existingVoices.length >= active.voicesAllowed) {
          return res
            .status(400)
            .json({ error: `Voice cap reached (${active.voicesAllowed}). Upgrade for more.` });
        }
        const name = String(req.body?.name || "").trim().slice(0, 120);
        const description = String(req.body?.description || "").trim().slice(0, 500);
        const consent =
          String(req.body?.consent || "").toLowerCase() === "true" ||
          req.body?.consent === true;
        if (!name) return res.status(400).json({ error: "Name required" });
        if (!consent) {
          return res.status(400).json({
            error:
              "You must attest that the voice is yours and you consent to cloning.",
          });
        }
        const files = (req.files as Express.Multer.File[]) || [];
        if (files.length === 0) {
          return res.status(400).json({ error: "Upload at least one audio sample" });
        }
        const buffers = files.map((f) => f.buffer);
        const result = await cloneVoiceWithElevenLabs(
          `sra-${userId.slice(0, 6)}-${name}`.slice(0, 60),
          buffers,
          description || `Sasquatch Studio clone for ${name}`
        );
        if (!result.success || !result.voiceId) {
          return res
            .status(500)
            .json({ error: result.error || "Voice clone failed" });
        }
        const ip =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "";
        const consentText =
          "I attest that this voice belongs to me and I consent to having it cloned " +
          "and used to generate audio in the Sasquatch Studio. I understand I can " +
          "delete this voice at any time.";
        const [row] = await db
          .insert(sasquatchVoiceClones)
          .values({
            userId,
            name,
            description: description || null,
            elevenlabsVoiceId: result.voiceId,
            consentAttested: true,
            consentText,
            consentIp: ip,
          })
          .returning();
        return res.json({
          ok: true,
          voice: {
            id: row.id,
            name: row.name,
            elevenlabsVoiceId: row.elevenlabsVoiceId,
          },
        });
      } catch (err: any) {
        console.error("[sasq-studio/voices/clone]", err);
        return res.status(500).json({ error: err?.message || "Clone failed" });
      }
    }
  );

  // -------- Delete a voice --------
  app.delete(
    "/api/sasquatch-studio/voices/:id",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
        const [voice] = await db
          .select()
          .from(sasquatchVoiceClones)
          .where(
            and(
              eq(sasquatchVoiceClones.id, id),
              eq(sasquatchVoiceClones.userId, userId)
            )
          )
          .limit(1);
        if (!voice) return res.status(404).json({ error: "Not found" });
        try {
          const apiKey = process.env.ELEVENLABS_API_KEY;
          if (apiKey) {
            await fetch(
              `https://api.elevenlabs.io/v1/voices/${voice.elevenlabsVoiceId}`,
              { method: "DELETE", headers: { "xi-api-key": apiKey } }
            );
          }
        } catch (e) {
          console.warn("[sasq-studio] elevenlabs delete failed", e);
        }
        await db
          .update(sasquatchVoiceClones)
          .set({ status: "deleted", deletedAt: new Date() })
          .where(eq(sasquatchVoiceClones.id, id));
        return res.json({ ok: true });
      } catch (err: any) {
        console.error("[sasq-studio/voices/delete]", err);
        return res.status(500).json({ error: err?.message || "Delete failed" });
      }
    }
  );

  // -------- Generate audio --------
  app.post(
    "/api/sasquatch-studio/generate",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req)!;
        const active = await getActiveSub(userId);
        if (!active) return res.status(402).json({ error: "Subscription required" });
        const parsed = generateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ error: "Invalid", details: parsed.error.format() });
        }
        const { voiceId, text, kind, title, stability, similarityBoost, style } =
          parsed.data;
        const [voice] = await db
          .select()
          .from(sasquatchVoiceClones)
          .where(
            and(
              eq(sasquatchVoiceClones.userId, userId),
              eq(sasquatchVoiceClones.elevenlabsVoiceId, voiceId),
              eq(sasquatchVoiceClones.status, "ready")
            )
          )
          .limit(1);
        if (!voice) return res.status(403).json({ error: "Voice not yours" });
        const characterCount = text.length;
        const reserved = await db
          .update(sasquatchStudioSubscriptions)
          .set({
            charactersUsedThisPeriod: sql`${sasquatchStudioSubscriptions.charactersUsedThisPeriod} + ${characterCount}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(sasquatchStudioSubscriptions.userId, userId),
              sql`${sasquatchStudioSubscriptions.charactersUsedThisPeriod} + ${characterCount} <= ${sasquatchStudioSubscriptions.monthlyCharacterCap}`,
            ),
          )
          .returning({ id: sasquatchStudioSubscriptions.id });
        if (!reserved.length) {
          return res.status(429).json({
            error: `Monthly character cap reached (${active.monthlyCharacterCap}). Upgrade your tier or wait for renewal.`,
          });
        }
        const synth = await synthesizeWithElevenLabs(
          text,
          voiceId,
          "eleven_multilingual_v2",
          stability ?? 0.5,
          similarityBoost ?? 0.8,
          style ?? 0.4
        );
        if (!synth.success || !synth.audioBase64) {
          await db
            .update(sasquatchStudioSubscriptions)
            .set({
              charactersUsedThisPeriod: sql`GREATEST(0, ${sasquatchStudioSubscriptions.charactersUsedThisPeriod} - ${characterCount})`,
              updatedAt: new Date(),
            })
            .where(eq(sasquatchStudioSubscriptions.userId, userId));
          return res
            .status(500)
            .json({ error: synth.error || "Synthesis failed" });
        }
        const token = crypto.randomBytes(24).toString("hex");
        const filename = `gen-${token}.mp3`;
        const filepath = path.join(studioDir, filename);
        fs.writeFileSync(filepath, Buffer.from(synth.audioBase64, "base64"));
        const audioUrl = `/uploads/sasquatch-studio/${filename}`;
        const durationSeconds = Math.max(
          1,
          Math.round((characterCount / 5 / 150) * 60)
        );
        const [row] = await db
          .insert(sasquatchVoiceGenerations)
          .values({
            userId,
            voiceId,
            voiceName: voice.name,
            kind,
            title: title || null,
            text,
            characterCount,
            audioUrl,
            durationSeconds,
          })
          .returning();
        return res.json({ ok: true, generation: row });
      } catch (err: any) {
        console.error("[sasq-studio/generate]", err);
        return res.status(500).json({ error: err?.message || "Generate failed" });
      }
    }
  );

  // -------- List generations --------
  app.get(
    "/api/sasquatch-studio/generations",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req)!;
      const rows = await db
        .select()
        .from(sasquatchVoiceGenerations)
        .where(eq(sasquatchVoiceGenerations.userId, userId))
        .orderBy(desc(sasquatchVoiceGenerations.createdAt))
        .limit(100);
      return res.json({ items: rows });
    }
  );
}
