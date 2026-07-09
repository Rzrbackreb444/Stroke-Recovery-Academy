// ============================================================================
// PROACTIVE COACH OUTREACH (survivor-state events)
// ============================================================================
// The Sasquatch Coach reaches out first when a survivor's own state changes:
//   - missed-day : built momentum (longest streak ≥ 3) but went quiet 1–2 days.
//   - milestone  : current streak just hit 7 / 14 / 21 / 30 / 66 / 100 today.
//   - plateau    : still showing up (≥5 check-ins in 7d) but mood+energy has
//                  stalled or dropped vs the prior week.
//
// CRITICAL SAFETY CONTRACT: every message here is STATIC, pre-written,
// survivor-voice copy. NO AI generation, NO user text echoed back. That is why
// this path does NOT need the Coach crisis gate — there is no model call to
// intercept and no way for the outreach to emit anything but the fixed copy
// below. renderEmail still keeps the 988/crisis callout + medical-disclaimer
// footer on every send. Recomputes eligibility each run from real state (no
// enrollment table); the message_deliveries dedupe makes it idempotent across
// double-runs / restarts. Mirrors server/lifecycleService.ts by design.

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
  body: string;
  ctaLabel: string;
  ctaPath: string;
  pushTitle: string;
  pushBody: string;
}

function ctaButton(label: string, path: string): string {
  return (
    `<p class="body-text" style="text-align:center;margin-top:28px;">` +
    `<a href="${SITE}${path}" style="display:inline-block;background:#E2741B;color:#0E0D0C;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;">${label}</a>` +
    `</p>`
  );
}

// Send both an email (primary, always attempted) and a push (best-effort). Each
// channel gets its own dedupe key so one channel's duplicate/skip doesn't block
// the other. Push failures are non-fatal.
async function sendOutreach(
  c: Candidate,
  category: string,
  dedupeSuffix: string,
  copy: StepCopy,
  whyReceiving: string,
) {
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
    dedupeKey: `${category}:email:${c.user_id}:${dedupeSuffix}`,
    subject: copy.subject,
    html,
    text,
  });
  if (res.status === "sent") {
    console.log(`[coach-outreach] ${category} → ${redactEmail(c.email)}`);
  }

  // Best-effort push — respects prefs/quiet-hours inside sendMessage.
  try {
    await sendMessage({
      userId: c.user_id,
      channel: "push",
      category,
      dedupeKey: `${category}:push:${c.user_id}:${dedupeSuffix}`,
      push: {
        title: copy.pushTitle,
        body: copy.pushBody,
        url: copy.ctaPath,
        type: "coach_outreach",
      },
    });
  } catch (e) {
    console.warn(`[coach-outreach] push failed for ${c.user_id}:`, e);
  }

  return res;
}

// ─── Copy ────────────────────────────────────────────────────────────────────
function missedDayCopy(firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  return {
    subject: "Missed a day — no big deal, let's not miss two",
    previewText: "One quiet day doesn't undo the work. Log one rep and you're back.",
    eyebrow: "Coach checking in",
    headline: "You went quiet a day",
    subheadline: "One rep resets the clock.",
    body:
      `<p class="body-text">${hey}your board's been dark a day or two. Happens — life, fatigue, a rough night. It doesn't erase a single rep you've already banked.</p>` +
      `<p class="body-text">The trap isn't missing one day. It's letting one become five. So don't. Squeeze a hand, say a word, stand ten seconds — log it, and the streak's alive again.</p>` +
      `<p class="body-text">Heart's still thumpin'. Get one on the board.</p>`,
    ctaLabel: "Log one rep",
    ctaPath: "/recovery/dashboard",
    pushTitle: "Coach here — don't miss two",
    pushBody: "One quiet day is fine. Log one rep and you're back in it.",
  };
}

function milestoneCopy(streak: number, firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  return {
    subject: `${streak} days straight — that's the whole game`,
    previewText: `${streak} days of showing up. That's not luck. That's you.`,
    eyebrow: "Milestone",
    headline: `${streak} days straight`,
    subheadline: "You built this, rep by rep.",
    body:
      `<p class="body-text">${hey}${streak} days in a row. Not a fluke, not a good week — a streak you stacked one honest rep at a time.</p>` +
      `<p class="body-text">This is exactly how a stroked-out body rewires itself: consistency it can't argue with. You proved the loop works. Now keep it running.</p>` +
      `<p class="body-text">Heart's still thumpin'. Log today and make it ${streak + 1}.</p>`,
    ctaLabel: "Keep the streak",
    ctaPath: "/recovery/dashboard",
    pushTitle: `${streak}-day streak`,
    pushBody: `${streak} days straight. Log today and make it ${streak + 1}.`,
  };
}

function plateauCopy(firstName?: string | null): StepCopy {
  const hey = firstName ? `Hey ${firstName} — ` : "";
  return {
    subject: "Showing up but stuck? Let's shake it up",
    previewText: "You're doing the reps. The needle's flat. Time to change one thing.",
    eyebrow: "Coach checking in",
    headline: "Stuck is part of it",
    subheadline: "Same reps, new angle.",
    body:
      `<p class="body-text">${hey}you've been showing up — I see it. But the last couple weeks the needle's been flat, and I'd rather name it than pretend.</p>` +
      `<p class="body-text">Plateaus aren't failure. They're the sign your body's ready for a different stimulus. Change one variable: harder rep, new movement, or a real rest day. Then log how it felt.</p>` +
      `<p class="body-text">If something new or scary is going on with your body, that's a call to your doctor — not a rep. But if it's just stalled? We push through it together.</p>`,
    ctaLabel: "Try something new",
    ctaPath: "/recovery/dashboard",
    pushTitle: "Coach here — let's shake it up",
    pushBody: "You're showing up but stuck. Change one variable today.",
  };
}

// ─── Audience selection (SELECT-only, exported for testability) ───────────────

// Missed-day: proven momentum (longest streak ≥ 3) but last activity was 1–2
// days ago. Excludes the win-back window (14/30d) owned by lifecycleService.
export async function selectMissedDayCandidates(): Promise<Array<Candidate & { last_active: string }>> {
  const result = await db.execute(sql`
    SELECT u.id AS user_id, u.email, u.first_name,
           to_char(s.last_activity_date, 'YYYY-MM-DD') AS last_active
    FROM user_streaks s
    JOIN users u ON u.id = s.user_id
    WHERE u.email IS NOT NULL
      AND s.last_activity_date IS NOT NULL
      AND s.longest_streak >= 3
      AND FLOOR(EXTRACT(EPOCH FROM (now() - s.last_activity_date)) / 86400)::int IN (1, 2)
  `);
  return (result.rows || []) as Array<Candidate & { last_active: string }>;
}

// Milestone: current streak is exactly a milestone value AND they were active
// today (so we congratulate the day they hit it, not days later).
export async function selectMilestoneCandidates(): Promise<Array<Candidate & { streak: number }>> {
  const result = await db.execute(sql`
    SELECT u.id AS user_id, u.email, u.first_name, s.current_streak AS streak
    FROM user_streaks s
    JOIN users u ON u.id = s.user_id
    WHERE u.email IS NOT NULL
      AND s.current_streak IN (7, 14, 21, 30, 66, 100)
      AND s.last_activity_date IS NOT NULL
      AND FLOOR(EXTRACT(EPOCH FROM (now() - s.last_activity_date)) / 86400)::int = 0
  `);
  return (result.rows || []).map((r: any) => ({ ...r, streak: Number(r.streak) })) as Array<
    Candidate & { streak: number }
  >;
}

// Plateau: engaged (≥5 check-ins with mood/energy in the last 7d, ≥3 in the
// prior 7d for a baseline) but the 7-day mood+energy average is flat or lower
// than the prior week. Purely relative — no scale-dependent absolute threshold.
export async function selectPlateauCandidates(): Promise<Candidate[]> {
  const result = await db.execute(sql`
    WITH recent AS (
      SELECT user_id,
             AVG((COALESCE(mood_score,0) + COALESCE(energy_score,0)) / 2.0) AS avg_score,
             COUNT(*) AS n
      FROM daily_checkins
      WHERE created_at >= now() - interval '7 days'
        AND (mood_score IS NOT NULL OR energy_score IS NOT NULL)
      GROUP BY user_id
    ),
    prior AS (
      SELECT user_id,
             AVG((COALESCE(mood_score,0) + COALESCE(energy_score,0)) / 2.0) AS avg_score,
             COUNT(*) AS n
      FROM daily_checkins
      WHERE created_at >= now() - interval '14 days'
        AND created_at < now() - interval '7 days'
        AND (mood_score IS NOT NULL OR energy_score IS NOT NULL)
      GROUP BY user_id
    )
    SELECT u.id AS user_id, u.email, u.first_name
    FROM recent r
    JOIN prior p ON p.user_id = r.user_id
    JOIN users u ON u.id = r.user_id
    WHERE u.email IS NOT NULL
      AND r.n >= 5
      AND p.n >= 3
      AND r.avg_score <= p.avg_score
  `);
  return (result.rows || []) as Candidate[];
}

// ISO-week suffix so plateau outreach fires at most once per calendar week.
function isoWeekKey(d: Date = new Date()): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ─── Journeys ────────────────────────────────────────────────────────────────
async function runMissedDay() {
  const rows = await selectMissedDayCandidates();
  for (const r of rows) {
    try {
      await sendOutreach(
        r,
        "coach-missed",
        r.last_active, // one send per distinct lapse
        missedDayCopy(r.first_name),
        "You're receiving this because you've been active at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[coach-outreach] missed-day send failed for ${r.user_id}:`, e);
    }
  }
}

async function runMilestone() {
  const rows = await selectMilestoneCandidates();
  for (const r of rows) {
    try {
      await sendOutreach(
        r,
        `coach-milestone-${r.streak}`,
        String(r.streak), // one send per milestone level
        milestoneCopy(r.streak, r.first_name),
        "You're receiving this because you hit a recovery milestone at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[coach-outreach] milestone send failed for ${r.user_id}:`, e);
    }
  }
}

async function runPlateau() {
  const week = isoWeekKey();
  const rows = await selectPlateauCandidates();
  for (const r of rows) {
    try {
      await sendOutreach(
        r,
        "coach-plateau",
        week, // at most once per calendar week
        plateauCopy(r.first_name),
        "You're receiving this because you've been actively logging at Stroke Recovery Academy. One click below stops these.",
      );
      await new Promise((res) => setTimeout(res, 150));
    } catch (e) {
      console.error(`[coach-outreach] plateau send failed for ${r.user_id}:`, e);
    }
  }
}

// ─── Entry point (invoked by the durable scheduler) ──────────────────────────
export async function runCoachOutreach(): Promise<void> {
  const results = await Promise.allSettled([runMissedDay(), runMilestone(), runPlateau()]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[coach-outreach] ${["missed-day", "milestone", "plateau"][i]} failed:`, r.reason);
    }
  });
}
