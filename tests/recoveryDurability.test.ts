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
const authorBrain = await readFile(new URL("../server/authorBrainService.ts", import.meta.url), "utf8");
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

test("author brain memory operations verify the owning user", () => {
  assert.match(authorBrain, /WHERE id = \$\{projectId\} AND user_id = \$\{userId\}/);
  assert.match(authorBrain, /WHERE project_id = \$\{projectId\}/);
  assert.match(routes, /AUTHOR_BRAIN_MAX_RESULT_LIMIT/);
});

test("coach UI keeps failed and in-flight turns visibly distinct", () => {
  assert.match(chatWidget, /status\?: "pending" \| "sent" \| "error"/);
  assert.match(chatWidget, /Saving…/);
  assert.match(chatWidget, /Not saved — try again/);
});

const integrationEnabled = process.env.RECOVERY_DURABILITY_DB === "1";
const recoveryUserPrefix = `recovery-durability-${process.pid}-`;

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
      role text NOT NULL DEFAULT 'member'
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

async function countRows(pool: Pool, table: string, userId: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE user_id = $1`, [userId]);
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
  await pool.query("DELETE FROM users WHERE id LIKE $1", [`${recoveryUserPrefix}%`]);
  await pool.query("DELETE FROM recovery_habits WHERE name = 'Test habit'");
}

if (integrationEnabled) {
  test("recovery durability survives real failures and concurrent requests", { timeout: 120_000 }, async (t) => {
    const testDatabase = await createTestDatabase();
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDriverFlag = process.env.RECOVERY_DURABILITY_DB;
    process.env.DATABASE_URL = testDatabase.url;
    process.env.RECOVERY_DURABILITY_DB = "1";

    try {
      await createRecoverySchema(testDatabase.pool);
      const [{ storage: recoveryStorage }, { pool: appPool }, { saveRoutineFeedback, replaceSurvivorGoals }] =
        await Promise.all([
          import("../server/storage"),
          import("../server/db"),
          import("../server/recoveryDurabilityService"),
        ]);

      const userId = `${recoveryUserPrefix}owner`;
      const otherUserId = `${recoveryUserPrefix}other`;
      await testDatabase.pool.query(
        "INSERT INTO users (id, email) VALUES ($1, $2), ($3, $4)",
        [userId, `${userId}@example.test`, otherUserId, `${otherUserId}@example.test`],
      );
      const habitResult = await testDatabase.pool.query(
        "INSERT INTO recovery_habits (name, category) VALUES ('Test habit', 'recovery') RETURNING id",
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

      await t.test("one of two simultaneous check-ins wins all reward writes", async () => {
        const input = {
          userId,
          checkinDate: new Date("2026-08-27T12:00:00.000Z"),
          moodScore: 8,
          energyScore: 7,
          effortScore: 9,
        };
        const results = await Promise.allSettled([
          recoveryStorage.createDailyCheckinWithRewards(input),
          recoveryStorage.createDailyCheckinWithRewards(input),
        ]);
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
        assert.deepEqual(wallet.rows[0], { bonus_credits: 10, lifetime_earned: 510 });
      });

      await t.test("a reward failure rolls back the check-in and retry can succeed", async () => {
        const trigger = ["credit_ledger", "fail_reward_trigger", "fail_reward_write"];
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
          [userId, input.date],
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
        const trigger = ["routine_completions", "fail_routine_trigger", "fail_routine_write"];
        await installFailureTrigger(testDatabase.pool, ...trigger);
        const date = "2026-08-30";
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
        assert.equal(habit.rows[0].total_completions, 0);
      });
    } finally {
      const importedDb = await import("../server/db").catch(() => undefined);
      await importedDb?.pool?.end?.().catch(() => undefined);
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