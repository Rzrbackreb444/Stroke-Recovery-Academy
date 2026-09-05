import { db } from "./db";
import { sql } from "drizzle-orm";

export type SummaryAudience = "survivor" | "caregiver" | "clinician";
export type SummaryPhase = "before" | "after";

function rows(result: any): any[] {
  return (result?.rows ?? result) as any[];
}

export function summaryIdForWindow(windowDays: number): string {
  return `recovery-handoff-v1-${windowDays}d`;
}

export async function canAccessRecoverySummary(
  actorId: string,
  survivorId: string,
  audience: SummaryAudience,
): Promise<boolean> {
  if (audience === "survivor") return actorId === survivorId;
  if (audience === "caregiver") {
    const result = await db.execute(sql`
      SELECT 1
      FROM caregiver_links
      WHERE caregiver_id = ${actorId}
        AND survivor_id = ${survivorId}
        AND status = 'active'
      LIMIT 1
    `);
    return rows(result).length > 0;
  }

  // Clinician access is limited to an active patient assignment or an active
  // professional caregiver link. We never infer clinical access from a
  // client-supplied role string alone.
  const result = await db.execute(sql`
    SELECT 1
    WHERE EXISTS (
      SELECT 1 FROM patient_assignments
      WHERE therapist_id = ${actorId}
        AND patient_id = ${survivorId}
        AND status IN ('pending', 'active', 'paused')
    )
    OR EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = ${actorId}
        AND survivor_id = ${survivorId}
        AND status = 'active'
        AND relationship = 'professional'
    )
    LIMIT 1
  `);
  return rows(result).length > 0;
}

export async function buildRecoverySummary(
  survivorId: string,
  windowDays = 14,
): Promise<{
  summaryId: string;
  windowDays: number;
  generatedAt: string;
  activity: {
    checkinDays: number;
    practiceDays: number;
    reflectionDays: number;
    firstActivityDate: string | null;
    lastActivityDate: string | null;
  };
}> {
  const days = Math.max(1, Math.min(90, Math.floor(windowDays)));
  const result = await db.execute(sql`
    WITH activity AS (
      SELECT checkin_date::date AS activity_date
        FROM daily_checkins
       WHERE user_id = ${survivorId}
         AND checkin_date >= CURRENT_DATE - (${days} - 1) * INTERVAL '1 day'
      UNION
      SELECT date::date AS activity_date
        FROM routine_completions
       WHERE user_id = ${survivorId}
         AND date::date >= CURRENT_DATE - (${days} - 1) * INTERVAL '1 day'
      UNION
      SELECT created_at::date AS activity_date
        FROM recovery_journals
       WHERE user_id = ${survivorId}
         AND created_at >= NOW() - (${days} - 1) * INTERVAL '1 day'
    ),
    checkins AS (
      SELECT COUNT(DISTINCT checkin_date::date)::int AS count
        FROM daily_checkins
       WHERE user_id = ${survivorId}
         AND checkin_date >= CURRENT_DATE - (${days} - 1) * INTERVAL '1 day'
    ),
    practice AS (
      SELECT COUNT(DISTINCT date::date)::int AS count
        FROM routine_completions
       WHERE user_id = ${survivorId}
         AND date::date >= CURRENT_DATE - (${days} - 1) * INTERVAL '1 day'
    ),
    reflections AS (
      SELECT COUNT(DISTINCT created_at::date)::int AS count
        FROM recovery_journals
       WHERE user_id = ${survivorId}
         AND created_at >= NOW() - (${days} - 1) * INTERVAL '1 day'
    )
    SELECT
      (SELECT count FROM checkins) AS checkin_days,
      (SELECT count FROM practice) AS practice_days,
      (SELECT count FROM reflections) AS reflection_days,
      MIN(activity_date)::text AS first_activity_date,
      MAX(activity_date)::text AS last_activity_date
    FROM activity
  `);
  const row = rows(result)[0] ?? {};
  return {
    summaryId: summaryIdForWindow(days),
    windowDays: days,
    generatedAt: new Date().toISOString(),
    activity: {
      checkinDays: Number(row.checkin_days ?? 0),
      practiceDays: Number(row.practice_days ?? 0),
      reflectionDays: Number(row.reflection_days ?? 0),
      firstActivityDate: row.first_activity_date ?? null,
      lastActivityDate: row.last_activity_date ?? null,
    },
  };
}

export async function getActorSummaryMeasurement(
  actorId: string,
  summaryId: string,
): Promise<{ before: any | null; after: any | null }> {
  const result = await db.execute(sql`
    SELECT phase, usefulness, uncertainty, clarity, actionability,
           review_time_seconds
      FROM recovery_summary_measurement_events
     WHERE actor_id = ${actorId}
       AND summary_id = ${summaryId}
       AND event_type = 'feedback_submitted'
     ORDER BY created_at DESC
  `);
  const measurement = { before: null as any, after: null as any };
  for (const row of rows(result)) {
    if (row.phase === "before" && !measurement.before) measurement.before = row;
    if (row.phase === "after" && !measurement.after) measurement.after = row;
  }
  return measurement;
}

export async function recordSummaryEvent(input: {
  survivorId: string;
  actorId: string;
  actorType: SummaryAudience;
  eventType: "summary_viewed" | "summary_exported" | "feedback_submitted";
  summaryId: string;
  phase?: SummaryPhase;
  usefulness?: number;
  uncertainty?: number;
  clarity?: number;
  actionability?: number;
  reviewTimeSeconds?: number;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO recovery_summary_measurement_events
      (survivor_id, actor_id, actor_type, event_type, summary_id, phase,
       usefulness, uncertainty, clarity, actionability, review_time_seconds)
    VALUES
      (${input.survivorId}, ${input.actorId}, ${input.actorType},
       ${input.eventType}, ${input.summaryId}, ${input.phase ?? null},
       ${input.usefulness ?? null}, ${input.uncertainty ?? null},
       ${input.clarity ?? null}, ${input.actionability ?? null},
       ${input.reviewTimeSeconds ?? null})
  `);
}

function average(values: any[]): number | null {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length
    ? Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 100) / 100
    : null;
}

export async function buildSummaryPilotReport(windowDays = 90): Promise<any> {
  const days = Math.max(1, Math.min(365, Math.floor(windowDays)));
  const result = await db.execute(sql`
      SELECT actor_id, summary_id, actor_type, phase, usefulness, uncertainty,
             clarity, actionability, review_time_seconds
      FROM recovery_summary_measurement_events
     WHERE event_type = 'feedback_submitted'
       AND created_at >= NOW() - ${days} * INTERVAL '1 day'
  `);
  const feedback = rows(result);
  const by = (actorType: SummaryAudience, phase?: SummaryPhase) =>
    feedback.filter((row) => row.actor_type === actorType && (!phase || row.phase === phase));
  const survivorCaregiver = feedback.filter((row) =>
    row.actor_type === "survivor" || row.actor_type === "caregiver",
  );
  const before = survivorCaregiver.filter((row) => row.phase === "before");
  const after = survivorCaregiver.filter((row) => row.phase === "after");
  const clinicians = by("clinician");
  const beforeUsefulness = average(before.map((row) => row.usefulness));
  const afterUsefulness = average(after.map((row) => row.usefulness));
  const beforeUncertainty = average(before.map((row) => row.uncertainty));
  const afterUncertainty = average(after.map((row) => row.uncertainty));
  const usefulnessLift = beforeUsefulness !== null && afterUsefulness !== null
    ? Math.round((afterUsefulness - beforeUsefulness) * 100) / 100
    : null;
  const uncertaintyReduction = beforeUncertainty !== null && afterUncertainty !== null
    ? Math.round((beforeUncertainty - afterUncertainty) * 100) / 100
    : null;
  const meanReviewSeconds = average(clinicians.map((row) => row.review_time_seconds));
  const meanClarity = average(clinicians.map((row) => row.clarity));
  const meanActionability = average(clinicians.map((row) => row.actionability));

  let decision: "improve" | "price" | "discontinue" = "improve";
  let decisionReason = "Collect more paired ratings before making a pricing or discontinuation decision.";
  if (
    clinicians.length >= 5 &&
    survivorCaregiver.length >= 10 &&
    (usefulnessLift ?? 0) >= 0.75 &&
    (uncertaintyReduction ?? 0) >= 0.5 &&
    (meanReviewSeconds ?? Infinity) <= 300
  ) {
    decision = "price";
    decisionReason = "Paired ratings show lower uncertainty and higher usefulness while clinician review stays under five minutes.";
  } else if (
    clinicians.length >= 5 &&
    survivorCaregiver.length >= 10 &&
    (meanClarity ?? 5) < 3 &&
    (meanActionability ?? 5) < 3 &&
    (meanReviewSeconds ?? 0) > 600
  ) {
    decision = "discontinue";
    decisionReason = "The sample is large enough and shows low clinician value with review taking more than ten minutes.";
  }

  return {
    windowDays: days,
    privacy: {
      included: "Aggregated ratings, role, phase, summary version, and review seconds only.",
      excluded: "Journal text, check-in answers, symptoms, diagnoses, names, and export contents.",
    },
    sample: {
      totalFeedbackEvents: feedback.length,
      survivorCaregiverRespondents: new Set(survivorCaregiver.map((row) => row.actor_id)).size,
      clinicianFeedbackEvents: clinicians.length,
      pairedBeforeAfterCount: new Set(
        before
          .filter((row) => after.some((afterRow) =>
            afterRow.actor_id === row.actor_id && afterRow.summary_id === row.summary_id,
          ))
          .map((row) => `${row.actor_id}:${row.summary_id}`),
      ).size,
    },
    survivorCaregiver: {
      beforeUsefulness: beforeUsefulness,
      afterUsefulness: afterUsefulness,
      usefulnessLift,
      beforeUncertainty,
      afterUncertainty,
      uncertaintyReduction,
    },
    clinician: {
      meanClarity,
      meanActionability,
      meanReviewSeconds,
    },
    decision,
    decisionReason,
  };
}