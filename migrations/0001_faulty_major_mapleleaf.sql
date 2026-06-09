CREATE SCHEMA "author_brain";
--> statement-breakpoint
CREATE TABLE "accountability_pods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"leader_id" varchar,
	"max_members" integer DEFAULT 6 NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"focus_area" text,
	"meeting_schedule" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"tenor_id" text,
	"alt_text" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"post_type" text DEFAULT 'update' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"pod_id" integer,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text,
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(64),
	"resource_id" text,
	"method" varchar(8),
	"path" text NOT NULL,
	"ip" varchar(64),
	"user_agent" text,
	"status_code" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"product_id" integer,
	"code" text NOT NULL,
	"commission_percent" integer DEFAULT 20 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"total_earnings" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_generated_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"prompt" text NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"content_type" text NOT NULL,
	"content_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"cost" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_music_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"user_id" varchar NOT NULL,
	"job_type" text NOT NULL,
	"provider" text NOT NULL,
	"prompt" text NOT NULL,
	"parameters" jsonb,
	"result_url" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"cost" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_provider_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"operation" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"cached" boolean DEFAULT false NOT NULL,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_quality_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"credit_cost" integer NOT NULL,
	"model" text NOT NULL,
	"temperature" real DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 4096 NOT NULL,
	"prompt_modifiers" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_voice_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'narrative' NOT NULL,
	"system_instructions" text NOT NULL,
	"example_output" text,
	"is_built_in" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_writing_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"chapter_id" integer,
	"job_type" text NOT NULL,
	"prompt" text NOT NULL,
	"result" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "anchor_retention_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anchor_id" integer NOT NULL,
	"status" text NOT NULL,
	"signaled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anchor_streaks" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_check_in_date" text,
	"today_anchor_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"provider_name" text NOT NULL,
	"provider_type" text NOT NULL,
	"location" text,
	"appointment_date" timestamp NOT NULL,
	"duration" integer,
	"notes" text,
	"prep_notes" text,
	"follow_up_notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"source_studio" text NOT NULL,
	"asset_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text,
	"thumbnail_url" text,
	"mime_type" text,
	"file_size" integer,
	"duration" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"tags" text[],
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"source_project_id" integer,
	"source_conversation_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audiobook_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"audiobook_id" integer NOT NULL,
	"source_chapter_id" integer,
	"chapter_number" integer NOT NULL,
	"title" text NOT NULL,
	"text_content" text,
	"word_count" integer,
	"estimated_duration" integer,
	"actual_duration" integer,
	"raw_audio_url" text,
	"mastered_audio_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audiobook_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_project_id" integer,
	"creator_id" varchar NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"narrator_voice_id" integer,
	"narrator_name" text,
	"total_chapters" integer DEFAULT 0 NOT NULL,
	"completed_chapters" integer DEFAULT 0 NOT NULL,
	"total_duration" integer,
	"estimated_cost" integer,
	"cover_image_url" text,
	"status" text DEFAULT 'setup' NOT NULL,
	"mastering_preset" text,
	"noise_reduction" boolean DEFAULT true NOT NULL,
	"loudness_normalization" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"order_id" integer NOT NULL,
	"order_item_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"sale_amount" integer NOT NULL,
	"print_cost" integer DEFAULT 0 NOT NULL,
	"platform_fee" integer NOT NULL,
	"net_earnings" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"available_at" timestamp,
	"paid_at" timestamp,
	"payout_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_brain"."author_memory" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" uuid,
	"content_type" text NOT NULL,
	"raw_text" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "author_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"pen_name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"bio" text,
	"short_bio" text,
	"photo_url" text,
	"website_url" text,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"genres" text[],
	"other_books" jsonb DEFAULT '[]'::jsonb,
	"publisher_info" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"source_vault_entry_id" integer,
	"title" text NOT NULL,
	"prompt_config" jsonb,
	"output_type" text NOT NULL,
	"ai_model" text,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"output_url" text,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"hero_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"tags" text[],
	"reading_time" integer DEFAULT 5,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text[],
	"canonical_url" text,
	"breadcrumb_title" text,
	"featured_image_alt" text,
	"featured_image_caption" text,
	"og_image_url" text,
	"twitter_image_url" text,
	"schema_type" text DEFAULT 'Article',
	"primary_category" text,
	"secondary_categories" text[],
	"internal_links" jsonb DEFAULT '[]'::jsonb,
	"external_links" jsonb DEFAULT '[]'::jsonb,
	"related_post_ids" integer[],
	"focus_keyphrase" text,
	"keyphrase_score" integer,
	"readability_score" integer,
	"seo_score" integer,
	"cornerstone" boolean DEFAULT false,
	"social_title" text,
	"social_description" text,
	"pinterest_image_url" text,
	"no_index" boolean DEFAULT false,
	"no_follow" boolean DEFAULT false,
	"index_priority" real DEFAULT 0.7,
	"change_frequency" text DEFAULT 'weekly',
	"author_bio" text,
	"author_credentials" text[],
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"fact_checked" boolean DEFAULT false,
	"last_fact_check_at" timestamp,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"content_last_updated" timestamp,
	"seo_last_audited_at" timestamp,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "book_cover_designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"publishing_project_id" integer NOT NULL,
	"name" text DEFAULT 'Untitled Design' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false,
	"front_cover_image_url" text,
	"back_cover_image_url" text,
	"spine_image_url" text,
	"full_wrap_image_url" text,
	"design_data" jsonb DEFAULT '{}'::jsonb,
	"background_color" text,
	"title_text" text,
	"subtitle_text" text,
	"author_text" text,
	"spine_text" text,
	"back_cover_text" text,
	"title_font" text,
	"title_color" text,
	"author_font" text,
	"author_color" text,
	"ai_generated" boolean DEFAULT false,
	"ai_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_editions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"edition_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"print_cost" integer,
	"author_royalty" integer NOT NULL,
	"trim_size" text,
	"paper_type" text,
	"binding_type" text,
	"color_interior" boolean DEFAULT false NOT NULL,
	"lulu_package_id" text,
	"lulu_product_id" text,
	"interior_pdf_url" text,
	"cover_pdf_url" text,
	"epub_url" text,
	"isbn" text,
	"isbn13" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_image_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" text NOT NULL,
	"origin" text DEFAULT 'uploaded' NOT NULL,
	"purpose" text DEFAULT 'illustration' NOT NULL,
	"prompt" text,
	"style" text,
	"chapter_index" integer,
	"original_url" text NOT NULL,
	"edited_url" text,
	"no_bg_url" text,
	"kdp_url" text,
	"width" integer,
	"height" integer,
	"dpi" integer,
	"file_size" integer,
	"mime_type" text,
	"kdp_spec" text,
	"status" text DEFAULT 'ready' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_image_placements" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"image_asset_id" integer,
	"section_id" integer,
	"placement_mode" text DEFAULT 'manual' NOT NULL,
	"anchor_type" text DEFAULT 'after_paragraph' NOT NULL,
	"anchor_offset" integer DEFAULT 0,
	"page_number" integer,
	"position_x" real DEFAULT 0,
	"position_y" real DEFAULT 0,
	"width" real DEFAULT 1,
	"height" real,
	"caption" text,
	"alignment" text DEFAULT 'center',
	"is_approved" boolean DEFAULT false,
	"ai_suggestion_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" varchar,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"subtotal" integer NOT NULL,
	"shipping_cost" integer DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"shipping_method" text,
	"shipping_name" text,
	"shipping_street1" text,
	"shipping_street2" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_postcode" text,
	"shipping_country" text,
	"shipping_phone" text,
	"tracking_number" text,
	"tracking_url" text,
	"paid_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "book_project_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"section_number" integer NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'chapter' NOT NULL,
	"content" text,
	"word_count" integer DEFAULT 0,
	"start_page" integer,
	"end_page" integer,
	"summary" text,
	"suggested_images" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"author_name" text,
	"genre" text DEFAULT 'memoir',
	"target_audience" text,
	"manuscript_html" text,
	"manuscript_text" text,
	"word_count" integer DEFAULT 0,
	"page_count" integer DEFAULT 0,
	"chapter_count" integer DEFAULT 0,
	"current_step" integer DEFAULT 1,
	"trim_size" text DEFAULT '6x9',
	"font_size" integer DEFAULT 11,
	"font_family" text DEFAULT 'Garamond',
	"margin_inner" real DEFAULT 0.75,
	"margin_outer" real DEFAULT 0.5,
	"margin_top" real DEFAULT 0.75,
	"margin_bottom" real DEFAULT 0.75,
	"has_front_matter" boolean DEFAULT false,
	"has_back_matter" boolean DEFAULT false,
	"readiness_score" integer DEFAULT 0,
	"cover_image_url" text,
	"spine_width" real,
	"status" text DEFAULT 'draft' NOT NULL,
	"chat_history" jsonb,
	"ai_knowledge" jsonb,
	"conversation_summary" text,
	"author_preferences" jsonb,
	"knowledge_version" integer DEFAULT 0,
	"last_edited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_publishing_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_project_id" integer NOT NULL,
	"owner_id" varchar NOT NULL,
	"template_id" text,
	"custom_pod_package_id" text,
	"trim_size_code" text NOT NULL,
	"trim_size_name" text,
	"binding_type" text DEFAULT 'PB' NOT NULL,
	"print_type" text DEFAULT 'BW' NOT NULL,
	"paper_type" text DEFAULT '060UC444' NOT NULL,
	"cover_finish" text DEFAULT 'M' NOT NULL,
	"page_count" integer NOT NULL,
	"interior_pdf_url" text,
	"cover_pdf_url" text,
	"interior_file_status" text DEFAULT 'pending',
	"cover_file_status" text DEFAULT 'pending',
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"cover_width" real,
	"cover_height" real,
	"spine_width" real,
	"bleed" real,
	"safety_margin" real,
	"isbn" text,
	"isbn_barcode" boolean DEFAULT true,
	"publisher_name" text DEFAULT 'Stroke Lyfe Publishing',
	"copyright_year" integer,
	"edition" text,
	"estimated_print_cost" integer,
	"retail_price" integer,
	"wholesale_price" integer,
	"royalty" integer,
	"currency" text DEFAULT 'USD',
	"distribution_channels" text[] DEFAULT '{}',
	"amazon_listing" boolean DEFAULT false,
	"lulu_store_listing" boolean DEFAULT false,
	"ingram_distribution" boolean DEFAULT false,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"lulu_product_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_website_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_website_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer,
	"author_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"title" text NOT NULL,
	"subtitle" text,
	"tagline" text,
	"description" text,
	"author_bio" text,
	"author_name" text NOT NULL,
	"author_photo_url" text,
	"cover_image_url" text,
	"banner_image_url" text,
	"logo_url" text,
	"theme" text DEFAULT 'classic' NOT NULL,
	"primary_color" text DEFAULT '#C9941A',
	"accent_color" text DEFAULT '#1a1a1a',
	"font_family" text DEFAULT 'Crimson Pro',
	"genre" text,
	"amazon_url" text,
	"barnes_noble_url" text,
	"apple_books_url" text,
	"kobo_url" text,
	"google_play_url" text,
	"lulu_url" text,
	"direct_buy_url" text,
	"sample_chapter_url" text,
	"testimonials" jsonb DEFAULT '[]'::jsonb,
	"awards" jsonb DEFAULT '[]'::jsonb,
	"press_quotes" jsonb DEFAULT '[]'::jsonb,
	"book_details" jsonb DEFAULT '{}'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"newsletter_enabled" boolean DEFAULT false NOT NULL,
	"mailchimp_list_id" text,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[],
	"og_image_url" text,
	"analytics_id" text,
	"facebook_pixel_id" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_websites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"author" text DEFAULT 'Nick Kremers' NOT NULL,
	"cover_image_url" text,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"category" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brain_gym_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"game_type" text NOT NULL,
	"pack_id" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"duration_sec" integer NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"moves_or_attempts" integer,
	"accuracy_pct" integer,
	"is_daily_challenge" boolean DEFAULT false NOT NULL,
	"challenge_date" text,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_kits" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"user_id" varchar,
	"name" text NOT NULL,
	"primary_color" text,
	"secondary_color" text,
	"accent_color" text,
	"fonts" jsonb DEFAULT '{}'::jsonb,
	"logos" jsonb DEFAULT '[]'::jsonb,
	"guidelines" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buddy_active_members" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"pair_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buddy_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" varchar NOT NULL,
	"user2_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paired_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"end_reason" text
);
--> statement-breakpoint
CREATE TABLE "buddy_profiles" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"opted_in" boolean DEFAULT false NOT NULL,
	"routine_level" integer DEFAULT 0 NOT NULL,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"bio" text,
	"status" text DEFAULT 'looking' NOT NULL,
	"paired_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campfire_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"user_id" varchar NOT NULL,
	"body" text NOT NULL,
	"kind" varchar(16) DEFAULT 'text' NOT NULL,
	"voice_url" text,
	"voice_duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campfire_presence" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"user_id" varchar NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campfire_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campfire_room_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"prompt_date" varchar(10) NOT NULL,
	"prompt_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caregiver_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"caregiver_id" varchar NOT NULL,
	"survivor_id" varchar,
	"status" text DEFAULT 'invited' NOT NULL,
	"relationship" text,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"invite_email" varchar,
	"invite_token" varchar,
	"invite_expires_at" timestamp,
	CONSTRAINT "caregiver_links_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "circuit_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"circuit_slug" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"stations_completed" integer DEFAULT 0 NOT NULL,
	"total_stations" integer NOT NULL,
	"feeling" text,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"classroom_course_id" integer NOT NULL,
	"lesson_id" integer,
	"google_assignment_id" text,
	"google_form_id" text,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"max_points" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_course_id" integer NOT NULL,
	"google_course_id" text NOT NULL,
	"google_course_link" text,
	"enrollment_code" text,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cognitive_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"difficulty" text NOT NULL,
	"game_type" text NOT NULL,
	"instructions" text,
	"game_config" jsonb,
	"estimated_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohort_members" (
	"cohort_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_members_cohort_id_user_id_pk" PRIMARY KEY("cohort_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"audio_url" text,
	"crisis_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compass_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"pillar" text NOT NULL,
	"score" integer NOT NULL,
	"reflection" text,
	"wins" text[],
	"challenges" text[],
	"tomorrows_goal" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compass_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"pillar" text NOT NULL,
	"goal" text NOT NULL,
	"target_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"milestones" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"reporter_user_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar
);
--> statement-breakpoint
CREATE TABLE "conversation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"message_id" integer,
	"action_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"progress" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"content_type" text DEFAULT 'text' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"action_type" text,
	"action_payload" jsonb,
	"action_result" jsonb,
	"is_streaming" boolean DEFAULT false NOT NULL,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"last_read_at" timestamp,
	"is_muted" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"studio" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"project_id" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"system_prompt" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"shared_with" text[],
	"share_permission" text DEFAULT 'view',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'direct' NOT NULL,
	"name" text,
	"created_by_id" varchar NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_builder_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"long_description" text,
	"thumbnail_url" text,
	"promo_video_url" text,
	"category" text,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_hours" integer,
	"price" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"average_rating" integer DEFAULT 0 NOT NULL,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"drip_enabled" boolean DEFAULT false NOT NULL,
	"drip_interval_days" integer DEFAULT 7 NOT NULL,
	"certificate_enabled" boolean DEFAULT true NOT NULL,
	"community_enabled" boolean DEFAULT false NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "course_builder_courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course_builder_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"lesson_type" text DEFAULT 'video' NOT NULL,
	"content" text,
	"video_url" text,
	"video_duration" integer,
	"audio_url" text,
	"download_url" text,
	"download_name" text,
	"thumbnail_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer DEFAULT 10 NOT NULL,
	"is_preview" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"completion_criteria" text DEFAULT 'view' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_builder_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"unlock_after_days" integer,
	"unlock_after_module_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_builder_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question_type" text DEFAULT 'multiple_choice' NOT NULL,
	"question" text NOT NULL,
	"options" jsonb,
	"correct_answer" text,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_builder_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"allow_retakes" boolean DEFAULT true NOT NULL,
	"max_retakes" integer,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"show_correct_answers" boolean DEFAULT true NOT NULL,
	"time_limit_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "course_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course_category_tags" (
	"course_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "course_category_tags_course_id_category_id_pk" PRIMARY KEY("course_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "course_cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_credit_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"points_spent" integer NOT NULL,
	"cash_equivalent_cents" integer NOT NULL,
	"creator_payout_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"payout_transfer_id" text,
	"payout_status" text DEFAULT 'queued' NOT NULL,
	"refunded_at" timestamp,
	"refund_reason" text,
	"refund_points" integer,
	"refund_transfer_reversal_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_lesson_id" integer,
	"last_accessed_at" timestamp,
	"certificate_issued_at" timestamp,
	"certificate_url" text
);
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"course_id" integer NOT NULL,
	"prerequisite_course_id" integer NOT NULL,
	CONSTRAINT "course_prerequisites_course_id_prerequisite_course_id_pk" PRIMARY KEY("course_id","prerequisite_course_id")
);
--> statement-breakpoint
CREATE TABLE "course_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"lesson_duration" integer,
	"quiz_settings" jsonb DEFAULT '{}'::jsonb,
	"certificate_template" text,
	"branding_colors" jsonb DEFAULT '{}'::jsonb,
	"intro_video_template" text,
	"outro_video_template" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"stripe_payment_id" text,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"sales" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"new_followers" integer DEFAULT 0 NOT NULL,
	"product_views" jsonb DEFAULT '{}'::jsonb,
	"traffic_sources" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_course_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"video_url" text,
	"duration" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_course_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"source_chapter_id" integer,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"source_project_id" integer,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_hours" integer,
	"price" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"order_id" integer,
	"product_type" text NOT NULL,
	"product_id" integer NOT NULL,
	"product_title" text NOT NULL,
	"sale_amount" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"creator_share" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_transfer_id" text,
	"payout_id" integer,
	"customer_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "creator_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_payout_id" text,
	"stripe_transfer_id" text,
	"failure_reason" text,
	"earnings_included" integer[],
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "creator_storefronts" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"tagline" text,
	"bio" text,
	"banner_url" text,
	"logo_url" text,
	"theme" jsonb DEFAULT '{}'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"custom_domain" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_storefronts_creator_id_unique" UNIQUE("creator_id"),
	CONSTRAINT "creator_storefronts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "creator_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"workflow_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source_type" text,
	"source_id" integer,
	"steps" jsonb NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer[],
	"outputs" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"feature_key" text,
	"reference_type" text,
	"reference_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"price_usd" integer NOT NULL,
	"stripe_price_id" text,
	"bonus_percent" integer DEFAULT 0,
	"is_popular" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"last_refill_at" timestamp,
	"next_refill_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"video_url" text,
	"audio_url" text,
	"estimated_minutes" integer,
	"key_takeaways" text[],
	"exercises" jsonb,
	"required_tier" text DEFAULT 'warrior' NOT NULL,
	"order" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_number" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"icon_name" text,
	"order" integer NOT NULL,
	"required_tier" text DEFAULT 'explorer' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"checkin_date" timestamp NOT NULL,
	"mood_score" integer,
	"energy_score" integer,
	"pain_score" integer,
	"effort_score" integer,
	"sleep_hours" integer,
	"exercise_minutes" integer,
	"wins_today" text,
	"challenges_today" text,
	"gratitude" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_quotes" (
	"date" text PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"audio_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text,
	"media_url" text,
	"media_type" text,
	"tenor_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dj_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"settings" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_merge_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_ids" integer[],
	"section_order" jsonb,
	"merged_content" text,
	"output_format" text DEFAULT 'manuscript',
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_snippets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"source_id" integer,
	"project_id" integer,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[],
	"category" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" integer,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer,
	"storage_ref" text,
	"parsed_content" text,
	"parsed_metadata" jsonb,
	"language" text,
	"word_count" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctrine_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"outline_id" integer NOT NULL,
	"parent_id" integer,
	"chapter_id" integer,
	"title" text NOT NULL,
	"content" text,
	"node_type" text DEFAULT 'topic' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctrine_outlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"daily_minutes" integer DEFAULT 30 NOT NULL,
	"weekly_days" integer DEFAULT 5 NOT NULL,
	"preferred_time" text,
	"exercise_types" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"duration" integer NOT NULL,
	"intensity" text,
	"notes" text,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_prescriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"therapist_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"exercise_id" integer,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"video_url" text,
	"sets" integer,
	"reps" integer,
	"duration" integer,
	"frequency" text NOT NULL,
	"days_per_week" integer,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_id" integer NOT NULL,
	"high_score" integer DEFAULT 0 NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_time" integer DEFAULT 0 NOT NULL,
	"average_score" integer DEFAULT 0 NOT NULL,
	"average_accuracy" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp,
	"streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_id" integer NOT NULL,
	"prescription_id" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"score" integer,
	"max_score" integer,
	"accuracy" integer,
	"speed" integer,
	"reps" integer,
	"sets" integer,
	"difficulty" text,
	"game_data" jsonb,
	"notes" text,
	"pain_level" integer,
	"effort_level" integer
);
--> statement-breakpoint
CREATE TABLE "feature_gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"credit_cost" integer DEFAULT 1 NOT NULL,
	"min_tier" text DEFAULT 'free' NOT NULL,
	"limit_type" text DEFAULT 'per_use' NOT NULL,
	"daily_limit" integer,
	"monthly_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"route" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"body" text NOT NULL,
	"severity" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"contact_email" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flicker_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"moment" text NOT NULL,
	"body_part" text,
	"intensity" integer DEFAULT 1 NOT NULL,
	"emotion_before" text,
	"emotion_after" text,
	"activity" text,
	"is_breakthrough" boolean DEFAULT false NOT NULL,
	"notes" text,
	"media_url" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_post_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"file_name" text,
	"file_size" integer,
	"tenor_id" text,
	"alt_text" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_votes" (
	"user_id" varchar NOT NULL,
	"post_id" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forum_votes_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "free_video_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_token" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"story_text" text,
	"recovery_stage" text,
	"focus_area" text,
	"video_url" text NOT NULL,
	"video_size_bytes" integer,
	"duration_sec" integer,
	"transcript" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"analysis_json" jsonb,
	"consent_to_share" boolean DEFAULT false NOT NULL,
	"consent_to_contact" boolean DEFAULT false NOT NULL,
	"moderation_status" text DEFAULT 'pending' NOT NULL,
	"moderated_by" varchar,
	"moderated_at" timestamp,
	"published_handle" text,
	"ip_address" text,
	"user_agent" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "free_video_analyses_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "generated_logos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"website_id" integer,
	"business_name" text NOT NULL,
	"industry" text,
	"style" text,
	"icon_type" text,
	"primary_color" text,
	"image_url" text NOT NULL,
	"prompt" text,
	"is_selected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_sender_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"receiver_id" varchar NOT NULL,
	"blocked_sender_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(10) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"audio_url" text,
	"crisis_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"condition_tag" varchar(60),
	"is_private" boolean DEFAULT false NOT NULL,
	"owner_id" varchar NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"icon_url" text,
	"banner_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_habit_id" integer NOT NULL,
	"log_date" timestamp NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hydration_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"daily_target" integer DEFAULT 8 NOT NULL,
	"glass_size" integer DEFAULT 8 NOT NULL,
	"reminder_interval" integer DEFAULT 60 NOT NULL,
	"start_hour" integer DEFAULT 7 NOT NULL,
	"end_hour" integer DEFAULT 21 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hydration_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ideation_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"source_entry_id" integer NOT NULL,
	"target_entry_id" integer NOT NULL,
	"relationship" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"source" text DEFAULT 'upload' NOT NULL,
	"prompt" text,
	"edits" jsonb,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspiration_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"title" text,
	"notes" text,
	"category" text,
	"tags" text[],
	"color_palette" jsonb DEFAULT '[]'::jsonb,
	"style_attributes" jsonb DEFAULT '{}'::jsonb,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"achieved_at" timestamp NOT NULL,
	"days_post_stroke" integer,
	"image_url" text,
	"video_url" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"linked_story_id" integer,
	"celebration_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legend_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text DEFAULT 'My Recovery Legend' NOT NULL,
	"subtitle" text,
	"cover_image_url" text,
	"chapters" jsonb,
	"current_chapter" integer DEFAULT 1 NOT NULL,
	"total_word_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_to_stories" boolean DEFAULT false NOT NULL,
	"last_edited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legend_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"prompt" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legend_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"legend_id" integer NOT NULL,
	"prompt_id" integer NOT NULL,
	"response" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"lesson_id" integer NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"video_watch_time" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"started_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lesson_video_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"locale" varchar(8) NOT NULL,
	"transcript_text" text,
	"caption_vtt_url" text,
	"translated_by" text DEFAULT 'gemini' NOT NULL,
	"word_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"url" text NOT NULL,
	"hls_url" text,
	"duration" integer,
	"size_bytes" integer,
	"caption_vtt_url" text,
	"transcript_text" text,
	"chapters" jsonb,
	"transcription_status" text DEFAULT 'pending' NOT NULL,
	"transcription_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_videos_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "life_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"timeline" jsonb,
	"milestones" jsonb,
	"themes" text[],
	"chapters" jsonb,
	"attachments" jsonb,
	"generated_content" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"linked_book_project_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lulu_print_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"order_item_id" integer NOT NULL,
	"lulu_order_id" text,
	"lulu_line_item_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"product_id" text,
	"quantity" integer NOT NULL,
	"interior_source_url" text,
	"cover_source_url" text,
	"shipping_level" text,
	"estimated_ship_date" timestamp,
	"actual_ship_date" timestamp,
	"tracking_number" text,
	"tracking_url" text,
	"carrier" text,
	"production_cost" integer,
	"shipping_cost" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_webhook_at" timestamp,
	"webhook_payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lulu_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lulu_webhook_id" text NOT NULL,
	"callback_url" text NOT NULL,
	"events" text[] NOT NULL,
	"signing_key" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lulu_webhooks_lulu_webhook_id_unique" UNIQUE("lulu_webhook_id")
);
--> statement-breakpoint
CREATE TABLE "lyrics_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"story_text" text NOT NULL,
	"genre" text NOT NULL,
	"singer" text NOT NULL,
	"lyrics_data" jsonb NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "manuscript_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"chapter_id" integer,
	"asset_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"ai_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manuscript_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"content" text,
	"ai_draft" text,
	"notes" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'outline' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"cover_image_url" text,
	"preview_url" text,
	"genre" text NOT NULL,
	"tags" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_digital_only" boolean DEFAULT false NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"average_rating" integer,
	"review_count" integer DEFAULT 0 NOT NULL,
	"page_count" integer,
	"word_count" integer,
	"scheduled_publish_at" timestamp,
	"scheduled_unpublish_at" timestamp,
	"published_at" timestamp,
	"moderation_status" text DEFAULT 'pending' NOT NULL,
	"moderated_at" timestamp,
	"moderated_by" integer,
	"moderation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"asin" text,
	"title" text NOT NULL,
	"brand" text,
	"description" text,
	"features" text[],
	"image_url" text,
	"amazon_url" text NOT NULL,
	"price_display" text,
	"rating" text,
	"review_count" integer,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"mime_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" text NOT NULL,
	"mode" text DEFAULT 'image' NOT NULL,
	"project_data" jsonb,
	"thumbnail_url" text,
	"duration" integer,
	"width" integer,
	"height" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"taken_at" timestamp DEFAULT now() NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"purpose" text,
	"prescribed_by" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"side_effects" text[],
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"reminder_times" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mix_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"master_volume" integer DEFAULT 80 NOT NULL,
	"master_effects" jsonb,
	"automation_curves" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motivation_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"payload" jsonb NOT NULL,
	"audio_url" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "motivation_usage" (
	"user_id" varchar NOT NULL,
	"month" text NOT NULL,
	"anthem_count" integer DEFAULT 0 NOT NULL,
	"vision_card_count" integer DEFAULT 0 NOT NULL,
	"anchor_render_count" integer DEFAULT 0 NOT NULL,
	"anthem_builder_count" integer DEFAULT 0 NOT NULL,
	"lyrics_draft_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "movie_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"appearance" text,
	"personality" text,
	"voice_clone_id" integer,
	"voice_style" text,
	"reference_image_url" text,
	"ai_generated_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"title" text NOT NULL,
	"logline" text,
	"synopsis" text,
	"genre" text NOT NULL,
	"target_duration" integer,
	"aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"style" text,
	"cover_image_url" text,
	"trailer_url" text,
	"status" text DEFAULT 'development' NOT NULL,
	"total_scenes" integer DEFAULT 0 NOT NULL,
	"completed_scenes" integer DEFAULT 0 NOT NULL,
	"estimated_cost" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_scenes" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"scene_number" integer NOT NULL,
	"title" text NOT NULL,
	"setting" text NOT NULL,
	"time_of_day" text,
	"mood" text,
	"description" text,
	"camera_angles" text[],
	"duration" integer,
	"status" text DEFAULT 'scripted' NOT NULL,
	"storyboard_urls" text[],
	"video_url" text,
	"audio_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"mix_session_id" integer,
	"format" text NOT NULL,
	"quality" text NOT NULL,
	"audio_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "music_lyrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" text NOT NULL,
	"structure" jsonb,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"ai_prompt" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"genre" text NOT NULL,
	"sub_genre" text,
	"bpm" integer DEFAULT 120 NOT NULL,
	"key" text DEFAULT 'C' NOT NULL,
	"scale" text DEFAULT 'major' NOT NULL,
	"description" text,
	"cover_art_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_sandbox_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"project_type" text NOT NULL,
	"genre" text,
	"tempo" integer,
	"key" text,
	"time_signature" text DEFAULT '4/4',
	"lyrics" text,
	"structure" jsonb,
	"tracks" jsonb,
	"patterns" jsonb,
	"mix_settings" jsonb,
	"audio_url" text,
	"stem_urls" jsonb,
	"linked_vault_entry_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_stems" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"stem_type" text NOT NULL,
	"source_model" text,
	"audio_url" text,
	"waveform_data" jsonb,
	"volume" integer DEFAULT 80 NOT NULL,
	"pan" integer DEFAULT 50 NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"solo" boolean DEFAULT false NOT NULL,
	"effects" jsonb,
	"start_time" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"export_id" integer,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"style" text,
	"video_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"beat_markers" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "never_zero_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"audit_date" text NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"today_count" integer DEFAULT 0 NOT NULL,
	"categories_covered" text[],
	"categories_missed" text[],
	"stood_out" text,
	"missing" text,
	"verdict" text,
	"tomorrow" text,
	"raw_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "never_zero_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"habit_id" integer,
	"action" text NOT NULL,
	"reps" integer DEFAULT 1 NOT NULL,
	"streak_saved" boolean DEFAULT true NOT NULL,
	"difficulty" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_drip_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer NOT NULL,
	"edition_number" integer NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_editions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"preview" text,
	"html_content" text NOT NULL,
	"text_content" text,
	"edition" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"source" text DEFAULT 'website' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" text[] DEFAULT '{}',
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nick_quote_audio" (
	"quote_id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"audio_url" text NOT NULL,
	"voice_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"edition_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"print_cost" integer,
	"author_royalty" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"download_url" text,
	"download_expires_at" timestamp,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "patient_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"therapist_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"goals" text[],
	"notes" text,
	"session_frequency" text,
	"next_session_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"user_type" text DEFAULT 'visitor' NOT NULL,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"free_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pod_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"pod_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcast_episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"podcast_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"show_notes" text,
	"audio_url" text,
	"cover_art_url" text,
	"duration" integer DEFAULT 0 NOT NULL,
	"transcript" text,
	"transcription_status" text DEFAULT 'none',
	"episode_number" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"play_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_art_url" text,
	"category" text,
	"language" text DEFAULT 'en',
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"episode_count" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "power_point_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar,
	"receiver_id" varchar NOT NULL,
	"package_key" text NOT NULL,
	"points" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"stripe_payment_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prize_entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"prize_type" text NOT NULL,
	"prize_value" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'available' NOT NULL,
	"redeemed_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"product_ids" integer[] NOT NULL,
	"original_price" integer NOT NULL,
	"bundle_price" integer NOT NULL,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"batch_type" text NOT NULL,
	"target_format" text,
	"config" jsonb,
	"total_items" integer DEFAULT 0 NOT NULL,
	"completed_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"job_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"video_url" text,
	"order" integer NOT NULL,
	"lesson_type" text NOT NULL,
	"estimated_minutes" integer,
	"resources" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"lesson_count" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_brain"."project_context" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"project_name" text NOT NULL,
	"project_type" text,
	"global_tone" text DEFAULT 'narrative',
	"created_at" timestamp with time zone DEFAULT now(),
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"chapter_id" integer,
	"user_id" varchar NOT NULL,
	"note_type" text DEFAULT 'general' NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_quote_pool" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"quote_id" integer NOT NULL,
	"display_order" integer DEFAULT 0,
	"times_displayed" integer DEFAULT 0 NOT NULL,
	"last_displayed_at" timestamp,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_type" text NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"change_description" text,
	"is_auto_save" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"preset_type" text DEFAULT 'book' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"trim_size" text,
	"paper_type" text,
	"font_family" text,
	"font_size" integer,
	"line_spacing" real,
	"margin_inside" real,
	"margin_outside" real,
	"margin_top_bottom" real,
	"has_bleed" boolean DEFAULT false,
	"include_page_numbers" boolean DEFAULT true,
	"include_headers" boolean DEFAULT true,
	"chapter_break_style" text,
	"front_matter_defaults" jsonb DEFAULT '{}'::jsonb,
	"back_matter_defaults" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"genre" text,
	"target_audience" text,
	"cover_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"chapter_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "puzzle_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"author_name" text,
	"description" text,
	"theme" text DEFAULT 'stroke_recovery',
	"trim_size" text DEFAULT '8.5x11',
	"cover_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"last_edited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text,
	"difficulty" text DEFAULT 'easy',
	"position" integer DEFAULT 0 NOT NULL,
	"config" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_code_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"industry" text NOT NULL,
	"target_url" text,
	"background_image_url" text,
	"logo_url" text,
	"qr_color" text DEFAULT '#000000',
	"qr_background_color" text DEFAULT '#FFFFFF',
	"qr_style" text DEFAULT 'square',
	"qr_size" integer DEFAULT 256,
	"generated_qr_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"total_scans" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_code_rotation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"rotation_frequency" text DEFAULT 'daily' NOT NULL,
	"rotation_time" text DEFAULT '00:00',
	"timezone" text DEFAULT 'UTC',
	"min_rating" integer DEFAULT 0,
	"only_approved" boolean DEFAULT true NOT NULL,
	"current_quote_id" integer,
	"last_rotated_at" timestamp,
	"next_rotation_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"quiz_id" integer NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb,
	"time_taken" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_review_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" integer NOT NULL,
	"next_review_at" timestamp DEFAULT now() NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"ease" integer DEFAULT 250 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"last_answered_at" timestamp,
	"last_correct" boolean,
	"retired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"parent_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quote_scan_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"quote_id" integer,
	"scan_date" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"country" text,
	"city" text,
	"device_type" text,
	"referrer" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" integer,
	"text" text NOT NULL,
	"author" text,
	"tone" text DEFAULT 'motivational' NOT NULL,
	"industry" text NOT NULL,
	"target_audience" text,
	"rating" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"ai_model" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radio_dj_intros" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"track_title" text NOT NULL,
	"track_artist" text,
	"track_kind" text DEFAULT 'seed' NOT NULL,
	"voice_id" text NOT NULL,
	"script" text NOT NULL,
	"audio_url" text NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "radio_dj_intros_track_id_unique" UNIQUE("track_id")
);
--> statement-breakpoint
CREATE TABLE "recovery_anchor_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anchor_id" integer,
	"anchor_type" text,
	"disposition" text NOT NULL,
	"category" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_anchors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anchor_type" text NOT NULL,
	"input_text" text NOT NULL,
	"anchor_data" jsonb NOT NULL,
	"audio_url" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_anthem_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anthem_id" integer,
	"disposition" text NOT NULL,
	"category" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_anthems" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"input_data" jsonb NOT NULL,
	"script_data" jsonb NOT NULL,
	"title" text NOT NULL,
	"audio_url" text,
	"duration_ms" integer,
	"bpm" integer,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_id" text,
	"broadcast_consent" boolean DEFAULT false NOT NULL,
	"broadcast_status" text DEFAULT 'none' NOT NULL,
	"broadcast_submitted_at" timestamp,
	"broadcast_reviewed_at" timestamp,
	"broadcast_reviewer_id" varchar,
	"broadcast_rejection_reason" text,
	"artist_name" text,
	"broadcast_vibe" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" text DEFAULT 'philosophy' NOT NULL,
	"tags" text[] DEFAULT '{}',
	"hero_image_url" text,
	"author_name" text DEFAULT 'Nick Kremers' NOT NULL,
	"author_bio" text,
	"status" text DEFAULT 'published' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"read_time" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recovery_centers" (
	"place_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"formatted_address" text NOT NULL,
	"street" text,
	"city" text,
	"state" varchar(8),
	"postal_code" varchar(16),
	"country" varchar(8) DEFAULT 'US',
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"phone" text,
	"website" text,
	"google_maps_url" text,
	"rating" real,
	"reviews_count" integer DEFAULT 0,
	"business_status" text,
	"category" varchar(32) NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb,
	"google_types" jsonb DEFAULT '[]'::jsonb,
	"source_queries" jsonb DEFAULT '[]'::jsonb,
	"metro_slugs" jsonb DEFAULT '[]'::jsonb,
	"raw" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"refreshed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_creator_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"is_subscribed" boolean DEFAULT false NOT NULL,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_creator_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"profile_image_url" text,
	"cover_image_url" text,
	"recovery_start_date" timestamp,
	"recovery_type" text,
	"affected_areas" text[],
	"is_monetized" boolean DEFAULT false NOT NULL,
	"stripe_connect_id" text,
	"tip_jar_enabled" boolean DEFAULT false NOT NULL,
	"subscription_enabled" boolean DEFAULT false NOT NULL,
	"monthly_subscription_price" integer,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_tips" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_date" timestamp,
	"credentials" text[],
	"website_url" text,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_creator_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "recovery_creator_tips" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" varchar,
	"to_creator_id" varchar NOT NULL,
	"story_id" integer,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"stripe_payment_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"platform_fee" integer,
	"creator_payout" integer,
	"paid_out_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_exercise_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_id" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"hold_sec" integer DEFAULT 0 NOT NULL,
	"perceived_effort" integer,
	"spasticity_after" integer,
	"notes" text,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"position" text NOT NULL,
	"level" text NOT NULL,
	"domain" text DEFAULT 'physical' NOT NULL,
	"targets" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"description" text NOT NULL,
	"beginner_sets" integer,
	"beginner_reps" integer,
	"beginner_hold_sec" integer,
	"moderate_sets" integer,
	"moderate_reps" integer,
	"moderate_hold_sec" integer,
	"advanced_sets" integer,
	"advanced_reps" integer,
	"advanced_hold_sec" integer,
	"safety_notes" text,
	"progression_rule" text,
	"sasch_phase" text,
	"video_url" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "recovery_exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recovery_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"outcome" text,
	"notes" text,
	"rating" integer,
	"would_recommend" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"target_days" integer DEFAULT 66 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_journals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"mood" integer,
	"energy" integer,
	"gratitude" text[],
	"wins" text[],
	"struggles" text[],
	"tomorrows_intention" text,
	"tags" text[],
	"is_private" boolean DEFAULT true NOT NULL,
	"entry_type" text,
	"entry_sub_type" text,
	"mood_label" text,
	"energy_level" integer,
	"is_shared" boolean DEFAULT false NOT NULL,
	"shared_at" timestamp with time zone,
	"haiku_lines" text[],
	"photo_url" text,
	"photo_caption" text,
	"voice_url" text,
	"voice_transcript" text,
	"word_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_metro_cache" (
	"metro_slug" varchar(64) PRIMARY KEY NOT NULL,
	"centers_count" integer DEFAULT 0,
	"last_refreshed" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"icon_url" text,
	"badge_url" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_premium_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" varchar NOT NULL,
	"story_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"stripe_payment_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"platform_fee" integer,
	"creator_payout" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"tier" text NOT NULL,
	"difficulty" text NOT NULL,
	"estimated_weeks" integer,
	"module_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recovery_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"time" text NOT NULL,
	"days" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"resource_type" text NOT NULL,
	"category" text NOT NULL,
	"difficulty_level" text,
	"duration" integer,
	"media_url" text,
	"thumbnail_url" text,
	"external_url" text,
	"author_id" varchar,
	"is_official" boolean DEFAULT false NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"content" text NOT NULL,
	"excerpt" text,
	"story_type" text DEFAULT 'journey' NOT NULL,
	"category" text,
	"tags" text[],
	"cover_image_url" text,
	"cover_image_alt" text,
	"media_gallery" jsonb DEFAULT '[]'::jsonb,
	"video_url" text,
	"audio_url" text,
	"recovery_stage" text,
	"days_post_stroke" integer,
	"milestones_achieved" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"premium_price" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"focus_keyphrase" text,
	"seo_score" integer,
	"published_at" timestamp,
	"featured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_stories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recovery_story_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_story_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" text DEFAULT 'heart' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_support_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_support_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"category" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" varchar NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_support_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recovery_university_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"part_number" integer NOT NULL,
	"serial" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_university_certificates_serial_unique" UNIQUE("serial")
);
--> statement-breakpoint
CREATE TABLE "recovery_university_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"chapter" integer NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"passed_at" timestamp,
	"best_score" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_university_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter" integer NOT NULL,
	"part_number" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"required_tier" text DEFAULT 'explorer' NOT NULL,
	"estimated_minutes" integer DEFAULT 25 NOT NULL,
	"body" text NOT NULL,
	"key_takeaways" text[],
	"passing_score" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_university_lessons_chapter_unique" UNIQUE("chapter")
);
--> statement-breakpoint
CREATE TABLE "recovery_university_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option_id" text NOT NULL,
	"hint" text NOT NULL,
	"explanation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_university_quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"chapter" integer NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"answers" jsonb,
	"duration_sec" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"code" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"total_earnings" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_code_id" integer NOT NULL,
	"referred_user_id" varchar NOT NULL,
	"purchase_id" integer,
	"commission" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"reminder_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" text NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"query" text NOT NULL,
	"market" text DEFAULT 'us',
	"serp_result" jsonb,
	"insights" jsonb,
	"insight_score" real,
	"credit_cost" integer DEFAULT 1,
	"saved_to_vault" boolean DEFAULT false,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"stripe_event_id" text,
	"stripe_payment_intent_id" text,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"event_type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"net_amount_cents" integer,
	"platform_fee_cents" integer,
	"creator_payout_cents" integer,
	"creator_id" varchar,
	"product_type" text,
	"product_id" text,
	"tier_name" text,
	"credits_granted" integer,
	"billing_period" text,
	"status" text DEFAULT 'succeeded' NOT NULL,
	"refunded_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "routine_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" text NOT NULL,
	"level" integer DEFAULT 2 NOT NULL,
	"completed_tasks" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "routine_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" text NOT NULL,
	"task_id" text NOT NULL,
	"level" integer NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sasquatch_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"physical" integer NOT NULL,
	"cognitive" integer NOT NULL,
	"speech" integer NOT NULL,
	"emotional" integer NOT NULL,
	"memory" integer NOT NULL,
	"notes" text,
	"taken_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sasquatch_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sasquatch_daily_pings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"ping_date" varchar(10) NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sasquatch_sound_interest" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(40),
	"city" varchar(120),
	"state" varchar(80),
	"story_text" text,
	"song_vibe" text,
	"tier_interest" varchar(32),
	"hear_about" varchar(120),
	"ip" varchar(64),
	"user_agent" text,
	"emailed_nick" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sasquatch_studio_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar(200) NOT NULL,
	"status" varchar(24) DEFAULT 'inactive' NOT NULL,
	"stripe_customer_id" varchar(200),
	"stripe_subscription_id" varchar(200),
	"stripe_price_id" varchar(200),
	"current_period_end" timestamp with time zone,
	"characters_used_this_period" integer DEFAULT 0 NOT NULL,
	"monthly_character_cap" integer DEFAULT 50000 NOT NULL,
	"voices_allowed" integer DEFAULT 3 NOT NULL,
	"tier" varchar(24) DEFAULT 'creator' NOT NULL,
	"billing_period" varchar(12) DEFAULT 'monthly' NOT NULL,
	"albums_allowed" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sasquatch_voice_clones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"elevenlabs_voice_id" varchar(80) NOT NULL,
	"consent_attested" boolean DEFAULT false NOT NULL,
	"consent_text" text,
	"consent_ip" varchar(64),
	"status" varchar(24) DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sasquatch_voice_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"voice_id" varchar(80) NOT NULL,
	"voice_name" varchar(120),
	"kind" varchar(32) DEFAULT 'speech' NOT NULL,
	"title" varchar(200),
	"text" text NOT NULL,
	"character_count" integer NOT NULL,
	"audio_url" varchar(400) NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_cover_designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"thumbnail_url" text,
	"design_data" jsonb NOT NULL,
	"design_type" text DEFAULT 'book_cover' NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"category" text,
	"tags" text[],
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scene_dialogue" (
	"id" serial PRIMARY KEY NOT NULL,
	"scene_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"dialogue_text" text NOT NULL,
	"emotion" text,
	"direction" text,
	"synthesized_audio_url" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"donor_id" varchar,
	"donor_email" varchar,
	"donor_name" text,
	"points" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"stripe_payment_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_fund" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"balance_points" integer DEFAULT 0 NOT NULL,
	"total_funded" integer DEFAULT 0 NOT NULL,
	"total_granted" integer DEFAULT 0 NOT NULL,
	"total_donors" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"points_granted" integer NOT NULL,
	"unlock_id" integer,
	"reason" text,
	"granted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarship_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"story" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"grant_id" integer,
	"reviewed_at" timestamp,
	"reviewer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screenplay_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"logline" text,
	"genre" text,
	"format" text DEFAULT 'feature',
	"beats" jsonb,
	"scenes" jsonb,
	"characters" jsonb,
	"dialogue" jsonb,
	"full_script" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"linked_vault_entry_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"meta_description" text,
	"meta_keywords" text[],
	"og_title" text,
	"og_description" text,
	"og_image" text,
	"canonical_url" text,
	"structured_data" jsonb,
	"robots" text DEFAULT 'index, follow' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"change_frequency" text DEFAULT 'weekly' NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "speech_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"prompt_type" text NOT NULL,
	"prompt_content" text NOT NULL,
	"audio_url" text,
	"image_url" text,
	"expected_response" text,
	"phonemes" text[],
	"hints" text[],
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"month_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"story" text,
	"recovery_date" timestamp,
	"location" text,
	"photo_url" text,
	"picked_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"published_at" timestamp,
	"rejected_at" timestamp,
	"reject_reason" text,
	CONSTRAINT "spotlights_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sra_course_rating_helpful" (
	"review_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sra_course_rating_helpful_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sra_course_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(160),
	"body" text NOT NULL,
	"is_verified_completion" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stand_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"hourly_goal" integer DEFAULT 1 NOT NULL,
	"daily_stand_target" integer DEFAULT 12 NOT NULL,
	"start_hour" integer DEFAULT 8 NOT NULL,
	"end_hour" integer DEFAULT 20 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stand_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"stand_at" timestamp DEFAULT now() NOT NULL,
	"duration" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "studio_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"pipeline_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_stage" text NOT NULL,
	"stages" jsonb NOT NULL,
	"source_asset_id" integer,
	"output_asset_ids" integer[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"studio_type" text NOT NULL,
	"category" text NOT NULL,
	"thumbnail_url" text,
	"template_data" jsonb NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"creator_id" varchar,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"monthly_price" integer DEFAULT 0 NOT NULL,
	"annual_price" integer DEFAULT 0 NOT NULL,
	"stripe_price_id_monthly" text,
	"stripe_price_id_annual" text,
	"stripe_product_id" text,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_credits" integer DEFAULT 0 NOT NULL,
	"max_projects" integer,
	"max_storage_gb" integer,
	"max_team_members" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "survivor_album_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"source" varchar(24) NOT NULL,
	"source_ref" varchar(200),
	"title" varchar(200) NOT NULL,
	"audio_url" varchar(400) NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"artist" varchar(200),
	"description" text,
	"cover_url" varchar(400),
	"is_public" boolean DEFAULT false NOT NULL,
	"share_slug" varchar(64),
	"distribution_meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"horizon" text NOT NULL,
	"domain" text NOT NULL,
	"goal" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"assessment_id" integer,
	"plan" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapeutic_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"subcategory" text,
	"difficulty" text NOT NULL,
	"target_area" text[],
	"instructions" text,
	"video_url" text,
	"thumbnail_url" text,
	"game_type" text,
	"game_config" jsonb,
	"benefits" text[],
	"contraindications" text[],
	"estimated_minutes" integer,
	"calories_burned" integer,
	"equipment_needed" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "therapeutic_exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "therapist_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"title" text NOT NULL,
	"license_number" text NOT NULL,
	"license_state" text NOT NULL,
	"years_experience" integer,
	"specialties" text[],
	"bio" text,
	"portfolio_url" text,
	"document_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" varchar,
	"reviewer_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"license_number" text,
	"license_state" text,
	"license_type" text,
	"specializations" text[],
	"years_experience" integer,
	"bio" text,
	"education" text,
	"certifications" text[],
	"accepting_patients" boolean DEFAULT true NOT NULL,
	"hourly_rate" integer,
	"available_hours" jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"rating" integer,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "therapist_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "therapy_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"therapist_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"session_type" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"meeting_url" text,
	"recording_url" text,
	"notes" text,
	"patient_notes" text,
	"exercises_prescribed" jsonb,
	"progress_assessment" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trending_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"topic" text NOT NULL,
	"search_volume" integer,
	"trend" text,
	"related_keywords" text[],
	"source" text DEFAULT 'serp',
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"feature_key" text NOT NULL,
	"studio_type" text,
	"credits_cost" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"duration_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ai_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"preferred_tier_id" integer,
	"preferred_voice_id" integer,
	"custom_voice_profile" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ai_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_key" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_curriculum_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"chapter_id" integer NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"program_id" integer NOT NULL,
	"current_module_id" integer,
	"current_lesson_id" integer,
	"completed_module_ids" integer[],
	"completed_lesson_ids" integer[],
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"recovery_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"graduated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"habit_id" integer NOT NULL,
	"custom_name" text,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"target_days" integer DEFAULT 66 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_completions" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_milestone_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"milestone_id" integer NOT NULL,
	"celebration_notes" text,
	"achieved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_personas" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"archetype_key" text NOT NULL,
	"name" text NOT NULL,
	"creed" text NOT NULL,
	"why" text,
	"trigger_cue" text,
	"voice_preset" text,
	"accent_color" text DEFAULT '#C9941A' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text,
	"display_name" text,
	"avatar_url" text,
	"banner_url" text,
	"profile_visibility" text DEFAULT 'public' NOT NULL,
	"show_recovery_progress" boolean DEFAULT true NOT NULL,
	"show_activity_feed" boolean DEFAULT true NOT NULL,
	"allow_direct_messages" boolean DEFAULT true NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"reminder_notifications" boolean DEFAULT true NOT NULL,
	"community_notifications" boolean DEFAULT true NOT NULL,
	"achievement_notifications" boolean DEFAULT true NOT NULL,
	"font_size" text DEFAULT 'medium' NOT NULL,
	"high_contrast" boolean DEFAULT false NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"screen_reader" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"accent_color" text DEFAULT '#FF6B35' NOT NULL,
	"preferred_exercise_time" text,
	"recovery_focus" text[],
	"difficulty_level" text DEFAULT 'adaptive' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_settings_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" timestamp,
	"total_active_days" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"tier_id" integer,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"billing_period" text DEFAULT 'monthly' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"last_credit_grant_at" timestamp,
	"monthly_credits_quota" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"template_id" text DEFAULT 'blank' NOT NULL,
	"industry" text,
	"business_name" text,
	"business_description" text,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#C9941A',
	"secondary_color" text DEFAULT '#1a1a1a',
	"accent_color" text DEFAULT '#FAF8F3',
	"font_heading" text DEFAULT 'Playfair Display',
	"font_body" text DEFAULT 'Inter',
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[],
	"og_image_url" text,
	"analytics_id" text,
	"header_code" text,
	"footer_code" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_websites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"workflow_id" integer NOT NULL,
	"purchase_id" integer,
	"customizations" jsonb,
	"times_used" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"content_json" jsonb,
	"summary" text,
	"tags" text[],
	"linked_project_id" integer,
	"linked_asset_ids" text[],
	"inspiration_score" real,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_entry_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"folder_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer,
	"category" text,
	"color" text,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"video_url" text,
	"duration" integer,
	"timeline" jsonb,
	"assets" jsonb,
	"aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"resolution" text DEFAULT '1080p' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_session_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"joined_at" timestamp,
	"left_at" timestamp,
	"status" text DEFAULT 'invited' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" varchar NOT NULL,
	"session_type" text NOT NULL,
	"title" text,
	"description" text,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration" integer,
	"max_participants" integer DEFAULT 2 NOT NULL,
	"meeting_url" text,
	"room_id" text,
	"recording_url" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitals_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"heart_rate" integer,
	"temperature" text,
	"weight" text,
	"blood_sugar" integer,
	"oxygen_level" integer,
	"pain_level" integer,
	"sleep_hours" text,
	"sleep_quality" integer,
	"notes" text,
	"measured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocal_renders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"lyrics_id" integer,
	"singer_profile" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"audio_url" text,
	"phoneme_map" jsonb,
	"style" text,
	"pitch" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_clones" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"voice_type" text NOT NULL,
	"gender" text,
	"age_range" text,
	"accent" text,
	"source_audio_url" text,
	"voice_model_id" text,
	"preview_audio_url" text,
	"style_settings" jsonb,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"consent_text" text,
	"consent_signed_at" timestamp,
	"consent_ip" varchar(64),
	"sample_duration_sec" integer,
	"deleted_at" timestamp,
	"stripe_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_clones_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "wearable_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"device_id" text,
	"device_name" text,
	"last_sync_at" timestamp,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"metrics_enabled" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wearable_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"connection_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"value" integer NOT NULL,
	"unit" text NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(32) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(128),
	"status" varchar(16) DEFAULT 'received' NOT NULL,
	"payload_hash" varchar(128),
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text,
	"featured_image_url" text,
	"author_name" text,
	"category" text,
	"tags" text[],
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"phone" text,
	"message" text,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"page_type" text DEFAULT 'page' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"content" jsonb DEFAULT '[]'::jsonb,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_in_navigation" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "white_label_api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"white_label_id" integer NOT NULL,
	"api_provider" text NOT NULL,
	"endpoint" text,
	"tokens_used" integer DEFAULT 0,
	"cost_usd" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "white_label_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"brand_name" text NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#C9941A',
	"accent_color" text DEFAULT '#1a1a1a',
	"background_color" text DEFAULT '#FAF8F3',
	"custom_domain" text,
	"domain_verified" boolean DEFAULT false,
	"openai_api_key" text,
	"anthropic_api_key" text,
	"gemini_api_key" text,
	"grok_api_key" text,
	"perplexity_api_key" text,
	"stability_api_key" text,
	"remove_bg_api_key" text,
	"huggingface_api_key" text,
	"replicate_api_key" text,
	"cohere_api_key" text,
	"mistral_api_key" text,
	"together_api_key" text,
	"deepseek_api_key" text,
	"groq_api_key" text,
	"eleven_labs_api_key" text,
	"runway_api_key" text,
	"midjourney_api_key" text,
	"leonardo_api_key" text,
	"github_api_key" text,
	"serp_api_key" text,
	"aws_access_key" text,
	"aws_secret_key" text,
	"cloudflare_api_key" text,
	"hide_kreaite_branding" boolean DEFAULT false,
	"custom_footer_text" text,
	"custom_terms_url" text,
	"custom_privacy_url" text,
	"creator_revenue_share" integer DEFAULT 85,
	"platform_revenue_share" integer DEFAULT 15,
	"subscription_tier" text DEFAULT 'basic',
	"status" text DEFAULT 'active',
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"parent_id" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workflow_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"step_index" integer NOT NULL,
	"job_type" text NOT NULL,
	"input_data" jsonb,
	"output_data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"buyer_id" varchar NOT NULL,
	"price" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"category_id" integer,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"full_description" text NOT NULL,
	"thumbnail_url" text,
	"preview_video_url" text,
	"steps" jsonb NOT NULL,
	"estimated_duration" integer,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"studio_type" text NOT NULL,
	"search_keywords" text[],
	"ai_generated_tags" text[],
	"target_audience" text[],
	"use_cases" text[],
	"output_types" text[],
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"kreaite_can_use" boolean DEFAULT true NOT NULL,
	"kreaite_feature_level" text DEFAULT 'standard',
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"total_usage" integer DEFAULT 0 NOT NULL,
	"average_rating" integer,
	"review_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_kreaite_official" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"invited_by" varchar,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" varchar NOT NULL,
	"logo_url" text,
	"description" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"tier_id" integer,
	"stripe_subscription_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "book_chapters" DROP CONSTRAINT "book_chapters_slug_unique";--> statement-breakpoint
ALTER TABLE "book_chapters" ADD COLUMN "book_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "og_image_url" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "price_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "audio_url" text;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "is_original" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "crisis_flag" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD COLUMN "answer_post_id" integer;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "preferred_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "pronouns" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "deficits" jsonb;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_goal" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "equipment" text[];--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mobility_aids" text[];--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "daily_time_budget_minutes" integer DEFAULT 20;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "energy_pattern" text DEFAULT 'morning';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "has_caregiver" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "caregiver_email" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "caregiver_relationship" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "big_button_mode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "dyslexia_font" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "reduced_motion" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "voice_prefers_tts" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "intake_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "current_intake_step" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" varchar DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connect_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connect_onboarded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "creator_payout_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "spotlight_opted_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "spotlight_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "spotlight_consent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified_therapist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "therapist_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "therapist_credentials" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "therapist_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "therapist_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "accepts_power_points" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_slug" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_daily_gift_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_style" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_generated_prompt" text;--> statement-breakpoint
ALTER TABLE "accountability_pods" ADD CONSTRAINT "accountability_pods_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_post_id_activity_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."activity_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_media" ADD CONSTRAINT "activity_media_post_id_activity_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."activity_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_posts" ADD CONSTRAINT "activity_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_posts" ADD CONSTRAINT "activity_posts_pod_id_accountability_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."accountability_pods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_post_id_activity_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."activity_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_music_jobs" ADD CONSTRAINT "ai_music_jobs_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_music_jobs" ADD CONSTRAINT "ai_music_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_usage" ADD CONSTRAINT "ai_provider_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_voice_presets" ADD CONSTRAINT "ai_voice_presets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_writing_jobs" ADD CONSTRAINT "ai_writing_jobs_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_writing_jobs" ADD CONSTRAINT "ai_writing_jobs_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anchor_retention_signals" ADD CONSTRAINT "anchor_retention_signals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anchor_retention_signals" ADD CONSTRAINT "anchor_retention_signals_anchor_id_recovery_anchors_id_fk" FOREIGN KEY ("anchor_id") REFERENCES "public"."recovery_anchors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anchor_streaks" ADD CONSTRAINT "anchor_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_registry" ADD CONSTRAINT "asset_registry_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiobook_chapters" ADD CONSTRAINT "audiobook_chapters_audiobook_id_audiobook_projects_id_fk" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobook_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiobook_chapters" ADD CONSTRAINT "audiobook_chapters_source_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("source_chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiobook_projects" ADD CONSTRAINT "audiobook_projects_source_project_id_publishing_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiobook_projects" ADD CONSTRAINT "audiobook_projects_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiobook_projects" ADD CONSTRAINT "audiobook_projects_narrator_voice_id_voice_clones_id_fk" FOREIGN KEY ("narrator_voice_id") REFERENCES "public"."voice_clones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_earnings" ADD CONSTRAINT "author_earnings_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_earnings" ADD CONSTRAINT "author_earnings_order_id_book_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."book_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_earnings" ADD CONSTRAINT "author_earnings_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_earnings" ADD CONSTRAINT "author_earnings_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_earnings" ADD CONSTRAINT "author_earnings_payout_id_creator_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."creator_payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_brain"."author_memory" ADD CONSTRAINT "author_memory_project_id_project_context_id_fk" FOREIGN KEY ("project_id") REFERENCES "author_brain"."project_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_profiles" ADD CONSTRAINT "author_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_source_vault_entry_id_vault_entries_id_fk" FOREIGN KEY ("source_vault_entry_id") REFERENCES "public"."vault_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_reactions" ADD CONSTRAINT "blog_post_reactions_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_reactions" ADD CONSTRAINT "blog_post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_cover_designs" ADD CONSTRAINT "book_cover_designs_publishing_project_id_book_publishing_projects_id_fk" FOREIGN KEY ("publishing_project_id") REFERENCES "public"."book_publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_editions" ADD CONSTRAINT "book_editions_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_image_assets" ADD CONSTRAINT "book_image_assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_image_placements" ADD CONSTRAINT "book_image_placements_project_id_book_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."book_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_image_placements" ADD CONSTRAINT "book_image_placements_image_asset_id_book_image_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."book_image_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_image_placements" ADD CONSTRAINT "book_image_placements_section_id_book_project_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."book_project_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_project_sections" ADD CONSTRAINT "book_project_sections_project_id_book_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."book_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_projects" ADD CONSTRAINT "book_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_publishing_projects" ADD CONSTRAINT "book_publishing_projects_book_project_id_book_projects_id_fk" FOREIGN KEY ("book_project_id") REFERENCES "public"."book_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_publishing_projects" ADD CONSTRAINT "book_publishing_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_order_id_book_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."book_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_website_leads" ADD CONSTRAINT "book_website_leads_website_id_book_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."book_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_website_pages" ADD CONSTRAINT "book_website_pages_website_id_book_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."book_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_websites" ADD CONSTRAINT "book_websites_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_websites" ADD CONSTRAINT "book_websites_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_gym_completions" ADD CONSTRAINT "brain_gym_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_active_members" ADD CONSTRAINT "buddy_active_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_active_members" ADD CONSTRAINT "buddy_active_members_pair_id_buddy_pairs_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."buddy_pairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_pairs" ADD CONSTRAINT "buddy_pairs_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_pairs" ADD CONSTRAINT "buddy_pairs_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_profiles" ADD CONSTRAINT "buddy_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_links" ADD CONSTRAINT "caregiver_links_caregiver_id_users_id_fk" FOREIGN KEY ("caregiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_links" ADD CONSTRAINT "caregiver_links_survivor_id_users_id_fk" FOREIGN KEY ("survivor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_sessions" ADD CONSTRAINT "circuit_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_assignments" ADD CONSTRAINT "classroom_assignments_classroom_course_id_classroom_courses_id_fk" FOREIGN KEY ("classroom_course_id") REFERENCES "public"."classroom_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_assignments" ADD CONSTRAINT "classroom_assignments_lesson_id_creator_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."creator_course_lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_courses" ADD CONSTRAINT "classroom_courses_creator_course_id_creator_courses_id_fk" FOREIGN KEY ("creator_course_id") REFERENCES "public"."creator_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_course_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."course_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_posts" ADD CONSTRAINT "cohort_posts_cohort_id_course_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."course_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_posts" ADD CONSTRAINT "cohort_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compass_entries" ADD CONSTRAINT "compass_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compass_goals" ADD CONSTRAINT "compass_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_actions" ADD CONSTRAINT "conversation_actions_session_id_conversation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_actions" ADD CONSTRAINT "conversation_actions_message_id_conversation_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_session_id_conversation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_builder_courses" ADD CONSTRAINT "course_builder_courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_builder_lessons" ADD CONSTRAINT "course_builder_lessons_module_id_course_builder_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_builder_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_builder_modules" ADD CONSTRAINT "course_builder_modules_course_id_course_builder_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course_builder_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_builder_questions" ADD CONSTRAINT "course_builder_questions_quiz_id_course_builder_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_builder_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_builder_quizzes" ADD CONSTRAINT "course_builder_quizzes_lesson_id_course_builder_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_builder_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_category_tags" ADD CONSTRAINT "course_category_tags_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_category_tags" ADD CONSTRAINT "course_category_tags_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_cohorts" ADD CONSTRAINT "course_cohorts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_credit_unlocks" ADD CONSTRAINT "course_credit_unlocks_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_credit_unlocks" ADD CONSTRAINT "course_credit_unlocks_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_course_builder_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course_builder_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_presets" ADD CONSTRAINT "course_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_course_id_creator_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."creator_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_course_builder_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course_builder_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_analytics" ADD CONSTRAINT "creator_analytics_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_course_lessons" ADD CONSTRAINT "creator_course_lessons_module_id_creator_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."creator_course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_course_modules" ADD CONSTRAINT "creator_course_modules_course_id_creator_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."creator_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_course_modules" ADD CONSTRAINT "creator_course_modules_source_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("source_chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_courses" ADD CONSTRAINT "creator_courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_courses" ADD CONSTRAINT "creator_courses_source_project_id_publishing_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_payouts" ADD CONSTRAINT "creator_payouts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_storefronts" ADD CONSTRAINT "creator_storefronts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_workflows" ADD CONSTRAINT "creator_workflows_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_wallets" ADD CONSTRAINT "credit_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_chapters" ADD CONSTRAINT "curriculum_chapters_part_id_curriculum_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."curriculum_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dj_presets" ADD CONSTRAINT "dj_presets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_merge_sessions" ADD CONSTRAINT "doc_merge_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_snippets" ADD CONSTRAINT "doc_snippets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_snippets" ADD CONSTRAINT "doc_snippets_source_id_doc_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."doc_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_sources" ADD CONSTRAINT "doc_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_nodes" ADD CONSTRAINT "doctrine_nodes_outline_id_doctrine_outlines_id_fk" FOREIGN KEY ("outline_id") REFERENCES "public"."doctrine_outlines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_nodes" ADD CONSTRAINT "doctrine_nodes_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_outlines" ADD CONSTRAINT "doctrine_outlines_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_outlines" ADD CONSTRAINT "doctrine_outlines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_goals" ADD CONSTRAINT "exercise_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_prescriptions" ADD CONSTRAINT "exercise_prescriptions_assignment_id_patient_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."patient_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_prescriptions" ADD CONSTRAINT "exercise_prescriptions_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_prescriptions" ADD CONSTRAINT "exercise_prescriptions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_scores" ADD CONSTRAINT "exercise_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_scores" ADD CONSTRAINT "exercise_scores_exercise_id_therapeutic_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."therapeutic_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_exercise_id_therapeutic_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."therapeutic_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_prescription_id_exercise_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."exercise_prescriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flicker_logs" ADD CONSTRAINT "flicker_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_post_media" ADD CONSTRAINT "forum_post_media_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_video_analyses" ADD CONSTRAINT "free_video_analyses_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_logos" ADD CONSTRAINT "generated_logos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_logos" ADD CONSTRAINT "generated_logos_website_id_user_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."user_websites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_sender_blocks" ADD CONSTRAINT "gift_sender_blocks_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_sender_blocks" ADD CONSTRAINT "gift_sender_blocks_blocked_sender_id_users_id_fk" FOREIGN KEY ("blocked_sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_habit_id_user_habits_id_fk" FOREIGN KEY ("user_habit_id") REFERENCES "public"."user_habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydration_goals" ADD CONSTRAINT "hydration_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydration_logs" ADD CONSTRAINT "hydration_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideation_links" ADD CONSTRAINT "ideation_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideation_links" ADD CONSTRAINT "ideation_links_source_entry_id_vault_entries_id_fk" FOREIGN KEY ("source_entry_id") REFERENCES "public"."vault_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideation_links" ADD CONSTRAINT "ideation_links_target_entry_id_vault_entries_id_fk" FOREIGN KEY ("target_entry_id") REFERENCES "public"."vault_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_projects" ADD CONSTRAINT "image_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_library" ADD CONSTRAINT "inspiration_library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_milestones" ADD CONSTRAINT "journey_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_milestones" ADD CONSTRAINT "journey_milestones_linked_story_id_recovery_stories_id_fk" FOREIGN KEY ("linked_story_id") REFERENCES "public"."recovery_stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legend_drafts" ADD CONSTRAINT "legend_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legend_responses" ADD CONSTRAINT "legend_responses_legend_id_legend_drafts_id_fk" FOREIGN KEY ("legend_id") REFERENCES "public"."legend_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legend_responses" ADD CONSTRAINT "legend_responses_prompt_id_legend_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."legend_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_course_builder_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_builder_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_stories" ADD CONSTRAINT "life_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lulu_print_jobs" ADD CONSTRAINT "lulu_print_jobs_order_id_book_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."book_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lulu_print_jobs" ADD CONSTRAINT "lulu_print_jobs_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_drafts" ADD CONSTRAINT "lyrics_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manuscript_assets" ADD CONSTRAINT "manuscript_assets_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manuscript_assets" ADD CONSTRAINT "manuscript_assets_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manuscript_chapters" ADD CONSTRAINT "manuscript_chapters_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_category_id_marketplace_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."marketplace_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_project_id_media_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."media_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_projects" ADD CONSTRAINT "media_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_sessions" ADD CONSTRAINT "mix_sessions_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motivation_artifacts" ADD CONSTRAINT "motivation_artifacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motivation_usage" ADD CONSTRAINT "motivation_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_characters" ADD CONSTRAINT "movie_characters_movie_id_movie_projects_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movie_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_characters" ADD CONSTRAINT "movie_characters_voice_clone_id_voice_clones_id_fk" FOREIGN KEY ("voice_clone_id") REFERENCES "public"."voice_clones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_projects" ADD CONSTRAINT "movie_projects_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_scenes" ADD CONSTRAINT "movie_scenes_movie_id_movie_projects_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movie_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_exports" ADD CONSTRAINT "music_exports_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_exports" ADD CONSTRAINT "music_exports_mix_session_id_mix_sessions_id_fk" FOREIGN KEY ("mix_session_id") REFERENCES "public"."mix_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_lyrics" ADD CONSTRAINT "music_lyrics_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_projects" ADD CONSTRAINT "music_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_sandbox_projects" ADD CONSTRAINT "music_sandbox_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_stems" ADD CONSTRAINT "music_stems_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_videos" ADD CONSTRAINT "music_videos_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_videos" ADD CONSTRAINT "music_videos_export_id_music_exports_id_fk" FOREIGN KEY ("export_id") REFERENCES "public"."music_exports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "never_zero_audits" ADD CONSTRAINT "never_zero_audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "never_zero_logs" ADD CONSTRAINT "never_zero_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "never_zero_logs" ADD CONSTRAINT "never_zero_logs_habit_id_recovery_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."recovery_habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_drip_queue" ADD CONSTRAINT "newsletter_drip_queue_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_book_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."book_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_edition_id_book_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."book_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_members" ADD CONSTRAINT "pod_members_pod_id_accountability_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."accountability_pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_members" ADD CONSTRAINT "pod_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_point_gifts" ADD CONSTRAINT "power_point_gifts_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_point_gifts" ADD CONSTRAINT "power_point_gifts_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prize_entitlements" ADD CONSTRAINT "prize_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_lessons" ADD CONSTRAINT "program_lessons_module_id_program_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."program_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_modules" ADD CONSTRAINT "program_modules_program_id_recovery_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."recovery_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_publishing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."publishing_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_chapter_id_manuscript_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_quote_pool" ADD CONSTRAINT "project_quote_pool_project_id_qr_code_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."qr_code_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_quote_pool" ADD CONSTRAINT "project_quote_pool_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_presets" ADD CONSTRAINT "publishing_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_projects" ADD CONSTRAINT "publishing_projects_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_books" ADD CONSTRAINT "puzzle_books_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_book_id_puzzle_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."puzzle_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_projects" ADD CONSTRAINT "qr_code_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_rotation_settings" ADD CONSTRAINT "qr_code_rotation_settings_project_id_qr_code_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."qr_code_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_rotation_settings" ADD CONSTRAINT "qr_code_rotation_settings_current_quote_id_quotes_id_fk" FOREIGN KEY ("current_quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_course_builder_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_builder_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_scan_analytics" ADD CONSTRAINT "quote_scan_analytics_project_id_qr_code_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."qr_code_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_scan_analytics" ADD CONSTRAINT "quote_scan_analytics_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_category_id_quote_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."quote_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_anchor_audit" ADD CONSTRAINT "recovery_anchor_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_anchors" ADD CONSTRAINT "recovery_anchors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_anthem_audit" ADD CONSTRAINT "recovery_anthem_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_anthems" ADD CONSTRAINT "recovery_anthems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_follows" ADD CONSTRAINT "recovery_creator_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_follows" ADD CONSTRAINT "recovery_creator_follows_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_profiles" ADD CONSTRAINT "recovery_creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_tips" ADD CONSTRAINT "recovery_creator_tips_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_tips" ADD CONSTRAINT "recovery_creator_tips_to_creator_id_users_id_fk" FOREIGN KEY ("to_creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_creator_tips" ADD CONSTRAINT "recovery_creator_tips_story_id_recovery_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."recovery_stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_exercise_logs" ADD CONSTRAINT "recovery_exercise_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_exercise_logs" ADD CONSTRAINT "recovery_exercise_logs_exercise_id_recovery_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."recovery_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_experiments" ADD CONSTRAINT "recovery_experiments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_journals" ADD CONSTRAINT "recovery_journals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_premium_purchases" ADD CONSTRAINT "recovery_premium_purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_premium_purchases" ADD CONSTRAINT "recovery_premium_purchases_story_id_recovery_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."recovery_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_reminders" ADD CONSTRAINT "recovery_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_resources" ADD CONSTRAINT "recovery_resources_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_stories" ADD CONSTRAINT "recovery_stories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_story_comments" ADD CONSTRAINT "recovery_story_comments_story_id_recovery_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."recovery_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_story_comments" ADD CONSTRAINT "recovery_story_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_story_reactions" ADD CONSTRAINT "recovery_story_reactions_story_id_recovery_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."recovery_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_story_reactions" ADD CONSTRAINT "recovery_story_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_support_group_members" ADD CONSTRAINT "recovery_support_group_members_group_id_recovery_support_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."recovery_support_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_support_group_members" ADD CONSTRAINT "recovery_support_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_support_groups" ADD CONSTRAINT "recovery_support_groups_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_university_certificates" ADD CONSTRAINT "recovery_university_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_university_lesson_progress" ADD CONSTRAINT "recovery_university_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_university_questions" ADD CONSTRAINT "recovery_university_questions_lesson_id_recovery_university_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."recovery_university_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_university_quiz_attempts" ADD CONSTRAINT "recovery_university_quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_reminder_id_recovery_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."recovery_reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_queries" ADD CONSTRAINT "research_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_feedback" ADD CONSTRAINT "routine_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sasquatch_assessments" ADD CONSTRAINT "sasquatch_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_cover_designs" ADD CONSTRAINT "saved_cover_designs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_dialogue" ADD CONSTRAINT "scene_dialogue_scene_id_movie_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."movie_scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_dialogue" ADD CONSTRAINT "scene_dialogue_character_id_movie_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."movie_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_contributions" ADD CONSTRAINT "scholarship_contributions_donor_id_users_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_grants" ADD CONSTRAINT "scholarship_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_requests" ADD CONSTRAINT "scholarship_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_requests" ADD CONSTRAINT "scholarship_requests_grant_id_scholarship_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."scholarship_grants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenplay_projects" ADD CONSTRAINT "screenplay_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sra_course_rating_helpful" ADD CONSTRAINT "sra_course_rating_helpful_review_id_sra_course_ratings_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."sra_course_ratings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sra_course_rating_helpful" ADD CONSTRAINT "sra_course_rating_helpful_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sra_course_ratings" ADD CONSTRAINT "sra_course_ratings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sra_course_ratings" ADD CONSTRAINT "sra_course_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_goals" ADD CONSTRAINT "stand_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_logs" ADD CONSTRAINT "stand_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_pipelines" ADD CONSTRAINT "studio_pipelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_templates" ADD CONSTRAINT "studio_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_goals" ADD CONSTRAINT "survivor_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_plans" ADD CONSTRAINT "survivor_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_applications" ADD CONSTRAINT "therapist_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_applications" ADD CONSTRAINT "therapist_applications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_profiles" ADD CONSTRAINT "therapist_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_assignment_id_patient_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."patient_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_preferred_tier_id_ai_quality_tiers_id_fk" FOREIGN KEY ("preferred_tier_id") REFERENCES "public"."ai_quality_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_preferred_voice_id_ai_voice_presets_id_fk" FOREIGN KEY ("preferred_voice_id") REFERENCES "public"."ai_voice_presets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_curriculum_progress" ADD CONSTRAINT "user_curriculum_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_curriculum_progress" ADD CONSTRAINT "user_curriculum_progress_chapter_id_curriculum_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."curriculum_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrollments" ADD CONSTRAINT "user_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrollments" ADD CONSTRAINT "user_enrollments_program_id_recovery_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."recovery_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrollments" ADD CONSTRAINT "user_enrollments_current_module_id_program_modules_id_fk" FOREIGN KEY ("current_module_id") REFERENCES "public"."program_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrollments" ADD CONSTRAINT "user_enrollments_current_lesson_id_program_lessons_id_fk" FOREIGN KEY ("current_lesson_id") REFERENCES "public"."program_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habits" ADD CONSTRAINT "user_habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habits" ADD CONSTRAINT "user_habits_habit_id_recovery_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."recovery_habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_logs" ADD CONSTRAINT "user_milestone_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_logs" ADD CONSTRAINT "user_milestone_logs_milestone_id_recovery_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."recovery_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_personas" ADD CONSTRAINT "user_personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_websites" ADD CONSTRAINT "user_websites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workflows" ADD CONSTRAINT "user_workflows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workflows" ADD CONSTRAINT "user_workflows_workflow_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workflows" ADD CONSTRAINT "user_workflows_purchase_id_workflow_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."workflow_purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entry_folders" ADD CONSTRAINT "vault_entry_folders_entry_id_vault_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."vault_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entry_folders" ADD CONSTRAINT "vault_entry_folders_folder_id_vault_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."vault_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_folders" ADD CONSTRAINT "vault_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_projects" ADD CONSTRAINT "video_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_session_participants" ADD CONSTRAINT "video_session_participants_session_id_video_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."video_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_session_participants" ADD CONSTRAINT "video_session_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals_logs" ADD CONSTRAINT "vitals_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocal_renders" ADD CONSTRAINT "vocal_renders_project_id_music_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."music_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocal_renders" ADD CONSTRAINT "vocal_renders_lyrics_id_music_lyrics_id_fk" FOREIGN KEY ("lyrics_id") REFERENCES "public"."music_lyrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_clones" ADD CONSTRAINT "voice_clones_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_connections" ADD CONSTRAINT "wearable_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_metrics" ADD CONSTRAINT "wearable_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_metrics" ADD CONSTRAINT "wearable_metrics_connection_id_wearable_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."wearable_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_blog_posts" ADD CONSTRAINT "website_blog_posts_website_id_user_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."user_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_leads" ADD CONSTRAINT "website_leads_website_id_user_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."user_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_pages" ADD CONSTRAINT "website_pages_website_id_user_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."user_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "white_label_api_usage" ADD CONSTRAINT "white_label_api_usage_white_label_id_white_label_configs_id_fk" FOREIGN KEY ("white_label_id") REFERENCES "public"."white_label_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_jobs" ADD CONSTRAINT "workflow_jobs_workflow_id_creator_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."creator_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_purchases" ADD CONSTRAINT "workflow_purchases_workflow_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_purchases" ADD CONSTRAINT "workflow_purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_reviews" ADD CONSTRAINT "workflow_reviews_workflow_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_reviews" ADD CONSTRAINT "workflow_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_category_id_workflow_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."workflow_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_comments_post" ON "activity_comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_comments_author" ON "activity_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_activity_posts_author" ON "activity_posts" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_posts_visibility" ON "activity_posts" USING btree ("visibility","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_reactions_post" ON "activity_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_activity_reactions_user" ON "activity_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_user" ON "admin_audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_action" ON "admin_audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_created" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "anchor_retention_anchor" ON "anchor_retention_signals" USING btree ("anchor_id");--> statement-breakpoint
CREATE INDEX "anchor_retention_user" ON "anchor_retention_signals" USING btree ("user_id","signaled_at");--> statement-breakpoint
CREATE INDEX "idx_asset_user_type" ON "asset_registry" USING btree ("user_id","asset_type");--> statement-breakpoint
CREATE INDEX "idx_asset_studio" ON "asset_registry" USING btree ("source_studio");--> statement-breakpoint
CREATE INDEX "bgc_user_idx" ON "brain_gym_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bgc_challenge_idx" ON "brain_gym_completions" USING btree ("challenge_date","duration_sec");--> statement-breakpoint
CREATE UNIQUE INDEX "buddy_pairs_active_unique" ON "buddy_pairs" USING btree ("user1_id","user2_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_campfire_room_created" ON "campfire_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_campfire_user_created" ON "campfire_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_campfire_presence" ON "campfire_presence" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_campfire_presence_seen" ON "campfire_presence" USING btree ("room_id","last_seen");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_campfire_reaction" ON "campfire_reactions" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "idx_campfire_reaction_msg" ON "campfire_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_campfire_room_prompt" ON "campfire_room_prompts" USING btree ("room_id","prompt_date");--> statement-breakpoint
CREATE UNIQUE INDEX "cgl_pair_idx" ON "caregiver_links" USING btree ("caregiver_id","survivor_id");--> statement-breakpoint
CREATE INDEX "cgl_caregiver_idx" ON "caregiver_links" USING btree ("caregiver_id","status");--> statement-breakpoint
CREATE INDEX "cgl_survivor_idx" ON "caregiver_links" USING btree ("survivor_id","status");--> statement-breakpoint
CREATE INDEX "idx_circuit_sessions_user_started" ON "circuit_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_circuit_sessions_user_completed" ON "circuit_sessions" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "idx_message_session" ON "conversation_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_user_studio" ON "conversation_sessions" USING btree ("user_id","studio");--> statement-breakpoint
CREATE INDEX "ccu_buyer_idx" ON "course_credit_unlocks" USING btree ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "ccu_creator_idx" ON "course_credit_unlocks" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ccu_unique_unlock_idx" ON "course_credit_unlocks" USING btree ("buyer_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_user" ON "course_enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_course" ON "course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_creator_analytics_date" ON "creator_analytics" USING btree ("creator_id","date");--> statement-breakpoint
CREATE INDEX "idx_creator_earnings_creator" ON "creator_earnings" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX "idx_creator_earnings_payout" ON "creator_earnings" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "idx_credit_ledger_user" ON "credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_credit_ledger_created" ON "credit_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_direct_messages_conversation" ON "direct_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_direct_messages_sender" ON "direct_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_doctrine_outline" ON "doctrine_nodes" USING btree ("outline_id");--> statement-breakpoint
CREATE INDEX "idx_doctrine_chapter" ON "doctrine_nodes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_user" ON "exercise_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "idx_free_video_analyses_status" ON "free_video_analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_free_video_analyses_moderation" ON "free_video_analyses" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "idx_free_video_analyses_email" ON "free_video_analyses" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_free_video_analyses_token" ON "free_video_analyses" USING btree ("public_token");--> statement-breakpoint
CREATE UNIQUE INDEX "gsb_unique_idx" ON "gift_sender_blocks" USING btree ("receiver_id","blocked_sender_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_progress_user" ON "lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_progress_lesson" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lvt_unique_idx" ON "lesson_video_translations" USING btree ("video_id","locale");--> statement-breakpoint
CREATE INDEX "lyrics_drafts_user_created" ON "lyrics_drafts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lyrics_drafts_share_id" ON "lyrics_drafts" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "motivation_artifacts_user_created" ON "motivation_artifacts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "motivation_usage_pk" ON "motivation_usage" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "never_zero_audits_user_date_idx" ON "never_zero_audits" USING btree ("user_id","audit_date");--> statement-breakpoint
CREATE INDEX "never_zero_logs_user_created_idx" ON "never_zero_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_listing" ON "order_items" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "ppg_receiver_idx" ON "power_point_gifts" USING btree ("receiver_id","created_at");--> statement-breakpoint
CREATE INDEX "ppg_sender_idx" ON "power_point_gifts" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_prize_entitlements_user" ON "prize_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prize_entitlements_status" ON "prize_entitlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notes_project" ON "project_notes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_notes_chapter" ON "project_notes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_project_versions_project" ON "project_versions" USING btree ("project_type","project_id");--> statement-breakpoint
CREATE INDEX "quiz_review_user_idx" ON "quiz_review_queue" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_review_user_question_unique" ON "quiz_review_queue" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "quiz_review_due_idx" ON "quiz_review_queue" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "radio_dj_intros_kind_idx" ON "radio_dj_intros" USING btree ("track_kind","created_at");--> statement-breakpoint
CREATE INDEX "recovery_anchor_audit_user" ON "recovery_anchor_audit" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "recovery_anchor_audit_disposition" ON "recovery_anchor_audit" USING btree ("disposition","created_at");--> statement-breakpoint
CREATE INDEX "recovery_anchors_user_created" ON "recovery_anchors" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_anchors_share_id" ON "recovery_anchors" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "recovery_anthem_audit_user" ON "recovery_anthem_audit" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "recovery_anthem_audit_disposition" ON "recovery_anthem_audit" USING btree ("disposition","created_at");--> statement-breakpoint
CREATE INDEX "recovery_anthems_user_created" ON "recovery_anthems" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_anthems_share_id" ON "recovery_anthems" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "recovery_anthems_broadcast_status" ON "recovery_anthems" USING btree ("broadcast_status","broadcast_submitted_at");--> statement-breakpoint
CREATE INDEX "idx_recovery_centers_state" ON "recovery_centers" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_recovery_centers_city" ON "recovery_centers" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_recovery_centers_refresh" ON "recovery_centers" USING btree ("refreshed_at");--> statement-breakpoint
CREATE INDEX "recovery_ex_logs_user_idx" ON "recovery_exercise_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "recovery_ex_logs_ex_idx" ON "recovery_exercise_logs" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "recovery_exercises_cat_idx" ON "recovery_exercises" USING btree ("category","position","level");--> statement-breakpoint
CREATE INDEX "idx_recovery_journals_user" ON "recovery_journals" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_recovery_journals_shared" ON "recovery_journals" USING btree ("is_shared","created_at");--> statement-breakpoint
CREATE INDEX "idx_recovery_journals_user_type" ON "recovery_journals" USING btree ("user_id","entry_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ru_cert_user_part_unique" ON "recovery_university_certificates" USING btree ("user_id","part_number");--> statement-breakpoint
CREATE INDEX "ru_progress_user_chapter_idx" ON "recovery_university_lesson_progress" USING btree ("user_id","chapter");--> statement-breakpoint
CREATE INDEX "ru_lesson_part_idx" ON "recovery_university_lessons" USING btree ("part_number");--> statement-breakpoint
CREATE INDEX "ru_q_lesson_idx" ON "recovery_university_questions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "ru_attempt_user_idx" ON "recovery_university_quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ru_attempt_chapter_idx" ON "recovery_university_quiz_attempts" USING btree ("chapter");--> statement-breakpoint
CREATE INDEX "idx_revenue_events_user" ON "revenue_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_events_created" ON "revenue_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_revenue_events_type" ON "revenue_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_revenue_events_stripe" ON "revenue_events" USING btree ("stripe_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_user_date_idx" ON "routine_completions" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_fb_user_date_task_idx" ON "routine_feedback" USING btree ("user_id","date","task_id");--> statement-breakpoint
CREATE INDEX "sasquatch_assess_user_idx" ON "sasquatch_assessments" USING btree ("user_id","taken_at");--> statement-breakpoint
CREATE INDEX "idx_sasquatch_chat_user_created" ON "sasquatch_chat_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sasquatch_ping" ON "sasquatch_daily_pings" USING btree ("user_id","ping_date");--> statement-breakpoint
CREATE INDEX "idx_sasq_sound_interest_email" ON "sasquatch_sound_interest" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_sasq_sound_interest_created" ON "sasquatch_sound_interest" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sasq_studio_sub_user" ON "sasquatch_studio_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sasq_studio_sub_status" ON "sasquatch_studio_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sasq_voice_clone_user" ON "sasquatch_voice_clones" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sasq_voice_clone_voice" ON "sasquatch_voice_clones" USING btree ("elevenlabs_voice_id");--> statement-breakpoint
CREATE INDEX "idx_sasq_voice_gen_user" ON "sasquatch_voice_generations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sc_donor_idx" ON "scholarship_contributions" USING btree ("donor_id","created_at");--> statement-breakpoint
CREATE INDEX "sg_user_idx" ON "scholarship_grants" USING btree ("user_id","granted_at");--> statement-breakpoint
CREATE INDEX "sg_course_idx" ON "scholarship_grants" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "sr_user_idx" ON "scholarship_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sr_status_idx" ON "scholarship_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "spotlight_month_idx" ON "spotlights" USING btree ("month_key");--> statement-breakpoint
CREATE INDEX "spotlight_status_idx" ON "spotlights" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sra_course_rating_user" ON "sra_course_ratings" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_survivor_album_track_album" ON "survivor_album_tracks" USING btree ("album_id","position");--> statement-breakpoint
CREATE INDEX "idx_survivor_album_user" ON "survivor_albums" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_survivor_album_share" ON "survivor_albums" USING btree ("share_slug");--> statement-breakpoint
CREATE INDEX "survivor_goals_user_idx" ON "survivor_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "survivor_plans_user_idx" ON "survivor_plans" USING btree ("user_id","generated_at");--> statement-breakpoint
CREATE INDEX "therapist_app_user_idx" ON "therapist_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "therapist_app_status_idx" ON "therapist_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_usage_events_user" ON "usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_feature" ON "usage_events" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "idx_usage_events_created" ON "usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_badges_user_idx" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_badges_user_badge_unique" ON "user_badges" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_user" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_stripe" ON "user_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_session_participants_session_user_unique" ON "video_session_participants" USING btree ("session_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_webhook_provider_event" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_status" ON "webhook_events" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "book_chapters" ADD CONSTRAINT "book_chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_chat_messages_session" ON "ai_chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_sessions_user" ON "ai_chat_sessions" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "idx_book_chapters_book" ON "book_chapters" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE INDEX "idx_book_pages_chapter" ON "book_pages" USING btree ("chapter_id","page_number");--> statement-breakpoint
CREATE INDEX "idx_course_lessons_module" ON "course_lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "idx_course_modules_course" ON "course_modules" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX "idx_daily_logs_user" ON "daily_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_thread" ON "forum_posts" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_author" ON "forum_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_reactions_post" ON "forum_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_reactions_user" ON "forum_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forum_threads_category" ON "forum_threads" USING btree ("category_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_forum_threads_author" ON "forum_threads" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_user_course_progress_user" ON "user_course_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_unique" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_public_slug_unique" UNIQUE("public_slug");