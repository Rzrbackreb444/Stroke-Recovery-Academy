// Durable, restart-safe, single-fire-across-instances job scheduler.
//
// Why this exists: recurring DB-backed work (journal nudges, newsletter drip,
// accountability pings, stale-analysis reaper) previously ran on per-process
// `setInterval`. That double-fires the moment there is more than one process
// (deploy overlap, scaled instances) and loses all observability. This engine
// stores job state in Postgres and claims due jobs with an atomic UPDATE so
// exactly one instance runs a given job at a given time, and every run is
// recorded for the admin panel.
//
// NOTE: In-memory prunes (rate-limiter map in routes.ts, in-process job-queue
// cleanup) intentionally stay on setInterval — they must run in EVERY process,
// so single-firing them here would be a bug.

import os from "os";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { computeNextRun, cronNextRun } from "./cron";

// Context handed to every job handler. `scheduledFor` is the time the run was
// SUPPOSED to fire (the row's next_run_at at claim time), NOT wall-clock now.
// Handlers that do slot/time-of-day work MUST key off this so a run that was
// missed while the server was down still performs the missed slot's work when
// it is finally claimed on recovery — instead of looking at the (late) clock
// and deciding it's the wrong slot.
export interface JobRunContext {
  scheduledFor: Date;
}

export interface JobDefinition {
  name: string;
  description?: string;
  intervalSeconds?: number | null;
  cron?: string | null;
  handler: (ctx: JobRunContext) => Promise<void>;
}

type ClaimedRow = { id: number; name: string; next_run_at?: string | Date | null };

const registry = new Map<string, JobDefinition>();
const INSTANCE_ID = `${os.hostname()}:${process.pid}:${crypto.randomBytes(3).toString("hex")}`;
const TICK_INTERVAL_MS = 30 * 1000;

// While a claimed job runs, its owner refreshes locked_at every
// HEARTBEAT_INTERVAL_MS. STALE_LOCK_SECONDS is therefore NOT a maximum job
// runtime — a live worker keeps its lease fresh no matter how long the handler
// takes, so a legitimately long-running job is never re-claimed and never runs
// twice. The lease only looks stale once the owner has actually stopped
// heartbeating (crashed / hung process), at which point another instance may
// safely reclaim the row. 5 min ≈ 5 missed heartbeats ⇒ the owner is dead.
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const STALE_LOCK_SECONDS = 300;

// Shared "this row is free to claim" predicate: never running, or running but
// its owner's lease has gone stale (crashed mid-run with no heartbeat). Used by
// both the periodic claimer and the by-id claimer so the two can never diverge.
function claimablePredicate() {
  return sql`(status <> 'running' OR locked_at IS NULL OR locked_at < now() - (interval '1 second' * ${STALE_LOCK_SECONDS}))`;
}

let tickTimer: NodeJS.Timeout | null = null;
let claiming = false;
let started = false;

export function registerJob(def: JobDefinition): void {
  if (!def.cron && !(def.intervalSeconds && def.intervalSeconds > 0)) {
    throw new Error(`Job "${def.name}" needs a cron or intervalSeconds`);
  }
  // Validate the cron up-front so a bad expression fails loudly at boot,
  // not silently at the first scheduled fire.
  if (def.cron) cronNextRun(def.cron, new Date());
  registry.set(def.name, def);
}

async function ensureJobRow(def: JobDefinition): Promise<void> {
  // First-boot next_run_at:
  //   - cron jobs align to their NEXT scheduled slot (cronNextRun) so the first
  //     run lands on a real cron boundary — a job that fires at :00/:15/:30/:45
  //     never fires once at an arbitrary first-boot minute and does per-slot
  //     work off-schedule.
  //   - interval jobs fire promptly (now()) since they have no wall-clock slot.
  // On subsequent boots we only sync the *definition* columns — never
  // next_run_at / enabled / counters — so the live schedule is preserved.
  const firstRun = def.cron ? cronNextRun(def.cron, new Date()) : new Date();
  await db.execute(sql`
    INSERT INTO scheduled_jobs (name, description, interval_seconds, cron, next_run_at)
    VALUES (${def.name}, ${def.description ?? null}, ${def.intervalSeconds ?? null}, ${def.cron ?? null}, ${firstRun.toISOString()}::timestamptz)
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      interval_seconds = EXCLUDED.interval_seconds,
      cron = EXCLUDED.cron,
      updated_at = now()
  `);
}

export async function claimDueJobs(): Promise<ClaimedRow[]> {
  // Atomic claim. FOR UPDATE SKIP LOCKED + claimablePredicate() guarantees that
  // two instances ticking simultaneously never grab the same row, and that a row
  // whose owner has stopped heartbeating (crashed worker) becomes reclaimable.
  // We RETURN next_run_at (the pre-advance intended fire time) so the handler
  // can do slot work against the scheduled time, not the late wall clock.
  const res = await db.execute(sql`
    UPDATE scheduled_jobs
    SET status = 'running', locked_at = now(), locked_by = ${INSTANCE_ID}, updated_at = now()
    WHERE id IN (
      SELECT id FROM scheduled_jobs
      WHERE enabled = true
        AND next_run_at <= now()
        AND ${claimablePredicate()}
      ORDER BY next_run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 20
    )
    RETURNING id, name, next_run_at
  `);
  return (res.rows || []) as ClaimedRow[];
}

// Atomically claim a specific row by id, ignoring enabled + schedule. Used by
// the manual "run now" trigger and by tests. Returns the row if we won the
// claim, else null (not found, or already running with a live lease).
export async function claimJobById(id: number): Promise<ClaimedRow | null> {
  const res = await db.execute(sql`
    UPDATE scheduled_jobs
    SET status = 'running', locked_at = now(), locked_by = ${INSTANCE_ID}, updated_at = now()
    WHERE id = ${id} AND ${claimablePredicate()}
    RETURNING id, name, next_run_at
  `);
  return ((res.rows || [])[0] as ClaimedRow | undefined) ?? null;
}

// Renew our lease on a running job we own. Guarded by locked_by so we can never
// refresh a lease another instance has taken over, and by status so we stop once
// the job is finalized. Returns rows touched (0 ⇒ we no longer own it).
export async function heartbeatJob(id: number): Promise<number> {
  const res = await db.execute(sql`
    UPDATE scheduled_jobs
    SET locked_at = now(), updated_at = now()
    WHERE id = ${id} AND locked_by = ${INSTANCE_ID} AND status = 'running'
    RETURNING id
  `);
  return (res.rows || []).length;
}

export async function runClaimedJob(row: ClaimedRow): Promise<void> {
  const def = registry.get(row.name);
  const startedAt = new Date();
  // The time this run was SUPPOSED to fire. For an on-time run this ≈ now; for a
  // run claimed late (server was down over its slot) this is the missed slot's
  // time, so slot-aware handlers do the missed work rather than reading the late
  // clock and skipping. Falls back to now for rows with no next_run_at.
  const scheduledFor = row.next_run_at ? new Date(row.next_run_at) : startedAt;

  if (!def) {
    // Orphaned row (handler removed from code). Disable it so we stop claiming
    // it every tick instead of busy-looping.
    await db.execute(sql`
      UPDATE scheduled_jobs
      SET enabled = false, status = 'failed', last_status = 'failed',
          last_error = 'No handler registered', last_run_at = now(),
          locked_at = NULL, locked_by = NULL, updated_at = now()
      WHERE id = ${row.id}
    `);
    console.warn(`[scheduler] no handler for job "${row.name}" — disabled`);
    return;
  }

  // Keep our lease alive for the whole run so a long-running handler is never
  // mistaken for a crashed worker and re-claimed by another instance. unref() so
  // this timer can never keep the process alive on its own.
  const heartbeat = setInterval(() => {
    void heartbeatJob(row.id).catch((err) =>
      console.error(`[scheduler] heartbeat error for "${row.name}":`, err),
    );
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref?.();

  let failed = false;
  let errorMsg: string | null = null;
  try {
    await def.handler({ scheduledFor });
  } catch (err: any) {
    failed = true;
    errorMsg = String(err?.message ?? err).slice(0, 2000);
    console.error(`[scheduler] job "${row.name}" failed:`, err);
  } finally {
    clearInterval(heartbeat);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const status = failed ? "failed" : "success";

  let nextRunAt: Date;
  try {
    nextRunAt = computeNextRun({ intervalSeconds: def.intervalSeconds, cron: def.cron }, finishedAt);
  } catch {
    // Should never happen (validated at register), but never leave a job wedged.
    nextRunAt = new Date(finishedAt.getTime() + 60 * 60 * 1000);
  }

  // Finalize ONLY if we still own the lease (locked_by = us). If our heartbeat
  // lapsed long enough for another instance to consider us dead and re-claim the
  // row, this UPDATE matches 0 rows and we discard our result rather than
  // clobbering the new owner's next_run_at / counters or double-recording a run.
  const finalize = await db.execute(sql`
    UPDATE scheduled_jobs SET
      status = ${status},
      last_status = ${status},
      last_run_at = ${finishedAt.toISOString()}::timestamptz,
      last_error = ${errorMsg},
      last_duration_ms = ${durationMs},
      run_count = run_count + 1,
      failure_count = failure_count + ${failed ? 1 : 0},
      next_run_at = ${nextRunAt.toISOString()}::timestamptz,
      locked_at = NULL,
      locked_by = NULL,
      updated_at = now()
    WHERE id = ${row.id} AND locked_by = ${INSTANCE_ID}
    RETURNING id
  `);

  if ((finalize.rows || []).length === 0) {
    console.warn(
      `[scheduler] job "${row.name}" lost its lease during execution — result discarded to avoid a duplicate run.`,
    );
    return;
  }

  await db.execute(sql`
    INSERT INTO scheduled_job_runs (job_id, job_name, status, started_at, finished_at, duration_ms, error)
    VALUES (
      ${row.id}, ${row.name}, ${status},
      ${startedAt.toISOString()}::timestamptz, ${finishedAt.toISOString()}::timestamptz,
      ${durationMs}, ${errorMsg}
    )
  `);
}

async function tick(): Promise<void> {
  if (claiming) return; // serialize only the claim, never the handler runs
  claiming = true;
  let due: Array<{ id: number; name: string }> = [];
  try {
    due = await claimDueJobs();
  } catch (err) {
    console.error("[scheduler] claim error:", err);
    return;
  } finally {
    claiming = false;
  }
  // Run handlers WITHOUT holding the claim lock. A slow job (batched emails)
  // must never delay claiming a time-sensitive one (accountability's
  // quarter-hour pings) on the next tick. Claimed rows are already marked
  // 'running' + locked, so a later tick won't re-claim them; runClaimedJob
  // records its own outcome and cannot throw past this .catch.
  for (const row of due) {
    runClaimedJob(row).catch((err) =>
      console.error(`[scheduler] run error for "${row.name}":`, err),
    );
  }
}

// Self-provision the scheduler's own tables at boot, mirroring the codebase's
// initPushSchema / sasquatchHistory / campfire pattern. This makes the backbone
// resilient: it never depends on `drizzle-kit push` (which stalls on an
// interactive rename prompt in non-TTY shells) having been run, and a fresh or
// reset dev database self-heals on the next restart instead of throwing 42P01
// on every tick. The columns mirror shared/schema.ts (scheduledJobs /
// scheduledJobRuns); IF NOT EXISTS means an already-migrated table is untouched.
export async function ensureSchedulerSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      interval_seconds INTEGER,
      cron TEXT,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      status TEXT NOT NULL DEFAULT 'idle',
      next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_run_at TIMESTAMPTZ,
      last_status TEXT,
      last_error TEXT,
      last_duration_ms INTEGER,
      run_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      locked_at TIMESTAMPTZ,
      locked_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scheduled_job_runs (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      finished_at TIMESTAMPTZ NOT NULL,
      duration_ms INTEGER NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS sjr_job_idx ON scheduled_job_runs (job_id, created_at)
  `);
}

export async function startScheduler(): Promise<void> {
  if (started) return;
  started = true;

  await ensureSchedulerSchema();

  for (const def of registry.values()) {
    try {
      await ensureJobRow(def);
    } catch (err) {
      console.error(`[scheduler] failed to ensure job "${def.name}":`, err);
    }
  }

  tickTimer = setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);
  // Kick a first tick shortly after boot (let the DB warm up).
  setTimeout(() => {
    void tick();
  }, 3000);

  console.log(
    `[scheduler] started — ${registry.size} job(s), instance ${INSTANCE_ID}, tick ${TICK_INTERVAL_MS}ms`,
  );
}

export function stopScheduler(): void {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
  started = false;
}

// ─── Admin observability helpers ─────────────────────────────────────────────

export async function listJobsWithStatus() {
  const res = await db.execute(sql`SELECT * FROM scheduled_jobs ORDER BY name ASC`);
  const rows = (res.rows || []) as any[];
  return rows.map((r) => ({ ...r, hasHandler: registry.has(r.name) }));
}

// Scheduler liveness snapshot. A silent scheduler failure (deploy that breaks
// bootstrapScheduler, a crashed tick loop) shows up here as an enabled job whose
// next_run_at has fallen far behind now() — a healthy tick keeps advancing it
// into the future every cycle. `overdueGraceSeconds` is the slack past a job's
// intended fire time before we call it stale (default 10 min ≫ the 30s tick, so
// on-time jobs never flap). Returns a compact per-job view plus the names of any
// overdue jobs, so both /api/health (summary) and the admin panel (detail) read
// from one source of truth.
export interface SchedulerJobHealth {
  name: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  nextRunAt: string | null;
  runCount: number;
  failureCount: number;
  overdue: boolean;
}

export interface SchedulerHealth {
  ok: boolean;
  jobCount: number;
  stale: string[];
  jobs: SchedulerJobHealth[];
}

export async function getSchedulerHealth(overdueGraceSeconds = 600): Promise<SchedulerHealth> {
  const res = await db.execute(sql`
    SELECT name, enabled, last_run_at, last_status, next_run_at, run_count, failure_count,
           (enabled = true
             AND next_run_at < now() - (interval '1 second' * ${overdueGraceSeconds})) AS overdue
    FROM scheduled_jobs
    ORDER BY name ASC
  `);
  const rows = (res.rows || []) as any[];
  const jobs: SchedulerJobHealth[] = rows.map((r) => ({
    name: r.name,
    enabled: r.enabled === true || r.enabled === "t",
    lastRunAt: r.last_run_at ? new Date(r.last_run_at).toISOString() : null,
    lastStatus: r.last_status ?? null,
    nextRunAt: r.next_run_at ? new Date(r.next_run_at).toISOString() : null,
    runCount: Number(r.run_count ?? 0),
    failureCount: Number(r.failure_count ?? 0),
    overdue: r.overdue === true || r.overdue === "t",
  }));
  const stale = jobs.filter((j) => j.overdue).map((j) => j.name);
  return { ok: stale.length === 0, jobCount: jobs.length, stale, jobs };
}

export async function listRecentRuns(jobId?: number, limit = 50) {
  const lim = Math.min(Math.max(limit, 1), 200);
  if (jobId && Number.isFinite(jobId)) {
    const res = await db.execute(sql`
      SELECT * FROM scheduled_job_runs WHERE job_id = ${jobId}
      ORDER BY started_at DESC LIMIT ${lim}
    `);
    return res.rows || [];
  }
  const res = await db.execute(sql`
    SELECT * FROM scheduled_job_runs ORDER BY started_at DESC LIMIT ${lim}
  `);
  return res.rows || [];
}

export async function triggerJobNow(id: number) {
  // Manual "run now": atomically claim THIS row (even if disabled, regardless
  // of its schedule) as long as it isn't already running, then run it
  // out-of-band immediately. Does NOT flip `enabled`, so triggering a disabled
  // job runs it once without silently resuming its recurring schedule. The
  // shared stale-lock guard lets a wedged job be re-triggered manually.
  const row = await claimJobById(id);
  if (!row) return null; // not found, or already running with a live lease
  runClaimedJob(row).catch((err) =>
    console.error(`[scheduler] manual run error for "${row.name}":`, err),
  );
  return row;
}

export async function setJobEnabled(id: number, enabled: boolean) {
  const res = await db.execute(sql`
    UPDATE scheduled_jobs SET enabled = ${enabled}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, enabled
  `);
  return (res.rows || [])[0] || null;
}
