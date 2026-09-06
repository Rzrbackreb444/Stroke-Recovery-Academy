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
import { WebhookHandlers, type WebhookDependencies } from "../server/webhookHandlers";
import { recoveryStripeService } from "../server/recoveryStripeService";
import { getSentGifts } from "../server/powerPointsService";

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

async function tryProcess(
  payload: any,
  signature = "t=0,v1=invalid",
  dependencies?: WebhookDependencies,
): Promise<Error | null> {
  try {
    await WebhookHandlers.processWebhook(payload, signature, "test-uuid", dependencies);
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

function makePowerPointsPayload(eventId: string, giftId: number, paymentIntent: string) {
  return Buffer.from(
    JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      object: "event",
      data: {
        object: {
          id: `cs_test_${eventId}`,
          object: "checkout.session",
          status: "complete",
          payment_status: "paid",
          payment_intent: paymentIntent,
          metadata: {
            type: "power_points",
            giftId: String(giftId),
          },
        },
      },
    }),
  );
}

function makeAbandonedPowerPointsPayload(
  eventId: string,
  eventType: "checkout.session.expired" | "checkout.session.async_payment_failed",
  giftId: number,
) {
  return Buffer.from(
    JSON.stringify({
      id: eventId,
      type: eventType,
      object: "event",
      data: {
        object: {
          id: `cs_test_${eventId}`,
          object: "checkout.session",
          status: eventType === "checkout.session.expired" ? "expired" : "open",
          payment_status: "unpaid",
          metadata: {
            type: "power_points",
            giftId: String(giftId),
          },
        },
      },
    }),
  );
}

function makeRecoveryPaymentPayload(
  eventId: string,
  type: "tip" | "premium_purchase",
  metadata: Record<string, string>,
  paymentIntent: string,
) {
  return Buffer.from(
    JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      object: "event",
      data: {
        object: {
          id: `cs_test_${eventId}`,
          object: "checkout.session",
          status: "complete",
          payment_status: "paid",
          amount_total: 2500,
          payment_intent: paymentIntent,
          metadata: { ...metadata, type },
        },
      },
    }),
  );
}

const noOpSync: WebhookDependencies["sync"] = {
  async processWebhook() {},
};

async function createRecoveryPaymentFixture() {
  const creatorId = `stripe-webhook-creator-${randomUUID()}`;
  const buyerId = `stripe-webhook-buyer-${randomUUID()}`;
  const slug = `stripe-webhook-story-${randomUUID()}`;

  await dbPool.query(
    `INSERT INTO users (id, email, first_name, last_name)
     VALUES ($1, $2, 'Creator', 'Test'), ($3, $4, 'Buyer', 'Test')`,
    [creatorId, `${creatorId}@test.invalid`, buyerId, `${buyerId}@test.invalid`],
  );
  const story = await dbPool.query(
    `INSERT INTO recovery_stories
       (author_id, slug, title, content, status, is_premium, premium_price)
     VALUES ($1, $2, 'Webhook Test Story', 'Test content', 'published', true, 2500)
     RETURNING id`,
    [creatorId, slug],
  );

  return {
    creatorId,
    buyerId,
    storyId: story.rows[0].id as number,
    tipPaymentIntent: `pi_test_tip_${randomUUID()}`,
    premiumPaymentIntent: `pi_test_premium_${randomUUID()}`,
  };
}

async function recoveryPaymentCounts(
  type: "tip" | "premium_purchase",
  paymentIntent: string,
) {
  const table = type === "tip"
    ? "recovery_creator_tips"
    : "recovery_premium_purchases";
  const result = await dbPool.query(
    `SELECT id, stripe_payment_id
       FROM ${table}
      WHERE stripe_payment_id = $1`,
    [paymentIntent],
  );
  return result.rows;
}

async function cleanupRecoveryPaymentFixture(
  fixture: Awaited<ReturnType<typeof createRecoveryPaymentFixture>>,
) {
  await dbPool.query(
    `DELETE FROM users WHERE id = ANY($1)`,
    [[fixture.creatorId, fixture.buyerId]],
  );
}

async function createGiftFixture(points = 100) {
  const senderId = `stripe-webhook-sender-${randomUUID()}`;
  const receiverId = `stripe-webhook-receiver-${randomUUID()}`;
  const paymentIntent = `pi_test_${randomUUID()}`;

  await dbPool.query(
    `INSERT INTO users (id, email, first_name, last_name)
     VALUES ($1, $2, 'Supporter', 'Test'), ($3, $4, 'Survivor', 'Test')`,
    [senderId, `${senderId}@test.invalid`, receiverId, `${receiverId}@test.invalid`],
  );
  await dbPool.query(
    `INSERT INTO credit_wallets
       (user_id, balance, bonus_credits, lifetime_earned, lifetime_spent)
     VALUES ($1, 0, 0, 0, 0)`,
    [receiverId],
  );
  const gift = await dbPool.query(
    `INSERT INTO power_point_gifts
       (sender_id, receiver_id, package_key, points, amount_cents, status)
     VALUES ($1, $2, 'spark', $3, 500, 'pending')
     RETURNING id`,
    [senderId, receiverId, points],
  );

  return {
    senderId,
    receiverId,
    giftId: gift.rows[0].id as number,
    paymentIntent,
  };
}

async function fixtureCounts(receiverId: string, giftId: number) {
  const [gift, wallet, ledger] = await Promise.all([
    dbPool.query(
      `SELECT id, status, stripe_payment_id
         FROM power_point_gifts
        WHERE id = $1`,
      [giftId],
    ),
    dbPool.query(
      `SELECT bonus_credits, lifetime_earned
         FROM credit_wallets
        WHERE user_id = $1`,
      [receiverId],
    ),
    dbPool.query(
      `SELECT id, reference_type, reference_id, amount
         FROM credit_ledger
        WHERE user_id = $1
          AND reference_type = 'power_point_gift'
          AND reference_id = $2`,
      [receiverId, String(giftId)],
    ),
  ]);

  return {
    gift: gift.rows[0] ?? null,
    wallet: wallet.rows[0] ?? null,
    ledger: ledger.rows,
  };
}

async function cleanupGiftFixture(fixture: Awaited<ReturnType<typeof createGiftFixture>>) {
  await dbPool.query(`DELETE FROM users WHERE id = ANY($1)`, [[fixture.senderId, fixture.receiverId]]);
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

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Paid Power Points fulfillment: concurrent webhook deliveries credit once");
  const concurrentEventId = `evt_test_${runId}_power_points_concurrent`;
  created.push(concurrentEventId);
  const concurrentFixture = await createGiftFixture();
  try {
    const payload = makePowerPointsPayload(
      concurrentEventId,
      concurrentFixture.giftId,
      concurrentFixture.paymentIntent,
    );
    const dependencies: WebhookDependencies = { sync: noOpSync };
    const errors = await Promise.all([
      tryProcess(payload, "test-signature", dependencies),
      tryProcess(payload, "test-signature", dependencies),
    ]);
    assert(errors.every((error) => error === null), "both concurrent deliveries return successfully");

    const counts = await fixtureCounts(concurrentFixture.receiverId, concurrentFixture.giftId);
    assert(counts.gift?.status === "delivered", "concurrent delivery marks the gift delivered");
    assert(
      counts.gift?.stripe_payment_id === concurrentFixture.paymentIntent,
      "delivered gift keeps the Stripe payment reference",
    );
    assert(counts.wallet?.bonus_credits === 100, "receiver gets the Power Points exactly once");
    assert(counts.wallet?.lifetime_earned === 100, "receiver lifetime credits increase exactly once");
    assert(counts.ledger.length === 1, "gift creates exactly one credit ledger entry");
    assert(
      counts.ledger[0]?.reference_type === "power_point_gift" &&
        counts.ledger[0]?.reference_id === String(concurrentFixture.giftId) &&
        counts.ledger[0]?.amount === 100,
      "the single ledger entry references the delivered gift",
    );
    const row = await eventRow(concurrentEventId);
    assert(row?.status === "processed", "concurrent event ends processed");
  } finally {
    await cleanupGiftFixture(concurrentFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Abandoned Power Points checkout is terminal and never credits later");
  const expiredEventId = `evt_test_${runId}_power_points_expired`;
  const failedEventId = `evt_test_${runId}_power_points_async_failed`;
  const latePaidEventId = `evt_test_${runId}_power_points_late_paid`;
  created.push(expiredEventId, failedEventId, latePaidEventId);
  const abandonedFixture = await createGiftFixture();
  const failedFixture = await createGiftFixture();
  try {
    const dependencies: WebhookDependencies = { sync: noOpSync };
    const expiredPayload = makeAbandonedPowerPointsPayload(
      expiredEventId,
      "checkout.session.expired",
      abandonedFixture.giftId,
    );
    assert(
      (await tryProcess(expiredPayload, "test-signature", dependencies)) === null,
      "expired checkout is acknowledged",
    );
    const expiredCounts = await fixtureCounts(
      abandonedFixture.receiverId,
      abandonedFixture.giftId,
    );
    assert(expiredCounts.gift?.status === "canceled", "expired gift leaves pending");
    assert(expiredCounts.wallet?.bonus_credits === 0, "expired gift does not credit the receiver");
    assert(expiredCounts.ledger.length === 0, "expired gift creates no credit ledger entry");

    // A replay is idempotent, and a differently delivered paid event cannot
    // resurrect the canceled row because delivery also claims only pending.
    assert(
      (await tryProcess(expiredPayload, "test-signature", dependencies)) === null,
      "replayed expiration is ignored",
    );
    const latePaidPayload = makePowerPointsPayload(
      latePaidEventId,
      abandonedFixture.giftId,
      abandonedFixture.paymentIntent,
    );
    assert(
      (await tryProcess(latePaidPayload, "test-signature", dependencies)) === null,
      "late paid event is acknowledged without delivery",
    );
    const latePaidCounts = await fixtureCounts(
      abandonedFixture.receiverId,
      abandonedFixture.giftId,
    );
    assert(latePaidCounts.gift?.status === "canceled", "late payment cannot reopen a canceled gift");
    assert(latePaidCounts.wallet?.bonus_credits === 0, "late payment cannot credit a canceled gift");

    const sent = await getSentGifts(abandonedFixture.senderId);
    assert(
      sent[0]?.paymentStatus === "unpaid" && sent[0]?.paymentStatusLabel === "Not paid",
      "sent history labels a canceled gift as unpaid",
    );

    const failedPayload = makeAbandonedPowerPointsPayload(
      failedEventId,
      "checkout.session.async_payment_failed",
      failedFixture.giftId,
    );
    assert(
      (await tryProcess(failedPayload, "test-signature", dependencies)) === null,
      "failed delayed payment is acknowledged",
    );
    assert(
      (await fixtureCounts(failedFixture.receiverId, failedFixture.giftId)).gift?.status === "canceled",
      "failed delayed payment leaves pending",
    );
  } finally {
    await cleanupGiftFixture(abandonedFixture);
    await cleanupGiftFixture(failedFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Failed fulfillment: retry does not duplicate a paid gift or credit");
  const retryEventId = `evt_test_${runId}_power_points_retry`;
  created.push(retryEventId);
  const retryFixture = await createGiftFixture();
  try {
    let failAfterFirstFulfillment = true;
    const dependencies: WebhookDependencies = {
      sync: noOpSync,
      processSuccessfulPayment: async (session) => {
        await recoveryStripeService.processSuccessfulPayment(session);
        if (failAfterFirstFulfillment) {
          failAfterFirstFulfillment = false;
          throw new Error("simulated post-fulfillment webhook failure");
        }
      },
    };
    const payload = makePowerPointsPayload(
      retryEventId,
      retryFixture.giftId,
      retryFixture.paymentIntent,
    );

    const firstError = await tryProcess(payload, "test-signature", dependencies);
    assert(firstError !== null, "a failed first attempt surfaces an error for Stripe retry");
    assert((await eventRow(retryEventId))?.status === "failed", "failed fulfillment leaves the event retryable");

    const retryError = await tryProcess(payload, "test-signature", dependencies);
    assert(retryError === null, "the same successful checkout can be retried");

    const counts = await fixtureCounts(retryFixture.receiverId, retryFixture.giftId);
    assert(counts.gift?.status === "delivered", "retried gift remains delivered");
    assert(counts.wallet?.bonus_credits === 100, "retry does not duplicate receiver credits");
    assert(counts.wallet?.lifetime_earned === 100, "retry does not duplicate lifetime credits");
    assert(counts.ledger.length === 1, "retry leaves one ledger entry for the gift");
    assert(
      counts.ledger[0]?.reference_id === String(retryFixture.giftId),
      "retry preserves the ledger reference to the gift",
    );
    assert((await eventRow(retryEventId))?.status === "processed", "successful retry marks the event processed");
  } finally {
    await cleanupGiftFixture(retryFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Paid recovery tips: concurrent deliveries create one tip");
  const tipConcurrentEventIds = [
    `evt_test_${runId}_tip_concurrent_1`,
    `evt_test_${runId}_tip_concurrent_2`,
  ];
  created.push(...tipConcurrentEventIds);
  const tipConcurrentFixture = await createRecoveryPaymentFixture();
  try {
    const payloads = tipConcurrentEventIds.map((eventId) =>
      makeRecoveryPaymentPayload(
        eventId,
        "tip",
        {
          creatorId: tipConcurrentFixture.creatorId,
          storyId: String(tipConcurrentFixture.storyId),
          fromUserId: tipConcurrentFixture.buyerId,
        },
        tipConcurrentFixture.tipPaymentIntent,
      ),
    );
    const dependencies: WebhookDependencies = {
      sync: noOpSync,
      processSuccessfulPayment: (session) =>
        recoveryStripeService.processSuccessfulPayment(session),
    };
    const errors = await Promise.all(
      payloads.map((payload) => tryProcess(payload, "test-signature", dependencies)),
    );
    assert(errors.every((error) => error === null), "concurrent tip deliveries return successfully");
    assert(
      (await recoveryPaymentCounts("tip", tipConcurrentFixture.tipPaymentIntent)).length === 1,
      "concurrent tip deliveries create exactly one tip record",
    );
    assert(
      (await Promise.all(tipConcurrentEventIds.map(eventRow))).every(
        (row) => row?.status === "processed",
      ),
      "concurrent tip events end processed",
    );
  } finally {
    await cleanupRecoveryPaymentFixture(tipConcurrentFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Paid recovery tips: a failed webhook retry does not duplicate the tip");
  const tipRetryEventId = `evt_test_${runId}_tip_retry`;
  created.push(tipRetryEventId);
  const tipRetryFixture = await createRecoveryPaymentFixture();
  try {
    let failAfterFirstFulfillment = true;
    const dependencies: WebhookDependencies = {
      sync: noOpSync,
      processSuccessfulPayment: async (session) => {
        await recoveryStripeService.processSuccessfulPayment(session);
        if (failAfterFirstFulfillment) {
          failAfterFirstFulfillment = false;
          throw new Error("simulated post-tip webhook failure");
        }
      },
    };
    const payload = makeRecoveryPaymentPayload(
      tipRetryEventId,
      "tip",
      {
        creatorId: tipRetryFixture.creatorId,
        storyId: String(tipRetryFixture.storyId),
        fromUserId: tipRetryFixture.buyerId,
      },
      tipRetryFixture.tipPaymentIntent,
    );

    const firstError = await tryProcess(payload, "test-signature", dependencies);
    assert(firstError !== null, "a failed tip attempt surfaces an error for Stripe retry");
    assert(
      (await recoveryPaymentCounts("tip", tipRetryFixture.tipPaymentIntent)).length === 1,
      "the failed tip attempt still creates one tip record",
    );
    assert(
      (await eventRow(tipRetryEventId))?.status === "failed",
      "failed tip fulfillment leaves the event retryable",
    );

    const retryError = await tryProcess(payload, "test-signature", dependencies);
    assert(retryError === null, "the paid tip can be retried successfully");
    assert(
      (await recoveryPaymentCounts("tip", tipRetryFixture.tipPaymentIntent)).length === 1,
      "tip retry leaves one tip record",
    );
    assert(
      (await eventRow(tipRetryEventId))?.status === "processed",
      "successful tip retry marks the event processed",
    );
  } finally {
    await cleanupRecoveryPaymentFixture(tipRetryFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Premium purchases: concurrent deliveries create one purchase");
  const premiumConcurrentEventIds = [
    `evt_test_${runId}_premium_concurrent_1`,
    `evt_test_${runId}_premium_concurrent_2`,
  ];
  created.push(...premiumConcurrentEventIds);
  const premiumConcurrentFixture = await createRecoveryPaymentFixture();
  try {
    const payloads = premiumConcurrentEventIds.map((eventId) =>
      makeRecoveryPaymentPayload(
        eventId,
        "premium_purchase",
        {
          storyId: String(premiumConcurrentFixture.storyId),
          buyerId: premiumConcurrentFixture.buyerId,
        },
        premiumConcurrentFixture.premiumPaymentIntent,
      ),
    );
    const dependencies: WebhookDependencies = {
      sync: noOpSync,
      processSuccessfulPayment: (session) =>
        recoveryStripeService.processSuccessfulPayment(session),
    };
    const errors = await Promise.all(
      payloads.map((payload) => tryProcess(payload, "test-signature", dependencies)),
    );
    assert(errors.every((error) => error === null), "concurrent premium deliveries return successfully");
    assert(
      (await recoveryPaymentCounts("premium_purchase", premiumConcurrentFixture.premiumPaymentIntent)).length === 1,
      "concurrent premium deliveries create exactly one purchase record",
    );
    assert(
      (await Promise.all(premiumConcurrentEventIds.map(eventRow))).every(
        (row) => row?.status === "processed",
      ),
      "concurrent premium events end processed",
    );
  } finally {
    await cleanupRecoveryPaymentFixture(premiumConcurrentFixture);
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n• Premium purchases: a failed webhook retry does not duplicate the purchase");
  const premiumRetryEventId = `evt_test_${runId}_premium_retry`;
  created.push(premiumRetryEventId);
  const premiumRetryFixture = await createRecoveryPaymentFixture();
  try {
    let failAfterFirstFulfillment = true;
    const dependencies: WebhookDependencies = {
      sync: noOpSync,
      processSuccessfulPayment: async (session) => {
        await recoveryStripeService.processSuccessfulPayment(session);
        if (failAfterFirstFulfillment) {
          failAfterFirstFulfillment = false;
          throw new Error("simulated post-purchase webhook failure");
        }
      },
    };
    const payload = makeRecoveryPaymentPayload(
      premiumRetryEventId,
      "premium_purchase",
      {
        storyId: String(premiumRetryFixture.storyId),
        buyerId: premiumRetryFixture.buyerId,
      },
      premiumRetryFixture.premiumPaymentIntent,
    );

    const firstError = await tryProcess(payload, "test-signature", dependencies);
    assert(firstError !== null, "a failed premium attempt surfaces an error for Stripe retry");
    assert(
      (await recoveryPaymentCounts("premium_purchase", premiumRetryFixture.premiumPaymentIntent)).length === 1,
      "the failed premium attempt still creates one purchase record",
    );
    assert(
      (await eventRow(premiumRetryEventId))?.status === "failed",
      "failed premium fulfillment leaves the event retryable",
    );

    const retryError = await tryProcess(payload, "test-signature", dependencies);
    assert(retryError === null, "the premium purchase can be retried successfully");
    assert(
      (await recoveryPaymentCounts("premium_purchase", premiumRetryFixture.premiumPaymentIntent)).length === 1,
      "premium retry leaves one purchase record",
    );
    assert(
      (await eventRow(premiumRetryEventId))?.status === "processed",
      "successful premium retry marks the event processed",
    );
  } finally {
    await cleanupRecoveryPaymentFixture(premiumRetryFixture);
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
