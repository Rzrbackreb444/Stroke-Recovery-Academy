/**
 * Account-level routes for the survivor's own data:
 * - GET  /api/account/export  — Returns a JSON dump of everything we have on
 *                               the authenticated user (GDPR/CCPA-style portability).
 * - POST /api/account/delete  — Confirm-by-typing-email soft delete: scrubs PII
 *                               from the user row, destroys the session, and
 *                               keeps a tombstone for FK integrity.
 *
 * Both routes are session-authed via isAuthenticated. The export is rate-limited
 * via publicRateLimit (3/hour/user) because it's expensive (multi-table read).
 */

import { Router, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";
import { db } from "../db";
import { users, userProfiles } from "@workspace/db";
import { getUserId } from "../lib/authUtils";

const router = Router();

function authedUserId(req: any): string | null {
  return getUserId(req) ?? req.session?.userId ?? null;
}

/**
 * Best-effort table dump. Each table read is wrapped in try/catch so a single
 * missing/orphan table never breaks the whole export. New tables added later
 * can be plugged in by appending to the list.
 */
async function safeQuery<T>(label: string, fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err: any) {
    console.warn(`[account/export] ${label} failed:`, err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

/**
 * Per-user rate limit for the export endpoint. The dump touches ~9 tables and
 * could be abused to spam logs / amplify cost. 3 calls per rolling hour per
 * user is enough for any legitimate "I want my data" workflow.
 */
const exportHits = new Map<string, number[]>();
function rateLimitExport(userId: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const limit = 3;
  const hits = (exportHits.get(userId) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  exportHits.set(userId, hits);
  return { ok: true, retryAfterSec: 0 };
}

router.get("/export", isAuthenticated, async (req: any, res: Response) => {
  const userId = authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const rl = rateLimitExport(userId);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSec));
    return res.status(429).json({
      error: "Too many export requests. Please try again later.",
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const [
    user,
    profile,
    checkins,
    milestones,
    streak,
    enrollment,
    journal,
    medical,
    flicker,
  ] = await Promise.all([
    safeQuery("users", () =>
      db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0] || null),
    ),
    safeQuery("user_profiles", () =>
      db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1).then((r) => r[0] || null),
    ),
    safeQuery("daily_checkins", () =>
      db.execute(sql`SELECT * FROM daily_checkins WHERE user_id = ${userId} ORDER BY checkin_date DESC LIMIT 1000`)
        .then((r: any) => r.rows ?? r),
    ),
    safeQuery("milestones", () =>
      db.execute(sql`SELECT * FROM user_milestones WHERE user_id = ${userId} ORDER BY achieved_at DESC LIMIT 500`)
        .then((r: any) => r.rows ?? r),
    ),
    safeQuery("user_streaks", () =>
      db.execute(sql`SELECT * FROM user_streaks WHERE user_id = ${userId} LIMIT 1`)
        .then((r: any) => (r.rows ?? r)?.[0] || null),
    ),
    safeQuery("user_enrollments", () =>
      db.execute(sql`SELECT * FROM user_enrollments WHERE user_id = ${userId} LIMIT 5`)
        .then((r: any) => r.rows ?? r),
    ),
    safeQuery("recovery_journal_entries", () =>
      db.execute(sql`SELECT * FROM recovery_journal_entries WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 500`)
        .then((r: any) => r.rows ?? r),
    ),
    safeQuery("medical_log_entries", () =>
      db.execute(sql`SELECT * FROM medical_log_entries WHERE user_id = ${userId} ORDER BY logged_at DESC LIMIT 500`)
        .then((r: any) => r.rows ?? r),
    ),
    safeQuery("flicker_log_entries", () =>
      db.execute(sql`SELECT * FROM flicker_log_entries WHERE user_id = ${userId} ORDER BY logged_at DESC LIMIT 500`)
        .then((r: any) => r.rows ?? r),
    ),
  ]);

  // Strip the password hash from the export — even owners shouldn't ship that
  // around in plaintext form.
  if (user.ok && user.data) {
    delete (user.data as any).passwordHash;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    userId,
    note:
      "This is the data Stroke Recovery Academy holds about you on this account. Some optional tables may be empty if you haven't used that feature yet.",
    user,
    profile,
    checkins,
    milestones,
    streak,
    enrollment,
    journal,
    medical,
    flicker,
  };

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="strokerecovery-export-${userId.slice(0, 8)}-${new Date()
      .toISOString()
      .slice(0, 10)}.json"`,
  );
  return res.status(200).send(JSON.stringify(payload, null, 2));
});

/**
 * Confirm-by-typing-email delete. We scrub PII rather than DELETE the row so
 * foreign keys (orders, marketplace earnings, community posts) stay valid.
 */
router.post("/delete", isAuthenticated, async (req: any, res: Response) => {
  const userId = authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { confirmEmail } = req.body || {};
  if (!confirmEmail || typeof confirmEmail !== "string") {
    return res.status(400).json({ error: "confirmEmail is required" });
  }

  // Look up the user's actual email for the confirm-by-typing check.
  const userRow = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r) => r[0] || null);

  if (!userRow) {
    return res.status(404).json({ error: "User not found" });
  }

  const actual = (userRow.email || "").trim().toLowerCase();
  const submitted = confirmEmail.trim().toLowerCase();

  if (!actual || actual !== submitted) {
    return res.status(400).json({ error: "confirmEmail does not match the account email" });
  }

  const tombstoneEmail = `deleted-${userId.slice(0, 8)}-${Date.now()}@deleted.local`;

  try {
    await db
      .update(users)
      .set({
        email: tombstoneEmail,
        firstName: "[deleted]",
        lastName: null as any,
        profileImageUrl: null as any,
        passwordHash: null as any,
        avatarUrl: null as any,
        avatarStyle: null as any,
        avatarGeneratedPrompt: null as any,
        publicSlug: null as any,
        therapistTitle: null as any,
        therapistCredentials: null as any,
        therapistBio: null as any,
        spotlightOptedIn: false,
        spotlightConsent: false,
        acceptsPowerPoints: false,
        role: "member",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Best-effort: blank free-text PII on the survivor profile too.
    await db
      .update(userProfiles)
      .set({
        preferredName: null as any,
        bio: null as any,
        story: null as any,
        location: null as any,
        caregiverEmail: null as any,
      } as any)
      .where(eq(userProfiles.userId, userId))
      .catch((e) => console.warn("[account/delete] profile scrub failed:", e?.message || e));

    // Best-effort: anonymize free-text bodies on note-bearing tables. We do
    // NOT delete the rows — they may be referenced by streaks, achievements,
    // or aggregate stats — but the prose containing PHI-adjacent material is
    // replaced. Each table is wrapped in its own try/catch so a missing
    // column on one table never blocks the others.
    const scrubs: Array<[string, ReturnType<typeof sql>]> = [
      [
        "daily_checkins",
        sql`UPDATE daily_checkins SET wins_today = NULL, challenges_today = NULL, gratitude = NULL WHERE user_id = ${userId}`,
      ],
      [
        "recovery_journal_entries",
        sql`UPDATE recovery_journal_entries SET title = '[deleted]', body = '[deleted by user]' WHERE user_id = ${userId}`,
      ],
      [
        "medical_log_entries",
        sql`UPDATE medical_log_entries SET notes = '[deleted by user]' WHERE user_id = ${userId}`,
      ],
      [
        "flicker_log_entries",
        sql`UPDATE flicker_log_entries SET notes = '[deleted by user]', body = '[deleted by user]' WHERE user_id = ${userId}`,
      ],
      [
        "recovery_journals",
        sql`UPDATE recovery_journals SET content = '[deleted by user]' WHERE user_id = ${userId}`,
      ],
      [
        "flicker_logs",
        sql`UPDATE flicker_logs SET notes = '[deleted by user]' WHERE user_id = ${userId}`,
      ],
    ];
    for (const [label, stmt] of scrubs) {
      await db.execute(stmt).catch((e) => {
        console.warn(`[account/delete] ${label} scrub skipped:`, e?.message || e);
      });
    }
  } catch (err: any) {
    console.error("[account/delete] scrub failed:", err);
    return res.status(500).json({ error: "Failed to delete account. Please contact support." });
  }

  // Tear down passport login state first (clears req.user across the request
  // chain), then destroy the session and clear the cookie. Without the
  // explicit logout, a passport.session() middleware on a subsequent request
  // could re-attach a stale user object from the deserializer.
  const finalize = () => {
    if (req.session && typeof req.session.destroy === "function") {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.status(200).json({ ok: true, message: "Account deleted." });
      });
    } else {
      return res.status(200).json({ ok: true, message: "Account deleted." });
    }
  };

  if (typeof req.logout === "function") {
    // Passport ≥0.6 requires a callback.
    req.logout((err: any) => {
      if (err) console.warn("[account/delete] req.logout warning:", err?.message || err);
      finalize();
    });
  } else {
    finalize();
  }
});

export default router;
