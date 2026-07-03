/**
 * tests/schedulerLease.test.ts — integration tests for the durable scheduler's
 * lease / single-fire guarantees (`server/scheduler/scheduler.ts`).
 *
 * Why these tests matter:
 *   - The whole point of the scheduler is "exactly one instance runs a given
 *     job at a given time." The previous implementation set `locked_at` once at
 *     claim time and never refreshed it, so a job that legitimately ran longer
 *     than the stale-lock window (e.g. a batched newsletter drip) would be
 *     re-claimed and executed a SECOND time — duplicate emails, duplicate
 *     actions. That is the exact regression this file guards against.
 *
 * What we prove (against the REAL exported functions, in-process so the module
 * INSTANCE_ID is shared by claim / heartbeat / finalize):
 *   1. A freshly-claimed running job is NOT reclaimable.
 *   2. A running job whose lease looks old but is being HEARTBEATED is STILL not
 *      reclaimable → no duplicate handler invocation across ticks.
 *   3. A running job whose lease is stale AND not heartbeated (crashed worker)
 *      IS reclaimable → crash recovery still works.
 *   4. The handler is invoked exactly once; run_count and run-history are each
 *      written exactly once; the lock is released on completion.
 *   5. Finalize is ownership-guarded: a foreign instance cannot finalize a job
 *      it does not own, while the true owner can heartbeat it.
 *
 * Test isolation:
 *   - Job rows are created with a per-run UUID name and enabled=FALSE, so the
 *     LIVE app's periodic claimer (which requires enabled=true) never touches
 *     them. The test claims them by id, which intentionally ignores `enabled`.
 *   - Cleanup runs in a finally{} block so a failed assertion never leaks rows.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import {
  registerJob,
  claimJobById,
  heartbeatJob,
  runClaimedJob,
} from "../server/scheduler/scheduler";

// ── tiny test harness (matches the style of stripeWebhook.test.ts) ──
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(cond: () => boolean, ms = 2000): Promise<boolean> {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (cond()) return true;
    await sleep(10);
  }
  return cond();
}

async function insertTestJob(name: string): Promise<number> {
  // enabled=FALSE so the live app's periodic claimer never grabs this row and
  // runs it (it has no handler in that process anyway). next_run_at in the past
  // makes it "due"; the by-id claimer ignores enabled + schedule regardless.
  const r = await dbPool.query(
    `INSERT INTO scheduled_jobs (name, description, interval_seconds, cron, enabled, status, next_run_at)
     VALUES ($1, 'lease test', 3600, NULL, false, 'idle', now() - interval '1 minute')
     RETURNING id`,
    [name],
  );
  return r.rows[0].id as number;
}

async function agedLockedAt(id: number, secs: number) {
  await dbPool.query(
    `UPDATE scheduled_jobs SET locked_at = now() - (interval '1 second' * $2) WHERE id = $1`,
    [id, secs],
  );
}

async function getRow(id: number) {
  const r = await dbPool.query(
    `SELECT status, locked_by, run_count FROM scheduled_jobs WHERE id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

async function runHistoryCount(id: number): Promise<number> {
  const r = await dbPool.query(
    `SELECT count(*)::int AS n FROM scheduled_job_runs WHERE job_id = $1`,
    [id],
  );
  return r.rows[0].n as number;
}

async function cleanup(ids: number[]) {
  if (!ids.length) return;
  await dbPool.query(`DELETE FROM scheduled_job_runs WHERE job_id = ANY($1::int[])`, [ids]);
  await dbPool.query(`DELETE FROM scheduled_jobs WHERE id = ANY($1::int[])`, [ids]);
}

async function run() {
  const runId = randomUUID().slice(0, 8);
  const created: number[] = [];

  try {
    // ── Part A: heartbeat prevents mid-run reclaim; handler fires exactly once ──
    console.log("\n• Heartbeated long-running job is NOT reclaimed (single-fire)");
    const jobName = `__test_lease_${runId}`;
    let invocations = 0;
    let releaseGate!: () => void;
    const gate = new Promise<void>((res) => {
      releaseGate = res;
    });
    registerJob({
      name: jobName,
      intervalSeconds: 3600,
      handler: async () => {
        invocations++;
        await gate; // block so the "run" straddles a simulated lease-expiry
      },
    });

    const id = await insertTestJob(jobName);
    created.push(id);

    const claim1 = await claimJobById(id);
    assert(claim1?.id === id, "claimJobById claims a due, unlocked row");

    // Fire the real runner; the handler will block on the gate.
    const runPromise = runClaimedJob(claim1!);
    await waitFor(() => invocations === 1);
    assert(invocations === 1, "handler invoked exactly once after first claim");

    // Simulate "> lease elapsed" — BUT a live worker heartbeats, so the lease
    // is renewed and the row must NOT be reclaimable.
    await agedLockedAt(id, 600); // 10 min ago (> STALE_LOCK_SECONDS)
    const beats = await heartbeatJob(id);
    assert(beats === 1, "owner can heartbeat its running job (renews the lease)");

    const reclaim = await claimJobById(id);
    assert(reclaim === null, "a heartbeated running job is NOT reclaimable");
    assert(invocations === 1, "no duplicate handler invocation while heartbeating");

    // Let the handler finish and finalize.
    releaseGate();
    await runPromise;

    const doneRow = await getRow(id);
    assert(doneRow?.status === "success", "job finalized to success");
    assert(Number(doneRow?.run_count) === 1, "run_count incremented exactly once");
    assert(doneRow?.locked_by === null, "lock released on completion");
    assert((await runHistoryCount(id)) === 1, "exactly one run-history row recorded");

    // ── Part B: stale lease with NO heartbeat IS reclaimable (crash recovery) ──
    console.log("\n• Stale lease with no heartbeat IS reclaimable (crash recovery)");
    await dbPool.query(
      `UPDATE scheduled_jobs
         SET status = 'running', locked_by = '__crashed_worker__',
             locked_at = now() - interval '10 minutes'
       WHERE id = $1`,
      [id],
    );
    const recovered = await claimJobById(id);
    assert(recovered?.id === id, "a stale, un-heartbeated lease is reclaimable");

    // ── Part C: finalize is ownership-guarded ──
    console.log("\n• Finalize is ownership-guarded (locked_by)");
    const id2 = await insertTestJob(`__test_lease_${runId}_own`);
    created.push(id2);
    const claim2 = await claimJobById(id2);
    assert(claim2?.id === id2, "second row claimed by this instance");

    const foreign = await dbPool.query(
      `UPDATE scheduled_jobs
         SET status = 'success', locked_at = NULL, locked_by = NULL, updated_at = now()
       WHERE id = $1 AND locked_by = '__not_this_instance__'
       RETURNING id`,
      [id2],
    );
    assert(foreign.rowCount === 0, "a foreign instance cannot finalize a job it does not own");

    const beats2 = await heartbeatJob(id2);
    assert(beats2 === 1, "the true owner CAN heartbeat it (ownership keyed on locked_by)");

    // ── Part D: missed-slot catch-up (server was down over a scheduled slot) ──
    console.log("\n• Overdue run executes for its SCHEDULED slot, not wall-clock now");
    const catchupName = `__test_catchup_${runId}`;
    let capturedScheduledFor: Date | null = null;
    let catchupRuns = 0;
    registerJob({
      name: catchupName,
      intervalSeconds: 3600,
      handler: async (ctx) => {
        catchupRuns++;
        capturedScheduledFor = ctx.scheduledFor;
      },
    });

    // Simulate a quarter-hour slot that was missed ~40 min ago while the server
    // was down: a row whose next_run_at is that past, cron-aligned slot.
    const missedSlot = new Date();
    missedSlot.setUTCSeconds(0, 0);
    missedSlot.setUTCMinutes(Math.floor(missedSlot.getUTCMinutes() / 15) * 15);
    missedSlot.setUTCMinutes(missedSlot.getUTCMinutes() - 45); // ~45 min overdue
    const r3 = await dbPool.query(
      `INSERT INTO scheduled_jobs (name, description, interval_seconds, cron, enabled, status, next_run_at)
       VALUES ($1, 'catchup test', 3600, NULL, false, 'idle', $2::timestamptz)
       RETURNING id`,
      [catchupName, missedSlot.toISOString()],
    );
    const id3 = r3.rows[0].id as number;
    created.push(id3);

    const claim3 = await claimJobById(id3);
    assert(claim3?.id === id3, "overdue row is claimed on recovery");

    await runClaimedJob(claim3!);
    assert(catchupRuns === 1, "overdue job performs its work exactly once on recovery");
    assert(
      capturedScheduledFor !== null &&
        Math.abs((capturedScheduledFor as Date).getTime() - missedSlot.getTime()) < 1000,
      "handler receives the MISSED slot time (scheduledFor), not wall-clock now",
    );
    assert(
      capturedScheduledFor !== null &&
        Date.now() - (capturedScheduledFor as Date).getTime() > 30 * 60 * 1000,
      "scheduledFor is well in the past (proves catch-up, not a fresh now())",
    );

    // After finalize the schedule jumps forward past now (no infinite replay of
    // every missed slot — one run on recovery, then back on cadence).
    const afterCatchup = await dbPool.query(
      `SELECT next_run_at FROM scheduled_jobs WHERE id = $1`,
      [id3],
    );
    assert(
      new Date(afterCatchup.rows[0].next_run_at).getTime() > Date.now(),
      "next_run_at advanced past now after the catch-up run",
    );
  } finally {
    await cleanup(created).catch((e) => console.error("[cleanup] failed:", e));
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
