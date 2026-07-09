import type { Express, Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { publicRateLimit } from "./middleware/publicRateLimit";
import {
  motivationUsage,
  recoveryAnchors,
  anchorStreaks,
  anchorRetentionSignals,
} from "@shared/schema";
import {
  auditAnchor,
  renderAnchor,
  type EngineResult,
} from "./services/recoveryAnchor/recoveryAnchorEngine";
import { ANCHOR_TYPES } from "./services/recoveryAnchor/recoveryAnchorSchema";
import { sasquatchSpeak, isElevenLabsConfigured } from "./elevenlabs";
import { getUserId } from "./lib/authUtils";
import { uploadAudioBuffer, setAudioObjectVisibility } from "./lib/audioStorage";

const FREE_RENDER_LIMIT = 3;
const PREMIUM_TIERS = new Set(["creator", "pro", "enterprise"]);

const inputSchema = z.object({
  anchorType: z.enum(ANCHOR_TYPES),
  text: z.string().min(3).max(2000),
});

const checkInSchema = z.object({
  status: z.enum(["remembered", "struggled", "forgot"]),
});

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function isPremium(userId: string): Promise<boolean> {
  // Survivor-side $19/mo Sasquatch Premium also grants unlimited renders.
  // Checked first because it's a single Stripe lookup with a 60s cache,
  // whereas getUserTier() touches user_subscriptions + tier config.
  try {
    const { isSasquatchPremium } = await import("./services/sasquatchPremiumService");
    if (await isSasquatchPremium(userId)) return true;
  } catch (e: any) {
    console.warn("[recovery-anchor] sasquatch premium check failed:", e?.message ?? e);
  }
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
    .values({ userId, month, anthemCount: 0, visionCardCount: 0, anchorRenderCount: 0 })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(motivationUsage)
    .where(and(eq(motivationUsage.userId, userId), eq(motivationUsage.month, month)))
    .limit(1);
  return row!;
}

async function reserveRender(userId: string): Promise<{ ok: true } | { ok: false; used: number; limit: number }> {
  if (await isPremium(userId)) return { ok: true };
  const month = thisMonth();
  await ensureUsage(userId);
  const result = await db.execute(sql`
    UPDATE motivation_usage
    SET anchor_render_count = anchor_render_count + 1, updated_at = now()
    WHERE user_id = ${userId} AND month = ${month} AND anchor_render_count < ${FREE_RENDER_LIMIT}
    RETURNING anchor_render_count
  `);
  const rows = (result as any).rows ?? [];
  if (rows.length > 0) return { ok: true };
  const usage = await ensureUsage(userId);
  return { ok: false, used: usage.anchorRenderCount, limit: FREE_RENDER_LIMIT };
}

async function refundRender(userId: string): Promise<void> {
  if (await isPremium(userId)) return;
  const month = thisMonth();
  await db.execute(sql`
    UPDATE motivation_usage
    SET anchor_render_count = GREATEST(anchor_render_count - 1, 0), updated_at = now()
    WHERE user_id = ${userId} AND month = ${month}
  `);
}

function lyricsForVoice(result: Extract<EngineResult, { shape: "anchor" }>): string {
  const o = result.output;
  // For speech anchors, render call+response as Sasquatch's call lines only.
  // The survivor will echo each line themselves.
  if (o.callResponse && o.callResponse.sasquatch.length > 0) {
    return o.callResponse.sasquatch.join(". ");
  }
  return o.lines.join(". ");
}

function mintShareId(): string {
  // 12-char URL-safe slug. Collision risk effectively zero at our scale.
  return crypto.randomBytes(9).toString("base64url");
}

async function syncStreakOnRender(userId: string, anchorId: number): Promise<void> {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const [existing] = await db
    .select()
    .from(anchorStreaks)
    .where(eq(anchorStreaks.userId, userId))
    .limit(1);

  if (!existing) {
    await db.insert(anchorStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCheckInDate: today,
      todayAnchorId: anchorId,
    });
    return;
  }

  // Always set this as today's anchor, but only advance the streak if this
  // is a new day. Multiple renders on the same day shouldn't pad the streak.
  let newCurrent = existing.currentStreak;
  if (existing.lastCheckInDate !== today) {
    newCurrent = existing.lastCheckInDate === yesterday ? existing.currentStreak + 1 : 1;
  }
  const newLongest = Math.max(existing.longestStreak, newCurrent);
  await db
    .update(anchorStreaks)
    .set({
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastCheckInDate: today,
      todayAnchorId: anchorId,
      updatedAt: new Date(),
    })
    .where(eq(anchorStreaks.userId, userId));
}

export function registerRecoveryAnchorRoutes(app: Express) {
  // ── Free preview (no quota charge) ─────────────────────────────────
  app.post("/api/recovery/anchor/audit", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const parsed = inputSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Invalid input" });
      }
      const { anchorType, text } = parsed.data;
      const result = await auditAnchor({ userId, anchorType, text });
      return res.json(result);
    } catch (e: any) {
      console.error("[anchor] audit error:", e?.message ?? e);
      return res.status(500).json({ error: "audit_failed", message: e?.message ?? "Audit failed" });
    }
  });

  // ── Paid render (charges anchorRenderCount, persists, voices) ──────
  app.post("/api/recovery/anchor/render", isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const parsed = inputSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { anchorType, text } = parsed.data;

    const reservation = await reserveRender(userId);
    if (!reservation.ok) {
      return res.status(402).json({
        error: "free_tier_limit",
        message: `Free tier limit reached: ${reservation.used}/${reservation.limit} anchor renders this month. Upgrade for unlimited.`,
        used: reservation.used,
        limit: reservation.limit,
      });
    }

    let result: EngineResult;
    try {
      result = await renderAnchor({ userId, anchorType, text });
    } catch (e: any) {
      await refundRender(userId);
      console.error("[anchor] render engine error:", e?.message ?? e);
      return res.status(500).json({ error: "render_failed", message: e?.message ?? "Render failed" });
    }

    // Crisis / clarification / refused — engine already wrote audit row,
    // refund the render slot since no anchor was produced.
    if (result.shape !== "anchor") {
      await refundRender(userId);
      return res.json(result);
    }

    // Compose voice. Failures are non-fatal; the anchor still saves without audio.
    let audioUrl: string | null = null;
    try {
      if (await isElevenLabsConfigured()) {
        const buf = await sasquatchSpeak(lyricsForVoice(result));
        // Upload to object storage (private — owner-only until explicitly shared).
        audioUrl = await uploadAudioBuffer({
          buffer: buf,
          contentType: "audio/mpeg",
          owner: userId,
          visibility: "private",
          context: "anchor",
        });
      }
    } catch (audioErr) {
      console.warn("[anchor] voice synth/upload failed (continuing without audio):", (audioErr as any)?.message ?? audioErr);
    }

    let row;
    try {
      [row] = await db
        .insert(recoveryAnchors)
        .values({
          userId,
          anchorType,
          inputText: text,
          anchorData: result.output as any,
          audioUrl,
          isShared: false,
          shareId: null,
        })
        .returning();
    } catch (dbErr: any) {
      await refundRender(userId);
      console.error("[anchor] persist failed:", dbErr?.message ?? dbErr);
      return res.status(500).json({ error: "persist_failed", message: dbErr?.message ?? "Save failed" });
    }

    try {
      await syncStreakOnRender(userId, row.id);
    } catch (streakErr: any) {
      console.warn("[anchor] streak sync failed:", streakErr?.message ?? streakErr);
    }

    return res.json({
      shape: "anchor",
      id: row.id,
      output: result.output,
      audioUrl,
      isShared: false,
      shareId: null,
      createdAt: row.createdAt,
    });
  });

  // ── Retention signal (data flywheel) ───────────────────────────────
  app.post("/api/recovery/anchor/:id/check-in", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const parsed = checkInSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Invalid input" });
      }

      // Must own the anchor.
      const [anchor] = await db
        .select({ id: recoveryAnchors.id })
        .from(recoveryAnchors)
        .where(and(eq(recoveryAnchors.id, id), eq(recoveryAnchors.userId, userId)))
        .limit(1);
      if (!anchor) return res.status(404).json({ error: "not_found" });

      await db.insert(anchorRetentionSignals).values({
        userId,
        anchorId: id,
        status: parsed.data.status,
      });
      return res.json({ ok: true });
    } catch (e: any) {
      console.error("[anchor] check-in error:", e?.message ?? e);
      return res.status(500).json({ error: "check_in_failed", message: e?.message });
    }
  });

  // ── Today's anchor + streak (daily-habit surface) ──────────────────
  app.get("/api/recovery/anchor/today", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const today = todayStr();
      const yesterday = yesterdayStr();

      const [streakRow] = await db
        .select()
        .from(anchorStreaks)
        .where(eq(anchorStreaks.userId, userId))
        .limit(1);

      // Reset stale streaks: if last check-in is older than yesterday,
      // currentStreak rolls to 0 in the response (not yet persisted —
      // persist on the next render or check-in).
      let currentStreak = streakRow?.currentStreak ?? 0;
      if (streakRow?.lastCheckInDate && streakRow.lastCheckInDate < yesterday) {
        currentStreak = 0;
      }

      let todayAnchor: any = null;
      if (streakRow?.todayAnchorId) {
        const [a] = await db
          .select()
          .from(recoveryAnchors)
          .where(and(eq(recoveryAnchors.id, streakRow.todayAnchorId), eq(recoveryAnchors.userId, userId)))
          .limit(1);
        if (a) todayAnchor = a;
      }

      // Yesterday's anchor (if any) — used to ask the retention check.
      let yesterdayAnchor: any = null;
      if (streakRow?.lastCheckInDate === yesterday && streakRow.todayAnchorId) {
        // The "todayAnchorId" is the most recent — if last check-in was
        // yesterday, that IS yesterday's anchor.
        yesterdayAnchor = todayAnchor;
      }

      // True retention check: did this user submit ANY check-in today?
      // The streak's `lastCheckInDate` advances on render/set-today, so it
      // can't tell us whether the user actually answered the yesterday
      // prompt today. Query the retention signals table directly so the
      // UI guard hides the prompt as soon as a check-in lands.
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [{ count: signalsToday } = { count: 0 }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(anchorRetentionSignals)
        .where(
          and(
            eq(anchorRetentionSignals.userId, userId),
            sql`${anchorRetentionSignals.signaledAt} >= ${todayStart}`,
          ),
        );

      return res.json({
        date: today,
        currentStreak,
        longestStreak: streakRow?.longestStreak ?? 0,
        lastCheckInDate: streakRow?.lastCheckInDate ?? null,
        checkedInToday: (signalsToday ?? 0) > 0,
        todayAnchor,
        yesterdayAnchor,
      });
    } catch (e: any) {
      console.error("[anchor] today error:", e?.message ?? e);
      return res.status(500).json({ error: "today_failed", message: e?.message });
    }
  });

  // ── List user's anchors ────────────────────────────────────────────
  app.get("/api/recovery/anchor/list", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const rows = await db
        .select()
        .from(recoveryAnchors)
        .where(eq(recoveryAnchors.userId, userId))
        .orderBy(desc(recoveryAnchors.createdAt))
        .limit(40);
      return res.json(rows);
    } catch (e: any) {
      return res.status(500).json({ error: "list_failed", message: e?.message });
    }
  });

  // ── Set as today's anchor (without re-rendering) ───────────────────
  app.post("/api/recovery/anchor/:id/set-today", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

      const [anchor] = await db
        .select({ id: recoveryAnchors.id })
        .from(recoveryAnchors)
        .where(and(eq(recoveryAnchors.id, id), eq(recoveryAnchors.userId, userId)))
        .limit(1);
      if (!anchor) return res.status(404).json({ error: "not_found" });

      await syncStreakOnRender(userId, id);
      return res.json({ ok: true });
    } catch (e: any) {
      console.error("[anchor] set-today error:", e?.message ?? e);
      return res.status(500).json({ error: "set_today_failed", message: e?.message });
    }
  });

  // ── Toggle public share (consent-gated) ────────────────────────────
  app.post("/api/recovery/anchor/:id/share", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

      const desired = z.object({ isShared: z.boolean() }).safeParse(req.body ?? {});
      if (!desired.success) return res.status(400).json({ error: "bad_input" });

      const [anchor] = await db
        .select()
        .from(recoveryAnchors)
        .where(and(eq(recoveryAnchors.id, id), eq(recoveryAnchors.userId, userId)))
        .limit(1);
      if (!anchor) return res.status(404).json({ error: "not_found" });

      let nextShareId = anchor.shareId;
      if (desired.data.isShared && !nextShareId) {
        nextShareId = mintShareId();
      }

      await db
        .update(recoveryAnchors)
        .set({
          isShared: desired.data.isShared,
          shareId: desired.data.isShared ? nextShareId : null,
        })
        .where(eq(recoveryAnchors.id, id));

      // Flip the audio ACL so share-page visitors can stream it (or lock back).
      await setAudioObjectVisibility(
        anchor.audioUrl,
        desired.data.isShared ? "public" : "private",
        userId,
      );

      return res.json({
        isShared: desired.data.isShared,
        shareId: desired.data.isShared ? nextShareId : null,
      });
    } catch (e: any) {
      console.error("[anchor] share toggle error:", e?.message ?? e);
      return res.status(500).json({ error: "share_failed", message: e?.message });
    }
  });

  // ── Public share (no auth) ─────────────────────────────────────────
  // Per-IP limiter on the public, unauthenticated share surface — prevents
  // share-id enumeration / scraping. 30 reads/min/IP is generous for normal
  // social-share traffic and cheap to serve from the projection-only query.
  const anchorShareLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 30,
    bucketName: "anchor-share",
  });

  app.get("/api/recovery/anchor/share/:shareId", anchorShareLimiter, async (req: Request, res: Response) => {
    try {
      const shareId = String(req.params.shareId || "");
      if (!shareId || shareId.length > 64) return res.status(404).json({ error: "not_found" });
      const [row] = await db
        .select({
          id: recoveryAnchors.id,
          anchorType: recoveryAnchors.anchorType,
          anchorData: recoveryAnchors.anchorData,
          audioUrl: recoveryAnchors.audioUrl,
          createdAt: recoveryAnchors.createdAt,
        })
        .from(recoveryAnchors)
        .where(and(eq(recoveryAnchors.shareId, shareId), eq(recoveryAnchors.isShared, true)))
        .limit(1);
      if (!row) return res.status(404).json({ error: "not_found" });
      return res.json(row);
    } catch (e: any) {
      console.error("[anchor] public share error:", e?.message ?? e);
      return res.status(500).json({ error: "share_fetch_failed" });
    }
  });

  // ── Usage status (extends motivation usage with anchor counter) ────
  app.get("/api/recovery/anchor/usage", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const [usage, premium] = await Promise.all([ensureUsage(userId), isPremium(userId)]);
      return res.json({
        month: usage.month,
        anchorRenderCount: usage.anchorRenderCount,
        limit: premium ? null : FREE_RENDER_LIMIT,
        premium,
      });
    } catch (e: any) {
      return res.status(500).json({ error: "usage_failed", message: e?.message });
    }
  });
}
