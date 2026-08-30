import { access, copyFile, mkdtemp, readdir, rm, symlink, mkdir } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { Client, Pool } from "pg";

export type DisposablePostgresOptions = {
  extensions?: string[];
};

export type DisposablePostgres = {
  url: string;
  pool: Pool;
  stop: () => Promise<void>;
};

function postgresConnectionOptions(url: string) {
  const parsed = new URL(url);
  return {
    connectionString: url,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: decodeURIComponent(parsed.pathname.slice(1)),
    user: decodeURIComponent(parsed.username),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}

function runProcess(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function waitForPostgres(url: string, user: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new Client({ connectionString: url, user });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for disposable PostgreSQL");
}

async function findExecutable(name: string): Promise<string> {
  for (const directory of (process.env.PATH ?? "").split(":")) {
    const executable = join(directory, name);
    try {
      await access(executable, constants.X_OK);
      return executable;
    } catch {
      // Try the next PATH entry.
    }
  }
  throw new Error(`Could not find ${name} on PATH`);
}

async function prepareExtensionAwarePostgres(): Promise<{
  executable: string;
  cleanup: () => Promise<void>;
}> {
  const postgresExecutable = await findExecutable("postgres");
  const postgresRoot = dirname(dirname(postgresExecutable));
  const vectorLibraryDirectory = (process.env.REPLIT_LD_LIBRARY_PATH ?? "")
    .split(":")
    .find((directory) => directory.endsWith("/lib") && directory.includes("pgvector"));
  if (!vectorLibraryDirectory) {
    throw new Error(
      "pgvector is required for this migration test; install postgresql16Packages.pgvector",
    );
  }

  const vectorRoot = dirname(vectorLibraryDirectory);
  const installationDirectory = await mkdtemp(`${tmpdir()}/recovery-postgres-install-`);
  try {
    const binDirectory = join(installationDirectory, "bin");
    const libDirectory = join(installationDirectory, "lib");
    const shareDirectory = join(installationDirectory, "share", "postgresql");
    const extensionDirectory = join(shareDirectory, "extension");
    await mkdir(binDirectory, { recursive: true });
    await mkdir(libDirectory, { recursive: true });
    await mkdir(extensionDirectory, { recursive: true });
    await copyFile(postgresExecutable, join(binDirectory, "postgres"));

    for (const library of await readdir(join(postgresRoot, "lib"))) {
      await symlink(
        join(postgresRoot, "lib", library),
        join(libDirectory, library),
      );
    }
    await symlink(
      join(vectorLibraryDirectory, "vector.so"),
      join(libDirectory, "vector.so"),
    );

    for (const sharedFile of await readdir(join(postgresRoot, "share", "postgresql"))) {
      if (sharedFile !== "extension") {
        await symlink(
          join(postgresRoot, "share", "postgresql", sharedFile),
          join(shareDirectory, sharedFile),
        );
      }
    }
    const postgresExtensionDirectory = join(
      postgresRoot,
      "share",
      "postgresql",
      "extension",
    );
    for (const extensionFile of await readdir(postgresExtensionDirectory)) {
      await symlink(
        join(postgresExtensionDirectory, extensionFile),
        join(extensionDirectory, extensionFile),
      );
    }
    for (const extensionFile of await readdir(
      join(vectorRoot, "share", "postgresql", "extension"),
    )) {
      if (extensionFile === "vector.control" || extensionFile.startsWith("vector--")) {
        // The PostgreSQL distribution does not ship pgvector, but keeping this
        // guard makes the merge safe if that changes in a future image.
        await rm(join(extensionDirectory, extensionFile), { force: true });
      }
      await symlink(
        join(vectorRoot, "share", "postgresql", "extension", extensionFile),
        join(extensionDirectory, extensionFile),
      );
    }

    return {
      executable: join(binDirectory, "postgres"),
      cleanup: () => rm(installationDirectory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(installationDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function enableExtensions(pool: Pool, extensions: string[]): Promise<void> {
  for (const extension of extensions) {
    const identifier = `"${extension.replaceAll('"', '""')}"`;
    await pool.query(`CREATE EXTENSION IF NOT EXISTS ${identifier}`);
  }
}

/**
 * Uses RECOVERY_TEST_DATABASE_URL when explicitly supplied, otherwise starts
 * a local PostgreSQL cluster. The URL is rejected when it is the app's normal
 * database so migration tests cannot accidentally mutate shared state.
 */
export async function createDisposablePostgres(
  options: DisposablePostgresOptions = {},
): Promise<DisposablePostgres> {
  const configuredUrl = process.env.RECOVERY_TEST_DATABASE_URL;
  if (configuredUrl) {
    if (configuredUrl === process.env.DATABASE_URL) {
      throw new Error("RECOVERY_TEST_DATABASE_URL must not be the development DATABASE_URL");
    }
    const pool = new Pool(postgresConnectionOptions(configuredUrl));
    await pool.query("SELECT 1");
    await enableExtensions(pool, options.extensions ?? []);
    return { url: configuredUrl, pool, stop: async () => pool.end() };
  }

  const dataDir = await mkdtemp(`${tmpdir()}/recovery-postgres-`);
  const user = "recovery_test";
  const database = `recovery_test_${process.pid}_${randomUUID().replaceAll("-", "")}`;
  const port = 55000 + (process.pid % 1000);
  let postgres: ChildProcess | undefined;
  let adminPool: Pool | undefined;
  let postgresInstallation: Awaited<ReturnType<typeof prepareExtensionAwarePostgres>> | undefined;
  try {
    await runProcess("initdb", [
      "--no-locale",
      "--encoding=UTF8",
      "--auth=trust",
      `--username=${user}`,
      `--pgdata=${dataDir}`,
    ]);
    postgresInstallation = options.extensions?.includes("vector")
      ? await prepareExtensionAwarePostgres()
      : undefined;
    postgres = spawn(postgresInstallation?.executable ?? "postgres", [
      "-D", dataDir,
      "-p", String(port),
      "-h", "127.0.0.1",
      "-k", dataDir,
    ], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const adminUrl = `postgresql://${user}@127.0.0.1:${port}/postgres`;
    await waitForPostgres(adminUrl, user);
    adminPool = new Pool(postgresConnectionOptions(adminUrl));
    await adminPool.query(`CREATE DATABASE "${database}"`);
    const url = `postgresql://${user}@127.0.0.1:${port}/${database}`;
    const pool = new Pool(postgresConnectionOptions(url));
    await pool.query("SELECT 1");
    await enableExtensions(pool, options.extensions ?? []);
    return {
      url,
      pool,
      stop: async () => {
        await pool.end();
        await adminPool?.end();
        if (postgres && postgres.exitCode === null) {
          postgres.kill("SIGTERM");
          await once(postgres, "exit").catch(() => undefined);
        }
        await postgresInstallation?.cleanup();
        await rm(dataDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await adminPool?.end().catch(() => undefined);
    if (postgres && postgres.exitCode === null) {
      postgres.kill("SIGTERM");
      await once(postgres, "exit").catch(() => undefined);
    }
    await postgresInstallation?.cleanup();
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
}