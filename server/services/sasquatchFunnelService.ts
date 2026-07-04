// Sasquatch Premium funnel telemetry — Wave F.
//
// Three event types instrument the conversion path so we can measure whether
// Wave C/E surfaces actually move the needle:
//   - premium_page_view  : /recovery/premium mounted (auth or anon)
//   - checkout_click     : user clicked the "Start trial" CTA
//   - trial_start        : Stripe redirected back with ?subscribed=1
//
// Plan dimension lets us split monthly vs annual conversion. userId is
// nullable so anonymous page views still count toward the top of the funnel.
//
// Runtime CREATE TABLE IF NOT EXISTS pattern matches sibling services
// (sasquatchHistoryService, etc.) — no Drizzle migration required.
import { db } from "../db";
import { sql } from "drizzle-orm";

export type FunnelEventType =
  | "premium_page_view"
  | "checkout_click"
  | "trial_start"
  | "trial_converted"
  | "trial_canceled"
  // Lifecycle (top-of-funnel) milestones — one per user, emitted server-side
  // (and mirrored to GA client-side) so the funnel has real event provenance
  // in addition to the source-of-truth computation.
  | "signup"
  | "intake_complete"
  | "activation";

export type FunnelPlan = "monthly" | "annual" | "unknown";

const ALLOWED_EVENTS: FunnelEventType[] = [
  "premium_page_view",
  "checkout_click",
  "trial_start",
  "trial_converted",
  "trial_canceled",
  "signup",
  "intake_complete",
  "activation",
];
const ALLOWED_PLANS: FunnelPlan[] = ["monthly", "annual", "unknown"];

let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (tableReady) return tableReady;
  tableReady = db
    .execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_funnel_events (
        id BIGSERIAL PRIMARY KEY,
        user_id VARCHAR,
        event_type VARCHAR(40) NOT NULL,
        plan VARCHAR(16) NOT NULL DEFAULT 'unknown',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .then(async () => {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_funnel_event_created
          ON subscription_funnel_events (event_type, created_at)
      `);
    })
    .then(() => undefined)
    .catch((err: any) => {
      // Reset so a transient DB hiccup doesn't permanently disable tracking.
      tableReady = null;
      throw err;
    });
  return tableReady;
}

export function isValidFunnelEvent(s: string): s is FunnelEventType {
  return (ALLOWED_EVENTS as string[]).includes(s);
}

export function isValidFunnelPlan(s: string): s is FunnelPlan {
  return (ALLOWED_PLANS as string[]).includes(s);
}

export async function recordFunnelEvent(opts: {
  userId: string | null;
  eventType: FunnelEventType;
  plan?: FunnelPlan;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ensureTable();
    const plan = opts.plan ?? "unknown";
    const metaJson = JSON.stringify(opts.metadata ?? {});
    await db.execute(sql`
      INSERT INTO subscription_funnel_events (user_id, event_type, plan, metadata)
      VALUES (${opts.userId}, ${opts.eventType}, ${plan}, ${metaJson}::jsonb)
    `);
  } catch (err: any) {
    // Telemetry must never break the user surface — log + swallow.
    console.warn("[funnel] record failed", err?.message || err);
  }
}

// Milestone events that must fire at most once per user (signup, intake_complete,
// activation). Safe to call on every occurrence (e.g. every login, every
// check-in) — the NOT EXISTS guard makes it idempotent. Best-effort: never throws.
export async function recordFunnelEventOnce(opts: {
  userId: string;
  eventType: FunnelEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!opts.userId) return;
  try {
    await ensureTable();
    const metaJson = JSON.stringify(opts.metadata ?? {});
    await db.execute(sql`
      INSERT INTO subscription_funnel_events (user_id, event_type, plan, metadata)
      SELECT ${opts.userId}, ${opts.eventType}, 'unknown', ${metaJson}::jsonb
       WHERE NOT EXISTS (
         SELECT 1 FROM subscription_funnel_events
          WHERE user_id = ${opts.userId} AND event_type = ${opts.eventType}
       )
    `);
  } catch (err: any) {
    console.warn("[funnel] record-once failed", err?.message || err);
  }
}

// Activation = intake complete AND ≥1 check-in AND ≥1 coach message. Called
// fire-and-forget after a check-in or coach turn is saved; emits the activation
// milestone exactly once, when the three-part condition first holds.
export async function maybeRecordActivation(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await ensureTable();
    const r = await db.execute(sql`
      SELECT 1
        FROM user_profiles up
       WHERE up.user_id = ${userId}
         AND up.intake_completed_at IS NOT NULL
         AND EXISTS (SELECT 1 FROM daily_checkins dc WHERE dc.user_id = ${userId})
         AND EXISTS (SELECT 1 FROM sasquatch_chat_messages m WHERE m.user_id = ${userId} AND m.role = 'user')
       LIMIT 1
    `);
    if ((r.rows as any[]).length === 0) return;
    await recordFunnelEventOnce({ userId, eventType: "activation" });
  } catch (err: any) {
    console.warn("[funnel] activation check failed", err?.message || err);
  }
}

// Stripe webhook hook — fires on customer.subscription.updated. Detects
// transitions OUT of `trialing` for the Sasquatch Premium product and writes
// trial_converted (→ active) or trial_canceled (→ canceled / incomplete_expired).
//
// Idempotency: caller already deduped this event via the webhook_events
// table, so a Stripe replay won't reach this code a second time. We do NOT
// add a second per-funnel-event dedupe here — if a non-replay subscription
// transitions trialing → past_due → active, that's two legitimate events
// and we want both recorded.
//
// Plan resolution: we look up the price IDs against the Sasquatch Premium
// price catalog. If neither price matches, this isn't a Sasquatch sub —
// silently skip (other products' subscriptions also fire this webhook).
//
// userId resolution: best-effort lookup of users.stripeCustomerId. If the
// customer is unknown (deleted user, etc.), userId is recorded as null —
// the event still counts toward the global funnel.
export async function recordSasquatchSubscriptionTransition(event: any): Promise<void> {
  try {
    const obj = event?.data?.object;
    const prev = event?.data?.previous_attributes;
    if (!obj || !prev) return;

    // Only react when status itself transitioned.
    const oldStatus = prev.status;
    const newStatus = obj.status;
    if (typeof oldStatus !== "string" || typeof newStatus !== "string") return;
    if (oldStatus === newStatus) return;

    // Map transition → funnel event. Out-of-trial only.
    let eventType: FunnelEventType | null = null;
    if (oldStatus === "trialing" && newStatus === "active") {
      eventType = "trial_converted";
    } else if (
      oldStatus === "trialing" &&
      (newStatus === "canceled" ||
        newStatus === "incomplete_expired" ||
        newStatus === "unpaid")
    ) {
      eventType = "trial_canceled";
    }
    if (!eventType) return;

    // Resolve plan via price ID match against the Sasquatch Premium catalog.
    // Lazy-import to avoid a circular dep (this service ↔ premium service).
    const { getSasquatchPremiumPriceIds } = await import("./sasquatchPremiumService");
    const prices = await getSasquatchPremiumPriceIds();
    if (!prices) return;
    const items: any[] = obj.items?.data ?? [];
    let plan: FunnelPlan = "unknown";
    let matched = false;
    for (const it of items) {
      const pid = it?.price?.id;
      if (pid === prices.monthlyPriceId) {
        plan = "monthly";
        matched = true;
        break;
      }
      if (pid === prices.annualPriceId) {
        plan = "annual";
        matched = true;
        break;
      }
    }
    if (!matched) return; // Not a Sasquatch Premium subscription — skip.

    // Resolve userId from customer.
    const customerId =
      typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
    let userId: string | null = null;
    if (customerId) {
      try {
        const r = await db.execute(sql`
          SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1
        `);
        const row = (r.rows as any[])[0];
        if (row?.id) userId = String(row.id);
      } catch (e: any) {
        console.warn("[funnel] user lookup failed", e?.message || e);
      }
    }

    await recordFunnelEvent({
      userId,
      eventType,
      plan,
      metadata: {
        subscriptionId: obj.id,
        customerId,
        oldStatus,
        newStatus,
      },
    });
  } catch (e: any) {
    console.warn("[funnel] subscription transition failed", e?.message || e);
  }
}

// Admin/diagnostic — counts grouped by event for the last N days.
export async function getFunnelSummary(days = 30): Promise<
  Array<{ event_type: string; plan: string; count: number }>
> {
  await ensureTable();
  const rows = await db.execute(sql`
    SELECT event_type, plan, COUNT(*)::int as count
      FROM subscription_funnel_events
     WHERE created_at >= now() - (${days} || ' days')::interval
  GROUP BY event_type, plan
  ORDER BY event_type, plan
  `);
  return rows.rows as any[];
}
