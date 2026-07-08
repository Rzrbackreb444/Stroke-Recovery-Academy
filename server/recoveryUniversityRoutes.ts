import type { Express } from "express";
import { db } from "./db";
import {
  recoveryUniversityLessons,
  recoveryUniversityQuestions,
  recoveryUniversityLessonProgress,
  recoveryUniversityQuizAttempts,
  recoveryUniversityCertificates,
  users,
} from "@shared/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { RECOVERY_UNIVERSITY_CURRICULUM, type SeedLesson } from "./data/recoveryUniversityCurriculum";
import { loadPersonaFor } from "./personaRoutes";
import { getUserId } from "./lib/authUtils";

const TIER_ORDER = ["explorer", "warrior", "champion", "platinum"] as const;
type Tier = (typeof TIER_ORDER)[number];

function getRecoveryTier(subscriptionTier?: string | null): Tier {
  switch (subscriptionTier) {
    case "enterprise": return "platinum";
    case "pro": return "champion";
    case "creator":
    case "survivor": return "warrior";
    default: return "explorer";
  }
}

function canAccessTier(userTier: Tier, requiredTier: string): boolean {
  const ui = TIER_ORDER.indexOf(userTier);
  const ri = TIER_ORDER.indexOf(requiredTier as Tier);
  return ri >= 0 && ui >= ri;
}

// Map global chapter (1..33) → list of chapters in its part (used for cert eligibility)
function chaptersInPart(partNumber: number): number[] {
  return RECOVERY_UNIVERSITY_CURRICULUM
    .filter((l) => l.partNumber === partNumber)
    .map((l) => l.chapter)
    .sort((a, b) => a - b);
}

function partOfChapter(chapter: number): number | undefined {
  return RECOVERY_UNIVERSITY_CURRICULUM.find((l) => l.chapter === chapter)?.partNumber;
}

// Resolve the lesson for a chapter and enforce tier gating. Returns the lesson
// or sends a 403/404 response (caller must `return` if null is returned).
async function loadLessonOrDeny(
  req: any,
  res: any,
  chapter: number,
): Promise<{ lesson: any; userTier: Tier } | null> {
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > 33) {
    res.status(400).json({ error: "Invalid chapter" });
    return null;
  }
  const userId = getUserId(req);
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const userTier = getRecoveryTier((user as any)?.subscriptionTier);

  const [lesson] = await db
    .select()
    .from(recoveryUniversityLessons)
    .where(eq(recoveryUniversityLessons.chapter, chapter));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return null;
  }
  if (!canAccessTier(userTier, lesson.requiredTier)) {
    res.status(403).json({ error: "tier_locked", requiredTier: lesson.requiredTier, userTier });
    return null;
  }
  return { lesson, userTier };
}

// Strip the correct option/explanation/hint from a question for client safety.
function publicQuestion(q: any) {
  return {
    id: q.id,
    order: q.order,
    prompt: q.prompt,
    options: q.options,
  };
}

// ─── Seed (idempotent) ──────────────────────────────────────────────────────
export async function seedRecoveryUniversityCurriculum(): Promise<{ inserted: number; skipped: number }> {
  const existing = await db.select({ chapter: recoveryUniversityLessons.chapter }).from(recoveryUniversityLessons);
  const existingSet = new Set(existing.map((r) => r.chapter));

  let inserted = 0;
  let skipped = 0;

  for (const lesson of RECOVERY_UNIVERSITY_CURRICULUM) {
    if (existingSet.has(lesson.chapter)) {
      skipped++;
      continue;
    }
    const [row] = await db
      .insert(recoveryUniversityLessons)
      .values({
        chapter: lesson.chapter,
        partNumber: lesson.partNumber,
        title: lesson.title,
        subtitle: lesson.subtitle,
        requiredTier: lesson.requiredTier,
        estimatedMinutes: lesson.estimatedMinutes,
        body: lesson.body,
        keyTakeaways: lesson.keyTakeaways,
        passingScore: lesson.passingScore,
      })
      .returning({ id: recoveryUniversityLessons.id });

    const lessonId = row.id;

    await db.insert(recoveryUniversityQuestions).values(
      lesson.questions.map((q, i) => ({
        lessonId,
        order: i,
        prompt: q.prompt,
        options: q.options,
        correctOptionId: q.correctOptionId,
        hint: q.hint,
        explanation: q.explanation,
      })),
    );
    inserted++;
  }

  return { inserted, skipped };
}

// ─── Routes ─────────────────────────────────────────────────────────────────
export function registerRecoveryUniversityRoutes(app: Express): void {
  // Public: list all lessons (metadata only, no body) — for the syllabus page
  app.get("/api/recovery/university/lessons", async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: recoveryUniversityLessons.id,
          chapter: recoveryUniversityLessons.chapter,
          partNumber: recoveryUniversityLessons.partNumber,
          title: recoveryUniversityLessons.title,
          subtitle: recoveryUniversityLessons.subtitle,
          requiredTier: recoveryUniversityLessons.requiredTier,
          estimatedMinutes: recoveryUniversityLessons.estimatedMinutes,
          passingScore: recoveryUniversityLessons.passingScore,
        })
        .from(recoveryUniversityLessons)
        .orderBy(asc(recoveryUniversityLessons.chapter));
      res.json(rows);
    } catch (err) {
      console.error("[RU] list lessons failed:", err);
      res.status(500).json({ error: "Failed to load lessons" });
    }
  });

  // Get single lesson body (auth required, tier-gated)
  app.get("/api/recovery/university/lesson/:chapter", isAuthenticated, async (req: any, res) => {
    try {
      const chapter = parseInt(req.params.chapter, 10);
      const gate = await loadLessonOrDeny(req, res, chapter);
      if (!gate) return;
      const { lesson, userTier } = gate;
      const userId = getUserId(req);

      const [progress] = await db
        .select()
        .from(recoveryUniversityLessonProgress)
        .where(
          and(
            eq(recoveryUniversityLessonProgress.userId, userId),
            eq(recoveryUniversityLessonProgress.chapter, chapter),
          ),
        );

      res.json({ lesson, progress: progress ?? null, userTier });
    } catch (err) {
      console.error("[RU] get lesson failed:", err);
      res.status(500).json({ error: "Failed to load lesson" });
    }
  });

  // Mark lesson started (idempotent)
  app.post("/api/recovery/university/lesson/:chapter/start", isAuthenticated, async (req: any, res) => {
    try {
      const chapter = parseInt(req.params.chapter, 10);
      const gate = await loadLessonOrDeny(req, res, chapter);
      if (!gate) return;
      const userId = getUserId(req);

      const [existing] = await db
        .select()
        .from(recoveryUniversityLessonProgress)
        .where(
          and(
            eq(recoveryUniversityLessonProgress.userId, userId),
            eq(recoveryUniversityLessonProgress.chapter, chapter),
          ),
        );
      if (existing) return res.json(existing);

      const [row] = await db
        .insert(recoveryUniversityLessonProgress)
        .values({ userId, chapter, status: "in_progress" })
        .returning();
      res.json(row);
    } catch (err) {
      console.error("[RU] start lesson failed:", err);
      res.status(500).json({ error: "Failed to start lesson" });
    }
  });

  // Mark lesson read (does not by itself pass the chapter — quiz pass does that)
  app.post("/api/recovery/university/lesson/:chapter/complete", isAuthenticated, async (req: any, res) => {
    try {
      const chapter = parseInt(req.params.chapter, 10);
      const gate = await loadLessonOrDeny(req, res, chapter);
      if (!gate) return;
      const userId = getUserId(req);
      const now = new Date();

      const [existing] = await db
        .select()
        .from(recoveryUniversityLessonProgress)
        .where(
          and(
            eq(recoveryUniversityLessonProgress.userId, userId),
            eq(recoveryUniversityLessonProgress.chapter, chapter),
          ),
        );

      if (!existing) {
        const [row] = await db
          .insert(recoveryUniversityLessonProgress)
          .values({ userId, chapter, status: "read", readAt: now })
          .returning();
        return res.json(row);
      }

      // Don't downgrade a "passed" status to "read"
      const newStatus = existing.status === "passed" ? "passed" : "read";
      const [row] = await db
        .update(recoveryUniversityLessonProgress)
        .set({ status: newStatus, readAt: existing.readAt ?? now })
        .where(eq(recoveryUniversityLessonProgress.id, existing.id))
        .returning();
      res.json(row);
    } catch (err) {
      console.error("[RU] complete lesson failed:", err);
      res.status(500).json({ error: "Failed to mark complete" });
    }
  });

  // Get quiz questions (without the answer key)
  app.get("/api/recovery/university/quiz/:chapter", isAuthenticated, async (req: any, res) => {
    try {
      const chapter = parseInt(req.params.chapter, 10);
      const gate = await loadLessonOrDeny(req, res, chapter);
      if (!gate) return;
      const { lesson } = gate;

      const questions = await db
        .select()
        .from(recoveryUniversityQuestions)
        .where(eq(recoveryUniversityQuestions.lessonId, lesson.id))
        .orderBy(asc(recoveryUniversityQuestions.order));

      res.json({
        chapter,
        lessonTitle: lesson.title,
        passingScore: lesson.passingScore,
        questions: questions.map(publicQuestion),
      });
    } catch (err) {
      console.error("[RU] get quiz failed:", err);
      res.status(500).json({ error: "Failed to load quiz" });
    }
  });

  // Hint for a single question — never returns the answer
  app.get(
    "/api/recovery/university/quiz/:chapter/hint/:questionId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const chapter = parseInt(req.params.chapter, 10);
        const questionId = parseInt(req.params.questionId, 10);
        if (!Number.isFinite(questionId)) {
          return res.status(400).json({ error: "Invalid question" });
        }
        const gate = await loadLessonOrDeny(req, res, chapter);
        if (!gate) return;
        const { lesson } = gate;

        const [q] = await db
          .select()
          .from(recoveryUniversityQuestions)
          .where(
            and(
              eq(recoveryUniversityQuestions.id, questionId),
              eq(recoveryUniversityQuestions.lessonId, lesson.id),
            ),
          );
        if (!q) return res.status(404).json({ error: "Question not found" });

        res.json({ questionId, hint: q.hint });
      } catch (err) {
        console.error("[RU] get hint failed:", err);
        res.status(500).json({ error: "Failed to load hint" });
      }
    },
  );

  // Submit quiz attempt — server-side grading. Body: { answers: { [questionId]: pickedOptionId }, hintsUsed?: number, durationSec?: number }
  app.post("/api/recovery/university/quiz/:chapter/attempt", isAuthenticated, async (req: any, res) => {
    try {
      const chapter = parseInt(req.params.chapter, 10);
      const { answers = {}, hintsUsed = 0, durationSec } = req.body ?? {};
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ error: "Missing answers" });
      }
      const gate = await loadLessonOrDeny(req, res, chapter);
      if (!gate) return;
      const { lesson } = gate;
      const userId = getUserId(req);

      const questions = await db
        .select()
        .from(recoveryUniversityQuestions)
        .where(eq(recoveryUniversityQuestions.lessonId, lesson.id))
        .orderBy(asc(recoveryUniversityQuestions.order));

      let correctCount = 0;
      const graded: Record<string, { picked: string | null; correct: boolean; correctOptionId: string; explanation: string }> = {};
      for (const q of questions) {
        const picked = (answers as any)[q.id] ?? (answers as any)[String(q.id)] ?? null;
        const isCorrect = picked === q.correctOptionId;
        if (isCorrect) correctCount++;
        graded[String(q.id)] = {
          picked: picked ?? null,
          correct: isCorrect,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
        };
      }

      const total = questions.length || 1;
      const score = Math.round((correctCount / total) * 100);
      const passed = score >= lesson.passingScore;

      // Count prior attempts to compute attemptNumber
      const prior = await db
        .select({ id: recoveryUniversityQuizAttempts.id })
        .from(recoveryUniversityQuizAttempts)
        .where(
          and(
            eq(recoveryUniversityQuizAttempts.userId, userId),
            eq(recoveryUniversityQuizAttempts.chapter, chapter),
          ),
        );
      const attemptNumber = prior.length + 1;

      const [attempt] = await db
        .insert(recoveryUniversityQuizAttempts)
        .values({
          userId,
          chapter,
          score,
          passed,
          totalQuestions: total,
          correctCount,
          hintsUsed: typeof hintsUsed === "number" && hintsUsed >= 0 ? Math.floor(hintsUsed) : 0,
          answers: graded,
          durationSec: typeof durationSec === "number" ? Math.floor(durationSec) : null,
          attemptNumber,
        })
        .returning();

      // Update lesson progress
      const [existing] = await db
        .select()
        .from(recoveryUniversityLessonProgress)
        .where(
          and(
            eq(recoveryUniversityLessonProgress.userId, userId),
            eq(recoveryUniversityLessonProgress.chapter, chapter),
          ),
        );
      const now = new Date();
      const bestScore = Math.max(existing?.bestScore ?? 0, score);
      const willPass = passed || existing?.status === "passed";

      if (existing) {
        await db
          .update(recoveryUniversityLessonProgress)
          .set({
            status: willPass ? "passed" : existing.status === "in_progress" ? "in_progress" : existing.status,
            bestScore,
            attempts: (existing.attempts ?? 0) + 1,
            passedAt: willPass ? existing.passedAt ?? now : existing.passedAt,
            readAt: existing.readAt ?? now,
          })
          .where(eq(recoveryUniversityLessonProgress.id, existing.id));
      } else {
        await db.insert(recoveryUniversityLessonProgress).values({
          userId,
          chapter,
          status: willPass ? "passed" : "in_progress",
          bestScore,
          attempts: 1,
          passedAt: willPass ? now : null,
          readAt: now,
        });
      }

      // Auto-issue part certificate if all chapters in part now pass
      let issuedCertificate: any = null;
      if (passed) {
        const partNumber = lesson.partNumber;
        const required = chaptersInPart(partNumber);
        const passedRows = await db
          .select({ chapter: recoveryUniversityLessonProgress.chapter })
          .from(recoveryUniversityLessonProgress)
          .where(
            and(
              eq(recoveryUniversityLessonProgress.userId, userId),
              eq(recoveryUniversityLessonProgress.status, "passed"),
              inArray(recoveryUniversityLessonProgress.chapter, required),
            ),
          );
        if (passedRows.length >= required.length) {
          const serial = `RU-P${partNumber}-${userId.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
          // Race-safe: unique index on (user_id, part_number) means concurrent
          // requests can't double-insert. The losing request gets nothing back
          // and we re-select the existing row.
          const [inserted] = await db
            .insert(recoveryUniversityCertificates)
            .values({ userId, partNumber, serial })
            .onConflictDoNothing({ target: [recoveryUniversityCertificates.userId, recoveryUniversityCertificates.partNumber] })
            .returning();
          if (inserted) {
            issuedCertificate = inserted;
          } else {
            const [existingCert] = await db
              .select()
              .from(recoveryUniversityCertificates)
              .where(
                and(
                  eq(recoveryUniversityCertificates.userId, userId),
                  eq(recoveryUniversityCertificates.partNumber, partNumber),
                ),
              );
            issuedCertificate = existingCert ?? null;
          }
        }
      }

      res.json({
        attempt,
        score,
        passed,
        passingScore: lesson.passingScore,
        correctCount,
        totalQuestions: total,
        graded,
        issuedCertificate,
      });
    } catch (err) {
      console.error("[RU] submit attempt failed:", err);
      res.status(500).json({ error: "Failed to grade quiz" });
    }
  });

  // Get user's full progress across all chapters + earned certs
  app.get("/api/recovery/university/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const progress = await db
        .select()
        .from(recoveryUniversityLessonProgress)
        .where(eq(recoveryUniversityLessonProgress.userId, userId));
      const certificates = await db
        .select()
        .from(recoveryUniversityCertificates)
        .where(eq(recoveryUniversityCertificates.userId, userId));
      res.json({ progress, certificates });
    } catch (err) {
      console.error("[RU] get progress failed:", err);
      res.status(500).json({ error: "Failed to load progress" });
    }
  });

  // Get a certificate (or check eligibility) for a part
  app.get("/api/recovery/university/certificate/:partNumber", isAuthenticated, async (req: any, res) => {
    try {
      const partNumber = parseInt(req.params.partNumber, 10);
      if (!Number.isFinite(partNumber) || partNumber < 1 || partNumber > 7) {
        return res.status(400).json({ error: "Invalid part" });
      }
      const userId = getUserId(req);
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      const required = chaptersInPart(partNumber);
      const passedRows = await db
        .select({ chapter: recoveryUniversityLessonProgress.chapter })
        .from(recoveryUniversityLessonProgress)
        .where(
          and(
            eq(recoveryUniversityLessonProgress.userId, userId),
            eq(recoveryUniversityLessonProgress.status, "passed"),
            inArray(recoveryUniversityLessonProgress.chapter, required),
          ),
        );

      const passedSet = new Set(passedRows.map((r) => r.chapter));
      const missing = required.filter((c) => !passedSet.has(c));
      const eligible = missing.length === 0;

      let cert = null;
      const [existing] = await db
        .select()
        .from(recoveryUniversityCertificates)
        .where(
          and(
            eq(recoveryUniversityCertificates.userId, userId),
            eq(recoveryUniversityCertificates.partNumber, partNumber),
          ),
        );
      cert = existing ?? null;

      // If eligible but no cert exists yet, issue one now (covers cases where the
      // last passing attempt happened before the auto-issue logic existed).
      if (eligible && !cert) {
        const serial = `RU-P${partNumber}-${userId.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
        const [created] = await db
          .insert(recoveryUniversityCertificates)
          .values({ userId, partNumber, serial })
          .onConflictDoNothing({ target: [recoveryUniversityCertificates.userId, recoveryUniversityCertificates.partNumber] })
          .returning();
        if (created) {
          cert = created;
        } else {
          const [existing2] = await db
            .select()
            .from(recoveryUniversityCertificates)
            .where(
              and(
                eq(recoveryUniversityCertificates.userId, userId),
                eq(recoveryUniversityCertificates.partNumber, partNumber),
              ),
            );
          cert = existing2 ?? null;
        }
      }

      // Prefer persona name if the survivor has forged one — the certificate
      // belongs to the alter-ego, not the legal name, by design.
      const persona = await loadPersonaFor(userId);
      const recipientName =
        persona?.name?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
        user?.email ||
        "Survivor";

      res.json({
        partNumber,
        eligible,
        missingChapters: missing,
        certificate: cert,
        recipientName,
      });
    } catch (err) {
      console.error("[RU] get certificate failed:", err);
      res.status(500).json({ error: "Failed to load certificate" });
    }
  });

  // Boot-time seed (fire-and-forget, logs result)
  seedRecoveryUniversityCurriculum()
    .then(({ inserted, skipped }) => {
      if (inserted > 0) {
        console.log(`[RU] Seeded ${inserted} new lessons (${skipped} already present).`);
      }
    })
    .catch((err) => console.error("[RU] Seed failed on boot:", err));
}
