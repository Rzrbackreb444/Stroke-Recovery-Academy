/**
 * End-to-end regression coverage for the recovery onboarding funnel.
 *
 * This test deliberately goes through the production login, survivor write,
 * and admin report routes. Set DATABASE_URL to run it; without a database it
 * is skipped so the fast, database-free test suite remains usable.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import express from "express";
import test from "node:test";

const canRun = Boolean(process.env.DATABASE_URL);

type FunnelTotals = Record<
  "assessment_completed" | "plan_generated" | "onboarding_completed" | "today_entered" | "first_rep",
  number
>;

function getCookie(response: Response): string {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies =
    typeof getSetCookie === "function"
      ? getSetCookie.call(response.headers)
      : [response.headers.get("set-cookie") || ""];
  const setCookie = setCookies.find((cookie) => cookie.startsWith("connect.sid=")) || setCookies[0];
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

async function cleanupDisposableAccount(
  baseUrl: string,
  email: string,
  cookie: string,
): Promise<void> {
  const { response, body } = await jsonRequest(
    baseUrl,
    "/api/account/delete",
    {
      method: "POST",
      body: JSON.stringify({ confirmEmail: email }),
    },
    cookie,
  );
  if (response.status !== 200 || body?.ok !== true) {
    throw new Error(`disposable account cleanup failed (HTTP ${response.status})`);
  }
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
): Promise<any> {
  const { response, body } = await jsonRequest(
    baseUrl,
    path,
    { method: "POST", body: JSON.stringify(payload) },
    survivorCookie,
  );
  assert.equal(response.status, 200, `${path} failed: ${JSON.stringify(body)}`);
  return body;
}

function assertSafeEducationPlan(plan: any): void {
  assert.equal(plan?.planVersion, 2);
  assert.equal(plan?.planType, "education_and_clinician_review");
  assert.ok(Array.isArray(plan?.exercises) && plan.exercises.length > 0);
  assert.deepEqual(Object.keys(plan).sort(), [
    "education",
    "exercises",
    "focusDomains",
    "planType",
    "planVersion",
    "safetyNote",
    "summary",
    "tips",
    "weeklyReflection",
  ]);
  assert.deepEqual(Object.keys(plan.education).sort(), ["brainGym", "nutrition"]);
  for (const exercise of plan.exercises) {
    assert.deepEqual(Object.keys(exercise).sort(), [
      "clinicianReviewRequired",
      "description",
      "domain",
      "exerciseId",
      "name",
      "safetyNotes",
      "slug",
    ]);
  }
  assert.doesNotMatch(JSON.stringify(plan), /invented-route-exercise|hydrationOz|"sets"|"dosage"/i);
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
    const { survivorPlans, users } = await import("../shared/schema");
      const { inArray, sql } = await import("drizzle-orm");
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
    let baseUrl = "";
    let survivorCookie = "";
    let adminCookie = "";
    let usersInserted = false;
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
      usersInserted = true;
      const planMigration = await readFile(
        new URL("../migrations/0011_recovery_plan_assessment_unique.sql", import.meta.url),
        "utf8",
      );
      const canonicalProfileMigration = await readFile(
        new URL("../migrations/0014_canonical_survivor_profile.sql", import.meta.url),
        "utf8",
      );
      const recoveryPlanReviewsMigration = await readFile(
        new URL("../migrations/0015_recovery_plan_reviews.sql", import.meta.url),
        "utf8",
      );
      // The integration database may have the schema table but not the latest
      // generated migration. Applying it here keeps the route assertions
      // honest and exercises the duplicate-free rollout path.
      await pool.query(planMigration);
      // The route under test reads and updates the canonical profile during
      // reassessment and plan generation. Keep this fixture compatible with
      // databases created before the canonical profile migration landed.
      await pool.query(canonicalProfileMigration);
      // Plan generation also resets review state when replacing a legacy draft.
      // Apply the review migration so this route-level fixture matches the
      // current survivor_plans shape.
      await pool.query(recoveryPlanReviewsMigration);

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
      baseUrl = `http://127.0.0.1:${appAddress.port}`;

      survivorCookie = await login(baseUrl, survivorEmail, password);
      adminCookie = await login(baseUrl, adminEmail, password);

      const emptyProfile = await jsonRequest(
        baseUrl,
        "/api/survivor/profile",
        {},
        survivorCookie,
      );
      assert.equal(emptyProfile.response.status, 200);
      assert.equal(emptyProfile.body.profile, null);

      const profilePatch = await jsonRequest(
        baseUrl,
        "/api/survivor/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            profileSource: "survivor_profile_settings",
            preferredName: "Integration Survivor",
            deficits: { motor: 3, fatigue: 2 },
            recoveryGoals: ["Speak with more confidence"],
            goalDetails: [{
              horizon: "long",
              domain: "speech",
              goal: "Speak with more confidence",
              status: "active",
            }],
            currentChallenges: ["Finding words under pressure"],
            customGoal: "Give a short toast at my daughter's wedding",
            assessmentScores: {
              physical: 4,
              cognitive: 5,
              speech: 6,
              emotional: 7,
              memory: 3,
            },
            assessmentNotes: "Speech is improving with repetition",
            equipment: ["ankle-foot orthosis"],
            mobilityAids: ["cane"],
            dailyTimeBudgetMinutes: 20,
            energyPattern: "morning",
          }),
        },
        survivorCookie,
      );
      assert.equal(profilePatch.response.status, 200, JSON.stringify(profilePatch.body));
      assert.equal(profilePatch.body.profile.preferredName, "Integration Survivor");
      assert.deepEqual(profilePatch.body.profile.goalDetails, [{
        horizon: "long",
        domain: "speech",
        goal: "Speak with more confidence",
        status: "active",
      }]);

      const profileRead = await jsonRequest(
        baseUrl,
        "/api/survivor/profile",
        {},
        survivorCookie,
      );
      assert.equal(profileRead.response.status, 200);
      assert.equal(profileRead.body.profile.preferredName, "Integration Survivor");
      assert.equal(profileRead.body.profile.profileProvenance.preferredName.source, "survivor_profile_settings");

      const canonicalBeforeIntakeReset = {
        preferredName: profileRead.body.profile.preferredName,
        deficits: profileRead.body.profile.deficits,
        recoveryGoals: profileRead.body.profile.recoveryGoals,
        goalDetails: profileRead.body.profile.goalDetails,
        currentChallenges: profileRead.body.profile.currentChallenges,
        customGoal: profileRead.body.profile.customGoal,
        assessmentScores: profileRead.body.profile.assessmentScores,
        assessmentNotes: profileRead.body.profile.assessmentNotes,
        equipment: profileRead.body.profile.equipment,
        mobilityAids: profileRead.body.profile.mobilityAids,
        dailyTimeBudgetMinutes: profileRead.body.profile.dailyTimeBudgetMinutes,
        energyPattern: profileRead.body.profile.energyPattern,
        profileProvenance: profileRead.body.profile.profileProvenance,
      };

      const completedIntake = await jsonRequest(
        baseUrl,
        "/api/survivor/profile/complete",
        { method: "POST", body: JSON.stringify({}) },
        survivorCookie,
      );
      assert.equal(completedIntake.response.status, 200, JSON.stringify(completedIntake.body));
      assert.equal(completedIntake.body.profile.intakeComplete, true);
      assert.equal(
        completedIntake.body.profile.profileProvenance.intakeCompletedAt.source,
        "survivor_intake",
      );
      const canonicalProfileBeforeIntakeReset = {
        ...canonicalBeforeIntakeReset,
        profileProvenance: completedIntake.body.profile.profileProvenance,
      };

      const resetIntakes = await Promise.all([
        jsonRequest(
          baseUrl,
          "/api/survivor/profile/reset-intake",
          { method: "POST", body: JSON.stringify({}) },
          survivorCookie,
        ),
        jsonRequest(
          baseUrl,
          "/api/survivor/profile/reset-intake",
          { method: "POST", body: JSON.stringify({}) },
          survivorCookie,
        ),
        jsonRequest(
          baseUrl,
          "/api/survivor/profile/reset-intake",
          { method: "POST", body: JSON.stringify({}) },
          survivorCookie,
        ),
      ]);
      for (const resetIntake of resetIntakes) {
        assert.equal(resetIntake.response.status, 200, JSON.stringify(resetIntake.body));
        assert.equal(resetIntake.body.profile.intakeComplete, false);
        assert.equal(resetIntake.body.profile.currentIntakeStep, 0);
        assert.deepEqual(
          {
            preferredName: resetIntake.body.profile.preferredName,
            deficits: resetIntake.body.profile.deficits,
            recoveryGoals: resetIntake.body.profile.recoveryGoals,
            goalDetails: resetIntake.body.profile.goalDetails,
            currentChallenges: resetIntake.body.profile.currentChallenges,
            customGoal: resetIntake.body.profile.customGoal,
            assessmentScores: resetIntake.body.profile.assessmentScores,
            assessmentNotes: resetIntake.body.profile.assessmentNotes,
            equipment: resetIntake.body.profile.equipment,
            mobilityAids: resetIntake.body.profile.mobilityAids,
            dailyTimeBudgetMinutes: resetIntake.body.profile.dailyTimeBudgetMinutes,
            energyPattern: resetIntake.body.profile.energyPattern,
            profileProvenance: resetIntake.body.profile.profileProvenance,
          },
          canonicalProfileBeforeIntakeReset,
        );
      }
      assert.deepEqual(
        {
          preferredName: resetIntakes[1].body.profile.preferredName,
          deficits: resetIntakes[1].body.profile.deficits,
          recoveryGoals: resetIntakes[1].body.profile.recoveryGoals,
          goalDetails: resetIntakes[1].body.profile.goalDetails,
          currentChallenges: resetIntakes[1].body.profile.currentChallenges,
          customGoal: resetIntakes[1].body.profile.customGoal,
          assessmentScores: resetIntakes[1].body.profile.assessmentScores,
          assessmentNotes: resetIntakes[1].body.profile.assessmentNotes,
          equipment: resetIntakes[1].body.profile.equipment,
          mobilityAids: resetIntakes[1].body.profile.mobilityAids,
          dailyTimeBudgetMinutes: resetIntakes[1].body.profile.dailyTimeBudgetMinutes,
          energyPattern: resetIntakes[1].body.profile.energyPattern,
          profileProvenance: resetIntakes[1].body.profile.profileProvenance,
        },
        {
          preferredName: resetIntakes[0].body.profile.preferredName,
          deficits: resetIntakes[0].body.profile.deficits,
          recoveryGoals: resetIntakes[0].body.profile.recoveryGoals,
          goalDetails: resetIntakes[0].body.profile.goalDetails,
          currentChallenges: resetIntakes[0].body.profile.currentChallenges,
          customGoal: resetIntakes[0].body.profile.customGoal,
          assessmentScores: resetIntakes[0].body.profile.assessmentScores,
          assessmentNotes: resetIntakes[0].body.profile.assessmentNotes,
          equipment: resetIntakes[0].body.profile.equipment,
          mobilityAids: resetIntakes[0].body.profile.mobilityAids,
          dailyTimeBudgetMinutes: resetIntakes[0].body.profile.dailyTimeBudgetMinutes,
          energyPattern: resetIntakes[0].body.profile.energyPattern,
          profileProvenance: resetIntakes[0].body.profile.profileProvenance,
        },
        "concurrent reset calls should return one consistent canonical profile",
      );

      const recompletedIntake = await jsonRequest(
        baseUrl,
        "/api/survivor/profile/complete",
        { method: "POST", body: JSON.stringify({}) },
        survivorCookie,
      );
      assert.equal(recompletedIntake.response.status, 200, JSON.stringify(recompletedIntake.body));
      assert.equal(recompletedIntake.body.profile.intakeComplete, true);
      assert.equal(
        recompletedIntake.body.profile.profileProvenance.intakeCompletedAt.source,
        "survivor_intake",
      );
      assert.deepEqual(
        {
          preferredName: recompletedIntake.body.profile.preferredName,
          deficits: recompletedIntake.body.profile.deficits,
          recoveryGoals: recompletedIntake.body.profile.recoveryGoals,
          goalDetails: recompletedIntake.body.profile.goalDetails,
          currentChallenges: recompletedIntake.body.profile.currentChallenges,
          customGoal: recompletedIntake.body.profile.customGoal,
          assessmentScores: recompletedIntake.body.profile.assessmentScores,
          assessmentNotes: recompletedIntake.body.profile.assessmentNotes,
          equipment: recompletedIntake.body.profile.equipment,
          mobilityAids: recompletedIntake.body.profile.mobilityAids,
          dailyTimeBudgetMinutes: recompletedIntake.body.profile.dailyTimeBudgetMinutes,
          energyPattern: recompletedIntake.body.profile.energyPattern,
          profileProvenance: {
            ...canonicalProfileBeforeIntakeReset.profileProvenance,
            intakeCompletedAt: recompletedIntake.body.profile.profileProvenance.intakeCompletedAt,
          },
        },
        {
          ...canonicalProfileBeforeIntakeReset,
          profileProvenance: {
            ...canonicalProfileBeforeIntakeReset.profileProvenance,
            intakeCompletedAt: recompletedIntake.body.profile.profileProvenance.intakeCompletedAt,
          },
        },
      );

      const todayWithProfile = await jsonRequest(
        baseUrl,
        "/api/recovery/today/recommendation",
        {},
        survivorCookie,
      );
      assert.equal(todayWithProfile.response.status, 200, JSON.stringify(todayWithProfile.body));
      assert.equal(todayWithProfile.body.personalization.applied, true);
      assert.deepEqual(todayWithProfile.body.personalization.goals, ["Speak with more confidence"]);
      assert.deepEqual(todayWithProfile.body.personalization.goalDetails, [{
        horizon: "long",
        domain: "speech",
        goal: "Speak with more confidence",
        status: "active",
      }]);
      assert.equal(todayWithProfile.body.personalization.startLevel, 1);

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

      const stateAfterAssessment = await jsonRequest(
        baseUrl,
        "/api/recovery/me/state",
        {},
        survivorCookie,
      );
      assert.equal(stateAfterAssessment.response.status, 200, JSON.stringify(stateAfterAssessment.body));
      assert.deepEqual(
        {
          physical: stateAfterAssessment.body.latestAssessment.physical,
          cognitive: stateAfterAssessment.body.latestAssessment.cognitive,
          speech: stateAfterAssessment.body.latestAssessment.speech,
          emotional: stateAfterAssessment.body.latestAssessment.emotional,
          memory: stateAfterAssessment.body.latestAssessment.memory,
          notes: stateAfterAssessment.body.latestAssessment.notes,
        },
        assessment,
      );
      assert.deepEqual(stateAfterAssessment.body.goals, [{
        id: -1,
        horizon: "long",
        domain: "speech",
        goal: "Speak with more confidence",
        status: "active",
      }]);

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
      // secret configured. Each request receives a deliberately different
      // unsafe model response so the route-level fallback is exercised.
      const originalFetch = globalThis.fetch;
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "recovery-funnel-test-key";
      const mockedGeminiDrafts = [
        JSON.stringify({ malformed: true }),
        JSON.stringify({
          exerciseSlugs: ["invented-route-exercise"],
          focusDomains: ["physical"],
        }),
        JSON.stringify({
          exerciseSlugs: ["invented-route-exercise"],
          focusDomains: ["physical"],
          dosage: { sets: 3, reps: 10 },
          mealTargets: { hydrationOz: 80 },
        }),
      ];
      let mockedGeminiCalls = 0;
      let concurrentPlanRequests = 0;
      let holdConcurrentPlanRequests = false;
      let releaseConcurrentPlanRequests!: () => void;
      const concurrentPlanRequestsReady = new Promise<void>((resolve) => {
        releaseConcurrentPlanRequests = resolve;
      });
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("generativelanguage.googleapis.com")) {
          const mockedDraft = mockedGeminiDrafts[Math.min(mockedGeminiCalls++, mockedGeminiDrafts.length - 1)];
          if (holdConcurrentPlanRequests) {
            concurrentPlanRequests += 1;
            if (concurrentPlanRequests === 2) {
              releaseConcurrentPlanRequests();
            }
            await concurrentPlanRequestsReady;
          }
          return new Response(
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: mockedDraft }] } }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
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
        // Their mocked Gemini replies are invented and prescription-shaped,
        // respectively; both must fall back to the same validated draft.
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
          assertSafeEducationPlan(result.body.plan);
        }
        assert.equal(mockedGeminiCalls, 3, "all malformed and unsafe Gemini fixtures were exercised");
        assert.deepEqual(concurrentPlans[0].body.plan, concurrentPlans[1].body.plan);
        assert.equal(
          concurrentPlans[0].body.generatedAt,
          concurrentPlans[1].body.generatedAt,
          "concurrent plan responses must share one generation timestamp",
        );
        for (const result of concurrentPlans) {
          assert.equal(typeof result.body.generatedAt, "string");
          assert.ok(!Number.isNaN(Date.parse(result.body.generatedAt)));
        }

        const persistedPlan = await db.execute(sql`
          SELECT plan, generated_at
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
        assert.equal(persistedPlan.rows.length, 1);
        const persistedPlanRow = persistedPlan.rows[0] as { plan: unknown; generated_at: string | Date };
        const storedPlan = persistedPlanRow.plan;
        assertSafeEducationPlan(storedPlan);
        assert.deepEqual(storedPlan, concurrentPlans[0].body.plan);
        assert.equal(
          new Date(persistedPlanRow.generated_at).toISOString(),
          new Date(concurrentPlans[0].body.generatedAt).toISOString(),
          "concurrent plan responses must share the persisted generation timestamp",
        );

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

        const retryPlans = await Promise.all([
          postRecovery(baseUrl, "/api/recovery/plan/generate", {}, survivorCookie),
          postRecovery(baseUrl, "/api/recovery/plan/generate", {}, survivorCookie),
        ]);
        for (const retry of retryPlans) {
          assertSafeEducationPlan(retry.plan);
        }
        assert.deepEqual(retryPlans[0].plan, storedPlan);
        assert.deepEqual(retryPlans[1].plan, storedPlan);
        assert.equal(retryPlans[0].generatedAt, concurrentPlans[0].body.generatedAt);
        assert.equal(retryPlans[1].generatedAt, concurrentPlans[0].body.generatedAt);
        assert.equal(mockedGeminiCalls, 3, "safe retries should reuse the validated education draft");

        // Exercise the rollout itself, not only the schema declaration. A
        // clean database should install the index, while legacy duplicates
        // should stop the migration without deleting or rewriting either
        // plan. The index is restored before the route coverage continues.
        const existingIndex = await pool.query(`
          SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
        `);
        const hadPlanAssessmentIndex = Boolean(
          (existingIndex as { rows?: Array<{ index_name: string | null }> }).rows?.[0]?.index_name,
        );
        const legacyAssessmentResult = await db.execute(sql`
          SELECT COALESCE(MAX(id), 0)::int + 100000 AS id
            FROM sasquatch_assessments
        `);
        const legacyAssessmentId = Number(
          (legacyAssessmentResult.rows[0] as { id: number | string }).id,
        );

        let legacyPlanIds: number[] = [];
        try {
          await pool.query('DROP INDEX IF EXISTS "survivor_plans_assessment_unique"');
          await pool.query(planMigration);
          const cleanIndex = await pool.query(`
            SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
          `);
          assert.ok(
            (cleanIndex as { rows?: Array<{ index_name: string | null }> }).rows?.[0]?.index_name,
            "clean recovery-plan migration did not create its unique index",
          );

          await pool.query('DROP INDEX IF EXISTS "survivor_plans_assessment_unique"');
          const insertedLegacyPlans = await db.insert(survivorPlans).values([
            {
              userId: survivorId,
              assessmentId: legacyAssessmentId,
              plan: { source: "legacy-first" },
            },
            {
              userId: survivorId,
              assessmentId: legacyAssessmentId,
              plan: { source: "legacy-second" },
            },
          ]).returning({ id: survivorPlans.id });
          legacyPlanIds = insertedLegacyPlans.map(({ id }) => id);

          await assert.rejects(
            () => pool.query(planMigration),
            (error: unknown) => {
              const databaseError = error as {
                message?: string;
                detail?: string;
                hint?: string;
              };
              const diagnostics = [
                databaseError.message,
                databaseError.detail,
                databaseError.hint,
              ]
                .filter(Boolean)
                .join(" ");
              assert.match(diagnostics, /legacy duplicate plans found/i);
              assert.match(diagnostics, new RegExp(String(legacyAssessmentId)));
              assert.match(diagnostics, /preserve every plan row/i);
              return true;
            },
          );

          const legacyRows = await db.execute(sql`
            SELECT assessment_id, plan
              FROM survivor_plans
             WHERE user_id = ${survivorId}
               AND assessment_id = ${legacyAssessmentId}
             ORDER BY id
          `);
          assert.equal(legacyRows.rows.length, 2);
          assert.deepEqual(
            legacyRows.rows.map((row) => (row as { plan: { source: string } }).plan.source),
            ["legacy-first", "legacy-second"],
          );
          const failedIndex = await pool.query(`
            SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
          `);
          assert.equal(
            (failedIndex as { rows?: Array<{ index_name: string | null }> }).rows?.[0]?.index_name ?? null,
            null,
            "legacy duplicate preflight should fail before creating the unique index",
          );

          // The reviewed remediation is deliberately non-destructive: keep
          // both plan rows, but unlink the duplicate association from one.
          await db.execute(sql`
            UPDATE survivor_plans
               SET assessment_id = NULL
             WHERE id = (
               SELECT MAX(id)
                 FROM survivor_plans
                WHERE user_id = ${survivorId}
                  AND assessment_id = ${legacyAssessmentId}
             )
          `);
          await pool.query(planMigration);
          const remediatedIndex = await pool.query(`
            SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
          `);
          assert.ok(
            (remediatedIndex as { rows?: Array<{ index_name: string | null }> }).rows?.[0]?.index_name,
            "reviewed legacy remediation should allow the unique index to be created",
          );
          const remediatedRows = await db.execute(sql`
            SELECT COUNT(*)::int AS total,
                   COUNT(assessment_id)::int AS linked
              FROM survivor_plans
             WHERE user_id = ${survivorId}
               AND id IN (${sql.join(legacyPlanIds.map((id) => sql`${id}`), sql`, `)})
          `);
          const remediatedRow = remediatedRows.rows[0] as {
            total: number | string;
            linked: number | string;
          };
          assert.deepEqual(
            {
              total: Number(remediatedRow.total),
              linked: Number(remediatedRow.linked),
            },
            { total: 2, linked: 1 },
          );
        } finally {
          if (legacyPlanIds.length > 0) {
            await db.delete(survivorPlans).where(inArray(survivorPlans.id, legacyPlanIds));
          }
          await pool.query('DROP INDEX IF EXISTS "survivor_plans_assessment_unique"');
          if (hadPlanAssessmentIndex) {
            await pool.query(planMigration);
          }
        }
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
      const cleanupFailures: string[] = [];
      const cleanupAccount = async (label: string, email: string, cookie: string) => {
        if (!baseUrl || !cookie) {
          cleanupFailures.push(`${label} account (authenticated session unavailable)`);
          return;
        }
        try {
          await cleanupDisposableAccount(baseUrl, email, cookie);
        } catch {
          cleanupFailures.push(`${label} account`);
        }
      };
      if (usersInserted) {
        await cleanupAccount("survivor", survivorEmail, survivorCookie);
        await cleanupAccount("admin", adminEmail, adminCookie);
      }

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
      if (cleanupFailures.length > 0) {
        throw new Error(`disposable account cleanup failed for ${cleanupFailures.join(" and ")}`);
      }
    }
  },
);