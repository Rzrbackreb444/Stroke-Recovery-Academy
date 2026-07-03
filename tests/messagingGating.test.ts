/**
 * tests/messagingGating.test.ts — integration tests for the lifecycle-messaging
 * GATING layer (`server/messaging/index.ts::sendMessage`).
 *
 * Why these tests matter:
 *   - tests/lifecycleService.test.ts covers AUDIENCE SELECTION (who is eligible).
 *     The layer that runs AFTER selection — sendMessage honoring a global
 *     unsubscribe, a disabled channel, and quiet hours — had zero automated
 *     coverage. A regression here sends nudges to survivors who explicitly opted
 *     out: a trust + compliance failure, not just a bug.
 *   - We assert both the returned SendResult AND the side effect: a suppressed
 *     send must write NO message_deliveries row, and an eligible send must make
 *     a claim (the claim-before-send row the dedupe relies on).
 *
 * No real message is ever sent:
 *   - The suppression cases (unsubscribed_all / email_disabled / quiet_hours)
 *     all short-circuit BEFORE the provider is ever touched.
 *   - The "eligible → claim is made" case uses the push channel against a user
 *     with zero push_subscriptions, so sendPushToUser iterates an empty set and
 *     performs no network I/O — the claim is still made and retained, which is
 *     exactly what we assert. (The email export is a read-only ESM binding and
 *     cannot be monkeypatched without a loader; push is the clean, side-effect-
 *     free way to prove the claim-before-send.)
 *   - The "eligible email passes the gate" case neutralizes the Resend
 *     connector credentials so sendEmail fails fast with NO network call and NO
 *     real email — proving the email channel is not gated for an eligible user
 *     and that a provider failure releases the claim (retry semantics).
 *
 * Test isolation:
 *   - Every seeded user id / email / dedupe key is namespaced with a per-run
 *     UUID so a busy dev DB never makes the test flaky, and cleanup in a
 *     finally{} block never leaks rows even if an assertion fails.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { sendMessage, ensureMessagingSchema } from "../server/messaging/index";

// ── tiny test harness (matches lifecycleService.test.ts / stripeWebhook.test.ts) ─
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

async function run() {
  const runId = randomUUID().slice(0, 8);
  const emailFor = (tag: string) => `msg+${runId}-${tag}@test.invalid`;
  const keyFor = (tag: string) => `msg-gating:${runId}:${tag}`;
  const userIds: string[] = [];

  // Provision the messaging tables/columns on a fresh dev DB (idempotent).
  await ensureMessagingSchema();

  async function seedUser(tag: string): Promise<string> {
    const r = await dbPool.query(
      `INSERT INTO users (email, first_name, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       RETURNING id`,
      [emailFor(tag), "Test"],
    );
    const id = r.rows[0].id as string;
    userIds.push(id);
    return id;
  }

  // Upsert the channel/quiet-hours prefs row for a user.
  async function setPrefs(
    userId: string,
    p: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      smsPhone?: string | null;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
      timezone?: string;
      unsubscribedAll?: boolean;
    },
  ) {
    await dbPool.query(
      `INSERT INTO notification_preferences
         (user_id, email_enabled, push_enabled, sms_enabled, sms_phone,
          quiet_hours_start, quiet_hours_end, timezone, unsubscribed_all)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         push_enabled = EXCLUDED.push_enabled,
         sms_enabled = EXCLUDED.sms_enabled,
         sms_phone = EXCLUDED.sms_phone,
         quiet_hours_start = EXCLUDED.quiet_hours_start,
         quiet_hours_end = EXCLUDED.quiet_hours_end,
         timezone = EXCLUDED.timezone,
         unsubscribed_all = EXCLUDED.unsubscribed_all`,
      [
        userId,
        p.emailEnabled ?? true,
        p.pushEnabled ?? true,
        p.smsEnabled ?? false,
        p.smsPhone ?? null,
        p.quietHoursStart ?? null,
        p.quietHoursEnd ?? null,
        p.timezone ?? "America/New_York",
        p.unsubscribedAll ?? false,
      ],
    );
  }

  async function deliveryCount(key: string): Promise<number> {
    const r = await dbPool.query(
      `SELECT COUNT(*)::int AS n FROM message_deliveries WHERE dedupe_key = $1`,
      [key],
    );
    return r.rows[0].n as number;
  }

  async function deliveryRow(key: string) {
    const r = await dbPool.query(
      `SELECT status, channel, user_id FROM message_deliveries WHERE dedupe_key = $1`,
      [key],
    );
    return r.rows[0] ?? null;
  }

  // A quiet-hours window guaranteed to contain "now" (UTC), with a 2-hour span
  // so an hour-boundary rollover mid-test can't make it flaky.
  const nowHour = new Date().getUTCHours();
  const qStart = nowHour;
  const qEnd = (nowHour + 2) % 24;

  console.log(`\nmessagingGating.test.ts (runId=${runId})\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    console.log("• Global unsubscribe suppresses every channel");
    {
      const u = await seedUser("unsub");
      await setPrefs(u, { unsubscribedAll: true });
      const key = keyFor("unsub");
      const res = await sendMessage({
        userId: u,
        channel: "email",
        category: "onboarding-d1",
        dedupeKey: key,
        subject: "hi",
        html: "<p>hi</p>",
      });
      assert(res.status === "skipped", "unsubscribed_all → status skipped");
      assert(
        (res as any).reason === "unsubscribed_all",
        "unsubscribed_all → reason unsubscribed_all",
      );
      assert((await deliveryCount(key)) === 0, "unsubscribed_all writes NO delivery row");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Disabled email channel suppresses email");
    {
      const u = await seedUser("emaildis");
      await setPrefs(u, { emailEnabled: false });
      const key = keyFor("emaildis");
      const res = await sendMessage({
        userId: u,
        channel: "email",
        category: "onboarding-d1",
        dedupeKey: key,
        subject: "hi",
        html: "<p>hi</p>",
      });
      assert(res.status === "skipped", "email_enabled=false → status skipped");
      assert(
        (res as any).reason === "email_disabled",
        "email_enabled=false → reason email_disabled",
      );
      assert((await deliveryCount(key)) === 0, "email_disabled writes NO delivery row");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Quiet hours defer push");
    {
      const u = await seedUser("qh-push");
      await setPrefs(u, {
        pushEnabled: true,
        quietHoursStart: qStart,
        quietHoursEnd: qEnd,
        timezone: "UTC",
      });
      const key = keyFor("qh-push");
      const res = await sendMessage({
        userId: u,
        channel: "push",
        category: "streak",
        dedupeKey: key,
        push: { title: "t", body: "b" },
      });
      assert(res.status === "deferred", "push in quiet hours → status deferred");
      assert((res as any).reason === "quiet_hours", "push in quiet hours → reason quiet_hours");
      assert((await deliveryCount(key)) === 0, "deferred push writes NO delivery row");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Quiet hours defer sms");
    {
      const u = await seedUser("qh-sms");
      await setPrefs(u, {
        smsEnabled: true,
        smsPhone: "+15555550123",
        quietHoursStart: qStart,
        quietHoursEnd: qEnd,
        timezone: "UTC",
      });
      const key = keyFor("qh-sms");
      const res = await sendMessage({
        userId: u,
        channel: "sms",
        category: "streak",
        dedupeKey: key,
        smsBody: "b",
      });
      assert(res.status === "deferred", "sms in quiet hours → status deferred");
      assert((res as any).reason === "quiet_hours", "sms in quiet hours → reason quiet_hours");
      assert((await deliveryCount(key)) === 0, "deferred sms writes NO delivery row");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Fresh eligible user → a claim is made (no real send)");
    {
      // Push channel, user has zero push_subscriptions → sendPushToUser is a
      // no-op (empty set, no network), but the claim-before-send row persists.
      const u = await seedUser("eligible");
      await setPrefs(u, { pushEnabled: true }); // no quiet hours, not unsubscribed
      const key = keyFor("eligible");
      const res = await sendMessage({
        userId: u,
        channel: "push",
        category: "onboarding-d1",
        dedupeKey: key,
        push: { title: "t", body: "b" },
      });
      assert(res.status === "sent", "eligible push → status sent");
      const row = await deliveryRow(key);
      assert(row != null, "eligible send makes a delivery claim (row exists)");
      assert(row?.status === "sent", "claim row status is sent");
      assert(row?.user_id === u, "claim row is scoped to the seeded user");

      // A second identical send is blocked by the UNIQUE(dedupe_key) claim.
      const dup = await sendMessage({
        userId: u,
        channel: "push",
        category: "onboarding-d1",
        dedupeKey: key,
        push: { title: "t", body: "b" },
      });
      assert(dup.status === "duplicate", "second send on same key → duplicate");
      assert((await deliveryCount(key)) === 1, "still exactly one delivery row after dup");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Eligible email user is NOT gated (provider mocked out)");
    {
      // Neutralize the Resend connector credentials so sendEmail throws in
      // getCredentials BEFORE any fetch — guarantees zero network + zero real
      // email. Proves the gate lets an eligible email user through to the
      // provider, and that a provider failure releases the claim (retry-safe).
      const savedIdentity = process.env.REPL_IDENTITY;
      const savedRenewal = process.env.WEB_REPL_RENEWAL;
      delete process.env.REPL_IDENTITY;
      delete process.env.WEB_REPL_RENEWAL;
      try {
        const u = await seedUser("email-eligible");
        await setPrefs(u, { emailEnabled: true });
        const key = keyFor("email-eligible");
        const res = await sendMessage({
          userId: u,
          channel: "email",
          category: "onboarding-d1",
          dedupeKey: key,
          subject: "hi",
          html: "<p>hi</p>",
        });
        assert(res.status === "failed", "eligible email w/ dead provider → failed (not skipped/deferred)");
        assert(
          (await deliveryCount(key)) === 0,
          "provider failure releases the claim (no leftover row → next tick retries)",
        );
      } finally {
        if (savedIdentity !== undefined) process.env.REPL_IDENTITY = savedIdentity;
        if (savedRenewal !== undefined) process.env.WEB_REPL_RENEWAL = savedRenewal;
      }
    }
  } finally {
    // Cleanup in finally{} so a failed assertion never leaks rows. Scoped
    // strictly to the users this run seeded.
    try {
      if (userIds.length) {
        await dbPool.query(`DELETE FROM message_deliveries WHERE user_id = ANY($1)`, [userIds]);
        await dbPool.query(`DELETE FROM notification_preferences WHERE user_id = ANY($1)`, [userIds]);
        await dbPool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
      }
    } catch (e) {
      console.error("[cleanup] failed:", e);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  await dbPool.end().catch(() => {});
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (e) => {
  console.error("fatal:", e);
  await dbPool.end().catch(() => {});
  process.exit(2);
});
