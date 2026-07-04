/**
 * tests/smsOptOut.test.ts — coverage for SMS opt-out / carrier compliance.
 *
 * Why these tests matter:
 *   - Honoring a STOP reply is a legal + carrier (A2P 10DLC) requirement. If a
 *     refactor silently broke opt-out — wrong Twilio sender param, sends not
 *     skipped when disabled, or the STOP matcher not flipping the right row —
 *     we'd keep texting a survivor who explicitly opted out. That's a
 *     compliance violation and a trust breach, with no signal today.
 *   - The cost of a bug is real (carrier penalties, survivor trust); the cost
 *     of these tests is ~one second of runtime.
 *
 * What we exercise:
 *   - resolveSender() sender-precedence: Messaging Service SID > phone number
 *     (TWILIO_PHONE_NUMBER / TWILIO_FROM_NUMBER) > null.
 *   - sendSms() short-circuits to `skipped` when SMS is disabled and when no
 *     destination number is supplied.
 *   - The STOP-word set + optOutSmsByPhone() flips sms_enabled=FALSE for the
 *     matching normalized phone (normalizeE164 agreement on both sides).
 *
 * Test isolation:
 *   - A dedicated throwaway user + notification_preferences row, namespaced with
 *     a per-run UUID. All env-var mutations are snapshotted and restored, and
 *     the DB rows are removed in a finally{} block so a failed assertion never
 *     leaves zombie rows or leaks env state.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { resolveSender, sendSms } from "../server/messaging/smsProvider";
import { normalizeE164 } from "../server/messaging/phone";
import { STOP_WORDS, HELP_WORDS, optOutSmsByPhone } from "../server/messaging/routes";

// ── tiny test harness (matches tests/stripeWebhook.test.ts) ──────────────────
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

// Snapshot + restore the Twilio env vars resolveSender/isSmsEnabled read, so the
// test can drive each branch without leaking state into other tests.
const TWILIO_ENV = [
  "TWILIO_MESSAGING_SERVICE_SID",
  "TWILIO_PHONE_NUMBER",
  "TWILIO_FROM_NUMBER",
  "SMS_ENABLED",
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const k of TWILIO_ENV) snap[k] = process.env[k];
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const k of TWILIO_ENV) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k]!;
  }
}

function clearSenderEnv() {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.TWILIO_PHONE_NUMBER;
  delete process.env.TWILIO_FROM_NUMBER;
}

async function run() {
  const runId = randomUUID().slice(0, 8);
  const envSnap = snapshotEnv();
  const userId = `test_sms_${runId}`;

  console.log(`\nsmsOptOut.test.ts (runId=${runId})\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    console.log("• resolveSender() sender precedence");
    {
      clearSenderEnv();
      assert(resolveSender() === null, "returns null when no sender is configured");

      clearSenderEnv();
      process.env.TWILIO_FROM_NUMBER = "+15550001111";
      assert(
        JSON.stringify(resolveSender()) === JSON.stringify({ from: "+15550001111" }),
        "falls back to TWILIO_FROM_NUMBER when only it is set",
      );

      clearSenderEnv();
      process.env.TWILIO_PHONE_NUMBER = "+15552223333";
      process.env.TWILIO_FROM_NUMBER = "+15550001111";
      assert(
        JSON.stringify(resolveSender()) === JSON.stringify({ from: "+15552223333" }),
        "prefers TWILIO_PHONE_NUMBER over legacy TWILIO_FROM_NUMBER",
      );

      clearSenderEnv();
      process.env.TWILIO_MESSAGING_SERVICE_SID = "MG0123456789";
      process.env.TWILIO_PHONE_NUMBER = "+15552223333";
      process.env.TWILIO_FROM_NUMBER = "+15550001111";
      const sender = resolveSender();
      assert(
        !!sender && "messagingServiceSid" in sender && sender.messagingServiceSid === "MG0123456789",
        "prefers Messaging Service SID over any phone number (A2P 10DLC)",
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• sendSms() short-circuits (never touches Twilio)");
    {
      // SMS_ENABLED unset (or !== 'true') => disabled regardless of sender/creds.
      delete process.env.SMS_ENABLED;
      const r1 = await sendSms({ to: "+15559998888", body: "hi" });
      assert(r1.status === "skipped", "returns skipped when SMS is disabled");
      assert(r1.reason === "sms_disabled_flag", "skip reason names the disabled flag");

      // Even with the flag on + creds/sender present, an empty destination is skipped.
      process.env.SMS_ENABLED = "true";
      process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "AC_test_fake";
      process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "test_fake_token";
      process.env.TWILIO_MESSAGING_SERVICE_SID = "MG0123456789";
      const r2 = await sendSms({ to: "", body: "hi" });
      assert(r2.status === "skipped", "returns skipped when no destination phone");
      assert(r2.reason === "no_phone", "skip reason names the missing phone");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• STOP-word set");
    {
      assert(STOP_WORDS.has("STOP"), "STOP is an opt-out word");
      assert(STOP_WORDS.has("UNSUBSCRIBE"), "UNSUBSCRIBE is an opt-out word");
      assert(STOP_WORDS.has("CANCEL"), "CANCEL is an opt-out word");
      assert(!STOP_WORDS.has("HELP"), "HELP is NOT an opt-out word");
      assert(HELP_WORDS.has("HELP"), "HELP is a help word");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• optOutSmsByPhone() flips sms_enabled=FALSE for the matching number");
    {
      // The stored sms_phone is the normalized form (that's what the app writes).
      const stored = normalizeE164("(555) 123-4567")!; // => +15551234567
      assert(stored === "+15551234567", "normalizeE164 canonicalizes the stored number");

      // Seed a throwaway user + a consented (sms_enabled=TRUE) preference row.
      await dbPool.query(`INSERT INTO users (id) VALUES ($1)`, [userId]);
      await dbPool.query(
        `INSERT INTO notification_preferences (user_id, sms_enabled, sms_phone)
         VALUES ($1, TRUE, $2)`,
        [userId, stored],
      );

      // Twilio delivers a messy-but-equivalent From; the STOP handler normalizes
      // it, so the UPDATE must still match the stored canonical number.
      const matched = await optOutSmsByPhone("+1 (555) 123-4567");
      assert(matched === stored, "returns the normalized number it matched on");

      const after = await dbPool.query(
        `SELECT sms_enabled FROM notification_preferences WHERE user_id = $1`,
        [userId],
      );
      assert(after.rows[0]?.sms_enabled === false, "sms_enabled flipped to FALSE after STOP");

      // A number that can't be coerced to E.164 is a no-op (nothing to opt out).
      const noop = await optOutSmsByPhone("not-a-number");
      assert(noop === null, "unparseable phone returns null (no UPDATE)");
    }
  } finally {
    // Cleanup in finally{} so a failed assertion never leaves zombie rows or
    // leaks mutated env state into a following test in the same process.
    restoreEnv(envSnap);
    await dbPool
      .query(`DELETE FROM notification_preferences WHERE user_id = $1`, [userId])
      .catch((e) => console.error("[cleanup] prefs:", e));
    await dbPool
      .query(`DELETE FROM users WHERE id = $1`, [userId])
      .catch((e) => console.error("[cleanup] user:", e));
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
