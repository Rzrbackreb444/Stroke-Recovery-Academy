import type { Express } from 'express';
import { db } from '../db';
import { lessonVideoTranslations, lessonVideos } from '@shared/schema';
import { sql, eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getUserId } from "../lib/authUtils";

// Locales we expose to the i18n switcher. Subset of the full 20-lang catalog;
// translation jobs are only allowed for these to keep cost bounded.
const TRANSLATABLE_LOCALES = [
  'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'tr', 'ru',
  'zh', 'ja', 'ko', 'hi', 'ar', 'he', 'sv', 'no', 'da', 'fi',
] as const;
type Locale = (typeof TRANSLATABLE_LOCALES)[number];

const LANG_NAME: Record<Locale, string> = {
  es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', nl: 'Dutch', pl: 'Polish', tr: 'Turkish', ru: 'Russian',
  zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean',
  hi: 'Hindi', ar: 'Arabic', he: 'Hebrew',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish',
};

const requestSchema = z.object({
  locale: z.enum(TRANSLATABLE_LOCALES),
  force: z.boolean().optional(),
});

// In-memory translation rate buckets per user (10/hour). Resets on restart;
// good enough as a coarse cost-cap with the enrollment gate doing the heavy lifting.
const translateRate = new Map<string, number[]>();

export function registerTranslationRoutes(app: Express, isAuthenticated: any) {
  // Public: list locales available + which already have a translation cached
  // for this video. Used by the lesson player language picker.
  app.get('/api/lessons/:videoId/translations', async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId, 10);
      if (!Number.isFinite(videoId)) return res.status(400).json({ error: 'Invalid video id' });
      const rows = await db.select().from(lessonVideoTranslations)
        .where(eq(lessonVideoTranslations.videoId, videoId));
      const have = new Set(rows.map(r => r.locale));
      res.json({
        available: TRANSLATABLE_LOCALES.map(loc => ({
          locale: loc,
          name: LANG_NAME[loc],
          ready: have.has(loc),
        })),
        translations: rows,
      });
    } catch (err: any) {
      console.error('[translations] list', err);
      res.status(500).json({ error: 'Failed to load translations' });
    }
  });

  // Public: fetch a single locale's transcript + VTT URL.
  app.get('/api/lessons/:videoId/translations/:locale', async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId, 10);
      const locale = req.params.locale as Locale;
      if (!Number.isFinite(videoId)) return res.status(400).json({ error: 'Invalid video id' });
      if (!TRANSLATABLE_LOCALES.includes(locale)) {
        return res.status(400).json({ error: 'Unsupported locale' });
      }
      const [row] = await db.select().from(lessonVideoTranslations).where(and(
        eq(lessonVideoTranslations.videoId, videoId),
        eq(lessonVideoTranslations.locale, locale),
      )).limit(1);
      if (!row) return res.status(404).json({ error: 'Not translated yet' });
      res.json(row);
    } catch (err: any) {
      console.error('[translations] get', err);
      res.status(500).json({ error: 'Failed to load translation' });
    }
  });

  // Authed: trigger a translation job for one locale. Cached unless force=true.
  // Translates BOTH the plaintext transcript and the VTT cue text via Gemini.
  app.post('/api/lessons/:videoId/translate', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req) as string;
    const videoId = parseInt(req.params.videoId, 10);
    if (!Number.isFinite(videoId)) return res.status(400).json({ error: 'Invalid video id' });
    const parsed = requestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues });
    }
    const { locale, force } = parsed.data;

    // Per-user rate limit — bound Gemini cost. Max 10 fresh translations per hour.
    const now = Date.now();
    const bucket = (translateRate.get(userId) ?? []).filter(t => now - t < 60 * 60 * 1000);
    if (bucket.length >= 10) {
      return res.status(429).json({ error: 'Too many translations this hour. Try again later.' });
    }

    try {
      const [video] = await db.select().from(lessonVideos)
        .where(eq(lessonVideos.id, videoId)).limit(1);
      if (!video) return res.status(404).json({ error: 'Video not found' });

      // Enrollment / instructor gate — only people with course access can spend
      // the platform's translation budget on a video.
      const accessRow = await db.execute(sql`
        SELECT 1 FROM lessons le
        JOIN courses c ON c.id = le.course_id
        WHERE le.id = (SELECT lesson_id FROM lesson_videos WHERE id = ${videoId})
          AND (
            c.instructor_id = ${userId}
            OR EXISTS (SELECT 1 FROM course_credit_unlocks u
                       WHERE u.buyer_id = ${userId} AND u.course_id = c.id AND u.refunded_at IS NULL)
            OR EXISTS (SELECT 1 FROM users u WHERE u.id = ${userId} AND u.is_admin = true)
          )
        LIMIT 1
      `) as any;
      if (!((accessRow.rows ?? accessRow).length)) {
        return res.status(403).json({ error: 'Unlock the course to request translations.' });
      }
      if (!video.transcriptText && !video.captionVttUrl) {
        return res.status(409).json({ error: 'Source transcript not ready yet' });
      }

      if (!force) {
        const [existing] = await db.select().from(lessonVideoTranslations).where(and(
          eq(lessonVideoTranslations.videoId, videoId),
          eq(lessonVideoTranslations.locale, locale),
        )).limit(1);
        if (existing) return res.json({ cached: true, translation: existing });
      }

      // Fetch source VTT contents — restricted to our own /uploads/ tree to
      // prevent SSRF if a future code path lets an instructor set captionVttUrl
      // to an arbitrary URL (e.g. http://169.254.169.254/...).
      let sourceVtt: string | null = null;
      if (video.captionVttUrl && video.captionVttUrl.startsWith('/uploads/')) {
        try {
          const path = await import('path');
          const fs = await import('fs/promises');
          const uploadsRoot = path.resolve(process.cwd(), 'uploads');
          const abs = path.resolve(uploadsRoot, video.captionVttUrl.replace('/uploads/', ''));
          // Path-traversal guard: resolved path must stay under uploadsRoot.
          if (abs.startsWith(uploadsRoot + path.sep)) {
            sourceVtt = await fs.readFile(abs, 'utf8');
          }
        } catch (e) { /* non-fatal */ }
      }

      const langName = LANG_NAME[locale];
      const transcriptOut = video.transcriptText
        ? await translateWithGemini(video.transcriptText, langName, 'transcript')
        : null;
      const vttOut = sourceVtt
        ? await translateVttWithGemini(sourceVtt, langName)
        : null;

      // Persist VTT to disk so the <track> tag can serve it.
      let vttUrl: string | null = null;
      if (vttOut) {
        try {
          const path = await import('path');
          const fs = await import('fs/promises');
          const dir = path.resolve(process.cwd(), 'uploads', 'captions');
          await fs.mkdir(dir, { recursive: true });
          const fname = `lesson-${videoId}-${locale}-${Date.now()}.vtt`;
          await fs.writeFile(path.join(dir, fname), vttOut, 'utf8');
          vttUrl = `/uploads/captions/${fname}`;
        } catch (e) { console.error('[translations] vtt write failed', e); }
      }

      // Upsert the row.
      const wordCount = (transcriptOut || '').split(/\s+/).filter(Boolean).length;
      await db.execute(sql`
        INSERT INTO lesson_video_translations
          (video_id, locale, transcript_text, caption_vtt_url, translated_by, word_count)
        VALUES (${videoId}, ${locale}, ${transcriptOut}, ${vttUrl}, 'gemini', ${wordCount})
        ON CONFLICT (video_id, locale)
        DO UPDATE SET transcript_text = EXCLUDED.transcript_text,
                      caption_vtt_url = EXCLUDED.caption_vtt_url,
                      translated_by   = EXCLUDED.translated_by,
                      word_count      = EXCLUDED.word_count,
                      created_at      = NOW()
      `);

      const [saved] = await db.select().from(lessonVideoTranslations).where(and(
        eq(lessonVideoTranslations.videoId, videoId),
        eq(lessonVideoTranslations.locale, locale),
      )).limit(1);

      bucket.push(now);
      translateRate.set(userId, bucket);

      res.status(201).json({ cached: false, translation: saved });
    } catch (err: any) {
      console.error('[translations] translate', err);
      res.status(500).json({ error: 'Translation failed', detail: err?.message });
    }
  });
}

async function translateWithGemini(text: string, targetLanguage: string, kind: 'transcript' | 'vtt'): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = kind === 'transcript'
    ? `You are a professional medical-content translator working on a stroke-recovery education platform. Translate the following English transcript into ${targetLanguage}. Preserve all paragraph breaks. Keep medical terms accurate. Output ONLY the translated text — no preamble.\n\n---\n${text}`
    : `Translate the following text into ${targetLanguage}. Output ONLY the translated text.\n\n${text}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return (result.text ?? '').trim();
}

// VTT cues come as: timestamp line then the cue text. We translate cue text only,
// preserving timestamps and structure so playback sync isn't broken.
async function translateVttWithGemini(vtt: string, targetLanguage: string): Promise<string> {
  const lines = vtt.split(/\r?\n/);
  const out: string[] = [];
  let buffer: string[] = [];

  const flush = async () => {
    if (!buffer.length) return;
    const joined = buffer.join('\n');
    const translated = await translateWithGemini(joined, targetLanguage, 'vtt');
    out.push(translated);
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw;
    // Header / timestamp / blank lines flow through verbatim.
    const isTimestamp = /-->/.test(line);
    const isHeaderOrCueId = /^WEBVTT/i.test(line) || /^\d+$/.test(line.trim()) || /^NOTE\b/i.test(line);
    if (isTimestamp || isHeaderOrCueId || line.trim() === '') {
      await flush();
      out.push(line);
    } else {
      buffer.push(line);
    }
  }
  await flush();
  return out.join('\n');
}
