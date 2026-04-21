import type { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { therapistApplications, users } from '@shared/schema';
import { and, desc, eq } from 'drizzle-orm';

const applySchema = z.object({
  fullName: z.string().min(2).max(120),
  title: z.string().min(2).max(40),
  licenseNumber: z.string().min(2).max(60),
  licenseState: z.string().min(2).max(40),
  yearsExperience: z.number().int().nonnegative().max(80).optional(),
  specialties: z.array(z.string()).max(12).optional(),
  bio: z.string().max(2000).optional(),
  portfolioUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
});

async function isAdmin(userId: string): Promise<boolean> {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.role === 'admin' || u?.role === 'owner';
}

export function registerTherapistRoutes(app: Express, isAuthenticated: any) {
  // Apply to be a verified therapist
  app.post('/api/therapists/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid', details: parsed.error.format() });

      // No duplicate pending applications
      const [pending] = await db.select().from(therapistApplications)
        .where(and(eq(therapistApplications.userId, userId), eq(therapistApplications.status, 'pending')))
        .limit(1);
      if (pending) return res.status(409).json({ error: 'You already have a pending application' });

      const [created] = await db.insert(therapistApplications).values({
        userId,
        ...parsed.data,
      }).returning();
      res.json({ application: created });
    } catch (e: any) {
      console.error('[therapists] apply error', e);
      res.status(500).json({ error: e?.message || 'Application failed' });
    }
  });

  // My latest application status
  app.get('/api/therapists/my-application', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const [app] = await db.select().from(therapistApplications)
      .where(eq(therapistApplications.userId, userId))
      .orderBy(desc(therapistApplications.createdAt))
      .limit(1);
    res.json({ application: app || null });
  });

  // Admin: list applications
  app.get('/api/admin/therapist-applications', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    if (!(await isAdmin(userId))) return res.status(403).json({ error: 'Admin only' });
    const status = (req.query.status as string) || 'pending';
    const apps = await db.select({
      app: therapistApplications,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
      .from(therapistApplications)
      .leftJoin(users, eq(users.id, therapistApplications.userId))
      .where(eq(therapistApplications.status, status))
      .orderBy(desc(therapistApplications.createdAt))
      .limit(100);
    res.json({ applications: apps });
  });

  // Admin: approve
  app.post('/api/admin/therapist-applications/:id/approve', isAuthenticated, async (req: any, res) => {
    const reviewerId = req.user.claims.sub as string;
    if (!(await isAdmin(reviewerId))) return res.status(403).json({ error: 'Admin only' });
    const id = parseInt(req.params.id, 10);
    const notes = (req.body?.notes as string) || null;

    const [appRow] = await db.select().from(therapistApplications).where(eq(therapistApplications.id, id)).limit(1);
    if (!appRow) return res.status(404).json({ error: 'Not found' });

    await db.update(therapistApplications).set({
      status: 'approved', reviewerId, reviewerNotes: notes, reviewedAt: new Date(),
    }).where(eq(therapistApplications.id, id));

    await db.update(users).set({
      isVerifiedTherapist: true,
      therapistTitle: appRow.title,
      therapistCredentials: `${appRow.licenseNumber} (${appRow.licenseState})`,
      therapistBio: appRow.bio,
      therapistVerifiedAt: new Date(),
    }).where(eq(users.id, appRow.userId));

    res.json({ ok: true });
  });

  // Admin: reject
  app.post('/api/admin/therapist-applications/:id/reject', isAuthenticated, async (req: any, res) => {
    const reviewerId = req.user.claims.sub as string;
    if (!(await isAdmin(reviewerId))) return res.status(403).json({ error: 'Admin only' });
    const id = parseInt(req.params.id, 10);
    const notes = (req.body?.notes as string) || null;
    await db.update(therapistApplications).set({
      status: 'rejected', reviewerId, reviewerNotes: notes, reviewedAt: new Date(),
    }).where(eq(therapistApplications.id, id));
    res.json({ ok: true });
  });

  // Public list of verified therapists — only expose first name + last initial
  app.get('/api/therapists/verified', async (_req, res) => {
    const rows = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      title: users.therapistTitle,
      bio: users.therapistBio,
      verifiedAt: users.therapistVerifiedAt,
      publicSlug: users.publicSlug,
    })
      .from(users)
      .where(eq(users.isVerifiedTherapist, true))
      .orderBy(desc(users.therapistVerifiedAt))
      .limit(100);
    const therapists = rows.map((r) => ({
      id: r.id,
      displayName: `${r.firstName || ''} ${r.lastName?.[0] ? r.lastName[0] + '.' : ''}`.trim() || 'Therapist',
      profileImageUrl: r.profileImageUrl,
      title: r.title,
      bio: r.bio,
      verifiedAt: r.verifiedAt,
      publicSlug: r.publicSlug,
    }));
    res.json({ therapists });
  });
}
