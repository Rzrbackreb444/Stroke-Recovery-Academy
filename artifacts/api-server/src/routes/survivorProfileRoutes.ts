import type { Express } from 'express';
import { z } from 'zod/v4';
import { db } from '../db';
import { users, powerPointGifts, userPersonas } from '@workspace/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getUserId } from "../lib/authUtils";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'survivor';
}

const slugSchema = z.object({ slug: z.string().min(3).max(40).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/) });

export function registerSurvivorProfileRoutes(app: Express, isAuthenticated: any) {
  // Public survivor profile by slug — used by family/friends to gift Power Points
  app.get('/api/survivors/:slug', async (req, res) => {
    const slug = String(req.params.slug || '').toLowerCase();
    const [u] = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      acceptsPowerPoints: users.acceptsPowerPoints,
      isVerifiedTherapist: users.isVerifiedTherapist,
      therapistTitle: users.therapistTitle,
      publicSlug: users.publicSlug,
    }).from(users).where(eq(users.publicSlug, slug)).limit(1);

    if (!u) return res.status(404).json({ error: 'Not found' });

    const [persona] = await db.select().from(userPersonas).where(eq(userPersonas.userId, u.id)).limit(1);

    const [totals] = await db
      .select({
        totalPoints: sql<number>`COALESCE(SUM(${powerPointGifts.points}),0)`.as('tp'),
        giftCount: sql<number>`COUNT(*)`.as('gc'),
      })
      .from(powerPointGifts)
      .where(and(eq(powerPointGifts.receiverId, u.id), eq(powerPointGifts.status, 'delivered')));

    res.json({
      profile: {
        id: u.id,
        displayName: `${u.firstName || ''} ${u.lastName?.[0] ? u.lastName[0] + '.' : ''}`.trim() || 'Survivor',
        profileImageUrl: u.profileImageUrl,
        slug: u.publicSlug,
        acceptsPowerPoints: u.acceptsPowerPoints,
        isVerifiedTherapist: u.isVerifiedTherapist,
        therapistTitle: u.therapistTitle,
        persona_name: persona?.name ?? null,
        persona_creed: persona?.creed ?? null,
        persona_accent_color: persona?.accentColor ?? null,
        currentStreak: 0,
        totalPoints: Number(totals?.totalPoints ?? 0),
        giftCount: Number(totals?.giftCount ?? 0),
      },
    });
  });

  // Set or update my public slug
  app.post('/api/survivors/me/slug', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req) as string;
      const parsed = slugSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Slug must be 3-40 chars, lowercase, a-z 0-9 - only' });
      const slug = slugify(parsed.data.slug);
      // Reject reserved slugs
      const reserved = ['admin', 'api', 'recovery', 'power-points', 'therapists', 'survivor', 'me', 'settings'];
      if (reserved.includes(slug)) return res.status(400).json({ error: 'That slug is reserved' });

      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.publicSlug, slug)).limit(1);
      if (taken && taken.id !== userId) return res.status(409).json({ error: 'That slug is already taken' });

      await db.update(users).set({ publicSlug: slug }).where(eq(users.id, userId));
      res.json({ ok: true, slug });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed' });
    }
  });

  // Auto-claim a slug on first visit to profile setup
  app.post('/api/survivors/me/auto-slug', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req) as string;
    const [u] = await db.select({ slug: users.publicSlug, first: users.firstName, last: users.lastName })
      .from(users).where(eq(users.id, userId)).limit(1);
    if (u?.slug) return res.json({ slug: u.slug });

    const base = slugify(`${u?.first || 'survivor'}-${u?.last || ''}`);
    let candidate = base;
    for (let i = 0; i < 5; i++) {
      const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.publicSlug, candidate)).limit(1);
      if (!exists) break;
      candidate = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }
    await db.update(users).set({ publicSlug: candidate }).where(eq(users.id, userId));
    res.json({ slug: candidate });
  });
}
