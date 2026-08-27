CREATE TABLE IF NOT EXISTS "recovery_funnel_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "event_type" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "recovery_funnel_user_event_unique" UNIQUE("user_id","event_type")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "recovery_funnel_events"
    ADD CONSTRAINT "recovery_funnel_events_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recovery_funnel_event_occurred_idx" ON "recovery_funnel_events" USING btree ("event_type","occurred_at");
--> statement-breakpoint
-- Preserve the useful historical milestones already present in the durable
-- recovery tables. ON CONFLICT keeps this safe if a runtime initializer ran
-- before the migration.
INSERT INTO "recovery_funnel_events" ("user_id", "event_type", "metadata", "occurred_at")
SELECT "user_id", 'assessment_completed', jsonb_build_object('assessmentId', min("id")), min("taken_at")
FROM "sasquatch_assessments"
GROUP BY "user_id"
ON CONFLICT ("user_id", "event_type") DO NOTHING;
--> statement-breakpoint
INSERT INTO "recovery_funnel_events" ("user_id", "event_type", "metadata", "occurred_at")
SELECT "user_id", 'plan_generated', jsonb_build_object('planId', min("id")), min("generated_at")
FROM "survivor_plans"
GROUP BY "user_id"
ON CONFLICT ("user_id", "event_type") DO NOTHING;
--> statement-breakpoint
INSERT INTO "recovery_funnel_events" ("user_id", "event_type", "metadata", "occurred_at")
SELECT "user_id", 'onboarding_completed', jsonb_build_object('planId', min("id")), min("generated_at")
FROM "survivor_plans"
GROUP BY "user_id"
ON CONFLICT ("user_id", "event_type") DO NOTHING;
--> statement-breakpoint
INSERT INTO "recovery_funnel_events" ("user_id", "event_type", "metadata", "occurred_at")
SELECT "user_id", 'today_entered', '{}'::jsonb, COALESCE(min("created_at"), now())
FROM "routine_feedback"
GROUP BY "user_id"
ON CONFLICT ("user_id", "event_type") DO NOTHING;
--> statement-breakpoint
INSERT INTO "recovery_funnel_events" ("user_id", "event_type", "metadata", "occurred_at")
SELECT "user_id", 'first_rep', jsonb_build_object('taskId', min("task_id")), COALESCE(min("created_at"), now())
FROM "routine_feedback"
WHERE "reaction" <> 'skipped'
GROUP BY "user_id"
ON CONFLICT ("user_id", "event_type") DO NOTHING;