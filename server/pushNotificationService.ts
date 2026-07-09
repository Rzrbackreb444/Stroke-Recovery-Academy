import webPush from 'web-push';
import { db } from './db';
import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { pushSubscriptions, dailyCheckins } from '../shared/schema';
import { checkSasquatchDailyPings } from './sasquatchHistoryService';
import { redactEmail } from './lib/redact';

// Ensure push_subscriptions table exists
export async function initPushSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_used TIMESTAMP DEFAULT NOW()
    )
  `);
}

// VAPID keys — must be set via environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:nick@strokerecoveryacademy.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export { VAPID_PUBLIC_KEY };

// Nick's accountability voice for each notification type
const ACCOUNTABILITY_MESSAGES = {
  checkin: [
    { title: "Show up for yourself, Warrior.", body: "Haven't seen your check-in today. The Never Zero rule — one action keeps the streak alive." },
    { title: "Your brain needs this.", body: "Daily check-in isn't optional in my book. 5 minutes. That's all. Show up." },
    { title: "I noticed you haven't checked in.", body: "You didn't come this far to disappear. Open the app. Log something. Anything." },
  ],
  missed_day: [
    { title: "You went dark. I noticed.", body: "You missed a day. That ain't the Never Zero way. Get back up. One rep. Right now." },
    { title: "The streak is waiting for you.", body: "Missing days is how recovery stalls. But you're reading this — that means you're still in the fight." },
    { title: "Every comeback starts with showing up again.", body: "Missed yesterday. Today is your reset. Let's go, Warrior." },
  ],
  two_day_miss: [
    { title: "Two days dark. Your brain is waiting.", body: "I went dark after my stroke too. But I always came back. So will you. Open the app right now." },
    { title: "This is the moment that defines warriors.", body: "Two days missed. Right now is the test. Every survivor who came back had THIS moment." },
  ],
  hydration: [
    { title: "Drink your water, Warrior.", body: "Your brain is 75% water. Hydration drives neuroplasticity. Don't shortchange your recovery." },
    { title: "Water. Now.", body: "Recovery without hydration is like building a house without concrete. Get a glass. Right now." },
  ],
  exercise: [
    { title: "Time to move. Even one rep.", body: "I don't care what your therapist said. Your body wants to move. ONE rep. That's the Never Zero rule." },
    { title: "Neuroplasticity is built one rep at a time.", body: "Your exercise window is now. 10 minutes changes your brain. Let's go." },
    { title: "Your comeback is built in moments like this.", body: "Hard day? Do it anyway. My hardest days brought my biggest breakthroughs." },
  ],
  medication: [
    { title: "Medication time, Warrior.", body: "Don't skip. Your brain is healing and it needs consistent support. Take it, then log it." },
    { title: "Your meds are part of your recovery protocol.", body: "Time for your medication. I don't let anything slide that serves my recovery. Neither should you." },
  ],
  appointment: [
    { title: "Important appointment tomorrow.", body: "Write down your questions tonight. Appointments are where we track the wins — don't waste them." },
    { title: "Your appointment is coming up.", body: "Come prepared. Your progress since last visit? Write it down. Make them see how far you've come." },
  ],
  appointment_1h: [
    { title: "Your appointment is in 1 hour.", body: "Have your questions ready. Bring your medication list. Show up like the warrior you are." },
  ],
  streak_milestone: {
    7:  { title: "7 days straight. You're doing it.", body: "Week 1 done. Most people quit before this. You didn't. I see you, Warrior." },
    14: { title: "14-day streak. Two weeks of Never Zero.", body: "Your brain is rewiring right now. Science says 14 days builds real habit roots. Keep going." },
    21: { title: "21 days. Habit forming.", body: "Three weeks of showing up. Neuroplasticity is compounding. You're proof that impossible is just a starting point." },
    30: { title: "30 days. One month strong.", body: "I remember when 30 days felt impossible for me too. You just proved it isn't. I'm proud of you." },
    66: { title: "66 days. You built the habit.", body: "This is what I built the challenge for. 66 days. The habit is yours now. Day 67 is just the beginning." },
    100: { title: "100 days. Century Club.", body: "100 days of Never Zero. You're not a patient anymore. You're an architect of your own recovery." },
  } as Record<number, { title: string; body: string }>,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sendPush(endpoint: string, p256dh: string, auth: string, payload: object) {
  const subscription = { endpoint, keys: { p256dh, auth } };
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — remove it
      await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`);
    }
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: object) {
  const result = await db.execute(sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}`);
  for (const sub of result.rows as any[]) {
    await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
  }
  await sendExpoPushToUser(userId, payload);
}

// === MOBILE (Expo) PUSH ===
// The mobile companion app registers Expo push tokens via POST /api/mobile/push-token.
// Delivery rides the same sendPushToUser() path as web push, so every consent /
// quiet-hours / dedupe decision made upstream by the messaging engine applies to
// mobile automatically — no separate channel logic.

export async function initMobilePushSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mobile_push_tokens (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      token TEXT NOT NULL UNIQUE,
      platform TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_used TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function registerMobilePushToken(userId: string, token: string, platform?: string) {
  // A token can move between accounts on a shared device — reassign on conflict.
  await db.execute(sql`
    INSERT INTO mobile_push_tokens (user_id, token, platform)
    VALUES (${userId}, ${token}, ${platform ?? null})
    ON CONFLICT (token) DO UPDATE
      SET user_id = ${userId}, platform = COALESCE(${platform ?? null}, mobile_push_tokens.platform), last_used = NOW()
  `);
}

async function sendExpoPushToUser(userId: string, payload: object) {
  try {
    const result = await db.execute(sql`SELECT token FROM mobile_push_tokens WHERE user_id = ${userId}`);
    const tokens = (result.rows as any[]).map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) return;

    const p = payload as { title?: string; body?: string; url?: string; type?: string; tag?: string };
    const messages = tokens.map((to) => ({
      to,
      title: p.title ?? 'Stroke Recovery Academy',
      body: p.body ?? '',
      data: { url: p.url, type: p.type, tag: p.tag },
      sound: 'default' as const,
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) return;
    const json: any = await res.json().catch(() => null);
    // Prune tokens Expo reports as dead so we stop sending to uninstalled apps.
    const tickets: any[] = Array.isArray(json?.data) ? json.data : [];
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (t?.status === 'error' && t?.details?.error === 'DeviceNotRegistered' && tokens[i]) {
        await db.execute(sql`DELETE FROM mobile_push_tokens WHERE token = ${tokens[i]}`);
      }
    }
  } catch {
    // Expo push is best-effort; web push already attempted above.
  }
}

// === RECURRING WORK (invoked by the durable scheduler) ===
// Fired by the durable scheduler on the quarter-hours (cron 0,15,30,45).
// Migrated off a per-process setInterval so it single-fires across instances —
// no duplicate pings.
//
// IMPORTANT — restart-safe catch-up: the slot/time-of-day work below is keyed
// off `scheduledFor` (the time the run was SUPPOSED to fire, passed in by the
// scheduler), NOT wall-clock now. If the server was down over a scheduled slot
// and the scheduler claims the overdue row on recovery, `scheduledFor` is that
// missed slot — so the missed slot's work actually runs instead of being
// dropped because the clock has moved on. `scheduledFor` is cron-aligned
// (minute ∈ {0,15,30,45}, second 0), so the slot math is exact with no
// tolerance window needed.
export async function runAccountabilityChecks(scheduledFor: Date = new Date()) {
  const asOf = scheduledFor;
  const hour = asOf.getUTCHours();
  const minute = asOf.getUTCMinutes();
  const slot = Math.floor(minute / 15) * 15;

  try {
    await Promise.allSettled([
      checkMedicationReminders(asOf),
      checkAppointmentReminders(asOf),
      ...(hour === 14 && slot === 0 ? [checkDailyCheckins(asOf), checkStreakBreakEmails()] : []),   // 9am EST (UTC-5)
      ...(hour === 20 && slot === 0 ? [checkMissedCheckins(asOf)] : []),   // 3pm EST fallback
      // Sasquatch's daily drop-in ping. Fires at 13:00 UTC (~8am EST) — 1 hour
      // before the check-in nudge so survivors get a friendly opener first.
      ...(hour === 13 && slot === 0 ? [checkSasquatchDailyPings(asOf)] : []),
    ]);
  } catch (err) {
    console.error('[accountability] Scheduler error:', err);
  }
}

async function checkDailyCheckins(now: Date) {
  // Get all push subscribers
  const subs = await db.select().from(pushSubscriptions);
  const userIds = Array.from(new Set(subs.map(s => s.userId)));

  for (const userId of userIds) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckin = await db.select().from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), gte(dailyCheckins.checkinDate, today), lte(dailyCheckins.checkinDate, tomorrow)))
      .limit(1);

    if (todayCheckin.length === 0) {
      const msg = pickRandom(ACCOUNTABILITY_MESSAGES.checkin);
      await sendPushToUser(userId, { ...msg, type: 'checkin', url: '/recovery/dashboard?checkin=1', tag: 'daily-checkin' });
    }
  }
}

async function checkMissedCheckins(now: Date) {
  const subs = await db.select().from(pushSubscriptions);
  const userIds = Array.from(new Set(subs.map(s => s.userId)));

  for (const userId of userIds) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Check if they checked in today
    const todayCheckin = await db.select().from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), gte(dailyCheckins.checkinDate, today), lte(dailyCheckins.checkinDate, todayEnd)))
      .limit(1);

    if (todayCheckin.length > 0) continue; // Already checked in today

    // Check yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(today);

    const yesterdayCheckin = await db.select().from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), gte(dailyCheckins.checkinDate, yesterday), lte(dailyCheckins.checkinDate, yesterdayEnd)))
      .limit(1);

    if (yesterdayCheckin.length === 0) {
      // 2+ day miss
      const msg = pickRandom(ACCOUNTABILITY_MESSAGES.two_day_miss);
      await sendPushToUser(userId, { ...msg, type: 'checkin', url: '/recovery/dashboard?checkin=1', tag: 'missed-2day' });
    } else {
      // Just missed today so far — send late-day nudge
      const msg = pickRandom(ACCOUNTABILITY_MESSAGES.missed_day);
      await sendPushToUser(userId, { ...msg, type: 'checkin', url: '/recovery/dashboard?checkin=1', tag: 'missed-today' });
    }
  }
}

// Fires once daily at 9am EST (14:00 UTC). Emails survivors who logged yesterday
// but not yet today — streak is live but at risk. Email-only channel (no push
// subscription required), so it reaches survivors who haven't installed the PWA.
async function checkStreakBreakEmails() {
  try {
    const { sendEmail } = await import('./emailService');

    // Users who have a never_zero_logs entry yesterday but NOT today
    const atRisk = await db.execute(sql`
      SELECT DISTINCT u.id, u.email, u.first_name
      FROM users u
      WHERE u.email IS NOT NULL
        AND u.email NOT LIKE '%placeholder%'
        AND u.email NOT LIKE '%replit%'
        AND EXISTS (
          SELECT 1 FROM never_zero_logs nzl
          WHERE nzl.user_id = u.id
            AND nzl.created_at >= (CURRENT_DATE - INTERVAL '1 day')
            AND nzl.created_at <  CURRENT_DATE
        )
        AND NOT EXISTS (
          SELECT 1 FROM never_zero_logs nzl
          WHERE nzl.user_id = u.id
            AND nzl.created_at >= CURRENT_DATE
        )
    `);

    for (const user of (atRisk.rows as any[])) {
      // nosemgrep: javascript.lang.security.html-in-template-string
      const html = `<!DOCTYPE html><html><body style="background:#0D0D0D;color:#fff;font-family:Arial,sans-serif;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;">
  <div style="color:#E2741B;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:20px;">Stroke Recovery Academy</div>
  <h1 style="font-size:26px;font-weight:900;margin:0 0 14px;line-height:1.2;">Your streak is on the line.</h1>
  <p style="color:#ccc;font-size:16px;line-height:1.7;margin:0 0 8px;">You showed up yesterday. Today's window is still open.</p>
  <p style="color:#ccc;font-size:16px;line-height:1.7;margin:0 0 28px;">One rep — log it before midnight and the streak lives.</p>
  <a href="https://strokerecoveryacademy.com/recovery/never-zero" style="display:inline-block;background:#E2741B;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;letter-spacing:.03em;">Log my rep now</a>
  <p style="color:#555;font-size:12px;margin-top:40px;line-height:1.6;">You're getting this because you're building a recovery streak at Stroke Recovery Academy.<br><a href="https://strokerecoveryacademy.com/account/notifications" style="color:#E2741B;">Manage notifications</a> &nbsp;·&nbsp; <a href="https://strokerecoveryacademy.com/legal/medical-disclaimer" style="color:#666;">Medical disclaimer</a></p>
  <p style="color:#666;font-size:12px;margin-top:4px;">If you're struggling, text 988 or call 911.</p>
</div></body></html>`;

      const text = `Your streak is on the line.\n\nYou showed up yesterday. One rep today keeps it alive.\n\nLog it: https://strokerecoveryacademy.com/recovery/never-zero\n\n— Sasquatch\n\nManage notifications: https://strokerecoveryacademy.com/account/notifications\nIf you're struggling, text 988 or call 911.`;

      const result = await sendEmail({
        to: user.email,
        subject: "Your streak is on the line — one rep saves it",
        html,
        text,
      });

      if (result.success) {
        console.log(`[streak-email] sent to ${redactEmail(user.email)}`);
      } else {
        console.warn(`[streak-email] failed for ${redactEmail(user.email)}: ${result.error}`);
      }
    }
  } catch (err) {
    console.error('[streak-email] error:', err);
  }
}

async function checkMedicationReminders(now: Date) {
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Get all active medications with reminder_times that match current time
  const meds = await db.execute(sql`
    SELECT m.*, p.user_id 
    FROM medications m
    JOIN push_subscriptions p ON p.user_id = m.user_id
    WHERE m.is_active = true
    AND ${timeStr} = ANY(m.reminder_times)
    GROUP BY m.id, p.user_id
  `);

  for (const med of (meds.rows as any[])) {
    const msg = pickRandom(ACCOUNTABILITY_MESSAGES.medication);
    await sendPushToUser(med.user_id, {
      title: msg.title,
      body: `${med.name} ${med.dosage} — ${msg.body}`,
      type: 'medication',
      url: '/recovery/reminders',
      tag: `med-${med.id}-${timeStr}`,
    });
  }
}

async function checkAppointmentReminders(now: Date) {
  // 24-hour reminder
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in24hStart = new Date(in24h);
  in24hStart.setMinutes(0, 0, 0);
  const in24hEnd = new Date(in24hStart);
  in24hEnd.setHours(in24hEnd.getHours() + 1);

  // 1-hour reminder
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in1hStart = new Date(in1h);
  in1hStart.setMinutes(0, 0, 0);
  const in1hEnd = new Date(in1hStart);
  in1hEnd.setHours(in1hEnd.getHours() + 1);

  const appts24h = await db.execute(sql`
    SELECT a.*, p.user_id as push_user_id
    FROM appointments a
    JOIN push_subscriptions p ON p.user_id = a.user_id
    WHERE a.status = 'scheduled'
    AND a.appointment_date >= ${in24hStart.toISOString()}
    AND a.appointment_date < ${in24hEnd.toISOString()}
    AND (a.reminder_sent = false OR a.reminder_sent IS NULL)
    GROUP BY a.id, p.user_id
  `);

  for (const appt of (appts24h.rows as any[])) {
    const msg = pickRandom(ACCOUNTABILITY_MESSAGES.appointment);
    await sendPushToUser(appt.push_user_id, {
      title: `Tomorrow: ${appt.title}`,
      body: `${appt.provider_name} (${appt.provider_type}). ${msg.body}`,
      type: 'appointment',
      url: '/recovery/reminders',
      tag: `appt-24h-${appt.id}`,
    });
    // Mark reminder sent
    await db.execute(sql`UPDATE appointments SET reminder_sent = true WHERE id = ${appt.id}`);
  }

  const appts1h = await db.execute(sql`
    SELECT a.*, p.user_id as push_user_id
    FROM appointments a
    JOIN push_subscriptions p ON p.user_id = a.user_id
    WHERE a.status = 'scheduled'
    AND a.appointment_date >= ${in1hStart.toISOString()}
    AND a.appointment_date < ${in1hEnd.toISOString()}
    GROUP BY a.id, p.user_id
  `);

  for (const appt of (appts1h.rows as any[])) {
    const msg = pickRandom(ACCOUNTABILITY_MESSAGES.appointment_1h);
    await sendPushToUser(appt.push_user_id, {
      title: `In 1 hour: ${appt.title}`,
      body: `${appt.provider_name}. ${msg.body}`,
      type: 'appointment',
      url: '/recovery/reminders',
      tag: `appt-1h-${appt.id}`,
    });
  }
}

export async function checkAndSendStreakMilestone(userId: string, streak: number) {
  const milestones = [7, 14, 21, 30, 66, 100];
  if (!milestones.includes(streak)) return;

  const msg = ACCOUNTABILITY_MESSAGES.streak_milestone[streak];
  if (!msg) return;

  await sendPushToUser(userId, { ...msg, type: 'streak', url: '/recovery/dashboard', tag: `streak-${streak}` });
}
