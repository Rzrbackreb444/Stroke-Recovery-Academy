import { db } from './db';
import { sendEmail } from './emailService';
import { renderEmail } from './emailTemplate';
import { redactEmail } from './lib/redact';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

const SITE = process.env.PUBLIC_SITE_URL || 'https://strokerecoveryacademy.com';
const NUDGE_DAYS = [3, 7, 14] as const;

// ─── Unsubscribe token (HMAC, no DB row needed) ──────────────────────────────
function nudgeSecret(): string {
  return process.env.SESSION_SECRET || 'sra-journal-nudge-fallback';
}

export function signNudgeToken(userId: string): string {
  return crypto.createHmac('sha256', nudgeSecret()).update(`journal-nudge:${userId}`).digest('hex').slice(0, 32);
}

export function verifyNudgeToken(userId: string, token: string): boolean {
  const expected = signNudgeToken(userId);
  if (!token || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(userId: string): string {
  return `${SITE}/api/recovery/journal/nudges/unsubscribe?uid=${encodeURIComponent(userId)}&t=${signNudgeToken(userId)}`;
}

// ─── Copy — gentle, no pressure, Sasquatch voice (em-dashes, straight quotes) ─
function nudgeCopy(day: number, firstName?: string | null) {
  const hey = firstName ? `Hey ${firstName} — ` : '';
  if (day === 3) {
    return {
      subject: "Your reflections are still here",
      previewText: "No streak to break. No guilt. Just a page that's still yours.",
      eyebrow: "A quiet nudge",
      headline: "The page is still open",
      subheadline: "Three days. No big deal.",
      body:
        `<p class="body-text">${hey}it's been a few days since your last reflection. That's not a failure — recovery isn't a streak.</p>` +
        `<p class="body-text">Some days the words don't come. Some days lifting a fork is the whole win. Both count.</p>` +
        `<p class="body-text">When you're ready, the page is right where you left it. One line is enough.</p>`,
    };
  }
  if (day === 7) {
    return {
      subject: "A week — and your story's still waiting",
      previewText: "Pick it back up whenever. No catching up required.",
      eyebrow: "Still here",
      headline: "A week out",
      subheadline: "You don't have to catch up.",
      body:
        `<p class="body-text">${hey}a week since the last entry. There's nothing to make up for — you don't backfill a journal like a missed workout.</p>` +
        `<p class="body-text">Write today's truth, whatever it is. Hard day, flat day, small-win day. The honest line is the one that helps later.</p>` +
        `<p class="body-text">Heart's still thumpin'. So are you.</p>`,
    };
  }
  return {
    subject: "Two weeks out — your reflections are saved",
    previewText: "Nothing's lost. The page reopens the second you do.",
    eyebrow: "Whenever you're ready",
    headline: "Two weeks",
    subheadline: "Nothing's lost.",
    body:
      `<p class="body-text">${hey}it's been two weeks. Life does that — it pulls you off the page.</p>` +
      `<p class="body-text">Everything you've written is still saved, exactly as you left it. No streak reset, no scolding.</p>` +
      `<p class="body-text">If today's the day, write one line. If not, this page will still be here tomorrow.</p>`,
  };
}

async function sendNudge(userId: string, email: string, firstName: string | null, day: number) {
  const copy = nudgeCopy(day, firstName);
  const html = renderEmail({
    previewText: copy.previewText,
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subheadline: copy.subheadline,
    showCrisisCallout: true,
    bodyHtml:
      copy.body +
      `<p class="body-text" style="text-align:center;margin-top:28px;">` +
      `<a href="${SITE}/recovery/journal" style="display:inline-block;background:#E2741B;color:#0E0D0C;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;">Open your journal</a>` +
      `</p>`,
    unsubscribeUrl: buildUnsubscribeUrl(userId),
    whyReceiving: "You're receiving this because you started a recovery journal at Stroke Recovery Academy. One click below stops these.",
  });

  await sendEmail({
    to: email,
    subject: copy.subject,
    html,
    text: `${copy.headline}\n\n${copy.previewText}\n\nOpen your journal: ${SITE}/recovery/journal\n\nStop these nudges: ${buildUnsubscribeUrl(userId)}`,
  });

  await db.execute(sql`
    INSERT INTO journal_nudge_log (user_id, nudge_day) VALUES (${userId}, ${day})
  `);

  console.log(`[journal-nudge] Sent day-${day} nudge to ${redactEmail(email)}`);
}

// ─── Scheduler — runs hourly ─────────────────────────────────────────────────
let schedulerRunning = false;

export function startJournalNudgeScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  console.log('[journal-nudge] Scheduler started — checking every hour at :00');

  async function tick() {
    try {
      // Candidates: users whose MOST RECENT journal entry is exactly 3/7/14 days
      // old (floor), who haven't opted out, and who haven't already gotten that
      // specific day's nudge. Real data only — no fabrication, no spam.
      const result = await db.execute(sql`
        SELECT u.id AS user_id, u.email, u.first_name,
               FLOOR(EXTRACT(EPOCH FROM (now() - MAX(j.created_at))) / 86400)::int AS age_days
        FROM recovery_journals j
        JOIN users u ON u.id = j.user_id
        WHERE u.email IS NOT NULL
          AND (u.notification_preferences->>'journalNudges') IS DISTINCT FROM 'false'
        GROUP BY u.id, u.email, u.first_name
        HAVING FLOOR(EXTRACT(EPOCH FROM (now() - MAX(j.created_at))) / 86400)::int IN (3, 7, 14)
          AND NOT EXISTS (
            SELECT 1 FROM journal_nudge_log l
            WHERE l.user_id = u.id
              AND l.nudge_day = FLOOR(EXTRACT(EPOCH FROM (now() - MAX(j.created_at))) / 86400)::int
          )
      `);

      const due = (result.rows || []) as Array<{ user_id: string; email: string; first_name: string | null; age_days: number }>;
      if (due.length > 0) {
        console.log(`[journal-nudge] Processing ${due.length} nudge(s)`);
      }

      for (const row of due) {
        if (!NUDGE_DAYS.includes(row.age_days as any)) continue;
        try {
          await sendNudge(row.user_id, row.email, row.first_name, row.age_days);
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
          console.error(`[journal-nudge] send failed for user ${row.user_id}:`, e);
        }
      }
    } catch (e) {
      console.error('[journal-nudge] scheduler tick error:', e);
    }
  }

  tick();
  setInterval(tick, 60 * 60 * 1000);
}

// ─── Opt-out (called from the unsubscribe route) ─────────────────────────────
export async function optOutOfNudges(userId: string): Promise<void> {
  await db.execute(sql`
    UPDATE users
    SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || '{"journalNudges": false}'::jsonb
    WHERE id = ${userId}
  `);
}
