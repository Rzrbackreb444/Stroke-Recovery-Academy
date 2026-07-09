// Subscription & Revenue Durability (Task #3) — Sasquatch Premium lifecycle.
//
// Sasquatch Premium subscriptions do NOT flow through `user_subscriptions`
// (that table is the separate KreAIte credit-tier system). Entitlement was
// previously read straight from Stripe/`stripe.*` mirror on active|trialing
// only, which meant a survivor whose card failed lost access the instant
// Stripe flipped to `past_due` — no grace, no dunning, no receipts.
//
// This service adds a durable, runtime-provisioned state row per premium
// subscriber (`sasquatch_premium_subscriptions`) that records payment health,
// a 7-day grace window on failed payments, dunning attempts, and recovery.
// Webhooks keep it in sync; a scheduler job drives dunning reminders + grace
// expiry downgrades + trial-ending nudges; the gate reads it so access is
// correct across trialing / active / past_due(grace) / canceled / paused.
//
// Runtime CREATE TABLE IF NOT EXISTS pattern (matches sasquatchFunnelService /
// messaging engine) — db:push is blocked on this repl by the external `stripe`
// schema, so we self-provision instead of a Drizzle migration.
import { db } from "../db";
import { sql } from "drizzle-orm";
import { sendMessage } from "../messaging";
import { renderEmail, ctaButton } from "../emailTemplate";
import { getUncachableStripeClient } from "../stripeClient";
import {
  getSasquatchPremiumPriceIds,
  getSasquatchPremiumPriceId,
  getSasquatchFounderPriceId,
  invalidateSasquatchPremium,
} from "./sasquatchPremiumService";

export const PREMIUM_GRACE_DAYS = 7;

// ── Schema self-provisioning ────────────────────────────────────────────────
let schemaReady: Promise<void> | null = null;

export async function ensureSubStateSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = db
    .execute(sql`
      CREATE TABLE IF NOT EXISTS sasquatch_premium_subscriptions (
        user_id VARCHAR PRIMARY KEY,
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        plan VARCHAR(16) NOT NULL DEFAULT 'unknown',
        current_period_end TIMESTAMPTZ,
        trial_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        payment_state VARCHAR(16) NOT NULL DEFAULT 'ok',
        last_payment_failed_at TIMESTAMPTZ,
        dunning_attempts INTEGER NOT NULL DEFAULT 0,
        grace_period_end TIMESTAMPTZ,
        last_recovered_at TIMESTAMPTZ,
        downgraded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .then(async () => {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_premium_sub_customer
          ON sasquatch_premium_subscriptions (stripe_customer_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_premium_sub_status
          ON sasquatch_premium_subscriptions (status)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_premium_sub_grace
          ON sasquatch_premium_subscriptions (grace_period_end)
      `);
    })
    .then(() => undefined)
    .catch((err: any) => {
      schemaReady = null; // let a transient hiccup retry
      throw err;
    });
  return schemaReady;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface PremiumSubState {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: string;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  payment_state: string;
  last_payment_failed_at: string | null;
  dunning_attempts: number;
  grace_period_end: string | null;
  last_recovered_at: string | null;
  downgraded_at: string | null;
  created_at: string;
  updated_at: string;
}

const GOOD_STATUSES = new Set(["active", "trialing"]);
const FAILING_STATUSES = new Set(["past_due", "unpaid"]);

// Entitlement decision from a state row. Pure function — no I/O — so the gate
// (sasquatchPremiumService) can inline the same logic without importing this
// module (avoids a circular dependency).
export function isEntitledFromState(row: PremiumSubState | null): boolean {
  if (!row) return false;
  if (GOOD_STATUSES.has(row.status)) return true;
  if (row.downgraded_at) return false;
  if (FAILING_STATUSES.has(row.status)) {
    const grace = row.grace_period_end ? Date.parse(row.grace_period_end) : 0;
    return grace > Date.now();
  }
  return false; // canceled / incomplete / incomplete_expired / paused
}

// ── Stripe helpers ──────────────────────────────────────────────────────────
export type PremiumPlan = "monthly" | "annual" | "founder" | "unknown";

// Founder ⊇ Premium — Founder's Circle subs flow through the same durable
// lifecycle (state row, cancel flow, receipts, dunning, grace). Lookup is
// guarded so a founder-price failure never breaks the premium lifecycle.
async function founderPriceIdSafe(): Promise<string | null> {
  try {
    return await getSasquatchFounderPriceId();
  } catch {
    return null;
  }
}

async function eligiblePriceSet(): Promise<Set<string>> {
  const out = new Set<string>();
  const prices = await getSasquatchPremiumPriceIds();
  if (prices) {
    out.add(prices.monthlyPriceId);
    out.add(prices.annualPriceId);
  } else {
    const monthly = await getSasquatchPremiumPriceId();
    if (monthly) out.add(monthly);
  }
  const founder = await founderPriceIdSafe();
  if (founder) out.add(founder);
  return out;
}

function planForPriceId(
  priceId: string | undefined,
  prices: { monthlyPriceId: string; annualPriceId: string } | null,
  founderPriceId: string | null,
): PremiumPlan {
  if (!priceId) return "unknown";
  if (founderPriceId && priceId === founderPriceId) return "founder";
  if (!prices) return "unknown";
  if (priceId === prices.monthlyPriceId) return "monthly";
  if (priceId === prices.annualPriceId) return "annual";
  return "unknown";
}

function customerIdOf(obj: any): string | null {
  const c = obj?.customer;
  if (typeof c === "string") return c;
  if (c && typeof c.id === "string") return c.id;
  return null;
}

async function resolveUserId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  try {
    const r = await db.execute(sql`
      SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1
    `);
    const row = (r.rows as any[])[0];
    return row?.id ? String(row.id) : null;
  } catch (e: any) {
    console.warn("[sub-lifecycle] user lookup failed", e?.message || e);
    return null;
  }
}

function tsFromUnix(v: any): Date | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return new Date(v * 1000);
}

// Detect whether a Stripe subscription object is a Sasquatch Premium sub and
// which interval. Returns null if it isn't premium (other products fire the
// same webhooks).
async function premiumPlanFromSubscription(sub: any): Promise<PremiumPlan | null> {
  const prices = await getSasquatchPremiumPriceIds();
  const founderId = await founderPriceIdSafe();
  const eligible = await eligiblePriceSet();
  if (eligible.size === 0) return null;
  const items: any[] = sub?.items?.data ?? [];
  for (const it of items) {
    const pid = it?.price?.id;
    if (pid && eligible.has(pid)) return planForPriceId(pid, prices, founderId);
  }
  return null;
}

// Detect premium from an invoice's line items (no extra Stripe API call).
async function premiumPlanFromInvoice(invoice: any): Promise<PremiumPlan | null> {
  const prices = await getSasquatchPremiumPriceIds();
  const founderId = await founderPriceIdSafe();
  const eligible = await eligiblePriceSet();
  if (eligible.size === 0) return null;
  const lines: any[] = invoice?.lines?.data ?? [];
  for (const ln of lines) {
    const pid = ln?.price?.id;
    if (pid && eligible.has(pid)) return planForPriceId(pid, prices, founderId);
  }
  return null;
}

// ── Sync from a Stripe subscription object (created / updated / deleted) ─────
export async function syncPremiumSubFromStripe(sub: any): Promise<void> {
  try {
    if (!sub) return;
    const plan = await premiumPlanFromSubscription(sub);
    if (plan === null) return; // not a premium subscription

    await ensureSubStateSchema();

    const customerId = customerIdOf(sub);
    const userId = await resolveUserId(customerId);
    if (!userId) return; // can't key the row without a linked survivor

    const status: string = String(sub.status || "active");
    const subId: string = String(sub.id || "");
    // Basil (2025-08-27) moved current_period_end off the top-level subscription
    // object onto each item; fall back so period-end never lands NULL (the cancel
    // UI's "access until <date>" promise + the grace window both depend on it).
    const periodEnd = tsFromUnix(
      sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end,
    );
    const trialEnd = tsFromUnix(sub.trial_end);
    const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

    const isGood = GOOD_STATUSES.has(status);
    const isFailing = FAILING_STATUSES.has(status);

    // Values used for a fresh INSERT.
    const insertPaymentState = isFailing ? "failed" : "ok";
    const insertGrace = isFailing
      ? new Date(Date.now() + PREMIUM_GRACE_DAYS * 86400_000)
      : null;

    let isNew = false;
    if (isGood) {
      // Good status = payment healthy. Clear grace/downgrade, reset dunning,
      // stamp recovery if we were previously in a failed state.
      const r = await db.execute(sql`
        INSERT INTO sasquatch_premium_subscriptions
          (user_id, stripe_customer_id, stripe_subscription_id, status, plan,
           current_period_end, trial_end, cancel_at_period_end,
           payment_state, grace_period_end, downgraded_at, dunning_attempts, updated_at)
        VALUES
          (${userId}, ${customerId}, ${subId}, ${status}, ${plan},
           ${periodEnd}, ${trialEnd}, ${cancelAtPeriodEnd},
           'ok', NULL, NULL, 0, now())
        ON CONFLICT (user_id) DO UPDATE SET
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          status = EXCLUDED.status,
          plan = EXCLUDED.plan,
          current_period_end = EXCLUDED.current_period_end,
          trial_end = EXCLUDED.trial_end,
          cancel_at_period_end = EXCLUDED.cancel_at_period_end,
          payment_state = 'ok',
          grace_period_end = NULL,
          downgraded_at = NULL,
          dunning_attempts = 0,
          last_recovered_at = CASE
            WHEN sasquatch_premium_subscriptions.payment_state = 'failed'
                 OR sasquatch_premium_subscriptions.downgraded_at IS NOT NULL
            THEN now()
            ELSE sasquatch_premium_subscriptions.last_recovered_at END,
          updated_at = now()
        RETURNING (xmax = 0) AS is_new
      `);
      isNew = !!(r.rows as any[])[0]?.is_new;
    } else {
      // Failing / canceled / paused / incomplete. Preserve any existing grace
      // + downgrade so the scheduler owns the downgrade decision.
      const r = await db.execute(sql`
        INSERT INTO sasquatch_premium_subscriptions
          (user_id, stripe_customer_id, stripe_subscription_id, status, plan,
           current_period_end, trial_end, cancel_at_period_end,
           payment_state, grace_period_end, updated_at)
        VALUES
          (${userId}, ${customerId}, ${subId}, ${status}, ${plan},
           ${periodEnd}, ${trialEnd}, ${cancelAtPeriodEnd},
           ${insertPaymentState}, ${insertGrace}, now())
        ON CONFLICT (user_id) DO UPDATE SET
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          status = EXCLUDED.status,
          plan = EXCLUDED.plan,
          current_period_end = EXCLUDED.current_period_end,
          trial_end = EXCLUDED.trial_end,
          cancel_at_period_end = EXCLUDED.cancel_at_period_end,
          payment_state = ${insertPaymentState},
          grace_period_end = ${isFailing
            ? sql`COALESCE(sasquatch_premium_subscriptions.grace_period_end, ${insertGrace})`
            : sql`sasquatch_premium_subscriptions.grace_period_end`},
          updated_at = now()
        RETURNING (xmax = 0) AS is_new
      `);
      isNew = !!(r.rows as any[])[0]?.is_new;
    }

    invalidateSasquatchPremium(customerId);

    // Welcome / confirmation on the first time we see this subscriber in a
    // good state (trial start or immediate paid). Dedupe per subscription id
    // so replays + the created→updated double-fire only send once.
    if (isNew && isGood && subId) {
      await sendPremiumConfirmation(userId, subId, plan, status, trialEnd);
    }
  } catch (e: any) {
    console.warn("[sub-lifecycle] syncPremiumSubFromStripe failed", e?.message || e);
  }
}

// ── Invoice payment failed → enter grace + dunning attempt 1 ────────────────
export async function handlePremiumInvoicePaymentFailed(invoice: any): Promise<void> {
  try {
    if (!invoice) return;
    const plan = await premiumPlanFromInvoice(invoice);
    if (plan === null) return;

    await ensureSubStateSchema();
    const customerId = customerIdOf(invoice);
    const userId = await resolveUserId(customerId);
    if (!userId) return;

    const subId: string | null =
      typeof invoice.subscription === "string" ? invoice.subscription : null;
    const grace = new Date(Date.now() + PREMIUM_GRACE_DAYS * 86400_000);

    const r = await db.execute(sql`
      INSERT INTO sasquatch_premium_subscriptions
        (user_id, stripe_customer_id, stripe_subscription_id, status, plan,
         payment_state, last_payment_failed_at, dunning_attempts, grace_period_end, updated_at)
      VALUES
        (${userId}, ${customerId}, ${subId}, 'past_due', ${plan},
         'failed', now(), 1, ${grace}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, sasquatch_premium_subscriptions.stripe_subscription_id),
        status = 'past_due',
        plan = EXCLUDED.plan,
        payment_state = 'failed',
        last_payment_failed_at = now(),
        dunning_attempts = sasquatch_premium_subscriptions.dunning_attempts + 1,
        grace_period_end = COALESCE(sasquatch_premium_subscriptions.grace_period_end, ${grace}),
        updated_at = now()
      RETURNING grace_period_end, dunning_attempts, stripe_subscription_id
    `);
    const row = (r.rows as any[])[0];
    const graceEnd: Date = row?.grace_period_end ? new Date(row.grace_period_end) : grace;
    const effectiveSubId: string = row?.stripe_subscription_id || subId || "";

    invalidateSasquatchPremium(customerId);

    // One dunning email per failed invoice (Stripe smart-retries create a new
    // failed invoice per attempt). Dedupe on invoice id.
    const invoiceId = String(invoice.id || effectiveSubId || Date.now());
    await sendDunningEmail(userId, invoiceId, graceEnd);
  } catch (e: any) {
    console.warn("[sub-lifecycle] handlePremiumInvoicePaymentFailed failed", e?.message || e);
  }
}

// ── Invoice paid → recovery + receipt ───────────────────────────────────────
export async function handlePremiumInvoicePaid(invoice: any): Promise<void> {
  try {
    if (!invoice) return;
    const plan = await premiumPlanFromInvoice(invoice);
    if (plan === null) return;

    await ensureSubStateSchema();
    const customerId = customerIdOf(invoice);
    const userId = await resolveUserId(customerId);
    if (!userId) return;

    const subId: string | null =
      typeof invoice.subscription === "string" ? invoice.subscription : null;

    // Was this account in a failed/downgraded state before this payment?
    let wasFailing = false;
    const prior = await getSubStateByUserId(userId);
    if (prior && (prior.payment_state === "failed" || prior.downgraded_at)) {
      wasFailing = true;
    }

    // Restore health. Upsert so a renewal for a healthy account still records
    // current_period tracking; keeps status 'active' as the authoritative
    // subscription.updated event will also confirm.
    await db.execute(sql`
      INSERT INTO sasquatch_premium_subscriptions
        (user_id, stripe_customer_id, stripe_subscription_id, status, plan,
         payment_state, grace_period_end, downgraded_at, dunning_attempts,
         last_recovered_at, updated_at)
      VALUES
        (${userId}, ${customerId}, ${subId}, 'active', ${plan},
         'ok', NULL, NULL, 0, ${wasFailing ? sql`now()` : sql`NULL`}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, sasquatch_premium_subscriptions.stripe_subscription_id),
        plan = EXCLUDED.plan,
        payment_state = 'ok',
        grace_period_end = NULL,
        downgraded_at = NULL,
        dunning_attempts = 0,
        status = CASE WHEN sasquatch_premium_subscriptions.status = 'past_due'
                        OR sasquatch_premium_subscriptions.status = 'unpaid'
                      THEN 'active' ELSE sasquatch_premium_subscriptions.status END,
        last_recovered_at = ${wasFailing ? sql`now()` : sql`sasquatch_premium_subscriptions.last_recovered_at`},
        updated_at = now()
    `);

    invalidateSasquatchPremium(customerId);

    const invoiceId = String(invoice.id || subId || Date.now());
    if (wasFailing) {
      await sendRecoveryEmail(userId, invoiceId);
    }

    // Receipt for any real charge (skips the $0 trial-start invoice).
    const amountPaid: number = Number(invoice.amount_paid || 0);
    if (amountPaid > 0) {
      await sendReceiptEmail(userId, invoiceId, {
        amountCents: amountPaid,
        currency: String(invoice.currency || "usd"),
        number: invoice.number ? String(invoice.number) : null,
        hostedUrl: invoice.hosted_invoice_url ? String(invoice.hosted_invoice_url) : null,
        plan,
      });
    }
  } catch (e: any) {
    console.warn("[sub-lifecycle] handlePremiumInvoicePaid failed", e?.message || e);
  }
}

// ── Reads ───────────────────────────────────────────────────────────────────
export async function getSubStateByUserId(userId: string): Promise<PremiumSubState | null> {
  await ensureSubStateSchema();
  const r = await db.execute(sql`
    SELECT * FROM sasquatch_premium_subscriptions WHERE user_id = ${userId} LIMIT 1
  `);
  return ((r.rows as any[])[0] as PremiumSubState) || null;
}

export async function getSubStateByCustomerId(customerId: string): Promise<PremiumSubState | null> {
  await ensureSubStateSchema();
  const r = await db.execute(sql`
    SELECT * FROM sasquatch_premium_subscriptions
     WHERE stripe_customer_id = ${customerId}
     ORDER BY updated_at DESC LIMIT 1
  `);
  return ((r.rows as any[])[0] as PremiumSubState) || null;
}

// Resolve the survivor's Sasquatch Premium Stripe subscription object. A customer
// can hold subscriptions for OTHER products (KreAIte tiers, voice clone), so we
// list + filter against the premium price set via `premiumPlanFromSubscription`
// rather than blindly grabbing the newest. Prefers a live (non-terminal) premium
// sub; falls back to the newest premium sub of any status. Returns the raw Stripe
// object so callers can read status/plan/items without a second round-trip.
export async function resolvePremiumStripeSubscription(customerId: string): Promise<any | null> {
  if (!customerId) return null;
  try {
    const stripe = await getUncachableStripeClient();
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    let fallback: any | null = null;
    for (const sub of list.data) {
      const plan = await premiumPlanFromSubscription(sub);
      if (plan === null) continue; // not a premium sub — skip
      if (!fallback) fallback = sub;
      if (LIVE_STRIPE_STATUSES.has(String(sub.status))) return sub;
    }
    return fallback;
  } catch (e: any) {
    console.warn("[sub-lifecycle] resolvePremiumStripeSubscription failed", e?.message || e);
    return null;
  }
}

const LIVE_STRIPE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

// ── Scheduler job: dunning reminders + grace-expiry downgrade + trial-ending ─
export async function runSubscriptionLifecycle(): Promise<void> {
  await ensureSubStateSchema();
  const now = Date.now();

  // 1. Grace-expiry downgrade — failed subs whose grace window has closed.
  try {
    const r = await db.execute(sql`
      SELECT user_id, stripe_customer_id, stripe_subscription_id, grace_period_end
        FROM sasquatch_premium_subscriptions
       WHERE payment_state = 'failed'
         AND downgraded_at IS NULL
         AND grace_period_end IS NOT NULL
         AND grace_period_end <= now()
    `);
    for (const row of r.rows as any[]) {
      try {
        await db.execute(sql`
          UPDATE sasquatch_premium_subscriptions
             SET downgraded_at = now(), updated_at = now()
           WHERE user_id = ${row.user_id} AND downgraded_at IS NULL
        `);
        invalidateSasquatchPremium(row.stripe_customer_id || null);
        const graceKey = row.grace_period_end
          ? new Date(row.grace_period_end).toISOString().slice(0, 10)
          : "na";
        await sendDowngradeEmail(String(row.user_id), `${row.stripe_subscription_id || row.user_id}:${graceKey}`);
      } catch (e: any) {
        console.warn("[sub-lifecycle] downgrade row failed", e?.message || e);
      }
    }
  } catch (e: any) {
    console.warn("[sub-lifecycle] downgrade sweep failed", e?.message || e);
  }

  // 2. Dunning reminders — still in grace. Send at T-3d and T-1d before expiry.
  try {
    const r = await db.execute(sql`
      SELECT user_id, stripe_subscription_id, grace_period_end
        FROM sasquatch_premium_subscriptions
       WHERE payment_state = 'failed'
         AND downgraded_at IS NULL
         AND grace_period_end IS NOT NULL
         AND grace_period_end > now()
    `);
    for (const row of r.rows as any[]) {
      try {
        const graceEnd = new Date(row.grace_period_end);
        const msLeft = graceEnd.getTime() - now;
        const daysLeft = msLeft / 86400_000;
        const graceKey = graceEnd.toISOString().slice(0, 10);
        const subKey = String(row.stripe_subscription_id || row.user_id);
        if (daysLeft <= 1) {
          await sendDunningReminder(String(row.user_id), `${subKey}:${graceKey}:t1`, graceEnd);
        } else if (daysLeft <= 3) {
          await sendDunningReminder(String(row.user_id), `${subKey}:${graceKey}:t3`, graceEnd);
        }
      } catch (e: any) {
        console.warn("[sub-lifecycle] dunning reminder row failed", e?.message || e);
      }
    }
  } catch (e: any) {
    console.warn("[sub-lifecycle] dunning sweep failed", e?.message || e);
  }

  // 3. Trial-ending nudges — trialing subs, not already canceling, at T-3d/T-1d.
  try {
    const r = await db.execute(sql`
      SELECT user_id, stripe_subscription_id, trial_end
        FROM sasquatch_premium_subscriptions
       WHERE status = 'trialing'
         AND cancel_at_period_end = false
         AND trial_end IS NOT NULL
         AND trial_end > now()
    `);
    for (const row of r.rows as any[]) {
      try {
        const trialEnd = new Date(row.trial_end);
        const daysLeft = (trialEnd.getTime() - now) / 86400_000;
        const key = trialEnd.toISOString().slice(0, 10);
        const subKey = String(row.stripe_subscription_id || row.user_id);
        if (daysLeft <= 1) {
          await sendTrialEndingEmail(String(row.user_id), `${subKey}:${key}:t1`, trialEnd);
        } else if (daysLeft <= 3) {
          await sendTrialEndingEmail(String(row.user_id), `${subKey}:${key}:t3`, trialEnd);
        }
      } catch (e: any) {
        console.warn("[sub-lifecycle] trial-ending row failed", e?.message || e);
      }
    }
  } catch (e: any) {
    console.warn("[sub-lifecycle] trial-ending sweep failed", e?.message || e);
  }
}

// ── Admin at-risk / recovered view ──────────────────────────────────────────
export interface RiskRow {
  userId: string;
  email: string | null;
  plan: string;
  status: string;
  paymentState: string;
  dunningAttempts: number;
  gracePeriodEnd: string | null;
  lastPaymentFailedAt: string | null;
  lastRecoveredAt: string | null;
  downgradedAt: string | null;
  currentPeriodEnd: string | null;
}

export async function getAtRiskSubscriptions(): Promise<{
  atRisk: RiskRow[];
  downgraded: RiskRow[];
  recovered: RiskRow[];
}> {
  await ensureSubStateSchema();
  const rows = await db.execute(sql`
    SELECT s.user_id, u.email, s.plan, s.status, s.payment_state,
           s.dunning_attempts, s.grace_period_end, s.last_payment_failed_at,
           s.last_recovered_at, s.downgraded_at, s.current_period_end
      FROM sasquatch_premium_subscriptions s
      LEFT JOIN users u ON u.id = s.user_id
     WHERE s.payment_state = 'failed'
        OR s.downgraded_at IS NOT NULL
        OR (s.last_recovered_at IS NOT NULL AND s.last_recovered_at >= now() - interval '30 days')
     ORDER BY s.updated_at DESC
  `);

  const map = (r: any): RiskRow => ({
    userId: String(r.user_id),
    email: r.email ?? null,
    plan: String(r.plan),
    status: String(r.status),
    paymentState: String(r.payment_state),
    dunningAttempts: Number(r.dunning_attempts || 0),
    gracePeriodEnd: r.grace_period_end ?? null,
    lastPaymentFailedAt: r.last_payment_failed_at ?? null,
    lastRecoveredAt: r.last_recovered_at ?? null,
    downgradedAt: r.downgraded_at ?? null,
    currentPeriodEnd: r.current_period_end ?? null,
  });

  const atRisk: RiskRow[] = [];
  const downgraded: RiskRow[] = [];
  const recovered: RiskRow[] = [];
  for (const raw of rows.rows as any[]) {
    const row = map(raw);
    if (row.downgradedAt) downgraded.push(row);
    else if (row.paymentState === "failed") atRisk.push(row);
    else if (row.lastRecoveredAt) recovered.push(row);
  }
  return { atRisk, downgraded, recovered };
}

// ── Transactional messaging (Sasquatch voice — terse, em-dashes, no emoji) ──
const PORTAL_URL = "/recovery/premium";

function fmtAmount(cents: number, currency: string): string {
  const symbol = currency.toLowerCase() === "usd" ? "$" : "";
  return `${symbol}${(cents / 100).toFixed(2)}${symbol ? "" : " " + currency.toUpperCase()}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Human label per plan for transactional copy. Founder is its own tier name.
function planLabel(plan: string): string {
  if (plan === "annual") return "annual";
  if (plan === "founder") return "Founder's Circle";
  return "monthly";
}

async function sendPremiumConfirmation(
  userId: string,
  subId: string,
  plan: string,
  status: string,
  trialEnd: Date | null,
): Promise<void> {
  const trialing = status === "trialing" && trialEnd;
  const subject = trialing
    ? "You're in — Sasquatch Premium trial started"
    : "You're in — Sasquatch Premium is live";
  const first = trialing
    ? `Your ${PREMIUM_GRACE_DAYS === 7 ? "7" : ""}-day free trial is running. Full access, minute one. First charge lands ${trialEnd ? fmtDate(trialEnd) : "when the trial ends"} — cancel before then and you owe nothing.`
    : `Payment cleared. Everything Sasquatch is uncapped from right now.`;
  const bodyHtml = `
    <p class="body-text">Heart's still thumpin'. You just unlocked Sasquatch Premium — ${planLabel(plan)} plan.</p>
    <p class="body-text">${first}</p>
    <p class="body-text">What's uncapped: unlimited Coach, unlimited Recovery Anchor renders, voice cloning, the premium Campfire fires with Nick.</p>
    ${ctaButton(PORTAL_URL, "Open Sasquatch Premium")}
    <p class="body-text">Manage or cancel anytime from the billing portal — one click, no hoops.</p>
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-confirm",
    dedupeKey: `premium-confirm:${subId}`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Welcome to Premium", bodyHtml, previewText: subject }),
    text: `${subject}\n\n${first}\n\nManage anytime: ${PORTAL_URL}`,
  });
}

async function sendReceiptEmail(
  userId: string,
  invoiceId: string,
  opts: { amountCents: number; currency: string; number: string | null; hostedUrl: string | null; plan: string },
): Promise<void> {
  const amount = fmtAmount(opts.amountCents, opts.currency);
  const subject = `Receipt — Sasquatch Premium (${amount})`;
  const invLine = opts.number ? `Invoice ${opts.number}. ` : "";
  const bodyHtml = `
    <p class="body-text">Payment received — thank you for keeping your recovery uncapped.</p>
    <p class="body-text"><strong>${amount}</strong> · Sasquatch Premium (${planLabel(opts.plan)}). ${invLine}Charged ${fmtDate(new Date())}.</p>
    ${opts.hostedUrl ? ctaButton(opts.hostedUrl, "View invoice") : ""}
    <p class="body-text">Manage billing anytime from the portal.</p>
    ${ctaButton(PORTAL_URL, "Manage billing")}
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-receipt",
    dedupeKey: `premium-receipt:${invoiceId}`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Payment received", bodyHtml, previewText: subject }),
    text: `${subject}\n\n${amount} — Sasquatch Premium (${opts.plan}). ${invLine}${opts.hostedUrl ? "Invoice: " + opts.hostedUrl : ""}\n\nManage billing: ${PORTAL_URL}`,
  });
}

async function sendDunningEmail(userId: string, invoiceId: string, graceEnd: Date): Promise<void> {
  const subject = "Payment didn't go through — let's fix it";
  const graceStr = fmtDate(graceEnd);
  const bodyHtml = `
    <p class="body-text">Your card didn't clear this cycle. No panic — this happens.</p>
    <p class="body-text">You keep full Premium access until <strong>${graceStr}</strong>. Update your card before then and nothing changes — Sasquatch stays uncapped.</p>
    ${ctaButton(PORTAL_URL, "Update payment method")}
    <p class="body-text">One click in the billing portal. If the card's fine, Stripe will retry on its own.</p>
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-dunning",
    dedupeKey: `premium-dunning:${invoiceId}:email`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Payment failed", bodyHtml, previewText: subject, showCrisisCallout: false }),
    text: `${subject}\n\nYour card didn't clear. You keep Premium access until ${graceStr}. Update your card: ${PORTAL_URL}`,
  });
  // SMS is a second, independent channel — distinct dedupe key so an email
  // retry never suppresses the text and vice versa. respectPrefs stays TRUE
  // here (unlike the billing-critical email above): the phone number is only
  // resolved from notification_preferences, and SMS must honor sms_enabled
  // consent + quiet hours (TCPA). The engine self-skips (no_phone / sms_disabled)
  // when the survivor hasn't opted in — no send happens in that case.
  await sendMessage({
    userId,
    channel: "sms",
    category: "premium-dunning",
    dedupeKey: `premium-dunning:${invoiceId}:sms`,
    smsBody: `Sasquatch: your Premium payment didn't clear. Access stays until ${graceStr}. Update your card: ${PORTAL_URL}`,
  });
}

async function sendDunningReminder(userId: string, key: string, graceEnd: Date): Promise<void> {
  const subject = "Reminder — update your card to keep Premium";
  const graceStr = fmtDate(graceEnd);
  const bodyHtml = `
    <p class="body-text">Still no luck on the card. Premium access holds until <strong>${graceStr}</strong>, then it pauses.</p>
    <p class="body-text">Fix it in one click and you never miss a beat.</p>
    ${ctaButton(PORTAL_URL, "Update payment method")}
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-dunning",
    dedupeKey: `premium-dunning-reminder:${key}:email`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Keep your Premium", bodyHtml, previewText: subject }),
    text: `${subject}\n\nPremium access holds until ${graceStr}, then it pauses. Update your card: ${PORTAL_URL}`,
  });
  // Second channel — see sendDunningEmail. respectPrefs TRUE so the phone is
  // resolved and sms_enabled consent + quiet hours are honored; engine
  // self-skips when the survivor hasn't opted into SMS.
  await sendMessage({
    userId,
    channel: "sms",
    category: "premium-dunning",
    dedupeKey: `premium-dunning-reminder:${key}:sms`,
    smsBody: `Sasquatch: Premium pauses ${graceStr} unless the card's updated. ${PORTAL_URL}`,
  });
}

async function sendRecoveryEmail(userId: string, invoiceId: string): Promise<void> {
  const subject = "You're back — payment went through";
  const bodyHtml = `
    <p class="body-text">Card cleared. Premium is fully restored — unlimited Coach, Anchors, voice cloning, the premium fires.</p>
    <p class="body-text">Nothing lost. Pick up right where you left off.</p>
    ${ctaButton(PORTAL_URL, "Back to Premium")}
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-recovered",
    dedupeKey: `premium-recovered:${invoiceId}`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Premium restored", bodyHtml, previewText: subject }),
    text: `${subject}\n\nCard cleared. Premium is fully restored. ${PORTAL_URL}`,
  });
}

async function sendDowngradeEmail(userId: string, key: string): Promise<void> {
  const subject = "Premium paused — the payment never cleared";
  const bodyHtml = `
    <p class="body-text">We tried, the card didn't clear, and the grace window closed. Premium is paused for now.</p>
    <p class="body-text">Your data's all still here — journals, anchors, Coach history, your story. Nothing's deleted. Update your card and everything switches back on.</p>
    ${ctaButton(PORTAL_URL, "Restart Premium")}
    <p class="body-text">Free Coach is still yours in the meantime. Come back when you're ready.</p>
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-downgraded",
    dedupeKey: `premium-downgraded:${key}`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Premium paused", bodyHtml, previewText: subject }),
    text: `${subject}\n\nPremium is paused — the card never cleared. Your data's safe. Restart anytime: ${PORTAL_URL}`,
  });
}

async function sendTrialEndingEmail(userId: string, key: string, trialEnd: Date): Promise<void> {
  const subject = "Your Premium trial is almost up";
  const endStr = fmtDate(trialEnd);
  const bodyHtml = `
    <p class="body-text">Your free trial ends <strong>${endStr}</strong>. After that, your plan renews so Sasquatch stays uncapped — unlimited Coach, Anchors, voice cloning, the premium fires.</p>
    <p class="body-text">Want to keep going? Do nothing — it rolls right over. Want out? One click, no charge.</p>
    ${ctaButton(PORTAL_URL, "Manage my plan")}
  `;
  await sendMessage({
    userId,
    channel: "email",
    category: "premium-trial-ending",
    dedupeKey: `premium-trial-ending:${key}`,
    respectPrefs: false,
    subject,
    html: renderEmail({ headline: "Trial ending soon", bodyHtml, previewText: subject }),
    text: `${subject}\n\nYour free trial ends ${endStr}. Keep going — do nothing. Want out — one click, no charge: ${PORTAL_URL}`,
  });
}
