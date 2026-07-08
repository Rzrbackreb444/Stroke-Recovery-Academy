// P2-04 Course reviews + ratings with verified-completion badge
import type { Express } from "express";
import { db } from "../db";
import {
  sraCourseRatings, sraCourseRatingHelpful, courses, users, userCourseProgress,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUserId } from "../lib/authUtils";

async function isVerifiedCompletion(userId: string, courseId: number): Promise<boolean> {
  const r = await db.select({ completedAt: userCourseProgress.completedAt })
    .from(userCourseProgress)
    .where(and(eq(userCourseProgress.userId, userId), eq(userCourseProgress.courseId, courseId)))
    .limit(1);
  return !!r[0]?.completedAt;
}

export function registerReviewRoutes(app: Express, isAuthenticated: any) {
  // List reviews + aggregate
  app.get("/api/courses/:courseId/reviews", async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });

      const c = (await db.select().from(courses).where(eq(courses.id, courseId)).limit(1))[0];
      if (!c) return res.status(404).json({ error: "Course not found" });

      const reviews = await db.select({
        id: sraCourseRatings.id,
        userId: sraCourseRatings.userId,
        rating: sraCourseRatings.rating,
        title: sraCourseRatings.title,
        body: sraCourseRatings.body,
        isVerifiedCompletion: sraCourseRatings.isVerifiedCompletion,
        helpfulCount: sraCourseRatings.helpfulCount,
        createdAt: sraCourseRatings.createdAt,
        authorName: users.firstName,
        authorAvatar: users.avatarUrl,
      }).from(sraCourseRatings)
        .leftJoin(users, eq(users.id, sraCourseRatings.userId))
        .where(eq(sraCourseRatings.courseId, courseId))
        .orderBy(desc(sraCourseRatings.helpfulCount), desc(sraCourseRatings.createdAt))
        .limit(200);

      const agg = await db.execute(sql`
        SELECT
          COUNT(*)::int AS count,
          COALESCE(AVG(rating), 0)::float AS avg,
          COUNT(*) FILTER (WHERE rating = 5)::int AS r5,
          COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
          COUNT(*) FILTER (WHERE rating = 3)::int AS r3,
          COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
          COUNT(*) FILTER (WHERE rating = 1)::int AS r1
        FROM sra_course_ratings
        WHERE course_id = ${courseId}
      `);
      const a: any = (agg as any).rows?.[0] || (Array.isArray(agg) ? agg[0] : {});
      const aggregate = {
        count: Number(a.count || 0),
        avg: Number(a.avg || 0),
        distribution: { 5: Number(a.r5||0), 4: Number(a.r4||0), 3: Number(a.r3||0), 2: Number(a.r2||0), 1: Number(a.r1||0) },
      };

      const uid = getUserId(req);
      let myReviewId: number | null = null;
      let myHelpful: Record<number, boolean> = {};
      let myCompletion = false;
      if (uid) {
        const mine = reviews.find((r) => r.userId === uid);
        myReviewId = mine?.id ?? null;
        const helpful = await db.select({ reviewId: sraCourseRatingHelpful.reviewId })
          .from(sraCourseRatingHelpful)
          .where(eq(sraCourseRatingHelpful.userId, uid));
        myHelpful = Object.fromEntries(helpful.map((h) => [h.reviewId, true]));
        myCompletion = await isVerifiedCompletion(uid, courseId);
      }

      res.json({
        reviews: reviews.map((r) => ({ ...r, helpfulByMe: !!myHelpful[r.id] })),
        aggregate,
        myReviewId,
        myCompletion,
      });
    } catch (e: any) {
      console.error("[reviews] list error", e);
      res.status(500).json({ error: e?.message || "Failed to load reviews" });
    }
  });

  // Create / update own review (one per user per course)
  app.post("/api/courses/:courseId/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const courseId = parseInt(req.params.courseId, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });

      const c = (await db.select().from(courses).where(eq(courses.id, courseId)).limit(1))[0];
      if (!c) return res.status(404).json({ error: "Course not found" });

      const ratingNum = Math.round(Number(req.body?.rating));
      if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: "rating must be 1-5" });
      }
      const body = String(req.body?.body || "").trim();
      if (body.length < 10) return res.status(400).json({ error: "body must be at least 10 characters" });
      if (body.length > 4000) return res.status(400).json({ error: "body too long" });
      const title = String(req.body?.title || "").trim().slice(0, 160) || null;

      const verified = await isVerifiedCompletion(uid, courseId);

      // Upsert by (course_id, user_id) — uniqueness enforced server-side via unique index
      const existing = await db.select().from(sraCourseRatings)
        .where(and(eq(sraCourseRatings.courseId, courseId), eq(sraCourseRatings.userId, uid))).limit(1);

      let row;
      if (existing.length) {
        [row] = await db.update(sraCourseRatings).set({
          rating: ratingNum, title, body, isVerifiedCompletion: verified,
        }).where(eq(sraCourseRatings.id, existing[0].id)).returning();
      } else {
        [row] = await db.insert(sraCourseRatings).values({
          courseId, userId: uid, rating: ratingNum, title, body, isVerifiedCompletion: verified,
        }).returning();
      }
      res.json(row);
    } catch (e: any) {
      console.error("[reviews] write error", e);
      res.status(500).json({ error: e?.message || "Failed to save review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const del = await db.delete(sraCourseRatings)
        .where(and(eq(sraCourseRatings.id, id), eq(sraCourseRatings.userId, uid))).returning();
      if (!del.length) return res.status(404).json({ error: "Review not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to delete review" });
    }
  });

  // Toggle helpful — race-safe via transaction + idempotent insert
  app.post("/api/reviews/:id/helpful", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

      const r = (await db.select().from(sraCourseRatings).where(eq(sraCourseRatings.id, id)).limit(1))[0];
      if (!r) return res.status(404).json({ error: "Review not found" });
      if (r.userId === uid) return res.status(400).json({ error: "Cannot mark your own review helpful" });

      let helpfulByMe = false;
      let helpfulCount = r.helpfulCount;
      await db.transaction(async (tx) => {
        const existing = await tx.select().from(sraCourseRatingHelpful)
          .where(and(eq(sraCourseRatingHelpful.reviewId, id), eq(sraCourseRatingHelpful.userId, uid))).limit(1);
        if (existing.length) {
          await tx.delete(sraCourseRatingHelpful)
            .where(and(eq(sraCourseRatingHelpful.reviewId, id), eq(sraCourseRatingHelpful.userId, uid)));
          const [u] = await tx.update(sraCourseRatings)
            .set({ helpfulCount: sql`GREATEST(${sraCourseRatings.helpfulCount} - 1, 0)` })
            .where(eq(sraCourseRatings.id, id)).returning();
          helpfulCount = u.helpfulCount;
          helpfulByMe = false;
        } else {
          await tx.insert(sraCourseRatingHelpful).values({ reviewId: id, userId: uid });
          const [u] = await tx.update(sraCourseRatings)
            .set({ helpfulCount: sql`${sraCourseRatings.helpfulCount} + 1` })
            .where(eq(sraCourseRatings.id, id)).returning();
          helpfulCount = u.helpfulCount;
          helpfulByMe = true;
        }
      });
      res.json({ ok: true, helpfulByMe, helpfulCount });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to toggle helpful" });
    }
  });
}
