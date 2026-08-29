import { mkdtemp, rm } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { Client, Pool } from "pg";

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

/**
 * Uses RECOVERY_TEST_DATABASE_URL when explicitly supplied, otherwise starts
 * a local PostgreSQL cluster. The URL is rejected when it is the app's normal
 * database so migration tests cannot accidentally mutate shared state.
 */
export async function createDisposablePostgres(): Promise<DisposablePostgres> {
  const configuredUrl = process.env.RECOVERY_TEST_DATABASE_URL;
  if (configuredUrl) {
    if (configuredUrl === process.env.DATABASE_URL) {
      throw new Error("RECOVERY_TEST_DATABASE_URL must not be the development DATABASE_URL");
    }
    const pool = new Pool(postgresConnectionOptions(configuredUrl));
    await pool.query("SELECT 1");
    return { url: configuredUrl, pool, stop: async () => pool.end() };
  }

  const dataDir = await mkdtemp(`${tmpdir()}/recovery-postgres-`);
  const user = "recovery_test";
  const database = `recovery_test_${process.pid}_${randomUUID().replaceAll("-", "")}`;
  const port = 55000 + (process.pid % 1000);
  let postgres: ChildProcess | undefined;
  let adminPool: Pool | undefined;
  try {
    await runProcess("initdb", [
      "--no-locale",
      "--encoding=UTF8",
      "--auth=trust",
      `--username=${user}`,
      `--pgdata=${dataDir}`,
    ]);
    postgres = spawn("postgres", [
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
        await rm(dataDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await adminPool?.end().catch(() => undefined);
    if (postgres && postgres.exitCode === null) {
      postgres.kill("SIGTERM");
      await once(postgres, "exit").catch(() => undefined);
    }
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
}