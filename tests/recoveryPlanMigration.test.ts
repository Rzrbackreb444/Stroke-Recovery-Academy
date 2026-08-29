import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createDisposablePostgres } from "./disposablePostgres";

const migration = await readFile(
  new URL("../migrations/0011_recovery_plan_assessment_unique.sql", import.meta.url),
  "utf8",
);

const integrationEnabled = process.env.RECOVERY_PLAN_MIGRATION_DB === "1";

if (integrationEnabled) {
  test("recovery-plan uniqueness migration is safe for clean and legacy data", { timeout: 30_000 }, async () => {
    const database = await createDisposablePostgres();
    try {
      await database.pool.query(`
        CREATE TABLE survivor_plans (
          id serial PRIMARY KEY,
          user_id varchar NOT NULL,
          assessment_id integer,
          plan jsonb NOT NULL,
          generated_at timestamp NOT NULL DEFAULT now()
        )
      `);

      await database.pool.query(`
        INSERT INTO survivor_plans (user_id, assessment_id, plan)
        VALUES ('clean-survivor', 1001, '{"source":"clean"}')
      `);
      await database.pool.query(migration);
      const cleanIndex = await database.pool.query(`
        SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
      `);
      assert.equal(cleanIndex.rows[0].index_name, "survivor_plans_assessment_unique");

      // Remove only the test-created index so the duplicate preflight is
      // exercised rather than short-circuited by IF NOT EXISTS.
      await database.pool.query('DROP INDEX "survivor_plans_assessment_unique"');
      const duplicateAssessmentId = 2002;
      await database.pool.query(
        `
          INSERT INTO survivor_plans (user_id, assessment_id, plan)
          VALUES
            ('legacy-survivor', $1, '{"source":"legacy-first"}'),
            ('legacy-survivor', $1, '{"source":"legacy-second"}')
        `,
        [duplicateAssessmentId],
      );

      await assert.rejects(
        () => database.pool.query(migration),
        (error: unknown) => {
          const databaseError = error as {
            code?: string;
            message?: string;
            detail?: string;
            hint?: string;
          };
          assert.equal(databaseError.code, "23505");
          const diagnostics = [
            databaseError.message,
            databaseError.detail,
            databaseError.hint,
          ].filter(Boolean).join(" ");
          assert.match(diagnostics, /legacy duplicate plans found/i);
          assert.match(diagnostics, new RegExp(String(duplicateAssessmentId)));
          assert.match(diagnostics, /preserve every plan row/i);
          return true;
        },
      );

      const legacyRows = await database.pool.query(
        `
          SELECT assessment_id, plan
            FROM survivor_plans
           WHERE user_id = 'legacy-survivor'
           ORDER BY id
        `,
      );
      assert.equal(legacyRows.rows.length, 2);
      assert.deepEqual(
        legacyRows.rows.map((row) => ({
          assessmentId: row.assessment_id,
          source: row.plan.source,
        })),
        [
          { assessmentId: duplicateAssessmentId, source: "legacy-first" },
          { assessmentId: duplicateAssessmentId, source: "legacy-second" },
        ],
        "failed migration must preserve every legacy plan row",
      );
      const failedIndex = await database.pool.query(`
        SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
      `);
      assert.equal(failedIndex.rows[0].index_name, null);

      // This is the reviewed, non-destructive remediation: unlink one plan,
      // retain both rows, and rerun the exact production migration.
      await database.pool.query(
        `
          UPDATE survivor_plans
             SET assessment_id = NULL
           WHERE id = (
             SELECT MAX(id)
               FROM survivor_plans
              WHERE user_id = 'legacy-survivor'
                AND assessment_id = $1
           )
        `,
        [duplicateAssessmentId],
      );
      await database.pool.query(migration);

      const remediatedIndex = await database.pool.query(`
        SELECT to_regclass('public.survivor_plans_assessment_unique') AS index_name
      `);
      assert.equal(remediatedIndex.rows[0].index_name, "survivor_plans_assessment_unique");
      const remediatedRows = await database.pool.query(`
        SELECT COUNT(*)::int AS total, COUNT(assessment_id)::int AS linked
          FROM survivor_plans
         WHERE user_id = 'legacy-survivor'
      `);
      assert.deepEqual(remediatedRows.rows[0], { total: 2, linked: 1 });
    } finally {
      await database.stop();
    }
  });
} else {
  test("recovery-plan migration integration suite", {
    skip: "set RECOVERY_PLAN_MIGRATION_DB=1 to run against disposable PostgreSQL",
  }, () => {});
}