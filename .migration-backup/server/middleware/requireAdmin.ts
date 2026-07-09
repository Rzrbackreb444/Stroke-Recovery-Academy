/**
 * requireAdmin — single source of truth for admin authorization.
 *
 * Usage:
 *   app.post('/api/admin/foo', isAuthenticated, requireAdmin, handler)
 *
 * Why a dedicated middleware (instead of inline `if (user.role !== 'admin')`):
 *   1. Eliminates the chance that a copy-pasted route forgets the check.
 *   2. Centralizes the response shape so downstream clients stay consistent.
 *   3. Makes admin gating *visible at the route registration line*, which
 *      is what code reviewers actually scan.
 *
 * Assumes `isAuthenticated` (or equivalent passport session) ran first.
 * Reads the user id via `getUserId()` so the gate works for BOTH the
 * Replit OIDC strategy (`req.user.claims.sub`) AND the multi-provider
 * email/Google strategy (`req.user.id`) — see `server/lib/authUtils.ts`.
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { getUserId } from "../lib/authUtils";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    // Stamp a flag so handlers can short-circuit if needed.
    (req as any).isAdmin = true;
    next();
  } catch (err) {
    console.error("[requireAdmin] error checking role:", err);
    return res.status(500).json({ message: "Failed to verify admin role" });
  }
}
