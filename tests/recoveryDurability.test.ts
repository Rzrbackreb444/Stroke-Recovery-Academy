/**
 * Regression contracts for the recovery write paths.
 *
 * These checks intentionally inspect the small set of persistence boundaries
 * that are easy to accidentally "simplify" back into best-effort writes.
 * Database-backed integration tests can run against a disposable database;
 * these fast checks still run in the normal no-database test command.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";
import express from "express";
import { type Server } from "node:http";
import { createDisposablePostgres } from "./disposablePostgres";

const routes = await readFile(new URL("../server/routes.ts", import.meta.url), "utf8");
const storage = await readFile(new URL("../server/storage.ts", import.meta.url), "utf8");
const history = await readFile(new URL("../server/sasquatchHistoryService.ts", import.meta.url), "utf8");
const durability = await readFile(new URL("../server/recoveryDurabilityService.ts", import.meta.url), "utf8");
const authorBrain = await readFile(new URL("../server/authorBrainService.ts", import.meta.url), "utf8");
const chatWidget = await readFile(
  new URL("../client/src/components/recovery/SasquatchChatWidget.tsx", import.meta.url),
  "utf8",
);
const coachPage = await readFile(
  new URL("../client/src/pages/SasquatchCoach.tsx", import.meta.url),
  "utf8",
);

test("coach turns await durable history before returning success", () => {
  assert.match(routes, /const \{ persistChatTurn \} = await import\('\.\/sasquatchHistoryService'\);\s+await persistChatTurn\(persistUserId, message, finalResponse\)/);
  assert.match(history, /await db\.execute\(sql`[\s\S]*INSERT INTO sasquatch_chat_messages/);
  assert.doesNotMatch(history, /persistChatTurn[\s\S]{0,900}catch/);
});

test("Coach memory is explicit, owner-scoped, and keeps facts separate from observations", () => {
  assert.match(history, /CREATE TABLE IF NOT EXISTS coach_memory_preferences[\s\S]*include_journal BOOLEAN NOT NULL DEFAULT FALSE/);
  assert.match(history, /CREATE TABLE IF NOT EXISTS coach_memory_items[\s\S]*user_id VARCHAR NOT NULL/);
  assert.match(history, /CREATE TABLE IF NOT EXISTS coach_memory_exclusions/);
  assert.match(history, /WHERE user_id = \$\{userId\} AND source_type = \$\{sourceType\}/);
  assert.match(history, /export async function getWeeklyCoachSummary/);
  assert.match(coachPage, /Coach observations · patterns, not facts/);
  assert.match(coachPage, /Survivor-entered facts/);
  assert.ok(routes.includes("app.get('/api/coach/memory', isAuthenticated"));
  assert.ok(routes.includes("app.patch('/api/coach/memory/preferences', isAuthenticated"));
  assert.ok(routes.includes("app.patch('/api/coach/memory/items/:id', isAuthenticated"));
  assert.ok(routes.includes("app.delete('/api/coach/memory/items/:id', isAuthenticated"));
  assert.match(routes, /approvedMemory: approvedMemory\.map/);
  assert.match(chatWidget, /\/api\/coach\/history/);
});

test("Coach recovery summaries support bounded date ranges without changing source approvals", () => {
  assert.match(history, /COACH_HISTORY_RANGE_DAYS = \[7, 30, 90\]/);
  assert.match(history, /getWeeklyCoachSummary\([\s\S]*rangeDays/);
  assert.match(routes, /rangeDays must be one of 7, 30, or 90/);
  assert.match(coachPage, /select-coach-summary-range/);
  assert.match(coachPage, /Survivor-entered facts, saved plans, and Coach observations stay separate/);
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

test("Coach keeps text usable when voice fails and retries audio without duplicating the turn", () => {
  assert.match(routes, /Voice audio is unavailable right now\. Your text response is still available\./);
  assert.doesNotMatch(routes, /res\.status\(503\)\.json\(\{ message: 'ElevenLabs TTS not configured' \}\)/);
  assert.match(coachPage, /Voice audio is unavailable right now\. Your text response is still here\./);
  assert.match(coachPage, /button-retry-audio/);
  assert.match(coachPage, /requestCoachAudio\(msg\.id, msg\.content\)/);
  assert.match(coachPage, /setAudioStatus\(messageId, "unavailable"\)/);
  assert.match(coachPage, /const messageId = nextMessageId\(\)/);
  const audioRequest = coachPage.match(
    /const requestCoachAudio = async[\s\S]*?\n  };\n\n  const chatMutation/,
  )?.[0];
  assert.ok(audioRequest, "Coach audio retry helper should remain a separate path from chat submission");
  assert.doesNotMatch(audioRequest, /chatMutation\.mutate/);
  assert.doesNotMatch(
    coachPage,
    /onClick=\{\(\) => void requestCoachAudio\(msg\.id, msg\.content\)[\s\S]{0,500}chatMutation\.mutate/,
  );
});

const integrationEnabled = process.env.RECOVERY_DURABILITY_DB === "1";
const recoveryUserPrefix = `recovery-durability-${process.pid}-`;

async function createRecoverySchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE users (
      id varchar PRIMARY KEY,
      email varchar UNIQUE,
      first_name varchar,
      last_name varchar,
      profile_image_url varchar,
      password_hash varchar,
      auth_provider varchar DEFAULT 'local',
      role text NOT NULL DEFAULT 'member',
      stripe_customer_id text,
      stripe_subscription_id text,
      subscription_status text,
      stripe_connect_account_id text,
      stripe_connect_onboarded boolean DEFAULT false,
      creator_payout_enabled boolean DEFAULT false,
      spotlight_opted_in boolean NOT NULL DEFAULT false,
      spotlight_consent boolean NOT NULL DEFAULT false,
      spotlight_consent_at timestamp,
      is_verified_therapist boolean NOT NULL DEFAULT false,
      therapist_title text,
      therapist_credentials text,
      therapist_bio text,
      therapist_verified_at timestamp,
      accepts_power_points boolean NOT NULL DEFAULT true,
      public_slug varchar UNIQUE,
      last_daily_gift_at timestamp,
      avatar_url text,
      avatar_style text,
      avatar_generated_prompt text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );
    CREATE SCHEMA author_brain;
    CREATE TABLE author_brain.project_context (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      project_name text NOT NULL,
      project_type text,
      global_tone text DEFAULT 'narrative',
      created_at timestamp with time zone DEFAULT now(),
      last_updated timestamp with time zone DEFAULT now()
    );
    CREATE TABLE author_brain.author_memory (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid REFERENCES author_brain.project_context(id) ON DELETE CASCADE,
      content_type text NOT NULL,
      raw_text text NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
    CREATE TABLE sessions (
      sid varchar PRIMARY KEY,
      sess json NOT NULL,
      expire timestamp(6) NOT NULL
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

function getCookie(response: Response): string {
  const setCookie =
    typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()[0]
      : response.headers.get("set-cookie");
  assert.ok(setCookie, "login response did not set a session cookie");
  return setCookie.split(";", 1)[0];
}

async function jsonRequest(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<{ response: Response; body: any }> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Forwarded-Proto", "https");
  headers.set("Connection", "close");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const { response, body } = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login failed: ${JSON.stringify(body)}`);
  return getCookie(response);
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
  await pool.query(`
    DELETE FROM author_brain.author_memory
    WHERE project_id IN (
      SELECT id FROM author_brain.project_context WHERE user_id LIKE $1
    )
  `, [`${recoveryUserPrefix}%`]);
  await pool.query(
    "DELETE FROM author_brain.project_context WHERE user_id LIKE $1",
    [`${recoveryUserPrefix}%`],
  );
  await pool.query("DELETE FROM users WHERE id LIKE $1", [`${recoveryUserPrefix}%`]);
  await pool.query("DELETE FROM recovery_habits WHERE name = 'Test habit'");
}

if (integrationEnabled) {
  test("recovery durability survives real failures and concurrent requests", { timeout: 120_000 }, async (t) => {
    const testDatabase = await createDisposablePostgres();
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDriverFlag = process.env.RECOVERY_DURABILITY_DB;
    const originalIssuerUrl = process.env.ISSUER_URL;
    const originalReplId = process.env.REPL_ID;
    const originalSessionSecret = process.env.SESSION_SECRET;
    process.env.DATABASE_URL = testDatabase.url;
    process.env.RECOVERY_DURABILITY_DB = "1";
    const activeIntervals: ReturnType<typeof setInterval>[] = [];
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];
    const originalSetInterval = globalThis.setInterval;
    const originalSetTimeout = globalThis.setTimeout;
    let appServer: Server | undefined;

    try {
      await createRecoverySchema(testDatabase.pool);
      const [{ storage: recoveryStorage }, { pool: appPool }, { saveRoutineFeedback, replaceSurvivorGoals }] =
        await Promise.all([
          import("../server/storage"),
          import("../server/db"),
          import("../server/recoveryDurabilityService"),
        ]);
      const { hashPassword } = await import("../server/multiProviderAuth");

      const userId = `${recoveryUserPrefix}owner`;
      const otherUserId = `${recoveryUserPrefix}other`;
      const password = "recovery-durability-test-password";
      await testDatabase.pool.query(
        `INSERT INTO users (id, email, password_hash, auth_provider)
         VALUES ($1, $2, $3, 'local'), ($4, $5, $6, 'local')`,
        [
          userId,
          `${userId}@example.test`,
          hashPassword(password),
          otherUserId,
          `${otherUserId}@example.test`,
          hashPassword(password),
        ],
      );

      const issuer = "https://recovery-durability-test.invalid";
      process.env.ISSUER_URL = issuer;
      process.env.REPL_ID ||= "recovery-durability-test-client";
      process.env.SESSION_SECRET ||= "recovery-durability-test-session-secret";
      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));
      const originalDiscoveryFetch = globalThis.fetch;
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url === `${issuer}/.well-known/openid-configuration`) {
          return new Response(
            JSON.stringify({
              issuer,
              authorization_endpoint: `${issuer}/authorize`,
              token_endpoint: `${issuer}/token`,
              userinfo_endpoint: `${issuer}/userinfo`,
              jwks_uri: `${issuer}/jwks`,
              response_types_supported: ["code"],
              subject_types_supported: ["public"],
              id_token_signing_alg_values_supported: ["RS256"],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        return originalDiscoveryFetch(input, init);
      }) as typeof fetch;
      try {
        globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
          const handle = originalSetInterval(...args);
          activeIntervals.push(handle);
          handle.unref();
          return handle;
        }) as typeof setInterval;
        globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
          const handle = originalSetTimeout(...args);
          activeTimeouts.push(handle);
          handle.unref();
          return handle;
        }) as typeof setTimeout;
        const { registerRoutes } = await import("../server/routes");
        appServer = await registerRoutes(app);
      } finally {
        globalThis.fetch = originalDiscoveryFetch;
        globalThis.setInterval = originalSetInterval;
        globalThis.setTimeout = originalSetTimeout;
      }
      const address = await new Promise<import("node:net").AddressInfo>((resolve, reject) => {
        const server = appServer!;
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve(server.address() as import("node:net").AddressInfo));
      });
      const baseUrl = `http://127.0.0.1:${address.port}`;
      const ownerCookie = await login(baseUrl, `${userId}@example.test`, password);
      const otherCookie = await login(baseUrl, `${otherUserId}@example.test`, password);

      await t.test("Author Brain routes enforce ownership and stable validation boundaries", async () => {
        // Create both records through separate authenticated sessions. This
        // makes the test fail if a route drops the session's user ID.
        const ownerProjectResponse = await jsonRequest(
          baseUrl,
          "/api/author-brain/projects",
          {
            method: "POST",
            body: JSON.stringify({ projectName: "Owner project", projectType: "book" }),
          },
          ownerCookie,
        );
        assert.equal(ownerProjectResponse.response.status, 200);
        const ownerProjectId = ownerProjectResponse.body.id as string;

        const otherProjectResponse = await jsonRequest(
          baseUrl,
          "/api/author-brain/projects",
          {
            method: "POST",
            body: JSON.stringify({ projectName: "Other project", projectType: "book" }),
          },
          otherCookie,
        );
        assert.equal(otherProjectResponse.response.status, 200);
        const otherProjectId = otherProjectResponse.body.id as string;
        assert.notEqual(ownerProjectId, otherProjectId);

        const ownerProjects = await jsonRequest(
          baseUrl,
          "/api/author-brain/projects",
          {},
          ownerCookie,
        );
        assert.equal(ownerProjects.response.status, 200);
        assert.deepEqual(ownerProjects.body.map((project: any) => project.id), [ownerProjectId]);
        const otherProjects = await jsonRequest(
          baseUrl,
          "/api/author-brain/projects",
          {},
          otherCookie,
        );
        assert.equal(otherProjects.response.status, 200);
        assert.deepEqual(otherProjects.body.map((project: any) => project.id), [otherProjectId]);

        const ownerMemoryResponse = await jsonRequest(
          baseUrl,
          "/api/author-brain/memories",
          {
            method: "POST",
            body: JSON.stringify({
              projectId: ownerProjectId,
              contentType: "character",
              rawText: "The owner project's protected memory",
              metadata: { source: "route test" },
            }),
          },
          ownerCookie,
        );
        assert.equal(ownerMemoryResponse.response.status, 200);
        const ownerMemoryId = ownerMemoryResponse.body.id as string;
        const unknownProjectId = randomUUID();
        const unknownMemoryId = randomUUID();

        const assertMatching404 = async (
          crossUserPath: string,
          unknownPath: string,
          method = "GET",
          crossUserBody?: Record<string, unknown>,
          unknownBody = crossUserBody,
        ) => {
          const init: RequestInit = { method };
          if (crossUserBody) init.body = JSON.stringify(crossUserBody);
          const unknownInit: RequestInit = { method };
          if (unknownBody) unknownInit.body = JSON.stringify(unknownBody);
          const crossUser = await jsonRequest(baseUrl, crossUserPath, init, otherCookie);
          const unknown = await jsonRequest(baseUrl, unknownPath, unknownInit, otherCookie);
          assert.equal(crossUser.response.status, 404, `${method} ${crossUserPath}`);
          assert.equal(unknown.response.status, 404, `${method} ${unknownPath}`);
          assert.deepEqual(
            crossUser.body,
            unknown.body,
            `${method} ${crossUserPath} disclosed a different not-found response`,
          );
        };

        await assertMatching404(
          `/api/author-brain/projects/${ownerProjectId}`,
          `/api/author-brain/projects/${unknownProjectId}`,
        );
        await assertMatching404(
          `/api/author-brain/projects/${ownerProjectId}`,
          `/api/author-brain/projects/${unknownProjectId}`,
          "PATCH",
          { projectName: "Should not update" },
        );
        await assertMatching404(
          `/api/author-brain/projects/${ownerProjectId}`,
          `/api/author-brain/projects/${unknownProjectId}`,
          "DELETE",
        );

        const memoryBody = {
          projectId: ownerProjectId,
          contentType: "note",
          rawText: "Should not be added",
        };
        await assertMatching404(
          "/api/author-brain/memories",
          "/api/author-brain/memories",
          "POST",
          memoryBody,
          { ...memoryBody, projectId: unknownProjectId },
        );
        await assertMatching404(
          `/api/author-brain/memories?projectId=${ownerProjectId}`,
          `/api/author-brain/memories?projectId=${unknownProjectId}`,
        );
        await assertMatching404(
          `/api/author-brain/memories/${ownerMemoryId}`,
          `/api/author-brain/memories/${unknownMemoryId}`,
        );
        await assertMatching404(
          `/api/author-brain/memories/${ownerMemoryId}`,
          `/api/author-brain/memories/${unknownMemoryId}`,
          "PATCH",
          { rawText: "Should not update" },
        );
        await assertMatching404(
          `/api/author-brain/memories/${ownerMemoryId}`,
          `/api/author-brain/memories/${unknownMemoryId}`,
          "DELETE",
        );
        await assertMatching404(
          `/api/author-brain/search?projectId=${ownerProjectId}&query=protected`,
          `/api/author-brain/search?projectId=${unknownProjectId}&query=protected`,
        );
        await assertMatching404(
          `/api/author-brain/context?projectId=${ownerProjectId}&chapterTitle=Protected`,
          `/api/author-brain/context?projectId=${unknownProjectId}&chapterTitle=Protected`,
        );
        await assertMatching404(
          `/api/author-brain/stats?projectId=${ownerProjectId}`,
          `/api/author-brain/stats?projectId=${unknownProjectId}`,
        );

        const beforeProjects = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM author_brain.project_context",
        );
        const beforeMemories = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM author_brain.author_memory",
        );
        const expect400 = async (
          path: string,
          init: RequestInit,
          message: string,
          label: string,
        ) => {
          const result = await jsonRequest(baseUrl, path, init, ownerCookie);
          assert.equal(result.response.status, 400, label);
          assert.deepEqual(result.body, { message }, label);
        };

        await expect400(
          "/api/author-brain/projects",
          { method: "POST", body: JSON.stringify([]) },
          "Request body must be an object",
          "array project body",
        );
        await expect400(
          "/api/author-brain/projects",
          {
            method: "POST",
            body: JSON.stringify({ projectName: "x".repeat(201), projectType: "book" }),
          },
          "Project name must be 200 characters or fewer",
          "bounded project name",
        );
        await expect400(
          `/api/author-brain/projects/${ownerProjectId}`,
          { method: "PATCH", body: JSON.stringify({}) },
          "At least one project field is required",
          "empty project update",
        );
        await expect400(
          `/api/author-brain/projects/${ownerProjectId}`,
          { method: "PATCH", body: JSON.stringify({ globalTone: "x".repeat(101) }) },
          "Global tone must be 100 characters or fewer",
          "bounded global tone",
        );
        await expect400(
          "/api/author-brain/memories",
          {
            method: "POST",
            body: JSON.stringify({
              projectId: ownerProjectId,
              contentType: "note",
              rawText: "x".repeat(50_001),
            }),
          },
          "Text must be 50000 characters or fewer",
          "bounded memory text",
        );
        await expect400(
          `/api/author-brain/memories/${ownerMemoryId}`,
          { method: "PATCH", body: JSON.stringify({}) },
          "At least one memory field is required",
          "empty memory update",
        );
        await expect400(
          `/api/author-brain/search?projectId=${ownerProjectId}&query=${"x".repeat(501)}`,
          {},
          "Search query must be 500 characters or fewer",
          "bounded search query",
        );
        await expect400(
          `/api/author-brain/context?projectId=${ownerProjectId}&chapterTitle=${"x".repeat(301)}`,
          {},
          "Chapter title must be 300 characters or fewer",
          "bounded chapter title",
        );
        await expect400(
          `/api/author-brain/context?projectId=${ownerProjectId}&chapterDescription=${"x".repeat(5001)}`,
          {},
          "Chapter description must be 5000 characters or fewer",
          "bounded chapter description",
        );
        await expect400(
          `/api/author-brain/search?projectId=${ownerProjectId}&query=protected&limit=51`,
          {},
          "Limit must be an integer between 1 and 50",
          "bounded search limit",
        );
        await expect400(
          "/api/author-brain/stats?projectId=not-a-uuid",
          {},
          "Project ID must be a valid UUID",
          "invalid stats project ID",
        );

        const afterProjects = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM author_brain.project_context",
        );
        const afterMemories = await testDatabase.pool.query(
          "SELECT COUNT(*)::int AS count FROM author_brain.author_memory",
        );
        assert.deepEqual(afterProjects.rows, beforeProjects.rows);
        assert.deepEqual(afterMemories.rows, beforeMemories.rows);

        const ownerProject = await jsonRequest(
          baseUrl,
          `/api/author-brain/projects/${ownerProjectId}`,
          {},
          ownerCookie,
        );
        assert.equal(ownerProject.response.status, 200);
        const ownerMemory = await jsonRequest(
          baseUrl,
          `/api/author-brain/memories/${ownerMemoryId}`,
          {},
          ownerCookie,
        );
        assert.equal(ownerMemory.response.status, 200);
        assert.equal(ownerMemory.body.raw_text, "The owner project's protected memory");
      });

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
      if (appServer) {
        (appServer as Server & { closeAllConnections?: () => void }).closeAllConnections?.();
        await new Promise<void>((resolve) => appServer!.close(() => resolve()));
      }
      for (const interval of activeIntervals) clearInterval(interval);
      for (const timeout of activeTimeouts) clearTimeout(timeout);
      const importedDb = await import("../server/db").catch(() => undefined);
      await importedDb?.pool?.end?.().catch(() => undefined);
      await cleanRecoveryData(testDatabase.pool).catch(() => undefined);
      await testDatabase.stop();
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
      if (originalDriverFlag === undefined) delete process.env.RECOVERY_DURABILITY_DB;
      else process.env.RECOVERY_DURABILITY_DB = originalDriverFlag;
      if (originalIssuerUrl === undefined) delete process.env.ISSUER_URL;
      else process.env.ISSUER_URL = originalIssuerUrl;
      if (originalReplId === undefined) delete process.env.REPL_ID;
      else process.env.REPL_ID = originalReplId;
      if (originalSessionSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = originalSessionSecret;
    }
  });
} else {
  test("recovery durability integration suite", { skip: "set RECOVERY_DURABILITY_DB=1 to run against disposable PostgreSQL" }, () => {});
}