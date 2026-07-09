// Live Circle reminders — flows through the unified lifecycle messaging engine.
// Finds upcoming scheduled community video sessions with RSVP'd participants and
// sends a day-before + hour-before nudge on email + push + SMS (consent-gated
// per channel by the engine). Every send carries a
// stable dedupeKey (circle-reminder-{sessionId}-{window}-{userId}-{channel}) so
// the hourly cron is fully idempotent across double-runs and restarts.
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sendMessage } from "./messaging";

// Circles now use access-restricted rooms (private Daily rooms need a per-user
// token minted at /api/circles/:id/join). So reminders drive survivors to the
// in-app Circles page where the Join button mints their token — never a raw
// room URL, which would be useless (private) or bypass the enrollment gate.
const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";

type Window = "day" | "hour";

const WINDOWS: Array<{ key: Window; from: string; to: string; label: string }> = [
  { key: "day", from: "24 hours", to: "25 hours", label: "tomorrow" },
  { key: "hour", from: "1 hours", to: "2 hours", label: "in about an hour" },
];

interface DueRow {
  session_id: number;
  title: string | null;
  scheduled_at: string;
  meeting_url: string | null;
  user_id: string;
}

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return "soon";
  }
}

export async function runCircleReminders(): Promise<void> {
  let sent = 0;
  // Track eligible-vs-delivered so we can distinguish a healthy quiet run from a
  // silent failure. `windowRows` = participant-rows that fell into a reminder
  // window this run; `freshAttempts` = rows with at least one non-duplicate
  // channel attempt (a deduped repeat run of an already-reminded session is NOT
  // a failure); `delivered` = rows where at least one channel actually sent.
  let windowRows = 0;
  let freshAttempts = 0;
  let delivered = 0;
  for (const w of WINDOWS) {
    // Scheduled, community-facing sessions falling into this reminder window,
    // joined to every survivor who RSVP'd (participant not left).
    const res = await db.execute(sql`
      SELECT vs.id AS session_id, vs.title, vs.scheduled_at, vs.meeting_url, p.user_id
      FROM video_sessions vs
      JOIN video_session_participants p ON p.session_id = vs.id
      WHERE vs.status = 'scheduled'
        AND vs.scheduled_at IS NOT NULL
        AND vs.scheduled_at BETWEEN now() + interval ${sql.raw(`'${w.from}'`)}
                               AND now() + interval ${sql.raw(`'${w.to}'`)}
        AND p.status <> 'left'
    `);
    const rows = ((res as any).rows ?? res) as DueRow[];

    for (const r of rows) {
      const title = r.title || "Live Circle";
      const when = fmtWhen(r.scheduled_at);
      const link = `${SITE}/recovery/circles`;
      const base = `circle-reminder-${r.session_id}-${w.key}-${r.user_id}`;
      windowRows++;

      // Email
      const emailRes = await sendMessage({
        userId: r.user_id,
        channel: "email",
        category: "circle-reminder",
        dedupeKey: `${base}-email`,
        subject: `Your circle is ${w.label} — ${title}`,
        html: `<p>Heads up, survivor.</p>
<p><strong>${title}</strong> starts ${w.label} — ${when}.</p>
<p>Show up as you are. <a href="${link}">Join here</a> when it's time.</p>
<p style="color:#888;font-size:12px">Live Circles are peer support — not a substitute for medical care. In a crisis, call or text 988.</p>`,
        text: `${title} starts ${w.label} — ${when}. Join: ${link}. Peer support, not medical care. Crisis: call or text 988.`,
      });

      // Push
      const pushRes = await sendMessage({
        userId: r.user_id,
        channel: "push",
        category: "circle-reminder",
        dedupeKey: `${base}-push`,
        push: {
          title: `Circle ${w.label}`,
          body: `${title} — ${when}. Tap to join.`,
          url: "/recovery/circles",
          type: "circle-reminder",
          tag: `circle-${r.session_id}`,
        },
      });

      // SMS — the engine skips if the survivor hasn't consented (sms_disabled /
      // no_phone) and defers in quiet hours, so attempting is always safe.
      const smsRes = await sendMessage({
        userId: r.user_id,
        channel: "sms",
        category: "circle-reminder",
        dedupeKey: `${base}-sms`,
        smsBody: `${title} starts ${w.label} — ${when}. Join: ${link}. Reply STOP to opt out. Crisis: call or text 988.`,
      });

      const results = [emailRes, pushRes, smsRes];
      // "duplicate" means an earlier run already reminded this channel — a
      // deduped repeat, not a fresh eligible attempt. Only count rows that had
      // at least one genuinely new attempt toward the silent-failure heuristic.
      if (results.some((x) => x.status !== "duplicate")) freshAttempts++;
      if (results.some((x) => x.status === "sent")) delivered++;
      sent++;
    }
  }
  if (sent > 0) {
    console.log(
      `[circle-reminders] processed ${sent} participant reminder(s) — ${delivered} delivered, ${freshAttempts} fresh`,
    );
  }
  // Silent-failure signal: sessions WERE in a reminder window this run and had
  // fresh (non-deduped) reminders to send, yet nothing landed on any channel.
  // That points at the messaging engine dropping every send — a survivor-facing
  // miss with no error otherwise. Warn so it's greppable / alertable in logs.
  // (A run with only deduped repeats, or a genuinely quiet window, stays silent.)
  if (windowRows > 0 && freshAttempts > 0 && delivered === 0) {
    console.warn(
      `[circle-reminders] 0 reminders delivered despite ${windowRows} upcoming-session participant(s) with fresh sends — messaging engine may be dropping circle reminders.`,
    );
  }
}
