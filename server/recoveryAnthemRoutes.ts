import type { Express, Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { publicRateLimit } from "./middleware/publicRateLimit";
import { motivationUsage, recoveryAnthems } from "@shared/schema";
import {
  previewAnthem,
  renderAnthem,
  type EngineResult,
} from "./services/recoveryAnthem/recoveryAnthemEngine";
import { composeInputSchema } from "./services/recoveryAnthem/recoveryAnthemSchema";
import { isElevenLabsConfigured } from "./elevenlabs";

const FREE_RENDER_LIMIT = 1;
const PREMIUM_TIERS = new Set(["creator", "pro", "enterprise"]);

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
      anthemBuilderCount: 0,
    })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(motivationUsage)
    .where(and(eq(motivationUsage.userId, userId), eq(motivationUsage.month, month)))
    .limit(1);
  return row!;
}

async function reserveAnthem(
  userId: string,
): Promise<{ ok: true } | { ok: false; used: number; limit: number }> {
  if (await isPremium(userId)) return { ok: true };
  const month = thisMonth();
  await ensureUsage(userId);
  const result = await db.execute(sql`
    UPDATE motivation_usage
    SET anthem_builder_count = anthem_builder_count + 1, updated_at = now()
    WHERE user_id = ${userId} AND month = ${month} AND anthem_builder_count < ${FREE_RENDER_LIMIT}
    RETURNING anthem_builder_count
  `);
  const rows = (result as any).rows ?? [];
  if (rows.length > 0) return { ok: true };
  const usage = await ensureUsage(userId);
  return { ok: false, used: usage.anthemBuilderCount, limit: FREE_RENDER_LIMIT };
}

async function refundAnthem(userId: string): Promise<void> {
  if (await isPremium(userId)) return;
  const month = thisMonth();
  await db.execute(sql`
    UPDATE motivation_usage
    SET anthem_builder_count = GREATEST(anthem_builder_count - 1, 0), updated_at = now()
    WHERE user_id = ${userId} AND month = ${month}
  `);
}

function mintShareId(): string {
  return crypto.randomBytes(9).toString("base64url");
}

export function registerRecoveryAnthemRoutes(app: Express) {
  // ── Free preview (script only, no music synthesis) ─────────────────
  app.post("/api/recovery/anthem/preview", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = composeInputSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "bad_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }
      const result = await previewAnthem({ userId, input: parsed.data });
      return res.json(result);
    } catch (e: any) {
      console.error("[anthem] preview error:", e?.message ?? e);
      return res
        .status(500)
        .json({ error: "preview_failed", message: e?.message ?? "Preview failed" });
    }
  });

  // ── Paid render (script + ElevenLabs Music) ────────────────────────
  app.post("/api/recovery/anthem/compose", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.claims.sub;
    const parsed = composeInputSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "bad_input",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    if (!(await isElevenLabsConfigured())) {
      return res
        .status(503)
        .json({ error: "music_unavailable", message: "Music engine is offline." });
    }

    const reservation = await reserveAnthem(userId);
    if (!reservation.ok) {
      return res.status(402).json({
        error: "free_tier_limit",
        message: `Free tier limit reached: ${reservation.used}/${reservation.limit} anthem(s) this month. Upgrade for unlimited.`,
        used: reservation.used,
        limit: reservation.limit,
      });
    }

    let result: EngineResult;
    try {
      result = await renderAnthem({ userId, input: parsed.data });
    } catch (e: any) {
      await refundAnthem(userId);
      console.error("[anthem] render error:", e?.message ?? e);
      return res
        .status(500)
        .json({ error: "render_failed", message: e?.message ?? "Render failed" });
    }

    if (result.shape !== "anthem") {
      // Crisis / clarification / refused — refund, no anthem persisted.
      await refundAnthem(userId);
      return res.json(result);
    }

    let row;
    try {
      const audioUrl = `data:${result.audioMimeType};base64,${result.audioBase64}`;
      [row] = await db
        .insert(recoveryAnthems)
        .values({
          userId,
          inputData: parsed.data as any,
          scriptData: result.script as any,
          title: result.script.title,
          audioUrl,
          durationMs: result.durationMs,
          bpm: result.script.bpm,
          isShared: false,
          shareId: null,
        })
        .returning();
    } catch (dbErr: any) {
      await refundAnthem(userId);
      console.error("[anthem] persist failed:", dbErr?.message ?? dbErr);
      return res
        .status(500)
        .json({ error: "persist_failed", message: dbErr?.message ?? "Save failed" });
    }

    return res.json({
      shape: "anthem",
      id: row.id,
      title: row.title,
      script: result.script,
      audioUrl: row.audioUrl,
      durationMs: row.durationMs,
      bpm: row.bpm,
      isShared: false,
      shareId: null,
      createdAt: row.createdAt,
    });
  });

  // ── List user's anthems ────────────────────────────────────────────
  app.get("/api/recovery/anthem/list", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const rows = await db
        .select({
          id: recoveryAnthems.id,
          title: recoveryAnthems.title,
          scriptData: recoveryAnthems.scriptData,
          audioUrl: recoveryAnthems.audioUrl,
          durationMs: recoveryAnthems.durationMs,
          bpm: recoveryAnthems.bpm,
          isShared: recoveryAnthems.isShared,
          shareId: recoveryAnthems.shareId,
          createdAt: recoveryAnthems.createdAt,
        })
        .from(recoveryAnthems)
        .where(eq(recoveryAnthems.userId, userId))
        .orderBy(desc(recoveryAnthems.createdAt))
        .limit(40);
      return res.json(rows);
    } catch (e: any) {
      return res.status(500).json({ error: "list_failed", message: e?.message });
    }
  });

  // ── Toggle public share ────────────────────────────────────────────
  app.post(
    "/api/recovery/anthem/:id/share",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

        const desired = z.object({ isShared: z.boolean() }).safeParse(req.body ?? {});
        if (!desired.success) return res.status(400).json({ error: "bad_input" });

        const [anthem] = await db
          .select()
          .from(recoveryAnthems)
          .where(and(eq(recoveryAnthems.id, id), eq(recoveryAnthems.userId, userId)))
          .limit(1);
        if (!anthem) return res.status(404).json({ error: "not_found" });

        let nextShareId = anthem.shareId;
        if (desired.data.isShared && !nextShareId) {
          nextShareId = mintShareId();
        }

        await db
          .update(recoveryAnthems)
          .set({
            isShared: desired.data.isShared,
            shareId: desired.data.isShared ? nextShareId : null,
          })
          .where(eq(recoveryAnthems.id, id));

        return res.json({
          isShared: desired.data.isShared,
          shareId: desired.data.isShared ? nextShareId : null,
        });
      } catch (e: any) {
        console.error("[anthem] share toggle error:", e?.message ?? e);
        return res
          .status(500)
          .json({ error: "share_failed", message: e?.message });
      }
    },
  );

  // ── Public share (no auth) ─────────────────────────────────────────
  const anthemShareLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 30,
    bucketName: "anthem-share",
  });

  app.get(
    "/api/recovery/anthem/share/:shareId",
    anthemShareLimiter,
    async (req: Request, res: Response) => {
      try {
        const shareId = String(req.params.shareId || "");
        if (!shareId || shareId.length > 64) return res.status(404).json({ error: "not_found" });
        const [row] = await db
          .select({
            id: recoveryAnthems.id,
            title: recoveryAnthems.title,
            scriptData: recoveryAnthems.scriptData,
            audioUrl: recoveryAnthems.audioUrl,
            durationMs: recoveryAnthems.durationMs,
            bpm: recoveryAnthems.bpm,
            createdAt: recoveryAnthems.createdAt,
          })
          .from(recoveryAnthems)
          .where(and(eq(recoveryAnthems.shareId, shareId), eq(recoveryAnthems.isShared, true)))
          .limit(1);
        if (!row) return res.status(404).json({ error: "not_found" });
        return res.json(row);
      } catch (e: any) {
        console.error("[anthem] public share error:", e?.message ?? e);
        return res.status(500).json({ error: "share_fetch_failed" });
      }
    },
  );

  // ── Usage status ───────────────────────────────────────────────────
  app.get("/api/recovery/anthem/usage", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const [usage, premium] = await Promise.all([ensureUsage(userId), isPremium(userId)]);
      return res.json({
        month: usage.month,
        anthemBuilderCount: usage.anthemBuilderCount,
        limit: premium ? null : FREE_RENDER_LIMIT,
        premium,
      });
    } catch (e: any) {
      return res.status(500).json({ error: "usage_failed", message: e?.message });
    }
  });
}
