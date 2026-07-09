import type { Express } from 'express';
import { db } from '../db';
import {
  scholarshipFund,
  scholarshipContributions,
  scholarshipGrants,
  scholarshipRequests,
  courseCreditUnlocks,
  courses,
  users,
  userCourseProgress,
} from '@workspace/db';
import { sql, eq, and, desc } from 'drizzle-orm';
import { addCredits } from '../creditService';
import { getRecoveryStripeClient } from '../recoveryStripeClient';
import { z } from 'zod/v4';
import { getUserId } from "../lib/authUtils";

const POINT_VALUE_CENTS = 4;
const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

// Survivors get at most one auto-grant per 30-day window.
const GRANT_COOLDOWN_DAYS = 30;

function computePointsForCourse(hours: number, difficulty: string): number {
  const base = Math.max(1, hours) * 100;
  const mult =
    difficulty === 'reign' || difficulty === 'advanced' ? 1.5 :
    difficulty === 'rise' || difficulty === 'intermediate' ? 1.2 : 1.0;
  return Math.round(base * mult);
}

const requestSchema = z.object({
  story: z.string().trim().min(20, "Tell us at least a sentence or two").max(2000).optional(),
  courseId: z.number().int().positive().optional(), // optional preferred course
});

const contributeSchema = z.object({
  points: z.number().int().min(25).max(50000),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().email().max(200).optional(),
  message: z.string().trim().max(500).optional(),
  isAnonymous: z.boolean().optional(),
});

export function registerScholarshipRoutes(app: Express, isAuthenticated: any) {
  // Public: fund snapshot — balance, lifetime totals, recent grants.
  app.get('/api/scholarship/status', async (_req, res) => {
    try {
      const [fund] = await db.select().from(scholarshipFund).limit(1);
      const recent = await db.execute(sql`
        SELECT g.id, g.granted_at, g.points_granted,
               c.id   AS course_id,
               c.title AS course_title,
               c.slug  AS course_slug,
               u.first_name AS first_name
        FROM scholarship_grants g
        JOIN courses c ON c.id = g.course_id
        LEFT JOIN users u ON u.id = g.user_id
        ORDER BY g.granted_at DESC
        LIMIT 8
      `);
      res.json({
        fund: fund ?? { balancePoints: 0, totalFunded: 0, totalGranted: 0, totalDonors: 0 },
        recentGrants: (recent as any).rows ?? recent,
      });
    } catch (err: any) {
      console.error('[scholarship] status', err);
      res.status(500).json({ error: 'Failed to load scholarship status' });
    }
  });

  // Authed: my eligibility — last grant date, cooldown remaining, open request status.
  app.get('/api/scholarship/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req) as string;
      const grants = await db.select().from(scholarshipGrants)
        .where(eq(scholarshipGrants.userId, userId))
        .orderBy(desc(scholarshipGrants.grantedAt))
        .limit(10);
      const last = grants[0];
      const now = Date.now();
      const cooldownMs = GRANT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const eligibleAt = last ? new Date(last.grantedAt!.getTime() + cooldownMs) : new Date(now);
      const daysLeft = Math.max(0, Math.ceil((eligibleAt.getTime() - now) / (24 * 60 * 60 * 1000)));

      const openReq = await db.select().from(scholarshipRequests)
        .where(and(
          eq(scholarshipRequests.userId, userId),
          eq(scholarshipRequests.status, 'pending'),
        ))
        .orderBy(desc(scholarshipRequests.createdAt))
        .limit(1);

      res.json({
        eligible: daysLeft === 0,
        daysLeft,
        nextEligibleAt: eligibleAt,
        grants,
        pendingRequest: openReq[0] ?? null,
      });
    } catch (err: any) {
      console.error('[scholarship] me', err);
      res.status(500).json({ error: 'Failed to load eligibility' });
    }
  });

  // Authed: request a scholarship. Auto-grants if fund has balance + survivor eligible
  // + a suitable course exists. Otherwise creates a pending request for admin review.
  app.post('/api/scholarship/request', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req) as string;
    const parsed = requestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues });
    }
    const { story, courseId: preferredCourseId } = parsed.data;

    try {
      // Per-user advisory lock — serializes concurrent requests by the same survivor
      // so the cooldown + course-pick + fund-debit chain can't be raced. The lock is
      // session-scoped and Postgres-only; we release it in `finally`.
      const lockKey = `scholarship:${userId}`;
      await db.execute(sql`SELECT pg_advisory_lock(hashtextextended(${lockKey}, 0))`);
    try {
      // Cooldown gate.
      const [last] = await db.select().from(scholarshipGrants)
        .where(eq(scholarshipGrants.userId, userId))
        .orderBy(desc(scholarshipGrants.grantedAt))
        .limit(1);
      if (last) {
        const cooldownMs = GRANT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        const ageMs = Date.now() - last.grantedAt!.getTime();
        if (ageMs < cooldownMs) {
          const daysLeft = Math.ceil((cooldownMs - ageMs) / (24 * 60 * 60 * 1000));
          return res.status(429).json({
            error: `You can request another scholarship in ${daysLeft} day(s).`,
            daysLeft,
          });
        }
      }

      // Pick the target course. Prefer the one survivor asked for IF eligible
      // (published, has an instructor, not already unlocked/granted to them).
      // Otherwise rank by enrollment_count DESC (popularity proxy).
      let target: any = null;
      if (preferredCourseId) {
        const [c] = await db.execute(sql`
          SELECT c.* FROM courses c
          WHERE c.id = ${preferredCourseId}
            AND c.is_published = true
            AND c.instructor_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM course_credit_unlocks u
              WHERE u.buyer_id = ${userId} AND u.course_id = c.id AND u.refunded_at IS NULL
            )
            AND NOT EXISTS (
              SELECT 1 FROM scholarship_grants g
              WHERE g.user_id = ${userId} AND g.course_id = c.id
            )
          LIMIT 1
        `) as any;
        target = c?.rows?.[0] ?? c?.[0] ?? null;
      }
      if (!target) {
        const ranked = await db.execute(sql`
          SELECT c.* FROM courses c
          WHERE c.is_published = true
            AND c.instructor_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM course_credit_unlocks u
              WHERE u.buyer_id = ${userId} AND u.course_id = c.id AND u.refunded_at IS NULL
            )
            AND NOT EXISTS (
              SELECT 1 FROM scholarship_grants g
              WHERE g.user_id = ${userId} AND g.course_id = c.id
            )
          ORDER BY c.enrollment_count DESC, c.created_at DESC
          LIMIT 1
        `) as any;
        target = ranked?.rows?.[0] ?? ranked?.[0] ?? null;
      }
      if (!target) {
        return res.status(404).json({
          error: 'No eligible courses available right now. Try again soon.',
        });
      }

      const points = computePointsForCourse(target.estimated_hours ?? 1, target.difficulty);
      const cashEquivalentCents = points * POINT_VALUE_CENTS;
      const creatorPayoutCents = Math.floor((cashEquivalentCents * CREATOR_SHARE_PERCENT) / 100);
      const platformFeeCents = cashEquivalentCents - creatorPayoutCents;

      // Atomic deduction from the fund. If balance insufficient, fall through to pending.
      const claimed = await db.execute(sql`
        UPDATE scholarship_fund
        SET balance_points = balance_points - ${points},
            total_granted  = total_granted + ${points},
            updated_at     = NOW()
        WHERE id = 1 AND balance_points >= ${points}
        RETURNING balance_points
      `) as any;
      const claimedRows = claimed?.rows ?? claimed ?? [];
      if (!claimedRows.length) {
        // Fund empty / insufficient — record as pending for admin review.
        const [pending] = await db.insert(scholarshipRequests).values({
          userId,
          story: story ?? null,
          status: 'pending',
        }).returning();
        return res.status(202).json({
          status: 'pending',
          reason: 'Scholarship fund is currently below the cost of an eligible course. Your request is queued.',
          request: pending,
        });
      }

      // Re-use any prior refunded row for (buyer, course) to respect unique idx.
      const [existing] = await db.select().from(courseCreditUnlocks).where(and(
        eq(courseCreditUnlocks.buyerId, userId),
        eq(courseCreditUnlocks.courseId, target.id),
      )).limit(1);

      let unlock: any;
      try {
        if (existing) {
          const [row] = await db.update(courseCreditUnlocks).set({
            creatorId: target.instructor_id,
            pointsSpent: points,
            cashEquivalentCents,
            creatorPayoutCents,
            platformFeeCents,
            payoutStatus: 'queued',
            payoutTransferId: null,
            refundedAt: null,
            refundReason: null,
            refundPoints: null,
            refundTransferReversalId: null,
            createdAt: new Date(),
            // @ts-ignore — present in DB as added columns
            source: 'scholarship',
          }).where(eq(courseCreditUnlocks.id, existing.id)).returning();
          unlock = row;
        } else {
          const ins = await db.execute(sql`
            INSERT INTO course_credit_unlocks
              (buyer_id, creator_id, course_id, points_spent,
               cash_equivalent_cents, creator_payout_cents, platform_fee_cents,
               payout_status, source)
            VALUES (${userId}, ${target.instructor_id}, ${target.id}, ${points},
                    ${cashEquivalentCents}, ${creatorPayoutCents}, ${platformFeeCents},
                    'queued', 'scholarship')
            RETURNING *
          `) as any;
          unlock = (ins.rows ?? ins)[0];
        }
      } catch (err: any) {
        // Roll back the fund deduction if we couldn't record the unlock.
        await db.execute(sql`
          UPDATE scholarship_fund
          SET balance_points = balance_points + ${points},
              total_granted  = total_granted - ${points}
          WHERE id = 1
        `);
        console.error('[scholarship] unlock insert failed — fund rolled back', err);
        return res.status(500).json({ error: 'Could not grant scholarship — please retry' });
      }

      // Record the grant + flip the request to auto_granted.
      const [grant] = await db.insert(scholarshipGrants).values({
        userId,
        courseId: target.id,
        pointsGranted: points,
        unlockId: unlock.id,
        reason: story ? 'survivor_request' : 'auto',
      }).returning();
      // Bump enrollment_count to mirror normal unlock behavior.
      await db.execute(sql`
        UPDATE courses SET enrollment_count = COALESCE(enrollment_count, 0) + 1
        WHERE id = ${target.id}
      `);

      const [reqRow] = await db.insert(scholarshipRequests).values({
        userId,
        story: story ?? null,
        status: 'auto_granted',
        grantId: grant.id,
        reviewedAt: new Date(),
      }).returning();

      // Best-effort Stripe Connect transfer to instructor (85% of fund-paid value).
      try {
        const [instructor] = await db.select({
          connectId: users.stripeConnectAccountId,
          payoutOk: users.creatorPayoutEnabled,
        }).from(users).where(eq(users.id, target.instructor_id)).limit(1);

        if (instructor?.connectId && instructor.payoutOk && creatorPayoutCents > 0) {
          const stripe = getRecoveryStripeClient();
          if (stripe) {
            const transfer = await stripe.transfers.create({
              amount: creatorPayoutCents,
              currency: 'usd',
              destination: instructor.connectId,
              description: `Scholarship-funded unlock: ${target.title}`,
              metadata: {
                source: 'scholarship',
                unlockId: String(unlock.id),
                grantId: String(grant.id),
                courseId: String(target.id),
                survivorId: userId,
              },
            });
            await db.execute(sql`
              UPDATE course_credit_unlocks
              SET payout_status = 'paid', payout_transfer_id = ${transfer.id}
              WHERE id = ${unlock.id}
            `);
          } else {
            await db.execute(sql`
              UPDATE course_credit_unlocks SET payout_status = 'skipped'
              WHERE id = ${unlock.id}
            `);
          }
        } else {
          await db.execute(sql`
            UPDATE course_credit_unlocks SET payout_status = 'skipped'
            WHERE id = ${unlock.id}
          `);
        }
      } catch (xferErr: any) {
        console.error('[scholarship] transfer failed (non-fatal)', xferErr);
        await db.execute(sql`
          UPDATE course_credit_unlocks SET payout_status = 'failed'
          WHERE id = ${unlock.id}
        `);
      }

      res.status(201).json({
        status: 'granted',
        course: { id: target.id, title: target.title, slug: target.slug },
        pointsGranted: points,
        grant,
        request: reqRow,
      });
    } finally {
      // Always release the per-user advisory lock so the next request can proceed.
      await db.execute(sql`SELECT pg_advisory_unlock(hashtextextended(${lockKey}, 0))`).catch(() => null);
    }
    } catch (err: any) {
      console.error('[scholarship] request', err);
      res.status(500).json({ error: 'Could not process scholarship request' });
    }
  });

  // Contribute Power Points (or cash equivalent) to the fund. Authed donors are
  // tracked; anonymous donations require donorEmail for receipts.
  app.post('/api/scholarship/contribute', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req) as string;
    const parsed = contributeSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid contribution', issues: parsed.error.issues });
    }
    const { points, donorName, donorEmail, message, isAnonymous } = parsed.data;

    try {
      // Donor pays with their own Power Points (no Stripe charge here — handled
      // by /recovery/gift-survivor purchase flow which calls this endpoint after
      // points land in their wallet).
      const { deductCredits } = await import('../creditService');
      const result = await deductCredits(
        userId, points, `Scholarship Fund contribution`, 'scholarship_contribution',
        { isAnonymous: !!isAnonymous },
      );
      if (!result.success) {
        return res.status(402).json({
          error: 'Not enough Power Points to contribute',
          shortBy: points - result.newBalance,
        });
      }

      const amountCents = points * POINT_VALUE_CENTS;
      const [contrib] = await db.insert(scholarshipContributions).values({
        donorId: userId,
        donorEmail: donorEmail ?? null,
        donorName: donorName ?? null,
        points,
        amountCents,
        message: message ?? null,
        isAnonymous: !!isAnonymous,
        status: 'completed',
      }).returning();

      // Bump fund counters atomically.
      await db.execute(sql`
        UPDATE scholarship_fund
        SET balance_points = balance_points + ${points},
            total_funded   = total_funded + ${points},
            total_donors   = (
              SELECT COUNT(DISTINCT donor_id) FROM scholarship_contributions
              WHERE status = 'completed' AND donor_id IS NOT NULL
            ),
            updated_at = NOW()
        WHERE id = 1
      `);

      res.status(201).json({ ok: true, contribution: contrib });
    } catch (err: any) {
      console.error('[scholarship] contribute', err);
      res.status(500).json({ error: 'Could not record contribution' });
    }
  });
}
