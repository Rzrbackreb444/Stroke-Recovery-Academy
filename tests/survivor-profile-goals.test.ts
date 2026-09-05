import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { synchronizeGoalDetails } from "../server/survivorProfileService";

test("profile goal text edits preserve the selected structure and existing status", () => {
  const result = synchronizeGoalDetails(
    ["Speak with more confidence"],
    [{
      horizon: "long",
      domain: "speech",
      goal: "Speak with confidence",
    }],
    [{
      horizon: "long",
      domain: "speech",
      goal: "Speak with confidence",
      status: "paused",
    }],
  );

  assert.deepEqual(result, {
    recoveryGoals: ["Speak with more confidence"],
    goalDetails: [{
      horizon: "long",
      domain: "speech",
      goal: "Speak with more confidence",
      status: "paused",
    }],
  });
});

test("Today and Coach consume canonical structured goal metadata", async () => {
  const [routes, gemini] = await Promise.all([
    readFile(new URL("../server/routes.ts", import.meta.url), "utf8"),
    readFile(new URL("../server/geminiService.ts", import.meta.url), "utf8"),
  ]);

  assert.match(routes, /goalDetails: profile\?\.goalDetails \?\? \[\]/);
  assert.match(routes, /personalization: \{[\s\S]*goalDetails: Array/);
  assert.match(gemini, /Structured survivor goals \(horizon\/recovery area\/status\)/);
  assert.match(routes, /goalDetails: survivorProfile\.goalDetails \?\? \[\]/);
});

test("regenerated recovery plans advance generatedAt after goal provenance changes", async () => {
  const routes = await readFile(new URL("../server/routes.ts", import.meta.url), "utf8");
  assert.match(
    routes,
    /\.set\(\{\s*plan,\s*generatedAt: new Date\(\),\s*reviewStatus: 'pending'/,
  );
  assert.match(routes, /const goalsUpdatedAt = profile\.profileProvenance\?\.goalDetails\?\.updatedAt/);
});