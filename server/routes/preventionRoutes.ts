import type { Express } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getUserId } from "../lib/authUtils";

// ============================================================================
// SECOND-STROKE PREVENTION TRACK — non-clinical awareness aggregation.
// ----------------------------------------------------------------------------
// SAFETY CONTRACT: this endpoint NEVER produces a medical score, diagnosis, or
// risk assessment. It surfaces the survivor's OWN logged data (blood pressure
// trend, medication-adherence consistency, activity days) framed as awareness
// and consistency — nothing here is presented as clinical interpretation.
// Anything alarming is routed to "contact your doctor / 911 for FAST signs" in
// the UI, never handled in-app.
// ============================================================================

// Build the per-day expected medication doses from active meds' reminder_times.
// If a med has no reminder_times, we treat it as 1 expected dose/day so the
// adherence loop still has a denominator (awareness, not a clinical claim).
function expectedDailyDoses(meds: Array<{ reminder_times: string[] | null }>): number {
  let total = 0;
  for (const m of meds) {
    const times = Array.isArray(m.reminder_times) ? m.reminder_times.filter(Boolean) : [];
    total += times.length > 0 ? times.length : 1;
  }
  return total;
}

export function registerPreventionRoutes(app: Express, isAuthenticated: any) {
  // GET /api/recovery/prevention — awareness dashboard payload.
  app.get('/api/recovery/prevention', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req) as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // ── Blood-pressure / vitals trend (last 90 days) ──────────────────────
      const vitalsRows = await db.execute(sql`
        SELECT
          blood_pressure_systolic  AS systolic,
          blood_pressure_diastolic AS diastolic,
          heart_rate               AS heart_rate,
          weight                   AS weight,
          measured_at              AS measured_at
        FROM vitals_logs
        WHERE user_id = ${userId}
          AND measured_at >= NOW() - INTERVAL '90 days'
          AND (blood_pressure_systolic IS NOT NULL OR blood_pressure_diastolic IS NOT NULL)
        ORDER BY measured_at ASC
      `).catch(() => ({ rows: [] as any[] }));
      const bpSeries = ((vitalsRows.rows ?? vitalsRows) as any[]).map((r) => ({
        date: r.measured_at,
        systolic: r.systolic != null ? Number(r.systolic) : null,
        diastolic: r.diastolic != null ? Number(r.diastolic) : null,
        heartRate: r.heart_rate != null ? Number(r.heart_rate) : null,
      }));

      const latestBp = bpSeries.length ? bpSeries[bpSeries.length - 1] : null;
      // Awareness-only trend: compare the average of the most recent 3 readings
      // to the 3 before that. Direction words only — never a verdict.
      let bpTrend: 'up' | 'down' | 'steady' | null = null;
      if (bpSeries.length >= 4) {
        const withSys = bpSeries.filter((b) => b.systolic != null);
        if (withSys.length >= 4) {
          const recent = withSys.slice(-3);
          const prior = withSys.slice(-6, -3);
          const avg = (arr: typeof recent) => arr.reduce((s, x) => s + (x.systolic ?? 0), 0) / arr.length;
          const rAvg = avg(recent);
          const pAvg = prior.length ? avg(prior) : rAvg;
          const delta = rAvg - pAvg;
          bpTrend = Math.abs(delta) < 3 ? 'steady' : delta > 0 ? 'up' : 'down';
        }
      }

      // ── Active medications ────────────────────────────────────────────────
      const medRows = await db.execute(sql`
        SELECT id, name, dosage, frequency, reminder_times
        FROM medications
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY name ASC
      `).catch(() => ({ rows: [] as any[] }));
      const meds = ((medRows.rows ?? medRows) as any[]).map((m) => ({
        id: Number(m.id),
        name: m.name as string,
        dosage: m.dosage as string,
        frequency: m.frequency as string,
        reminderTimes: Array.isArray(m.reminder_times) ? (m.reminder_times as string[]) : [],
        reminder_times: m.reminder_times as string[] | null,
      }));

      // ── Medication-adherence consistency (7d / 30d) ───────────────────────
      // Doses logged (not skipped) vs expected. Capped at 100% — this is a
      // consistency signal, not a clinical adherence metric.
      const perDay = expectedDailyDoses(meds);
      const logRows = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE skipped = false AND taken_at >= NOW() - INTERVAL '7 days')  AS taken_7,
          COUNT(*) FILTER (WHERE skipped = false AND taken_at >= NOW() - INTERVAL '30 days') AS taken_30,
          COUNT(*) FILTER (WHERE skipped = true  AND taken_at >= NOW() - INTERVAL '30 days') AS skipped_30,
          MAX(taken_at) AS last_logged
        FROM medication_logs
        WHERE user_id = ${userId}
      `).catch(() => ({ rows: [{ taken_7: 0, taken_30: 0, skipped_30: 0, last_logged: null }] }));
      const l = ((logRows.rows ?? logRows) as any[])[0] ?? {};
      const taken7 = Number(l.taken_7 ?? 0);
      const taken30 = Number(l.taken_30 ?? 0);
      const skipped30 = Number(l.skipped_30 ?? 0);
      const expected7 = perDay * 7;
      const expected30 = perDay * 30;
      const adherence7 = expected7 > 0 ? Math.min(100, Math.round((taken7 / expected7) * 100)) : null;
      const adherence30 = expected30 > 0 ? Math.min(100, Math.round((taken30 / expected30) * 100)) : null;

      // Which meds already have a "taken" or "skipped" log today (drives the
      // "did you take it" loop state in the UI).
      const todayRows = await db.execute(sql`
        SELECT medication_id, bool_or(skipped = false) AS taken, bool_or(skipped = true) AS skipped
        FROM medication_logs
        WHERE user_id = ${userId} AND taken_at >= CURRENT_DATE
        GROUP BY medication_id
      `).catch(() => ({ rows: [] as any[] }));
      const todayMap: Record<number, { taken: boolean; skipped: boolean }> = {};
      for (const r of (todayRows.rows ?? todayRows) as any[]) {
        todayMap[Number(r.medication_id)] = { taken: !!r.taken, skipped: !!r.skipped };
      }

      // ── Activity consistency (active days last 30) ────────────────────────
      const activityRows = await db.execute(sql`
        SELECT COUNT(DISTINCT DATE(checkin_date)) AS active_days
        FROM daily_checkins
        WHERE user_id = ${userId}
          AND checkin_date >= NOW() - INTERVAL '30 days'
          AND COALESCE(exercise_minutes, 0) > 0
      `).catch(() => ({ rows: [{ active_days: 0 }] }));
      const activeDays30 = Number(((activityRows.rows ?? activityRows) as any[])[0]?.active_days ?? 0);

      res.json({
        bp: {
          series: bpSeries,
          latest: latestBp,
          trend: bpTrend,
          count: bpSeries.length,
        },
        medications: meds.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          reminderTimes: m.reminderTimes,
          today: todayMap[m.id] ?? { taken: false, skipped: false },
        })),
        adherence: {
          adherence7,
          adherence30,
          taken7,
          taken30,
          skipped30,
          expectedPerDay: perDay,
          lastLoggedAt: l.last_logged ?? null,
        },
        activity: {
          activeDays30,
        },
      });
    } catch (err) {
      console.error('[prevention] GET /api/recovery/prevention', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });
}
