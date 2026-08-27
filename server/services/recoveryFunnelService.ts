import { db } from "../db";
import { sql } from "drizzle-orm";

export type RecoveryFunnelEventType =
  | "assessment_completed"
  | "plan_generated"
  | "onboarding_completed"
  | "today_entered"
  | "first_rep";

const EVENT_TYPES: RecoveryFunnelEventType[] = [
  "assessment_completed",
  "plan_generated",
  "onboarding_completed",
  "today_entered",
  "first_rep",
];

let tableReady: Promise<void> | null = null;

/**
 * The migration is the normal installation path. Keeping this guarded
 * initializer makes the recovery flow safe on an older database while the
 * migration is being rolled out across environments.
 */
export async function ensureRecoveryFunnelTable(): Promise<void> {
  if (tableReady) return tableReady;

  tableReady = db.execute(sql`
    CREATE TABLE IF NOT EXISTS recovery_funnel_events (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type VARCHAR(64) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT recovery_funnel_user_event_unique UNIQUE (user_id, event_type)
    )
  `)
    .then(async () => {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS recovery_funnel_event_occurred_idx
          ON recovery_funnel_events (event_type, occurred_at)
      `);
      // Backfill milestones that predate this instrumentation. This makes the
      // first report useful immediately, while each unique key keeps retries
      // and a later migration backfill harmless.
      await db.execute(sql`
        INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
        SELECT user_id, 'assessment_completed',
               jsonb_build_object('assessmentId', MIN(id)),
               COALESCE(MIN(taken_at), NOW())
          FROM sasquatch_assessments
         GROUP BY user_id
        ON CONFLICT (user_id, event_type) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
        SELECT user_id, 'plan_generated',
               jsonb_build_object('planId', MIN(id)),
               COALESCE(MIN(generated_at), NOW())
          FROM survivor_plans
         GROUP BY user_id
        ON CONFLICT (user_id, event_type) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
        SELECT user_id, 'onboarding_completed',
               jsonb_build_object('planId', MIN(id)),
               COALESCE(MIN(generated_at), NOW())
          FROM survivor_plans
         GROUP BY user_id
        ON CONFLICT (user_id, event_type) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
        SELECT user_id, 'today_entered', '{}'::jsonb,
               COALESCE(MIN(created_at), NOW())
          FROM routine_feedback
         GROUP BY user_id
        ON CONFLICT (user_id, event_type) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
        SELECT user_id, 'first_rep',
               jsonb_build_object('taskId', MIN(task_id)),
               COALESCE(MIN(created_at), NOW())
          FROM routine_feedback
         WHERE reaction <> 'skipped'
         GROUP BY user_id
        ON CONFLICT (user_id, event_type) DO NOTHING
      `);
    })
    .then(() => undefined)
    .catch((error) => {
      tableReady = null;
      throw error;
    });

  return tableReady;
}

/**
 * Records a milestone exactly once for a survivor. The optional executor is
 * used by Today feedback so the milestone and feedback share one transaction.
 */
export async function recordRecoveryFunnelEvent(
  userId: string,
  eventType: RecoveryFunnelEventType,
  metadata: Record<string, unknown> = {},
  executor: { execute: (query: unknown) => Promise<unknown> } = db as any,
): Promise<void> {
  if (!EVENT_TYPES.includes(eventType)) {
    throw new Error(`Unknown recovery funnel event: ${eventType}`);
  }

  await ensureRecoveryFunnelTable();
  await executor.execute(sql`
    INSERT INTO recovery_funnel_events (user_id, event_type, metadata, occurred_at)
    VALUES (${userId}, ${eventType}, ${JSON.stringify(metadata)}::jsonb, NOW())
    ON CONFLICT (user_id, event_type) DO NOTHING
  `);
}

export interface RecoveryFunnelReport {
  rangeDays: number;
  totals: Record<RecoveryFunnelEventType, number>;
  stages: Array<{
    eventType: RecoveryFunnelEventType;
    label: string;
    count: number;
    percentOfAssessments: number;
    dropOffFromPrevious: number | null;
  }>;
}

const STAGE_LABELS: Record<RecoveryFunnelEventType, string> = {
  assessment_completed: "Assessment completed",
  plan_generated: "Plan generated",
  onboarding_completed: "Onboarding completed",
  today_entered: "Entered Today",
  first_rep: "First non-skipped rep",
};

export async function getRecoveryFunnelReport(days: number): Promise<RecoveryFunnelReport> {
  await ensureRecoveryFunnelTable();
  const result = await db.execute(sql`
    SELECT event_type, COUNT(*)::int AS count
      FROM recovery_funnel_events
     WHERE occurred_at >= NOW() - (${days} || ' days')::interval
     GROUP BY event_type
  `);

  const totals = Object.fromEntries(EVENT_TYPES.map((eventType) => [eventType, 0])) as Record<
    RecoveryFunnelEventType,
    number
  >;
  for (const row of result.rows as Array<{ event_type: string; count: number | string }>) {
    if (EVENT_TYPES.includes(row.event_type as RecoveryFunnelEventType)) {
      totals[row.event_type as RecoveryFunnelEventType] = Number(row.count);
    }
  }

  const assessmentCount = totals.assessment_completed;
  const stageOrder: RecoveryFunnelEventType[] = [
    "assessment_completed",
    "plan_generated",
    "onboarding_completed",
    "today_entered",
    "first_rep",
  ];
  let previousCount: number | null = null;
  const stages = stageOrder.map((eventType) => {
    const count = totals[eventType];
    const stage = {
      eventType,
      label: STAGE_LABELS[eventType],
      count,
      percentOfAssessments: assessmentCount > 0 ? Math.round((count / assessmentCount) * 1000) / 10 : 0,
      dropOffFromPrevious: previousCount === null ? null : Math.max(0, previousCount - count),
    };
    previousCount = count;
    return stage;
  });

  return { rangeDays: days, totals, stages };
}