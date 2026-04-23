import type { Express } from 'express';
import { db } from '../db';
import { courseCreditUnlocks, courses, users } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { deductCredits, addCredits } from '../creditService';
import { getRecoveryStripeClient } from '../recoveryStripeClient';

// Each Power Point is worth $0.04 in cash equivalent on payouts.
// (Spark = 100 pts = $5 retail → therapist payout 100 * 0.04 * 0.85 ≈ $3.40)
const POINT_VALUE_CENTS = 4;
const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

export function registerCourseUnlockRoutes(app: Express, isAuthenticated: any) {
  // Get the credit price + unlock status for a course
  app.get('/api/courses/:id/unlock-info', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const courseId = parseInt(req.params.id, 10);
    if (!Number.isFinite(courseId)) return res.status(400).json({ error: 'Invalid course id' });

    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const pointsRequired = computePointsForCourse(course.estimatedHours ?? 1, course.difficulty);

    const [unlock] = await db.select().from(courseCreditUnlocks).where(and(
      eq(courseCreditUnlocks.buyerId, userId),
      eq(courseCreditUnlocks.courseId, courseId),
    )).limit(1);

    // Refunded unlocks revoke access — caller must purchase again.
    const isActive = !!unlock && !unlock.refundedAt;
    res.json({
      pointsRequired,
      unlocked: isActive,
      unlockedAt: isActive ? unlock!.createdAt : null,
      refundedAt: unlock?.refundedAt || null,
    });
  });

  // Spend credits to unlock a course; queue 85% Connect payout to instructor
  app.post('/api/courses/:id/unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const courseId = parseInt(req.params.id, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: 'Invalid course id' });

      const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      if (!course.instructorId) return res.status(400).json({ error: 'Course has no instructor' });
      if (course.instructorId === userId) return res.status(400).json({ error: 'You created this course' });

      // Already unlocked? (Refunded rows count as not-unlocked, but the
      // unique index on (buyer, course) means we must reuse that row
      // rather than insert a fresh one — flip its refund fields back.)
      const [existing] = await db.select().from(courseCreditUnlocks).where(and(
        eq(courseCreditUnlocks.buyerId, userId),
        eq(courseCreditUnlocks.courseId, courseId),
      )).limit(1);
      if (existing && !existing.refundedAt) {
        return res.json({ unlocked: true, unlock: existing });
      }
      if (existing && existing.refundedAt) {
        // Re-unlock: clear refund flags after charging again below.
        // Charge first, then update — handled in the normal flow below
        // by skipping the insert and updating the existing row.
      }

      const points = computePointsForCourse(course.estimatedHours ?? 1, course.difficulty);
      const cashEquivalentCents = points * POINT_VALUE_CENTS;
      const creatorPayoutCents = Math.floor((cashEquivalentCents * CREATOR_SHARE_PERCENT) / 100);
      const platformFeeCents = cashEquivalentCents - creatorPayoutCents;

      // Deduct credits atomically (returns success/false)
      const result = await deductCredits(
        userId,
        points,
        `Unlocked course: ${course.title}`,
        'course_unlock',
        { courseId },
      );
      if (!result.success) {
        return res.status(402).json({ error: 'Insufficient Power Points', shortBy: points - result.newBalance });
      }

      // Record the unlock — if this fails, refund the points.
      // If a refunded row already exists, reuse it (the unique index
      // on (buyer, course) blocks a fresh INSERT) by clearing refund state.
      let unlock;
      try {
        if (existing && existing.refundedAt) {
          const [row] = await db.update(courseCreditUnlocks).set({
            creatorId: course.instructorId,
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
          }).where(eq(courseCreditUnlocks.id, existing.id)).returning();
          unlock = row;
        } else {
          const [row] = await db.insert(courseCreditUnlocks).values({
            buyerId: userId,
            creatorId: course.instructorId,
            courseId,
            pointsSpent: points,
            cashEquivalentCents,
            creatorPayoutCents,
            platformFeeCents,
          }).returning();
          unlock = row;
        }
      } catch (insertErr: any) {
        console.error('[courseUnlock] insert failed — refunding', insertErr);
        await addCredits(userId, points, 'refund', `Refund: course unlock failed (${course.title})`, { courseId });
        return res.status(500).json({ error: 'Unlock failed — your points were refunded.' });
      }

      // Try Stripe Connect transfer (best-effort; mark queued/skipped/failed accordingly)
      const [instructor] = await db.select({
        connectId: users.stripeConnectAccountId,
        payoutEnabled: users.creatorPayoutEnabled,
      }).from(users).where(eq(users.id, course.instructorId)).limit(1);

      let payoutStatus = 'queued';
      let transferId: string | null = null;
      try {
        if (instructor?.connectId && instructor?.payoutEnabled) {
          const stripe = getRecoveryStripeClient();
          const transfer = await stripe.transfers.create({
            amount: creatorPayoutCents,
            currency: 'usd',
            destination: instructor.connectId,
            metadata: { courseId: String(courseId), unlockId: String(unlock.id), type: 'course_credit_unlock' },
          });
          transferId = transfer.id;
          payoutStatus = 'paid';
        } else {
          payoutStatus = 'skipped'; // instructor not Connect-onboarded; admin will manual-pay
        }
      } catch (err: any) {
        console.error('[courseUnlock] transfer failed', err);
        payoutStatus = 'failed';
      }

      await db.update(courseCreditUnlocks)
        .set({ payoutStatus, payoutTransferId: transferId })
        .where(eq(courseCreditUnlocks.id, unlock.id));

      // P4-02: mirror this unlock to every linked survivor (caregiver seat).
      let mirroredTo = 0;
      try {
        const { mirrorOneUnlock } = await import('./caregiverRoutes');
        mirroredTo = await mirrorOneUnlock(userId, courseId);
      } catch (mErr) {
        console.error('[courseUnlock] mirror failed (non-fatal)', mErr);
      }

      res.json({
        unlocked: true,
        unlock: { ...unlock, payoutStatus, payoutTransferId: transferId },
        newBalance: result.newBalance,
        mirroredToLinkedSurvivors: mirroredTo,
      });
    } catch (e: any) {
      console.error('[courseUnlock] error', e);
      res.status(500).json({ error: e?.message || 'Unlock failed' });
    }
  });

  // List my unlocks
  app.get('/api/me/course-unlocks', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const list = await db.select({
      unlock: courseCreditUnlocks,
      course: courses,
    })
      .from(courseCreditUnlocks)
      .leftJoin(courses, eq(courses.id, courseCreditUnlocks.courseId))
      .where(eq(courseCreditUnlocks.buyerId, userId));
    res.json({ unlocks: list });
  });
}

function computePointsForCourse(hours: number, difficulty: string): number {
  // Base price scales with effort, with a difficulty multiplier.
  const base = Math.max(1, hours) * 100; // ~$4 per hour at 4¢/point
  const mult = difficulty === 'advanced' ? 1.5 : difficulty === 'intermediate' ? 1.2 : 1.0;
  return Math.round(base * mult);
}
