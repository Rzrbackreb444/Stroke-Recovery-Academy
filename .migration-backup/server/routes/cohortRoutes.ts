// P2-03 Course cohorts — same-start-date peer threads
import type { Express } from "express";
import multer from "multer";
import path from "path";
import { db } from "../db";
import { courseCohorts, cohortMembers, cohortPosts, courses, users } from "@shared/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { transcribeVideo } from "../videoTranscription";
import { getUserId } from "../lib/authUtils";

const CRISIS = [
  /\bkill (my|her|his|them)self\b/i, /\bsuicid(e|al)\b/i,
  /\bend (it|my life|it all)\b/i, /\b(i (want|am going) to die)\b/i,
  /\bno reason to (live|go on)\b/i, /\bself[- ]harm\b/i, /\bhurt(ing)? myself\b/i,
];
const detectCrisis = (t: string) => !!t && CRISIS.some((rx) => rx.test(t));

// Next Monday (UTC) — anchor cohorts to a weekly start cadence.
function nextMondayUTC(from = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

// Auto-create the next active cohort if none exists with a future start date
async function ensureUpcomingCohort(courseId: number): Promise<number> {
  const now = new Date();
  const existing = await db.select().from(courseCohorts)
    .where(and(eq(courseCohorts.courseId, courseId), gte(courseCohorts.endDate, now)))
    .orderBy(desc(courseCohorts.startDate))
    .limit(1);
  if (existing.length) return existing[0].id;

  const start = nextMondayUTC();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const name = `Cohort starting ${start.toISOString().slice(0, 10)}`;
  // Race-safe: unique(course_id, start_date) lets concurrent callers converge.
  await db.execute(sql`
    INSERT INTO course_cohorts (course_id, name, start_date, end_date, is_active)
    VALUES (${courseId}, ${name}, ${start}, ${end}, TRUE)
    ON CONFLICT (course_id, start_date) DO NOTHING
  `);
  const [c] = await db.select().from(courseCohorts)
    .where(and(eq(courseCohorts.courseId, courseId), eq(courseCohorts.startDate, start)))
    .limit(1);
  return c.id;
}

export function registerCohortRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const upload = multer({
    // Static literal subdir — no user input reaches the path.
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
    dest: path.join(uploadsDir, "cohort-voice"),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  // List cohorts for a course (auto-creates one if none upcoming)
  app.get("/api/courses/:courseId/cohorts", async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });

      const c = (await db.select().from(courses).where(eq(courses.id, courseId)).limit(1))[0];
      if (!c) return res.status(404).json({ error: "Course not found" });

      await ensureUpcomingCohort(courseId);

      const rows = await db.select().from(courseCohorts)
        .where(eq(courseCohorts.courseId, courseId))
        .orderBy(desc(courseCohorts.startDate))
        .limit(20);

      const uid = getUserId(req);
      let mine: Record<number, boolean> = {};
      if (uid && rows.length) {
        const m = await db.select().from(cohortMembers).where(eq(cohortMembers.userId, uid));
        mine = Object.fromEntries(m.map((x) => [x.cohortId, true]));
      }
      res.json(rows.map((r) => ({ ...r, isMember: !!mine[r.id] })));
    } catch (e: any) {
      console.error("[cohorts] list error", e);
      res.status(500).json({ error: e?.message || "Failed to list cohorts" });
    }
  });

  // Cohort detail + members
  app.get("/api/cohorts/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const c = (await db.select().from(courseCohorts).where(eq(courseCohorts.id, id)).limit(1))[0];
      if (!c) return res.status(404).json({ error: "Cohort not found" });

      const uid = getUserId(req);
      let isMember = false;
      if (uid) {
        const m = await db.select().from(cohortMembers)
          .where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, uid))).limit(1);
        isMember = m.length > 0;
      }

      const members = await db.select({
        userId: cohortMembers.userId,
        joinedAt: cohortMembers.joinedAt,
        firstName: users.firstName,
        avatarUrl: users.avatarUrl,
      }).from(cohortMembers)
        .leftJoin(users, eq(users.id, cohortMembers.userId))
        .where(eq(cohortMembers.cohortId, id))
        .orderBy(desc(cohortMembers.joinedAt))
        .limit(50);

      res.json({ ...c, isMember, members });
    } catch (e: any) {
      console.error("[cohorts] detail error", e);
      res.status(500).json({ error: e?.message || "Failed to load cohort" });
    }
  });

  // Join — only members can post. Joining is open to any authenticated user.
  app.post("/api/cohorts/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const c = (await db.select().from(courseCohorts).where(eq(courseCohorts.id, id)).limit(1))[0];
      if (!c) return res.status(404).json({ error: "Cohort not found" });

      await db.transaction(async (tx) => {
        const existing = await tx.select().from(cohortMembers)
          .where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, uid))).limit(1);
        if (existing.length) return;
        await tx.insert(cohortMembers).values({ cohortId: id, userId: uid });
        await tx.update(courseCohorts).set({ memberCount: sql`${courseCohorts.memberCount} + 1` })
          .where(eq(courseCohorts.id, id));
      });
      res.json({ ok: true, isMember: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to join cohort" });
    }
  });

  app.post("/api/cohorts/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      await db.transaction(async (tx) => {
        const del = await tx.delete(cohortMembers)
          .where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, uid))).returning();
        if (del.length) {
          await tx.update(courseCohorts)
            .set({ memberCount: sql`GREATEST(${courseCohorts.memberCount} - 1, 0)` })
            .where(eq(courseCohorts.id, id));
        }
      });
      res.json({ ok: true, isMember: false });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to leave cohort" });
    }
  });

  // Feed
  app.get("/api/cohorts/:id/posts", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const posts = await db.select({
        id: cohortPosts.id,
        cohortId: cohortPosts.cohortId,
        authorId: cohortPosts.authorId,
        content: cohortPosts.content,
        audioUrl: cohortPosts.audioUrl,
        crisisFlag: cohortPosts.crisisFlag,
        createdAt: cohortPosts.createdAt,
        authorName: users.firstName,
        authorAvatar: users.avatarUrl,
      }).from(cohortPosts)
        .leftJoin(users, eq(users.id, cohortPosts.authorId))
        .where(eq(cohortPosts.cohortId, id))
        .orderBy(desc(cohortPosts.createdAt))
        .limit(100);
      res.json(posts);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to load posts" });
    }
  });

  app.post("/api/cohorts/:id/posts", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const m = await db.select().from(cohortMembers)
        .where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, uid))).limit(1);
      if (!m.length) return res.status(403).json({ error: "Join the cohort to post" });
      const content = String(req.body?.content || "").trim();
      if (!content) return res.status(400).json({ error: "content required" });
      const crisisFlag = detectCrisis(content);
      const [post] = await db.insert(cohortPosts).values({
        cohortId: id, authorId: uid, content, crisisFlag,
      }).returning();
      res.json({ ...post, crisis: crisisFlag });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to post" });
    }
  });

  app.post("/api/cohorts/:id/posts/voice", isAuthenticated, upload.single("audio"), async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      if (!req.file) return res.status(400).json({ error: "audio file required" });
      const m = await db.select().from(cohortMembers)
        .where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, uid))).limit(1);
      if (!m.length) return res.status(403).json({ error: "Join the cohort to post" });

      const audioUrl = `/uploads/cohort-voice/${req.file.filename}`;
      let transcript = "";
      let transcriptionFailed = false;
      try {
        const r = await transcribeVideo(req.file.path);
        transcript = (r as any)?.text || (r as any)?.transcript || "";
      } catch (e) {
        transcriptionFailed = true;
        console.warn("[cohorts] transcription failed, flagging for review", e);
      }
      const crisisKeywordHit = detectCrisis(transcript);
      const needsReview = transcriptionFailed || !transcript.trim();
      // Mirror groupRoutes pattern: DB stores combined flag for moderator queue;
      // response separates the user-facing crisis signal from review-only flag.
      const crisisFlag = crisisKeywordHit || needsReview;
      const content = transcript.trim()
        ? transcript
        : transcriptionFailed
          ? "(voice message — transcription unavailable, pending moderator review)"
          : "(voice message)";
      const [post] = await db.insert(cohortPosts).values({
        cohortId: id, authorId: uid, content, audioUrl, crisisFlag,
      }).returning();
      res.json({ ...post, crisis: crisisKeywordHit, needsReview });
    } catch (e: any) {
      console.error("[cohorts] voice post error", e);
      res.status(500).json({ error: e?.message || "Failed to post voice" });
    }
  });
}
