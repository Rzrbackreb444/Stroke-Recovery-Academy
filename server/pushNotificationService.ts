import webPush from 'web-push';
import { db } from './db';
import { sql } from 'drizzle-orm';

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

// VAPID keys — generated once, use env vars in production
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BFK4fdq6Ltp_lB4SXL0Hs55xqf08blT6XMqJAHWlPlXFrnMWnMNOUYl6DJu70IS1j00ORWouZsrf1s0rsG5suog';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'auRSt_RjogvhqAbicipSY3O1ZFVe-GlCm4j9GyvEhgs';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:nick@strokerecoveryacademy.com';

webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
}

// === SCHEDULER ===
export function startAccountabilityScheduler() {
  // Run every minute
  setInterval(runAccountabilityChecks, 60 * 1000);
  console.log('[accountability] Scheduler started — checking every minute');
}

async function runAccountabilityChecks() {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Only run whole-minute checks
  if (minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) return;

  try {
    await Promise.allSettled([
      checkMedicationReminders(now),
      checkAppointmentReminders(now),
      ...(hour === 14 && minute === 0 ? [checkDailyCheckins(now)] : []),   // 9am EST (UTC-5)
      ...(hour === 20 && minute === 0 ? [checkMissedCheckins(now)] : []),   // 3pm EST fallback
    ]);
  } catch (err) {
    console.error('[accountability] Scheduler error:', err);
  }
}

async function checkDailyCheckins(now: Date) {
  // Get all push subscribers
  const subs = await db.select().from(pushSubscriptions);
  const userIds = [...new Set(subs.map(s => s.userId))];

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
  const userIds = [...new Set(subs.map(s => s.userId))];

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
