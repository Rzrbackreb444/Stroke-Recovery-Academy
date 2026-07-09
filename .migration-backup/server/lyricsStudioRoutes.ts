import type { Express, Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { publicRateLimit } from "./middleware/publicRateLimit";
import { getUserId } from "./lib/authUtils";
import { motivationUsage, lyricsDrafts } from "@shared/schema";
import { generateLyrics, type EngineResult } from "./services/lyricsStudio/lyricsStudioEngine";
import { GENRES, SINGER_TYPES } from "./services/lyricsStudio/lyricsStudioSchema";

const FREE_DRAFT_LIMIT = 1;
const PREMIUM_TIERS = new Set(["creator", "pro", "enterprise"]);

const generateSchema = z.object({
  storyText: z.string().min(10).max(5000),
  genre: z.enum(GENRES),
  singer: z.enum(SINGER_TYPES),
});

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function isPremium(userId: string): Promise<boolean> {
  try {
    const { getUserTier } = await import("./subscriptionTierService");
    const tier = await getUserTier(userId);
    return PREMIUM_TIERS.has(tier);
  } catch {
    return false;
  }
}

async function ensureUsage(userId: string) {
  const month = thisMonth();
  await db
    .insert(motivationUsage)
    .values({
      userId,
      month,
      anthemCount: 0,
      visionCardCount: 0,
      anchorRenderCount: 0,
      lyricsDraftCount: 0,
    })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(motivationUsage)
    .where(and(eq(motivationUsage.userId, userId), eq(motivationUsage.month, month)))
    .limit(1);
  return row!;
}

async function reserveDraft(
  userId: string,
): Promise<{ ok: true } | { ok: false; used: number; limit: number }> {
  if (await isPremium(userId)) return { ok: true };
  const month = thisMonth();
  await ensureUsage(userId);
  const result = await db.execute(sql`
    UPDATE motivation_usage
    SET lyrics_draft_count = lyrics_draft_count + 1, updated_at = now()
    WHERE user_id = ${userId} AND month = ${month} AND lyrics_draft_count < ${FREE_DRAFT_LIMIT}
    RETURNING lyrics_draft_count
  `);
  const rows = (result as any).rows ?? [];
  if (rows.length > 0) return { ok: true };
  const usage = await ensureUsage(userId);
  return { ok: false, used: usage.lyricsDraftCount ?? 0, limit: FREE_DRAFT_LIMIT };
}

async function refundDraft(userId: string): Promise<void> {
  if (await isPremium(userId)) return;
  const month = thisMonth();
  await db.execute(sql`
    UPDATE motivation_usage
    SET lyrics_draft_count = GREATEST(lyrics_draft_count - 1, 0), updated_at = now()
    WHERE user_id = ${userId} AND month = ${month}
  `);
}

function mintShareId(): string {
  return crypto.randomBytes(9).toString("base64url");
}

export function registerLyricsStudioRoutes(app: Express) {
  // Burst limiter for the Gemini-spend path. Even premium users (unlimited
  // monthly drafts) are throttled per minute so a compromised premium
  // session cannot rapidly drive expensive LLM traffic. Keyed by user-id
  // when authenticated, falls back to IP.
  const generateBurstLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 6,
    bucketName: "lyrics-generate",
    keyFn: (req) => getUserId(req as any) ?? (req.ip ?? "anon"),
  });

  // ── Generate (paid, charges lyricsDraftCount, persists) ────────────
  app.post("/api/lyrics/generate", isAuthenticated, generateBurstLimiter, async (req: any, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const parsed = generateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "bad_input",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const reservation = await reserveDraft(userId);
    if (!reservation.ok) {
      return res.status(402).json({
        error: "free_tier_limit",
        message: `Free tier: ${reservation.used}/${reservation.limit} lyric draft this month. Upgrade to premium for unlimited drafts.`,
        used: reservation.used,
        limit: reservation.limit,
      });
    }

    let result: EngineResult;
    try {
      result = await generateLyrics({
        userId,
        storyText: parsed.data.storyText,
        genre: parsed.data.genre,
        singer: parsed.data.singer,
      });
    } catch (e: any) {
      await refundDraft(userId);
      console.error("[lyrics] engine error:", e?.message ?? e);
      return res.status(500).json({ error: "generate_failed", message: e?.message ?? "Generation failed" });
    }

    if (result.shape !== "lyrics") {
      // Crisis or refused — engine produced no lyric, refund the slot.
      await refundDraft(userId);
      return res.json(result);
    }

    let row;
    try {
      [row] = await db
        .insert(lyricsDrafts)
        .values({
          userId,
          storyText: parsed.data.storyText,
          genre: parsed.data.genre,
          singer: parsed.data.singer,
          lyricsData: result.output as any,
          isShared: false,
          shareId: null,
        })
        .returning();
    } catch (dbErr: any) {
      await refundDraft(userId);
      console.error("[lyrics] persist failed:", dbErr?.message ?? dbErr);
      return res.status(500).json({ error: "persist_failed", message: dbErr?.message ?? "Save failed" });
    }

    return res.json({
      shape: "lyrics",
      id: row.id,
      output: result.output,
      isShared: false,
      shareId: null,
      createdAt: row.createdAt,
    });
  });

  // ── List user's drafts ─────────────────────────────────────────────
  app.get("/api/lyrics/list", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const rows = await db
        .select()
        .from(lyricsDrafts)
        .where(eq(lyricsDrafts.userId, userId))
        .orderBy(desc(lyricsDrafts.createdAt))
        .limit(40);
      return res.json(rows);
    } catch (e: any) {
      return res.status(500).json({ error: "list_failed", message: e?.message });
    }
  });

  // ── Get one draft (owner only) ─────────────────────────────────────
  app.get("/api/lyrics/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const [row] = await db
        .select()
        .from(lyricsDrafts)
        .where(and(eq(lyricsDrafts.id, id), eq(lyricsDrafts.userId, userId)))
        .limit(1);
      if (!row) return res.status(404).json({ error: "not_found" });
      return res.json(row);
    } catch (e: any) {
      return res.status(500).json({ error: "fetch_failed", message: e?.message });
    }
  });

  // ── Delete draft (owner only) ──────────────────────────────────────
  app.delete("/api/lyrics/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const result = await db
        .delete(lyricsDrafts)
        .where(and(eq(lyricsDrafts.id, id), eq(lyricsDrafts.userId, userId)));
      return res.json({ ok: true, count: (result as any).rowCount ?? 0 });
    } catch (e: any) {
      return res.status(500).json({ error: "delete_failed", message: e?.message });
    }
  });

  // ── Toggle public share (consent-gated, mirrors Anchor pattern) ────
  app.post("/api/lyrics/:id/share", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const desired = z.object({ isShared: z.boolean() }).safeParse(req.body ?? {});
      if (!desired.success) return res.status(400).json({ error: "bad_input" });

      const [draft] = await db
        .select()
        .from(lyricsDrafts)
        .where(and(eq(lyricsDrafts.id, id), eq(lyricsDrafts.userId, userId)))
        .limit(1);
      if (!draft) return res.status(404).json({ error: "not_found" });

      let nextShareId = draft.shareId;
      if (desired.data.isShared && !nextShareId) {
        nextShareId = mintShareId();
      }

      await db
        .update(lyricsDrafts)
        .set({
          isShared: desired.data.isShared,
          shareId: desired.data.isShared ? nextShareId : null,
        })
        .where(eq(lyricsDrafts.id, id));

      return res.json({
        isShared: desired.data.isShared,
        shareId: desired.data.isShared ? nextShareId : null,
      });
    } catch (e: any) {
      console.error("[lyrics] share toggle error:", e?.message ?? e);
      return res.status(500).json({ error: "share_failed", message: e?.message });
    }
  });

  // ── Public share (no auth, rate-limited) ───────────────────────────
  const lyricsShareLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 30,
    bucketName: "lyrics-share",
  });

  app.get("/api/lyrics/share/:shareId", lyricsShareLimiter, async (req: Request, res: Response) => {
    try {
      const shareId = String(req.params.shareId || "");
      if (!shareId || shareId.length > 64) return res.status(404).json({ error: "not_found" });
      const [row] = await db
        .select({
          id: lyricsDrafts.id,
          genre: lyricsDrafts.genre,
          singer: lyricsDrafts.singer,
          lyricsData: lyricsDrafts.lyricsData,
          createdAt: lyricsDrafts.createdAt,
        })
        .from(lyricsDrafts)
        .where(and(eq(lyricsDrafts.shareId, shareId), eq(lyricsDrafts.isShared, true)))
        .limit(1);
      if (!row) return res.status(404).json({ error: "not_found" });
      return res.json(row);
    } catch (e: any) {
      console.error("[lyrics] public share error:", e?.message ?? e);
      return res.status(500).json({ error: "share_fetch_failed" });
    }
  });

  // ── Usage status ───────────────────────────────────────────────────
  app.get("/api/lyrics/usage", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const [usage, premium] = await Promise.all([ensureUsage(userId), isPremium(userId)]);
      return res.json({
        month: usage.month,
        lyricsDraftCount: usage.lyricsDraftCount ?? 0,
        limit: premium ? null : FREE_DRAFT_LIMIT,
        premium,
      });
    } catch (e: any) {
      return res.status(500).json({ error: "usage_failed", message: e?.message });
    }
  });
}
