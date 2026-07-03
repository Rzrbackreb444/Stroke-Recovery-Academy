---
name: db:push blocked by external stripe schema
description: Why `npm run db:push` fails non-interactively on this repl and the safe workaround.
---

# db:push is blocked by the external `stripe` postgres schema

`npm run db:push` triggers drizzle-kit's `promptNamedWithSchemasConflict`
interactive prompt because the DB has an external `stripe` schema (populated by the
stripe-replit-sync integration) that is NOT declared in `shared/schema.ts`. In the
non-TTY agent shell the prompt errors out, and accepting it risks dropping the
stripe schema.

**How to apply schema changes:** write additive DDL by hand and run it via
`psql "$DATABASE_URL"` — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE TABLE
IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. Keep it idempotent and additive
(never drop/rename in the same pass) so it's safe to re-run and matches the Drizzle
column definitions you already wrote in `shared/schema.ts`. Then restart the
`Start application` workflow so new code/scheduler jobs pick up.

**Why:** drizzle-kit is fine for greenfield but this repl's DB is shared with an
integration-owned schema; interactive reconciliation is unavailable and dangerous
here. `drizzle.config.ts` is also in `forbidden_changes`, so filtering the schema
out of the config is not an option.
