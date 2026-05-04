import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { z } from "zod";
import { db } from "../db";
import {
  sasquatchStudioSubscriptions,
  sasquatchVoiceClones,
  sasquatchVoiceGenerations,
} from "@shared/schema";
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

// Called by the Stripe webhook handler whenever a subscription event arrives.
// Looks up our row by stripe_customer_id and refreshes status/period_end so
// monthly renewals don't silently flip the user back to "inactive". Best-effort.
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
    const updates: any = {
      status: ourStatus,
      stripeSubscriptionId: stripeSub.id,
      updatedAt: new Date(),
    };
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

const PRICE_USD_CENTS = 999;
const PRODUCT_NAME = "Sasquatch Studio";
const PRODUCT_DESC =
  "Clone your own voice. Record audiobooks, poems, anthems — anything.";

// Cache the auto-created Stripe price/product per process so we don't recreate
// them on every checkout. Persists for the lifetime of the dyno.
let cachedPriceId: string | null = process.env.STRIPE_SASQUATCH_STUDIO_PRICE_ID || null;

async function getOrCreateStudioPrice(): Promise<string> {
  if (cachedPriceId) return cachedPriceId;
  const stripe = await getUncachableStripeClient();
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find((p) => p.name === PRODUCT_NAME);
  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: PRODUCT_DESC,
    });
  }
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 20,
  });
  let price = prices.data.find(
    (p) =>
      p.unit_amount === PRICE_USD_CENTS &&
      p.currency === "usd" &&
      p.recurring?.interval === "month"
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: PRICE_USD_CENTS,
      recurring: { interval: "month" },
    });
  }
  cachedPriceId = price.id;
  return price.id;
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
  // Active = status active and currentPeriodEnd in future (or unset).
  if (row.status !== "active") return null;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() < Date.now()) {
    return null;
  }
  return row;
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

export function registerSasquatchStudioRoutes(
  app: Express,
  isAuthenticated: any,
  uploadsDir: string
) {
  const studioDir = path.join(uploadsDir, "sasquatch-studio");
  if (!fs.existsSync(studioDir)) fs.mkdirSync(studioDir, { recursive: true });

  // -------- Status --------
  app.get(
    "/api/sasquatch-studio/me",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = req.user.claims.sub;
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
      return res.json({
        active: isActive,
        priceUsd: PRICE_USD_CENTS / 100,
        subscription: sub
          ? {
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
              charactersUsedThisPeriod: sub.charactersUsedThisPeriod,
              monthlyCharacterCap: sub.monthlyCharacterCap,
              voicesAllowed: sub.voicesAllowed,
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

  // -------- Subscribe (Stripe Checkout) --------
  app.post(
    "/api/sasquatch-studio/checkout",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const email =
          req.user.claims.email ||
          req.body?.email ||
          `${userId}@unknown.local`;
        const priceId = await getOrCreateStudioPrice();
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
          metadata: { userId, scope: "sasquatch_studio" },
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
          })
          .onConflictDoUpdate({
            target: sasquatchStudioSubscriptions.userId,
            set: {
              email,
              stripeCustomerId: customerId,
              stripePriceId: priceId,
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
        const userId = req.user.claims.sub;
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
        await db
          .update(sasquatchStudioSubscriptions)
          .set({
            status:
              sub.status === "active" || sub.status === "trialing"
                ? "active"
                : sub.status,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: periodEnd,
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(sasquatchStudioSubscriptions.userId, userId));
        return res.json({ ok: true, status: sub.status });
      } catch (err: any) {
        console.error("[sasq-studio/verify]", err);
        return res.status(500).json({ error: err?.message || "Verify failed" });
      }
    }
  );

  // -------- Customer portal (cancel/manage) --------
  app.post(
    "/api/sasquatch-studio/portal",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
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
        const userId = req.user.claims.sub;
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
            .json({ error: `Voice cap reached (${active.voicesAllowed})` });
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
        const userId = req.user.claims.sub;
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
        // Best-effort delete from ElevenLabs
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
        const userId = req.user.claims.sub;
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
        // Verify voice belongs to this user (or is the public Sasquatch voice).
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
        // Atomic reserve-quota: increment ONLY if it stays under the cap.
        // Returning [] means another concurrent call already pushed over the cap.
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
            error: `Monthly character cap reached (${active.monthlyCharacterCap}). Resets at next billing cycle.`,
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
          // Refund the reserved characters since synthesis failed.
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
        // Unguessable filename — random 24-byte token, no userId or timestamp.
        // Files are served via public /uploads, so the token IS the access secret.
        const token = crypto.randomBytes(24).toString("hex");
        const filename = `gen-${token}.mp3`;
        const filepath = path.join(studioDir, filename);
        fs.writeFileSync(filepath, Buffer.from(synth.audioBase64, "base64"));
        const audioUrl = `/uploads/sasquatch-studio/${filename}`;
        // Rough duration estimate: ~150 wpm, ~5 chars per word → seconds
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
      const userId = req.user.claims.sub;
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
