import { db } from "../../db";
import { sql } from "drizzle-orm";
import type {
  DeficitPoint,
  ConsistencyPoint,
  VolumePoint,
  MoodPoint,
  FlickerPoint,
  VitalsPoint,
  MilestonePoint,
  RecoveryReport,
  PublicRecoveryReport,
} from "@shared/reportTypes";

// ============================================================================
// Shareable Recovery Report — outcome computation
// ----------------------------------------------------------------------------
// Reads only ALREADY-STORED survivor data (no new collection) and shapes it
// into longitudinal outcome trends. Two projections:
//   - buildOwnerReport(userId): full view for the survivor + their PDF.
//   - toPublicProjection(report): display-only view for a consent-gated share
//     link. Strips every free-text field (flicker moments, notes, celebration
//     notes, identifiers) — never raw journal text, medical notes, or PII.
// Non-clinical framing lives in the client/PDF; this layer is pure data.
// Shapes live in shared/reportTypes.ts so the client stays in sync.
// ============================================================================

export type {
  DeficitPoint,
  ConsistencyPoint,
  VolumePoint,
  MoodPoint,
  FlickerPoint,
  VitalsPoint,
  MilestonePoint,
  RecoveryReport,
  PublicRecoveryReport,
};

function rows(result: any): any[] {
  return (result?.rows ?? result ?? []) as any[];
}

function isoDay(value: any): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the full owner-facing recovery report from stored data only.
 * Every section degrades gracefully to an empty array for new survivors.
 */
export async function buildOwnerReport(userId: string): Promise<RecoveryReport> {
  const [
    streakRes,
    allTimeRepsRes,
    assessRes,
    repDayRes,
    checkinRes,
    exVolRes,
    exSessionsRes,
    flickerRes,
    vitalsRes,
    milestoneRes,
    firstActivityRes,
  ] = await Promise.all([
    db.execute(sql`
      SELECT current_streak, longest_streak, total_active_days
      FROM user_streaks WHERE user_id = ${userId}
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(reps), 0) AS total_reps
      FROM never_zero_logs WHERE user_id = ${userId}
    `),
    db.execute(sql`
      SELECT physical, cognitive, speech, emotional, memory, taken_at
      FROM sasquatch_assessments WHERE user_id = ${userId}
      ORDER BY taken_at ASC
    `),
    db.execute(sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, SUM(reps) AS reps
      FROM never_zero_logs WHERE user_id = ${userId}
      GROUP BY day ORDER BY day ASC
    `),
    db.execute(sql`
      SELECT DATE(checkin_date AT TIME ZONE 'UTC') AS day,
             AVG(mood_score) AS mood, AVG(energy_score) AS energy
      FROM daily_checkins WHERE user_id = ${userId}
      GROUP BY day ORDER BY day ASC
    `),
    db.execute(sql`
      SELECT DATE(logged_at AT TIME ZONE 'UTC') AS day,
             SUM(sets * reps) AS reps, COUNT(*) AS sessions
      FROM recovery_exercise_logs WHERE user_id = ${userId}
      GROUP BY day ORDER BY day ASC
    `),
    db.execute(sql`
      SELECT COUNT(*) AS sessions FROM recovery_exercise_logs WHERE user_id = ${userId}
    `),
    db.execute(sql`
      SELECT moment, body_part, intensity, is_breakthrough, created_at
      FROM flicker_logs WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `),
    db.execute(sql`
      SELECT blood_pressure_systolic, blood_pressure_diastolic, heart_rate, measured_at
      FROM vitals_logs WHERE user_id = ${userId}
      ORDER BY measured_at ASC
    `),
    db.execute(sql`
      SELECT m.name AS name, m.category AS category, l.achieved_at AS achieved_at
      FROM user_milestone_logs l
      JOIN recovery_milestones m ON m.id = l.milestone_id
      WHERE l.user_id = ${userId}
      ORDER BY l.achieved_at ASC
    `),
    db.execute(sql`
      SELECT MIN(d) AS first FROM (
        SELECT MIN(created_at) AS d FROM never_zero_logs WHERE user_id = ${userId}
        UNION ALL SELECT MIN(checkin_date) FROM daily_checkins WHERE user_id = ${userId}
        UNION ALL SELECT MIN(taken_at) FROM sasquatch_assessments WHERE user_id = ${userId}
        UNION ALL SELECT MIN(created_at) FROM flicker_logs WHERE user_id = ${userId}
        UNION ALL SELECT MIN(logged_at) FROM recovery_exercise_logs WHERE user_id = ${userId}
      ) t
    `),
  ]);

  const streak = rows(streakRes)[0] ?? {};

  // Sasquatch Scale trend (1-10 self-rated function snapshots, higher is stronger, chronological)
  const deficitTrend: DeficitPoint[] = rows(assessRes).map((r) => ({
    date: isoDay(r.taken_at),
    physical: r.physical ?? null,
    cognitive: r.cognitive ?? null,
    speech: r.speech ?? null,
    emotional: r.emotional ?? null,
    memory: r.memory ?? null,
  }));

  // Consistency — merge reps + checkins by day
  const repMap: Record<string, number> = {};
  for (const r of rows(repDayRes)) repMap[r.day] = Number(r.reps) || 0;
  const checkinMap: Record<string, { mood: number | null; energy: number | null }> = {};
  const moodEnergy: MoodPoint[] = [];
  for (const r of rows(checkinRes)) {
    const day = r.day;
    const mood = r.mood != null ? Math.round(Number(r.mood) * 10) / 10 : null;
    const energy = r.energy != null ? Math.round(Number(r.energy) * 10) / 10 : null;
    checkinMap[day] = { mood, energy };
    moodEnergy.push({ date: day, mood, energy });
  }
  const consistencyDays = Array.from(new Set([...Object.keys(repMap), ...Object.keys(checkinMap)])).sort();
  const consistency: ConsistencyPoint[] = consistencyDays.map((day) => ({
    date: day,
    reps: repMap[day] ?? 0,
    checkedIn: !!checkinMap[day],
  }));

  // Exercise volume — aggregate the daily rows into weeks
  const weekMap: Record<string, { reps: number; sessions: number }> = {};
  for (const r of rows(exVolRes)) {
    const wk = mondayOf(r.day);
    if (!weekMap[wk]) weekMap[wk] = { reps: 0, sessions: 0 };
    weekMap[wk].reps += Number(r.reps) || 0;
    weekMap[wk].sessions += Number(r.sessions) || 0;
  }
  const exerciseVolume: VolumePoint[] = Object.keys(weekMap)
    .sort()
    .map((weekStart) => ({ weekStart, reps: weekMap[weekStart].reps, sessions: weekMap[weekStart].sessions }));

  const flickerRows = rows(flickerRes);
  const flickers: FlickerPoint[] = flickerRows.map((r) => ({
    date: isoDay(r.created_at),
    bodyPart: r.body_part ?? null,
    intensity: Number(r.intensity) || 1,
    isBreakthrough: !!r.is_breakthrough,
    moment: r.moment ? String(r.moment) : undefined,
  }));

  const vitals: VitalsPoint[] = rows(vitalsRes)
    .map((r) => ({
      date: isoDay(r.measured_at),
      systolic: r.blood_pressure_systolic ?? null,
      diastolic: r.blood_pressure_diastolic ?? null,
      heartRate: r.heart_rate ?? null,
    }))
    .filter((v) => v.systolic != null || v.diastolic != null || v.heartRate != null);

  const milestones: MilestonePoint[] = rows(milestoneRes).map((r) => ({
    date: isoDay(r.achieved_at),
    name: String(r.name),
    category: String(r.category),
  }));

  const firstActivity = rows(firstActivityRes)[0]?.first ?? null;
  const memberSince = firstActivity ? isoDay(firstActivity) : null;
  const daysTracked = memberSince
    ? Math.max(1, Math.round((Date.now() - new Date(memberSince + "T00:00:00Z").getTime()) / 86400000))
    : 0;

  const breakthroughCount = flickers.filter((f) => f.isBreakthrough).length;
  const exerciseSessions = Number(rows(exSessionsRes)[0]?.sessions) || 0;

  const summary = {
    currentStreak: Number(streak.current_streak) || 0,
    longestStreak: Number(streak.longest_streak) || 0,
    totalActiveDays: Number(streak.total_active_days) || 0,
    totalReps: Number(rows(allTimeRepsRes)[0]?.total_reps) || 0,
    exerciseSessions,
    flickerCount: flickers.length,
    breakthroughCount,
    milestoneCount: milestones.length,
    assessmentCount: deficitTrend.length,
  };

  const hasData =
    summary.totalReps > 0 ||
    summary.totalActiveDays > 0 ||
    deficitTrend.length > 0 ||
    flickers.length > 0 ||
    vitals.length > 0 ||
    milestones.length > 0 ||
    consistency.length > 0 ||
    exerciseSessions > 0;

  return {
    generatedAt: new Date().toISOString(),
    hasData,
    tenure: { memberSince, daysTracked },
    summary,
    deficitTrend,
    consistency,
    exerciseVolume,
    moodEnergy,
    flickers,
    vitals,
    milestones,
  };
}

/**
 * Strip everything not safe for an unauthenticated share visitor. Removes the
 * free-text flicker "moment" (the only user-authored prose in the report).
 * Trends, counts, milestone names, body-part categories, and vitals numbers
 * are safe display projections. No userId, no notes, no journal text.
 */
export function toPublicProjection(report: RecoveryReport): PublicRecoveryReport {
  return {
    ...report,
    flickers: report.flickers.map(({ moment, ...rest }) => rest),
  };
}
