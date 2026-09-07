ALTER TABLE "recovery_stories"
  ADD COLUMN IF NOT EXISTS "stripe_product_id" text,
  ADD COLUMN IF NOT EXISTS "stripe_price_id" text;
--> statement-breakpoint
ALTER TABLE "marketplace_listings"
  ADD COLUMN IF NOT EXISTS "stripe_product_id" text;
--> statement-breakpoint
ALTER TABLE "book_editions"
  ADD COLUMN IF NOT EXISTS "stripe_price_id" text;