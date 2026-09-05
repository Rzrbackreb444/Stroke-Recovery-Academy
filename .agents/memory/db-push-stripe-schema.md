---
name: Development schema push with external Stripe schema
description: Drizzle push can stop on the existing Stripe/named-schema conflict in non-interactive environments.
---

When a development schema is behind the source migration, do not use Drizzle's `--force` flag just to bypass the named-schema prompt. Apply the existing additive migration to development, then use Publish to carry the verified schema diff to production.

**Why:** The project contains an existing Stripe schema that makes Drizzle's push flow request an interactive conflict decision; non-TTY runs fail before applying changes, while `--force` could approve unrelated destructive operations.

**How to apply:** Verify the exact migration and migration tests first, apply only that migration to development, confirm the expected columns, and keep production changes inside the Publish flow.