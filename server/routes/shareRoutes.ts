// P3-05 — Social sharing for courses with affiliate hooks.
// Builds prebuilt share URLs for X, Facebook, Reddit, LinkedIn, WhatsApp,
// SMS, and Copy-link, each tagged with the user's referral code so any
// downstream signup credits the sharer. Tracks per-channel share events.
import type { Express } from "express";
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { courses, referralCodes } from "@shared/schema";

const ALLOWED_CHANNELS = new Set([
  "x", "facebook", "reddit", "linkedin", "whatsapp", "sms", "copy", "native",
]);

// Canonical origin from configured env to prevent Host/X-Forwarded-Host
// poisoning. Falls back only when no env is set (dev only).
function siteOrigin(req: any): string {
  const env =
    process.env.APP_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.protocol || "https";
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function buildChannelUrls(shareUrl: string, title: string, summary: string) {
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(title);
  const s = encodeURIComponent(summary);
  const tweet = encodeURIComponent(`${title} — ${summary}`);
  return {
    x: `https://twitter.com/intent/tweet?text=${tweet}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    whatsapp: `https://wa.me/?text=${tweet}%20${u}`,
    sms: `sms:?&body=${tweet}%20${u}`,
    copy: shareUrl,
  };
}

export function registerShareRoutes(app: Express, isAuthenticated: any) {
  // GET /api/share/course/:id — returns share metadata + per-channel URLs.
  // Auth-optional: signed-out visitors still get share URLs (no ref code).
  app.get("/api/share/course/:id", async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Bad id" });
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
      if (!course || !course.isPublished) return res.status(404).json({ error: "Not found" });

      let refCode: string | null = null;
      const uid = req.user?.claims?.sub;
      if (uid) {
        const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.userId, uid)).limit(1);
        if (rc) refCode = rc.code;
      }

      const origin = siteOrigin(req);
      const path = `/course/${course.id}`;
      const shareUrl = refCode ? `${origin}${path}?ref=${refCode}` : `${origin}${path}`;
      const summary = (course.description || "").slice(0, 140);
      const og = course.ogImageUrl || course.thumbnailUrl || `${origin}/og-default.png`;

      res.json({
        courseId: course.id,
        title: course.title,
        summary,
        ogImage: og,
        shareUrl,
        refCode,
        channels: buildChannelUrls(shareUrl, course.title, summary),
      });
    } catch (e: any) {
      console.error("[share] meta error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // POST /api/share/track — log a share event, optionally bump affiliate clicks.
  // Public so signed-out previews can still count anonymously.
  // Lightweight in-memory dedupe — same (ip, course, channel) within 10s
  // counts once. Prevents trivial replay-spam of share telemetry.
  const recent = new Map<string, number>();
  const DEDUPE_MS = 10_000;

  app.post("/api/share/track", async (req: any, res) => {
    try {
      const courseId = parseInt(req.body?.courseId, 10);
      const channel = String(req.body?.channel || "").toLowerCase();
      if (!Number.isFinite(courseId) || !ALLOWED_CHANNELS.has(channel)) {
        return res.status(400).json({ error: "Bad payload" });
      }
      const uid = req.user?.claims?.sub ?? null;

      // Server-derived refCode only — never trust client-supplied codes
      // (prevents attribution fraud).
      let refCode: string | null = null;
      if (uid) {
        const [rc] = await db.select().from(referralCodes)
          .where(eq(referralCodes.userId, uid)).limit(1);
        if (rc) refCode = rc.code;
      }

      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim()
        || req.socket?.remoteAddress || "anon";
      const key = `${uid || ip}:${courseId}:${channel}`;
      const now = Date.now();
      const prev = recent.get(key);
      if (prev && now - prev < DEDUPE_MS) return res.json({ ok: true, deduped: true });
      recent.set(key, now);
      if (recent.size > 5000) {
        for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
      }

      await db.execute(sql`
        INSERT INTO share_events (user_id, course_id, channel, ref_code)
        VALUES (${uid}, ${courseId}, ${channel}, ${refCode})
      `);
      res.json({ ok: true });
    } catch (e: any) {
      console.error("[share] track error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });
}
