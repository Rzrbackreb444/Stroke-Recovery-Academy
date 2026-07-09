import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@workspace/db";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

export const db = drizzle({ client: pool, schema });

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
