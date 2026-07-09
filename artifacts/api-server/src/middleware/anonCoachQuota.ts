/**
 * Anonymous Coach quota — soft sign-in gate for `/api/coach/chat`.
 *
 * Lets logged-out visitors taste the Coach for ANON_COACH_LIMIT messages,
 * then returns 401 { requireAuth: true } so the UI can prompt sign-in.
 *
 * Implementation:
 *   - Counter lives in an HMAC-signed cookie (SESSION_SECRET).
 *   - Cookie format: `${count}.${hmacHex}` where hmac = HMAC-SHA256(secret, count).
 *   - Tampering / re-encoding fails the HMAC check → treated as count=0.
 *   - This is a SOFT gate. A determined user can clear cookies and reset
 *     the counter — that's fine, it's a friction nudge, not a security
 *     boundary. The real cost-abuse backstop is the per-IP rate limiter
 *     applied to /api/coach/chat regardless of auth state.
 */

import crypto from "node:crypto";
import type { Request, Response } from "express";
import { publicRateLimit } from "./publicRateLimit";

export const ANON_COACH_LIMIT = 3;
const COOKIE_NAME = "src_coach_anon";
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  return process.env.SESSION_SECRET || "dev-fallback-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (decodeURIComponent(trimmed.slice(0, eq)) === name) {
      try {
        return decodeURIComponent(trimmed.slice(eq + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function getAnonCoachCount(req: Request): number {
  const raw = readCookie(req, COOKIE_NAME);
  if (!raw) return 0;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return 0;
  const countStr = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(countStr);
  if (!timingSafeEq(sig, expected)) return 0;
  const n = Number.parseInt(countStr, 10);
  if (!Number.isFinite(n) || n < 0 || n > 10_000) return 0;
  return n;
}

export function setAnonCoachCount(res: Response, count: number): void {
  const value = `${count}.${sign(String(count))}`;
  const isProd = process.env.NODE_ENV === "production";
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${Math.floor(COOKIE_MAX_AGE_MS / 1000)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) attrs.push("Secure");
  // Append (don't replace) so we don't clobber other Set-Cookie headers
  // (e.g. session cookie when the user signs in mid-request).
  const prev = res.getHeader("Set-Cookie");
  const next = attrs.join("; ");
  if (!prev) res.setHeader("Set-Cookie", next);
  else if (Array.isArray(prev)) res.setHeader("Set-Cookie", [...prev, next]);
  else res.setHeader("Set-Cookie", [String(prev), next]);
}

/**
 * Per-IP limiter for /api/coach/chat. Enforced for ALL callers (auth or
 * anon) as the cost-abuse backstop — Gemini + ElevenLabs is the most
 * expensive path on the platform. 20/min/IP comfortably exceeds any
 * legitimate human typing rate but caps a runaway loop.
 */
export const coachIpLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 20,
  bucketName: "coach-chat-ip",
});
