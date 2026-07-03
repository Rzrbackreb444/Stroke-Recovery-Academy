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

export interface JobDefinition {
  name: string;
  description?: string;
  intervalSeconds?: number | null;
  cron?: string | null;
  handler: () => Promise<void>;
}

const registry = new Map<string, JobDefinition>();
const INSTANCE_ID = `${os.hostname()}:${process.pid}:${crypto.randomBytes(3).toString("hex")}`;
const TICK_INTERVAL_MS = 30 * 1000;

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
  // Insert the definition on first boot with next_run_at=now() so it fires
  // promptly once. On subsequent boots we only sync the *definition* columns —
  // never next_run_at / enabled / counters — so the live schedule is preserved.
  await db.execute(sql`
    INSERT INTO scheduled_jobs (name, description, interval_seconds, cron, next_run_at)
    VALUES (${def.name}, ${def.description ?? null}, ${def.intervalSeconds ?? null}, ${def.cron ?? null}, now())
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      interval_seconds = EXCLUDED.interval_seconds,
      cron = EXCLUDED.cron,
      updated_at = now()
  `);
}

async function claimDueJobs(): Promise<Array<{ id: number; name: string }>> {
  // Atomic claim. FOR UPDATE SKIP LOCKED + the status/lock predicate guarantees
  // that two instances ticking simultaneously never grab the same row. A row
  // stuck "running" for >15 min (crashed worker) is reclaimable.
  const res = await db.execute(sql`
    UPDATE scheduled_jobs
    SET status = 'running', locked_at = now(), locked_by = ${INSTANCE_ID}, updated_at = now()
    WHERE id IN (
      SELECT id FROM scheduled_jobs
      WHERE enabled = true
        AND next_run_at <= now()
        AND (status <> 'running' OR locked_at IS NULL OR locked_at < now() - interval '15 minutes')
      ORDER BY next_run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 20
    )
    RETURNING id, name
  `);
  return (res.rows || []) as Array<{ id: number; name: string }>;
}

async function runClaimedJob(row: { id: number; name: string }): Promise<void> {
  const def = registry.get(row.name);
  const startedAt = new Date();

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

  let failed = false;
  let errorMsg: string | null = null;
  try {
    await def.handler();
  } catch (err: any) {
    failed = true;
    errorMsg = String(err?.message ?? err).slice(0, 2000);
    console.error(`[scheduler] job "${row.name}" failed:`, err);
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

  await db.execute(sql`
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
    WHERE id = ${row.id}
  `);

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
  // same 15-min stale-lock guard lets a wedged job be re-triggered manually.
  const res = await db.execute(sql`
    UPDATE scheduled_jobs
    SET status = 'running', locked_at = now(), locked_by = ${INSTANCE_ID}, updated_at = now()
    WHERE id = ${id}
      AND (status <> 'running' OR locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    RETURNING id, name
  `);
  const row = (res.rows || [])[0] as { id: number; name: string } | undefined;
  if (!row) return null; // not found, or already running
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
