CREATE TABLE "laundromat_discussions" (
  "id" serial PRIMARY KEY NOT NULL,
  "author_id" varchar NOT NULL,
  "space" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "status" text DEFAULT 'visible' NOT NULL,
  "is_locked" boolean DEFAULT false NOT NULL,
  "reply_count" integer DEFAULT 0 NOT NULL,
  "last_activity_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundromat_discussion_replies" (
  "id" serial PRIMARY KEY NOT NULL,
  "discussion_id" integer NOT NULL,
  "author_id" varchar NOT NULL,
  "parent_id" integer,
  "body" text NOT NULL,
  "status" text DEFAULT 'visible' NOT NULL,
  "edited_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundromat_discussion_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "reporter_id" varchar NOT NULL,
  "target_type" text NOT NULL,
  "target_id" integer NOT NULL,
  "reason" text NOT NULL,
  "details" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "moderator_id" varchar,
  "moderator_notes" text,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundromat_equipment_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "items" jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundromat_site_scorecards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "evening_traffic" text NOT NULL,
  "competition" text NOT NULL,
  "rent" text NOT NULL,
  "score" integer NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "laundromat_discussions" ADD CONSTRAINT "laundromat_discussions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_discussion_replies" ADD CONSTRAINT "laundromat_discussion_replies_discussion_id_laundromat_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."laundromat_discussions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_discussion_replies" ADD CONSTRAINT "laundromat_discussion_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_discussion_reports" ADD CONSTRAINT "laundromat_discussion_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_discussion_reports" ADD CONSTRAINT "laundromat_discussion_reports_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_equipment_plans" ADD CONSTRAINT "laundromat_equipment_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "laundromat_site_scorecards" ADD CONSTRAINT "laundromat_site_scorecards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "laundromat_discussions_feed_idx" ON "laundromat_discussions" USING btree ("space","status","last_activity_at");
--> statement-breakpoint
CREATE INDEX "laundromat_discussions_author_idx" ON "laundromat_discussions" USING btree ("author_id","created_at");
--> statement-breakpoint
CREATE INDEX "laundromat_replies_discussion_idx" ON "laundromat_discussion_replies" USING btree ("discussion_id","created_at");
--> statement-breakpoint
CREATE INDEX "laundromat_replies_author_idx" ON "laundromat_discussion_replies" USING btree ("author_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "laundromat_reporter_target_unique" ON "laundromat_discussion_reports" USING btree ("reporter_id","target_type","target_id");
--> statement-breakpoint
CREATE INDEX "laundromat_reports_queue_idx" ON "laundromat_discussion_reports" USING btree ("status","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "laundromat_equipment_plan_name_unique" ON "laundromat_equipment_plans" USING btree ("user_id","name");
--> statement-breakpoint
CREATE INDEX "laundromat_equipment_plans_user_idx" ON "laundromat_equipment_plans" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "laundromat_scorecard_name_unique" ON "laundromat_site_scorecards" USING btree ("user_id","name");
--> statement-breakpoint
CREATE INDEX "laundromat_scorecards_user_idx" ON "laundromat_site_scorecards" USING btree ("user_id","updated_at");