/**
 * authUtils — cross-strategy user-identity helpers.
 *
 * The codebase has TWO coexisting passport strategies that store the
 * authenticated user differently on `req.user`:
 *
 *   1. Replit Auth (OpenID Connect, `server/replitAuth.ts`)
 *      → `req.user.claims.sub` is the canonical user id (also `claims.email`).
 *
 *   2. Email/password + Google OAuth (`server/multiProviderAuth.ts`)
 *      → `req.user` IS the User row directly; `req.user.id` is the user id.
 *
 * Reading `(req.user as any).id` therefore silently returns `undefined` for
 * Replit Auth sessions — which is how Lulu book-publishing routes broke for
 * those users. These helpers fall back across both shapes so callers don't
 * have to care which strategy authenticated the request.
 */

import type { Request } from "express";

export function getUserId(req: Request): string | undefined {
  const u = (req as any)?.user;
  return u?.claims?.sub ?? u?.id;
}

export function getUserEmail(req: Request): string | undefined {
  const u = (req as any)?.user;
  return u?.claims?.email ?? u?.email;
}
