// Business Intelligence (Task #4) — in-house funnel + metrics.
//
// This service is the single source of truth for the admin Business dashboard.
// It computes the survivor lifecycle funnel, revenue (MRR / subscription
// state), engagement (DAU / WAU / activation), churn, and lifecycle-message
// performance by aggregating the platform's own Postgres tables plus the
// Stripe mirror (`stripe.*`). No third-party analytics vendor is involved.
//
// Design notes:
//   - Top-of-funnel (signup → intake → activation → retained) is COMPUTED from
//     source-of-truth tables (users, user_profiles, daily_checkins,
//     sasquatch_chat_messages, user_streaks) rather than event capture, so the
//     numbers are always exact and self-heal — no fragile client instrumentation
//     to keep in sync.
//   - The paid sub-funnel (page_view → checkout → trial → paid) reuses the
//     existing `subscription_funnel_events` table (sasquatchFunnelService) so we
//     don't double-instrument the checkout path.
//   - Revenue (MRR, active/trialing/at-risk) reads the durable
//     `sasquatch_premium_subscriptions` state table (subscriptionLifecycleService)
//     joined to Stripe price amounts.
//   - Trend history is a daily snapshot written by a scheduler job into the
//     runtime-provisioned `bi_daily_snapshots` table (db:push is blocked on this
//     repl by the external `stripe` schema — we self-provision like siblings do).
//
// ACTIVATION DEFINITION (documented, computable, defensible):
//   A survivor is "activated" once they have (1) completed intake
//   (user_profiles.intake_completed_at set) AND (2) logged at least one daily
//   check-in AND (3) sent at least one message to the Sasquatch Coach. That is
//   the "aha" moment — profile set up plus both core recovery loops touched.

import { db } from "../db";
import { sql } from "drizzle-orm";

// ── Schema self-provisioning ────────────────────────────────────────────────
let snapshotSchemaReady: Promise<void> | null = null;

export async function ensureBiSchema(): Promise<void> {
  if (snapshotSchemaReady) return snapshotSchemaReady;
  snapshotSchemaReady = (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bi_daily_snapshots (
        snapshot_date DATE PRIMARY KEY,
        signups_total INTEGER NOT NULL DEFAULT 0,
        intake_total INTEGER NOT NULL DEFAULT 0,
        activated_total INTEGER NOT NULL DEFAULT 0,
        active_subs INTEGER NOT NULL DEFAULT 0,
        trialing_subs INTEGER NOT NULL DEFAULT 0,
        at_risk_subs INTEGER NOT NULL DEFAULT 0,
        mrr_cents BIGINT NOT NULL DEFAULT 0,
        dau INTEGER NOT NULL DEFAULT 0,
        wau INTEGER NOT NULL DEFAULT 0,
        activation_rate REAL NOT NULL DEFAULT 0,
        metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    // Depth columns added after the base table shipped — additive so an existing
    // snapshots table is upgraded in place (db:push is blocked on this repl).
    await db.execute(sql`ALTER TABLE bi_daily_snapshots ADD COLUMN IF NOT EXISTS loop_completion_rate REAL`);
    await db.execute(sql`ALTER TABLE bi_daily_snapshots ADD COLUMN IF NOT EXISTS return_rate REAL`);
  })()
    .then(() => undefined)
    .catch((err: any) => {
      snapshotSchemaReady = null; // let a transient hiccup retry
      throw err;
    });
  return snapshotSchemaReady;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface BusinessMetrics {
  generatedAt: string;
  funnel: FunnelStage[];
  revenue: {
    mrrCents: number;
    arrCents: number;
    activeSubs: number;
    trialingSubs: number;
    atRiskSubs: number;
    downgradedSubs: number;
    monthlySubs: number;
    annualSubs: number;
    founderSubs: number;
  };
  conversion: {
    signupToIntake: number | null;
    intakeToActivation: number | null;
    trialToPaid: number | null;
    trialCancelRate: number | null;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number | null;
    activationRate: number | null;
    activatedTotal: number;
    signupsTotal: number;
  };
  churn: {
    downgradedLast30: number;
    canceledTrialsLast30: number;
  };
  depth: {
    // Of survivors active today, the share that closed the daily accountability
    // loop (logged a Never Zero audit rep today).
    loopCompletionRate: number | null;
    loopCompletedToday: number;
    // Of survivors active 8–30 days ago, the share that came back in the last 7
    // days — a durable return/retention proxy independent of subscription state.
    returnRate: number | null;
    priorCohort: number;
    returnedCohort: number;
  };
  lifecycleMessages: Array<{ category: string; sent: number; failed: number }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ratio(numer: number, denom: number): number | null {
  if (!denom) return null;
  return numer / denom;
}

// Price amounts for the two premium plans, from the Stripe mirror. Monthly
// amount is a full MRR contribution; annual amount is divided by 12. Returns
// cents. Best-effort — if the catalog can't be read we fall back to 0 so the
// dashboard still renders the rest of the metrics.
async function getPlanAmounts(): Promise<{ monthlyCents: number; annualCents: number; founderCents: number }> {
  try {
    const { getSasquatchPremiumPriceIds, getSasquatchFounderPriceId } = await import("./sasquatchPremiumService");
    const prices = await getSasquatchPremiumPriceIds();
    if (!prices) return { monthlyCents: 0, annualCents: 0, founderCents: 0 };
    const founderPriceId = await getSasquatchFounderPriceId();
    const ids = [prices.monthlyPriceId, prices.annualPriceId];
    if (founderPriceId) ids.push(founderPriceId);
    const r = await db.execute(sql`
      SELECT id, unit_amount FROM stripe.prices
       WHERE id IN (${sql.join(ids, sql`, `)})
    `);
    let monthlyCents = 0;
    let annualCents = 0;
    let founderCents = 0;
    for (const row of r.rows as any[]) {
      if (String(row.id) === prices.monthlyPriceId) monthlyCents = num(row.unit_amount);
      else if (String(row.id) === prices.annualPriceId) annualCents = num(row.unit_amount);
      else if (founderPriceId && String(row.id) === founderPriceId) founderCents = num(row.unit_amount);
    }
    return { monthlyCents, annualCents, founderCents };
  } catch (e: any) {
    console.warn("[bi] getPlanAmounts failed", e?.message || e);
    return { monthlyCents: 0, annualCents: 0, founderCents: 0 };
  }
}

// ── Revenue ─────────────────────────────────────────────────────────────────
async function computeRevenue(): Promise<BusinessMetrics["revenue"]> {
  const { ensureSubStateSchema } = await import("./subscriptionLifecycleService");
  await ensureSubStateSchema();
  const { monthlyCents, annualCents, founderCents } = await getPlanAmounts();

  // Entitled = active|trialing, OR past_due still within grace (not downgraded).
  // Count by plan among entitled subs to compute MRR.
  const r = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') AS active_subs,
      COUNT(*) FILTER (WHERE status = 'trialing') AS trialing_subs,
      COUNT(*) FILTER (
        WHERE payment_state = 'failed' AND downgraded_at IS NULL
          AND grace_period_end IS NOT NULL AND grace_period_end > now()
      ) AS at_risk_subs,
      COUNT(*) FILTER (WHERE downgraded_at IS NOT NULL) AS downgraded_subs,
      COUNT(*) FILTER (WHERE plan = 'monthly' AND status IN ('active','trialing')) AS monthly_subs,
      COUNT(*) FILTER (WHERE plan = 'annual' AND status IN ('active','trialing')) AS annual_subs,
      COUNT(*) FILTER (WHERE plan = 'founder' AND status IN ('active','trialing')) AS founder_subs
    FROM sasquatch_premium_subscriptions
  `);
  const row = (r.rows as any[])[0] || {};
  const monthlySubs = num(row.monthly_subs);
  const annualSubs = num(row.annual_subs);
  const founderSubs = num(row.founder_subs);
  // MRR: monthly plans contribute the monthly amount; annual plans contribute
  // their amount amortized over 12 months. Founder bills monthly, so it is a
  // full MRR contribution at the Founder's Circle rate.
  const mrrCents = Math.round(
    monthlySubs * monthlyCents + annualSubs * (annualCents / 12) + founderSubs * founderCents,
  );

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    activeSubs: num(row.active_subs),
    trialingSubs: num(row.trialing_subs),
    atRiskSubs: num(row.at_risk_subs),
    downgradedSubs: num(row.downgraded_subs),
    monthlySubs,
    annualSubs,
    founderSubs,
  };
}

// ── Funnel + engagement (source-of-truth tables) ────────────────────────────
async function computeFunnelAndEngagement(): Promise<{
  funnel: FunnelStage[];
  engagement: BusinessMetrics["engagement"];
  churn: BusinessMetrics["churn"];
  conversion: Pick<BusinessMetrics["conversion"], "signupToIntake" | "intakeToActivation">;
}> {
  // Signups + intake completion.
  const users = await db.execute(sql`SELECT COUNT(*)::int AS c FROM users`);
  const signupsTotal = num((users.rows as any[])[0]?.c);

  const intake = await db.execute(sql`
    SELECT COUNT(*)::int AS c FROM user_profiles WHERE intake_completed_at IS NOT NULL
  `);
  const intakeTotal = num((intake.rows as any[])[0]?.c);

  // Activation: intake complete AND ≥1 check-in AND ≥1 coach message.
  const activated = await db.execute(sql`
    SELECT COUNT(*)::int AS c
      FROM user_profiles up
     WHERE up.intake_completed_at IS NOT NULL
       AND EXISTS (SELECT 1 FROM daily_checkins dc WHERE dc.user_id = up.user_id)
       AND EXISTS (SELECT 1 FROM sasquatch_chat_messages m WHERE m.user_id = up.user_id AND m.role = 'user')
  `);
  const activatedTotal = num((activated.rows as any[])[0]?.c);

  // Retained: activated survivors with a streak that has stayed alive in the
  // last 7 days (a durable proxy for "still here").
  const retained = await db.execute(sql`
    SELECT COUNT(*)::int AS c
      FROM user_streaks s
     WHERE s.current_streak >= 3
       AND s.last_activity_date IS NOT NULL
       AND s.last_activity_date >= now() - interval '7 days'
  `);
  const retainedTotal = num((retained.rows as any[])[0]?.c);

  // Paid sub-funnel counts from real events in subscription_funnel_events (the
  // instrumented conversion path), NOT current subscription state. Using events
  // means the funnel counts everyone who *started* a trial / *converted* to paid
  // over time, including those who later churned — the correct funnel semantics.
  // (Live current-book counts still drive the revenue block above.)
  async function eventUsers(eventType: string): Promise<number> {
    try {
      const r = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::int AS c
          FROM subscription_funnel_events
         WHERE event_type = ${eventType} AND user_id IS NOT NULL
      `);
      return num((r.rows as any[])[0]?.c);
    } catch {
      // Table may not exist yet — non-fatal.
      return 0;
    }
  }
  const trialStarts = await eventUsers("trial_start");
  const paid = await eventUsers("trial_converted");

  const funnel: FunnelStage[] = [
    { key: "signup", label: "Signups", count: signupsTotal },
    { key: "intake", label: "Intake complete", count: intakeTotal },
    { key: "activation", label: "Activated", count: activatedTotal },
    { key: "trial", label: "Trials started", count: trialStarts },
    { key: "paid", label: "Converted to paid", count: paid },
    { key: "retained", label: "Retained (streak ≥3, 7d active)", count: retainedTotal },
  ];

  // DAU / WAU / MAU — distinct users with ANY recovery activity in the window.
  // Activity = a daily check-in, a coach message, or a never-zero audit rep.
  async function activeUsers(interval: string): Promise<number> {
    const r = await db.execute(sql`
      SELECT COUNT(DISTINCT uid)::int AS c FROM (
        SELECT user_id AS uid FROM daily_checkins WHERE created_at >= now() - ${sql.raw(`interval '${interval}'`)}
        UNION
        SELECT user_id AS uid FROM sasquatch_chat_messages WHERE created_at >= now() - ${sql.raw(`interval '${interval}'`)}
        UNION
        SELECT user_id AS uid FROM never_zero_audits WHERE created_at >= now() - ${sql.raw(`interval '${interval}'`)}
      ) t
      WHERE uid IS NOT NULL
    `);
    return num((r.rows as any[])[0]?.c);
  }
  const dau = await activeUsers("1 day");
  const wau = await activeUsers("7 days");
  const mau = await activeUsers("30 days");

  // Churn (last 30 days).
  await (await import("./subscriptionLifecycleService")).ensureSubStateSchema();
  const churnR = await db.execute(sql`
    SELECT COUNT(*)::int AS c FROM sasquatch_premium_subscriptions
     WHERE downgraded_at IS NOT NULL AND downgraded_at >= now() - interval '30 days'
  `);
  const downgradedLast30 = num((churnR.rows as any[])[0]?.c);

  let canceledTrialsLast30 = 0;
  try {
    const c = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM subscription_funnel_events
       WHERE event_type = 'trial_canceled' AND created_at >= now() - interval '30 days'
    `);
    canceledTrialsLast30 = num((c.rows as any[])[0]?.c);
  } catch {
    // subscription_funnel_events may not exist yet — non-fatal.
  }

  return {
    funnel,
    engagement: {
      dau,
      wau,
      mau,
      dauWauRatio: ratio(dau, wau),
      activationRate: ratio(activatedTotal, signupsTotal),
      activatedTotal,
      signupsTotal,
    },
    churn: { downgradedLast30, canceledTrialsLast30 },
    conversion: {
      signupToIntake: ratio(intakeTotal, signupsTotal),
      intakeToActivation: ratio(activatedTotal, intakeTotal),
    },
  };
}

// ── Depth / retention ───────────────────────────────────────────────────────
async function computeDepth(): Promise<BusinessMetrics["depth"]> {
  // Daily loop completion: of survivors active today, how many closed the loop
  // (logged a Never Zero audit rep today). Denominator matches DAU's activity
  // union so the ratio is "of people who showed up, how many finished".
  const dauR = await db.execute(sql`
    SELECT COUNT(DISTINCT uid)::int AS c FROM (
      SELECT user_id AS uid FROM daily_checkins WHERE created_at >= now() - interval '1 day'
      UNION
      SELECT user_id AS uid FROM sasquatch_chat_messages WHERE created_at >= now() - interval '1 day'
      UNION
      SELECT user_id AS uid FROM never_zero_audits WHERE created_at >= now() - interval '1 day'
    ) t WHERE uid IS NOT NULL
  `);
  const activeToday = num((dauR.rows as any[])[0]?.c);

  const loopR = await db.execute(sql`
    SELECT COUNT(DISTINCT user_id)::int AS c
      FROM never_zero_audits
     WHERE created_at >= now() - interval '1 day'
       AND today_count > 0
       AND user_id IS NOT NULL
  `);
  const loopCompletedToday = num((loopR.rows as any[])[0]?.c);

  // Return rate: of survivors active 8–30 days ago, how many returned in the
  // last 7 days. Both windows use the same activity union as DAU/WAU.
  const priorR = await db.execute(sql`
    SELECT COUNT(DISTINCT uid)::int AS c FROM (
      SELECT user_id AS uid FROM daily_checkins WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
      UNION
      SELECT user_id AS uid FROM sasquatch_chat_messages WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
      UNION
      SELECT user_id AS uid FROM never_zero_audits WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
    ) t WHERE uid IS NOT NULL
  `);
  const priorCohort = num((priorR.rows as any[])[0]?.c);

  const returnedR = await db.execute(sql`
    WITH prior AS (
      SELECT DISTINCT uid FROM (
        SELECT user_id AS uid FROM daily_checkins WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
        UNION
        SELECT user_id AS uid FROM sasquatch_chat_messages WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
        UNION
        SELECT user_id AS uid FROM never_zero_audits WHERE created_at >= now() - interval '30 days' AND created_at < now() - interval '7 days'
      ) t WHERE uid IS NOT NULL
    ),
    recent AS (
      SELECT DISTINCT uid FROM (
        SELECT user_id AS uid FROM daily_checkins WHERE created_at >= now() - interval '7 days'
        UNION
        SELECT user_id AS uid FROM sasquatch_chat_messages WHERE created_at >= now() - interval '7 days'
        UNION
        SELECT user_id AS uid FROM never_zero_audits WHERE created_at >= now() - interval '7 days'
      ) t WHERE uid IS NOT NULL
    )
    SELECT COUNT(*)::int AS c FROM prior p JOIN recent r ON r.uid = p.uid
  `);
  const returnedCohort = num((returnedR.rows as any[])[0]?.c);

  return {
    loopCompletionRate: ratio(loopCompletedToday, activeToday),
    loopCompletedToday,
    returnRate: ratio(returnedCohort, priorCohort),
    priorCohort,
    returnedCohort,
  };
}

// ── Lifecycle message performance ───────────────────────────────────────────
async function computeLifecycleMessages(): Promise<
  BusinessMetrics["lifecycleMessages"]
> {
  try {
    const { ensureMessagingSchema } = await import("../messaging");
    await ensureMessagingSchema();
    const r = await db.execute(sql`
      SELECT category,
             COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
             COUNT(*) FILTER (WHERE status <> 'sent')::int AS failed
        FROM message_deliveries
       WHERE created_at >= now() - interval '30 days'
    GROUP BY category
    ORDER BY sent DESC
    `);
    return (r.rows as any[]).map((row) => ({
      category: String(row.category),
      sent: num(row.sent),
      failed: num(row.failed),
    }));
  } catch (e: any) {
    console.warn("[bi] lifecycle messages failed", e?.message || e);
    return [];
  }
}

// ── Public: full metrics snapshot for the dashboard ─────────────────────────
export async function computeBusinessMetrics(): Promise<BusinessMetrics> {
  const [rev, fe, depth, lifecycle] = await Promise.all([
    computeRevenue(),
    computeFunnelAndEngagement(),
    computeDepth(),
    computeLifecycleMessages(),
  ]);

  // Trial→paid + trial-cancel-rate from the paid sub-funnel events (last 90d).
  let trialToPaid: number | null = null;
  let trialCancelRate: number | null = null;
  try {
    const r = await db.execute(sql`
      SELECT event_type, COUNT(*)::int AS c FROM subscription_funnel_events
       WHERE created_at >= now() - interval '90 days'
         AND event_type IN ('trial_start','trial_converted','trial_canceled')
    GROUP BY event_type
    `);
    const m: Record<string, number> = {};
    for (const row of r.rows as any[]) m[String(row.event_type)] = num(row.c);
    trialToPaid = ratio(m.trial_converted || 0, m.trial_start || 0);
    trialCancelRate = ratio(m.trial_canceled || 0, m.trial_start || 0);
  } catch {
    // no events table yet — leave null.
  }

  return {
    generatedAt: new Date().toISOString(),
    funnel: fe.funnel,
    revenue: rev,
    conversion: {
      signupToIntake: fe.conversion.signupToIntake,
      intakeToActivation: fe.conversion.intakeToActivation,
      trialToPaid,
      trialCancelRate,
    },
    engagement: fe.engagement,
    churn: fe.churn,
    depth,
    lifecycleMessages: lifecycle,
  };
}

// ── Daily snapshot (scheduler job) ──────────────────────────────────────────
// Idempotent: keyed on snapshot_date, upserts so a re-run for the same UTC day
// refreshes rather than duplicates.
export async function captureDailySnapshot(scheduledFor?: Date): Promise<void> {
  await ensureBiSchema();
  const m = await computeBusinessMetrics();
  const day = (scheduledFor ?? new Date()).toISOString().slice(0, 10);
  await db.execute(sql`
    INSERT INTO bi_daily_snapshots
      (snapshot_date, signups_total, intake_total, activated_total,
       active_subs, trialing_subs, at_risk_subs, mrr_cents, dau, wau,
       activation_rate, loop_completion_rate, return_rate, metrics)
    VALUES
      (${day}::date, ${m.engagement.signupsTotal},
       ${m.funnel.find((f) => f.key === "intake")?.count ?? 0},
       ${m.engagement.activatedTotal}, ${m.revenue.activeSubs},
       ${m.revenue.trialingSubs}, ${m.revenue.atRiskSubs}, ${m.revenue.mrrCents},
       ${m.engagement.dau}, ${m.engagement.wau},
       ${m.engagement.activationRate ?? 0},
       ${m.depth.loopCompletionRate}, ${m.depth.returnRate},
       ${JSON.stringify(m)}::jsonb)
    ON CONFLICT (snapshot_date) DO UPDATE SET
      signups_total = EXCLUDED.signups_total,
      intake_total = EXCLUDED.intake_total,
      activated_total = EXCLUDED.activated_total,
      active_subs = EXCLUDED.active_subs,
      trialing_subs = EXCLUDED.trialing_subs,
      at_risk_subs = EXCLUDED.at_risk_subs,
      mrr_cents = EXCLUDED.mrr_cents,
      dau = EXCLUDED.dau,
      wau = EXCLUDED.wau,
      activation_rate = EXCLUDED.activation_rate,
      loop_completion_rate = EXCLUDED.loop_completion_rate,
      return_rate = EXCLUDED.return_rate,
      metrics = EXCLUDED.metrics,
      created_at = now()
  `);
}

// ── Trend read for the dashboard ────────────────────────────────────────────
export async function getTrends(days = 30): Promise<any[]> {
  await ensureBiSchema();
  const lim = Math.min(Math.max(days, 1), 365);
  const r = await db.execute(sql`
    SELECT snapshot_date, signups_total, intake_total, activated_total,
           active_subs, trialing_subs, at_risk_subs, mrr_cents, dau, wau,
           activation_rate, loop_completion_rate, return_rate
      FROM bi_daily_snapshots
     WHERE snapshot_date >= (now()::date - (${lim} || ' days')::interval)
  ORDER BY snapshot_date ASC
  `);
  // mrr_cents is BIGINT → Postgres returns it as a string; coerce so the client
  // gets clean numbers for charting.
  return ((r.rows as any[]) || []).map((row) => ({
    ...row,
    mrr_cents: num(row.mrr_cents),
  }));
}
