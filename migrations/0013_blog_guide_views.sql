CREATE TABLE IF NOT EXISTS "blog_guide_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "article_slug" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_guide_views_article"
  ON "blog_guide_views" USING btree ("article_slug","created_at");