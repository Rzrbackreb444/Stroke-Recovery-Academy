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

export type MigrationApplyOptions = {
  /**
   * Apply only migrations after this filename. This models a restored
   * database whose backup already contains the earlier migration history.
   */
  startAfter?: string;
  /**
   * Stop after this filename. This makes it possible to build a restore
   * fixture from a known historical migration before applying pending work.
   */
  through?: string;
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
  options: MigrationApplyOptions = {},
): Promise<void> {
  const allMigrations = await readMigrationFiles(migrationsDirectory);
  const startMigrationIndex = options.startAfter
    ? allMigrations.findIndex(
        (migration) => migration.filename === options.startAfter,
      )
    : -1;
  if (options.startAfter && startMigrationIndex === -1) {
    throw new Error(
      `Cannot start migrations after unknown file ${options.startAfter}`,
    );
  }
  const endMigrationIndex = options.through
    ? allMigrations.findIndex(
        (migration) => migration.filename === options.through,
      )
    : allMigrations.length - 1;
  if (options.through && endMigrationIndex === -1) {
    throw new Error(`Cannot stop migrations after unknown file ${options.through}`);
  }
  const startIndex = startMigrationIndex + 1;
  if (startIndex > endMigrationIndex + 1) {
    throw new Error(
      `Cannot start migrations after ${options.startAfter} and stop at ${options.through}`,
    );
  }
  const migrations = allMigrations.slice(startIndex, endMigrationIndex + 1);
  const client = await pool.connect();
  try {
    for (const migration of migrations) {
      await applyMigration(client, migration);
    }
  } finally {
    client.release();
  }
}