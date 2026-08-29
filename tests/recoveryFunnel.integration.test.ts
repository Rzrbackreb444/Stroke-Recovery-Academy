/**
 * End-to-end regression coverage for the recovery onboarding funnel.
 *
 * This test deliberately goes through the production login, survivor write,
 * and admin report routes. Set DATABASE_URL to run it; without a database it
 * is skipped so the fast, database-free test suite remains usable.
 */
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import express from "express";
import test from "node:test";

const canRun = Boolean(process.env.DATABASE_URL);

type FunnelTotals = Record<
  "assessment_completed" | "plan_generated" | "onboarding_completed" | "today_entered" | "first_rep",
  number
>;

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
  // The production session cookie is Secure because Replit terminates TLS at
  // the proxy. Tell Express this local request has already crossed that proxy.
  headers.set("X-Forwarded-Proto", "https");
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

async function readFunnel(baseUrl: string, adminCookie: string): Promise<FunnelTotals> {
  const { response, body } = await jsonRequest(baseUrl, "/api/admin/recovery-funnel?days=30", {}, adminCookie);
  assert.equal(response.status, 200, `admin funnel report failed: ${JSON.stringify(body)}`);
  return body.totals as FunnelTotals;
}

async function postRecovery(
  baseUrl: string,
  path: string,
  payload: Record<string, unknown>,
  survivorCookie: string,
): Promise<void> {
  const { response, body } = await jsonRequest(
    baseUrl,
    path,
    { method: "POST", body: JSON.stringify(payload) },
    survivorCookie,
  );
  assert.equal(response.status, 200, `${path} failed: ${JSON.stringify(body)}`);
}

async function installAssessmentFunnelFailure(pool: { query: (text: string) => Promise<unknown> }): Promise<void> {
  await pool.query(`
    CREATE OR REPLACE FUNCTION recovery_funnel_test_fail_assessment() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'recovery funnel injected failure';
    END;
    $$;
    DROP TRIGGER IF EXISTS recovery_funnel_test_fail_assessment ON recovery_funnel_events;
    CREATE TRIGGER recovery_funnel_test_fail_assessment
    BEFORE INSERT ON recovery_funnel_events
    FOR EACH ROW EXECUTE FUNCTION recovery_funnel_test_fail_assessment();
  `);
}

async function removeAssessmentFunnelFailure(pool: { query: (text: string) => Promise<unknown> }): Promise<void> {
  await pool.query("DROP TRIGGER IF EXISTS recovery_funnel_test_fail_assessment ON recovery_funnel_events");
  await pool.query("DROP FUNCTION IF EXISTS recovery_funnel_test_fail_assessment()");
}

async function installPlanFunnelFailure(pool: { query: (text: string) => Promise<unknown> }): Promise<void> {
  await pool.query(`
    CREATE OR REPLACE FUNCTION recovery_funnel_test_fail_plan() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.event_type IN ('plan_generated', 'onboarding_completed') THEN
        RAISE EXCEPTION 'recovery funnel injected plan failure';
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS recovery_funnel_test_fail_plan ON recovery_funnel_events;
    CREATE TRIGGER recovery_funnel_test_fail_plan
    BEFORE INSERT ON recovery_funnel_events
    FOR EACH ROW EXECUTE FUNCTION recovery_funnel_test_fail_plan();
  `);
}

async function removePlanFunnelFailure(pool: { query: (text: string) => Promise<unknown> }): Promise<void> {
  await pool.query("DROP TRIGGER IF EXISTS recovery_funnel_test_fail_plan ON recovery_funnel_events");
  await pool.query("DROP FUNCTION IF EXISTS recovery_funnel_test_fail_plan()");
}

test(
  "authenticated recovery retries and concurrent reassessments count one survivor per funnel milestone",
  { skip: !canRun },
  async () => {
    const { db, pool } = await import("../server/db");
    const activeIntervals: ReturnType<typeof setInterval>[] = [];
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];
    const originalSetInterval = globalThis.setInterval;
    const originalSetTimeout = globalThis.setTimeout;
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
    const { ensureRecoveryFunnelTable } = await import("../server/services/recoveryFunnelService");
    const { hashPassword } = await import("../server/multiProviderAuth");
    const { users } = await import("../shared/schema");
    const { sql } = await import("drizzle-orm");
    const { randomUUID } = await import("node:crypto");
    globalThis.setInterval = originalSetInterval;
    globalThis.setTimeout = originalSetTimeout;

    const suffix = randomUUID();
    const survivorId = `recovery-funnel-survivor-${suffix}`;
    const adminId = `recovery-funnel-admin-${suffix}`;
    const survivorEmail = `${survivorId}@example.test`;
    const adminEmail = `${adminId}@example.test`;
    const password = "recovery-funnel-test-password";
    let appServer: Server | undefined;
    let assessmentFunnelFailureInstalled = false;
    let planFunnelFailureInstalled = false;

    try {
      await db.insert(users).values([
        {
          id: survivorId,
          email: survivorEmail,
          passwordHash: hashPassword(password),
          authProvider: "local",
          role: "member",
        },
        {
          id: adminId,
          email: adminEmail,
          passwordHash: hashPassword(password),
          authProvider: "local",
          role: "admin",
        },
      ]);

      const issuer = "https://recovery-funnel-test.invalid";
      process.env.ISSUER_URL = issuer;
      process.env.REPL_ID ||= "recovery-funnel-test-client";
      process.env.SESSION_SECRET ||= "recovery-funnel-test-session-secret";
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
        // registerRoutes starts production schedulers. Unref and track their
        // timers here so this integration test can tear them down safely.
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
        appServer = await registerRoutes(app);
        globalThis.setInterval = originalSetInterval;
        globalThis.setTimeout = originalSetTimeout;
      } finally {
        if (globalThis.setInterval !== originalSetInterval) {
          globalThis.setInterval = originalSetInterval;
        }
        if (globalThis.setTimeout !== originalSetTimeout) {
          globalThis.setTimeout = originalSetTimeout;
        }
        globalThis.fetch = originalDiscoveryFetch;
      }
      await new Promise<void>((resolve) => appServer!.listen(0, "127.0.0.1", resolve));
      const appAddress = appServer.address();
      assert.ok(appAddress && typeof appAddress !== "string");
      const baseUrl = `http://127.0.0.1:${appAddress.port}`;

      const survivorCookie = await login(baseUrl, survivorEmail, password);
      const adminCookie = await login(baseUrl, adminEmail, password);
      const before = await readFunnel(baseUrl, adminCookie);

      const assessment = {
        physical: 4,
        cognitive: 5,
        speech: 6,
        emotional: 7,
        memory: 3,
        notes: "integration retry coverage",
      };

      // The snapshot and its milestone must be all-or-nothing. A trigger is
      // used here instead of mocking the service so this exercises the same
      // database transaction as production.
      await ensureRecoveryFunnelTable();
      await installAssessmentFunnelFailure(pool);
      assessmentFunnelFailureInstalled = true;
      const failedAssessment = await jsonRequest(
        baseUrl,
        "/api/recovery/assessment",
        { method: "POST", body: JSON.stringify(assessment) },
        survivorCookie,
      );
      assert.equal(failedAssessment.response.status, 500);
      const rolledBackAssessment = await db.execute(sql`
        SELECT COUNT(*)::int AS count
          FROM sasquatch_assessments
         WHERE user_id = ${survivorId}
      `);
      const rolledBackMilestone = await db.execute(sql`
        SELECT COUNT(*)::int AS count
          FROM recovery_funnel_events
         WHERE user_id = ${survivorId}
           AND event_type = 'assessment_completed'
      `);
      assert.equal(Number((rolledBackAssessment.rows[0] as { count: number | string }).count), 0);
      assert.equal(Number((rolledBackMilestone.rows[0] as { count: number | string }).count), 0);
      await removeAssessmentFunnelFailure(pool);
      assessmentFunnelFailureInstalled = false;

      await postRecovery(baseUrl, "/api/recovery/assessment", assessment, survivorCookie);
      await postRecovery(baseUrl, "/api/recovery/assessment", assessment, survivorCookie);

      // A later reassessment is valid once the 24-hour duplicate window has
      // passed. Move the initial snapshot outside that window, then submit a
      // materially different set of scores and notes. The new snapshot should
      // drive plan generation without creating a second funnel milestone.
      await db.execute(sql`
        UPDATE sasquatch_assessments
           SET taken_at = NOW() - INTERVAL '2 days'
         WHERE user_id = ${survivorId}
      `);
      const reassessmentA = {
        physical: 6,
        cognitive: 4,
        speech: 7,
        emotional: 5,
        memory: 8,
        notes: "integration simultaneous reassessment A",
      };
      const reassessmentB = {
        physical: 3,
        cognitive: 8,
        speech: 5,
        emotional: 9,
        memory: 2,
        notes: "integration simultaneous reassessment B",
      };
      await Promise.all([
        postRecovery(baseUrl, "/api/recovery/assessment", reassessmentA, survivorCookie),
        postRecovery(baseUrl, "/api/recovery/assessment", reassessmentB, survivorCookie),
      ]);
      const assessmentRows = await db.execute(sql`
        SELECT physical, cognitive, speech, emotional, memory, notes
          FROM sasquatch_assessments
         WHERE user_id = ${survivorId}
         ORDER BY taken_at, id
      `);
      assert.equal(assessmentRows.rows.length, 3);
      const concurrentSnapshots = assessmentRows.rows
        .filter((row) => {
          const snapshot = row as { notes: string | null };
          return snapshot.notes === reassessmentA.notes || snapshot.notes === reassessmentB.notes;
        })
        .map((row) => {
          const snapshot = row as {
            physical: number | string;
            cognitive: number | string;
            speech: number | string;
            emotional: number | string;
            memory: number | string;
            notes: string | null;
          };
          return [
            Number(snapshot.physical),
            Number(snapshot.cognitive),
            Number(snapshot.speech),
            Number(snapshot.emotional),
            Number(snapshot.memory),
            snapshot.notes,
          ];
        })
        .sort((left, right) => String(left[5]).localeCompare(String(right[5])));
      assert.deepEqual(concurrentSnapshots, [
        [6, 4, 7, 5, 8, reassessmentA.notes],
        [3, 8, 5, 9, 2, reassessmentB.notes],
      ]);

      // Keep the plan test deterministic even when the workspace has a Gemini
      // secret configured. The route should use its documented fallback.
      const originalFetch = globalThis.fetch;
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "recovery-funnel-test-key";
      let concurrentPlanRequests = 0;
      let holdConcurrentPlanRequests = false;
      let releaseConcurrentPlanRequests!: () => void;
      const concurrentPlanRequestsReady = new Promise<void>((resolve) => {
        releaseConcurrentPlanRequests = resolve;
      });
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("generativelanguage.googleapis.com")) {
          if (holdConcurrentPlanRequests) {
            concurrentPlanRequests += 1;
            if (concurrentPlanRequests === 2) {
              releaseConcurrentPlanRequests();
            }
            await concurrentPlanRequestsReady;
          }
          return new Response("", { status: 503 });
        }
        return originalFetch(input, init);
      }) as typeof fetch;
      try {
        // The generated plan and its milestones must be all-or-nothing. A
        // trigger failure proves the funnel write runs inside the plan
        // transaction rather than after it.
        await ensureRecoveryFunnelTable();
        await installPlanFunnelFailure(pool);
        planFunnelFailureInstalled = true;
        const failedPlan = await jsonRequest(
          baseUrl,
          "/api/recovery/plan/generate",
          { method: "POST", body: JSON.stringify({}) },
          survivorCookie,
        );
        assert.equal(failedPlan.response.status, 500);
        const rolledBackPlan = await db.execute(sql`
          SELECT COUNT(*)::int AS count
            FROM survivor_plans
           WHERE user_id = ${survivorId}
        `);
        const rolledBackPlanMilestones = await db.execute(sql`
          SELECT COUNT(*)::int AS count
            FROM recovery_funnel_events
           WHERE user_id = ${survivorId}
             AND event_type IN ('plan_generated', 'onboarding_completed')
        `);
        assert.equal(Number((rolledBackPlan.rows[0] as { count: number | string }).count), 0);
        assert.equal(Number((rolledBackPlanMilestones.rows[0] as { count: number | string }).count), 0);
        await removePlanFunnelFailure(pool);
        planFunnelFailureInstalled = false;

        // Hold both plan requests in the same generation step so neither can
        // accidentally pass only because the other happened to finish first.
        holdConcurrentPlanRequests = true;
        const concurrentPlans = await Promise.all([
          jsonRequest(
            baseUrl,
            "/api/recovery/plan/generate",
            { method: "POST", body: JSON.stringify({}) },
            survivorCookie,
          ),
          jsonRequest(
            baseUrl,
            "/api/recovery/plan/generate",
            { method: "POST", body: JSON.stringify({}) },
            survivorCookie,
          ),
        ]);
        holdConcurrentPlanRequests = false;
        for (const result of concurrentPlans) {
          assert.equal(result.response.status, 200, `concurrent plan failed: ${JSON.stringify(result.body)}`);
        }
        assert.deepEqual(concurrentPlans[0].body.plan, concurrentPlans[1].body.plan);
        assert.equal(concurrentPlans[0].body.generatedAt, concurrentPlans[1].body.generatedAt);

        const planState = await db.execute(sql`
          SELECT COUNT(*)::int AS count,
                 COUNT(DISTINCT assessment_id)::int AS assessments
            FROM survivor_plans
           WHERE user_id = ${survivorId}
             AND assessment_id = (
               SELECT id
                 FROM sasquatch_assessments
                WHERE user_id = ${survivorId}
                ORDER BY taken_at DESC, id DESC
                LIMIT 1
             )
        `);
        const planStateRow = planState.rows[0] as { count: number | string; assessments: number | string };
        assert.deepEqual(
          {
            count: Number(planStateRow.count),
            assessments: Number(planStateRow.assessments),
          },
          { count: 1, assessments: 1 },
        );
        const planMilestones = await db.execute(sql`
          SELECT event_type, COUNT(*)::int AS count
            FROM recovery_funnel_events
           WHERE user_id = ${survivorId}
             AND event_type IN ('plan_generated', 'onboarding_completed')
           GROUP BY event_type
           ORDER BY event_type
        `);
        assert.deepEqual(
          planMilestones.rows.map((row) => ({
            event_type: String((row as { event_type: string }).event_type),
            count: Number((row as { count: number | string }).count),
          })),
          [
            { event_type: "onboarding_completed", count: 1 },
            { event_type: "plan_generated", count: 1 },
          ],
        );

        await postRecovery(baseUrl, "/api/recovery/plan/generate", {}, survivorCookie);
        await postRecovery(baseUrl, "/api/recovery/plan/generate", {}, survivorCookie);
      } finally {
        globalThis.fetch = originalFetch;
        if (originalGeminiKey === undefined) {
          delete process.env.GEMINI_API_KEY;
        } else {
          process.env.GEMINI_API_KEY = originalGeminiKey;
        }
      }

      await postRecovery(baseUrl, "/api/recovery/today/entry", {}, survivorCookie);
      await postRecovery(baseUrl, "/api/recovery/today/entry", {}, survivorCookie);

      const date = "2099-01-01";
      await postRecovery(
        baseUrl,
        "/api/recovery/today/feedback",
        { taskId: "retry-skipped-task", level: 2, reaction: "skipped", date },
        survivorCookie,
      );
      await postRecovery(
        baseUrl,
        "/api/recovery/today/feedback",
        { taskId: "retry-skipped-task", level: 2, reaction: "skipped", date },
        survivorCookie,
      );

      const afterSkipped = await readFunnel(baseUrl, adminCookie);
      assert.deepEqual(
        {
          assessment_completed: afterSkipped.assessment_completed - before.assessment_completed,
          plan_generated: afterSkipped.plan_generated - before.plan_generated,
          onboarding_completed: afterSkipped.onboarding_completed - before.onboarding_completed,
          today_entered: afterSkipped.today_entered - before.today_entered,
          first_rep: afterSkipped.first_rep - before.first_rep,
        },
        {
          assessment_completed: 1,
          plan_generated: 1,
          onboarding_completed: 1,
          today_entered: 1,
          first_rep: 0,
        },
        "assessment, plan, Today, and skipped feedback retries drifted the funnel",
      );

      await postRecovery(
        baseUrl,
        "/api/recovery/today/feedback",
        { taskId: "retry-completed-task", level: 2, reaction: "good", date },
        survivorCookie,
      );
      await postRecovery(
        baseUrl,
        "/api/recovery/today/feedback",
        { taskId: "retry-completed-task", level: 2, reaction: "good", date },
        survivorCookie,
      );

      const afterCompleted = await readFunnel(baseUrl, adminCookie);
      assert.deepEqual(
        {
          assessment_completed: afterCompleted.assessment_completed - before.assessment_completed,
          plan_generated: afterCompleted.plan_generated - before.plan_generated,
          onboarding_completed: afterCompleted.onboarding_completed - before.onboarding_completed,
          today_entered: afterCompleted.today_entered - before.today_entered,
          first_rep: afterCompleted.first_rep - before.first_rep,
        },
        {
          assessment_completed: 1,
          plan_generated: 1,
          onboarding_completed: 1,
          today_entered: 1,
          first_rep: 1,
        },
        "later non-skipped feedback did not create exactly one first-rep milestone",
      );
    } finally {
      if (appServer) await new Promise<void>((resolve) => appServer!.close(() => resolve()));
      for (const interval of activeIntervals) clearInterval(interval);
      for (const timeout of activeTimeouts) clearTimeout(timeout);

      // Setup can fail before the first recovery request (for example while
      // discovering the test OIDC issuer), so make teardown independent of
      // whether the route that creates this compatibility table ran.
      await ensureRecoveryFunnelTable();
      if (assessmentFunnelFailureInstalled) {
        await removeAssessmentFunnelFailure(pool);
      }
      if (planFunnelFailureInstalled) {
        await removePlanFunnelFailure(pool);
      }
      await db.execute(sql`DELETE FROM recovery_funnel_events WHERE user_id IN (${survivorId}, ${adminId})`);
      await db.execute(sql`DELETE FROM routine_feedback WHERE user_id IN (${survivorId}, ${adminId})`);
      await db.execute(sql`DELETE FROM routine_completions WHERE user_id IN (${survivorId}, ${adminId})`);
      await db.execute(sql`DELETE FROM survivor_plans WHERE user_id IN (${survivorId}, ${adminId})`);
      await db.execute(sql`DELETE FROM sasquatch_assessments WHERE user_id IN (${survivorId}, ${adminId})`);
      await db.delete(users).where(sql`${users.id} IN (${survivorId}, ${adminId})`);
      await pool.end();
    }
  },
);