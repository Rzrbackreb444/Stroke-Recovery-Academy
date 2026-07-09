/**
 * tests/medicationReminder.test.ts — integration tests for the EXACT-TIME
 * medication reminder path (`checkMedicationReminders` in
 * server/pushNotificationService.ts), fired by `runAccountabilityChecks` on the
 * quarter-hour cron in server/scheduler/registerJobs.ts.
 *
 * Why these tests matter:
 *   - This is the time-sensitive sibling of the daily "did you take them?"
 *     recap (covered by tests/medicationAdherence.test.ts). It pushes
 *     "Medication time, Warrior." AT each dose time by matching a survivor's
 *     `medications.reminder_times` (["08:00","20:00"]) against the cron slot's
 *     UTC HH:MM. If the slot / time-of-day match or the per-med collapse
 *     silently breaks, survivors miss the ON-TIME reminder and only get the
 *     once-a-day recap — a real adherence regression.
 *   - We invoke `checkMedicationReminders(scheduledFor)` directly (the same
 *     function runAccountabilityChecks calls) and assert the observable send
 *     path is reached for a matching slot, is NOT reached for a non-matching
 *     slot, and fires exactly once per active med per slot (no duplication)
 *     even when reminder_times carries extra / duplicate entries.
 *
 * No real push is sent:
 *   - VAPID keys are neutralized (as in medicationAdherence.test.ts) so nothing
 *     is ever configured for a live web-push handshake.
 *   - web-push's sendNotification is replaced with an in-process spy that
 *     records {endpoint, payload} and performs NO network I/O. Because Node
 *     module caching hands the service and this test the SAME web-push default
 *     export object, patching the property is seen by the service at call time.
 *   - Seeded survivors have zero mobile_push_tokens, so the Expo branch of
 *     sendPushToUser returns before any exp.host fetch.
 *
 * Test isolation:
 *   - Every seeded user id / endpoint is namespaced with a per-run UUID so a
 *     busy dev DB never makes the test flaky. checkMedicationReminders scans ALL
 *     active meds joined to push_subscriptions, so we attribute sends strictly
 *     by our own unique endpoints, never a broad match. Cleanup runs in a
 *     finally{} block so rows never leak even if an assertion fails.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { checkMedicationReminders } from "../server/pushNotificationService";

// ── tiny test harness (matches medicationAdherence.test.ts) ─────────────────
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
  const userIds: string[] = [];
  const endpointFor = (tag: string) => `https://push.test.invalid/${runId}/${tag}`;

  // Neutralize VAPID so a live web-push handshake can never be configured.
  const savedVapidPub = process.env.VAPID_PUBLIC_KEY;
  const savedVapidPriv = process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;

  // Replace web-push sendNotification with a recording spy (no network I/O).
  // Same cached module object the service imported, so the patch is live.
  const webPush = (await import("web-push")).default as any;
  const originalSend = webPush.sendNotification;
  let sends: Array<{ endpoint: string; payload: any }> = [];
  webPush.sendNotification = async (subscription: any, payloadStr: string) => {
    let payload: any = payloadStr;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      /* keep raw */
    }
    sends.push({ endpoint: subscription?.endpoint, payload });
    return { statusCode: 201 };
  };

  async function seedUser(tag: string): Promise<string> {
    const r = await dbPool.query(
      `INSERT INTO users (email, first_name, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       RETURNING id`,
      [`medrem+${runId}-${tag}@test.invalid`, "Test"],
    );
    const id = r.rows[0].id as string;
    userIds.push(id);
    return id;
  }

  // A push subscription with a UNIQUE endpoint so we can attribute sends.
  async function seedSubscription(userId: string, tag: string) {
    await dbPool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, 'p256dh-test', 'auth-test')`,
      [userId, endpointFor(tag)],
    );
  }

  async function seedMedication(
    userId: string,
    name: string,
    opts: { isActive?: boolean; reminderTimes?: string[] | null } = {},
  ): Promise<number> {
    const r = await dbPool.query(
      `INSERT INTO medications (user_id, name, dosage, frequency, is_active, reminder_times)
       VALUES ($1, $2, '81mg', 'once_daily', $3, $4::text[])
       RETURNING id`,
      [
        userId,
        name,
        opts.isActive ?? true,
        opts.reminderTimes === undefined ? ["08:00"] : opts.reminderTimes,
      ],
    );
    return r.rows[0].id as number;
  }

  // Sends attributed to one endpoint in the current `sends` buffer.
  const sendsTo = (tag: string) =>
    sends.filter((s) => s.endpoint === endpointFor(tag));

  // A cron-aligned slot (minute ∈ {0,15,30,45}). checkMedicationReminders reads
  // getUTCHours()/getUTCMinutes(), so we match reminder_times to the UTC HH:MM.
  const matchSlot = new Date();
  matchSlot.setUTCHours(8, 15, 0, 0);
  const matchTime = "08:15";
  const otherSlot = new Date();
  otherSlot.setUTCHours(9, 30, 0, 0);
  const otherTime = "09:30";

  console.log(`\nmedicationReminder.test.ts (runId=${runId})\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    console.log("• Exact-time match: active med whose reminder_time == the slot");
    // Matching survivor: med at 08:15, subscribed.
    const matchUser = await seedUser("match");
    await seedSubscription(matchUser, "match");
    const matchMed = await seedMedication(matchUser, "Aspirin", {
      reminderTimes: [matchTime],
    });
    // Non-matching survivor: med at 09:30 only, subscribed.
    const missUser = await seedUser("miss");
    await seedSubscription(missUser, "miss");
    await seedMedication(missUser, "Statin", { reminderTimes: [otherTime] });
    // Inactive med at the matching time → excluded.
    const inactiveUser = await seedUser("inactive");
    await seedSubscription(inactiveUser, "inactive");
    await seedMedication(inactiveUser, "Old", {
      isActive: false,
      reminderTimes: [matchTime],
    });
    // Matching time but NO push subscription → JOIN drops it (no send target).
    const noSubUser = await seedUser("nosub");
    await seedMedication(noSubUser, "NoSub", { reminderTimes: [matchTime] });

    sends = [];
    await checkMedicationReminders(matchSlot);
    {
      const m = sendsTo("match");
      assert(m.length === 1, "matching survivor gets exactly one push at the dose slot");
      assert(m[0]?.payload?.type === "medication", "push payload type is 'medication'");
      assert(
        typeof m[0]?.payload?.body === "string" && m[0].payload.body.includes("Aspirin"),
        "push body names the medication",
      );
      assert(
        m[0]?.payload?.tag === `med-${matchMed}-${matchTime}`,
        "push tag is keyed by med id + slot time (browser-level dedupe)",
      );
      assert(sendsTo("miss").length === 0, "survivor whose dose time != slot gets NO push");
      assert(sendsTo("inactive").length === 0, "survivor with only an inactive med gets NO push");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Non-matching slot: the same matching med does NOT fire off-slot");
    sends = [];
    await checkMedicationReminders(otherSlot);
    {
      assert(sendsTo("match").length === 0, "08:15 med does NOT fire when the slot is 09:30");
      assert(sendsTo("miss").length === 1, "09:30 med fires only on its own slot");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• No duplication within a slot: extra/duplicate reminder_times collapse to one push");
    // reminder_times contains the matching time TWICE plus an off-slot time.
    const dupUser = await seedUser("dup");
    await seedSubscription(dupUser, "dup");
    await seedMedication(dupUser, "Warfarin", {
      reminderTimes: [matchTime, otherTime, matchTime],
    });
    sends = [];
    await checkMedicationReminders(matchSlot);
    {
      assert(
        sendsTo("dup").length === 1,
        "med with duplicate matching reminder_times fires exactly once per slot",
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Multiple active meds at the same slot each ping once (independent doses)");
    const multiUser = await seedUser("multi");
    await seedSubscription(multiUser, "multi");
    await seedMedication(multiUser, "MedA", { reminderTimes: [matchTime] });
    await seedMedication(multiUser, "MedB", { reminderTimes: [matchTime] });
    sends = [];
    await checkMedicationReminders(matchSlot);
    {
      const names = sendsTo("multi").map((s) => s.payload?.body ?? "");
      assert(sendsTo("multi").length === 2, "two distinct meds at the same slot → two pushes");
      assert(
        names.some((b) => b.includes("MedA")) && names.some((b) => b.includes("MedB")),
        "each push names its own medication (no collapse across meds)",
      );
    }
  } finally {
    // Restore env + the real web-push sender.
    if (savedVapidPub !== undefined) process.env.VAPID_PUBLIC_KEY = savedVapidPub;
    if (savedVapidPriv !== undefined) process.env.VAPID_PRIVATE_KEY = savedVapidPriv;
    webPush.sendNotification = originalSend;

    try {
      if (userIds.length) {
        await dbPool.query(`DELETE FROM push_subscriptions WHERE user_id = ANY($1)`, [userIds]);
        // medications cascade on user delete.
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
