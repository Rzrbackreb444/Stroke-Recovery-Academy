/**
 * Route-level contracts for recovery education draft reviews.
 *
 * These checks intentionally run without a database. The review lifecycle is
 * easy to regress while editing the large routes module, so keep the
 * authorization, audit, survivor-state, and regeneration guarantees close to
 * the route source as a fast guardrail.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = await readFile(new URL("../server/routes.ts", import.meta.url), "utf8");
const schema = await readFile(new URL("../shared/schema.ts", import.meta.url), "utf8");
const migration = await readFile(
  new URL("../migrations/0015_recovery_plan_reviews.sql", import.meta.url),
  "utf8",
);

function reviewRoute(): string {
  const start = routes.indexOf("app.post('/api/recovery/plan/:id/review'");
  const end = routes.indexOf("app.post('/api/recovery/plan/generate'", start);
  assert.ok(start >= 0 && end > start, "recovery review route must be present");
  return routes.slice(start, end);
}

function stateRoute(): string {
  const start = routes.indexOf("app.get('/api/recovery/me/state'");
  const end = routes.indexOf("app.get('/api/recovery/routine/today'", start);
  assert.ok(start >= 0 && end > start, "recovery state route must be present");
  return routes.slice(start, end);
}

function generateRoute(): string {
  const start = routes.indexOf("app.post('/api/recovery/plan/generate'");
  const end = routes.indexOf("// ─────────────────────────────────────────────────────────────────", start);
  assert.ok(start >= 0 && end > start, "recovery generation route must be present");
  return routes.slice(start, end);
}

test("only verified clinicians and admins can record every review decision", () => {
  const route = reviewRoute();
  assert.match(route, new RegExp("app\\.post\\('/api/recovery/plan/:id/review', isAuthenticated"));
  assert.match(route, /actor\?\.role === 'admin'/);
  assert.match(route, /actor\?\.isVerifiedTherapist/);
  assert.match(route, /const validStatuses = new Set\(\['approved', 'rejected', 'changes_requested'\]\)/);
  assert.match(route, /if \(!actorType\) \{\s+return res\.status\(403\)/);
  assert.match(route, /reviewedBy: actorId/);
  assert.match(route, /actorId,\s+actorType,\s+status/);
});

test("review routes reject malformed IDs, notes, and legacy or unsafe plans", () => {
  const route = reviewRoute();
  assert.match(route, /!Number\.isSafeInteger\(planId\) \|\| planId <= 0/);
  assert.match(route, /Review notes must be 2,000 characters or fewer/);
  assert.match(route, /if \(!isSafeRecoveryPlan\(planRow\.plan\)\) \{\s+return res\.status\(400\)/);
  assert.match(route, /Only a safe recovery education draft can be reviewed/);
  assert.match(schema, /planType: z\.literal\("education_and_clinician_review"\)/);
  assert.match(schema, /planVersion: z\.literal\(2\)/);
});

test("survivor state exposes the current reviewer and newest-first audit history", () => {
  const route = stateRoute();
  assert.match(route, /reviewedBy: latestPlan\.reviewedBy/);
  assert.match(route, /actorId: recoveryPlanReviews\.actorId/);
  assert.match(route, /orderBy\(desc\(recoveryPlanReviews\.createdAt\), desc\(recoveryPlanReviews\.id\)\)/);
  assert.match(route, /history: reviewHistory/);
  assert.match(route, /status: latestPlan\.reviewStatus/);
});

test("regenerating a changed draft resets review metadata without deleting audit rows", () => {
  const route = generateRoute();
  const reset = /reviewStatus: 'pending',\s+reviewedBy: null,\s+reviewedAt: null,\s+reviewNotes: null/;
  assert.match(route, reset);
  assert.match(route, /onConflictDoNothing\([\s\S]*target: survivorPlans\.assessmentId/);
  assert.match(route, /\.update\(survivorPlans\)[\s\S]*\.set\(\{[\s\S]*reviewStatus: 'pending'/);
  assert.doesNotMatch(route, /delete\(recoveryPlanReviews\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "recovery_plan_reviews"/);
  assert.match(migration, /FOREIGN KEY \("plan_id"\) REFERENCES "survivor_plans"\("id"\) ON DELETE cascade/);
});