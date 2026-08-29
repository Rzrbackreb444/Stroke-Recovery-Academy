import { mkdtemp, rm, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { createDisposablePostgres } from "./disposablePostgres";
import { applyMigrationFiles } from "./migrationRunner";

const integrationEnabled = process.env.MIGRATIONS_DB === "1";
const migrationsDirectory = new URL("../migrations/", import.meta.url);
const restoreBaseline = "0000_perfect_jackal.sql";

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
        migrationsDirectory,
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

test(
  "all production migrations apply to a representative restored schema",
  { skip: !integrationEnabled, timeout: 120_000 },
  async () => {
    const database = await createDisposablePostgres({
      extensions: ["uuid-ossp", "vector"],
    });
    try {
      // A production backup taken after the initial rollout already has the
      // original user-facing tables and rows. Applying only the later
      // migrations is the restore path that a clean database cannot exercise.
      await applyMigrationFiles(database.pool, migrationsDirectory, {
        through: restoreBaseline,
      });
      await database.pool.query(`
        INSERT INTO users (id, email, first_name, last_name, role)
        VALUES ('restored-survivor', 'restored@example.test', 'Restored', 'Survivor', 'member')
      `);
      await database.pool.query(`
        INSERT INTO user_profiles (user_id, bio)
        VALUES ('restored-survivor', 'A row preserved by the restore fixture')
      `);

      await applyMigrationFiles(database.pool, migrationsDirectory, {
        startAfter: restoreBaseline,
      });

      const result = await database.pool.query<{
        password_hash: string | null;
        public_slug: string | null;
        story: string | null;
      }>(`
        SELECT users.password_hash, users.public_slug, user_profiles.story
          FROM users
          JOIN user_profiles ON user_profiles.user_id = users.id
         WHERE users.id = 'restored-survivor'
      `);
      assert.deepEqual(result.rows[0], {
        password_hash: null,
        public_slug: null,
        story: null,
      });
    } finally {
      await database.stop();
    }
  },
);

test(
  "reports the migration and statement when restored schema has drifted",
  { skip: !integrationEnabled, timeout: 120_000 },
  async () => {
    const database = await createDisposablePostgres({
      extensions: ["uuid-ossp", "vector"],
    });
    try {
      await applyMigrationFiles(database.pool, migrationsDirectory, {
        through: restoreBaseline,
      });
      // This represents a legacy backup that independently added a column
      // which the pending production migration also needs to add.
      await database.pool.query(
        'ALTER TABLE "users" ADD COLUMN "public_slug" integer',
      );

      await assert.rejects(
        applyMigrationFiles(database.pool, migrationsDirectory, {
          startAfter: restoreBaseline,
        }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(
            error.message,
            /Migration 0001_faulty_major_mapleleaf\.sql failed at statement \d+:/,
          );
          assert.match(
            error.message,
            /ALTER TABLE "users" ADD COLUMN "public_slug" varchar;/,
          );
          assert.match(
            error.message,
            /column "public_slug" of relation "users" already exists/,
          );
          return true;
        },
      );

      const rolledBack = await database.pool.query<{ relation: string | null }>(
        "SELECT to_regclass('public.accountability_pods') AS relation",
      );
      assert.equal(
        rolledBack.rows[0]?.relation,
        null,
        "a drift failure should roll back the pending migration",
      );
    } finally {
      await database.stop();
    }
  },
);


test(
  "rolls back a migration when a later statement fails and allows a retry",
  { skip: !integrationEnabled, timeout: 120_000 },
  async () => {
    const database = await createDisposablePostgres();
    const migrationDirectory = await mkdtemp(
      join(tmpdir(), "migration-runner-failure-"),
    );
    const tableName = `migration_runner_rollback_${randomUUID().replaceAll("-", "")}`;
    const migrationFilename = "0001_failing_probe.sql";
    const migrationPath = join(migrationDirectory, migrationFilename);
    const createTableStatement = `CREATE TABLE "${tableName}" (id integer);`;
    const failingStatement = "SELECT migration_runner_missing_function();";

    try {
      await writeFile(
        migrationPath,
        `${createTableStatement}\n--> statement-breakpoint\n${failingStatement}\n`,
      );

      await assert.rejects(
        applyMigrationFiles(
          database.pool,
          new URL("./", `file://${migrationDirectory}/`),
        ),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(
            error.message,
            new RegExp(`Migration ${migrationFilename} failed at statement 2:`),
          );
          assert.match(
            error.message,
            new RegExp(failingStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
          );
          assert.match(
            error.message,
            /function migration_runner_missing_function\(\) does not exist/,
          );
          return true;
        },
      );

      const rolledBack = await database.pool.query<{ relation: string | null }>(
        "SELECT to_regclass($1) AS relation",
        [`public.${tableName}`],
      );
      assert.equal(
        rolledBack.rows[0]?.relation,
        null,
        "the object created before the failure should be rolled back",
      );

      await writeFile(migrationPath, `${createTableStatement}\n`);
      await applyMigrationFiles(
        database.pool,
        new URL("./", `file://${migrationDirectory}/`),
      );

      const retried = await database.pool.query<{ relation: string | null }>(
        "SELECT to_regclass($1) AS relation",
        [`public.${tableName}`],
      );
      assert.equal(retried.rows[0]?.relation, tableName);
    } finally {
      await database.stop();
      await rm(migrationDirectory, { recursive: true, force: true });
    }
  },
);