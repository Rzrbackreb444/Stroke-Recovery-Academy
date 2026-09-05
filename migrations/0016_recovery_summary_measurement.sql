-- Recovery-summary pilot measurement.
--
-- Deliberately stores only structured ratings and timing. Never put journal
-- content, check-in text, symptoms, diagnoses, export payloads, or comments in
-- this table. The summary_id is a non-sensitive product/version identifier.
CREATE TABLE IF NOT EXISTS "recovery_summary_measurement_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "survivor_id" varchar NOT NULL,
  "actor_id" varchar NOT NULL,
  "actor_type" text NOT NULL,
  "event_type" text NOT NULL,
  "summary_id" text NOT NULL,
  "phase" text,
  "usefulness" integer,
  "uncertainty" integer,
  "clarity" integer,
  "actionability" integer,
  "review_time_seconds" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "recovery_summary_measurement_survivor_fk"
    FOREIGN KEY ("survivor_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_summary_measurement_actor_fk"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_summary_measurement_event_type_check"
    CHECK ("event_type" IN ('summary_viewed', 'summary_exported', 'feedback_submitted')),
  CONSTRAINT "recovery_summary_measurement_actor_type_check"
    CHECK ("actor_type" IN ('survivor', 'caregiver', 'clinician')),
  CONSTRAINT "recovery_summary_measurement_phase_check"
    CHECK ("phase" IS NULL OR "phase" IN ('before', 'after')),
  CONSTRAINT "recovery_summary_measurement_usefulness_check"
    CHECK ("usefulness" IS NULL OR "usefulness" BETWEEN 1 AND 5),
  CONSTRAINT "recovery_summary_measurement_uncertainty_check"
    CHECK ("uncertainty" IS NULL OR "uncertainty" BETWEEN 1 AND 5),
  CONSTRAINT "recovery_summary_measurement_clarity_check"
    CHECK ("clarity" IS NULL OR "clarity" BETWEEN 1 AND 5),
  CONSTRAINT "recovery_summary_measurement_actionability_check"
    CHECK ("actionability" IS NULL OR "actionability" BETWEEN 1 AND 5),
  CONSTRAINT "recovery_summary_measurement_review_time_check"
    CHECK ("review_time_seconds" IS NULL OR "review_time_seconds" BETWEEN 1 AND 3600)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recovery_summary_measurement_summary_idx"
  ON "recovery_summary_measurement_events" USING btree ("summary_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recovery_summary_measurement_actor_idx"
  ON "recovery_summary_measurement_events" USING btree ("actor_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recovery_summary_measurement_pilot_idx"
  ON "recovery_summary_measurement_events" USING btree ("event_type", "actor_type", "created_at");