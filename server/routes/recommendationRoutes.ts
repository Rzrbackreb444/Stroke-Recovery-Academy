// P3-04 "My Path" — next-course recommender.
// Heuristic: rank published courses the user hasn't started by category overlap
// with what they've completed/started, then by enrollment_count as popularity
// signal. Falls back to most-popular published courses for cold start.
import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { getUserId } from "../lib/authUtils";

export function registerRecommendationRoutes(app: Express, isAuthenticated: any) {
  app.get("/api/recommendations/next-courses", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req)!;
      const parsed = parseInt(String(req.query.limit ?? "4"), 10);
      const limit = Math.max(1, Math.min(Number.isFinite(parsed) && parsed > 0 ? parsed : 4, 10));

      const rows = await db.execute(sql`
        WITH user_courses AS (
          SELECT course_id FROM user_course_progress WHERE user_id = ${uid}
        ),
        user_cats AS (
          SELECT cct.category_id, COUNT(*)::int AS hits
          FROM course_category_tags cct
          JOIN user_courses uc ON uc.course_id = cct.course_id
          GROUP BY cct.category_id
        ),
        candidates AS (
          SELECT
            c.id, c.title, c.slug, c.description, c.thumbnail_url,
            c.difficulty, c.estimated_hours, c.enrollment_count,
            COALESCE(SUM(uc.hits), 0)::int AS overlap_score,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE uc.hits > 0), NULL) AS matched_categories
          FROM courses c
          LEFT JOIN course_category_tags cct ON cct.course_id = c.id
          LEFT JOIN user_cats uc ON uc.category_id = cct.category_id
          LEFT JOIN course_categories cat ON cat.id = cct.category_id
          WHERE c.is_published = TRUE
            AND c.id NOT IN (SELECT course_id FROM user_courses)
          GROUP BY c.id
        )
        SELECT * FROM candidates
        ORDER BY overlap_score DESC, enrollment_count DESC, id DESC
        LIMIT ${limit}
      `);
      const list = (((rows as any).rows ?? rows) as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description,
        thumbnailUrl: r.thumbnail_url,
        difficulty: r.difficulty,
        estimatedHours: r.estimated_hours,
        enrollmentCount: r.enrollment_count,
        matchedCategories: r.matched_categories ?? [],
        reason: buildReason(r),
      }));
      res.json(list);
    } catch (e: any) {
      console.error("[recs] next-courses error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });
}

function buildReason(r: any): string {
  const cats: string[] = r.matched_categories ?? [];
  if (cats.length > 0) {
    const top = cats.slice(0, 2).join(" & ");
    return `Builds on your ${top} work`;
  }
  if ((r.enrollment_count ?? 0) > 50) return "Most-loved by survivors";
  if (r.difficulty === "survival") return "A gentle starting point";
  return "Recommended next step";
}
