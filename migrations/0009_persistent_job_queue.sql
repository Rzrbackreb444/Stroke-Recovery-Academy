CREATE TABLE IF NOT EXISTS "job_queue_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "user_id" varchar NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "result" jsonb,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "metadata" jsonb
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "job_queue_jobs"
    ADD CONSTRAINT "job_queue_jobs_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_queue_jobs_user_created_idx"
  ON "job_queue_jobs" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_queue_jobs_status_idx"
  ON "job_queue_jobs" USING btree ("status","created_at");