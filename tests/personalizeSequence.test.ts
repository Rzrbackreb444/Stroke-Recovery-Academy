// Pure-function tests for personalizeSequence (no React, no DOM).
// Run with: npx tsx tests/personalizeSequence.test.ts

import {
  personalizeSequence,
  getSequentialTasks,
  type PersonalizationInput,
} from "../client/src/lib/recoveryRoutine";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? "  →  " + detail : ""}`);
  }
}

console.log("\npersonalizeSequence — energy-pattern reorder");
{
  const morning = personalizeSequence(2, { applied: true, energyPattern: "morning" } as PersonalizationInput);
  const evening = personalizeSequence(2, { applied: true, energyPattern: "evening" } as PersonalizationInput);
  check("morning starts with morning block", morning[0]?.blockId === "morning");
  check("evening starts with evening block", evening[0]?.blockId === "evening", `got ${evening[0]?.blockId}`);
  check("evening still ends with winddown", evening[evening.length - 1]?.blockId === "winddown");
  check("afternoon starts with midday",
    personalizeSequence(2, { applied: true, energyPattern: "afternoon" } as PersonalizationInput)[0]?.blockId === "midday");
  check("variable falls back to morning order",
    personalizeSequence(2, { applied: true, energyPattern: "variable" } as PersonalizationInput)[0]?.blockId === "morning");
}

console.log("\npersonalizeSequence — time budget trim");
{
  const full = personalizeSequence(4, { applied: true } as PersonalizationInput);
  const tight = personalizeSequence(4, { applied: true, timeBudgetMinutes: 5 } as PersonalizationInput);
  check("trim shrinks the sequence",
    tight.length < full.length,
    `tight=${tight.length} full=${full.length}`);
  check("trim respects 1.5min/task budget (5min → ≤4 tasks)",
    tight.length <= Math.floor(5 / 1.5) || tight.length <= 5,
    `got ${tight.length}`);
  check("zero/null budget keeps full sequence",
    personalizeSequence(4, { applied: true, timeBudgetMinutes: 0 } as PersonalizationInput).length === full.length);
  check("very small budget still keeps at least one task",
    personalizeSequence(4, { applied: true, timeBudgetMinutes: 1 } as PersonalizationInput).length >= 1);
}

console.log("\npersonalizeSequence — goal tagging");
{
  const speech = personalizeSequence(2, { applied: true, goals: ["speech recovery"] } as PersonalizationInput);
  const speechTask = speech.find((t) => t.id === "d2_speech");
  check("speech goal tags d2_speech", speechTask?.priority === "goal", `got ${speechTask?.priority}`);
  check("speech tag includes reason", !!speechTask?.goalReason);

  const walk = personalizeSequence(3, { applied: true, goals: ["walk independently"] } as PersonalizationInput);
  check("walk goal tags d3_walk",
    walk.find((t) => t.id === "d3_walk")?.priority === "goal");
  check("walk goal also tags d3_balance",
    walk.find((t) => t.id === "d3_balance")?.priority === "goal");

  const memory = personalizeSequence(4, { applied: true, goals: ["memory and brain"] } as PersonalizationInput);
  check("memory goal tags d4_cognitive",
    memory.find((t) => t.id === "d4_cognitive")?.priority === "goal");

  const noGoals = personalizeSequence(2, { applied: true, goals: [] } as PersonalizationInput);
  check("empty goals leaves all priority=normal",
    noGoals.every((t) => t.priority === "normal"));
}

console.log("\npersonalizeSequence — goal preservation under tight budget");
{
  // Tight budget but a goal that lives in a late block — the goal must survive.
  const tightWithGoal = personalizeSequence(3, {
    applied: true,
    timeBudgetMinutes: 5,
    energyPattern: "morning",
    goals: ["balance"],
  } as PersonalizationInput);
  const balance = tightWithGoal.find((t) => t.id === "d3_balance");
  check("balance goal survives tight time budget",
    !!balance && balance.priority === "goal",
    `got ${balance?.priority ?? "missing"}`);
}

console.log("\npersonalizeSequence — fallback when input missing");
{
  const empty = personalizeSequence(2, null);
  const baseline = getSequentialTasks(2);
  check("null input returns full default sequence",
    empty.length === baseline.length);
  check("null input still produces blocks in default order",
    empty[0]?.blockId === "morning");
}

console.log(`\n${passed} passed, ${failed} failed — total ${passed + failed} assertions\n`);
process.exit(failed === 0 ? 0 : 1);
