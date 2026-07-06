import type { Express } from 'express';
import { db } from '../db';
import {
  caregiverLinks,
  courseCreditUnlocks,
  users,
  courses,
} from '@shared/schema';
import { sql, eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const INVITE_TTL_DAYS = 14;

const inviteSchema = z.object({
  email: z.string().email().max(200),
  relationship: z.string().trim().max(40).optional(),
});

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function registerCaregiverRoutes(app: Express, isAuthenticated: any) {
  // List caregiver-side and survivor-side links for the signed-in user.
  app.get('/api/caregivers/links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;

      // Self-heal: any caregiver unlock that failed to mirror at purchase time
      // (DB blip, transient error) gets re-mirrored next time the survivor pulls
      // their links. mirrorOneUnlock is idempotent via the unique (buyer, course)
      // index, so already-mirrored rows are a no-op.
      try {
        const activeLinks = await db.execute(sql`
          SELECT caregiver_id FROM caregiver_links
          WHERE survivor_id = ${userId} AND status = 'active'
        `) as any;
        for (const r of (activeLinks.rows ?? activeLinks)) {
          await mirrorUnlocksToSurvivor(r.caregiver_id, userId).catch(() => null);
        }
      } catch { /* non-fatal */ }

      const asCaregiver = await db.execute(sql`
        SELECT l.*,
               u.first_name AS survivor_first,
               u.last_name  AS survivor_last,
               u.email      AS survivor_email,
               u.avatar_url AS survivor_avatar
        FROM caregiver_links l
        LEFT JOIN users u ON u.id = l.survivor_id
        WHERE l.caregiver_id = ${userId}
        ORDER BY l.invited_at DESC
      `);
      const asSurvivor = await db.execute(sql`
        SELECT l.*,
               u.first_name AS caregiver_first,
               u.last_name  AS caregiver_last,
               u.email      AS caregiver_email,
               u.avatar_url AS caregiver_avatar
        FROM caregiver_links l
        LEFT JOIN users u ON u.id = l.caregiver_id
        WHERE l.survivor_id = ${userId}
        ORDER BY l.invited_at DESC
      `);
      res.json({
        asCaregiver: (asCaregiver as any).rows ?? asCaregiver,
        asSurvivor: (asSurvivor as any).rows ?? asSurvivor,
      });
    } catch (err: any) {
      console.error('[caregivers] list', err);
      res.status(500).json({ error: 'Failed to load links' });
    }
  });

  // Caregiver invites a survivor by email. If the email matches an existing
  // user we prelink to their account; otherwise the link is held until accept.
  app.post('/api/caregivers/invite', isAuthenticated, async (req: any, res) => {
    const caregiverId = req.user.claims.sub as string;
    const parsed = inviteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid invite', issues: parsed.error.issues });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const relationship = parsed.data.relationship ?? null;

    try {
      // Resolve existing user by email (case-insensitive).
      const matched = await db.execute(sql`
        SELECT id, email FROM users WHERE LOWER(email) = ${email} LIMIT 1
      `) as any;
      const existingUser = (matched.rows ?? matched)[0];
      if (existingUser?.id === caregiverId) {
        return res.status(400).json({ error: 'You can\'t link yourself.' });
      }

      // If we already have a row for this pair / email, return it instead of dup.
      if (existingUser) {
        const [dup] = await db.select().from(caregiverLinks).where(and(
          eq(caregiverLinks.caregiverId, caregiverId),
          eq(caregiverLinks.survivorId, existingUser.id),
        )).limit(1);
        if (dup) return res.json({ link: dup, alreadyExisted: true });
      } else {
        const dupByEmail = await db.execute(sql`
          SELECT * FROM caregiver_links
          WHERE caregiver_id = ${caregiverId}
            AND LOWER(invite_email) = ${email}
            AND status IN ('invited','active')
          LIMIT 1
        `) as any;
        const row = (dupByEmail.rows ?? dupByEmail)[0];
        if (row) return res.json({ link: row, alreadyExisted: true });
      }

      const token = genToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      const [link] = await db.insert(caregiverLinks).values({
        caregiverId,
        survivorId: existingUser?.id ?? null,
        relationship,
        inviteEmail: email,
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        status: 'invited',
      }).returning();

      // TODO: send transactional email via Resend with the accept URL.
      // For now expose the token directly so the UI can render a copyable link.
      res.status(201).json({
        link,
        acceptUrl: `/settings/caregivers/accept/${token}`,
      });
    } catch (err: any) {
      console.error('[caregivers] invite', err);
      res.status(500).json({ error: 'Could not send invite' });
    }
  });

  // Survivor accepts an invite via token. Sets survivorId on the link and flips
  // status to active. Token is single-use (cleared on success).
  app.post('/api/caregivers/accept/:token', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const token = String(req.params.token || '');
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
      const [link] = await db.select().from(caregiverLinks)
        .where(eq(caregiverLinks.inviteToken, token))
        .limit(1);
      if (!link) return res.status(404).json({ error: 'Invite not found' });
      if (link.caregiverId === userId) {
        return res.status(400).json({ error: 'You sent this invite — it must be accepted by the survivor.' });
      }
      if (link.status === 'revoked') return res.status(410).json({ error: 'Invite revoked' });
      if (link.inviteExpiresAt && link.inviteExpiresAt.getTime() < Date.now()) {
        await db.update(caregiverLinks).set({ status: 'expired' }).where(eq(caregiverLinks.id, link.id));
        return res.status(410).json({ error: 'Invite expired' });
      }

      // If the link was created without a survivorId (email-only invite), claim it.
      // Otherwise must match the recipient.
      if (link.survivorId && link.survivorId !== userId) {
        return res.status(403).json({ error: 'This invite belongs to another account' });
      }

      // Block duplicate active link (caregiverId + survivorId) — unique idx will
      // fail on conflict; pre-check for cleaner error.
      const [dup] = await db.select().from(caregiverLinks).where(and(
        eq(caregiverLinks.caregiverId, link.caregiverId),
        eq(caregiverLinks.survivorId, userId),
        eq(caregiverLinks.status, 'active'),
      )).limit(1);
      if (dup && dup.id !== link.id) {
        await db.update(caregiverLinks).set({ status: 'revoked', revokedAt: new Date() })
          .where(eq(caregiverLinks.id, link.id));
        return res.json({ link: dup, alreadyActive: true });
      }

      const [accepted] = await db.update(caregiverLinks).set({
        survivorId: userId,
        status: 'active',
        acceptedAt: new Date(),
        inviteToken: null,
      }).where(eq(caregiverLinks.id, link.id)).returning();

      // Backfill: mirror every existing non-refunded unlock from caregiver to survivor.
      await mirrorUnlocksToSurvivor(link.caregiverId, userId);

      res.json({ link: accepted });
    } catch (err: any) {
      console.error('[caregivers] accept', err);
      res.status(500).json({ error: 'Could not accept invite' });
    }
  });

  // Either side can revoke an active link. Revokes future mirroring; existing
  // mirrored unlocks remain (the survivor keeps what was already gifted).
  app.post('/api/caregivers/:id/revoke', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const linkId = parseInt(req.params.id, 10);
    if (!Number.isFinite(linkId)) return res.status(400).json({ error: 'Invalid id' });

    try {
      const [link] = await db.select().from(caregiverLinks)
        .where(eq(caregiverLinks.id, linkId)).limit(1);
      if (!link) return res.status(404).json({ error: 'Link not found' });
      if (link.caregiverId !== userId && link.survivorId !== userId) {
        return res.status(403).json({ error: 'Not your link' });
      }
      const [revoked] = await db.update(caregiverLinks).set({
        status: 'revoked',
        revokedAt: new Date(),
        inviteToken: null,
      }).where(eq(caregiverLinks.id, linkId)).returning();
      res.json({ link: revoked });
    } catch (err: any) {
      console.error('[caregivers] revoke', err);
      res.status(500).json({ error: 'Could not revoke link' });
    }
  });

  // Caregiver dashboard: read the linked survivor's key recovery metrics.
  // Only an active caregiver for that survivor can call this.
  // Returns 404 (not 403) on auth failure to avoid leaking survivor existence.
  app.get('/api/caregivers/survivor/:survivorId/dashboard', isAuthenticated, async (req: any, res) => {
    const caregiverId = req.user.claims.sub as string;
    const survivorId = req.params.survivorId;

    try {
      // Verify active link
      const link = await db.execute(sql`
        SELECT id FROM caregiver_links
         WHERE caregiver_id = ${caregiverId}
           AND survivor_id  = ${survivorId}
           AND status = 'active'
         LIMIT 1
      `);
      const linkRows = link.rows ?? link as any;
      if (!linkRows || linkRows.length === 0) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Survivor basic info
      const survivorRow = await db.execute(sql`
        SELECT first_name, last_name, avatar_url, created_at FROM users
         WHERE id = ${survivorId} LIMIT 1
      `);
      const survivor = ((survivorRow.rows ?? survivorRow) as any[])[0];
      if (!survivor) return res.status(404).json({ message: 'Not found' });

      // NeverZero streak — read from pre-computed user_streaks table
      const streakRow = await db.execute(sql`
        SELECT current_streak AS streak, last_activity_date
          FROM user_streaks
         WHERE user_id = ${survivorId}
         LIMIT 1
      `).catch(() => ({ rows: [] }));
      const streakData = ((streakRow.rows ?? streakRow) as any[])[0];
      const streak = streakData?.streak ?? 0;

      // Total check-ins as a proxy for activity volume
      const checkinsRow = await db.execute(sql`
        SELECT COUNT(*)::int AS total FROM daily_checkins WHERE user_id = ${survivorId}
      `).catch(() => ({ rows: [{ total: 0 }] }));
      const totalReps = ((checkinsRow.rows ?? checkinsRow) as any[])[0]?.total ?? 0;

      // Recent check-in activity (last 7 days) — extract exercise labels from JSONB
      const recentReps = await db.execute(sql`
        SELECT DATE(checkin_date) AS checkin_day,
               exercise_minutes,
               wins_today,
               checkin_date AS last_at
          FROM daily_checkins
         WHERE user_id = ${survivorId}
           AND checkin_date >= NOW() - INTERVAL '7 days'
         ORDER BY checkin_date DESC
         LIMIT 7
      `).catch(() => ({ rows: [] }));

      // Survivor profile (deficit info) — stored in user_profiles
      const profileRow = await db.execute(sql`
        SELECT stroke_type, affected_side, deficits, stroke_date,
               daily_time_budget_minutes, energy_pattern
          FROM user_profiles WHERE user_id = ${survivorId} LIMIT 1
      `).catch(() => ({ rows: [] }));
      const profile = ((profileRow.rows ?? profileRow) as any[])[0] ?? null;

      // Days since stroke
      const daysSinceStroke = profile?.stroke_date
        ? Math.floor((Date.now() - new Date(profile.stroke_date).getTime()) / 86_400_000)
        : null;

      // Last check-in date
      const lastCheckinRow = await db.execute(sql`
        SELECT MAX(checkin_date) AS last_at FROM daily_checkins WHERE user_id = ${survivorId}
      `).catch(() => ({ rows: [{ last_at: null }] }));
      const lastCheckinAt = ((lastCheckinRow.rows ?? lastCheckinRow) as any[])[0]?.last_at ?? null;

      return res.json({
        survivor: {
          firstName: survivor.first_name,
          lastName: survivor.last_name,
          avatarUrl: survivor.avatar_url,
          joinedAt: survivor.created_at,
        },
        metrics: {
          streak,
          totalReps,
          daysSinceStroke,
          lastCheckinAt,
        },
        recentActivity: (recentReps.rows ?? recentReps as any).map((r: any) => ({
          label: r.checkin_day
            ? new Date(r.checkin_day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : 'Check-in',
          exerciseMinutes: r.exercise_minutes ?? 0,
          winsToday: r.wins_today ?? null,
          lastAt: r.last_at,
        })),
        profile: profile
          ? {
              strokeType: profile.stroke_type,
              affectedSide: profile.affected_side,
              deficits: profile.deficits,
              dailyTimeBudgetMinutes: profile.daily_time_budget_minutes,
              energyPattern: profile.energy_pattern,
            }
          : null,
      });
    } catch (err: any) {
      console.error('[caregivers] dashboard', err);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  });

  // Internal: when caregiver unlocks course X, mirror access to all linked survivors.
  // Exposed as a route so courseUnlockRoutes can hand off post-unlock; also called
  // directly in this file after accept.
  app.post('/api/caregivers/mirror-unlock', isAuthenticated, async (req: any, res) => {
    const caregiverId = req.user.claims.sub as string;
    const courseId = parseInt(req.body?.courseId, 10);
    if (!Number.isFinite(courseId)) return res.status(400).json({ error: 'Invalid courseId' });
    try {
      const mirrored = await mirrorOneUnlock(caregiverId, courseId);
      res.json({ mirroredCount: mirrored });
    } catch (err: any) {
      console.error('[caregivers] mirror-unlock', err);
      res.status(500).json({ error: 'Could not mirror unlock' });
    }
  });
}

// ─── Helpers (exported for the unlock route to call directly) ────────────────

export async function mirrorOneUnlock(caregiverId: string, courseId: number): Promise<number> {
  const links = await db.select().from(caregiverLinks).where(and(
    eq(caregiverLinks.caregiverId, caregiverId),
    eq(caregiverLinks.status, 'active'),
  ));
  if (!links.length) return 0;

  const [unlock] = await db.select().from(courseCreditUnlocks).where(and(
    eq(courseCreditUnlocks.buyerId, caregiverId),
    eq(courseCreditUnlocks.courseId, courseId),
  )).limit(1);
  if (!unlock) return 0;

  let count = 0;
  for (const link of links) {
    if (!link.survivorId) continue;
    // Skip if survivor already has a non-refunded unlock for this course.
    const [exists] = await db.select().from(courseCreditUnlocks).where(and(
      eq(courseCreditUnlocks.buyerId, link.survivorId),
      eq(courseCreditUnlocks.courseId, courseId),
    )).limit(1);
    if (exists && !exists.refundedAt) continue;

    if (exists) {
      // Refunded survivor row — flip back, mark caregiver-sponsored.
      await db.execute(sql`
        UPDATE course_credit_unlocks
        SET creator_id = ${unlock.creatorId},
            points_spent = 0,
            cash_equivalent_cents = 0,
            creator_payout_cents = 0,
            platform_fee_cents = 0,
            payout_status = 'skipped',
            payout_transfer_id = NULL,
            refunded_at = NULL,
            refund_reason = NULL,
            refund_points = NULL,
            refund_transfer_reversal_id = NULL,
            created_at = NOW(),
            source = 'caregiver',
            sponsor_user_id = ${caregiverId}
        WHERE id = ${exists.id}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO course_credit_unlocks
          (buyer_id, creator_id, course_id, points_spent,
           cash_equivalent_cents, creator_payout_cents, platform_fee_cents,
           payout_status, source, sponsor_user_id)
        VALUES (${link.survivorId}, ${unlock.creatorId}, ${courseId}, 0,
                0, 0, 0, 'skipped', 'caregiver', ${caregiverId})
      `);
    }
    count++;
  }
  return count;
}

export async function mirrorUnlocksToSurvivor(caregiverId: string, survivorId: string): Promise<number> {
  const unlocks = await db.select().from(courseCreditUnlocks).where(
    eq(courseCreditUnlocks.buyerId, caregiverId),
  );
  let count = 0;
  for (const u of unlocks) {
    if (u.refundedAt) continue;
    const [exists] = await db.select().from(courseCreditUnlocks).where(and(
      eq(courseCreditUnlocks.buyerId, survivorId),
      eq(courseCreditUnlocks.courseId, u.courseId),
    )).limit(1);
    if (exists && !exists.refundedAt) continue;

    if (exists) {
      await db.execute(sql`
        UPDATE course_credit_unlocks
        SET creator_id = ${u.creatorId}, points_spent = 0,
            cash_equivalent_cents = 0, creator_payout_cents = 0,
            platform_fee_cents = 0, payout_status = 'skipped',
            payout_transfer_id = NULL, refunded_at = NULL,
            refund_reason = NULL, refund_points = NULL,
            refund_transfer_reversal_id = NULL, created_at = NOW(),
            source = 'caregiver', sponsor_user_id = ${caregiverId}
        WHERE id = ${exists.id}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO course_credit_unlocks
          (buyer_id, creator_id, course_id, points_spent,
           cash_equivalent_cents, creator_payout_cents, platform_fee_cents,
           payout_status, source, sponsor_user_id)
        VALUES (${survivorId}, ${u.creatorId}, ${u.courseId}, 0,
                0, 0, 0, 'skipped', 'caregiver', ${caregiverId})
      `);
    }
    count++;
  }
  return count;
}
