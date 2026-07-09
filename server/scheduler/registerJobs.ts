// Central registration of every durable, recurring job. This is the single
// place that maps a job name → schedule → work function. Adding a new automated
// job = add one registerJob() block here and export a work function.

import { sql } from "drizzle-orm";
import { db } from "../db";
import { registerJob, startScheduler } from "./scheduler";

export async function bootstrapScheduler(): Promise<void> {
  // Self-provision the messaging engine's tables/columns before any job that
  // writes to message_deliveries runs (mirrors ensureSchedulerSchema).
  const { ensureMessagingSchema } = await import("../messaging");
  await ensureMessagingSchema();

  // Provision the premium-subscription lifecycle state table early so the
  // entitlement gate can read it from the first request (not just after the
  // first webhook / scheduled run).
  const { ensureSubStateSchema } = await import("../services/subscriptionLifecycleService");
  await ensureSubStateSchema().catch((e) =>
    console.warn("[scheduler] ensureSubStateSchema failed:", e?.message || e),
  );

  // Email return-funnel nudges (3/7/14 days after last journal entry).
  registerJob({
    name: "journal-nudge",
    description: "Email return-funnel nudges to survivors 3/7/14 days after their last journal entry.",
    cron: "0 * * * *", // hourly at :00
    handler: async () => {
      const { runJournalNudges } = await import("../journalNudgeService");
      await runJournalNudges();
    },
  });

  // Newsletter drip — send queued editions that are due.
  registerJob({
    name: "newsletter-drip",
    description: "Send due newsletter drip editions from the queue.",
    cron: "5 * * * *", // hourly at :05 (offset to spread load)
    handler: async () => {
      const { runNewsletterDrip } = await import("../newsletterService");
      await runNewsletterDrip();
    },
  });

  // Scheduled blog auto-publish — flip due status='scheduled' recovery-blog
  // posts live and broadcast each to the newsletter list exactly once.
  registerJob({
    name: "blog-auto-publish",
    description: "Publish due scheduled recovery-blog posts and broadcast them to the newsletter.",
    cron: "35 * * * *", // hourly at :35 (offset to spread load)
    handler: async () => {
      const { runScheduledBlogPublish } = await import("../blogPublishService");
      await runScheduledBlogPublish();
    },
  });

  // Proactive coach outreach — static survivor-voice nudges on survivor-state
  // events (missed day, streak milestone, plateau). Static copy only, so the
  // crisis gate is not needed; message_deliveries dedupe keeps it idempotent.
  registerJob({
    name: "coach-outreach",
    description: "State-driven survivor nudges: missed-day, milestone, plateau (static copy).",
    cron: "40 * * * *", // hourly at :40 (offset to spread load)
    handler: async () => {
      const { runCoachOutreach } = await import("../coachOutreachService");
      await runCoachOutreach();
    },
  });

  // Live Circle reminders — day-before + hour-before nudges to RSVP'd survivors,
  // routed through the lifecycle messaging engine (email + push). Static copy so
  // the crisis gate isn't needed; message_deliveries dedupe keeps it idempotent.
  registerJob({
    name: "circle-reminders",
    description: "Remind RSVP'd survivors of upcoming Live Circles (day-before + hour-before, email + push).",
    cron: "50 * * * *", // hourly at :50 (offset to spread load)
    handler: async () => {
      const { runCircleReminders } = await import("../circleReminderService");
      await runCircleReminders();
    },
  });

  // Free-analysis crash recovery — fail rows stuck in "processing".
  registerJob({
    name: "free-analysis-reap",
    description: 'Fail free-video-analysis rows stuck in "processing" past the stale window.',
    cron: "10 * * * *", // hourly at :10
    handler: async () => {
      const { runFreeAnalysisReap } = await import("../routes/freeAnalysisRoutes");
      await runFreeAnalysisReap();
    },
  });

  // Accountability — check-ins, meds, appointments, Sasquatch daily ping.
  // Cron fires on the quarter-hours. The handler keys its slot/time-of-day work
  // off ctx.scheduledFor (the intended fire time), NOT the wall clock, so a slot
  // missed while the server was down still does its work when claimed on boot.
  registerJob({
    name: "accountability-checks",
    description: "Push/email accountability: check-ins, meds, appointments, Sasquatch daily ping.",
    cron: "0,15,30,45 * * * *",
    handler: async (ctx) => {
      const { runAccountabilityChecks } = await import("../pushNotificationService");
      await runAccountabilityChecks(ctx.scheduledFor);
    },
  });

  // Lifecycle journeys — onboarding activation, win-back, trial-ending. Each
  // run recomputes eligibility from real state (no enrollment table); the
  // message_deliveries dedupe makes it safe to run every hour and idempotent
  // across double-runs / restarts.
  registerJob({
    name: "lifecycle-journeys",
    description: "State-driven lifecycle messages: onboarding activation, win-back, trial-ending.",
    cron: "20 * * * *", // hourly at :20 (offset to spread load)
    handler: async () => {
      const { runLifecycleJourneys } = await import("../lifecycleService");
      await runLifecycleJourneys();
    },
  });

  // Subscription revenue durability — dunning reminders, grace-expiry
  // downgrades, and trial-ending nudges for Sasquatch Premium. Idempotent:
  // recomputes eligibility from state each run; message_deliveries dedupe keys
  // make double-runs / restarts safe.
  registerJob({
    name: "subscription-lifecycle",
    description: "Premium dunning reminders, grace-expiry downgrades, trial-ending nudges.",
    cron: "25 * * * *", // hourly at :25 (offset to spread load)
    handler: async () => {
      const { runSubscriptionLifecycle } = await import("../services/subscriptionLifecycleService");
      await runSubscriptionLifecycle();
    },
  });

  // Survivor onboarding drip — Days 1, 3, 5, 7, 10, 14 post-signup.
  // Self-provisions survivor_drip_sends. Idempotent via UNIQUE (user_id, drip_day).
  registerJob({
    name: "survivor-drip",
    description: "Onboarding email drip for platform users (days 1/3/5/7/10/14 post-signup).",
    cron: "15 * * * *", // hourly at :15 (offset from other jobs)
    handler: async () => {
      const { runSurvivorDrip } = await import("../survivorDripService");
      await runSurvivorDrip();
    },
  });

  // Business Intelligence — daily snapshot of funnel/revenue/engagement metrics
  // for trend history. Idempotent (upsert keyed on UTC date); ctx.scheduledFor
  // stamps the snapshot day so a run claimed late still writes its own date.
  registerJob({
    name: "bi-daily-snapshot",
    description: "Capture a daily Business Intelligence metrics snapshot for trend history.",
    cron: "45 4 * * *", // daily at 04:45 UTC (after the run-prune at 04:30)
    handler: async (ctx) => {
      const { captureDailySnapshot } = await import("../services/biMetricsService");
      await captureDailySnapshot(ctx.scheduledFor);
    },
  });

  // Daily Spark video indexer — enrich untagged videos + expire stale boosts.
  registerJob({
    name: "spark-daily-index",
    description: "Enrich community videos with missing tags; expire expired video boosts.",
    cron: "0 3 * * *", // daily at 03:00 UTC
    handler: async () => {
      const { runDailyVideoIndex } = await import("../sparkIndexService");
      await runDailyVideoIndex();
    },
  });

  // HubSpot behavioral triggers — sync quiet survivors (3+ days silent),
  // streak milestones, and abandoned-onboarding signals to HubSpot CRM.
  // Runs daily at 05:00 UTC; idempotent (HubSpot upsert dedupes by email).
  registerJob({
    name: "hubspot-behavioral-sync",
    description: "Sync quiet survivors, streak milestones, and onboarding-abandoned signals to HubSpot CRM.",
    cron: "0 5 * * *", // daily at 05:00 UTC
    handler: async () => {
      const { isHubSpotConfigured, syncQuietSurvivorSignals, syncStreakMilestone, syncOnboardingAbandoned } =
        await import("../hubspotService");
      if (!isHubSpotConfigured()) return;

      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");

      // ── 1. Quiet survivors: last checkin ≥ 3 days ago, email set ──────────
      const quiet = await db.execute(sql`
        SELECT u.id, u.email, u.created_at,
               COALESCE(s.current_streak, 0)       AS streak,
               COALESCE(s.total_active_days, 0)    AS total_active_days,
               EXTRACT(EPOCH FROM (NOW() - MAX(dc.created_at))) / 86400 AS days_since
        FROM users u
        LEFT JOIN streaks s ON s.user_id = u.id
        LEFT JOIN daily_checkins dc ON dc.user_id = u.id
        WHERE u.email IS NOT NULL
        GROUP BY u.id, u.email, u.created_at, s.current_streak, s.total_active_days
        HAVING MAX(dc.created_at) < NOW() - INTERVAL '3 days'
           AND COUNT(dc.id) > 0
        LIMIT 200
      `);
      const quietRows: any[] = Array.isArray((quiet as any).rows) ? (quiet as any).rows : (quiet as any);
      if (quietRows.length > 0) {
        await syncQuietSurvivorSignals(
          quietRows.map((r: any) => ({
            email: r.email,
            daysSinceLastCheckin: Math.round(Number(r.days_since)),
            streak: Number(r.streak),
            totalActiveDays: Number(r.total_active_days),
          })),
        );
      }

      // ── 2. Streak milestones: hit exactly today ────────────────────────────
      const MILESTONES = [30, 60, 90, 180, 365];
      for (const m of MILESTONES) {
        const milestoneRows = await db.execute(sql`
          SELECT u.id, u.email, s.current_streak, s.total_active_days
          FROM streaks s
          JOIN users u ON u.id = s.user_id
          WHERE u.email IS NOT NULL
            AND s.current_streak = ${m}
            AND s.updated_at::date = CURRENT_DATE
          LIMIT 50
        `);
        const rows: any[] = Array.isArray((milestoneRows as any).rows)
          ? (milestoneRows as any).rows : (milestoneRows as any);
        for (const r of rows) {
          await syncStreakMilestone({
            email: r.email,
            streakDays: m,
            totalActiveDays: Number(r.total_active_days),
          });
        }
      }

      // ── 3. Abandoned onboarding: signed up ≥ 48h ago, no checkin ever ─────
      const abandoned = await db.execute(sql`
        SELECT u.id, u.email, u.created_at
        FROM users u
        WHERE u.email IS NOT NULL
          AND u.created_at < NOW() - INTERVAL '48 hours'
          AND NOT EXISTS (SELECT 1 FROM daily_checkins dc WHERE dc.user_id = u.id)
        LIMIT 100
      `);
      const abandonedRows: any[] = Array.isArray((abandoned as any).rows)
        ? (abandoned as any).rows : (abandoned as any);
      for (const r of abandonedRows) {
        await syncOnboardingAbandoned({
          email: r.email,
          signupDate: new Date(r.created_at).toISOString().split("T")[0],
          hoursSinceSignup: Math.round(
            (Date.now() - new Date(r.created_at).getTime()) / 3_600_000,
          ),
        });
      }

      console.log(
        `[hubspot-behavioral-sync] quiet=${quietRows.length} abandoned=${abandonedRows.length}`,
      );
    },
  });

  // Daily badge check — award automated badges (streaks, first-log, first-spark,
  // goal-complete, consistent-4) for all active users. Also runs quarterly tier
  // decay for users who haven't checked in for 90+ days.
  registerJob({
    name: "badge-check",
    description: "Award automated badges for active survivors; decay tiers for inactive ones.",
    cron: "30 2 * * *", // daily at 02:30 UTC (low traffic, after BI snapshot)
    handler: async () => {
      const { runDailyBadgeCheck } = await import("../badgeService");
      await runDailyBadgeCheck();
    },
  });

  // Self-maintenance — prune the run-history table so it doesn't grow forever.
  registerJob({
    name: "scheduler-run-prune",
    description: "Prune scheduled_job_runs history older than 30 days.",
    cron: "30 4 * * *", // daily at 04:30 UTC
    handler: async () => {
      await db.execute(sql`DELETE FROM scheduled_job_runs WHERE created_at < now() - interval '30 days'`);
    },
  });

  await startScheduler();
}
