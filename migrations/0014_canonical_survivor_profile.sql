ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "goal_details" jsonb,
  ADD COLUMN IF NOT EXISTS "assessment_scores" jsonb,
  ADD COLUMN IF NOT EXISTS "assessment_notes" text,
  ADD COLUMN IF NOT EXISTS "profile_provenance" jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint

-- Preserve structured goals even when the old intake profile was empty.
INSERT INTO "user_profiles" ("user_id", "recovery_goals", "goal_details", "profile_provenance")
SELECT
  g.user_id,
  array_agg(g.goal ORDER BY g.created_at),
  jsonb_agg(jsonb_build_object(
    'horizon', g.horizon,
    'domain', g.domain,
    'goal', g.goal,
    'status', g.status
  ) ORDER BY g.created_at),
  jsonb_build_object(
    'recoveryGoals', jsonb_build_object('source', 'legacy_survivor_goal', 'updatedAt', max(g.created_at)::text),
    'goalDetails', jsonb_build_object('source', 'legacy_survivor_goal', 'updatedAt', max(g.created_at)::text)
  )
FROM "survivor_goals" g
GROUP BY g.user_id
ON CONFLICT ("user_id") DO UPDATE SET
  "recovery_goals" = COALESCE("user_profiles"."recovery_goals", EXCLUDED."recovery_goals"),
  "goal_details" = COALESCE("user_profiles"."goal_details", EXCLUDED."goal_details"),
  "profile_provenance" = "user_profiles"."profile_provenance" || EXCLUDED."profile_provenance";
--> statement-breakpoint

-- Normalize the newest Scale snapshot into the profile without deleting history.
WITH newest AS (
  SELECT DISTINCT ON ("user_id")
    "user_id", "physical", "cognitive", "speech", "emotional", "memory",
    "notes", "taken_at"
  FROM "sasquatch_assessments"
  ORDER BY "user_id", "taken_at" DESC
)
UPDATE "user_profiles" p
SET
  "assessment_scores" = COALESCE(p."assessment_scores", jsonb_build_object(
    'physical', newest."physical",
    'cognitive', newest."cognitive",
    'speech', newest."speech",
    'emotional', newest."emotional",
    'memory', newest."memory"
  )),
  "assessment_notes" = COALESCE(p."assessment_notes", newest."notes"),
  "profile_provenance" = p."profile_provenance" || jsonb_build_object(
    'assessmentScores', jsonb_build_object(
      'source', 'legacy_sasquatch_assessment',
      'updatedAt', newest."taken_at"::text
    ),
    'assessmentNotes', jsonb_build_object(
      'source', 'legacy_sasquatch_assessment',
      'updatedAt', newest."taken_at"::text
    )
  )
FROM newest
WHERE p."user_id" = newest."user_id"
  AND p."assessment_scores" IS NULL;
--> statement-breakpoint

-- Give existing profile columns an explicit legacy provenance record.
UPDATE "user_profiles" p
SET "profile_provenance" = p."profile_provenance" || jsonb_strip_nulls(jsonb_build_object(
  'preferredName', CASE WHEN p."preferred_name" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'pronouns', CASE WHEN p."pronouns" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'strokeDate', CASE WHEN p."stroke_date" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'strokeType', CASE WHEN p."stroke_type" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'affectedSide', CASE WHEN p."affected_side" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'deficits', CASE WHEN p."deficits" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'recoveryGoals', CASE WHEN p."recovery_goals" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'goalDetails', CASE WHEN p."goal_details" IS NOT NULL THEN jsonb_build_object('source', 'legacy_user_profile', 'updatedAt', p."updated_at"::text) END,
  'assessmentScores', CASE WHEN p."assessment_scores" IS NOT NULL THEN jsonb_build_object('source', 'legacy_sasquatch_assessment', 'updatedAt', p."updated_at"::text) END
));