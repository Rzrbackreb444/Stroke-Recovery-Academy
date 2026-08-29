import { readdir, readFile } from "node:fs/promises";
import { Pool, type PoolClient } from "pg";

const STATEMENT_BREAKPOINT = /^\s*--> statement-breakpoint\s*$/gm;

export type MigrationStatement = {
  index: number;
  sql: string;
};

export type MigrationFile = {
  filename: string;
  statements: MigrationStatement[];
};

export async function readMigrationFiles(
  migrationsDirectory: URL,
): Promise<MigrationFile[]> {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    filenames.map(async (filename) => {
      const sql = await readFile(new URL(filename, migrationsDirectory), "utf8");
      const statements = sql
        .split(STATEMENT_BREAKPOINT)
        .map((statement) => statement.trim())
        .filter(Boolean)
        .map((statement, index) => ({ index: index + 1, sql: statement }));

      return { filename, statements };
    }),
  );
}

function migrationFailure(
  filename: string,
  statement: MigrationStatement,
  error: unknown,
): Error {
  const cause = error instanceof Error ? error.message : String(error);
  return new Error(
    [
      `Migration ${filename} failed at statement ${statement.index}:`,
      statement.sql,
      "",
      cause,
    ].join("\n"),
    { cause: error },
  );
}

async function applyMigration(
  client: PoolClient,
  migration: MigrationFile,
): Promise<void> {
  await client.query("BEGIN");
  try {
    for (const statement of migration.statements) {
      try {
        await client.query(statement.sql);
      } catch (error) {
        throw migrationFailure(migration.filename, statement, error);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function applyMigrationFiles(
  pool: Pool,
  migrationsDirectory: URL,
): Promise<void> {
  const migrations = await readMigrationFiles(migrationsDirectory);
  const client = await pool.connect();
  try {
    for (const migration of migrations) {
      await applyMigration(client, migration);
    }
  } finally {
    client.release();
  }
}