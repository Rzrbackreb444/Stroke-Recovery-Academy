// P2-05 Instructor analytics — students, completion %, earnings, reviews
import type { Express } from "express";
import { db } from "../db";
import { courses, userCourseProgress, sraCourseRatings, creatorEarnings } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { getUserId } from "../lib/authUtils";

export function registerInstructorAnalyticsRoutes(app: Express, isAuthenticated: any) {
  app.get("/api/instructor/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);

      const myCourses = await db.select({
        id: courses.id, slug: courses.slug, title: courses.title,
        status: courses.status, priceCredits: courses.priceCredits,
      }).from(courses).where(eq(courses.instructorId, uid));

      if (myCourses.length === 0) {
        return res.json({
          summary: {
            courses: 0, students: 0, completions: 0, completionRate: 0,
            avgRating: 0, reviewCount: 0,
            earningsCents: 0, pendingCents: 0, paidCents: 0,
          },
          courses: [],
        });
      }

      const courseIds = myCourses.map((c) => c.id);

      // Per-course progress aggregates
      const progressRows = await db.execute(sql`
        SELECT
          course_id::int AS course_id,
          COUNT(*)::int AS enrolled,
          COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed,
          COALESCE(AVG(progress_percentage), 0)::float AS avg_progress
        FROM user_course_progress
        WHERE course_id = ANY(${sql`ARRAY[${sql.join(courseIds.map((id) => sql`${id}`), sql`, `)}]::int[]`})
        GROUP BY course_id
      `);
      const progressByCourse: Record<number, { enrolled: number; completed: number; avgProgress: number }> = {};
      for (const r of (progressRows as any).rows ?? (progressRows as any)) {
        progressByCourse[r.course_id] = {
          enrolled: Number(r.enrolled || 0),
          completed: Number(r.completed || 0),
          avgProgress: Number(r.avg_progress || 0),
        };
      }

      // Per-course rating aggregates — return SUM(rating) so we can compute
      // an exact weighted average across all courses without float drift.
      const ratingRows = await db.execute(sql`
        SELECT
          course_id::int AS course_id,
          COUNT(*)::int AS review_count,
          COALESCE(SUM(rating), 0)::int AS rating_sum
        FROM sra_course_ratings
        WHERE course_id = ANY(${sql`ARRAY[${sql.join(courseIds.map((id) => sql`${id}`), sql`, `)}]::int[]`})
        GROUP BY course_id
      `);
      const ratingByCourse: Record<number, { count: number; sum: number }> = {};
      for (const r of (ratingRows as any).rows ?? (ratingRows as any)) {
        ratingByCourse[r.course_id] = {
          count: Number(r.review_count || 0),
          sum: Number(r.rating_sum || 0),
        };
      }

      // Earnings (course product type) — group by product_id (matches course id)
      const earningsRows = await db.execute(sql`
        SELECT
          product_id::int AS course_id,
          COALESCE(SUM(creator_share), 0)::int AS total_cents,
          COALESCE(SUM(CASE WHEN status IN ('pending','available') THEN creator_share ELSE 0 END), 0)::int AS pending_cents,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN creator_share ELSE 0 END), 0)::int AS paid_cents
        FROM creator_earnings
        WHERE creator_id = ${uid}
          AND product_type = 'course'
          AND product_id = ANY(${sql`ARRAY[${sql.join(courseIds.map((id) => sql`${id}`), sql`, `)}]::int[]`})
        GROUP BY product_id
      `);
      const earningsByCourse: Record<number, { total: number; pending: number; paid: number }> = {};
      for (const r of (earningsRows as any).rows ?? (earningsRows as any)) {
        earningsByCourse[r.course_id] = {
          total: Number(r.total_cents || 0),
          pending: Number(r.pending_cents || 0),
          paid: Number(r.paid_cents || 0),
        };
      }

      // Build per-course rows + summary
      let enrollments = 0, completions = 0, reviewCount = 0, ratingSum = 0;
      let earningsCents = 0, pendingCents = 0, paidCents = 0;
      const rows = myCourses.map((c) => {
        const p = progressByCourse[c.id] || { enrolled: 0, completed: 0, avgProgress: 0 };
        const rt = ratingByCourse[c.id] || { count: 0, sum: 0 };
        const e = earningsByCourse[c.id] || { total: 0, pending: 0, paid: 0 };
        enrollments += p.enrolled;
        completions += p.completed;
        reviewCount += rt.count;
        ratingSum += rt.sum;
        earningsCents += e.total;
        pendingCents += e.pending;
        paidCents += e.paid;
        return {
          id: c.id, slug: c.slug, title: c.title, status: c.status,
          priceCredits: c.priceCredits,
          enrolled: p.enrolled, completed: p.completed,
          completionRate: p.enrolled ? Math.round((p.completed / p.enrolled) * 100) : 0,
          avgProgress: Math.round(p.avgProgress),
          avgRating: rt.count ? rt.sum / rt.count : 0, reviewCount: rt.count,
          earningsCents: e.total, pendingCents: e.pending, paidCents: e.paid,
        };
      });

      res.json({
        summary: {
          courses: myCourses.length,
          enrollments, completions,
          completionRate: enrollments ? Math.round((completions / enrollments) * 100) : 0,
          avgRating: reviewCount ? ratingSum / reviewCount : 0,
          reviewCount,
          earningsCents, pendingCents, paidCents,
        },
        courses: rows,
      });
    } catch (e: any) {
      console.error("[instructor analytics] error", e);
      res.status(500).json({ error: e?.message || "Failed to load analytics" });
    }
  });

  // Most recent reviews across instructor's courses
  app.get("/api/instructor/analytics/recent-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const rows = await db.execute(sql`
        SELECT r.id, r.course_id, r.rating, r.title, r.body, r.is_verified_completion,
               r.created_at, c.title AS course_title
        FROM sra_course_ratings r
        JOIN courses c ON c.id = r.course_id
        WHERE c.instructor_id = ${uid}
        ORDER BY r.created_at DESC
        LIMIT 25
      `);
      res.json((rows as any).rows ?? rows);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to load recent reviews" });
    }
  });
}
