CREATE UNIQUE INDEX IF NOT EXISTS "survivor_plans_assessment_unique"
  ON "survivor_plans" USING btree ("assessment_id");