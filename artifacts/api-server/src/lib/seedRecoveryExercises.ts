import { db } from "../db";
import { recoveryExercises } from "@workspace/db";
import { sql } from "drizzle-orm";
import { RECOVERY_EXERCISE_SEED } from "../data/recoveryExercises";

let didRun = false;

export async function seedRecoveryExercises(): Promise<{ inserted: number; total: number }> {
  if (didRun) {
    const [{ count }] = (await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM recovery_exercises`,
    )).rows as any[];
    return { inserted: 0, total: Number(count) };
  }
  didRun = true;

  let inserted = 0;
  for (const ex of RECOVERY_EXERCISE_SEED) {
    const r = await db
      .insert(recoveryExercises)
      .values(ex)
      .onConflictDoUpdate({
        target: recoveryExercises.slug,
        set: {
          name: ex.name,
          category: ex.category,
          position: ex.position,
          level: ex.level,
          domain: ex.domain ?? "physical",
          targets: ex.targets ?? [],
          description: ex.description,
          beginnerSets: ex.beginnerSets ?? null,
          beginnerReps: ex.beginnerReps ?? null,
          beginnerHoldSec: ex.beginnerHoldSec ?? null,
          moderateSets: ex.moderateSets ?? null,
          moderateReps: ex.moderateReps ?? null,
          moderateHoldSec: ex.moderateHoldSec ?? null,
          advancedSets: ex.advancedSets ?? null,
          advancedReps: ex.advancedReps ?? null,
          advancedHoldSec: ex.advancedHoldSec ?? null,
          safetyNotes: ex.safetyNotes ?? null,
          progressionRule: ex.progressionRule ?? null,
          saschPhase: ex.saschPhase ?? null,
          videoUrl: ex.videoUrl ?? null,
          sortOrder: ex.sortOrder ?? 100,
        },
      })
      .returning({ id: recoveryExercises.id });
    if (r.length) inserted++;
  }

  const [{ count }] = (await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM recovery_exercises`,
  )).rows as any[];
  return { inserted, total: Number(count) };
}
