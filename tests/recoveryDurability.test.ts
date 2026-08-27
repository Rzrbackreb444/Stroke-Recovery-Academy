/**
 * Regression contracts for the recovery write paths.
 *
 * These checks intentionally inspect the small set of persistence boundaries
 * that are easy to accidentally "simplify" back into best-effort writes.
 * Database-backed integration tests can run against a disposable database;
 * these fast checks still run in the normal no-database test command.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { Pool, Client } from "pg";

const routes = await readFile(new URL("../server/routes.ts", import.meta.url), "utf8");
const storage = await readFile(new URL("../server/storage.ts", import.meta.url), "utf8");
const history = await readFile(new URL("../server/sasquatchHistoryService.ts", import.meta.url), "utf8");
const durability = await readFile(new URL("../server/recoveryDurabilityService.ts", import.meta.url), "utf8");
const chatWidget = await readFile(
  new URL("../client/src/components/recovery/SasquatchChatWidget.tsx", import.meta.url),
  "utf8",
);

test("coach turns await durable history before returning success", () => {
  assert.match(routes, /const \{ persistChatTurn \} = await import\('\.\/sasquatchHistoryService'\);\s+await persistChatTurn\(persistUserId, message, finalResponse\)/);
  assert.match(history, /await db\.execute\(sql`[\s\S]*INSERT INTO sasquatch_chat_messages/);
  assert.doesNotMatch(history, /persistChatTurn[\s\S]{0,900}catch/);
});

test("daily check-in serializes duplicate clicks and commits reward data atomically", () => {
  assert.match(storage, /async createDailyCheckinWithRewards/);
  assert.match(storage, /db\.transaction\(async \(tx\) => \{[\s\S]*pg_advisory_xact_lock/);
  assert.match(storage, /INSERT INTO credit_ledger/);
  assert.match(routes, /createDailyCheckinWithRewards/);
  assert.match(routes, /DailyCheckinAlreadyExistsError/);
});

test("routine feedback and goal replacement cannot commit partial state", () => {
  assert.match(durability, /database\.transaction\(async \(tx/);
  assert.match(durability, /INSERT INTO routine_feedback[\s\S]*routine_completions/);
  assert.match(durability, /tx\.delete\(survivorGoals\)[\s\S]*tx\.insert\(survivorGoals\)/);
  assert.match(routes, /saveRoutineFeedback/);
  assert.match(routes, /replaceSurvivorGoals/);
});

test("habit writes verify the signed-in owner before touching logs", () => {
  assert.match(storage, /eq\(userHabits\.id, userHabitId\), eq\(userHabits\.userId, userId\)/);
  assert.match(routes, /logHabitCompletion\(userHabitId, new Date\(\), notes, getUserId\(req\)!\)/);
});

test("coach UI keeps failed and in-flight turns visibly distinct", () => {
  assert.match(chatWidget, /status\?: "pending" \| "sent" \| "error"/);
  assert.match(chatWidget, /Saving…/);
  assert.match(chatWidget, /Not saved — try again/);
});

const integrationEnabled = process.env.RECOVERY_DURABILITY_DB === "1";
const recoveryUserPrefix = `recovery-durability-${process.pid}-`;

const recoveryTestHabitName = `Recovery durability test habit ${process.pid}`;
type TestDatabase = {
  url: string;
  pool: Pool;
  stop: () => Promise<void>;
};

function postgresConnectionOptions(url: string) {
  const parsed = new URL(url);
  return {
    connectionString: url,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: decodeURIComponent(parsed.pathname.slice(1)),
    user: decodeURIComponent(parsed.username),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}

function runProcess(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function waitForPostgres(url: string, user: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new Client({ connectionString: url, user });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for disposable PostgreSQL");
}

async function createTestDatabase(): Promise<TestDatabase> {
  const configuredUrl = process.env.RECOVERY_TEST_DATABASE_URL;
  if (configuredUrl) {
    if (configuredUrl === process.env.DATABASE_URL) {
      throw new Error("RECOVERY_TEST_DATABASE_URL must not be the development DATABASE_URL");
    }
    const pool = new Pool(postgresConnectionOptions(configuredUrl));
    await pool.query("SELECT 1");
    return { url: configuredUrl, pool, stop: async () => pool.end() };
  }

  const dataDir = await mkdtemp(`${tmpdir()}/recovery-durability-`);
  const user = "recovery_test";
  const database = `recovery_durability_${process.pid}`;
  const port = 55000 + (process.pid % 1000);
  let postgres: ChildProcess | undefined;
  let adminPool: Pool | undefined;
  try {
    await runProcess("initdb", [
      "--no-locale",
      "--encoding=UTF8",
      "--auth=trust",
      `--username=${user}`,
      `--pgdata=${dataDir}`,
    ]);
    postgres = spawn("postgres", [
      "-D", dataDir,
      "-p", String(port),
      "-h", "127.0.0.1",
      "-k", dataDir,
    ], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const adminUrl = `postgresql://${user}@127.0.0.1:${port}/postgres`;
    await waitForPostgres(adminUrl, user);
    adminPool = new Pool(postgresConnectionOptions(adminUrl));
    await adminPool.query(`CREATE DATABASE "${database}"`);
    const url = `postgresql://${user}@127.0.0.1:${port}/${database}`;
    const pool = new Pool(postgresConnectionOptions(url));
    await pool.query("SELECT 1");
    return {
      url,
      pool,
      stop: async () => {
        await pool.end();
        await adminPool?.end();
        postgres?.kill("SIGTERM");
        await once(postgres!, "exit").catch(() => undefined);
        await rm(dataDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await adminPool?.end().catch(() => undefined);
    if (postgres && postgres.exitCode === null) {
      postgres.kill("SIGTERM");
      await once(postgres, "exit").catch(() => undefined);
    }
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
}

async function createRecoverySchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE users (
      id varchar PRIMARY KEY,
      email varchar UNIQUE,
      role text NOT NULL DEFAULT 'member',
      accepts_power_points boolean NOT NULL DEFAULT true,
      last_daily_gift_at timestamp
    );
    CREATE TABLE recovery_habits (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text,
      category text NOT NULL,
      frequency text NOT NULL DEFAULT 'daily',
      target_days integer NOT NULL DEFAULT 66,
      is_default boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE user_habits (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      habit_id integer NOT NULL REFERENCES recovery_habits(id),
      custom_name text,
      start_date timestamp NOT NULL DEFAULT now(),
      target_days integer NOT NULL DEFAULT 66,
      current_streak integer NOT NULL DEFAULT 0,
      longest_streak integer NOT NULL DEFAULT 0,
      total_completions integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'active',
      completed_at timestamp
    );
    CREATE TABLE habit_logs (
      id serial PRIMARY KEY,
      user_habit_id integer NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
      log_date timestamp NOT NULL,
      is_completed boolean NOT NULL DEFAULT false,
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE daily_checkins (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checkin_date timestamp NOT NULL,
      mood_score integer,
      energy_score integer,
      pain_score integer,
      effort_score integer,
      sleep_hours integer,
      exercise_minutes integer,
      wins_today text,
      challenges_today text,
      gratitude text,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE user_streaks (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      current_streak integer NOT NULL DEFAULT 0,
      longest_streak integer NOT NULL DEFAULT 0,
      last_activity_date timestamp,
      total_active_days integer NOT NULL DEFAULT 0,
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE credit_wallets (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance integer NOT NULL DEFAULT 0,
      bonus_credits integer NOT NULL DEFAULT 0,
      lifetime_earned integer NOT NULL DEFAULT 0,
      lifetime_spent integer NOT NULL DEFAULT 0,
      last_refill_at timestamp,
      next_refill_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE credit_ledger (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      transaction_type text NOT NULL,
      amount integer NOT NULL,
      balance_after integer NOT NULL,
      description text,
      feature_key text,
      reference_type text,
      reference_id text,
      metadata jsonb,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE power_point_gifts (
      id serial PRIMARY KEY,
      sender_id varchar REFERENCES users(id) ON DELETE SET NULL,
      receiver_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      package_key text NOT NULL,
      points integer NOT NULL,
      amount_cents integer NOT NULL,
      message text,
      is_anonymous boolean NOT NULL DEFAULT false,
      stripe_payment_id text,
      status text NOT NULL DEFAULT 'pending',
      delivered_at timestamp,
      read_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE routine_completions (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date text NOT NULL,
      level integer NOT NULL DEFAULT 2,
      completed_tasks text[] NOT NULL DEFAULT '{}',
      notes text,
      updated_at timestamp DEFAULT now(),
      UNIQUE (user_id, date)
    );
    CREATE TABLE routine_feedback (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date text NOT NULL,
      task_id text NOT NULL,
      level integer NOT NULL,
      reaction text NOT NULL,
      created_at timestamp DEFAULT now(),
      UNIQUE (user_id, date, task_id)
    );
    CREATE TABLE survivor_goals (
      id serial PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      horizon text NOT NULL,
      domain text NOT NULL,
      goal text NOT NULL,
      status text NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
}

async function installFailureTrigger(
  pool: Pool,
  table: string,
  triggerName: string,
  functionName: string,
): Promise<void> {
  await pool.query(`
    CREATE OR REPLACE FUNCTION ${functionName}() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'recovery durability injected failure';
    END;
    $$;
    CREATE TRIGGER ${triggerName}
    BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${functionName}();
  `);
}

async function removeFailureTrigger(
  pool: Pool,
  table: string,
  triggerName: string,
  functionName: string,
): Promise<void> {
  await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table}`);
  await pool.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
}

async function installConnectionDropTrigger(
  pool: Pool,
  table: string,
  triggerName: string,
  functionName: string,
): Promise<void> {
  await pool.query(`
    CREATE OR REPLACE FUNCTION ${functionName}() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      PERFORM pg_sleep(30);
      RETURN NEW;
    END;
    $$;
    CREATE TRIGGER ${triggerName}
    BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${functionName}();
  `);
}
async function countRows(pool: Pool, table: string, userId: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE user_id = $1`, [userId]);
  return Number(result.rows[0].count);
}

async function countHabitLogs(pool: Pool, userHabitId: number): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM habit_logs WHERE user_habit_id = $1",
    [userHabitId],
  );
  return Number(result.rows[0].count);
}
async function cleanRecoveryData(pool: Pool): Promise<void> {
  for (const [table, trigger, fn] of [
    ["credit_ledger", "fail_reward_trigger", "fail_reward_write"],
    ["routine_completions", "fail_routine_trigger", "fail_routine_write"],
    ["survivor_goals", "fail_goal_trigger", "fail_goal_write"],
  ]) {
    await pool.query(`DROP TRIGGER IF EXISTS ${trigger} ON ${table}`);
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}()`);
  }
  for (const [table, trigger, fn] of [
    ["daily_checkins", "drop_checkin_trigger", "drop_checkin_write"],
    ["routine_completions", "drop_routine_trigger", "drop_routine_write"],
    ["survivor_goals", "drop_goal_trigger", "drop_goal_write"],
    ["habit_logs", "drop_habit_trigger", "drop_habit_write"],
  ]) {
    await removeConnectionDropTrigger(pool, table, trigger, fn);
  }
  await pool.query("DELETE FROM users WHERE id LIKE $1", [`${recoveryUserPrefix}%`]);
  await pool.query("DELETE FROM recovery_habits WHERE name = $1", [recoveryTestHabitName]);
}

if (integrationEnabled) {
  test("recovery durability survives real failures and concurrent requests", { timeout: 120_000 }, async (t) => {
    const testDatabase = await createTestDatabase();
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDriverFlag = process.env.RECOVERY_DURABILITY_DB;

      const [
        { storage: recoveryStorage, pool: appPool },
        { saveRoutineFeedback, replaceSurvivorGoals },
        creditService,
        powerPointsService,
        engagementRoutes,
      ] =
        await Promise.all([
          import("../server/storage"),
          import("../server/recoveryDurabilityService"),
          import("../server/creditService"),
          import("../server/powerPointsService"),
          import("../server/routes/engagementRoutes"),
        ]);

    const controlPool = new Pool(postgresConnectionOptions(testDatabase.url));
      const userId = `${recoveryUserPrefix}owner`;
      const otherUserId = `${recoveryUserPrefix}other`;

      const creditUserId = `${recoveryUserPrefix}credit-user`;
      const habitResult = await testDatabase.pool.query(
        "INSERT INTO recovery_habits (name, category) VALUES ($1, 'recovery') RETURNING id",
        [recoveryTestHabitName],
      );
      const habitId = Number(habitResult.rows[0].id);
      const ownHabitResult = await testDatabase.pool.query(
        "INSERT INTO user_habits (user_id, habit_id) VALUES ($1, $2) RETURNING id",
        [userId, habitId],
      );
      const otherHabitResult = await testDatabase.pool.query(
        "INSERT INTO user_habits (user_id, habit_id) VALUES ($1, $2) RETURNING id",
        [otherUserId, habitId],
      );
      const ownHabitId = Number(ownHabitResult.rows[0].id);
      const otherHabitId = Number(otherHabitResult.rows[0].id);
        const input = { userId, date: "2026-08-29", taskId: "reach", level: 2, reaction: "good" };
        const results = await Promise.allSettled([
          recoveryStorage.createDailyCheckinWithRewards(input),
          recoveryStorage.createDailyCheckinWithRewards(input),
        ]);

        const storedGift = await testDatabase.pool.query(
          "SELECT status, stripe_payment_id FROM power_point_gifts WHERE id = $1",
          [giftId],
        );

        const dailyGiftCount = async () => {
          const result = await testDatabase.pool.query(
            "SELECT COUNT(*)::int AS count FROM power_point_gifts WHERE sender_id = $1",
            [dailySenderId],
          );
          return Number(result.rows[0].count);
        };
        assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
        assert.equal(results.filter((result) => result.status === "rejected").length, 1);
        assert.equal(await countRows(testDatabase.pool, "daily_checkins", userId), 1);
        assert.equal(await countRows(testDatabase.pool, "user_streaks", userId), 1);
        assert.equal(await countRows(testDatabase.pool, "credit_wallets", userId), 1);
        assert.equal(await countRows(testDatabase.pool, "credit_ledger", userId), 1);
        const wallet = await testDatabase.pool.query(
          "SELECT bonus_credits, lifetime_earned FROM credit_wallets WHERE user_id = $1",
          [userId],
        );

        const ledger = await testDatabase.pool.query(
          "SELECT amount, balance_after FROM credit_ledger WHERE user_id = $1 ORDER BY id",
          [creditUserId],
        );
        assert.deepEqual(wallet.rows[0], { bonus_credits: 10, lifetime_earned: 510 });
      });

      await t.test("a reward failure rolls back the check-in and retry can succeed", async () => {
        const trigger = ["survivor_goals", "fail_goal_trigger", "fail_goal_write"];

        const failedDelivery = await callDailyGift(dailySenderId, dailyReceiverId);
        await installFailureTrigger(testDatabase.pool, ...trigger);
        const failedDate = new Date("2026-08-28T12:00:00.000Z");
        await assert.rejects(
          recoveryStorage.createDailyCheckinWithRewards({ userId, checkinDate: failedDate, effortScore: 10 }),
        );
        assert.equal(await countRows(testDatabase.pool, "daily_checkins", userId), 1);
        assert.equal(await countRows(testDatabase.pool, "user_streaks", userId), 1);
        assert.equal(await countRows(testDatabase.pool, "credit_ledger", userId), 1);
        await removeFailureTrigger(testDatabase.pool, ...trigger);

        await recoveryStorage.createDailyCheckinWithRewards({ userId, checkinDate: failedDate, effortScore: 10 });
        assert.equal(await countRows(testDatabase.pool, "daily_checkins", userId), 2);
        assert.equal(await countRows(testDatabase.pool, "credit_ledger", userId), 2);
      });

      await t.test("routine feedback and completion commit together and deduplicate", async () => {
        const input = { userId, date: "2026-08-29", taskId: "reach", level: 2, reaction: "good" };
        await Promise.all([saveRoutineFeedback(input), saveRoutineFeedback(input)]);
        assert.equal(await countRows(testDatabase.pool, "routine_feedback", userId), 1);
        const completion = await testDatabase.pool.query(
          "SELECT completed_tasks FROM routine_completions WHERE user_id = $1 AND date = $2",
          [userId, firstTask.date],
        );
        assert.deepEqual(completion.rows[0].completed_tasks, ["reach"]);
      });

      await t.test("concurrent different tasks merge feedback and completion IDs", async () => {
        const firstTask = { userId, date: "2026-09-02", taskId: "reach", level: 2, reaction: "good" };
        const secondTask = { userId, date: "2026-09-02", taskId: "stand", level: 2, reaction: "hard" };

        await Promise.all([
          saveRoutineFeedback(firstTask),
          saveRoutineFeedback(secondTask),
        ]);

        assert.equal(await countRows(testDatabase.pool, "routine_feedback", userId), 3);
        const completion = await testDatabase.pool.query(
          "SELECT completed_tasks FROM routine_completions WHERE user_id = $1 AND date = $2",
          [userId, firstTask.date],
        );
        assert.deepEqual([...completion.rows[0].completed_tasks].sort(), ["reach", "stand"]);

        await saveRoutineFeedback(firstTask);
        assert.equal(await countRows(testDatabase.pool, "routine_feedback", userId), 3);
        const retriedCompletion = await testDatabase.pool.query(
          "SELECT completed_tasks FROM routine_completions WHERE user_id = $1 AND date = $2",
          [userId, firstTask.date],
        );
        assert.deepEqual([...retriedCompletion.rows[0].completed_tasks].sort(), ["reach", "stand"]);
      });

      await t.test("a routine completion failure rolls feedback back", async () => {
        const trigger = ["survivor_goals", "fail_goal_trigger", "fail_goal_write"];

        const failedDelivery = await callDailyGift(dailySenderId, dailyReceiverId);
        await installFailureTrigger(testDatabase.pool, ...trigger);
        const date = new Date("2026-09-01T12:00:00.000Z");
        await assert.rejects(saveRoutineFeedback({
          userId,
          date,
          taskId: "stand",
          level: 3,
          reaction: "hard",
        }));
        const failedFeedback = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM routine_feedback WHERE user_id = $1 AND date = $2",
          [userId, date],
        );
        const failedCompletion = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM routine_completions WHERE user_id = $1 AND date = $2",
          [userId, date],
        );
        assert.equal(Number(failedFeedback.rows[0].count), 0);
        assert.equal(Number(failedCompletion.rows[0].count), 0);
        await removeFailureTrigger(testDatabase.pool, ...trigger);
      });

      await t.test("goal replacement rolls back to the prior set on insert failure", async () => {
        await replaceSurvivorGoals(userId, [{ horizon: "short", domain: "physical", goal: "Walk farther" }]);
        const trigger = ["survivor_goals", "fail_goal_trigger", "fail_goal_write"];

        const failedDelivery = await callDailyGift(dailySenderId, dailyReceiverId);
        await installFailureTrigger(testDatabase.pool, ...trigger);
        await assert.rejects(replaceSurvivorGoals(userId, [
          { horizon: "long", domain: "speech", goal: "Speak with confidence" },
        ]));
        const unchanged = await testDatabase.pool.query(
          "SELECT horizon, domain, goal FROM survivor_goals WHERE user_id = $1",
          [userId],
        );
        assert.deepEqual(unchanged.rows, [{ horizon: "short", domain: "physical", goal: "Walk farther" }]);
        await removeFailureTrigger(testDatabase.pool, ...trigger);
        await replaceSurvivorGoals(userId, [{ horizon: "long", domain: "speech", goal: "Speak with confidence" }]);
        assert.equal(await countRows(testDatabase.pool, "survivor_goals", userId), 1);
      });

      await t.test("habit IDs are owner-scoped and duplicate logs stay consistent", async () => {
        await assert.rejects(
          recoveryStorage.logHabitCompletion(otherHabitId, new Date("2026-08-31T12:00:00.000Z"), undefined, userId),
          /Habit not found/,
        );
        const unauthorizedLogs = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM habit_logs WHERE user_habit_id = $1",
          [otherHabitId],
        );
        assert.equal(Number(unauthorizedLogs.rows[0].count), 0);

        const date = new Date("2026-09-01T12:00:00.000Z");
        await Promise.all([
          recoveryStorage.logHabitCompletion(ownHabitId, date, "first", userId),
          recoveryStorage.logHabitCompletion(ownHabitId, date, "duplicate", userId),
        ]);
        const ownLogs = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM habit_logs WHERE user_habit_id = $1",
          [ownHabitId],
        );
        assert.equal(Number(ownLogs.rows[0].count), 1);
        const habit = await testDatabase.pool.query(
          "SELECT total_completions FROM user_habits WHERE id = $1",
          [ownHabitId],
        );

        const dropUserId = `${recoveryUserPrefix}connection-drop`;
      const importedDb = await import("../server/db").catch(() => undefined);
      await importedDb?.pool?.end?.().catch(() => undefined);
      await controlPool.end().catch(() => undefined);
      await cleanRecoveryData(testDatabase.pool).catch(() => undefined);
      await testDatabase.stop();
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
      if (originalDriverFlag === undefined) delete process.env.RECOVERY_DURABILITY_DB;
      else process.env.RECOVERY_DURABILITY_DB = originalDriverFlag;
    }
  });
} else {
  test("recovery durability integration suite", { skip: "set RECOVERY_DURABILITY_DB=1 to run against disposable PostgreSQL" }, () => {});
}

        const droppedCheckinPid = await terminateRecoveryWrite(
          controlPool,
          checkinTrigger[0],
          failedCheckin,
        );

        const failedGoals = replaceSurvivorGoals(dropUserId, [
          { horizon: "long", domain: "speech", goal: "Speak with confidence" },
        ]);

        const retriedHabit = await testDatabase.pool.query(
          "SELECT total_completions FROM user_habits WHERE id = $1",
          [dropHabitId],
        );

async function terminateRecoveryWrite(
  controlPool: Pool,
  table: string,
  operation: Promise<unknown>,
): Promise<number> {
  const settled = Promise.allSettled([operation]);
  let pid: number | undefined;
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      const active = await controlPool.query(
        `SELECT pid
           FROM pg_stat_activity
          WHERE application_name = 'recovery-durability'
            AND datname = current_database()
            AND pid <> pg_backend_pid()
            AND state = 'active'
            AND query ILIKE $1
          ORDER BY query_start
          LIMIT 1`,
        [`%${table}%`],
      );
      if (active.rows[0]) {
        pid = Number(active.rows[0].pid);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!pid) {
      throw new Error(`Timed out waiting for recovery write on ${table}`);
    }

    const terminated = await controlPool.query(
      "SELECT pg_terminate_backend($1) AS terminated",
      [pid],
    );
    assert.equal(terminated.rows[0].terminated, true);
    const [outcome] = await settled;
    assert.equal(outcome.status, "rejected");
    return pid;
  } finally {
    await settled;
  }
}

        const failedCheckin = recoveryStorage.createDailyCheckinWithRewards(checkinInput);

      const [{ storage: recoveryStorage }, { pool: appPool }, { saveRoutineFeedback, replaceSurvivorGoals }] =
        await Promise.all([
          import("../server/storage"),
          import("../server/db"),
          import("../server/recoveryDurabilityService"),
        ]);

        const habitRetryConnection = await appPool.query("SELECT pg_backend_pid() AS pid");

        const dropHabitResult = await testDatabase.pool.query(
          "INSERT INTO user_habits (user_id, habit_id) VALUES ($1, $2) RETURNING id",
          [dropUserId, habitId],
        );

        const failedHabit = recoveryStorage.logHabitCompletion(
          dropHabitId,
          habitDate,
          "first attempt",
          dropUserId,
        );

        const routineInput = {
          userId: dropUserId,
          date: "2026-09-03",
          taskId: "reach",
          level: 2,
          reaction: "good",
        };

        const routineRetryConnection = await appPool.query("SELECT pg_backend_pid() AS pid");

        const rolledBackHabit = await testDatabase.pool.query(
          "SELECT total_completions FROM user_habits WHERE id = $1",
          [dropHabitId],
        );

async function removeConnectionDropTrigger(
  pool: Pool,
  table: string,
  triggerName: string,
  functionName: string,
): Promise<void> {
  await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table}`);
  await pool.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
}

        const checkinRetryConnection = await appPool.query("SELECT pg_backend_pid() AS pid");

        const droppedHabitPid = await terminateRecoveryWrite(
          controlPool,
          habitTrigger[0],
          failedHabit,
        );

        const checkinInput = {
          userId: dropUserId,
          checkinDate: new Date("2026-09-02T12:00:00.000Z"),
          moodScore: 8,
          energyScore: 7,
          effortScore: 9,
        };

        const failedRoutine = saveRoutineFeedback(routineInput);

        const goalRetryConnection = await appPool.query("SELECT pg_backend_pid() AS pid");

        const droppedRoutinePid = await terminateRecoveryWrite(
          controlPool,
          routineTrigger[0],
          failedRoutine,
        );

        const checkinTrigger = ["credit_ledger", "drop_checkin_trigger", "drop_checkin_write"];

        const routineTrigger = ["routine_completions", "drop_routine_trigger", "drop_routine_write"];

        const habitTrigger = ["habit_logs", "drop_habit_trigger", "drop_habit_write"];

        const goalTrigger = ["survivor_goals", "drop_goal_trigger", "drop_goal_write"];

        const droppedGoalPid = await terminateRecoveryWrite(
          controlPool,
          goalTrigger[0],
          failedGoals,
        );

        const unchangedGoals = await testDatabase.pool.query(
          "SELECT horizon, domain, goal FROM survivor_goals WHERE user_id = $1",
          [dropUserId],
        );

        const habitDate = new Date("2026-09-04T12:00:00.000Z");

        const dropHabitId = Number(dropHabitResult.rows[0].id);

        const dailyWallet = await testDatabase.pool.query(
          "SELECT balance, bonus_credits, lifetime_earned FROM credit_wallets WHERE user_id = $1",
          [dailyReceiverId],
        );

        const restored = await testDatabase.pool.query(
          "SELECT last_daily_gift_at FROM users WHERE id = $1",
          [dailySenderId],
        );

      const giftSenderId = `${recoveryUserPrefix}gift-sender`;

      const callDailyGift = async (sender: string, receiver: string) => {
        let statusCode = 200;
        let body: any;
        const res: any = {
          status(code: number) { statusCode = code; return res; },
          json(value: any) { body = value; return res; },
        };
        await routeHandlers["POST /api/engagement/daily-gift"](
          { user: { id: sender }, body: { receiverId: receiver, message: "You’ve got this" } },
          res,
        );
        return { statusCode, body };
      };

        let expectedBalance = 500;

      const dailyReceiverId = `${recoveryUserPrefix}daily-receiver`;

      const testApp = {
        get(path: string, ...handlers: any[]) { routeHandlers[`GET ${path}`] = handlers.at(-1); },
        post(path: string, ...handlers: any[]) { routeHandlers[`POST ${path}`] = handlers.at(-1); },
      };

        const receiverLedger = await testDatabase.pool.query(
          "SELECT amount, reference_type, reference_id FROM credit_ledger " +
          "WHERE user_id = $1 ORDER BY id",
          [giftReceiverId],
        );

      const routeHandlers: Record<string, any> = {};

      const giftReceiverId = `${recoveryUserPrefix}gift-receiver`;

        const retry = await callDailyGift(dailySenderId, dailyReceiverId);

        const session = {
          payment_intent: "pi_durability_test",
          metadata: { giftId: String(giftId), type: "power_points" },
        };

        const gift = await testDatabase.pool.query(
          "INSERT INTO power_point_gifts " +
          "(sender_id, receiver_id, package_key, points, amount_cents) " +
          "VALUES ($1, $2, 'cheer', 25, 100) RETURNING id",
          [giftSenderId, giftReceiverId],
        );

        const giftId = Number(gift.rows[0].id);

      const dailySenderId = `${recoveryUserPrefix}daily-sender`;
