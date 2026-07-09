import type { Express, Response } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import { getUserId } from "./lib/authUtils";
import { voiceClones, users } from "@workspace/db";
import { getElevenLabsService, isElevenLabsConfigured } from "./elevenlabs";
import { stripeService } from "./stripeService";
import {
  ensureVoiceCloneStripeProducts,
  getVoiceClonePriceIds,
  hasActiveVoiceCloneSubscription,
  verifyVoiceClonePurchaseSession,
  VOICE_CLONE_SUB_PRICE_AMOUNT,
  VOICE_CLONE_PER_CLONE_PRICE_AMOUNT,
} from "./services/voiceCloneEntitlement";

export const VOICE_CLONE_CONSENT_TEXT =
  "I hereby confirm that I am the sole owner of this voice and grant Stroke Recovery Academy and ElevenLabs permission to clone it for use within my account. I understand the cloned voice will only be used to generate audio I personally request.";

const previewSchema = z.object({
  text: z.string().min(1).max(500),
});

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(500).optional().default(""),
  consentAccepted: z.literal(true),
  audioBase64: z.string().min(1000),
  audioMimeType: z.string().max(80).default("audio/webm"),
  sampleDurationSec: z.number().int().min(10).max(300),
  stripeSessionId: z.string().min(10).max(200),
});

const checkoutSchema = z.object({
  mode: z.enum(["subscription", "clone"]),
});

function base64ToBuffer(b64: string): Buffer {
  const stripped = b64.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(stripped, "base64");
}

async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripeService.createCustomer(user.email || "", user.id);
  await stripeService.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
  return customer.id;
}

export function registerVoiceCloneRoutes(app: Express) {
  // NOTE: the larger 15mb express.json body parser for /api/voice-clones is
  // mounted in server/app.ts BEFORE the global 5mb parser so the global cap
  // does not reject voice samples first.

  // ── Admin: idempotent Stripe product setup ────────────────────────────────
  app.post(
    "/api/admin/voice-clones/setup-stripe",
    isAuthenticated,
    requireAdmin,
    async (_req: any, res: Response) => {
      try {
        const ids = await ensureVoiceCloneStripeProducts();
        res.json({ ok: true, ...ids });
      } catch (err: any) {
        console.error("[voice-clones] stripe setup failed", err?.message || err);
        res.status(500).json({ message: "Stripe setup failed", detail: err?.message });
      }
    },
  );

  // ── Entitlement: tells the UI whether the user can mint/use clones ────────
  app.get("/api/voice-clones/entitlement", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const customerId = user?.stripeCustomerId || null;
      const hasSubscription = await hasActiveVoiceCloneSubscription(customerId);
      const { subscriptionPriceId, perClonePriceId } = await getVoiceClonePriceIds();
      res.json({
        hasSubscription,
        configured: !!(subscriptionPriceId && perClonePriceId),
        subscriptionPriceAmountCents: VOICE_CLONE_SUB_PRICE_AMOUNT,
        perClonePriceAmountCents: VOICE_CLONE_PER_CLONE_PRICE_AMOUNT,
      });
    } catch (err: any) {
      console.error("[voice-clones] entitlement failed", err?.message || err);
      res.status(500).json({ message: "Entitlement lookup failed" });
    }
  });

  // ── Checkout: subscription OR per-clone purchase ──────────────────────────
  app.post("/api/voice-clones/checkout", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid mode" });

      const { subscriptionPriceId, perClonePriceId } = await getVoiceClonePriceIds();
      if (!subscriptionPriceId || !perClonePriceId) {
        return res.status(503).json({ message: "Voice clone billing not configured yet" });
      }

      // For a per-clone purchase, require active subscription first — keeps
      // the $5 charge meaningful (only paying subscribers can mint). Money
      // path → bypass cache for an authoritative Stripe read.
      if (parsed.data.mode === "clone") {
        const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const ok = await hasActiveVoiceCloneSubscription(u?.stripeCustomerId || null, {
          skipCache: true,
        });
        if (!ok) {
          return res.status(402).json({ message: "Subscription required before purchasing a clone slot" });
        }
      }

      const customerId = await getOrCreateStripeCustomer(userId);
      if (!customerId) return res.status(404).json({ message: "User not found" });

      const priceId = parsed.data.mode === "subscription" ? subscriptionPriceId : perClonePriceId;
      const stripeMode = parsed.data.mode === "subscription" ? "subscription" : "payment";
      const successPath =
        parsed.data.mode === "subscription"
          ? "/voice-library?subscribed=1"
          : "/voice-library?clone_session_id={CHECKOUT_SESSION_ID}";

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${req.protocol}://${req.get("host")}${successPath}`,
        `${req.protocol}://${req.get("host")}/voice-library?canceled=1`,
        stripeMode,
      );
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[voice-clones] checkout failed", err?.message || err);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  // ── List (auth-only; UI gates content with entitlement endpoint) ──────────
  app.get("/api/voice-clones", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const rows = await db
        .select({
          id: voiceClones.id,
          name: voiceClones.name,
          description: voiceClones.description,
          status: voiceClones.status,
          voiceModelId: voiceClones.voiceModelId,
          sampleDurationSec: voiceClones.sampleDurationSec,
          consentSignedAt: voiceClones.consentSignedAt,
          usageCount: voiceClones.usageCount,
          createdAt: voiceClones.createdAt,
        })
        .from(voiceClones)
        .where(and(eq(voiceClones.ownerId, userId), isNull(voiceClones.deletedAt)))
        .orderBy(desc(voiceClones.createdAt));
      res.json({ voices: rows, consentText: VOICE_CLONE_CONSENT_TEXT });
    } catch (err: any) {
      console.error("[voice-clones] list failed", err?.message || err);
      res.status(500).json({ message: "Failed to list voices" });
    }
  });

  // ── Mint a clone: requires active sub + verified single-use $5 session ────
  app.post("/api/voice-clones", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (!(await isElevenLabsConfigured())) {
        return res.status(503).json({ message: "Voice cloning service unavailable" });
      }

      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Invalid input", issues: parsed.error.issues });
      }
      const { name, description, audioBase64, sampleDurationSec, stripeSessionId } = parsed.data;

      // Subscription gate (active $9/mo). Money path → skip cache for an
      // authoritative Stripe read before consuming the $5 slot.
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const customerId = u?.stripeCustomerId || null;
      if (!customerId) {
        return res.status(402).json({ message: "Subscription required" });
      }
      const hasSub = await hasActiveVoiceCloneSubscription(customerId, { skipCache: true });
      if (!hasSub) {
        return res.status(402).json({ message: "Active voice clone subscription required" });
      }

      // Per-clone $5 gate (single-use). Verify before EL call so we don't
      // burn an EL voice slot on an invalid token.
      const verify = await verifyVoiceClonePurchaseSession(customerId, stripeSessionId);
      if (!verify.ok) {
        return res.status(verify.status).json({ message: verify.reason });
      }

      // Pre-check uniqueness (UNIQUE constraint also enforces, but failing
      // here before the EL call avoids leaking a voice slot on replay).
      const [dupe] = await db
        .select({ id: voiceClones.id })
        .from(voiceClones)
        .where(eq(voiceClones.stripeSessionId, stripeSessionId))
        .limit(1);
      if (dupe) {
        return res.status(409).json({ message: "This purchase has already been used" });
      }

      const sampleBuf = base64ToBuffer(audioBase64);
      if (sampleBuf.length < 10_000) {
        return res.status(400).json({ message: "Audio sample too small (need ~10s+)" });
      }
      if (sampleBuf.length > 12_000_000) {
        return res.status(413).json({ message: "Audio sample too large (max ~12MB)" });
      }

      const eleven = getElevenLabsService();
      let voiceId: string;
      try {
        voiceId = await eleven.cloneVoice(
          name.slice(0, 60),
          description || `Survivor voice clone for user ${userId}`,
          [sampleBuf],
        );
      } catch (e: any) {
        console.error("[voice-clones] ElevenLabs clone failed", e?.message || e);
        return res.status(502).json({ message: "Voice cloning service rejected the sample" });
      }

      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        null;

      try {
        const [row] = await db
          .insert(voiceClones)
          .values({
            ownerId: userId,
            name,
            description: description || null,
            voiceType: "custom",
            voiceModelId: voiceId,
            status: "ready",
            consentText: VOICE_CLONE_CONSENT_TEXT,
            consentSignedAt: new Date(),
            consentIp: ip,
            sampleDurationSec,
            stripeSessionId,
          })
          .returning({
            id: voiceClones.id,
            name: voiceClones.name,
            status: voiceClones.status,
            voiceModelId: voiceClones.voiceModelId,
          });

        console.log(
          `[voice-clones] minted user=${userId} voiceId=${voiceId} duration=${sampleDurationSec}s session=${stripeSessionId.slice(0, 12)}…`,
        );
        res.json({ voice: row });
      } catch (dbErr: any) {
        // Compensating delete — also catches the UNIQUE-violation race where
        // two concurrent submits with the same session token both pass the
        // pre-check; only one row will insert, the other rolls back EL.
        console.error(
          `[voice-clones] DB insert failed after EL clone (compensating) voiceId=${voiceId}`,
          dbErr?.message || dbErr,
        );
        try {
          await eleven.deleteVoice(voiceId);
        } catch (compErr: any) {
          console.error(
            `[voice-clones] compensating EL delete also failed voiceId=${voiceId}`,
            compErr?.message || compErr,
          );
        }
        const isUnique = String(dbErr?.code) === "23505" || /unique/i.test(String(dbErr?.message));
        return res
          .status(isUnique ? 409 : 500)
          .json({ message: isUnique ? "This purchase has already been used" : "Failed to save voice clone" });
      }
    } catch (err: any) {
      console.error("[voice-clones] create failed", err?.message || err);
      res.status(500).json({ message: "Failed to create voice clone" });
    }
  });

  // ── Preview: requires active subscription ─────────────────────────────────
  app.post(
    "/api/voice-clones/:id/preview",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });

        const parsed = previewSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid text" });
        }

        const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const hasSub = await hasActiveVoiceCloneSubscription(u?.stripeCustomerId || null);
        if (!hasSub) {
          return res.status(402).json({ message: "Active voice clone subscription required" });
        }

        const [row] = await db
          .select({
            voiceModelId: voiceClones.voiceModelId,
            ownerId: voiceClones.ownerId,
            deletedAt: voiceClones.deletedAt,
            status: voiceClones.status,
          })
          .from(voiceClones)
          .where(eq(voiceClones.id, id))
          .limit(1);

        if (!row || row.ownerId !== userId || row.deletedAt) {
          return res.status(404).json({ message: "Voice not found" });
        }
        if (row.status !== "ready" || !row.voiceModelId) {
          return res.status(409).json({ message: "Voice not ready" });
        }

        const audio = await getElevenLabsService().textToSpeech(
          parsed.data.text,
          row.voiceModelId,
        );

        await db
          .update(voiceClones)
          .set({
            usageCount: sql`${voiceClones.usageCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(voiceClones.id, id));

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-store");
        res.send(audio);
      } catch (err: any) {
        console.error("[voice-clones] preview failed", err?.message || err);
        res.status(500).json({ message: "Preview failed" });
      }
    },
  );

  // ── Delete: auth-only; ownership enforced. Soft-delete; consent retained ──
  app.delete("/api/voice-clones/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });

      const [row] = await db
        .select({
          voiceModelId: voiceClones.voiceModelId,
          ownerId: voiceClones.ownerId,
          deletedAt: voiceClones.deletedAt,
        })
        .from(voiceClones)
        .where(eq(voiceClones.id, id))
        .limit(1);

      if (!row || row.ownerId !== userId || row.deletedAt) {
        return res.status(404).json({ message: "Voice not found" });
      }

      if (row.voiceModelId) {
        try {
          await getElevenLabsService().deleteVoice(row.voiceModelId);
        } catch (e: any) {
          console.warn(
            `[voice-clones] EL delete failed (continuing soft-delete) id=${id}: ${e?.message}`,
          );
        }
      }

      await db
        .update(voiceClones)
        .set({ deletedAt: new Date(), status: "deleted", updatedAt: new Date() })
        .where(eq(voiceClones.id, id));

      res.json({ ok: true });
    } catch (err: any) {
      console.error("[voice-clones] delete failed", err?.message || err);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  console.log("[voice-clones] routes registered");
}
