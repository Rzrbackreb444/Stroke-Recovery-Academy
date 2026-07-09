/**
 * tests/medicationAdherence.test.ts — integration tests for the medication-
 * adherence loop (`server/services/medicationAdherenceService.ts`), the cron job
 * "med-adherence" that fires daily at 22:00 UTC.
 *
 * Why these tests matter:
 *   - The delivery PLUMBING (sendMessage gating: unsubscribe / channel / quiet
 *     hours) is covered by tests/messagingGating.test.ts. What had ZERO coverage
 *     was the med-adherence loop itself: does a real scheduled tick actually
 *     select the right survivors, route them through sendMessage, and stay
 *     idempotent day-over-day? A silent break here means survivors never get
 *     their "did you take them?" nudge and caregivers never get the missed-meds
 *     heads-up — the whole point of the second-stroke-prevention track.
 *   - We exercise both audience selectors directly (side-effect free) AND invoke
 *     runMedicationAdherence end-to-end, asserting the observable side effect: a
 *     message_deliveries claim row for the survivor push channel (the same
 *     claim-before-send proxy messagingGating.test.ts uses to prove sendMessage
 *     was called and passed the gate), plus the consent/quiet-hours suppression
 *     cases and the per-day dedupe on a second tick.
 *
 * No real message is ever sent:
 *   - Resend connector credentials are neutralized so every email send fails
 *     fast in getCredentials BEFORE any network call — no real email, and the
 *     claim is released (matching messagingGating's approach).
 *   - VAPID keys are neutralized so any push send to a real dev-DB subscriber
 *     no-ops inside sendPush's try/catch. The seeded survivors have zero
 *     push_subscriptions, so their push send is a no-op regardless — but the
 *     claim-before-send row still persists, which is exactly what we assert.
 *
 * Test isolation:
 *   - Every seeded user id / email / med is namespaced with a per-run UUID so a
 *     busy dev DB never makes the test flaky, and cleanup in a finally{} block
 *     never leaks rows even if an assertion fails. runMedicationAdherence scans
 *     ALL users, so we assert only against the rows WE seeded (scoped by user
 *     id / dedupe key), never a broad category match.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { ensureMessagingSchema } from "../server/messaging/index";
import {
  runMedicationAdherence,
  selectSurvivorAdherenceCandidates,
  selectCaregiverNudgeCandidates,
} from "../server/services/medicationAdherenceService";

// ── tiny test harness (matches lifecycleService.test.ts / messagingGating.test.ts) ─
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function run() {
  const runId = randomUUID().slice(0, 8);
  const emailFor = (tag: string) => `medadh+${runId}-${tag}@test.invalid`;
  const userIds: string[] = [];

  // Neutralize both providers for the whole run so a real scheduled tick over
  // the full user table can never emit a real email or push.
  const savedIdentity = process.env.REPL_IDENTITY;
  const savedRenewal = process.env.WEB_REPL_RENEWAL;
  const savedVapidPub = process.env.VAPID_PUBLIC_KEY;
  const savedVapidPriv = process.env.VAPID_PRIVATE_KEY;
  delete process.env.REPL_IDENTITY;
  delete process.env.WEB_REPL_RENEWAL;
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;

  await ensureMessagingSchema();

  async function seedUser(tag: string, withEmail = true): Promise<string> {
    const r = await dbPool.query(
      `INSERT INTO users (email, first_name, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       RETURNING id`,
      [withEmail ? emailFor(tag) : null, "Test"],
    );
    const id = r.rows[0].id as string;
    userIds.push(id);
    return id;
  }

  // Active med with a reminder time (what the survivor selector requires).
  async function seedMedication(
    userId: string,
    opts: { isActive?: boolean; reminderTimes?: string[] | null } = {},
  ): Promise<number> {
    const r = await dbPool.query(
      `INSERT INTO medications (user_id, name, dosage, frequency, is_active, reminder_times)
       VALUES ($1, 'Aspirin', '81mg', 'once_daily', $2, $3::text[])
       RETURNING id`,
      [
        userId,
        opts.isActive ?? true,
        opts.reminderTimes === undefined ? ["08:00"] : opts.reminderTimes,
      ],
    );
    return r.rows[0].id as number;
  }

  // A logged dose `agoHours` hours ago (skipped=false counts as "closed loop").
  async function seedMedLog(
    userId: string,
    medId: number,
    agoHours: number,
    skipped = false,
  ) {
    await dbPool.query(
      `INSERT INTO medication_logs (medication_id, user_id, taken_at, skipped)
       VALUES ($1, $2, now() - ($3 || ' hours')::interval, $4)`,
      [medId, userId, String(agoHours), skipped],
    );
  }

  async function setPrefs(
    userId: string,
    p: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
      timezone?: string;
      unsubscribedAll?: boolean;
      caregiverShareEnabled?: boolean;
    },
  ) {
    await dbPool.query(
      `INSERT INTO notification_preferences
         (user_id, email_enabled, push_enabled, quiet_hours_start, quiet_hours_end,
          timezone, unsubscribed_all, caregiver_share_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         push_enabled = EXCLUDED.push_enabled,
         quiet_hours_start = EXCLUDED.quiet_hours_start,
         quiet_hours_end = EXCLUDED.quiet_hours_end,
         timezone = EXCLUDED.timezone,
         unsubscribed_all = EXCLUDED.unsubscribed_all,
         caregiver_share_enabled = EXCLUDED.caregiver_share_enabled`,
      [
        userId,
        p.emailEnabled ?? true,
        p.pushEnabled ?? true,
        p.quietHoursStart ?? null,
        p.quietHoursEnd ?? null,
        p.timezone ?? "America/New_York",
        p.unsubscribedAll ?? false,
        p.caregiverShareEnabled ?? false,
      ],
    );
  }

  async function seedCaregiverLink(
    caregiverId: string,
    survivorId: string,
    status = "active",
  ) {
    await dbPool.query(
      `INSERT INTO caregiver_links (caregiver_id, survivor_id, status, invited_at, accepted_at)
       VALUES ($1, $2, $3, now(), now())`,
      [caregiverId, survivorId, status],
    );
  }

  const pushKey = (userId: string) => `med-adherence:push:${userId}:${todayKey()}`;

  async function deliveryRow(key: string) {
    const r = await dbPool.query(
      `SELECT status, channel, user_id FROM message_deliveries WHERE dedupe_key = $1`,
      [key],
    );
    return r.rows[0] ?? null;
  }
  async function deliveryCount(key: string): Promise<number> {
    const r = await dbPool.query(
      `SELECT COUNT(*)::int AS n FROM message_deliveries WHERE dedupe_key = $1`,
      [key],
    );
    return r.rows[0].n as number;
  }

  // Quiet-hours window guaranteed to contain "now" in UTC (2-hour span so an
  // hour rollover mid-test can't flake it).
  const nowHour = new Date().getUTCHours();
  const qStart = nowHour;
  const qEnd = (nowHour + 2) % 24;

  console.log(`\nmedicationAdherence.test.ts (runId=${runId})\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    console.log("• Survivor selector: active med + reminder time + nothing logged today");
    // Eligible: active med, reminder times, no log today.
    const eligible = await seedUser("eligible");
    await setPrefs(eligible, { pushEnabled: true });
    await seedMedication(eligible);
    // Logged today → excluded.
    const loggedToday = await seedUser("logged-today");
    const medLogged = await seedMedication(loggedToday);
    await seedMedLog(loggedToday, medLogged, 2); // 2h ago = today
    // Only a SKIPPED log today → still counts as "not closed" → selected.
    const skippedOnly = await seedUser("skipped-only");
    const medSkip = await seedMedication(skippedOnly);
    await seedMedLog(skippedOnly, medSkip, 2, true); // skipped=true
    // Inactive med → excluded.
    const inactiveMed = await seedUser("inactive-med");
    await seedMedication(inactiveMed, { isActive: false });
    // Active med but no reminder times → excluded.
    const noReminders = await seedUser("no-reminders");
    await seedMedication(noReminders, { reminderTimes: null });
    // Suppression fixtures (also feed the run-level assertions below).
    const unsub = await seedUser("unsub");
    await setPrefs(unsub, { unsubscribedAll: true });
    await seedMedication(unsub);
    const quiet = await seedUser("quiet");
    await setPrefs(quiet, {
      pushEnabled: true,
      quietHoursStart: qStart,
      quietHoursEnd: qEnd,
      timezone: "UTC",
    });
    await seedMedication(quiet);
    {
      const rows = await selectSurvivorAdherenceCandidates();
      const ids = new Set(rows.map((r) => r.user_id));
      assert(ids.has(eligible), "eligible survivor selected");
      assert(ids.has(skippedOnly), "survivor with only a SKIPPED log today selected");
      assert(!ids.has(loggedToday), "survivor who logged a dose today NOT selected");
      assert(!ids.has(inactiveMed), "survivor with only an inactive med NOT selected");
      assert(!ids.has(noReminders), "survivor with no reminder times NOT selected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• runMedicationAdherence routes an eligible survivor through sendMessage");
    {
      await runMedicationAdherence();
      const row = await deliveryRow(pushKey(eligible));
      assert(row != null, "eligible survivor gets a push claim row (sendMessage was called)");
      assert(row?.status === "sent", "claim row status is sent");
      assert(row?.channel === "push", "claim row is the push channel");
      assert(row?.user_id === eligible, "claim row is scoped to the eligible survivor");
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Consent + quiet-hours suppression (no claim row written)");
    {
      assert(
        (await deliveryCount(pushKey(unsub))) === 0,
        "globally-unsubscribed survivor gets NO push claim row",
      );
      assert(
        (await deliveryCount(pushKey(quiet))) === 0,
        "survivor in quiet hours gets NO push claim row (push deferred)",
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Per-day dedupe: a second tick does not double-message");
    {
      await runMedicationAdherence();
      assert(
        (await deliveryCount(pushKey(eligible))) === 1,
        "second tick same day → still exactly one push claim row",
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n• Caregiver missed-meds selector is consent-gated");
    // Eligible: survivor opted into sharing, active link, active med, no dose 3+ days.
    const cgSurvivor = await seedUser("cg-survivor");
    await setPrefs(cgSurvivor, { caregiverShareEnabled: true });
    const cgSurvMed = await seedMedication(cgSurvivor);
    await seedMedLog(cgSurvivor, cgSurvMed, 24 * 5); // last dose 5 days ago
    const caregiver = await seedUser("caregiver");
    await seedCaregiverLink(caregiver, cgSurvivor, "active");
    // Sharing DISABLED → caregiver not selected.
    const noShareSurvivor = await seedUser("noshare-survivor");
    await setPrefs(noShareSurvivor, { caregiverShareEnabled: false });
    const noShareMed = await seedMedication(noShareSurvivor);
    await seedMedLog(noShareSurvivor, noShareMed, 24 * 5);
    const noShareCg = await seedUser("noshare-cg");
    await seedCaregiverLink(noShareCg, noShareSurvivor, "active");
    // Link not active → caregiver not selected.
    const invitedSurvivor = await seedUser("invited-survivor");
    await setPrefs(invitedSurvivor, { caregiverShareEnabled: true });
    const invitedMed = await seedMedication(invitedSurvivor);
    await seedMedLog(invitedSurvivor, invitedMed, 24 * 5);
    const invitedCg = await seedUser("invited-cg");
    await seedCaregiverLink(invitedCg, invitedSurvivor, "invited");
    // Shared + active link but a RECENT dose (within 3 days) → not selected.
    const recentSurvivor = await seedUser("recent-survivor");
    await setPrefs(recentSurvivor, { caregiverShareEnabled: true });
    const recentMed = await seedMedication(recentSurvivor);
    await seedMedLog(recentSurvivor, recentMed, 12); // 12h ago
    const recentCg = await seedUser("recent-cg");
    await seedCaregiverLink(recentCg, recentSurvivor, "active");
    {
      const rows = await selectCaregiverNudgeCandidates();
      const ids = new Set(rows.map((r) => r.caregiver_id));
      assert(ids.has(caregiver), "caregiver of a sharing survivor with no doses in 3+ days selected");
      assert(!ids.has(noShareCg), "caregiver excluded when survivor disabled sharing");
      assert(!ids.has(invitedCg), "caregiver excluded when the link is not active (invited)");
      assert(!ids.has(recentCg), "caregiver excluded when survivor logged a dose within 3 days");
    }

    // Exercise the full caregiver path end-to-end (no assertion on a durable row:
    // the caregiver nudge is email-only and the neutralized Resend provider
    // releases the claim — this proves runCaregiverNudge runs without throwing).
    console.log("\n• runMedicationAdherence executes the caregiver nudge path without error");
    {
      let threw = false;
      try {
        await runMedicationAdherence();
      } catch {
        threw = true;
      }
      assert(!threw, "full run (survivor + caregiver loops) completes without throwing");
    }
  } finally {
    // Restore env, then cleanup scoped strictly to the users this run seeded.
    if (savedIdentity !== undefined) process.env.REPL_IDENTITY = savedIdentity;
    if (savedRenewal !== undefined) process.env.WEB_REPL_RENEWAL = savedRenewal;
    if (savedVapidPub !== undefined) process.env.VAPID_PUBLIC_KEY = savedVapidPub;
    if (savedVapidPriv !== undefined) process.env.VAPID_PRIVATE_KEY = savedVapidPriv;

    try {
      if (userIds.length) {
        await dbPool.query(`DELETE FROM message_deliveries WHERE user_id = ANY($1)`, [userIds]);
        await dbPool.query(`DELETE FROM notification_preferences WHERE user_id = ANY($1)`, [userIds]);
        // medications / medication_logs / caregiver_links cascade on user delete.
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
