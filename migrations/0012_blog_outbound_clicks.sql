CREATE TABLE IF NOT EXISTS "blog_outbound_clicks" (
  "id" serial PRIMARY KEY NOT NULL,
  "article_slug" text NOT NULL,
  "product_category" text NOT NULL,
  "recommendation" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_outbound_clicks_article"
  ON "blog_outbound_clicks" USING btree ("article_slug","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_outbound_clicks_recommendation"
  ON "blog_outbound_clicks" USING btree ("recommendation","created_at");