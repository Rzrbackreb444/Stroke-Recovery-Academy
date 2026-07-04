/**
 * tests/biMetrics.test.ts — integration tests for the Business Intelligence
 * metrics engine (`server/services/biMetricsService.ts`) and the funnel-event
 * instrumentation it reads from (`server/services/sasquatchFunnelService.ts`).
 *
 * Why these tests matter:
 *   - The admin Business dashboard makes go/no-go decisions off these numbers.
 *     A mis-join or a column rename elsewhere could silently make a stage read
 *     zero, showing leadership wrong business numbers with no failure signal.
 *   - The funnel's trial/paid stages MUST come from real conversion EVENTS
 *     (trial_start / trial_converted), not current subscription state — a
 *     regression back to the state proxy would misrepresent the funnel.
 *
 * Approach: seed one namespaced test user with the full activation footprint
 * (profile + intake + check-in + coach message) plus one trial_start and one
 * trial_converted event, then assert the metrics move by exactly the expected
 * delta versus a baseline. Delta-based so it's robust to other rows in the DB.
 * Cleanup runs in finally{} so a failed assertion never leaks rows.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import {
  computeBusinessMetrics,
  captureDailySnapshot,
  getTrends,
} from "../server/services/biMetricsService";
import {
  recordFunnelEventOnce,
  maybeRecordActivation,
} from "../server/services/sasquatchFunnelService";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(msg);
    console.error("  ✗ " + msg);
  }
}

function stage(m: Awaited<ReturnType<typeof computeBusinessMetrics>>, key: string): number {
  return m.funnel.find((f) => f.key === key)?.count ?? -1;
}

async function main() {
  const uid = `test:bi:${randomUUID()}`;
  // Sentinel 300 days ago: inside getTrends' 365-day window, but far enough
  // back that no real daily snapshot exists for it (scheduler started recently).
  const snapDate = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000);
  const snapDay = snapDate.toISOString().slice(0, 10);

  try {
    const before = await computeBusinessMetrics();

    // ── Seed the full activation footprint ──────────────────────────────
    await db.execute(sql`INSERT INTO users (id, role) VALUES (${uid}, 'creator')`);
    await db.execute(sql`
      INSERT INTO user_profiles (user_id, intake_completed_at, updated_at)
      VALUES (${uid}, now(), now())
    `);
    await db.execute(sql`
      INSERT INTO daily_checkins (user_id, checkin_date) VALUES (${uid}, now())
    `);
    await db.execute(sql`
      INSERT INTO sasquatch_chat_messages (user_id, role, content)
      VALUES (${uid}, 'user', 'test message')
    `);

    // ── recordFunnelEventOnce is idempotent ─────────────────────────────
    await recordFunnelEventOnce({ userId: uid, eventType: "signup" });
    await recordFunnelEventOnce({ userId: uid, eventType: "signup" });
    const signupRows = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM subscription_funnel_events
       WHERE user_id = ${uid} AND event_type = 'signup'
    `);
    assert(
      Number((signupRows.rows as any[])[0]?.c) === 1,
      "recordFunnelEventOnce dedupes: exactly 1 signup event after two calls",
    );

    // ── maybeRecordActivation fires once when the 3-part condition holds ─
    await maybeRecordActivation(uid);
    await maybeRecordActivation(uid);
    const actRows = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM subscription_funnel_events
       WHERE user_id = ${uid} AND event_type = 'activation'
    `);
    assert(
      Number((actRows.rows as any[])[0]?.c) === 1,
      "maybeRecordActivation emits exactly one activation event",
    );

    // ── Activation fires when intake is the LAST criterion to land ──────
    // Seed a second user whose check-in + coach message exist BEFORE intake,
    // then complete intake; maybeRecordActivation (as wired into
    // /profile/complete) must still emit exactly one activation event.
    const uid2 = `test:bi:${randomUUID()}`;
    try {
      await db.execute(sql`INSERT INTO users (id, role) VALUES (${uid2}, 'creator')`);
      await db.execute(sql`INSERT INTO daily_checkins (user_id, checkin_date) VALUES (${uid2}, now())`);
      await db.execute(sql`
        INSERT INTO sasquatch_chat_messages (user_id, role, content)
        VALUES (${uid2}, 'user', 'test message')
      `);
      // No activation yet — intake is still missing.
      await maybeRecordActivation(uid2);
      const pre = await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM subscription_funnel_events
         WHERE user_id = ${uid2} AND event_type = 'activation'
      `);
      assert(
        Number((pre.rows as any[])[0]?.c) === 0,
        "no activation event before intake completes (criteria not yet met)",
      );
      // Now intake lands last — mirror /profile/complete's hook.
      await db.execute(sql`
        INSERT INTO user_profiles (user_id, intake_completed_at, updated_at)
        VALUES (${uid2}, now(), now())
      `);
      await maybeRecordActivation(uid2);
      await maybeRecordActivation(uid2);
      const post = await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM subscription_funnel_events
         WHERE user_id = ${uid2} AND event_type = 'activation'
      `);
      assert(
        Number((post.rows as any[])[0]?.c) === 1,
        "exactly one activation event when intake is the last activation criterion to land",
      );
    } finally {
      await db.execute(sql`DELETE FROM subscription_funnel_events WHERE user_id = ${uid2}`).catch(() => {});
      await db.execute(sql`DELETE FROM sasquatch_chat_messages WHERE user_id = ${uid2}`).catch(() => {});
      await db.execute(sql`DELETE FROM daily_checkins WHERE user_id = ${uid2}`).catch(() => {});
      await db.execute(sql`DELETE FROM user_profiles WHERE user_id = ${uid2}`).catch(() => {});
      await db.execute(sql`DELETE FROM users WHERE id = ${uid2}`).catch(() => {});
    }

    // ── Trial + paid funnel stages come from EVENTS, not sub-state ───────
    await db.execute(sql`
      INSERT INTO subscription_funnel_events (user_id, event_type, plan)
      VALUES (${uid}, 'trial_start', 'monthly'), (${uid}, 'trial_converted', 'monthly')
    `);

    const after = await computeBusinessMetrics();

    // Funnel shape is stable and ordered.
    assert(
      after.funnel.map((f) => f.key).join(",") ===
        "signup,intake,activation,trial,paid,retained",
      "funnel has the six stages in canonical order",
    );

    assert(
      stage(after, "signup") - stage(before, "signup") === 1,
      "seeding one user increments the signup stage by 1",
    );
    assert(
      stage(after, "intake") - stage(before, "intake") === 1,
      "intake_completed_at increments the intake stage by 1",
    );
    assert(
      stage(after, "activation") - stage(before, "activation") === 1,
      "full activation footprint increments the activation stage by 1",
    );
    assert(
      stage(after, "trial") - stage(before, "trial") === 1,
      "a trial_start EVENT increments the trial stage by 1 (event-sourced, not sub-state)",
    );
    assert(
      stage(after, "paid") - stage(before, "paid") === 1,
      "a trial_converted EVENT increments the paid stage by 1 (event-sourced)",
    );

    // ── Conversion denominators are consistent + bounded ────────────────
    const t2p = after.conversion.trialToPaid;
    assert(
      t2p === null || (t2p >= 0 && t2p <= 1),
      "trialToPaid is null or a ratio in [0,1]",
    );

    // ── Snapshot round-trip: mrr_cents comes back as a NUMBER ────────────
    await captureDailySnapshot(snapDate);
    const trends = await getTrends(365); // widest window getTrends allows
    const seeded = trends.find(
      (r: any) => String(r.snapshot_date).slice(0, 10) === snapDay,
    );
    assert(!!seeded, "captureDailySnapshot persists a row readable by getTrends");
    if (seeded) {
      assert(
        typeof seeded.mrr_cents === "number",
        "getTrends coerces BIGINT mrr_cents to a JS number",
      );
    }
  } finally {
    // Cleanup — precise, namespaced, best-effort.
    await db.execute(sql`DELETE FROM subscription_funnel_events WHERE user_id = ${uid}`).catch(() => {});
    await db.execute(sql`DELETE FROM sasquatch_chat_messages WHERE user_id = ${uid}`).catch(() => {});
    await db.execute(sql`DELETE FROM daily_checkins WHERE user_id = ${uid}`).catch(() => {});
    await db.execute(sql`DELETE FROM user_profiles WHERE user_id = ${uid}`).catch(() => {});
    await db.execute(sql`DELETE FROM users WHERE id = ${uid}`).catch(() => {});
    await db.execute(sql`DELETE FROM bi_daily_snapshots WHERE snapshot_date = ${snapDay}::date`).catch(() => {});
  }

  console.log(`\nbiMetrics.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("FAILURES:\n" + failures.map((f) => "  - " + f).join("\n"));
  }
  await dbPool.end().catch(() => {});
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("biMetrics.test crashed:", e);
  await dbPool.end().catch(() => {});
  process.exit(1);
});
