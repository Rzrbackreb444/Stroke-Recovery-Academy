/**
 * tests/lifecycleService.test.ts — integration tests for the lifecycle-journey
 * AUDIENCE SELECTION (`server/lifecycleService.ts`).
 *
 * Why these tests matter:
 *   - runLifecycleJourneys fires onboarding / win-back / trial-ending nudges to
 *     REAL survivors every hour. The copy, the crisis footer, and the
 *     message_deliveries dedupe are already exercised elsewhere; the one thing
 *     with zero coverage was the cohort SQL — the exact windows that decide who
 *     gets an email. An off-by-one on a day boundary either spams a survivor who
 *     just logged a rep or silently skips someone the nudge was written for.
 *   - We test the extracted, side-effect-free selectors directly
 *     (selectOnboardingCandidates / selectWinbackCandidates /
 *     selectTrialEndingCandidates) so no email is ever sent during the test.
 *   - We also prove the dedupe key is deterministic AND that the
 *     message_deliveries UNIQUE(dedupe_key) claim blocks a second send in the
 *     same window (the real mechanism runLifecycleJourneys relies on).
 *
 * Test isolation:
 *   - Every seeded user id / email is namespaced with a per-run UUID. Each
 *     selector is asserted only against the rows WE seeded (filtered by the run
 *     prefix), so a busy dev DB with other users never makes the test flaky.
 *   - All writes are undone in a finally{} block so a failed assertion never
 *     leaks users, check-ins, journals, subscriptions, nudge logs, or delivery
 *     claims into the dev DB.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import {
  selectOnboardingCandidates,
  selectWinbackCandidates,
  selectTrialEndingCandidates,
  lifecycleDedupeKey,
} from "../server/lifecycleService";

// ── tiny test harness (matches stripeWebhook.test.ts / schedulerLease.test.ts) ─
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: any, msg: string) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    failed++;
    failures.push(msg);
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  }
}

async function run() {
  const runId = randomUUID().slice(0, 8);
  const emailFor = (tag: string) => `lifecycle+${runId}-${tag}@test.invalid`;
  const userIds: string[] = [];

  // Seed a user whose created_at is `ageDays` days ago. Returns the id.
  async function seedUser(tag: string, ageDays: number): Promise<string> {
    const r = await dbPool.query(
      `INSERT INTO users (email, first_name, created_at, updated_at)
       VALUES ($1, $2, now() - ($3 || ' days')::interval, now())
       RETURNING id`,
      [emailFor(tag), "Test", String(ageDays)],
    );
    const id = r.rows[0].id as string;
    userIds.push(id);
    return id;
  }

  async function seedCheckin(userId: string, ageDays: number) {
    await dbPool.query(
      `INSERT INTO daily_checkins (user_id, checkin_date, created_at)
       VALUES ($1, now() - ($2 || ' days')::interval, now() - ($2 || ' days')::interval)`,
      [userId, String(ageDays)],
    );
  }

  async function seedJournal(userId: string, ageDays: number) {
    await dbPool.query(
      `INSERT INTO recovery_journals (user_id, content, created_at)
       VALUES ($1, 'seed', now() - ($2 || ' days')::interval)`,
      [userId, String(ageDays)],
    );
  }

  async function seedNudgeLog(userId: string, nudgeDay: number, sentDaysAgo: number) {
    await dbPool.query(
      `INSERT INTO journal_nudge_log (user_id, nudge_day, sent_at)
       VALUES ($1, $2, now() - ($3 || ' days')::interval)`,
      [userId, nudgeDay, String(sentDaysAgo)],
    );
  }

  // current_period_end `daysOut` days from now (fractional allowed via hours).
  async function seedTrial(userId: string, status: string, hoursOut: number) {
    await dbPool.query(
      `INSERT INTO user_subscriptions (user_id, status, current_period_end, current_period_start)
       VALUES ($1, $2, now() + ($3 || ' hours')::interval, now())`,
      [userId, status, String(hoursOut)],
    );
  }

  // Only look at users this run seeded.
  const mine = (rows: any[]) =>
    rows.filter((r) => userIds.includes(r.user_id));
  const findAge = (rows: any[], id: string) =>
    mine(rows).find((r) => r.user_id === id)?.age_days;
  const findDaysLeft = (rows: any[], id: string) =>
    mine(rows).find((r) => r.user_id === id)?.days_left;

  console.log(`\nlifecycleService.test.ts (runId=${runId})\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    console.log("• Onboarding cohort: day 1/3/7 with zero activity");
    // Slight offset (+0.5 day) so FLOOR() lands squarely inside the target day
    // and never on a boundary that could tip into the neighbouring integer.
    const onbD1 = await seedUser("onb-d1", 1.5); // → age_days 1
    const onbD3 = await seedUser("onb-d3", 3.5); // → age_days 3
    const onbD7 = await seedUser("onb-d7", 7.5); // → age_days 7
    const onbD2 = await seedUser("onb-d2", 2.5); // between windows → excluded
    const onbD10 = await seedUser("onb-d10", 10.5); // past window → excluded
    // Day-3-aged user who HAS activity → excluded (has a check-in).
    const onbActive = await seedUser("onb-active", 3.5);
    await seedCheckin(onbActive, 0);
    // Day-3-aged user who journaled → excluded.
    const onbJournaled = await seedUser("onb-journaled", 3.5);
    await seedJournal(onbJournaled, 0);
    {
      const rows = await selectOnboardingCandidates();
      const ids = new Set(mine(rows).map((r) => r.user_id));
      assert(ids.has(onbD1), "day-1 no-activity user selected");
      assert(ids.has(onbD3), "day-3 no-activity user selected");
      assert(ids.has(onbD7), "day-7 no-activity user selected");
      assert(findAge(rows, onbD1) === 1, "day-1 reports age_days=1");
      assert(findAge(rows, onbD3) === 3, "day-3 reports age_days=3");
      assert(findAge(rows, onbD7) === 7, "day-7 reports age_days=7");
      assert(!ids.has(onbD2), "day-2 (between windows) NOT selected");
      assert(!ids.has(onbD10), "day-10 (past window) NOT selected");
      assert(!ids.has(onbActive), "user with a check-in NOT selected");
      assert(!ids.has(onbJournaled), "user with a journal NOT selected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Win-back cohort: active-then-silent 14/30 days");
    // Older account so the onboarding window can't also catch these.
    const wbD14 = await seedUser("wb-d14", 60);
    await seedCheckin(wbD14, 14.5); // last activity 14 days ago → age_days 14
    const wbD30 = await seedUser("wb-d30", 60);
    await seedJournal(wbD30, 30.5); // last activity 30 days ago → age_days 30
    const wbD20 = await seedUser("wb-d20", 60);
    await seedCheckin(wbD20, 20.5); // between windows → excluded
    // Recent activity in addition to old — MAX(ts) is recent → excluded.
    const wbRecent = await seedUser("wb-recent", 60);
    await seedCheckin(wbRecent, 14.5);
    await seedCheckin(wbRecent, 1);
    // Day-14 silent but already nudged this week → dedupe guard excludes.
    const wbNudged = await seedUser("wb-nudged", 60);
    await seedJournal(wbNudged, 14.5);
    await seedNudgeLog(wbNudged, 14, 2);
    // Day-30 silent AND nudged — guard is day-14 ONLY, so still included.
    const wb30Nudged = await seedUser("wb-d30-nudged", 60);
    await seedJournal(wb30Nudged, 30.5);
    await seedNudgeLog(wb30Nudged, 14, 2);
    {
      const rows = await selectWinbackCandidates();
      const ids = new Set(mine(rows).map((r) => r.user_id));
      assert(ids.has(wbD14), "14-days-silent user selected");
      assert(ids.has(wbD30), "30-days-silent user selected");
      assert(findAge(rows, wbD14) === 14, "14-day reports age_days=14");
      assert(findAge(rows, wbD30) === 30, "30-day reports age_days=30");
      assert(!ids.has(wbD20), "20-days-silent (between windows) NOT selected");
      assert(!ids.has(wbRecent), "user with recent activity NOT selected");
      assert(!ids.has(wbNudged), "day-14 already-nudged-this-week NOT selected");
      assert(ids.has(wb30Nudged), "day-30 is NOT blocked by the day-14 nudge guard");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Trial-ending cohort: trialing with renewal ≤3 days out");
    const trD3 = await seedUser("tr-d3", 5);
    await seedTrial(trD3, "trialing", 60); // 2.5 days out → CEIL → 3
    const trD1 = await seedUser("tr-d1", 5);
    await seedTrial(trD1, "trialing", 12); // 0.5 day out → CEIL → 1
    const trFar = await seedUser("tr-far", 5);
    await seedTrial(trFar, "trialing", 24 * 5); // 5 days out → excluded
    const trPast = await seedUser("tr-past", 5);
    await seedTrial(trPast, "trialing", -12); // already ended → excluded
    const trActive = await seedUser("tr-active", 5);
    await seedTrial(trActive, "active", 12); // not trialing → excluded
    {
      const rows = await selectTrialEndingCandidates();
      const ids = new Set(mine(rows).map((r) => r.user_id));
      assert(ids.has(trD3), "trial ending in ~3 days selected");
      assert(ids.has(trD1), "trial ending in ~1 day selected");
      assert(findDaysLeft(rows, trD3) === 3, "T-3 reports days_left=3");
      assert(findDaysLeft(rows, trD1) === 1, "T-1 reports days_left=1");
      assert(!ids.has(trFar), "trial 5 days out NOT selected");
      assert(!ids.has(trPast), "already-ended trial NOT selected");
      assert(!ids.has(trActive), "non-trialing (active) subscription NOT selected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Dedupe key is deterministic per (step, user)");
    {
      const k1 = lifecycleDedupeKey("onboarding-d1", onbD1);
      const k2 = lifecycleDedupeKey("onboarding-d1", onbD1);
      assert(k1 === k2, "same (category,user) → identical key");
      assert(k1 === `onboarding-d1:email:${onbD1}`, "key shape is category:email:userId");
      assert(
        lifecycleDedupeKey("onboarding-d1", onbD1) !==
          lifecycleDedupeKey("onboarding-d3", onbD1),
        "different step window → different key (a later step can still fire)",
      );
      assert(
        lifecycleDedupeKey("onboarding-d1", onbD1) !==
          lifecycleDedupeKey("onboarding-d1", onbD3),
        "different user → different key",
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• message_deliveries claim blocks a second send in the window");
    {
      const key = lifecycleDedupeKey("onboarding-d1", onbD1);
      // Clean any stray claim from a prior aborted run of the same user id
      // (defensive — ids are per-run so this should be a no-op).
      await dbPool.query(`DELETE FROM message_deliveries WHERE dedupe_key = $1`, [key]);

      const claim = (payload: string) =>
        dbPool.query(
          `INSERT INTO message_deliveries (user_id, email, channel, category, dedupe_key, status)
           VALUES ($1, $2, 'email', 'onboarding-d1', $3, 'sent')
           ON CONFLICT (dedupe_key) DO NOTHING
           RETURNING id`,
          [onbD1, emailFor("onb-d1"), key],
        );

      const first = await claim("first");
      const second = await claim("second");
      assert(first.rows.length === 1, "first claim on the key succeeds");
      assert(second.rows.length === 0, "second claim on the same key is a no-op (duplicate blocked)");

      const count = await dbPool.query(
        `SELECT COUNT(*)::int AS n FROM message_deliveries WHERE dedupe_key = $1`,
        [key],
      );
      assert(count.rows[0].n === 1, "exactly one delivery row exists for the key");
    }
  } finally {
    // Cleanup in finally{} so a failed assertion never leaks rows. Scoped
    // strictly to the users this run seeded — never a broad category/key match,
    // which could wipe real lifecycle delivery rows on a shared dev DB. Delete
    // deliveries first, then the users (check-ins / journals / subscriptions /
    // nudge logs cascade via ON DELETE CASCADE).
    try {
      if (userIds.length) {
        await dbPool.query(
          `DELETE FROM message_deliveries WHERE user_id = ANY($1)`,
          [userIds],
        );
        await dbPool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
      }
    } catch (e) {
      console.error("[cleanup] failed:", e);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  await dbPool.end().catch(() => {});
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (e) => {
  console.error("fatal:", e);
  await dbPool.end().catch(() => {});
  process.exit(2);
});
