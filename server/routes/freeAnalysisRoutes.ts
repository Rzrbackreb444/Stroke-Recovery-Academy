/**
 * Free Video Analysis routes — public submission, status polling, admin
 * moderation, and the public approved-testimonials feed.
 *
 * Submission is INTENTIONALLY public (no auth) — this is a top-of-funnel
 * lead-gen surface. Defenses:
 *   - publicRateLimit (5/min per IP) on the submit endpoint.
 *   - Multer caps: 100MB and video/* mime only.
 *   - Zod-validated body. Email format enforced.
 *   - Returned `publicToken` is the only handle the client gets back; the
 *     status endpoint requires it (so a stranger can't enumerate row IDs).
 *
 * Heavy work (Whisper transcription + Gemini multimodal analysis) runs in
 * a fire-and-forget background task. The client polls GET /by-token/:t
 * until status flips from "processing" to "complete" or "failed".
 */
import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import { eq, desc, and, lt } from "drizzle-orm";
import { db } from "../db";
import { freeVideoAnalyses, type FreeVideoAnalysis } from "@shared/schema";
import { publicRateLimit } from "../middleware/publicRateLimit";
import { requireAdmin } from "../middleware/requireAdmin";
import { transcribeVideo } from "../videoTranscription";
import { analyzeFreeVideo } from "../services/freeAnalysis/freeAnalysisEngine";

// ── Crash-recovery sweep (invoked by the durable scheduler) ──────────────
// The submission pipeline runs as a fire-and-forget background task. If the
// process restarts mid-analysis (deploy, OOM, anything), the row would be stuck
// in "processing" forever and the polling client would spin until the user gave
// up. Mark anything older than the stale window that's still "processing" as
// "failed" with a clear, retry-friendly message. Migrated off a per-process
// setTimeout/setInterval to the durable scheduler (job "free-analysis-reap"):
// single-fires across instances and is observable in the admin panel. Errors
// bubble up so the scheduler records the failure.
const FREE_ANALYSIS_STALE_AFTER_MS = 10 * 60_000;
export async function runFreeAnalysisReap() {
  const cutoff = new Date(Date.now() - FREE_ANALYSIS_STALE_AFTER_MS);
  const reaped = await db.update(freeVideoAnalyses).set({
    status: "failed",
    errorMessage: "Processing timed out. Please resubmit your video.",
    completedAt: new Date(),
  }).where(and(
    eq(freeVideoAnalyses.status, "processing"),
    lt(freeVideoAnalyses.submittedAt, cutoff),
  )).returning({ id: freeVideoAnalyses.id });
  if (reaped.length > 0) {
    console.warn(`[free-analysis] reaped ${reaped.length} stale processing rows`);
  }
}

// ── Validation ─────────────────────────────────────────────────────────
const submitBodySchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(120),
  email: z.string().trim().toLowerCase().email("That email looks off."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  storyText: z.string().trim().max(2000).optional().or(z.literal("")),
  recoveryStage: z.enum(["acute", "subacute", "chronic", "unsure"]).optional(),
  focusArea: z.enum(["speech", "mobility", "cognition", "overall", "other"]).optional(),
  consentToShare: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on" || v === "1"),
  consentToContact: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on" || v === "1").optional(),
});

// 5 submissions per IP per 15 min — enough for a retry, not a flood.
const submitLimiter = publicRateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  bucketName: "free-analysis-submit",
});

// 60 polls per minute per IP — covers the worst-case 1Hz polling client.
const pollLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 60,
  bucketName: "free-analysis-poll",
});

function clientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function sanitizeForPublic(row: FreeVideoAnalysis) {
  // Strip PII when streaming back during poll. The poller only needs to
  // know status + analysis; the submitter already knows their own name.
  return {
    publicToken: row.publicToken,
    status: row.status,
    submittedAt: row.submittedAt,
    completedAt: row.completedAt,
    durationSec: row.durationSec,
    errorMessage: row.errorMessage,
    analysis: row.analysisJson,
    // Echo back the submitter's first name so the UI can greet them.
    firstName: (row.name || "").split(/\s+/)[0] || "",
    consentToShare: row.consentToShare,
  };
}

export function registerFreeAnalysisRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const subDir = path.join(uploadsDir, "free-analysis");
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, subDir),
    filename: (_req, file, cb) => {
      const safeExt = (path.extname(file.originalname || "") || ".mp4")
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 10);
      cb(null, `free-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024, files: 1 }, // 100MB cap
    fileFilter: (_req, file, cb) => {
      const okExt = /\.(mp4|mov|webm|m4v|mkv)$/i.test(file.originalname || "");
      const okMime = /^video\//i.test(file.mimetype || "");
      if (okExt || okMime) return cb(null, true);
      cb(new Error("Only video files are supported (mp4, mov, webm).") as any, false);
    },
  });

  // ── POST /api/free-analysis/submit ──────────────────────────────────
  app.post(
    "/api/free-analysis/submit",
    submitLimiter,
    upload.single("video"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) return res.status(400).json({ message: "Please attach a video file." });

        const parsed = submitBodySchema.safeParse(req.body || {});
        if (!parsed.success) {
          // Best-effort cleanup — we never want orphan multer files.
          try { fs.unlinkSync(req.file.path); } catch {}
          const first = parsed.error.issues[0];
          return res.status(400).json({
            message: first ? `${first.path.join(".") || "field"}: ${first.message}` : "Invalid form.",
            issues: parsed.error.issues,
          });
        }

        if (!parsed.data.consentToShare) {
          try { fs.unlinkSync(req.file.path); } catch {}
          return res.status(400).json({
            message: "Free analysis requires permission to share your testimonial. You can stay anonymous on the public page.",
          });
        }

        const publicToken = crypto.randomBytes(18).toString("base64url");
        const videoUrl = `/uploads/free-analysis/${path.basename(req.file.path)}`;
        const mimeType = req.file.mimetype || "video/mp4";

        const [row] = await db.insert(freeVideoAnalyses).values({
          publicToken,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          storyText: parsed.data.storyText || null,
          recoveryStage: parsed.data.recoveryStage || null,
          focusArea: parsed.data.focusArea || null,
          videoUrl,
          videoSizeBytes: req.file.size,
          consentToShare: true,
          consentToContact: !!parsed.data.consentToContact,
          ipAddress: clientIp(req),
          userAgent: (req.headers["user-agent"] || "").toString().slice(0, 400),
        }).returning();

        // Respond immediately — UI starts polling.
        res.status(202).json({
          publicToken: row.publicToken,
          status: row.status,
          message: "Got it. We're analyzing your video — this usually takes 30-90 seconds.",
        });

        // Fire-and-forget: transcribe (best-effort) → analyze → persist.
        (async () => {
          const filePath = req.file!.path;
          let transcript: string | null = null;
          let durationSec: number | null = null;

          // Transcription is best-effort. Whisper caps at 25MB; for larger
          // files we just skip transcription and let Gemini work from
          // visual+audio alone.
          if ((req.file!.size || 0) <= 24 * 1024 * 1024 && process.env.OPENAI_API_KEY) {
            try {
              const t = await transcribeVideo(filePath);
              transcript = t.transcript || null;
              durationSec = t.duration || null;
            } catch (err: any) {
              console.warn("[free-analysis] transcript skipped:", err?.message);
            }
          }

          const result = await analyzeFreeVideo({
            filePath,
            mimeType,
            name: row.name,
            storyText: row.storyText,
            recoveryStage: row.recoveryStage,
            focusArea: row.focusArea,
            transcript,
          });

          if (result.shape === "analysis" && result.output) {
            await db.update(freeVideoAnalyses).set({
              transcript,
              durationSec,
              analysisJson: result.output,
              status: "complete",
              completedAt: new Date(),
            }).where(eq(freeVideoAnalyses.id, row.id));
          } else if (result.shape === "crisis" && result.crisis) {
            // Crisis path — store the message + resources where the UI
            // already knows how to render them.
            await db.update(freeVideoAnalyses).set({
              transcript,
              durationSec,
              analysisJson: { crisis: result.crisis },
              status: "complete",
              completedAt: new Date(),
            }).where(eq(freeVideoAnalyses.id, row.id));
          } else {
            await db.update(freeVideoAnalyses).set({
              transcript,
              durationSec,
              status: "failed",
              errorMessage: (result.errorMessage || "Analysis failed.").slice(0, 500),
              completedAt: new Date(),
            }).where(eq(freeVideoAnalyses.id, row.id));
          }
        })().catch((err) => console.error("[free-analysis] background error", err));
      } catch (err: any) {
        console.error("[free-analysis] submit error", err);
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
        res.status(500).json({ message: err?.message || "Submission failed." });
      }
    }
  );

  // ── GET /api/free-analysis/by-token/:token ──────────────────────────
  app.get("/api/free-analysis/by-token/:token", pollLimiter, async (req: Request, res: Response) => {
    try {
      const token = String(req.params.token || "").slice(0, 64);
      if (!token) return res.status(400).json({ message: "Missing token." });
      const [row] = await db.select().from(freeVideoAnalyses).where(eq(freeVideoAnalyses.publicToken, token)).limit(1);
      if (!row) return res.status(404).json({ message: "Submission not found." });
      res.json(sanitizeForPublic(row));
    } catch (err: any) {
      console.error("[free-analysis] poll error", err);
      res.status(500).json({ message: "Failed to load submission." });
    }
  });

  // ── GET /api/free-analysis/testimonials ─────────────────────────────
  // Public approved testimonials with consent. Anonymized to first name +
  // initial, never email/phone. Cached at the CDN edge for 60s.
  app.get("/api/free-analysis/testimonials", async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(freeVideoAnalyses)
        .where(and(
          eq(freeVideoAnalyses.moderationStatus, "approved"),
          eq(freeVideoAnalyses.status, "complete"),
          eq(freeVideoAnalyses.consentToShare, true),
        ))
        .orderBy(desc(freeVideoAnalyses.moderatedAt))
        .limit(24);

      const items = rows.map((r) => {
        const a = (r.analysisJson as any) || {};
        const handle = r.publishedHandle || (() => {
          const parts = (r.name || "Survivor").split(/\s+/);
          const first = parts[0] || "Survivor";
          const lastInit = parts[1]?.[0] ? `${parts[1][0]}.` : "";
          return `${first} ${lastInit}`.trim();
        })();
        return {
          id: r.id,
          handle,
          quote: typeof a.publishableQuote === "string" && a.publishableQuote ? a.publishableQuote : (a.headline || ""),
          headline: a.headline || "",
          recoveryStage: r.recoveryStage,
          focusArea: r.focusArea,
          completedAt: r.completedAt,
          videoUrl: r.videoUrl,
        };
      });

      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
      res.json({ items });
    } catch (err: any) {
      console.error("[free-analysis] testimonials error", err);
      res.status(500).json({ message: "Failed to load testimonials." });
    }
  });

  // ── ADMIN: queue ────────────────────────────────────────────────────
  app.get("/api/free-analysis/admin/queue", isAuthenticated, requireAdmin, async (req: any, res: Response) => {
    try {
      const filter = String(req.query.filter || "pending");
      const where = filter === "all"
        ? undefined
        : eq(freeVideoAnalyses.moderationStatus, filter as any);
      const rows = await db.select().from(freeVideoAnalyses)
        .where(where as any)
        .orderBy(desc(freeVideoAnalyses.submittedAt))
        .limit(100);
      res.json({ items: rows });
    } catch (err: any) {
      console.error("[free-analysis] admin queue error", err);
      res.status(500).json({ message: "Failed to load queue." });
    }
  });

  // Crash-recovery sweep (stale "processing" rows) is now owned by the durable
  // scheduler as the "free-analysis-reap" job — see runFreeAnalysisReap() above
  // and server/scheduler/registerJobs.ts. Single-fires across instances +
  // observable in the admin scheduler panel.

  // ── ADMIN: moderate (approve / reject / set published handle) ───────
  const moderateBodySchema = z.object({
    action: z.enum(["approve", "reject", "pending"]),
    publishedHandle: z.string().trim().min(2).max(80).optional(),
  });
  app.patch("/api/free-analysis/admin/:id", isAuthenticated, requireAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });
      const parsed = moderateBodySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid body." });
      }
      const next: Partial<FreeVideoAnalysis> = {
        moderationStatus: parsed.data.action === "approve" ? "approved" : parsed.data.action === "reject" ? "rejected" : "pending",
        moderatedBy: req.user?.id || req.user?.claims?.sub || null,
        moderatedAt: new Date(),
      };
      if (parsed.data.publishedHandle) next.publishedHandle = parsed.data.publishedHandle;
      const [row] = await db.update(freeVideoAnalyses).set(next as any).where(eq(freeVideoAnalyses.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Submission not found." });
      res.json({ item: row });
    } catch (err: any) {
      console.error("[free-analysis] moderate error", err);
      res.status(500).json({ message: "Moderation update failed." });
    }
  });
}
