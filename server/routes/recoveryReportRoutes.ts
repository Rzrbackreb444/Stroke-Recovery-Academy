import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { recoveryReportShares, users } from "@shared/schema";
import { getUserId } from "../lib/authUtils";
import { publicRateLimit } from "../middleware/publicRateLimit";
import {
  buildOwnerReport,
  toPublicProjection,
} from "../services/recoveryReport/recoveryReportService";
import { generateRecoveryReportPdf } from "../recoveryReportPdfService";

function mintShareId(): string {
  // 12-char URL-safe slug — matches the anchor-share entropy budget.
  return crypto.randomBytes(9).toString("base64url");
}

async function authorName(userId: string): Promise<string> {
  try {
    const [u] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
    return name || "A Survivor";
  } catch {
    return "A Survivor";
  }
}

export function registerRecoveryReportRoutes(app: Express, isAuthenticated: any) {
  // ── Owner report (full data) ───────────────────────────────────────
  app.get("/api/recovery/report", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const report = await buildOwnerReport(userId);
      res.json(report);
    } catch (err) {
      console.error("[report] GET /api/recovery/report", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Share status ───────────────────────────────────────────────────
  app.get("/api/recovery/report/share", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [row] = await db
        .select()
        .from(recoveryReportShares)
        .where(eq(recoveryReportShares.userId, userId))
        .limit(1);
      res.json({
        isShared: row?.isShared ?? false,
        shareId: row?.isShared ? row.shareId : null,
      });
    } catch (err) {
      console.error("[report] GET /api/recovery/report/share", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Toggle share (consent-gated, revocable) ────────────────────────
  app.post("/api/recovery/report/share", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const isShared = req.body?.isShared === true;

      const [existing] = await db
        .select()
        .from(recoveryReportShares)
        .where(eq(recoveryReportShares.userId, userId))
        .limit(1);

      let nextShareId = existing?.shareId ?? null;
      if (isShared && !nextShareId) nextShareId = mintShareId();

      if (existing) {
        await db
          .update(recoveryReportShares)
          .set({
            isShared,
            shareId: isShared ? nextShareId : null,
            updatedAt: new Date(),
          })
          .where(eq(recoveryReportShares.userId, userId));
      } else {
        await db.insert(recoveryReportShares).values({
          userId,
          isShared,
          shareId: isShared ? nextShareId : null,
        });
      }

      res.json({ isShared, shareId: isShared ? nextShareId : null });
    } catch (err) {
      console.error("[report] POST /api/recovery/report/share", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Print-ready PDF (owner only) ───────────────────────────────────
  app.get("/api/recovery/report/pdf", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [report, name] = await Promise.all([
        buildOwnerReport(userId),
        authorName(userId),
      ]);
      const pdf = await generateRecoveryReportPdf(report, name);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="my-recovery-report.pdf"');
      res.setHeader("Content-Length", pdf.length);
      res.send(pdf);
    } catch (err) {
      console.error("[report] GET /api/recovery/report/pdf", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Public share (no auth, rate-limited, projection-only) ──────────
  const reportShareLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 30,
    bucketName: "report-share",
  });

  // Enumeration guard: repeated *misses* (unknown share ids) from one IP get
  // a temporary lockout well before the generic 30/min limiter kicks in.
  // A legitimate viewer follows one valid link and never accumulates misses.
  const MISS_WINDOW_MS = 5 * 60_000;
  const MISS_MAX = 10;
  const missStore = new Map<string, { count: number; resetAt: number }>();

  function clientIp(req: Request): string {
    return (req.ip ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown") as string;
  }

  function missLockoutSeconds(ip: string): number | null {
    const now = Date.now();
    const entry = missStore.get(ip);
    if (!entry || entry.resetAt <= now) return null;
    if (entry.count >= MISS_MAX) return Math.ceil((entry.resetAt - now) / 1000);
    return null;
  }

  function recordMiss(ip: string) {
    const now = Date.now();
    const entry = missStore.get(ip);
    if (!entry || entry.resetAt <= now) {
      missStore.set(ip, { count: 1, resetAt: now + MISS_WINDOW_MS });
      if (missStore.size > 5000) {
        for (const [k, v] of missStore) {
          if (v.resetAt <= now) missStore.delete(k);
        }
      }
      return;
    }
    entry.count += 1;
  }

  // Rate-limit the shared HTML page surface too — the SPA shell itself leaks
  // nothing, but this blunts high-volume path probing at the edge. Generous
  // (60/min/IP) so a real viewer refreshing the page is never affected. The
  // handler defers to the SPA catch-all via next().
  const reportPageLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 60,
    bucketName: "report-share-page",
  });
  app.get("/report/s/:shareId", reportPageLimiter, (_req: Request, _res: Response, next: any) =>
    next(),
  );

  app.get(
    "/api/recovery/report/share/:shareId",
    reportShareLimiter,
    async (req: Request, res: Response) => {
      try {
        const ip = clientIp(req);
        const lockout = missLockoutSeconds(ip);
        if (lockout !== null) {
          res.setHeader("Retry-After", String(lockout));
          res.setHeader("Cache-Control", "no-store");
          return res
            .status(429)
            .json({ error: "too_many_requests", retryAfter: lockout });
        }

        const shareId = String(req.params.shareId || "");
        if (!shareId || shareId.length > 64) {
          recordMiss(ip);
          return res.status(404).json({ error: "not_found" });
        }

        const [row] = await db
          .select({ userId: recoveryReportShares.userId })
          .from(recoveryReportShares)
          .where(
            and(
              eq(recoveryReportShares.shareId, shareId),
              eq(recoveryReportShares.isShared, true),
            ),
          )
          .limit(1);
        if (!row) {
          recordMiss(ip);
          return res.status(404).json({ error: "not_found" });
        }

        const report = await buildOwnerReport(row.userId);
        res.json(toPublicProjection(report));
      } catch (err) {
        console.error("[report] GET /api/recovery/report/share/:shareId", err);
        res.status(500).json({ error: "share_fetch_failed" });
      }
    },
  );
}
