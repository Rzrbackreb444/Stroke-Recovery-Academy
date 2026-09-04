ALTER TABLE "survivor_plans"
  ADD COLUMN IF NOT EXISTS "review_status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "reviewed_by" varchar,
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "review_notes" text;
--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'survivor_plans_reviewed_by_users_id_fk'
  ) THEN
    ALTER TABLE "survivor_plans"
      ADD CONSTRAINT "survivor_plans_reviewed_by_users_id_fk"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE set null;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "survivor_plans_review_status_idx"
  ON "survivor_plans" USING btree ("review_status", "generated_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "recovery_plan_reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "plan_id" integer NOT NULL,
  "actor_id" varchar NOT NULL,
  "actor_type" text NOT NULL,
  "status" text NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "recovery_plan_reviews_plan_id_survivor_plans_id_fk"
    FOREIGN KEY ("plan_id") REFERENCES "survivor_plans"("id") ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recovery_plan_reviews_plan_idx"
  ON "recovery_plan_reviews" USING btree ("plan_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recovery_plan_reviews_actor_idx"
  ON "recovery_plan_reviews" USING btree ("actor_id", "created_at");