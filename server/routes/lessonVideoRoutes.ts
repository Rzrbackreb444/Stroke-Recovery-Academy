// Lesson video upload + transcription. Uses local uploads dir (cheapest/free path).
// When Phase-3 scale kicks in, swap /uploads/* for an HLS-transcoded URL written
// into lessonVideos.hlsUrl — the player already prefers hlsUrl when present.
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { lessonVideos, courseLessons, courseModules, courses } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { transcribeVideo, writeVttSidecar } from '../videoTranscription';

// Returns { ok, ownedByUser } — ownedByUser is true only if the lesson's course belongs to userId.
async function lessonOwnedByUser(lessonId: number, userId: string): Promise<boolean> {
  const rows = await db.select({ instructorId: courses.instructorId })
    .from(courseLessons)
    .innerJoin(courseModules, eq(courseModules.id, courseLessons.moduleId))
    .innerJoin(courses, eq(courses.id, courseModules.courseId))
    .where(eq(courseLessons.id, lessonId))
    .limit(1);
  return !!rows[0] && rows[0].instructorId === userId;
}

export function registerLessonVideoRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'lesson-' + unique + path.extname(file.originalname));
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // hard cap; Whisper itself caps at 25MB
    fileFilter: (_req, file, cb) => {
      const ok = /mp4|mov|webm|m4a|mp3|wav|ogg/i.test(path.extname(file.originalname)) || /video|audio/.test(file.mimetype);
      cb(ok ? null : new Error('Only video/audio files allowed') as any, ok);
    },
  });

  // POST /api/lessons/:id/video — upload + queue transcription
  app.post('/api/lessons/:id/video', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id, 10);
      if (!Number.isFinite(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const userId = req.user?.claims?.sub;
      if (!userId || !(await lessonOwnedByUser(lessonId, userId))) return res.status(403).json({ error: 'Not your lesson' });

      const url = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;

      // Upsert a processing row immediately so the UI can poll
      const [row] = await db.insert(lessonVideos).values({
        lessonId,
        url,
        sizeBytes: req.file.size,
        transcriptionStatus: 'processing',
      }).onConflictDoUpdate({
        target: lessonVideos.lessonId,
        set: { url, sizeBytes: req.file.size, transcriptionStatus: 'processing', transcriptionError: null, updatedAt: new Date() },
      }).returning();

      res.status(202).json({ video: row, message: 'Uploaded — transcribing…' });

      // Transcribe async (fire-and-forget, results land via GET polling)
      (async () => {
        try {
          const { vtt, transcript, duration, segments } = await transcribeVideo(filePath);
          const vttPath = await writeVttSidecar(filePath, vtt);
          const vttUrl = `/uploads/${path.basename(vttPath)}`;
          await db.update(lessonVideos).set({
            captionVttUrl: vttUrl,
            transcriptText: transcript,
            duration,
            chapters: segments.slice(0, 12).map((s, i) => ({ start: Math.round(s.start), title: `Chapter ${i + 1}` })),
            transcriptionStatus: 'ready',
            updatedAt: new Date(),
          }).where(eq(lessonVideos.lessonId, lessonId));
        } catch (err: any) {
          console.error('[lesson-video] transcription failed', err);
          await db.update(lessonVideos).set({
            transcriptionStatus: 'failed',
            transcriptionError: err?.message || 'Transcription failed',
            updatedAt: new Date(),
          }).where(eq(lessonVideos.lessonId, lessonId));
        }
      })();
    } catch (err: any) {
      console.error('[lesson-video] upload error', err);
      res.status(500).json({ error: err?.message || 'Upload failed' });
    }
  });

  // GET /api/lessons/:id/video — metadata (for player + polling)
  app.get('/api/lessons/:id/video', async (req: Request, res: Response) => {
    const lessonId = parseInt(req.params.id, 10);
    if (!Number.isFinite(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });
    const [row] = await db.select().from(lessonVideos).where(eq(lessonVideos.lessonId, lessonId)).limit(1);
    if (!row) return res.status(404).json({ error: 'No video' });
    res.json({ video: row });
  });

  // PATCH /api/lessons/:id/video/chapters — manual chapter edits
  app.patch('/api/lessons/:id/video/chapters', isAuthenticated, async (req: any, res: Response) => {
    const lessonId = parseInt(req.params.id, 10);
    const chapters = Array.isArray(req.body?.chapters) ? req.body.chapters : null;
    if (!chapters) return res.status(400).json({ error: 'chapters array required' });
    const userId = req.user?.claims?.sub;
    if (!userId || !(await lessonOwnedByUser(lessonId, userId))) return res.status(403).json({ error: 'Not your lesson' });
    const clean = chapters
      .filter((c: any) => typeof c?.start === 'number' && typeof c?.title === 'string')
      .map((c: any) => ({ start: Math.max(0, Math.round(c.start)), title: String(c.title).slice(0, 120) }));
    const [row] = await db.update(lessonVideos).set({ chapters: clean, updatedAt: new Date() })
      .where(eq(lessonVideos.lessonId, lessonId)).returning();
    if (!row) return res.status(404).json({ error: 'No video' });
    res.json({ video: row });
  });
}
