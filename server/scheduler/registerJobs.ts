// Central registration of every durable, recurring job. This is the single
// place that maps a job name → schedule → work function. Adding a new automated
// job = add one registerJob() block here and export a work function.

import { sql } from "drizzle-orm";
import { db } from "../db";
import { registerJob, startScheduler } from "./scheduler";

export async function bootstrapScheduler(): Promise<void> {
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
  // Cron fires exactly on the quarter-hours; the handler keeps its own internal
  // minute gate as a defensive guard.
  registerJob({
    name: "accountability-checks",
    description: "Push/email accountability: check-ins, meds, appointments, Sasquatch daily ping.",
    cron: "0,15,30,45 * * * *",
    handler: async () => {
      const { runAccountabilityChecks } = await import("../pushNotificationService");
      await runAccountabilityChecks();
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
