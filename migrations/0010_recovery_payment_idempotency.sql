CREATE UNIQUE INDEX IF NOT EXISTS "recovery_creator_tips_stripe_payment_id_unique"
  ON "recovery_creator_tips" USING btree ("stripe_payment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recovery_premium_purchases_stripe_payment_id_unique"
  ON "recovery_premium_purchases" USING btree ("stripe_payment_id");