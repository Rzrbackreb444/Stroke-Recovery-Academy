import assert from "node:assert/strict";
import test from "node:test";
import { createDisposablePostgres } from "./disposablePostgres";
import { applyMigrationFiles } from "./migrationRunner";

const integrationEnabled = process.env.MIGRATIONS_DB === "1";

test(
  "all production migrations apply in order on a clean disposable PostgreSQL database",
  { skip: !integrationEnabled, timeout: 120_000 },
  async () => {
    const database = await createDisposablePostgres({
      extensions: ["uuid-ossp", "vector"],
    });
    try {
      await applyMigrationFiles(
        database.pool,
        new URL("../migrations/", import.meta.url),
      );

      const result = await database.pool.query<{ migration_count: string }>(`
        SELECT COUNT(*)::text AS migration_count
          FROM pg_catalog.pg_tables
         WHERE schemaname = 'public'
           AND tablename <> 'drizzle_migrations'
      `);
      assert.ok(
        Number(result.rows[0]?.migration_count) > 0,
        "the migration suite should create application tables",
      );
    } finally {
      await database.stop();
    }
  },
);