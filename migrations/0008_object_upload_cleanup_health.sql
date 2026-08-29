CREATE TABLE IF NOT EXISTS "object_upload_cleanup_health" (
  "id" integer PRIMARY KEY NOT NULL,
  "last_run_at" timestamp with time zone NOT NULL,
  "last_status" varchar(16) NOT NULL DEFAULT 'success',
  "last_success_at" timestamp with time zone,
  "last_failure_at" timestamp with time zone,
  "consecutive_failures" integer NOT NULL DEFAULT 0,
  "total_runs" integer NOT NULL DEFAULT 0,
  "total_failures" integer NOT NULL DEFAULT 0,
  "last_scanned" integer NOT NULL DEFAULT 0,
  "last_objects_deleted" integer NOT NULL DEFAULT 0,
  "last_intents_deleted" integer NOT NULL DEFAULT 0,
  "last_failure_count" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);