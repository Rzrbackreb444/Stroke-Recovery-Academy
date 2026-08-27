import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as NodePool } from 'pg';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// The disposable recovery durability suite uses a local PostgreSQL cluster.
// Neon's WebSocket client intentionally cannot speak to a local TCP server;
// keep this switch test-only so deployed/dev Neon connections remain unchanged.
const useNodePostgres = process.env.RECOVERY_DURABILITY_DB === "1";
const localConnection = useNodePostgres
  ? (() => {
      const parsed = new URL(process.env.DATABASE_URL!);
      return {
        connectionString: process.env.DATABASE_URL,
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 5432,
        database: decodeURIComponent(parsed.pathname.slice(1)),
        user: decodeURIComponent(parsed.username),
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      };
    })()
  : null;

export const pool = useNodePostgres
  ? new NodePool({
      ...localConnection,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    })
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

export const db = (useNodePostgres
  ? drizzleNode({ client: pool as NodePool, schema })
  : drizzle({ client: pool as Pool, schema })) as unknown as ReturnType<typeof drizzle>;

/**
 * Retry a database operation with exponential backoff.
 * Handles Neon endpoint cold-start / transient errors (XX000) gracefully.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  label = "db operation"
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.code === "XX000" ||
        err?.code === "ECONNRESET" ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "ETIMEDOUT" ||
        err?.message?.includes("endpoint") ||
        err?.message?.includes("connection") ||
        err?.message?.includes("timeout");

      if (isTransient && attempt < maxAttempts) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.warn(
          `[db] ${label} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms: ${err?.message}`
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}
