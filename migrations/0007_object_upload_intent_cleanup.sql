CREATE INDEX IF NOT EXISTS "object_upload_intents_unconsumed_expiry_idx"
  ON "object_upload_intents" USING btree ("expires_at")
  WHERE "consumed_at" IS NULL;