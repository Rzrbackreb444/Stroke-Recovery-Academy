/**
 * Authenticated integration coverage for the canonical survivor profile.
 *
 * The test uses the production login and route registration against a fresh
 * PostgreSQL cluster. Gemini is replaced with a local response so Coach and
 * plan generation can be exercised without an external AI call.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import express from "express";
import test from "node:test";
import { cleanupDisposableAccounts, loginWithSession, requestJson } from "./authenticatedTestHelpers";
import { createDisposablePostgres } from "./disposablePostgres";
import { applyMigrationFiles } from "./migrationRunner";

const integrationEnabled = process.env.SURVIVOR_PROFILE_DB === "1";
const migrationsDirectory = new URL("../migrations/", import.meta.url);
    const database = await createDisposablePostgres({ extensions: ["uuid-ossp", "vector"] });
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDriverFlag = process.env.RECOVERY_DURABILITY_DB;
    const originalIssuerUrl = process.env.ISSUER_URL;
    const originalReplId = process.env.REPL_ID;
    const originalSessionSecret = process.env.SESSION_SECRET;
    const originalGeminiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const originalGeminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
    const originalGeminiFallbackKey = process.env.GEMINI_API_KEY;
    const activeIntervals: ReturnType<typeof setInterval>[] = [];
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];
    const originalSetInterval = globalThis.setInterval;
    const originalSetTimeout = globalThis.setTimeout;
    const originalFetch = globalThis.fetch;
    let appServer: Server | undefined;
    let coachRequest: any = null;

    const survivorId = `canonical-profile-${randomUUID()}`;
    const email = `${survivorId}@example.test`;
    const password = "canonical-profile-test-password";
    const issuer = "https://canonical-profile-test.invalid";
    const aiBaseUrl = "https://canonical-profile-ai.test";
    const legacyTakenAt = new Date("2024-01-02T03:04:05.000Z");
    const legacyGoalCreatedAt = new Date("2024-01-03T04:05:06.000Z");

    try {
      process.env.DATABASE_URL = database.url;
      process.env.RECOVERY_DURABILITY_DB = "1";
      process.env.ISSUER_URL = issuer;
      process.env.REPL_ID = "canonical-profile-test-client";
      process.env.SESSION_SECRET = "canonical-profile-test-session-secret";
      process.env.AI_INTEGRATIONS_GEMINI_API_KEY = "local-test-key";
      process.env.AI_INTEGRATIONS_GEMINI_BASE_URL = aiBaseUrl;
      delete process.env.GEMINI_API_KEY;

      const [{ db }, { hashPassword }, { users, sasquatchAssessments, survivorGoals }] =
        await Promise.all([
          import("../server/db"),
          import("../server/multiProviderAuth"),
          import("../shared/schema"),
        ]);
      await applyMigrationFiles(database.pool, migrationsDirectory);
      const canonicalColumns = await database.pool.query<{ column_name: string }>(`
        SELECT column_name
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'user_profiles'
           AND column_name IN ('goal_details', 'assessment_scores', 'assessment_notes', 'profile_provenance')
         ORDER BY column_name
      `);
      assert.deepEqual(
        canonicalColumns.rows.map((row) => row.column_name),
        ["assessment_notes", "assessment_scores", "goal_details", "profile_provenance"],
        "release verification failed: 0014_canonical_survivor_profile.sql must be applied before the authenticated profile smoke check",
      );

      await db.insert(users).values({
        id: survivorId,
        email,
        passwordHash: hashPassword(password),
        authProvider: "local",
        role: "member",
      });
      const [legacyAssessment] = await db.insert(sasquatchAssessments).values({
        userId: survivorId,
        physical: 8,
        cognitive: 7,
        speech: 6,
        emotional: 5,
        memory: 4,
        notes: "Legacy intake note must remain in assessment history.",
        takenAt: legacyTakenAt,
      }).returning();
      await db.insert(survivorGoals).values({
        userId: survivorId,
        horizon: "short",
        domain: "physical",
        goal: "Legacy walking goal",
        status: "active",
        createdAt: legacyGoalCreatedAt,
      });

      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.startsWith("http://127.0.0.1:")) {
          return originalFetch(input, init);
        }
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
        if (url.startsWith(aiBaseUrl)) {
          const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
          coachRequest = body;
          return new Response(
            JSON.stringify({
              candidates: [{
                content: {
                  parts: [{ text: "I see your corrected recovery focus. One safe next step at a time." }],
                },
              }],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.startsWith("https://generativelanguage.googleapis.com/")) {
          return new Response(
            JSON.stringify({
              candidates: [{
                content: {
                  parts: [{ text: JSON.stringify({
                    exerciseSlugs: ["not-in-catalog"],
                    focusDomains: ["physical"],
                  }) }],
                },
              }],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.startsWith("https://connectors.replit.com/")) {
          return new Response("{}", { status: 404 });
        }
        throw new Error(`Unexpected external request in canonical profile test: ${url}`);
      }) as typeof fetch;

      globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
        const handle = originalSetTimeout(...args);
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
      globalThis.setInterval = originalSetInterval;
      globalThis.setTimeout = originalSetTimeout;

      const address = await new Promise<import("node:net").AddressInfo>((resolve, reject) => {
        const server = appServer!;
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve(server.address() as import("node:net").AddressInfo));
      });
    let baseUrl = "";
    let cookie = "";

    let userInserted = false;
      const normalized = await requestJson(baseUrl, "/api/survivor/profile", {}, cookie);
      assert.equal(normalized.response.status, 200, JSON.stringify(normalized.body));
      assert.deepEqual(normalized.body.profile.assessmentScores, {
        physical: 8,
        cognitive: 7,
        speech: 6,
        emotional: 5,
        memory: 4,
      });
      assert.deepEqual(normalized.body.profile.recoveryGoals, ["Legacy walking goal"]);
      assert.equal(
        normalized.body.profile.profileProvenance.assessmentScores.source,
        "legacy_sasquatch_assessment",
      );
      assert.equal(
        normalized.body.profile.profileProvenance.assessmentScores.updatedAt,
        legacyTakenAt.toISOString(),
      );
      assert.equal(
        normalized.body.profile.profileProvenance.goalDetails.source,
        "legacy_survivor_goal",
      );
      assert.equal(
        normalized.body.profile.profileProvenance.goalDetails.updatedAt,
        legacyGoalCreatedAt.toISOString(),
      );

      const legacyRows = await database.pool.query<{
        assessment_count: string;
        goal_count: string;
        notes: string;
      }>(
        `SELECT
           (SELECT COUNT(*)::text FROM sasquatch_assessments WHERE user_id = $1) AS assessment_count,
           (SELECT COUNT(*)::text FROM survivor_goals WHERE user_id = $1) AS goal_count,
           (SELECT notes FROM sasquatch_assessments WHERE id = $2) AS notes`,
        [survivorId, legacyAssessment.id],
      );
      assert.deepEqual(legacyRows.rows[0], {
        assessment_count: "1",
        goal_count: "1",
        notes: "Legacy intake note must remain in assessment history.",
      });

      const correctionStartedAt = Date.now();
      const correction = await requestJson(baseUrl, "/api/survivor/profile", {
        method: "PATCH",
        body: JSON.stringify({
          profileSource: "survivor_profile_settings",
          preferredName: "Jordan",
          recoveryGoals: ["Walk safely to the kitchen"],
          deficits: { motor: 3, fatigue: 4 },
          assessmentScores: {
            physical: 1,
            cognitive: 2,
            speech: 3,
            emotional: 4,
            memory: 5,
          },
          assessmentNotes: "Jordan's corrected priorities.",
          dailyTimeBudgetMinutes: 15,
          energyPattern: "afternoon",
          equipment: ["counter"],
        }),
      }, cookie);
      assert.equal(correction.response.status, 200, JSON.stringify(correction.body));
      assert.equal(correction.body.profile.preferredName, "Jordan");
      assert.deepEqual(correction.body.profile.recoveryGoals, ["Walk safely to the kitchen"]);
      assert.equal(correction.body.profile.profileProvenance.preferredName.source, "survivor_profile_settings");
      assert.equal(correction.body.profile.profileProvenance.assessmentScores.source, "survivor_profile_settings");
      assert.ok(
        Date.parse(correction.body.profile.profileProvenance.preferredName.updatedAt) >= correctionStartedAt,
        "profile correction provenance timestamp did not advance",
      );
      assert.ok(
        Date.parse(correction.body.profile.updatedAt) >= correctionStartedAt,
        "canonical profile updatedAt did not advance",
      );
      const preservedLegacyGoal = await database.pool.query<{ goal: string }>(
        "SELECT goal FROM survivor_goals WHERE user_id = $1 ORDER BY created_at DESC",
        [survivorId],
      );
      assert.deepEqual(
        preservedLegacyGoal.rows.map((row) => row.goal),
        ["Legacy walking goal"],
      );

      const coach = await requestJson(baseUrl, "/api/coach/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What should I keep in mind today?",
          history: [],
          skipAudio: true,
        }),
      }, cookie);
      assert.equal(coach.response.status, 200, JSON.stringify(coach.body));
      assert.match(coach.body.response, /corrected recovery focus/i);
      const coachPrompt = JSON.stringify(coachRequest);
      assert.match(coachPrompt, /Jordan/);
      assert.match(coachPrompt, /Walk safely to the kitchen/);
      assert.match(coachPrompt, /15 minutes/);

      const today = await requestJson(baseUrl, "/api/recovery/today/recommendation", {}, cookie);
      assert.equal(today.response.status, 200, JSON.stringify(today.body));
      assert.equal(today.body.personalization.applied, true);
      assert.equal(today.body.personalization.startLevel, 1);
      assert.equal(today.body.personalization.timeBudgetMinutes, 15);
      assert.equal(today.body.personalization.energyPattern, "afternoon");
      assert.deepEqual(today.body.personalization.goals, ["Walk safely to the kitchen"]);

      const journey = await requestJson(baseUrl, "/api/recovery/journey", {}, cookie);
      assert.equal(journey.response.status, 200, JSON.stringify(journey.body));
      assert.equal(journey.body.profile.preferredName, "Jordan");
      assert.deepEqual(journey.body.profile.recoveryGoals, ["Walk safely to the kitchen"]);
      assert.deepEqual(journey.body.profile.assessmentScores, {
        physical: 1,
        cognitive: 2,
        speech: 3,
        emotional: 4,
        memory: 5,
      });
      assert.equal(journey.body.profile.profileProvenance.assessmentScores.source, "survivor_profile_settings");

      const generated = await requestJson(baseUrl, "/api/recovery/plan/generate", {
        method: "POST",
        body: JSON.stringify({}),
      }, cookie);
      assert.equal(generated.response.status, 200, JSON.stringify(generated.body));
      assert.deepEqual(generated.body.plan.focusDomains, ["physical", "cognitive", "speech"]);

      const state = await requestJson(baseUrl, "/api/recovery/me/state", {}, cookie);

      const cleanupFailures = userInserted
        ? await cleanupDisposableAccounts(baseUrl, [{ label: "survivor", email, cookie }])
        : [];
      const importedDb = await import("../server/db").catch(() => undefined);
      await importedDb?.pool?.end?.().catch(() => undefined);
      await database.stop();
      if (cleanupFailures.length > 0) {
        throw new Error(`disposable account cleanup failed for ${cleanupFailures.join(" and ")}`);
      }
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
      if (originalGeminiKey === undefined) delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
      else process.env.AI_INTEGRATIONS_GEMINI_API_KEY = originalGeminiKey;
      if (originalGeminiBaseUrl === undefined) delete process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
      else process.env.AI_INTEGRATIONS_GEMINI_BASE_URL = originalGeminiBaseUrl;
      if (originalGeminiFallbackKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = originalGeminiFallbackKey;
    }
  },
);
