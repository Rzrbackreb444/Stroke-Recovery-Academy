-- Do not silently choose a plan or delete legacy data while introducing this
-- invariant. A duplicate group must be reviewed first; the remediation is to
-- preserve every plan row and clear assessment_id on all but one reviewed row,
-- then rerun this migration.
DO $$
DECLARE
  duplicate_assessments text;
BEGIN
  SELECT string_agg(
    format('%s (%s plans)', assessment_id, plan_count),
    ', '
    ORDER BY assessment_id
  )
    INTO duplicate_assessments
    FROM (
      SELECT assessment_id, COUNT(*) AS plan_count
        FROM survivor_plans
       WHERE assessment_id IS NOT NULL
       GROUP BY assessment_id
      HAVING COUNT(*) > 1
       ORDER BY assessment_id
       LIMIT 20
    ) AS duplicate_groups;

  IF duplicate_assessments IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'Cannot create survivor_plans assessment uniqueness index: legacy duplicate plans found',
      DETAIL = format('Duplicate assessment-linked plans: %s.', duplicate_assessments),
      HINT = 'Review each duplicate group, preserve every plan row, and clear assessment_id on all but one reviewed plan before rerunning this migration.';
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "survivor_plans_assessment_unique"
  ON "survivor_plans" USING btree ("assessment_id");