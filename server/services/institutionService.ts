// Institutional / Clinical Partnership Platform (B2B) — Task #59.
//
// Organizations provision premium access for their survivors via seats, billed
// at the org level. Survivors control what the org sees through a revocable
// consent layer that DEFAULTS to de-identified/aggregate. Clinicians see cohort
// engagement + consented aggregate outcome trends only — never unconsented PHI.
//
// Privacy invariants (enforced here, verified end-to-end):
//   1. Aggregate cohort stats only count survivors whose consent shareLevel is
//      'aggregate' OR 'identified' (i.e. not 'none'). No PII in aggregate output.
//   2. Aggregate output is SUPPRESSED below MIN_COHORT consented survivors to
//      prevent re-identification of small cohorts.
//   3. Identified member rows are returned ONLY for survivors whose shareLevel
//      is 'identified'. Even then, only engagement summary — never raw journal /
//      medical / flicker text.
//   4. Every query is scoped to a single orgId. No cross-tenant reads.
//
// Schema is self-provisioned at runtime (db:push is blocked on this repl by the
// external `stripe` schema) — same pattern as biMetricsService / messaging.

import { randomBytes } from "crypto";
import { db } from "../db";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
import {
  organizations,
  organizationMembers,
  organizationConsents,
  users,
  type Organization,
} from "../../shared/schema";

// Below this many consented survivors, aggregate stats are suppressed so an
// individual can't be re-identified from a tiny cohort.
export const MIN_COHORT = 3;

// ── Schema self-provisioning ────────────────────────────────────────────────
let schemaReady: Promise<void> | null = null;
export async function ensureInstitutionSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        org_type TEXT NOT NULL DEFAULT 'rehab_center',
        contact_name TEXT,
        contact_email TEXT,
        seat_limit INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'trial',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        billing_status TEXT NOT NULL DEFAULT 'none',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_members (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        role TEXT NOT NULL DEFAULT 'survivor',
        status TEXT NOT NULL DEFAULT 'invited',
        invited_email TEXT,
        invite_token TEXT UNIQUE,
        invited_at TIMESTAMP NOT NULL DEFAULT now(),
        joined_at TIMESTAMP,
        removed_at TIMESTAMP
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS org_members_org_user_idx ON organization_members(org_id, user_id)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_consents (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        share_level TEXT NOT NULL DEFAULT 'aggregate',
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS org_consents_org_user_unique ON organization_consents(org_id, user_id)`);
  })()
    .then(() => undefined)
    .catch((err: any) => {
      schemaReady = null;
      throw err;
    });
  return schemaReady;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org"
  );
}

function newToken(): string {
  return randomBytes(18).toString("base64url"); // 24 url-safe chars
}

// ── Org CRUD (platform admin) ───────────────────────────────────────────────
export async function createOrganization(input: {
  name: string;
  orgType?: string;
  contactName?: string;
  contactEmail?: string;
  seatLimit?: number;
  status?: string;
  notes?: string;
}): Promise<Organization> {
  await ensureInstitutionSchema();
  const base = slugify(input.name);
  let slug = base;
  // Ensure slug uniqueness with a short random suffix on collision.
  const existing = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (existing.length) slug = `${base}-${randomBytes(2).toString("hex")}`;

  const [org] = await db
    .insert(organizations)
    .values({
      name: input.name.trim(),
      slug,
      orgType: input.orgType || "rehab_center",
      contactName: input.contactName || null,
      contactEmail: input.contactEmail || null,
      seatLimit: input.seatLimit ?? 0,
      status: input.status || "trial",
      notes: input.notes || null,
    })
    .returning();
  return org;
}

export async function listOrganizations(): Promise<any[]> {
  await ensureInstitutionSchema();
  const rows = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  // Attach seat usage per org.
  const out: any[] = [];
  for (const o of rows) {
    const usage = await getSeatUsage(o.id);
    out.push({ ...o, seatsUsed: usage.used, seatsAvailable: usage.available });
  }
  return out;
}

export async function getOrganization(orgId: number): Promise<Organization | undefined> {
  await ensureInstitutionSchema();
  const [o] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  return o;
}

export async function updateOrganization(
  orgId: number,
  patch: Partial<{ name: string; orgType: string; contactName: string; contactEmail: string; seatLimit: number; status: string; notes: string; billingStatus: string; stripeCustomerId: string; stripeSubscriptionId: string }>,
): Promise<Organization | undefined> {
  await ensureInstitutionSchema();
  const [o] = await db
    .update(organizations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(organizations.id, orgId))
    .returning();
  return o;
}

// ── Seats + membership ──────────────────────────────────────────────────────
export async function getSeatUsage(orgId: number): Promise<{ limit: number; used: number; available: number }> {
  const org = await getOrganization(orgId);
  const limit = org?.seatLimit ?? 0;
  const r = await db.execute(sql`
    SELECT COUNT(*)::int AS c FROM organization_members
     WHERE org_id = ${orgId} AND role = 'survivor' AND status IN ('invited','active')
  `);
  const used = Number((r.rows as any[])[0]?.c ?? 0);
  return { limit, used, available: Math.max(0, limit - used) };
}

// Adds staff (owner/clinician) to an org by userId. Staff do NOT consume seats.
export async function addStaffMember(orgId: number, userId: string, role: "owner" | "clinician"): Promise<void> {
  await ensureInstitutionSchema();
  const existing = await db
    .select()
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
    .limit(1);
  if (existing.length) {
    await db
      .update(organizationMembers)
      .set({ role, status: "active", removedAt: null, joinedAt: existing[0].joinedAt ?? new Date() })
      .where(eq(organizationMembers.id, existing[0].id));
    return;
  }
  await db.insert(organizationMembers).values({
    orgId,
    userId,
    role,
    status: "active",
    joinedAt: new Date(),
  });
}

// Bulk survivor invite (discharge-flow friendly). Mints one invite link per
// email, enforcing the seat limit. Returns per-email results.
export async function bulkInviteSurvivors(
  orgId: number,
  emails: string[],
): Promise<{ invited: Array<{ email: string; token: string }>; skipped: Array<{ email: string; reason: string }> }> {
  await ensureInstitutionSchema();
  const invited: Array<{ email: string; token: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];

  // De-dupe + normalize.
  const seen = new Set<string>();
  const clean = emails
    .map((e) => String(e || "").trim().toLowerCase())
    .filter((e) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
      if (seen.has(e)) return false;
      seen.add(e);
      return true;
    });

  for (const email of clean) {
    const usage = await getSeatUsage(orgId);
    if (usage.available <= 0) {
      skipped.push({ email, reason: "seat_limit_reached" });
      continue;
    }
    // Skip if this email already has an active/invited survivor seat in THIS org.
    const dup = await db.execute(sql`
      SELECT 1 FROM organization_members
       WHERE org_id = ${orgId} AND role = 'survivor'
         AND status IN ('invited','active')
         AND lower(invited_email) = ${email}
       LIMIT 1
    `);
    if ((dup.rows as any[]).length) {
      skipped.push({ email, reason: "already_invited" });
      continue;
    }
    const token = newToken();
    await db.insert(organizationMembers).values({
      orgId,
      role: "survivor",
      status: "invited",
      invitedEmail: email,
      inviteToken: token,
    });
    invited.push({ email, token });
  }
  return { invited, skipped };
}

// Public: resolve an invite token to display org info on the join page.
export async function getInviteByToken(token: string): Promise<
  | { org: { id: number; name: string; orgType: string }; email: string | null; status: string }
  | null
> {
  await ensureInstitutionSchema();
  if (!token || token.length > 64) return null;
  const [m] = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.inviteToken, token))
    .limit(1);
  if (!m) return null;
  const org = await getOrganization(m.orgId);
  if (!org) return null;
  return {
    org: { id: org.id, name: org.name, orgType: org.orgType },
    email: m.invitedEmail,
    status: m.status,
  };
}

// Authenticated survivor accepts an invite → seat consumed, membership active,
// default aggregate consent created. Idempotent for the same user.
export async function acceptInvite(
  token: string,
  userId: string,
): Promise<{ ok: boolean; orgId?: number; reason?: string }> {
  await ensureInstitutionSchema();
  const [m] = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.inviteToken, token))
    .limit(1);
  if (!m) return { ok: false, reason: "invalid_token" };
  if (m.status === "active" && m.userId === userId) return { ok: true, orgId: m.orgId };
  if (m.status === "active") return { ok: false, reason: "already_used" };
  if (m.status === "removed") return { ok: false, reason: "revoked" };

  const org = await getOrganization(m.orgId);
  if (!org || org.status === "suspended") return { ok: false, reason: "org_unavailable" };

  // If the user already holds an active survivor seat in this org, just link it.
  await db
    .update(organizationMembers)
    .set({ userId, status: "active", joinedAt: new Date() })
    .where(eq(organizationMembers.id, m.id));

  // Default consent: aggregate (de-identified). Created on first accept only.
  await db.execute(sql`
    INSERT INTO organization_consents (org_id, user_id, share_level, updated_at)
    VALUES (${m.orgId}, ${userId}, 'aggregate', now())
    ON CONFLICT (org_id, user_id) DO NOTHING
  `);
  return { ok: true, orgId: m.orgId };
}

// Remove a survivor seat (frees the seat). Also drops their consent for the org.
export async function removeMember(orgId: number, memberId: number): Promise<boolean> {
  await ensureInstitutionSchema();
  const [m] = await db
    .select()
    .from(organizationMembers)
    .where(and(eq(organizationMembers.id, memberId), eq(organizationMembers.orgId, orgId)))
    .limit(1);
  if (!m) return false;
  await db
    .update(organizationMembers)
    .set({ status: "removed", removedAt: new Date() })
    .where(eq(organizationMembers.id, memberId));
  if (m.userId) {
    await db
      .delete(organizationConsents)
      .where(and(eq(organizationConsents.orgId, orgId), eq(organizationConsents.userId, m.userId)));
  }
  return true;
}

// ── Membership + roles (authorization) ──────────────────────────────────────
export async function getUserOrgRole(orgId: number, userId: string): Promise<string | null> {
  await ensureInstitutionSchema();
  const [m] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active")))
    .limit(1);
  return m?.role ?? null;
}

export async function listMembershipsForUser(userId: string): Promise<any[]> {
  await ensureInstitutionSchema();
  const rows = await db.execute(sql`
    SELECT m.id AS member_id, m.role, m.status, m.joined_at,
           o.id AS org_id, o.name AS org_name, o.org_type, o.status AS org_status,
           c.share_level
      FROM organization_members m
      JOIN organizations o ON o.id = m.org_id
      LEFT JOIN organization_consents c ON c.org_id = m.org_id AND c.user_id = m.user_id
     WHERE m.user_id = ${userId} AND m.status = 'active'
     ORDER BY m.joined_at DESC NULLS LAST
  `);
  return (rows.rows as any[]) || [];
}

// Returns true if the user holds an ACTIVE survivor seat in an ACTIVE/trial org
// (this is the org-level entitlement that replaces a personal subscription).
export async function hasActiveSurvivorSeat(userId: string): Promise<boolean> {
  try {
    await ensureInstitutionSchema();
    const r = await db.execute(sql`
      SELECT 1 FROM organization_members m
      JOIN organizations o ON o.id = m.org_id
      WHERE m.user_id = ${userId} AND m.role = 'survivor' AND m.status = 'active'
        AND o.status IN ('active','trial')
      LIMIT 1
    `);
    return (r.rows as any[]).length > 0;
  } catch {
    return false;
  }
}

// ── Consent (survivor-facing) ───────────────────────────────────────────────
export async function getConsent(orgId: number, userId: string): Promise<string> {
  await ensureInstitutionSchema();
  const [c] = await db
    .select({ shareLevel: organizationConsents.shareLevel })
    .from(organizationConsents)
    .where(and(eq(organizationConsents.orgId, orgId), eq(organizationConsents.userId, userId)))
    .limit(1);
  return c?.shareLevel ?? "aggregate";
}

export async function setConsent(orgId: number, userId: string, shareLevel: "none" | "aggregate" | "identified"): Promise<void> {
  await ensureInstitutionSchema();
  await db.execute(sql`
    INSERT INTO organization_consents (org_id, user_id, share_level, updated_at)
    VALUES (${orgId}, ${userId}, ${shareLevel}, now())
    ON CONFLICT (org_id, user_id) DO UPDATE SET share_level = EXCLUDED.share_level, updated_at = now()
  `);
}

// ── Clinician cohort dashboard (aggregate, consent-gated) ────────────────────
// Returns de-identified cohort metrics computed ONLY over consented survivors,
// suppressed below MIN_COHORT. Never returns PII in this payload.
export async function getCohortMetrics(orgId: number): Promise<any> {
  await ensureInstitutionSchema();

  // Consented survivor userIds (aggregate OR identified).
  const consented = await db.execute(sql`
    SELECT m.user_id
      FROM organization_members m
      JOIN organization_consents c ON c.org_id = m.org_id AND c.user_id = m.user_id
     WHERE m.org_id = ${orgId} AND m.role = 'survivor' AND m.status = 'active'
       AND m.user_id IS NOT NULL AND c.share_level IN ('aggregate','identified')
  `);
  const ids = (consented.rows as any[]).map((r) => String(r.user_id));

  const seat = await getSeatUsage(orgId);

  // Total active survivors (for the "consent participation" denominator) — a
  // count only, no identities leave.
  const totalActiveR = await db.execute(sql`
    SELECT COUNT(*)::int AS c FROM organization_members
     WHERE org_id = ${orgId} AND role = 'survivor' AND status = 'active'
  `);
  const totalActive = Number((totalActiveR.rows as any[])[0]?.c ?? 0);

  if (ids.length < MIN_COHORT) {
    return {
      suppressed: true,
      minCohort: MIN_COHORT,
      consentedCount: ids.length,
      totalActive,
      seats: seat,
    };
  }

  // Bind the consented ids as a single text[] param. Interpolating a bare JS
  // array into a raw sql template makes the neon driver emit ANY(($1,$2,$3))
  // (a row constructor, not an array) which Postgres rejects with 42809. An
  // explicit ARRAY[...]::text[] keeps every id parameterized (no injection).
  const idArray = sql`ARRAY[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}]::text[]`;

  // Aggregate engagement + outcome trends over the consented cohort.
  const engagement = await db.execute(sql`
    SELECT
      (SELECT COUNT(DISTINCT uid)::int FROM (
         SELECT user_id AS uid FROM daily_checkins WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '7 days'
         UNION SELECT user_id AS uid FROM sasquatch_chat_messages WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '7 days'
         UNION SELECT user_id AS uid FROM never_zero_audits WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '7 days'
      ) t) AS active_7d,
      (SELECT COUNT(DISTINCT uid)::int FROM (
         SELECT user_id AS uid FROM daily_checkins WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '30 days'
         UNION SELECT user_id AS uid FROM sasquatch_chat_messages WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '30 days'
         UNION SELECT user_id AS uid FROM never_zero_audits WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '30 days'
      ) t) AS active_30d
  `);
  const eng = (engagement.rows as any[])[0] || {};

  // Activation: intake complete AND ≥1 checkin AND ≥1 coach message.
  const activatedR = await db.execute(sql`
    SELECT COUNT(*)::int AS c FROM user_profiles up
     WHERE up.user_id = ANY(${idArray}) AND up.intake_completed_at IS NOT NULL
       AND EXISTS (SELECT 1 FROM daily_checkins dc WHERE dc.user_id = up.user_id)
       AND EXISTS (SELECT 1 FROM sasquatch_chat_messages msg WHERE msg.user_id = up.user_id AND msg.role = 'user')
  `);
  const activated = Number((activatedR.rows as any[])[0]?.c ?? 0);

  // Streak / consistency (avg current + longest streak).
  const streakR = await db.execute(sql`
    SELECT COALESCE(ROUND(AVG(current_streak)::numeric, 1), 0) AS avg_current,
           COALESCE(MAX(longest_streak), 0) AS max_longest,
           COALESCE(SUM(total_active_days), 0) AS total_active_days
      FROM user_streaks WHERE user_id = ANY(${idArray})
  `);
  const streak = (streakR.rows as any[])[0] || {};

  // Self-reported outcome trend (Sasquatch Scale) — cohort average of the most
  // recent assessment per survivor, per domain. Self-assessment, not clinical.
  const scaleR = await db.execute(sql`
    WITH latest AS (
      SELECT DISTINCT ON (user_id) user_id, physical, cognitive, speech, emotional, memory
        FROM sasquatch_assessments
       WHERE user_id = ANY(${idArray})
       ORDER BY user_id, taken_at DESC
    )
    SELECT COUNT(*)::int AS n,
           ROUND(AVG(physical)::numeric,1) AS physical,
           ROUND(AVG(cognitive)::numeric,1) AS cognitive,
           ROUND(AVG(speech)::numeric,1) AS speech,
           ROUND(AVG(emotional)::numeric,1) AS emotional,
           ROUND(AVG(memory)::numeric,1) AS memory
      FROM latest
  `).catch(() => ({ rows: [] as any[] }));
  const scale = (scaleR.rows as any[])[0] || {};

  // Reps volume (never_zero_logs) last 30d — total accountability actions.
  const repsR = await db.execute(sql`
    SELECT COUNT(*)::int AS actions, COALESCE(SUM(reps),0)::int AS total_reps
      FROM never_zero_logs
     WHERE user_id = ANY(${idArray}) AND created_at >= now() - interval '30 days'
  `).catch(() => ({ rows: [{ actions: 0, total_reps: 0 }] as any[] }));
  const reps = (repsR.rows as any[])[0] || {};

  const n = ids.length;
  return {
    suppressed: false,
    consentedCount: n,
    totalActive,
    seats: seat,
    engagement: {
      active7d: Number(eng.active_7d ?? 0),
      active30d: Number(eng.active_30d ?? 0),
      active7dRate: n ? Number(eng.active_7d ?? 0) / n : null,
    },
    activation: { activated, activationRate: n ? activated / n : null },
    consistency: {
      avgCurrentStreak: Number(streak.avg_current ?? 0),
      maxLongestStreak: Number(streak.max_longest ?? 0),
      totalActiveDays: Number(streak.total_active_days ?? 0),
    },
    outcomeTrend: {
      assessedCount: Number(scale.n ?? 0),
      physical: scale.physical != null ? Number(scale.physical) : null,
      cognitive: scale.cognitive != null ? Number(scale.cognitive) : null,
      speech: scale.speech != null ? Number(scale.speech) : null,
      emotional: scale.emotional != null ? Number(scale.emotional) : null,
      memory: scale.memory != null ? Number(scale.memory) : null,
    },
    reps: { actions30d: Number(reps.actions ?? 0), totalReps30d: Number(reps.total_reps ?? 0) },
  };
}

// Identified member list — ONLY survivors who explicitly consented to
// 'identified'. Engagement summary only; NO raw journal/medical/flicker text.
export async function getIdentifiedMembers(orgId: number): Promise<any[]> {
  await ensureInstitutionSchema();
  const rows = await db.execute(sql`
    SELECT u.id AS user_id, u.first_name, u.last_name, u.email,
           s.current_streak, s.longest_streak, s.last_activity_date,
           (SELECT COUNT(*)::int FROM daily_checkins dc WHERE dc.user_id = u.id) AS checkin_count,
           up.intake_completed_at
      FROM organization_members m
      JOIN organization_consents c ON c.org_id = m.org_id AND c.user_id = m.user_id
      JOIN users u ON u.id = m.user_id
      LEFT JOIN user_streaks s ON s.user_id = u.id
      LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE m.org_id = ${orgId} AND m.role = 'survivor' AND m.status = 'active'
       AND c.share_level = 'identified'
     ORDER BY s.last_activity_date DESC NULLS LAST
  `);
  return ((rows.rows as any[]) || []).map((r) => ({
    userId: r.user_id,
    name: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Survivor",
    email: r.email,
    currentStreak: Number(r.current_streak ?? 0),
    longestStreak: Number(r.longest_streak ?? 0),
    lastActivityDate: r.last_activity_date,
    checkinCount: Number(r.checkin_count ?? 0),
    intakeCompleted: !!r.intake_completed_at,
  }));
}

// Roster for org staff: survivor seats with status + consent level (no PHI, no
// engagement — just seat management data). Includes invited (pending) seats.
export async function getRoster(orgId: number): Promise<any[]> {
  await ensureInstitutionSchema();
  const rows = await db.execute(sql`
    SELECT m.id AS member_id, m.status, m.invited_email, m.invite_token,
           m.joined_at, m.invited_at,
           u.first_name, u.last_name,
           c.share_level
      FROM organization_members m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN organization_consents c ON c.org_id = m.org_id AND c.user_id = m.user_id
     WHERE m.org_id = ${orgId} AND m.role = 'survivor' AND m.status IN ('invited','active')
     ORDER BY m.invited_at DESC
  `);
  return ((rows.rows as any[]) || []).map((r) => ({
    memberId: r.member_id,
    status: r.status,
    invitedEmail: r.invited_email,
    inviteToken: r.status === "invited" ? r.invite_token : null,
    name: [r.first_name, r.last_name].filter(Boolean).join(" ") || null,
    shareLevel: r.share_level ?? (r.status === "active" ? "aggregate" : null),
    joinedAt: r.joined_at,
    invitedAt: r.invited_at,
  }));
}
