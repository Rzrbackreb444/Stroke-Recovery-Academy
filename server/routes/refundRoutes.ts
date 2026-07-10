// P3-06 — 7-day course refund window with <25%-watched gate.
// Refunds Power Points to the buyer and, when possible, reverses the
// Stripe Connect transfer to the instructor. The unique unlock row is
// kept (marked refunded) instead of deleted so the user loses access
// but historical/auditing data survives.
import type { Express } from "express";
import { db } from "../db";
import { sql, and, eq } from "drizzle-orm";
import { courseCreditUnlocks, courses, userCourseProgress } from "@shared/schema";
import { addCredits } from "../creditService";
import { getRecoveryStripeClient } from "../recoveryStripeClient";

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_WATCHED_PERCENT = 25;

async function evaluate(userId: string, courseId: number) {
  const [unlock] = await db.select().from(courseCreditUnlocks).where(and(
    eq(courseCreditUnlocks.buyerId, userId),
    eq(courseCreditUnlocks.courseId, courseId),
  )).limit(1);
  if (!unlock) return { eligible: false as const, reason: "not_purchased" as const };
  if (unlock.refundedAt) return { eligible: false as const, reason: "already_refunded" as const, unlock };

  const ageMs = Date.now() - new Date(unlock.createdAt).getTime();
  const daysLeft = Math.max(0, Math.ceil((REFUND_WINDOW_MS - ageMs) / (24 * 60 * 60 * 1000)));
  if (ageMs > REFUND_WINDOW_MS) {
    return { eligible: false as const, reason: "window_expired" as const, daysLeft: 0, unlock };
  }

  const [prog] = await db.select().from(userCourseProgress).where(and(
    eq(userCourseProgress.userId, userId),
    eq(userCourseProgress.courseId, courseId),
  )).limit(1);
  const watchedPercent = prog?.progressPercentage ?? 0;
  if (watchedPercent >= MAX_WATCHED_PERCENT) {
    return { eligible: false as const, reason: "watched_too_much" as const, watchedPercent, daysLeft, unlock };
  }
  return { eligible: true as const, daysLeft, watchedPercent, unlock };
}

export function registerRefundRoutes(app: Express, isAuthenticated: any) {
  app.get("/api/courses/:id/refund-eligibility", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const courseId = parseInt(req.params.id, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });
      const r = await evaluate(userId, courseId);
      res.json({
        eligible: r.eligible,
        reason: (r as any).reason ?? null,
        daysLeft: (r as any).daysLeft ?? null,
        watchedPercent: (r as any).watchedPercent ?? null,
        windowDays: 7,
        maxWatchedPercent: MAX_WATCHED_PERCENT,
      });
    } catch (e: any) {
      console.error("[refund] eligibility error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/courses/:id/refund", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const courseId = parseInt(req.params.id, 10);
      const reason = String(req.body?.reason ?? "").slice(0, 500) || null;
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });

      const r = await evaluate(userId, courseId);
      if (!r.eligible) {
        return res.status(409).json({
          error: "Not eligible",
          reason: (r as any).reason,
          watchedPercent: (r as any).watchedPercent ?? null,
          daysLeft: (r as any).daysLeft ?? null,
        });
      }
      const unlock = r.unlock!;

      // Atomically claim the refund row — if another request already won,
      // result is empty and we bail without double-refunding.
      const claimed = await db.execute(sql`
        UPDATE course_credit_unlocks
        SET refunded_at = NOW(), refund_reason = ${reason}, refund_points = ${unlock.pointsSpent}
        WHERE id = ${unlock.id} AND refunded_at IS NULL
        RETURNING id
      `);
      const claimedRows = ((claimed as any).rows ?? claimed) as any[];
      if (!claimedRows.length) {
        return res.status(409).json({ error: "Refund already in progress" });
      }

      // Refund Power Points to the buyer. If this fails, undo the
      // refunded_at claim so the user can retry — otherwise they'd be
      // stranded (refund-locked but no credits returned).
      try {
        await addCredits(
          userId, unlock.pointsSpent, "refund",
          `Course refund: course #${courseId}`,
          { courseId, unlockId: unlock.id },
        );
      } catch (creditErr: any) {
        console.error("[refund] addCredits failed — rolling back claim", creditErr);
        await db.execute(sql`
          UPDATE course_credit_unlocks
          SET refunded_at = NULL, refund_reason = NULL, refund_points = NULL
          WHERE id = ${unlock.id}
        `);
        return res.status(500).json({
          error: "Refund failed while crediting your wallet — please try again.",
        });
      }

      // Reverse instructor payout if it actually transferred.
      let reversalId: string | null = null;
      if (unlock.payoutStatus === "paid" && unlock.payoutTransferId) {
        try {
          const stripe = getRecoveryStripeClient();
          const reversal = await stripe.transfers.createReversal(unlock.payoutTransferId, {
            amount: unlock.creatorPayoutCents,
            metadata: { unlockId: String(unlock.id), courseId: String(courseId), type: "course_refund" },
          });
          reversalId = reversal.id;
        } catch (err: any) {
          console.error("[refund] transfer reversal failed", err);
          // Swallow — the buyer's points are already refunded; admin reconciles.
        }
      }

      const newStatus = unlock.payoutStatus === "paid" && reversalId
        ? "reversed"
        : unlock.payoutStatus === "paid"
        ? "reversal_failed"
        : "voided";

      await db.update(courseCreditUnlocks).set({
        payoutStatus: newStatus,
        refundTransferReversalId: reversalId,
      }).where(eq(courseCreditUnlocks.id, unlock.id));

      res.json({
        refunded: true,
        pointsReturned: unlock.pointsSpent,
        payoutStatus: newStatus,
        reversalId,
      });
    } catch (e: any) {
      console.error("[refund] error", e);
      res.status(500).json({ error: e?.message || "Refund failed" });
    }
  });
}
