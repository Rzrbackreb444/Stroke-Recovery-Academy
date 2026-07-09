// Quiz attempt grading, voice-answer transcription, spaced-repetition review queue.
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import { db } from '../db';
import { courseBuilderQuestions, courseBuilderQuizzes, quizAttempts, quizReviewQueue } from '@workspace/db';
import { and, eq, lte, sql } from 'drizzle-orm';
import { gradeAnswer, fuzzySimilarity, sm2Update } from '../services/quizGrading';
import { getUserId } from "../lib/authUtils";

export function registerQuizRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const audioStorage = multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, uploadsDir),
    filename: (_r, file, cb) => cb(null, 'voice-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + (path.extname(file.originalname) || '.webm')),
  });
  const audioUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 15 * 1024 * 1024 },
  });

  async function upsertReview(userId: string, questionId: number, correct: boolean) {
    const [existing] = await db.select().from(quizReviewQueue)
      .where(and(eq(quizReviewQueue.userId, userId), eq(quizReviewQueue.questionId, questionId))).limit(1);
    const quality = correct ? 5 : 2;
    const prev = existing
      ? { intervalDays: existing.intervalDays, ease: existing.ease, repetitions: existing.repetitions }
      : { intervalDays: 1, ease: 250, repetitions: 0 };
    const next = sm2Update(prev, quality);
    const nextReviewAt = new Date(Date.now() + next.intervalDays * 24 * 60 * 60 * 1000);
    if (existing) {
      await db.update(quizReviewQueue).set({
        intervalDays: next.intervalDays,
        ease: next.ease,
        repetitions: next.repetitions,
        lapses: correct ? existing.lapses : existing.lapses + 1,
        nextReviewAt,
        lastAnsweredAt: new Date(),
        lastCorrect: correct,
        retired: correct && next.repetitions >= 5,
      }).where(eq(quizReviewQueue.id, existing.id));
    } else {
      await db.insert(quizReviewQueue).values({
        userId, questionId,
        intervalDays: next.intervalDays,
        ease: next.ease,
        repetitions: next.repetitions,
        lapses: correct ? 0 : 1,
        nextReviewAt,
        lastAnsweredAt: new Date(),
        lastCorrect: correct,
      });
    }
  }

  // GET /api/quizzes/:id — load quiz + questions for runner
  app.get('/api/quizzes/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const [quiz] = await db.select().from(courseBuilderQuizzes).where(eq(courseBuilderQuizzes.id, id)).limit(1);
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    const questions = await db.select().from(courseBuilderQuestions)
      .where(eq(courseBuilderQuestions.quizId, id))
      .orderBy(courseBuilderQuestions.order);
    // Strip correctAnswer/explanation for the runner — server grades.
    const safeQuestions = questions.map(q => ({
      id: q.id, quizId: q.quizId, questionType: q.questionType, question: q.question,
      options: Array.isArray(q.options) ? (q.options as any[]).map((o: any) => ({ id: o.id, text: o.text })) : q.options,
      points: q.points, order: q.order,
    }));
    res.json({ quiz, questions: safeQuestions });
  });

  // POST /api/quizzes/:id/attempt — grade all answers, enqueue wrong to review
  app.post('/api/quizzes/:id/attempt', isAuthenticated, async (req: any, res: Response) => {
    try {
      const quizId = parseInt(req.params.id, 10);
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const answers = (req.body?.answers || {}) as Record<string, any>;
      const timeTaken = Number(req.body?.timeTaken) || 0;

      const [quiz] = await db.select().from(courseBuilderQuizzes).where(eq(courseBuilderQuizzes.id, quizId)).limit(1);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
      const questions = await db.select().from(courseBuilderQuestions).where(eq(courseBuilderQuestions.quizId, quizId));

      const graded = questions.map(q => {
        const result = gradeAnswer(q, answers[String(q.id)]);
        return { questionId: q.id, correct: result.correct, score: result.score, explanation: q.explanation || null, correctAnswer: q.correctAnswer || null };
      });

      const earnedPoints = graded.reduce((s, g, i) => s + g.score * (questions[i].points || 1), 0);
      const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0) || 1;
      const scorePct = Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePct >= (quiz.passingScore || 70);

      // Queue incorrect questions for spaced review
      await Promise.all(graded.map(g => upsertReview(userId, g.questionId, g.correct)));

      // Previous attempt count
      const prevAttempts = await db.select({ c: sql<number>`count(*)` }).from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)));
      const attemptNumber = Number(prevAttempts[0]?.c || 0) + 1;

      await db.insert(quizAttempts).values({
        userId, quizId, score: scorePct, passed, answers, timeTaken, attemptNumber,
      });

      res.json({
        score: scorePct, passed, attemptNumber,
        passingScore: quiz.passingScore,
        results: graded,
      });
    } catch (err: any) {
      console.error('[quiz-attempt] error', err);
      res.status(500).json({ error: err?.message || 'Grading failed' });
    }
  });

  // POST /api/quiz-questions/:id/voice-answer — Whisper transcribe + fuzzy match
  app.post('/api/quiz-questions/:id/voice-answer', isAuthenticated, audioUpload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No audio uploaded' });
      if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Speech transcription not configured' });
      const qid = parseInt(req.params.id, 10);
      const [q] = await db.select().from(courseBuilderQuestions).where(eq(courseBuilderQuestions.id, qid)).limit(1);
      // All four `req.file.path` reads below are multer-generated paths
      // confined to `uploadsDir` via `audioStorage`'s server-side filename
      // (`voice-{Date.now()}-{random}{ext}`). No user-controlled component.
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
      if (!q) { fs.promises.unlink(req.file.path).catch(() => {}); return res.status(404).json({ error: 'Question not found' }); }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const r = await openai.audio.transcriptions.create({
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
        file: fs.createReadStream(req.file.path),
        model: 'whisper-1',
        response_format: 'text',
      } as any);
      const transcript = typeof r === 'string' ? r : (r as any).text || '';

      // Clean up audio file (no need to keep)
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
      fs.promises.unlink(req.file.path).catch(() => {});

      const similarity = fuzzySimilarity(transcript, q.correctAnswer || '');
      const correct = similarity >= 0.78;
      res.json({ transcript, similarity, correct, expected: q.correctAnswer });
    } catch (err: any) {
      console.error('[voice-answer] error', err);
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
      if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: err?.message || 'Transcription failed' });
    }
  });

  // GET /api/review-queue — today's due questions for the user
  app.get('/api/review-queue', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const due = await db.select().from(quizReviewQueue)
      .where(and(eq(quizReviewQueue.userId, userId), eq(quizReviewQueue.retired, false), lte(quizReviewQueue.nextReviewAt, new Date())))
      .orderBy(quizReviewQueue.nextReviewAt)
      .limit(limit);
    if (due.length === 0) return res.json({ items: [] });
    const ids = due.map(d => d.questionId);
    const qs = await db.select().from(courseBuilderQuestions)
      .where(sql`${courseBuilderQuestions.id} = ANY(${ids})`);
    const byId = new Map(qs.map(q => [q.id, q]));
    const items = due.map(d => {
      const q = byId.get(d.questionId);
      if (!q) return null;
      return {
        reviewId: d.id,
        nextReviewAt: d.nextReviewAt,
        intervalDays: d.intervalDays,
        question: {
          id: q.id, quizId: q.quizId, questionType: q.questionType, question: q.question,
          options: Array.isArray(q.options) ? (q.options as any[]).map((o: any) => ({ id: o.id, text: o.text })) : q.options,
          points: q.points,
        },
      };
    }).filter(Boolean);
    res.json({ items });
  });

  // POST /api/review-queue/:reviewId/answer — grade one spaced-review answer
  app.post('/api/review-queue/:reviewId/answer', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const reviewId = parseInt(req.params.reviewId, 10);
    const [row] = await db.select().from(quizReviewQueue).where(eq(quizReviewQueue.id, reviewId)).limit(1);
    if (!row || row.userId !== userId) return res.status(404).json({ error: 'Not found' });
    const [q] = await db.select().from(courseBuilderQuestions).where(eq(courseBuilderQuestions.id, row.questionId)).limit(1);
    if (!q) return res.status(404).json({ error: 'Question missing' });

    const result = gradeAnswer(q, req.body?.answer);
    await upsertReview(userId, row.questionId, result.correct);
    res.json({ correct: result.correct, score: result.score, explanation: q.explanation, correctAnswer: q.correctAnswer });
  });
}
