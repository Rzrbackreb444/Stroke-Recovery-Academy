// Sasquatch Premium — voluntary-churn retention telemetry + save-offer catalog
// (Task #18).
//
// Records the cancel funnel (reason → offer → outcome) into
// `subscription_retention_events` so we can measure which reasons churn and
// which save offers actually save. Also owns the fixed, server-side catalog of
// save offers (Stripe coupons + pause) — the client NEVER supplies amounts,
// coupon IDs, or pause windows.
//
// Runtime CREATE TABLE IF NOT EXISTS pattern matches sibling services
// (sasquatchFunnelService / subscriptionLifecycleService) — db:push is blocked
// on this repl by the external `stripe` schema, so we self-provision.
import { db } from "../db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

// ── Cancel reason enum (fixed) ──────────────────────────────────────────────
// User-visible copy lives on the client; this is the stored code.
export const CANCEL_REASONS = [
  "too_expensive",
  "not_using",
  "missing_features",
  "technical_issues",
  "recovered",
  "temporary_break",
  "other",
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export function isValidCancelReason(s: string): s is CancelReason {
  return (CANCEL_REASONS as readonly string[]).includes(s);
}

export const FEEDBACK_MAX = 1000;

// ── Stage / outcome vocab for BI ────────────────────────────────────────────
export type RetentionStage = "reason" | "offer" | "cancel" | "resume";
export type RetentionOutcome =
  | "reason_captured"
  | "saved" // discount accepted
  | "paused" // pause accepted
  | "cancelled" // cancel-at-period-end set
  | "resumed"; // cancel/ pause cleared

// ── Save-offer catalog ──────────────────────────────────────────────────────
export type SaveOffer = "pause" | "discount";

// Pause one billing cycle, keep access, skip exactly one charge. Voids the
// upcoming invoice; Stripe auto-resumes at `resumes_at`.
export const PAUSE_DAYS = 30;

// Deterministic coupon IDs so re-creation is idempotent across deploys.
type CouponSpec = {
  id: string;
  percent_off: number;
  duration: "once" | "repeating";
  duration_in_months?: number;
  name: string;
};

const COUPON_CATALOG: Record<"monthlyDiscount" | "annualDiscount", CouponSpec> = {
  // Monthly billing — 50% off the next 3 invoices ($9.50/mo for 3 months).
  monthlyDiscount: {
    id: "sasq_retain_50off_3mo",
    percent_off: 50,
    duration: "repeating",
    duration_in_months: 3,
    name: "Sasquatch stays — 50% off 3 months",
  },
  // Annual billing — a repeating-months coupon is incoherent on a yearly cycle,
  // so one-time 30% off the next renewal instead.
  annualDiscount: {
    id: "sasq_retain_30off_once",
    percent_off: 30,
    duration: "once",
    name: "Sasquatch stays — 30% off next year",
  },
};

// Which offers a survivor is eligible for, computed server-side from plan +
// status. Pause is monthly-only and never during a trial (voiding a
// post-trial invoice would gift a free month; pausing a free trial is a no-op).
// Discount is always available (it lands on the first real invoice for a
// trialing sub).
export function eligibleOffers(plan: string, status: string): SaveOffer[] {
  const offers: SaveOffer[] = ["discount"];
  // Founder bills monthly too — pause is coherent on any monthly cadence.
  if (status !== "trialing" && (plan === "monthly" || plan === "founder")) offers.push("pause");
  return offers;
}

// Human copy for each eligible offer, plan-aware. Client renders this verbatim.
export function describeOffers(
  plan: string,
  status: string,
): Array<{ offer: SaveOffer; title: string; body: string }> {
  const out: Array<{ offer: SaveOffer; title: string; body: string }> = [];
  for (const offer of eligibleOffers(plan, status)) {
    if (offer === "discount") {
      out.push(
        plan === "annual"
          ? {
              offer,
              title: "30% off your next year",
              body: "Stay on annual and knock 30% off your next renewal. Same tools, cheaper.",
            }
          : plan === "founder"
            ? {
                offer,
                title: "50% off for 3 months",
                body: "Half price — $24.50/mo for the next three months. Keep the Founder's Circle, the direct line to Nick, all of it.",
              }
            : {
                offer,
                title: "50% off for 3 months",
                body: "Half price — $9.50/mo for the next three months. Keep everything, pay less while you find your footing.",
              },
      );
    } else {
      out.push({
        offer,
        title: "Pause for a month",
        body: "Take 30 days off billing. You keep full access, we skip the next charge, and it picks back up automatically.",
      });
    }
  }
  return out;
}

export function couponKindForPlan(plan: string): "monthlyDiscount" | "annualDiscount" {
  return plan === "annual" ? "annualDiscount" : "monthlyDiscount";
}

// Lazily ensure the retention coupon exists in Stripe. Retrieve-first, create
// on miss, tolerate the create race (`resource_already_exists`).
export async function ensureRetentionCoupon(
  kind: "monthlyDiscount" | "annualDiscount",
): Promise<string> {
  const spec = COUPON_CATALOG[kind];
  const stripe = await getUncachableStripeClient();
  try {
    const existing = await stripe.coupons.retrieve(spec.id);
    if (existing && !(existing as any).deleted) return existing.id;
  } catch {
    /* not found — fall through to create */
  }
  try {
    const created = await stripe.coupons.create({
      id: spec.id,
      percent_off: spec.percent_off,
      duration: spec.duration,
      ...(spec.duration === "repeating"
        ? { duration_in_months: spec.duration_in_months }
        : {}),
      name: spec.name,
      metadata: { feature: "sasquatch_premium_retention" },
    });
    return created.id;
  } catch (e: any) {
    if (e?.code === "resource_already_exists") return spec.id;
    throw e;
  }
}

// ── Persistence ─────────────────────────────────────────────────────────────
let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (tableReady) return tableReady;
  tableReady = db
    .execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_retention_events (
        id BIGSERIAL PRIMARY KEY,
        user_id VARCHAR,
        subscription_id VARCHAR,
        plan VARCHAR(16),
        stage VARCHAR(24) NOT NULL,
        reason VARCHAR(40),
        feedback TEXT,
        offer VARCHAR(24),
        outcome VARCHAR(24) NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .then(async () => {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_retention_sub
          ON subscription_retention_events (subscription_id, outcome)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_retention_created
          ON subscription_retention_events (outcome, created_at)
      `);
    })
    .then(() => undefined)
    .catch((err: any) => {
      tableReady = null; // let a transient hiccup retry next call
      throw err;
    });
  return tableReady;
}

export async function recordRetentionEvent(opts: {
  userId: string | null;
  subscriptionId?: string | null;
  plan?: string | null;
  stage: RetentionStage;
  reason?: string | null;
  feedback?: string | null;
  offer?: SaveOffer | null;
  outcome: RetentionOutcome;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ensureTable();
    const feedback = opts.feedback
      ? String(opts.feedback).slice(0, FEEDBACK_MAX)
      : null;
    const metaJson = JSON.stringify(opts.metadata ?? {});
    await db.execute(sql`
      INSERT INTO subscription_retention_events
        (user_id, subscription_id, plan, stage, reason, feedback, offer, outcome, metadata)
      VALUES
        (${opts.userId}, ${opts.subscriptionId ?? null}, ${opts.plan ?? null},
         ${opts.stage}, ${opts.reason ?? null}, ${feedback},
         ${opts.offer ?? null}, ${opts.outcome}, ${metaJson}::jsonb)
    `);
  } catch (err: any) {
    // Telemetry must never break the cancel surface — log + swallow.
    console.warn("[retention] record failed", err?.message || err);
  }
}

// One accepted save offer per subscription — otherwise a survivor could loop the
// cancel flow for perpetual 50%-off. Checked before applying any offer.
export async function hasAcceptedSaveOffer(subscriptionId: string): Promise<boolean> {
  try {
    await ensureTable();
    const r = await db.execute(sql`
      SELECT 1 FROM subscription_retention_events
       WHERE subscription_id = ${subscriptionId}
         AND outcome IN ('saved', 'paused')
       LIMIT 1
    `);
    return (r.rows as any[]).length > 0;
  } catch (err: any) {
    // Fail closed on the abuse check would block legitimate cancels; the offer
    // apply path is low-stakes, so on a DB hiccup allow it (log for audit).
    console.warn("[retention] hasAcceptedSaveOffer check failed", err?.message || err);
    return false;
  }
}
