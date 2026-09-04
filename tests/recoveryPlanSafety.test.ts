import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSafeRecoveryPlan,
  isSafeRecoveryPlan,
  parseAiRecoveryPlanDraft,
  RecoveryPlanValidationError,
} from "../server/recoveryPlanSafety";

const catalog = [
  {
    id: 1,
    slug: "gentle-rocking",
    name: "Gentle Rocking",
    domain: "physical",
    category: "spasticity",
    position: "seated",
    level: "beginner",
    description: "A gentle catalog activity for seated movement awareness.",
    safetyNotes: "Stop if you feel pain, dizziness, or new symptoms.",
  },
  {
    id: 2,
    slug: "seated-marches",
    name: "Seated Marches",
    domain: "physical",
    category: "lower",
    position: "seated",
    level: "beginner",
    description: "A seated catalog activity for lower-body movement awareness.",
    safetyNotes: "Use a stable chair and stop if you feel unsafe.",
  },
] as const;

test("slug-only AI drafts become safe education plans from catalog content", () => {
  const draft = parseAiRecoveryPlanDraft({
    exerciseSlugs: ["gentle-rocking", "seated-marches"],
    focusDomains: ["physical"],
  });
  const plan = buildSafeRecoveryPlan({
    catalog: [...catalog],
    exerciseSlugs: draft.exerciseSlugs,
    focusDomains: draft.focusDomains,
  });

  assert.equal(plan.planType, "education_and_clinician_review");
  assert.equal(plan.exercises[0].name, "Gentle Rocking");
  assert.equal(plan.exercises[0].safetyNotes, catalog[0].safetyNotes);
  assert.equal(plan.exercises[0].clinicianReviewRequired, true);
  assert.ok(!("sets" in plan.exercises[0]));
  assert.ok(!("reps" in plan.exercises[0]));
  assert.ok(!("holdSec" in plan.exercises[0]));
  assert.ok(!("mealTargets" in plan));
  assert.ok(!("brainGymMinutes" in plan));
  assert.equal(isSafeRecoveryPlan(plan), true);
});

test("malformed model responses are rejected instead of being partially trusted", () => {
  assert.throws(
    () => parseAiRecoveryPlanDraft(null),
    (error: unknown) => error instanceof RecoveryPlanValidationError,
  );
  assert.throws(
    () => parseAiRecoveryPlanDraft({
      exerciseSlugs: ["gentle-rocking"],
      focusDomains: ["physical"],
      summary: "free-form model text",
    }),
    /slug-only schema|unsafe fields/i,
  );
});

test("invented exercises are rejected before a plan can be built", () => {
  assert.throws(
    () => buildSafeRecoveryPlan({
      catalog: [...catalog],
      exerciseSlugs: ["invented-stroke-exercise"],
      focusDomains: ["physical"],
    }),
    /outside the approved catalog/i,
  );
});

test("unsafe dosage and nutrition fields are rejected deterministically", () => {
  assert.throws(
    () => parseAiRecoveryPlanDraft({
      exerciseSlugs: ["gentle-rocking"],
      focusDomains: ["physical"],
      sets: 3,
    }),
    /unsafe fields/i,
  );
  assert.throws(
    () => parseAiRecoveryPlanDraft({
      exerciseSlugs: ["gentle-rocking"],
      focusDomains: ["physical"],
      mealTargets: { hydrationOz: 80 },
    }),
    /unsafe fields/i,
  );
  assert.equal(
    isSafeRecoveryPlan({
      planVersion: 2,
      planType: "education_and_clinician_review",
      summary: "unsafe",
      focusDomains: ["physical"],
      exercises: [],
      education: {
        brainGym: "education",
        nutrition: ["education"],
      },
      weeklyReflection: {
        Mon: "x", Tue: "x", Wed: "x", Thu: "x", Fri: "x", Sat: "x", Sun: "x",
      },
      tips: ["x"],
      safetyNote: "x",
      mealTargets: { hydrationOz: 80 },
    }),
    false,
  );
});

test("catalog entries without explicit safety notes cannot be selected", () => {
  assert.throws(
    () => buildSafeRecoveryPlan({
      catalog: [{
        ...catalog[0],
        safetyNotes: null,
      }],
      exerciseSlugs: ["gentle-rocking"],
      focusDomains: ["physical"],
    }),
    /missing safety notes/i,
  );
});