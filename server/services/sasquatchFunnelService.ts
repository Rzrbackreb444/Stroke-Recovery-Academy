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
  | "trial_start";

export type FunnelPlan = "monthly" | "annual" | "unknown";

const ALLOWED_EVENTS: FunnelEventType[] = [
  "premium_page_view",
  "checkout_click",
  "trial_start",
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
