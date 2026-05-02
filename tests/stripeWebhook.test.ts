/**
 * tests/stripeWebhook.test.ts — integration tests for the Stripe webhook
 * idempotency layer (`server/webhookHandlers.ts::WebhookHandlers.processWebhook`).
 *
 * Why these tests matter:
 *   - This handler sits between Stripe and the `webhook_events` ledger that
 *     drives revenue fulfillment. A regression here can either DOUBLE-CHARGE
 *     a survivor (re-fulfilling a duplicate replay) or DROP a real payment
 *     (silently swallowing a Stripe retry after a transient failure).
 *   - The cost of a bug is real money + survivor trust; the cost of these
 *     tests is ~one second of test runtime.
 *
 * What we exercise WITHOUT calling real Stripe:
 *   - The Buffer-only contract (string payload must throw — a regression
 *     would mean express.json() ate the raw body, breaking signature checks).
 *   - The idempotency ledger (UNIQUE provider+event_id, status transitions).
 *   - The retry semantics for `failed` rows.
 *   - The stale-recovery path for rows stuck in `received` >5 minutes.
 *
 * What we DON'T exercise here:
 *   - `stripe.webhooks.constructEvent` signature verification (covered by
 *     stripe-replit-sync's own test suite). When `processWebhook` hands the
 *     buffer off, sync throws a signature error, which we catch + assert on
 *     the resulting 'failed' status row.
 *
 * Test isolation:
 *   - All event ids are namespaced with a per-run UUID so concurrent runs
 *     can't collide and so cleanup is precise. Cleanup runs in a finally{}
 *     block so a failed assertion doesn't leak rows.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { WebhookHandlers } from "../server/webhookHandlers";

// ── tiny test harness (matches the style of recoveryAnchorSchema.test.ts) ──
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: any, msg: string) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    failed++;
    failures.push(msg);
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  }
}

async function eventRow(eventId: string) {
  const r = await dbPool.query(
    `SELECT status, error_message, created_at, processed_at
       FROM webhook_events
      WHERE provider = 'stripe' AND event_id = $1`,
    [eventId],
  );
  return r.rows[0] ?? null;
}

async function cleanup(eventIds: string[]) {
  if (eventIds.length === 0) return;
  await dbPool.query(
    `DELETE FROM webhook_events WHERE provider = 'stripe' AND event_id = ANY($1)`,
    [eventIds],
  );
}

async function tryProcess(payload: any, signature = "t=0,v1=invalid"): Promise<Error | null> {
  try {
    await WebhookHandlers.processWebhook(payload, signature, "test-uuid");
    return null;
  } catch (e: any) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

function makePayload(eventId: string, type = "payment_intent.succeeded") {
  return Buffer.from(
    JSON.stringify({
      id: eventId,
      type,
      object: "event",
      data: { object: { id: "pi_test_fake" } },
    }),
  );
}

// ── tests ─────────────────────────────────────────────────────────────────
async function run() {
  const runId = randomUUID().slice(0, 8);
  const created: string[] = [];

  console.log(`\nstripeWebhook.test.ts (runId=${runId})\n`);

  try {

  // ─────────────────────────────────────────────────────────────────────────
  console.log("• Buffer-only contract");
  {
    const err = await tryProcess("not a buffer" as any);
    assert(err !== null, "string payload throws");
    assert(
      !!err && err.message.includes("Payload must be a Buffer"),
      "error message points at the json()-before-raw misconfiguration",
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• First processing attempt creates a 'failed' ledger row (sig invalid)");
  const eventId1 = `evt_test_${runId}_1`;
  created.push(eventId1);
  {
    const err = await tryProcess(makePayload(eventId1));
    assert(err !== null, "invalid signature surfaces an error to the caller");

    const row = await eventRow(eventId1);
    assert(row !== null, "ledger row exists after first attempt");
    assert(row?.status === "failed", `row.status === 'failed' (got: ${row?.status})`);
    assert(
      typeof row?.error_message === "string" && row.error_message.length > 0,
      "row.error_message captured",
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Idempotency: a 'processed' row is NEVER re-run");
  const eventId2 = `evt_test_${runId}_2`;
  created.push(eventId2);
  {
    // Manually plant a 'processed' row (simulating a previously-successful run).
    await dbPool.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, status, processed_at)
       VALUES ('stripe', $1, 'payment_intent.succeeded', 'processed', NOW())`,
      [eventId2],
    );

    // A replay arrives. Because the row is 'processed', the handler must
    // skip — meaning it should NOT throw a signature error (sync is never
    // called) and the row's status must remain 'processed'.
    const err = await tryProcess(makePayload(eventId2));
    assert(err === null, "replay of processed event returns silently (no signature throw)");

    const row = await eventRow(eventId2);
    assert(row?.status === "processed", "row remains 'processed' after replay");
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Retry semantics: a 'failed' row CAN be re-run (Stripe retries are not lost)");
  const eventId3 = `evt_test_${runId}_3`;
  created.push(eventId3);
  {
    // Plant a 'failed' row (simulating a transient outage on first attempt).
    await dbPool.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, status, error_message, processed_at)
       VALUES ('stripe', $1, 'payment_intent.succeeded', 'failed', 'transient outage', NOW())`,
      [eventId3],
    );

    // Stripe retries with the same event id. The handler MUST re-arm the row
    // and attempt sync again — otherwise we'd silently lose the payment.
    const err = await tryProcess(makePayload(eventId3));
    assert(
      err !== null,
      "retry of failed event re-runs sync (and re-fails on the test signature)",
    );

    const row = await eventRow(eventId3);
    // Row should have been re-armed to 'received' then transitioned to 'failed' again.
    assert(
      row?.status === "failed",
      `row ends 'failed' after second attempt (got: ${row?.status})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Stale recovery: a 'received' row stuck >5 minutes IS re-armed");
  const eventId4 = `evt_test_${runId}_4`;
  created.push(eventId4);
  {
    // Plant a 'received' row from 6 minutes ago (worker presumably crashed
    // between reserve and final status update).
    await dbPool.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, status, created_at)
       VALUES ('stripe', $1, 'payment_intent.succeeded', 'received', NOW() - INTERVAL '6 minutes')`,
      [eventId4],
    );

    const err = await tryProcess(makePayload(eventId4));
    assert(
      err !== null,
      "stale received row triggers retry (sync called, throws on test sig)",
    );
    const row = await eventRow(eventId4);
    assert(row?.status === "failed", "stale row is no longer permanently un-retryable");
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Concurrency guard: a fresh 'received' row (<5 min) IS skipped");
  const eventId5 = `evt_test_${runId}_5`;
  created.push(eventId5);
  {
    // Plant a 'received' row from just-now (concurrent worker is handling it).
    await dbPool.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, status, created_at)
       VALUES ('stripe', $1, 'payment_intent.succeeded', 'received', NOW())`,
      [eventId5],
    );

    const err = await tryProcess(makePayload(eventId5));
    assert(err === null, "fresh in-flight row returns silently (no double-processing)");

    const row = await eventRow(eventId5);
    assert(row?.status === "received", "row left untouched for the in-flight worker");
  }

  } finally {
    // Cleanup in finally{} so a failed assertion never leaves zombie rows
    // in webhook_events. This is the most important defensive line in the
    // test — without it, a single CI failure pollutes the dev DB forever.
    await cleanup(created).catch((e) => console.error("[cleanup] failed:", e));
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  // Drain pool so the process exits.
  await dbPool.end().catch(() => {});
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (e) => {
  console.error("fatal:", e);
  await dbPool.end().catch(() => {});
  process.exit(2);
});
