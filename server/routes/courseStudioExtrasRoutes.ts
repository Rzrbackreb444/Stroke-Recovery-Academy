import type { Express, RequestHandler } from 'express';
import { db } from '../db';
import {
  courses,
  courseCategories,
  courseCategoryTags,
  coursePrerequisites,
  users,
} from '@shared/schema';
import { and, asc, eq, ne } from 'drizzle-orm';
import { requireAdmin } from '../middleware/requireAdmin';
import { getUserId } from "../lib/authUtils";

const DEFAULT_CATEGORIES: Array<{ slug: string; name: string; icon: string; color: string; sortOrder: number }> = [
  { slug: 'physical',           name: 'Physical',            icon: 'Activity',     color: '#C9941A', sortOrder: 10 },
  { slug: 'cognitive',          name: 'Cognitive',           icon: 'Brain',        color: '#C9941A', sortOrder: 20 },
  { slug: 'emotional',          name: 'Emotional',           icon: 'Heart',        color: '#C9941A', sortOrder: 30 },
  { slug: 'spiritual',          name: 'Spiritual',           icon: 'Sparkles',     color: '#C9941A', sortOrder: 40 },
  { slug: 'caregiver',          name: 'Caregiver',           icon: 'Users',        color: '#C9941A', sortOrder: 50 },
  { slug: 'nutrition',          name: 'Nutrition',           icon: 'Apple',        color: '#C9941A', sortOrder: 60 },
  { slug: 'returning-to-life',  name: 'Returning to Life',   icon: 'Compass',      color: '#C9941A', sortOrder: 70 },
  { slug: 'finances',           name: 'Finances',            icon: 'DollarSign',   color: '#C9941A', sortOrder: 80 },
];

export async function seedCourseCategoriesIfEmpty() {
  try {
    const existing = await db.select().from(courseCategories).limit(1);
    if (existing.length > 0) return;
    await db.insert(courseCategories).values(DEFAULT_CATEGORIES);
    console.log('[course-categories] Seeded 8 default categories');
  } catch (e: any) {
    console.warn('[course-categories] Seed skipped:', e?.message || e);
  }
}

function escapeXml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (test.length > maxCharsPerLine) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+\S+$/, '') + '…';
  }
  return lines;
}

function buildCourseOgSvg(opts: {
  title: string;
  subtitle: string;
  instructor: string;
  difficulty: string;
}) {
  const W = 1200, H = 630;
  const titleLines = wrapLines(opts.title || 'Untitled Course', 28, 3);
  const titleStartY = 240 - (titleLines.length - 1) * 40;
  const diff = (opts.difficulty || '').toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0D0D"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C9941A"/>
      <stop offset="100%" stop-color="#E8B547"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="url(#accent)"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="url(#accent)"/>
  <g font-family="'Inter', system-ui, sans-serif">
    <text x="80" y="140" fill="#C9941A" font-size="28" font-weight="700" letter-spacing="6">${escapeXml('STROKE RECOVERY ACADEMY')}</text>
    ${titleLines.map((ln, i) => `<text x="80" y="${titleStartY + i * 80}" fill="#FAF8F3" font-size="68" font-weight="800">${escapeXml(ln)}</text>`).join('\n    ')}
    <text x="80" y="${H - 140}" fill="#FAF8F3" font-size="28" font-weight="400" opacity="0.75">${escapeXml(opts.subtitle || '')}</text>
    <text x="80" y="${H - 80}" fill="#C9941A" font-size="24" font-weight="600">${escapeXml(opts.instructor ? 'Instructor: ' + opts.instructor : '')}</text>
    ${diff ? `<g><rect x="${W - 260}" y="${H - 110}" width="180" height="48" rx="6" fill="#C9941A"/><text x="${W - 170}" y="${H - 78}" fill="#0D0D0D" font-size="22" font-weight="700" text-anchor="middle">${escapeXml(diff)}</text></g>` : ''}
  </g>
</svg>`;
}

export function registerCourseStudioExtrasRoutes(app: Express, isAuthenticated: RequestHandler) {
  // Public: list of categories for the picker
  app.get('/api/course-categories', async (_req, res) => {
    try {
      const rows = await db.select().from(courseCategories).orderBy(asc(courseCategories.sortOrder), asc(courseCategories.name));
      res.json(rows);
    } catch (e) {
      console.error('[course-categories] list error:', e);
      res.status(500).json({ error: 'Failed to load categories' });
    }
  });

  // Admin re-seed (idempotent: inserts only missing slugs)
  app.post('/api/course-categories/seed', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const existing = await db.select().from(courseCategories);
      const haveSlugs = new Set(existing.map(c => c.slug));
      const toInsert = DEFAULT_CATEGORIES.filter(c => !haveSlugs.has(c.slug));
      if (toInsert.length) await db.insert(courseCategories).values(toInsert);
      res.json({ seeded: toInsert.length, total: existing.length + toInsert.length });
    } catch (e) {
      console.error('[course-categories] seed error:', e);
      res.status(500).json({ error: 'Seed failed' });
    }
  });

  // GET taxonomy (tags + prereqs) for an instructor-owned course
  app.get('/api/my-courses/:id/taxonomy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id, 10);
      const [c] = await db.select().from(courses).where(eq(courses.id, id));
      if (!c || c.instructorId !== userId) return res.status(404).json({ error: 'Not found' });
      const tags = await db.select().from(courseCategoryTags).where(eq(courseCategoryTags.courseId, id));
      const prereqs = await db.select().from(coursePrerequisites).where(eq(coursePrerequisites.courseId, id));
      res.json({
        categoryIds: tags.map(t => t.categoryId),
        prerequisiteIds: prereqs.map(p => p.prerequisiteCourseId),
      });
    } catch (e) {
      console.error('[taxonomy] get error:', e);
      res.status(500).json({ error: 'Failed to load taxonomy' });
    }
  });

  // PUT taxonomy — replace-all semantics
  app.put('/api/my-courses/:id/taxonomy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id, 10);
      const [c] = await db.select().from(courses).where(eq(courses.id, id));
      if (!c || c.instructorId !== userId) return res.status(404).json({ error: 'Not found' });

      const catIds: number[] = Array.isArray(req.body?.categoryIds)
        ? Array.from(new Set(req.body.categoryIds.map((x: any) => parseInt(x, 10)).filter(Number.isFinite)))
        : [];
      const prereqIds: number[] = Array.isArray(req.body?.prerequisiteIds)
        ? Array.from(new Set(req.body.prerequisiteIds.map((x: any) => parseInt(x, 10)).filter((n: number) => Number.isFinite(n) && n !== id)))
        : [];

      await db.delete(courseCategoryTags).where(eq(courseCategoryTags.courseId, id));
      if (catIds.length) {
        await db.insert(courseCategoryTags).values(catIds.map(categoryId => ({ courseId: id, categoryId })));
      }
      await db.delete(coursePrerequisites).where(eq(coursePrerequisites.courseId, id));
      if (prereqIds.length) {
        await db.insert(coursePrerequisites).values(prereqIds.map(prerequisiteCourseId => ({ courseId: id, prerequisiteCourseId })));
      }

      res.json({ categoryIds: catIds, prerequisiteIds: prereqIds });
    } catch (e) {
      console.error('[taxonomy] put error:', e);
      res.status(500).json({ error: 'Failed to save taxonomy' });
    }
  });

  // Published courses (for the prereq picker on another course's edit page)
  app.get('/api/courses/published-list', async (req: any, res) => {
    try {
      const excludeId = req.query.exclude ? parseInt(String(req.query.exclude), 10) : null;
      let rows = await db.select({
        id: courses.id, title: courses.title, slug: courses.slug, difficulty: courses.difficulty,
      }).from(courses).where(eq(courses.isPublished, true)).orderBy(asc(courses.title));
      if (excludeId) rows = rows.filter(r => r.id !== excludeId);
      res.json(rows);
    } catch (e) {
      console.error('[published-list] error:', e);
      res.status(500).json({ error: 'Failed to load published courses' });
    }
  });

  // OG image — served dynamically as SVG, always reflects current course metadata
  app.get('/og/course/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [c] = await db.select().from(courses).where(eq(courses.id, id));
      if (!c) return res.status(404).send('Not found');
      let instructorName = '';
      if (c.instructorId) {
        const [u] = await db.select().from(users).where(eq(users.id, c.instructorId));
        if (u) instructorName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '';
      }
      const svg = buildCourseOgSvg({
        title: c.title,
        subtitle: (c.description || '').slice(0, 120),
        instructor: instructorName,
        difficulty: c.difficulty || '',
      });
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(svg);
    } catch (e) {
      console.error('[og/course] error:', e);
      res.status(500).send('OG error');
    }
  });
}
