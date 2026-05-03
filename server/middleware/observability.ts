/**
 * Lightweight observability layer:
 *  - Request-id middleware (per-request correlation id, echoed in X-Request-Id)
 *  - Structured JSON error logger that runs before the existing fall-through
 *    error handler so every unhandled error gets a single greppable line.
 *  - /api/health endpoint with database round-trip + uptime.
 *
 * Intentionally zero-dep: no Sentry, no OpenTelemetry. When the budget allows
 * we can add an exporter — but the structured log line is enough to grep on
 * Replit's deployment logs today.
 */

import { type Request, type Response, type NextFunction, type Express } from "express";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers["x-request-id"];
  const id =
    (typeof incoming === "string" && incoming.length > 0 && incoming.length <= 64
      ? incoming
      : randomUUID());
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}

/**
 * One-line JSON per error with request correlation, so we can grep
 * deployment logs by `level":"error"` or `requestId":"…"`.
 */
export function structuredErrorLogger(
  err: any,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const status = err?.status || err?.statusCode || 500;
  const userId =
    (req as any)?.user?.claims?.sub ??
    (req as any)?.session?.userId ??
    null;

  const payload = {
    level: "error",
    ts: new Date().toISOString(),
    requestId: req.requestId || null,
    method: req.method,
    path: req.path,
    status,
    userId,
    msg: err?.message || "Unknown error",
    name: err?.name || "Error",
    // Only include stack in non-production. Stacks in prod logs leak file paths
    // and library internals that aren't useful for the deployed environment.
    stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
  };

  // Single JSON line — easy to grep in Replit's deployment logs.
  console.error(JSON.stringify(payload));

  next(err);
}

export function registerHealthRoutes(app: Express) {
  // Sentry DSNs are designed to be embedded in client code (publicly safe by
  // design — they identify the project, not authenticate). Exposing it via a
  // tiny server endpoint avoids needing a VITE_-prefixed duplicate of the
  // SENTRY_DSN secret.
  app.get("/api/observability/client-config", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      sentryDsn: process.env.SENTRY_DSN || null,
      environment: process.env.NODE_ENV || "development",
    });
  });

  app.get("/api/health", async (req, res) => {
    const startedAt = process.uptime();
    let dbOk = false;
    let dbLatencyMs: number | null = null;
    try {
      const t0 = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Date.now() - t0;
      dbOk = true;
    } catch (err: any) {
      console.error(
        JSON.stringify({
          level: "error",
          ts: new Date().toISOString(),
          requestId: req.requestId || null,
          msg: "Health DB ping failed",
          name: err?.name,
        }),
      );
    }

    const status = dbOk ? 200 : 503;
    return res.status(status).json({
      ok: dbOk,
      uptimeSeconds: Math.round(startedAt),
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      env: process.env.NODE_ENV || "development",
      ts: new Date().toISOString(),
    });
  });
}
