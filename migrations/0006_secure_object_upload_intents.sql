CREATE TABLE IF NOT EXISTS "object_upload_intents" (
  "object_path" text PRIMARY KEY NOT NULL,
  "owner_id" varchar NOT NULL,
  "original_name" text NOT NULL,
  "declared_size" integer NOT NULL,
  "content_type" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "object_upload_intents"
    ADD CONSTRAINT "object_upload_intents_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "object_upload_intents_owner_idx"
  ON "object_upload_intents" USING btree ("owner_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "object_upload_intents_expiry_idx"
  ON "object_upload_intents" USING btree ("expires_at");
