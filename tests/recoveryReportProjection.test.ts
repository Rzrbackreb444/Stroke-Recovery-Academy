/**
 * tests/recoveryReportProjection.test.ts — guards the core privacy guarantee
 * of the Shareable Recovery Report: the public share projection exposes ONLY
 * display data. Never flicker free-text (`moment`), never medical/celebration
 * notes, never identifiers. A regression here is a PHI-adjacent leak on an
 * unauthenticated surface.
 *
 * Strategy:
 *   - Seed a throwaway user in the real dev DB with a unique per-run CANARY
 *     string planted in EVERY free-text column the report queries touch
 *     (flicker moment/notes/activity/emotions, checkin wins/challenges/
 *     gratitude, vitals notes, assessment notes, never-zero notes, milestone
 *     celebration notes) plus the user's email/name.
 *   - Build the owner report, then the public projection.
 *   - Assert the serialized public projection contains neither the canary
 *     nor the user id nor any forbidden key name — this catches BOTH a
 *     regression in `toPublicProjection` and a future query change in
 *     `buildOwnerReport` that starts SELECTing a free-text column into a
 *     field the projection doesn't know to strip.
 *   - Assert the owner report DOES retain `moment` (the feature depends on it).
 *
 * Runnable with: `tsx tests/recoveryReportProjection.test.ts`
 * (mirrors tests/safeJsonLd.test.ts / tests/stripeWebhook.test.ts style —
 * no vitest; non-zero exit code on any failure; cleanup in finally{}).
 */

import { randomUUID } from "node:crypto";
import { pool } from "../server/db";
import {
  buildOwnerReport,
  toPublicProjection,
} from "../server/services/recoveryReport/recoveryReportService";

// ── tiny test harness ──────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: any, msg: string) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    failed++;
    failures.push(msg);
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  }
}

/** Recursively collect every object key present anywhere in a value. */
function collectKeys(value: any, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      collectKeys(v, out);
    }
  }
  return out;
}

async function main() {
  const runId = randomUUID();
  const userId = `test-report-${runId}`;
  // Unique per-run secret planted in every free-text field we seed. If this
  // string ever appears in the public projection, private prose is leaking.
  const CANARY = `CANARY-PRIVATE-${runId}`;

  try {
    // ── seed ───────────────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO users (id, email, first_name, last_name)
       VALUES ($1, $2, $3, $4)`,
      [userId, `${userId}@example.test`, CANARY, CANARY],
    );
    await pool.query(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_active_days)
       VALUES ($1, 3, 9, 21)`,
      [userId],
    );
    await pool.query(
      `INSERT INTO never_zero_logs (user_id, action, reps, notes, created_at)
       VALUES ($1, $2, 15, $2, NOW() - INTERVAL '2 days'),
              ($1, $2, 25, $2, NOW() - INTERVAL '1 day')`,
      [userId, CANARY],
    );
    await pool.query(
      `INSERT INTO sasquatch_assessments (user_id, physical, cognitive, speech, emotional, memory, notes, taken_at)
       VALUES ($1, 4, 5, 6, 5, 4, $2, NOW() - INTERVAL '10 days'),
              ($1, 5, 6, 6, 6, 5, $2, NOW() - INTERVAL '1 day')`,
      [userId, CANARY],
    );
    await pool.query(
      `INSERT INTO daily_checkins (user_id, checkin_date, mood_score, energy_score, wins_today, challenges_today, gratitude)
       VALUES ($1, NOW() - INTERVAL '2 days', 7, 6, $2, $2, $2),
              ($1, NOW() - INTERVAL '1 day', 8, 7, $2, $2, $2)`,
      [userId, CANARY],
    );
    await pool.query(
      `INSERT INTO flicker_logs (user_id, moment, body_part, intensity, emotion_before, emotion_after, activity, is_breakthrough, notes, created_at)
       VALUES ($1, $2, 'affected_hand', 3, $2, $2, $2, false, $2, NOW() - INTERVAL '5 days'),
              ($1, $2, 'speech', 4, $2, $2, $2, true, $2, NOW() - INTERVAL '2 days')`,
      [userId, CANARY],
    );
    await pool.query(
      `INSERT INTO vitals_logs (user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, notes, measured_at)
       VALUES ($1, 128, 82, 71, $2, NOW() - INTERVAL '3 days')`,
      [userId, CANARY],
    );
    const milestoneRes = await pool.query(
      `INSERT INTO recovery_milestones (name, category)
       VALUES ($1, 'movement') RETURNING id`,
      [`Test milestone ${runId}`],
    );
    const milestoneId = milestoneRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_milestone_logs (user_id, milestone_id, celebration_notes, achieved_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '4 days')`,
      [userId, milestoneId, CANARY],
    );

    // ── exercise ───────────────────────────────────────────────────────────
    const owner = await buildOwnerReport(userId);
    const pub = toPublicProjection(owner);
    const pubJson = JSON.stringify(pub);

    // ── owner report retains what the survivor needs ───────────────────────
    assert(owner.hasData === true, "owner report has data after seeding");
    assert(owner.flickers.length === 2, "owner report includes both flicker logs");
    assert(
      owner.flickers.every((f) => f.moment === CANARY),
      "owner report retains flicker `moment` free-text",
    );
    assert(owner.vitals.length === 1, "owner report includes vitals point");
    assert(owner.milestones.length === 1, "owner report includes milestone");
    assert(owner.moodEnergy.length === 2, "owner report includes checkin mood/energy days");
    assert(owner.summary.breakthroughCount === 1, "owner summary counts the breakthrough");

    // ── public projection: no free-text, no identifiers ────────────────────
    assert(
      !pubJson.includes(CANARY),
      "public projection contains NO seeded private free-text (canary string absent)",
    );
    assert(
      !pubJson.includes(userId),
      "public projection contains NO user id",
    );
    assert(
      !pubJson.includes("@example.test"),
      "public projection contains NO email",
    );

    const pubKeys = collectKeys(pub);
    const forbiddenKeys = [
      "moment",
      "notes",
      "celebrationNotes",
      "celebration_notes",
      "winsToday",
      "wins_today",
      "challengesToday",
      "challenges_today",
      "gratitude",
      "activity",
      "emotionBefore",
      "emotionAfter",
      "emotion_before",
      "emotion_after",
      "userId",
      "user_id",
      "email",
      "firstName",
      "lastName",
    ];
    for (const key of forbiddenKeys) {
      assert(!pubKeys.has(key), `public projection has no "${key}" key anywhere`);
    }

    // Public flicker points expose exactly the display fields — nothing more.
    for (const f of pub.flickers) {
      const keys = Object.keys(f).sort().join(",");
      assert(
        keys === "bodyPart,date,intensity,isBreakthrough",
        `public flicker point has exactly display keys (got: ${keys})`,
      );
    }

    // Safe display data still flows through (the share page isn't blank).
    assert(pub.flickers.length === 2, "public projection keeps flicker trend points");
    assert(pub.flickers.some((f) => f.isBreakthrough), "public projection keeps breakthrough flag");
    assert(pub.vitals.length === 1 && pub.vitals[0].systolic === 128, "public projection keeps vitals numbers");
    assert(
      pub.milestones.length === 1 && pub.milestones[0].name === `Test milestone ${runId}`,
      "public projection keeps milestone display name",
    );
    assert(pub.summary.totalReps === 40, "public projection keeps aggregate rep count");
  } finally {
    // ── cleanup (user cascade removes child rows; milestones table has no FK cascade from user) ──
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]).catch(() => {});
    await pool
      .query(`DELETE FROM recovery_milestones WHERE name = $1`, [`Test milestone ${runId}`])
      .catch(() => {});
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const f of failures) console.error(`  FAILED: ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Test run crashed:", e);
  process.exit(1);
});
