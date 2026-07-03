/**
 * Public POST rate limiter — defends unauthenticated public endpoints
 * (feedback inbox, contact, magic-link request) against burst floods.
 *
 * Implementation note: this is an in-memory token-bucket. It's per-process,
 * which is fine for our single-region single-process deployment. If we ever
 * scale horizontally, swap the Map for Redis.
 */

import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number; // unix ms
}

interface LimiterOptions {
  /** Window length in ms. Default: 60s. */
  windowMs?: number;
  /** Max requests per IP per window. Default: 10. */
  max?: number;
  /** Optional key resolver (defaults to ip). */
  keyFn?: (req: Request) => string;
  /** Identifier shown in error responses (helps the client/logs). */
  bucketName?: string;
}

const buckets = new Map<string, Map<string, Bucket>>();

function pruneExpired(store: Map<string, Bucket>, now: number) {
  if (store.size < 5000) return; // amortize: only prune when the store gets large
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

export function publicRateLimit(opts: LimiterOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 10;
  const bucketName = opts.bucketName ?? "default";
  const keyFn =
    opts.keyFn ??
    ((req: Request) =>
      (req.ip ||
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown") as string);

  if (!buckets.has(bucketName)) buckets.set(bucketName, new Map());
  const store = buckets.get(bucketName)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(req);
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      pruneExpired(store, now);
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(existing.resetAt / 1000)));
      return res.status(429).json({
        error: "Too many requests. Please slow down.",
        bucket: bucketName,
        retryAfter: retryAfterSec,
      });
    }

    existing.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(max - existing.count));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(existing.resetAt / 1000)));
    next();
  };
}

/** Pre-configured limiter for public POST endpoints (feedback, contact). */
export const publicPostLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 10,
  bucketName: "public-post",
});

/** Stricter limiter for magic-link / password-reset / signup (5/min). */
export const authActionLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 5,
  bucketName: "auth-action",
});

/** Payment checkout limiter — 10 Stripe session creations per IP per hour. */
export const paymentCheckoutLimiter = publicRateLimit({
  windowMs: 60 * 60_000,
  max: 10,
  bucketName: "payment-checkout",
});

/** Billing portal limiter — 20 portal opens per IP per hour. */
export const billingPortalLimiter = publicRateLimit({
  windowMs: 60 * 60_000,
  max: 20,
  bucketName: "billing-portal",
});
