// ============================================================================
// UNIFIED LIFECYCLE MESSAGING ENGINE
// ============================================================================
// One send path for every non-transactional message the platform emits, across
// email (Resend), web push, and SMS (Twilio, behind a flag). It:
//   - resolves the recipient from userId (email/phone),
//   - honors per-user channel prefs, a global unsubscribe, and quiet hours,
//   - and makes every send idempotent via a claim-before-send dedupe on
//     message_deliveries.dedupe_key.
//
// Journeys (server/lifecycleService.ts) recompute eligibility every hour and
// call sendMessage() with a stable dedupeKey per (step, channel, user). The
// UNIQUE(dedupe_key) claim blocks repeats; a transient failure deletes the
// claim so the next tick retries — same "log only on success" semantics as the
// journal-nudge service, generalized across channels.

import { db } from "../db";
import { sql } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { sendPushToUser } from "../pushNotificationService";
import { redactEmail } from "../lib/redact";

export type Channel = "email" | "push" | "sms";

export interface MergedPrefs {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  smsPhone: string | null;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string;
  unsubscribedAll: boolean;
  journalNudges: boolean; // from users.notification_preferences jsonb
}

export type SendResult =
  | { status: "sent"; providerId?: string }
  | { status: "skipped"; reason: string }
  | { status: "deferred"; reason: string }
  | { status: "duplicate" }
  | { status: "failed"; error: string };

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  type?: string;
  [k: string]: unknown;
}

export interface SendOpts {
  userId?: string;
  toEmail?: string;       // override; else resolved from users
  channel: Channel;
  category: string;       // analytics/audit label, e.g. "onboarding-d1"
  dedupeKey?: string;     // omit for one-off transactional sends (no dedupe)
  respectPrefs?: boolean; // default true; transactional receipts pass false
  // email
  subject?: string;
  html?: string;
  text?: string;
  // push
  push?: PushPayload;
  // sms
  smsBody?: string;
}

const DEFAULT_TZ = "America/New_York";

// ─── Boot-time self-provisioning ─────────────────────────────────────────────
// db:push stalls on an interactive rename prompt in non-TTY shells, so — like
// ensureSchedulerSchema / initPushSchema — the engine provisions its own tables
// and additive columns idempotently on boot. Safe on an already-migrated DB.
export async function ensureMessagingSchema(): Promise<void> {
  // Base table (covers a fresh DB where drizzle push never ran).
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL UNIQUE,
      checkin_reminder_hour INTEGER DEFAULT 9,
      streak_break_email BOOLEAN NOT NULL DEFAULT TRUE,
      weekly_rep_goal INTEGER DEFAULT 21,
      weekly_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      caregiver_share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  // Additive columns — cover a pre-existing table with the older shape.
  const addCols: Array<[string, string]> = [
    ["email_enabled", "BOOLEAN NOT NULL DEFAULT TRUE"],
    ["push_enabled", "BOOLEAN NOT NULL DEFAULT TRUE"],
    ["sms_enabled", "BOOLEAN NOT NULL DEFAULT FALSE"],
    ["sms_phone", "TEXT"],
    ["sms_consent_at", "TIMESTAMP"],
    ["quiet_hours_start", "INTEGER"],
    ["quiet_hours_end", "INTEGER"],
    ["timezone", "TEXT NOT NULL DEFAULT 'America/New_York'"],
    ["unsubscribed_all", "BOOLEAN NOT NULL DEFAULT FALSE"],
  ];
  for (const [col, def] of addCols) {
    await db.execute(sql.raw(`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS ${col} ${def}`));
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS message_deliveries (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      email TEXT,
      channel TEXT NOT NULL,
      category TEXT NOT NULL,
      dedupe_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      provider_id TEXT,
      error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS message_deliveries_dedupe_key_key ON message_deliveries (dedupe_key)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_message_deliveries_user ON message_deliveries (user_id, created_at)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_message_deliveries_category ON message_deliveries (category)`);
}

// ─── Preference loading (merges both stores) ─────────────────────────────────
// Channel/quiet-hours live in notification_preferences; the legacy journalNudges
// flag lives in users.notification_preferences jsonb. One helper reads both so
// callers never have to know there are two stores.
export async function loadPrefs(userId: string): Promise<MergedPrefs> {
  const res = await db.execute(sql`
    SELECT np.email_enabled, np.push_enabled, np.sms_enabled, np.sms_phone,
           np.quiet_hours_start, np.quiet_hours_end, np.timezone, np.unsubscribed_all,
           (u.notification_preferences->>'journalNudges') AS journal_nudges
    FROM users u
    LEFT JOIN notification_preferences np ON np.user_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `);
  const r = (res.rows as any[])[0] ?? {};
  return {
    emailEnabled: r.email_enabled ?? true,
    pushEnabled: r.push_enabled ?? true,
    smsEnabled: r.sms_enabled ?? false,
    smsPhone: r.sms_phone ?? null,
    quietHoursStart: r.quiet_hours_start ?? null,
    quietHoursEnd: r.quiet_hours_end ?? null,
    timezone: r.timezone ?? DEFAULT_TZ,
    unsubscribedAll: r.unsubscribed_all ?? false,
    journalNudges: r.journal_nudges !== "false",
  };
}

// Quiet hours are tz-aware and apply to push + SMS only (email is non-intrusive).
// Nullable window (or start === end) means "no quiet hours". Handles the
// overnight wrap (e.g. 21 → 8).
export function inQuietHours(prefs: MergedPrefs, now: Date = new Date()): boolean {
  const s = prefs.quietHoursStart;
  const e = prefs.quietHoursEnd;
  if (s == null || e == null || s === e) return false;
  let h: number;
  try {
    h =
      Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: prefs.timezone || DEFAULT_TZ,
        }).format(now),
      ) % 24;
  } catch {
    // Bad tz string should never crash the send path. Treat as "no quiet hours".
    return false;
  }
  return s < e ? h >= s && h < e : h >= s || h < e;
}

// Validate a tz string is a real IANA zone before persisting it, so the
// Intl.DateTimeFormat call in inQuietHours can never be handed a bad value.
export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ─── The one send path ───────────────────────────────────────────────────────
export async function sendMessage(opts: SendOpts): Promise<SendResult> {
  const { channel, category, dedupeKey } = opts;
  const respectPrefs = opts.respectPrefs !== false;

  let prefs: MergedPrefs | null = null;
  if (opts.userId && respectPrefs) {
    prefs = await loadPrefs(opts.userId);
    if (prefs.unsubscribedAll) return { status: "skipped", reason: "unsubscribed_all" };
    if (channel === "email" && !prefs.emailEnabled) return { status: "skipped", reason: "email_disabled" };
    if (channel === "push" && !prefs.pushEnabled) return { status: "skipped", reason: "push_disabled" };
    if (channel === "sms" && !prefs.smsEnabled) return { status: "skipped", reason: "sms_disabled" };
    if ((channel === "push" || channel === "sms") && inQuietHours(prefs)) {
      return { status: "deferred", reason: "quiet_hours" };
    }
  }

  // Resolve recipients.
  let toEmail = opts.toEmail ?? null;
  if (channel === "email" && !toEmail && opts.userId) {
    const u = await db.execute(sql`SELECT email FROM users WHERE id = ${opts.userId} LIMIT 1`);
    toEmail = (u.rows as any[])[0]?.email ?? null;
  }
  if (channel === "email" && !toEmail) return { status: "skipped", reason: "no_email" };

  const smsTo = prefs?.smsPhone ?? null;
  if (channel === "sms" && !smsTo) return { status: "skipped", reason: "no_phone" };

  // Claim-before-send dedupe (only when a dedupeKey is supplied).
  let claimedId: number | null = null;
  if (dedupeKey) {
    const claim = await db.execute(sql`
      INSERT INTO message_deliveries (user_id, email, channel, category, dedupe_key, status)
      VALUES (${opts.userId ?? null}, ${toEmail}, ${channel}, ${category}, ${dedupeKey}, 'sent')
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id
    `);
    const row = (claim.rows as any[])[0];
    if (!row) return { status: "duplicate" };
    claimedId = Number(row.id);
  }

  const releaseClaim = async () => {
    if (claimedId != null) {
      await db.execute(sql`DELETE FROM message_deliveries WHERE id = ${claimedId}`);
    }
  };

  try {
    let providerId: string | undefined;

    if (channel === "email") {
      const r = await sendEmail({ to: toEmail!, subject: opts.subject ?? "", html: opts.html ?? "", text: opts.text });
      if (!r.success) {
        await releaseClaim();
        console.error(`[messaging] email send failed (${category}) to ${redactEmail(toEmail!)}: ${r.error}`);
        return { status: "failed", error: r.error ?? "email_failed" };
      }
      providerId = r.id;
    } else if (channel === "push") {
      if (!opts.userId) {
        await releaseClaim();
        return { status: "skipped", reason: "no_user" };
      }
      await sendPushToUser(opts.userId, opts.push ?? { title: "", body: "" });
    } else if (channel === "sms") {
      const { sendSms } = await import("./smsProvider");
      const r = await sendSms({ to: smsTo!, body: opts.smsBody ?? opts.text ?? "" });
      if (r.status !== "sent") {
        // Flag off / not consented / quiet — release the claim so a later enable
        // can re-send this step.
        await releaseClaim();
        return { status: "skipped", reason: r.reason ?? "sms_unavailable" };
      }
      providerId = r.providerId;
    }

    if (claimedId != null && providerId) {
      await db.execute(sql`UPDATE message_deliveries SET provider_id = ${providerId} WHERE id = ${claimedId}`);
    }
    return { status: "sent", providerId };
  } catch (err: any) {
    // Release the claim so the next scheduler tick can retry.
    await releaseClaim();
    console.error(`[messaging] ${channel} send threw (${category}):`, err?.message ?? err);
    return { status: "failed", error: String(err?.message ?? err) };
  }
}
