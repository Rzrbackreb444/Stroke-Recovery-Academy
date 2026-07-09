/**
 * Admin Audit middleware — records every admin action with userId, action,
 * path, IP, status code, and an optional metadata payload. Append-only from
 * the app's POV (deletes happen via DBA, not the running process).
 *
 * Wrap admin handlers like:
 *   app.post("/api/admin/blog/publish",
 *     requireAdmin,
 *     auditAdminAction("blog_draft.publish", { resourceType: "blog_post" }),
 *     handler);
 */

import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { adminAuditLog } from "@workspace/db";

interface AuditOptions {
  /** Logical action name, e.g. "blog_draft.publish". */
  resourceType?: string;
  /** Reads the resource id from the request (defaults to req.params.id). */
  resourceIdFn?: (req: Request) => string | undefined;
  /** Optional payload extractor for the metadata jsonb. */
  metadataFn?: (req: Request, res: Response) => Record<string, any>;
}

function resolveIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function auditAdminAction(action: string, opts: AuditOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      // Fire-and-forget; never block the response on the audit insert.
      (async () => {
        try {
          const user = (req as any).user;
          if (!user?.id) return; // not authenticated → nothing to record
          const resourceId = opts.resourceIdFn
            ? opts.resourceIdFn(req)
            : (req.params?.id ?? undefined);
          const metadata = opts.metadataFn ? opts.metadataFn(req, res) : {};
          await db.insert(adminAuditLog).values({
            userId: String(user.id),
            userEmail: user.email ?? null,
            action,
            resourceType: opts.resourceType ?? null,
            resourceId: resourceId ?? null,
            method: req.method,
            path: req.originalUrl || req.url,
            ip: resolveIp(req),
            userAgent: (req.headers["user-agent"] as string) || null,
            statusCode: res.statusCode,
            metadata: { ...metadata, latencyMs: Date.now() - startedAt },
          });
        } catch (err: any) {
          console.error("[adminAudit] insert failed:", err?.message ?? err);
        }
      })();
    });
    next();
  };
}
