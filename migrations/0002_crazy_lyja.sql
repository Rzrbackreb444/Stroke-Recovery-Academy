CREATE TABLE "community_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"uploader_id" text,
	"title" text NOT NULL,
	"description" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"deficit_tags" text[] DEFAULT '{}' NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"file_size_bytes" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'upload' NOT NULL,
	"repost_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encouragements" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"loop_date" text NOT NULL,
	"type" text DEFAULT 'flame' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_nudge_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"nudge_day" integer NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"email" text,
	"channel" text NOT NULL,
	"category" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"provider_id" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_deliveries_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"checkin_reminder_hour" integer DEFAULT 9,
	"streak_break_email" boolean DEFAULT true NOT NULL,
	"weekly_rep_goal" integer DEFAULT 21,
	"weekly_digest_enabled" boolean DEFAULT true NOT NULL,
	"caregiver_share_enabled" boolean DEFAULT false NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"sms_phone" text,
	"sms_consent_at" timestamp,
	"quiet_hours_start" integer,
	"quiet_hours_end" integer,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"unsubscribed_all" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "partner_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"facility" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"partnership_type" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"target_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_micro_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"target_week" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_report_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_report_shares_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_job_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"job_name" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"duration_ms" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"interval_seconds" integer,
	"cron" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_status" text,
	"last_error" text,
	"last_duration_ms" integer,
	"run_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_jobs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sparks_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotlight_nominations" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitter_user_id" varchar NOT NULL,
	"type" text DEFAULT 'self' NOT NULL,
	"nominee_name" text NOT NULL,
	"nominee_email" text,
	"nominee_location" text,
	"stroke_date" text,
	"relationship" text,
	"description" text NOT NULL,
	"media_urls" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "squad_waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "survivor_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_key" text NOT NULL,
	"badge_name" text NOT NULL,
	"reason" text,
	"category" text DEFAULT 'automated' NOT NULL,
	"awarded_by_user_id" varchar,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"tier" text DEFAULT 'ember' NOT NULL,
	"quarter_key" text NOT NULL,
	"last_active_at" timestamp,
	"is_legend_awarded" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survivor_tiers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "video_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_reposts" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_saves" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_publishing_projects" ALTER COLUMN "publisher_name" SET DEFAULT 'Stroke Recovery Academy Publishing';--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD COLUMN "exercises_logged" jsonb;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD COLUMN "habits_completed" jsonb;--> statement-breakpoint
ALTER TABLE "never_zero_audits" ADD COLUMN "morning_brief" text;--> statement-breakpoint
ALTER TABLE "never_zero_audits" ADD COLUMN "morning_focus_items" jsonb;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "estimated_read_minutes" integer;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "newsletter_broadcast_at" timestamp;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "pillar_slug" text;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "pillar_title" text;--> statement-breakpoint
ALTER TABLE "recovery_blog_posts" ADD COLUMN "pillar_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recovery_journals" ADD COLUMN "is_story_moment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "community_videos" ADD CONSTRAINT "community_videos_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encouragements" ADD CONSTRAINT "encouragements_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encouragements" ADD CONSTRAINT "encouragements_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_nudge_log" ADD CONSTRAINT "journal_nudge_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_entry_id_recovery_journals_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."recovery_journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_goals" ADD CONSTRAINT "recovery_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_micro_goals" ADD CONSTRAINT "recovery_micro_goals_goal_id_recovery_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."recovery_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_report_shares" ADD CONSTRAINT "recovery_report_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_job_runs" ADD CONSTRAINT "scheduled_job_runs_job_id_scheduled_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scheduled_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sparks_follows" ADD CONSTRAINT "sparks_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sparks_follows" ADD CONSTRAINT "sparks_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_nominations" ADD CONSTRAINT "spotlight_nominations_submitter_user_id_users_id_fk" FOREIGN KEY ("submitter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_waitlist" ADD CONSTRAINT "squad_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_badges" ADD CONSTRAINT "survivor_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_tiers" ADD CONSTRAINT "survivor_tiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_video_id_community_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."community_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_video_id_community_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."community_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reposts" ADD CONSTRAINT "video_reposts_video_id_community_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."community_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reposts" ADD CONSTRAINT "video_reposts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_saves" ADD CONSTRAINT "video_saves_video_id_community_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."community_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_saves" ADD CONSTRAINT "video_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_community_videos_uploader" ON "community_videos" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "idx_community_videos_created" ON "community_videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_community_videos_public" ON "community_videos" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE INDEX "encouragements_to_date_idx" ON "encouragements" USING btree ("to_user_id","loop_date");--> statement-breakpoint
CREATE INDEX "encouragements_from_idx" ON "encouragements" USING btree ("from_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_journal_nudge_user" ON "journal_nudge_log" USING btree ("user_id","nudge_day");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_journal_reaction_entry_user" ON "journal_reactions" USING btree ("entry_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_journal_reaction_entry" ON "journal_reactions" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_user" ON "message_deliveries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_category" ON "message_deliveries" USING btree ("category");--> statement-breakpoint
CREATE INDEX "recovery_goals_user_idx" ON "recovery_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "micro_goals_goal_idx" ON "recovery_micro_goals" USING btree ("goal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_report_shares_share_id" ON "recovery_report_shares" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "sjr_job_idx" ON "scheduled_job_runs" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sparks_follows_unique" ON "sparks_follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "survivor_badges_user_key_idx" ON "survivor_badges" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE INDEX "survivor_badges_user_idx" ON "survivor_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_video_comments_video" ON "video_comments" USING btree ("video_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_likes_unique" ON "video_likes" USING btree ("video_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_reposts_unique" ON "video_reposts" USING btree ("video_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_saves_unique" ON "video_saves" USING btree ("video_id","user_id");