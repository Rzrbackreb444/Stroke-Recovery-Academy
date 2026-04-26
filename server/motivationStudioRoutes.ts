import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import {
  motivationUsage,
  motivationArtifacts,
  dailyQuotes,
} from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import { sasquatchSpeak, isElevenLabsConfigured } from "./elevenlabs";

const FREE_LIMITS = {
  anthem: 3,
  vision_card: 5,
};

// Whitelist of paid tiers — anything else is treated as free.
const PREMIUM_TIERS = new Set(["creator", "pro", "enterprise"]);

const anthemSchema = z.object({
  affirmation: z.string().min(1).max(500),
  theme: z.string().max(80).optional().default(""),
});

const visionSchema = z.object({
  goal: z.string().min(1).max(300),
  declaration: z.string().max(120).optional().default(""),
});

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const { getUserTier } = await import("./subscriptionTierService");
    const tier = await getUserTier(userId);
    return PREMIUM_TIERS.has(tier);
  } catch {
    return false;
  }
}

async function getOrCreateUsage(userId: string) {
  const month = thisMonth();
  await db
    .insert(motivationUsage)
    .values({ userId, month, anthemCount: 0, visionCardCount: 0 })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(motivationUsage)
    .where(and(eq(motivationUsage.userId, userId), eq(motivationUsage.month, month)))
    .limit(1);
  return row!;
}

/**
 * Atomically reserve one quota slot for `kind` if the user is below their free-tier limit.
 * Returns true on success (slot reserved, counter incremented).
 * Returns false if the user is already at the limit.
 * Premium users always succeed without modifying the counter.
 *
 * Implemented as a single conditional UPDATE so concurrent generations cannot both pass.
 */
async function reserveQuotaSlot(
  userId: string,
  kind: "anthem" | "vision_card",
): Promise<{ ok: true } | { ok: false; used: number; limit: number }> {
  if (await isPremiumUser(userId)) return { ok: true };

  const month = thisMonth();
  await getOrCreateUsage(userId);
  const limit = FREE_LIMITS[kind];

  // Atomic compare-and-increment.
  const result =
    kind === "anthem"
      ? await db.execute(sql`
          UPDATE motivation_usage
          SET anthem_count = anthem_count + 1, updated_at = now()
          WHERE user_id = ${userId} AND month = ${month} AND anthem_count < ${limit}
          RETURNING anthem_count
        `)
      : await db.execute(sql`
          UPDATE motivation_usage
          SET vision_card_count = vision_card_count + 1, updated_at = now()
          WHERE user_id = ${userId} AND month = ${month} AND vision_card_count < ${limit}
          RETURNING vision_card_count
        `);

  const rows = (result as any).rows ?? [];
  if (rows.length > 0) return { ok: true };

  const usage = await getOrCreateUsage(userId);
  const used = kind === "anthem" ? usage.anthemCount : usage.visionCardCount;
  return { ok: false, used, limit };
}

/** Roll back one slot if the generation step itself failed after reservation. */
async function refundQuotaSlot(userId: string, kind: "anthem" | "vision_card") {
  if (await isPremiumUser(userId)) return;
  const month = thisMonth();
  if (kind === "anthem") {
    await db.execute(sql`
      UPDATE motivation_usage
      SET anthem_count = GREATEST(anthem_count - 1, 0), updated_at = now()
      WHERE user_id = ${userId} AND month = ${month}
    `);
  } else {
    await db.execute(sql`
      UPDATE motivation_usage
      SET vision_card_count = GREATEST(vision_card_count - 1, 0), updated_at = now()
      WHERE user_id = ${userId} AND month = ${month}
    `);
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function generateAnthemLyrics(affirmation: string, theme: string): Promise<string> {
  const prompt = `You are Sasquatch — a stroke survivor who rebuilt himself with grit and humor.
Write a 4-line anthem lyric (one verse only) for a stroke survivor based on this affirmation:

"${affirmation}"

Theme: ${theme || "rebuilding strength"}

Rules:
- Exactly 4 short lines, each on its own line
- First-person ("I am", "I will")
- No medical claims
- No religious references unless the affirmation contains them
- Plain text only, no markdown, no quotes, no commentary
`;
  const r = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return (r.text || "").trim();
}

async function generateDailyQuoteText(): Promise<string> {
  const prompt = `You are Sasquatch — a stroke survivor.
Write ONE motivational quote for a stroke survivor today. Two sentences max. First-person or second-person.
No medical claims. No religious language. Punchy. Under 30 words. Plain text only — no quotes around it, no attribution, no commentary.`;
  const r = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return (r.text || "").trim().replace(/^["']|["']$/g, "");
}

export function registerMotivationRoutes(app: Express) {
  // ── Usage / status ──────────────────────────────────────────────────
  app.get("/api/motivation/usage", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const [usage, premium, ttsReady] = await Promise.all([
        getOrCreateUsage(userId),
        isPremiumUser(userId),
        isElevenLabsConfigured(),
      ]);
      res.json({
        month: usage.month,
        anthemCount: usage.anthemCount,
        visionCardCount: usage.visionCardCount,
        limits: premium ? null : FREE_LIMITS,
        premium,
        ttsAvailable: ttsReady,
      });
    } catch (e: any) {
      console.error("[motivation] usage error:", e);
      res.status(500).json({ error: "usage_failed", message: e?.message });
    }
  });

  // ── Anthem Maker ────────────────────────────────────────────────────
  app.post("/api/motivation/anthem/generate", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.claims.sub;
    const parsed = anthemSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { affirmation, theme } = parsed.data;

    const reservation = await reserveQuotaSlot(userId, "anthem");
    if (!reservation.ok) {
      return res.status(402).json({
        error: "free_tier_limit",
        message: `Free tier limit reached: ${reservation.used}/${reservation.limit} anthems this month. Upgrade for unlimited.`,
        used: reservation.used,
        limit: reservation.limit,
      });
    }

    try {
      const lyrics = await generateAnthemLyrics(affirmation, theme);

      let audioUrl: string | null = null;
      try {
        if (await isElevenLabsConfigured()) {
          const buf = await sasquatchSpeak(lyrics);
          audioUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
        }
      } catch (audioErr) {
        console.warn("[motivation] anthem audio failed (continuing without):", audioErr);
      }

      const [artifact] = await db
        .insert(motivationArtifacts)
        .values({
          userId,
          type: "anthem",
          title: affirmation.slice(0, 80),
          payload: { affirmation, theme: theme || null, lyrics } as any,
          audioUrl,
        })
        .returning();

      res.json({ id: artifact.id, lyrics, audioUrl, title: artifact.title });
    } catch (e: any) {
      await refundQuotaSlot(userId, "anthem");
      console.error("[motivation] anthem error:", e);
      res.status(500).json({ error: "anthem_failed", message: e?.message ?? "Generation failed" });
    }
  });

  // ── Vision Card ─────────────────────────────────────────────────────
  app.post("/api/motivation/vision-card/generate", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.claims.sub;
    const parsed = visionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { goal, declaration } = parsed.data;
    const decl = declaration && declaration.trim().length > 0
      ? declaration.trim()
      : `I am becoming the survivor who ${goal.toLowerCase()}.`;

    const reservation = await reserveQuotaSlot(userId, "vision_card");
    if (!reservation.ok) {
      return res.status(402).json({
        error: "free_tier_limit",
        message: `Free tier limit reached: ${reservation.used}/${reservation.limit} vision cards this month. Upgrade for unlimited.`,
        used: reservation.used,
        limit: reservation.limit,
      });
    }

    try {
      let imageUrl: string | null = null;
      try {
        const { generateImageWithImagen, isImagenConfigured } = await import("./imagenService");
        if (isImagenConfigured()) {
          const visualPrompt = `Cinematic, warm-lit, hopeful image symbolizing: ${goal}. Literary warm color palette (cream, antique gold, soft amber, deep brown). No text in the image. No people's faces. Photorealistic, gentle, inspiring.`;
          const out = await generateImageWithImagen(visualPrompt, "16:9");
          if (out?.success && out.imageBase64) {
            imageUrl = `data:${out.mimeType || "image/png"};base64,${out.imageBase64}`;
          } else if (out && !out.success) {
            console.warn("[motivation] vision-card imagen returned not-success:", out.error);
          }
        }
      } catch (imgErr) {
        console.warn("[motivation] vision-card image failed:", imgErr);
      }

      const [artifact] = await db
        .insert(motivationArtifacts)
        .values({
          userId,
          type: "vision_card",
          title: goal.slice(0, 80),
          payload: { goal, declaration: decl } as any,
          imageUrl,
        })
        .returning();

      res.json({ id: artifact.id, imageUrl, declaration: decl, goal });
    } catch (e: any) {
      await refundQuotaSlot(userId, "vision_card");
      console.error("[motivation] vision-card error:", e);
      res.status(500).json({ error: "vision_card_failed", message: e?.message ?? "Generation failed" });
    }
  });

  // ── Daily Quote ─────────────────────────────────────────────────────
  app.get("/api/motivation/quote/today", async (_req: Request, res: Response) => {
    try {
      const date = todayStr();
      const [existing] = await db
        .select()
        .from(dailyQuotes)
        .where(eq(dailyQuotes.date, date))
        .limit(1);
      if (existing) {
        return res.json({ date: existing.date, quote: existing.quote, audioUrl: existing.audioUrl });
      }

      const text = await generateDailyQuoteText();
      let audioUrl: string | null = null;
      try {
        if (await isElevenLabsConfigured()) {
          const buf = await sasquatchSpeak(text);
          audioUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
        }
      } catch (e) {
        console.warn("[motivation] daily quote audio failed:", e);
      }

      await db
        .insert(dailyQuotes)
        .values({ date, quote: text, audioUrl })
        .onConflictDoNothing();

      const [row] = await db
        .select()
        .from(dailyQuotes)
        .where(eq(dailyQuotes.date, date))
        .limit(1);
      res.json({ date, quote: row?.quote ?? text, audioUrl: row?.audioUrl ?? audioUrl });
    } catch (e: any) {
      console.error("[motivation] daily quote error:", e);
      res.status(500).json({ error: "quote_failed", message: e?.message });
    }
  });

  // ── List user's recent artifacts ────────────────────────────────────
  app.get("/api/motivation/artifacts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const rows = await db
        .select()
        .from(motivationArtifacts)
        .where(eq(motivationArtifacts.userId, userId))
        .orderBy(desc(motivationArtifacts.createdAt))
        .limit(20);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: "artifacts_failed", message: e?.message });
    }
  });
}
