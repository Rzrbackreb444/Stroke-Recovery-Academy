// ============================================================================
// LIFECYCLE JOURNEYS
// ============================================================================
// State-driven lifecycle messaging. Every run recomputes eligibility from real
// platform state — there is NO enrollment table. The message_deliveries dedupe
// (claim-before-send on a stable dedupeKey per step) makes each step fire once
// per user and keeps the hourly job idempotent across double-runs and restarts.
//
// Journeys:
//   - onboarding  : brand-new users with zero activity, at day 1 / 3 / 7.
//   - win-back    : users who WERE active but have gone quiet 14 / 30 days.
//   - trial-ending: trialing subscriptions at T-3 / T-1 before renewal.
//
// Voice = Stroked-Out Sasquatch (terse, em-dashes, straight quotes). All copy is
// static, so no AI/crisis gate is needed here; renderEmail keeps the crisis
// callout + medical-disclaimer footer on every send.

import { db } from "./db";
import { sql } from "drizzle-orm";
import { renderEmail } from "./emailTemplate";
import { redactEmail } from "./lib/redact";
import { sendMessage } from "./messaging";
import { buildGlobalUnsubscribeUrl } from "./messaging/unsubscribe";

const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";

interface Candidate {
  user_id: string;
  email: string;
  first_name: string | null;
}

interface StepCopy {
  subject: string;
  previewText: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  body: string; // inner HTML paragraphs
  ctaLabel: string;
  ctaPath: string;
}

function ctaButton(label: string, path: string): string {
  return (
    `<p class="body-text" style="text-align:center;margin-top:28px;">` +
    `<a href="${SITE}${path}" style="display:inline-block;background:#E2741B;color:#0E0D0C;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;">${label}</a>` +
    `</p>`
  );
}

async function sendStep(c: Candidate, category: string, copy: StepCopy, whyReceiving: string) {
  const html = renderEmail({
    previewText: copy.previewText,
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subheadline: copy.subheadline,
    showCrisisCallout: true,
    bodyHtml: copy.body + ctaButton(copy.ctaLabel, copy.ctaPath),
    unsubscribeUrl: buildGlobalUnsubscribeUrl(c.user_id),
    whyReceiving,
  });

  const text =
    `${copy.headline}\n\n${copy.previewText}\n\n` +
    `${copy.ctaLabel}: ${SITE}${copy.ctaPath}\n\n` +
    `Stop these emails: ${buildGlobalUnsubscribeUrl(c.user_id)}`;

  const res = await sendMessage({
    userId: c.user_id,
    toEmail: c.email,
    channel: "email",
    category,
    dedupeKey: `${category}:email:${c.user_id}`,
    subject: copy.subject,
    html,
    text,
  });

  if (res.status === "sent") {
    console.log(`[lifecycle] ${category} → ${redactEmail(c.email)}`);
  }
  return res;
}

// ─── Copy ────────────────────────────────────────────────────────────────────
function onboardingCopy(day: number, firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  if (day === 1) {
    return {
      subject: "One rep. That's the whole ask.",
      previewText: "Recovery isn't a leap. It's one small rep, logged.",
      eyebrow: "Welcome to the tribe",
      headline: "Start with one rep",
      subheadline: "Not a program. One rep.",
      body:
        `<p class="body-text">${hey}you signed up. That's the hardest part most folks never do. Now the easy part — one rep.</p>` +
        `<p class="body-text">Squeeze a hand. Say a word out loud. Stand for ten seconds. Whatever your body gives you today, log it. That's the whole ask.</p>` +
        `<p class="body-text">Heart's still thumpin'. Let's put one on the board.</p>`,
      ctaLabel: "Log your first rep",
      ctaPath: "/recovery/dashboard",
    };
  }
  if (day === 3) {
    return {
      subject: "Still no rep — no guilt, just a nudge",
      previewText: "Three days in. The board's still empty. Let's fix that easy.",
      eyebrow: "Three days in",
      headline: "The board's still empty",
      subheadline: "No shame. Just start.",
      body:
        `<p class="body-text">${hey}three days and no reps logged yet. That's not a failure — it's just a blank page waiting.</p>` +
        `<p class="body-text">You don't need a plan. You need one honest line. What did your body do today? Log that.</p>`,
      ctaLabel: "Log one rep",
      ctaPath: "/recovery/dashboard",
    };
  }
  return {
    subject: "A week in — the door's still open",
    previewText: "No streak to lose. Nothing to catch up on. Just start where you are.",
    eyebrow: "A week in",
    headline: "The door's still open",
    subheadline: "Start where you are.",
    body:
      `<p class="body-text">${hey}it's been a week and the platform's still waiting on your first rep. No catching up required — you start today, from today.</p>` +
      `<p class="body-text">One rep proves the loop works: do the thing, log the thing, watch it stack. That's recovery, un-glamorous and real.</p>`,
    ctaLabel: "Log your first rep",
    ctaPath: "/recovery/dashboard",
  };
}

function winbackCopy(day: number, firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  if (day === 14) {
    return {
      subject: "Two weeks quiet — your reps are still here",
      previewText: "You built something. It didn't vanish. Pick it back up.",
      eyebrow: "Been a minute",
      headline: "Two weeks quiet",
      subheadline: "Nothing you built is lost.",
      body:
        `<p class="body-text">${hey}you were showing up — then life pulled you off the board. Happens to every survivor. Doesn't erase the work.</p>` +
        `<p class="body-text">Your reps, your streak history, your notes — all saved. You don't restart. You resume.</p>` +
        `<p class="body-text">One rep today gets the engine running again.</p>`,
      ctaLabel: "Resume your recovery",
      ctaPath: "/recovery/dashboard",
    };
  }
  return {
    subject: "A month out — the door doesn't lock",
    previewText: "No scolding. No reset. Just the page, still yours.",
    eyebrow: "Whenever you're ready",
    headline: "A month out",
    subheadline: "The door doesn't lock.",
    body:
      `<p class="body-text">${hey}it's been a month. Recovery isn't linear and neither is showing up — some stretches you're heads-down just surviving.</p>` +
      `<p class="body-text">Everything's exactly where you left it. When today's the day, one line is enough to be back in it.</p>`,
    ctaLabel: "Come back",
    ctaPath: "/recovery/dashboard",
  };
}

function trialEndingCopy(daysLeft: number, firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  if (daysLeft === 3) {
    return {
      subject: "3 days left on your trial",
      previewText: "Keep Coach, the squad, and your full recovery toolkit.",
      eyebrow: "Trial ending soon",
      headline: "Three days left",
      subheadline: "Keep the whole toolkit.",
      body:
        `<p class="body-text">${hey}your free trial wraps in three days. After that, premium keeps Coach on call, your accountability squad, and the full recovery toolkit.</p>` +
        `<p class="body-text">No hard sell. If it's helping, stay. If it's not, no hard feelings.</p>`,
      ctaLabel: "Keep premium",
      ctaPath: "/recovery/premium",
    };
  }
  return {
    subject: "Trial ends tomorrow",
    previewText: "Last day to lock in Coach, the squad, and your toolkit.",
    eyebrow: "Trial ends tomorrow",
    headline: "One day left",
    subheadline: "Lock it in.",
    body:
      `<p class="body-text">${hey}your trial ends tomorrow. Stay premium and nothing changes — Coach, your squad, and every recovery tool stay right where they are.</p>` +
      `<p class="body-text">Heart's still thumpin'. Keep the momentum.</p>`,
    ctaLabel: "Keep premium",
    ctaPath: "/recovery/premium",
  };
}

// ─── Journeys ────────────────────────────────────────────────────────────────
// Onboarding: brand-new users with zero activity (no check-ins AND no journals),
// at exactly day 1 / 3 / 7 since signup.
async function runOnboarding() {
  const result = await db.execute(sql`
    SELECT u.id AS user_id, u.email, u.first_name,
           FLOOR(EXTRACT(EPOCH FROM (now() - u.created_at)) / 86400)::int AS age_days
    FROM users u
    WHERE u.email IS NOT NULL
      AND u.created_at IS NOT NULL
      AND FLOOR(EXTRACT(EPOCH FROM (now() - u.created_at)) / 86400)::int IN (1, 3, 7)
      AND NOT EXISTS (SELECT 1 FROM daily_checkins c WHERE c.user_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM recovery_journals j WHERE j.user_id = u.id)
  `);
  const rows = (result.rows || []) as Array<Candidate & { age_days: number }>;
  for (const r of rows) {
    try {
      await sendStep(
        r,
        `onboarding-d${r.age_days}`,
        onboardingCopy(r.age_days, r.first_name),
        "You're receiving this because you created an account at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[lifecycle] onboarding send failed for ${r.user_id}:`, e);
    }
  }
}

// Win-back: users who had activity but whose most recent check-in OR journal is
// 14 / 30 days old. Day-14 guard skips anyone who just got a day-14 journal
// nudge this week so we don't double up.
async function runWinback() {
  const result = await db.execute(sql`
    WITH last_activity AS (
      SELECT user_id, MAX(ts) AS last_ts FROM (
        SELECT user_id, created_at AS ts FROM daily_checkins
        UNION ALL
        SELECT user_id, created_at AS ts FROM recovery_journals
      ) a
      GROUP BY user_id
    )
    SELECT u.id AS user_id, u.email, u.first_name,
           FLOOR(EXTRACT(EPOCH FROM (now() - la.last_ts)) / 86400)::int AS age_days
    FROM last_activity la
    JOIN users u ON u.id = la.user_id
    WHERE u.email IS NOT NULL
      AND FLOOR(EXTRACT(EPOCH FROM (now() - la.last_ts)) / 86400)::int IN (14, 30)
      AND NOT (
        FLOOR(EXTRACT(EPOCH FROM (now() - la.last_ts)) / 86400)::int = 14
        AND EXISTS (
          SELECT 1 FROM journal_nudge_log l
          WHERE l.user_id = u.id AND l.nudge_day = 14
            AND l.sent_at > now() - interval '7 days'
        )
      )
  `);
  const rows = (result.rows || []) as Array<Candidate & { age_days: number }>;
  for (const r of rows) {
    try {
      await sendStep(
        r,
        `winback-d${r.age_days}`,
        winbackCopy(r.age_days, r.first_name),
        "You're receiving this because you've been active at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[lifecycle] winback send failed for ${r.user_id}:`, e);
    }
  }
}

// Trial-ending: trialing subscriptions with a renewal 1-3 days out. Send at
// T-3 and T-1 only.
async function runTrialEnding() {
  const result = await db.execute(sql`
    SELECT u.id AS user_id, u.email, u.first_name,
           CEIL(EXTRACT(EPOCH FROM (s.current_period_end - now())) / 86400)::int AS days_left
    FROM user_subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'trialing'
      AND u.email IS NOT NULL
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end > now()
      AND s.current_period_end <= now() + interval '3 days'
  `);
  const rows = (result.rows || []) as Array<Candidate & { days_left: number }>;
  for (const r of rows) {
    const d = Number(r.days_left);
    if (d !== 3 && d !== 1) continue;
    try {
      await sendStep(
        r,
        `trial-ending-d${d}`,
        trialEndingCopy(d, r.first_name),
        "You're receiving this because you have an active trial at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[lifecycle] trial-ending send failed for ${r.user_id}:`, e);
    }
  }
}

// ─── Entry point (invoked by the durable scheduler) ──────────────────────────
// Each journey is isolated so one failing query doesn't abort the others; the
// outer errors still bubble to Promise.allSettled logging, and the scheduler
// records the run outcome.
export async function runLifecycleJourneys(): Promise<void> {
  const results = await Promise.allSettled([runOnboarding(), runWinback(), runTrialEnding()]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[lifecycle] journey ${["onboarding", "winback", "trial-ending"][i]} failed:`, r.reason);
    }
  });
}
