/**
 * tests/institutionPrivacy.test.ts — regression tests for the clinician cohort
 * dashboard privacy guarantees (`server/services/institutionService.ts` +
 * the `requireOrgStaff` guard logic in `server/institutionRoutes.ts`).
 *
 * Why these tests matter:
 *   The B2B institutional platform lets a rehab center / clinic see cohort
 *   engagement for the survivors it sponsors. Survivors control what the org
 *   sees via a revocable consent layer that DEFAULTS to de-identified. A single
 *   mis-join or a dropped WHERE clause in any of these queries could silently
 *   leak PHI or unconsented data onto a clinician dashboard. These invariants
 *   were verified manually once; this file makes the verification permanent.
 *
 * Invariants proven (against the REAL exported service functions + the real DB):
 *   1. consent='none' survivors are excluded from cohort metrics (not counted,
 *      and their engagement never inflates the aggregate) AND from the
 *      identified list.
 *   2. Aggregate cohort metrics are SUPPRESSED below MIN_COHORT (3) consented
 *      survivors, and unsuppressed at/above it.
 *   3. getIdentifiedMembers returns ONLY survivors who consented to
 *      'identified' — 'aggregate' and 'none' are excluded.
 *   4. No raw journal / medical / flicker text ever appears in ANY staff-facing
 *      payload (cohort, identified, roster) — proven by seeding sentinel PHI
 *      text and asserting it is absent from the serialized output.
 *   5. Cross-tenant isolation: a staffer of org A gets role=null for org B, so
 *      the requireOrgStaff guard returns 404 — no cross-tenant reads.
 *
 * Note on roster (documented interpretation): the roster is seat-management
 * data (invite status + consent level) and legitimately lists every survivor
 * seat regardless of consent so staff can manage/remove seats. The privacy
 * guarantee tested here is that the roster carries NO engagement/PHI for anyone
 * — including consent='none' survivors — not that those seats are hidden.
 *
 * Test isolation: every org slug and user id is namespaced with a per-run UUID.
 * Cleanup runs in finally{} so a failed assertion never leaks rows.
 */

import { randomUUID } from "node:crypto";
import { pool as dbPool } from "../server/db";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import {
  ensureInstitutionSchema,
  createOrganization,
  addStaffMember,
  setConsent,
  getUserOrgRole,
  getCohortMetrics,
  getIdentifiedMembers,
  getRoster,
  MIN_COHORT,
} from "../server/services/institutionService";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(msg);
    console.error("  ✗ " + msg);
  }
}

async function main() {
  const run = randomUUID().slice(0, 8);

  // Namespaced ids so we can clean up precisely and never collide.
  const staffA = `test:inst:staffA:${run}`;
  const staffB = `test:inst:staffB:${run}`;
  // Org A survivors: 2 aggregate + 1 identified = 3 consented (>= MIN_COHORT),
  // plus 1 'none' (must be invisible to all staff payloads).
  const sAgg1 = `test:inst:sAgg1:${run}`;
  const sAgg2 = `test:inst:sAgg2:${run}`;
  const sIdent = `test:inst:sIdent:${run}`;
  const sNone = `test:inst:sNone:${run}`;
  // Org B survivor: single aggregate consent (below MIN_COHORT → suppressed).
  const sB1 = `test:inst:sB1:${run}`;

  const allUserIds = [staffA, staffB, sAgg1, sAgg2, sIdent, sNone, sB1];

  // PHI sentinel — a string that must NEVER surface in a staff payload.
  const PHI = `PHI_SENTINEL_${run}`;

  let orgAId = 0;
  let orgBId = 0;

  try {
    await ensureInstitutionSchema();

    // ── Seed users ──────────────────────────────────────────────────────
    for (const id of allUserIds) {
      await db.execute(sql`
        INSERT INTO users (id, role, first_name, last_name, email)
        VALUES (${id}, 'member', 'Test', ${id}, ${id + "@example.com"})
      `);
    }

    // ── Create two independent orgs ─────────────────────────────────────
    const orgA = await createOrganization({ name: `Test Org A ${run}`, seatLimit: 100, status: "active" });
    const orgB = await createOrganization({ name: `Test Org B ${run}`, seatLimit: 100, status: "active" });
    orgAId = orgA.id;
    orgBId = orgB.id;

    // ── Staff each org (clinician) ──────────────────────────────────────
    await addStaffMember(orgAId, staffA, "clinician");
    await addStaffMember(orgBId, staffB, "clinician");

    // ── Enroll survivors as ACTIVE seats in their org ───────────────────
    async function enroll(orgId: number, userId: string) {
      await db.execute(sql`
        INSERT INTO organization_members (org_id, user_id, role, status, joined_at)
        VALUES (${orgId}, ${userId}, 'survivor', 'active', now())
      `);
    }
    await enroll(orgAId, sAgg1);
    await enroll(orgAId, sAgg2);
    await enroll(orgAId, sIdent);
    await enroll(orgAId, sNone);
    await enroll(orgBId, sB1);

    // ── Consent levels ──────────────────────────────────────────────────
    await setConsent(orgAId, sAgg1, "aggregate");
    await setConsent(orgAId, sAgg2, "aggregate");
    await setConsent(orgAId, sIdent, "identified");
    await setConsent(orgAId, sNone, "none");
    await setConsent(orgBId, sB1, "aggregate");

    // ── Seed engagement. The consent='none' survivor gets the SAME 7-day
    //    engagement footprint as consented survivors — if the WHERE clause
    //    ever drops the consent filter, active7d would wrongly count them. ──
    for (const id of [sAgg1, sAgg2, sIdent, sNone]) {
      await db.execute(sql`INSERT INTO daily_checkins (user_id, checkin_date) VALUES (${id}, now())`);
      await db.execute(sql`
        INSERT INTO sasquatch_chat_messages (user_id, role, content)
        VALUES (${id}, 'user', 'hello')
      `);
    }

    // ── Seed raw PHI for the IDENTIFIED survivor (worst case: this survivor
    //    consented the most, yet raw text must still never leave). ─────────
    await db.execute(sql`
      INSERT INTO recovery_journals (user_id, content) VALUES (${sIdent}, ${PHI + "_journal"})
    `);
    await db.execute(sql`
      INSERT INTO flicker_logs (user_id, moment) VALUES (${sIdent}, ${PHI + "_flicker"})
    `);
    await db.execute(sql`
      INSERT INTO medications (user_id, name, dosage, frequency, notes)
      VALUES (${sIdent}, ${PHI + "_med"}, '10mg', 'once_daily', ${PHI + "_mednotes"})
    `);

    // ════════════════════════════════════════════════════════════════════
    // 1. Cohort metrics: consent='none' excluded + not counted
    // ════════════════════════════════════════════════════════════════════
    const cohortA = await getCohortMetrics(orgAId);
    assert(
      cohortA.suppressed === false,
      "org A cohort is NOT suppressed (3 consented survivors >= MIN_COHORT)",
    );
    assert(
      cohortA.consentedCount === 3,
      `org A consentedCount counts only aggregate+identified (got ${cohortA.consentedCount}, expected 3)`,
    );
    assert(
      cohortA.totalActive === 4,
      `org A totalActive counts all active seats incl. consent=none (got ${cohortA.totalActive}, expected 4)`,
    );
    // The consent='none' survivor has a 7-day check-in + coach message, but
    // must NOT be counted in active7d. Only the 3 consented survivors can be.
    assert(
      typeof cohortA.engagement?.active7d === "number" && cohortA.engagement.active7d <= 3,
      `active7d never counts the consent=none survivor (got ${cohortA.engagement?.active7d}, must be <= 3 consented)`,
    );

    // ════════════════════════════════════════════════════════════════════
    // 2. Suppression below MIN_COHORT
    // ════════════════════════════════════════════════════════════════════
    const cohortB = await getCohortMetrics(orgBId);
    assert(
      cohortB.suppressed === true,
      `org B cohort IS suppressed (1 consented survivor < MIN_COHORT=${MIN_COHORT})`,
    );
    assert(
      cohortB.engagement === undefined,
      "suppressed cohort payload carries NO engagement block",
    );

    // ════════════════════════════════════════════════════════════════════
    // 3. Identified list = 'identified' consent only
    // ════════════════════════════════════════════════════════════════════
    const identifiedA = await getIdentifiedMembers(orgAId);
    const identifiedIds = identifiedA.map((m: any) => m.userId);
    assert(
      identifiedIds.includes(sIdent),
      "identified list INCLUDES the survivor who consented to 'identified'",
    );
    assert(
      !identifiedIds.includes(sAgg1) && !identifiedIds.includes(sAgg2),
      "identified list EXCLUDES 'aggregate'-consent survivors",
    );
    assert(
      !identifiedIds.includes(sNone),
      "identified list EXCLUDES 'none'-consent survivors",
    );

    // ════════════════════════════════════════════════════════════════════
    // 4. No raw journal/medical/flicker text in ANY staff payload
    // ════════════════════════════════════════════════════════════════════
    const rosterA = await getRoster(orgAId);
    const serialized = JSON.stringify({ cohortA, identifiedA, rosterA });
    assert(
      !serialized.includes(PHI),
      "no raw journal/medical/flicker PHI text appears in cohort/identified/roster payloads",
    );

    // Roster is seat-management data only — assert it exposes none of the
    // engagement/PHI fields that would constitute unconsented data leakage.
    const leakyFields = ["content", "moment", "notes", "checkinCount", "currentStreak", "moodScore"];
    const rosterHasLeak = rosterA.some((row: any) =>
      leakyFields.some((f) => Object.prototype.hasOwnProperty.call(row, f)),
    );
    assert(!rosterHasLeak, "roster rows carry only seat-management fields, no engagement/PHI columns");

    // The consent='none' survivor appears in the roster (seat management) but
    // only ever with seat data + shareLevel — proven by the PHI-absence and
    // leaky-field checks above. Confirm the seat is present & labeled 'none'.
    const noneRow = rosterA.find((r: any) => r.shareLevel === "none");
    assert(!!noneRow, "roster surfaces the consent='none' seat for management, labeled shareLevel='none'");

    // ════════════════════════════════════════════════════════════════════
    // 5. Cross-tenant isolation (the requireOrgStaff guard input)
    // ════════════════════════════════════════════════════════════════════
    // requireOrgStaff returns 404 whenever getUserOrgRole is not owner/clinician.
    const staffAonB = await getUserOrgRole(orgBId, staffA);
    const staffBonA = await getUserOrgRole(orgAId, staffB);
    assert(
      staffAonB === null,
      "staffer of org A has NO role in org B → requireOrgStaff would 404 (no cross-tenant read)",
    );
    assert(
      staffBonA === null,
      "staffer of org B has NO role in org A → requireOrgStaff would 404 (no cross-tenant read)",
    );
    // Sanity: each staffer IS a clinician of their own org.
    assert((await getUserOrgRole(orgAId, staffA)) === "clinician", "staffA is clinician of org A");
    assert((await getUserOrgRole(orgBId, staffB)) === "clinician", "staffB is clinician of org B");
    // A survivor is not staff — guard would 404 them too.
    assert(
      (await getUserOrgRole(orgAId, sAgg1)) === "survivor",
      "a survivor's role is 'survivor' (not owner/clinician) → not granted staff access",
    );
  } finally {
    // Cleanup — precise, namespaced, best-effort. Order respects FKs.
    for (const id of allUserIds) {
      await db.execute(sql`DELETE FROM recovery_journals WHERE user_id = ${id}`).catch(() => {});
      await db.execute(sql`DELETE FROM flicker_logs WHERE user_id = ${id}`).catch(() => {});
      await db.execute(sql`DELETE FROM medications WHERE user_id = ${id}`).catch(() => {});
      await db.execute(sql`DELETE FROM daily_checkins WHERE user_id = ${id}`).catch(() => {});
      await db.execute(sql`DELETE FROM sasquatch_chat_messages WHERE user_id = ${id}`).catch(() => {});
    }
    if (orgAId) await db.execute(sql`DELETE FROM organization_consents WHERE org_id = ${orgAId}`).catch(() => {});
    if (orgBId) await db.execute(sql`DELETE FROM organization_consents WHERE org_id = ${orgBId}`).catch(() => {});
    if (orgAId) await db.execute(sql`DELETE FROM organization_members WHERE org_id = ${orgAId}`).catch(() => {});
    if (orgBId) await db.execute(sql`DELETE FROM organization_members WHERE org_id = ${orgBId}`).catch(() => {});
    if (orgAId) await db.execute(sql`DELETE FROM organizations WHERE id = ${orgAId}`).catch(() => {});
    if (orgBId) await db.execute(sql`DELETE FROM organizations WHERE id = ${orgBId}`).catch(() => {});
    for (const id of allUserIds) {
      await db.execute(sql`DELETE FROM users WHERE id = ${id}`).catch(() => {});
    }
  }

  console.log(`\ninstitutionPrivacy.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("FAILURES:\n" + failures.map((f) => "  - " + f).join("\n"));
  }
  await dbPool.end().catch(() => {});
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("institutionPrivacy.test crashed:", e);
  await dbPool.end().catch(() => {});
  process.exit(1);
});
