CREATE TABLE "washbiz_course_progress" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "completed_lessons" integer DEFAULT 0 NOT NULL,
  "reflection" text DEFAULT '' NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "washbiz_equipment_plan_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "equipment_key" varchar(64) NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "washbiz_scorecards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "site_name" text NOT NULL,
  "evening_traffic" varchar(16) NOT NULL,
  "competition" varchar(16) NOT NULL,
  "rent" varchar(16) NOT NULL,
  "score" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "washbiz_course_progress" ADD CONSTRAINT "washbiz_course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "washbiz_equipment_plan_items" ADD CONSTRAINT "washbiz_equipment_plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "washbiz_scorecards" ADD CONSTRAINT "washbiz_scorecards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "washbiz_course_progress_user_unique" ON "washbiz_course_progress" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "washbiz_equipment_plan_user_equipment_unique" ON "washbiz_equipment_plan_items" USING btree ("user_id","equipment_key");
--> statement-breakpoint
CREATE INDEX "washbiz_equipment_plan_user_created_idx" ON "washbiz_equipment_plan_items" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "washbiz_scorecards_user_updated_idx" ON "washbiz_scorecards" USING btree ("user_id","updated_at");