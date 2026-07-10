import type { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { therapistApplications, therapistProfiles, users } from '@shared/schema';
import { and, desc, eq } from 'drizzle-orm';

// Day → ISO weekday (0=Sun..6=Sat used by JS Date.getDay())
const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
type AvailableHours = Partial<Record<typeof DAY_KEYS[number], string[]>>;

const hoursSchema = z.object({
  hours: z.record(
    z.enum(DAY_KEYS),
    z.array(z.string().regex(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, 'Use HH:MM-HH:MM'))
  ),
  timezone: z.string().min(1).max(64).optional(),
});

function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
  return h * 60 + mn;
}

/** Compute open/next-open from an availableHours JSON map. Times are interpreted in
 *  the viewer's local time — good enough for showing a hint in the DM thread. */
function computeAvailability(hours: AvailableHours | null | undefined, now = new Date()) {
  if (!hours) return { isOpen: false, currentWindow: null, nextWindow: null };
  const todayIdx = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let currentWindow: { day: string; start: string; end: string } | null = null;
  let nextWindow: { day: string; start: string; end: string; minutesUntil: number } | null = null;
  let bestNextDelta = Infinity;

  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayIdx + offset) % 7;
    const dayKey = DAY_KEYS[idx];
    const windows = hours[dayKey] || [];
    for (const w of windows) {
      const [s, e] = w.split('-');
      const sm = parseHHMM(s), em = parseHHMM(e);
      if (sm == null || em == null || em <= sm) continue;
      if (offset === 0 && nowMin >= sm && nowMin < em) {
        currentWindow = { day: dayKey, start: s, end: e };
      }
      const delta = offset === 0 ? sm - nowMin : (offset * 24 * 60) + sm - nowMin;
      if (delta > 0 && delta < bestNextDelta) {
        bestNextDelta = delta;
        nextWindow = { day: dayKey, start: s, end: e, minutesUntil: delta };
      }
    }
  }
  return { isOpen: !!currentWindow, currentWindow, nextWindow };
}

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

  // P3-01 — Therapist availability for a given user (used by DMs UI)
  app.get('/api/therapists/:userId/availability', async (req, res) => {
    try {
      const userId = req.params.userId;
      const [u] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        isVerifiedTherapist: users.isVerifiedTherapist,
        therapistTitle: users.therapistTitle,
      }).from(users).where(eq(users.id, userId)).limit(1);

      if (!u || !u.isVerifiedTherapist) {
        return res.json({ isTherapist: false });
      }

      const [profile] = await db.select({
        availableHours: therapistProfiles.availableHours,
        acceptingPatients: therapistProfiles.acceptingPatients,
      }).from(therapistProfiles).where(eq(therapistProfiles.userId, userId)).limit(1);

      const hours = (profile?.availableHours as AvailableHours | null) || null;
      const computed = computeAvailability(hours);

      res.json({
        isTherapist: true,
        title: u.therapistTitle || 'Therapist',
        acceptingPatients: profile?.acceptingPatients !== false,
        hours: hours || {},
        ...computed,
      });
    } catch (e: any) {
      console.error('[therapists] availability error', e);
      res.status(500).json({ error: 'Failed to load availability' });
    }
  });

  // P3-01 — Therapist edits their own open hours
  app.put('/api/therapists/me/hours', isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub as string;
      const [u] = await db.select({ isVerifiedTherapist: users.isVerifiedTherapist })
        .from(users).where(eq(users.id, uid)).limit(1);
      if (!u?.isVerifiedTherapist) return res.status(403).json({ error: 'Verified therapists only' });

      const parsed = hoursSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid', details: parsed.error.format() });

      // Validate ranges
      for (const [day, wins] of Object.entries(parsed.data.hours)) {
        for (const w of wins) {
          const [s, e] = w.split('-');
          const sm = parseHHMM(s), em = parseHHMM(e);
          if (sm == null || em == null || em <= sm) {
            return res.status(400).json({ error: `Invalid window for ${day}: ${w}` });
          }
        }
      }

      // Upsert profile row
      const [existing] = await db.select({ id: therapistProfiles.id })
        .from(therapistProfiles).where(eq(therapistProfiles.userId, uid)).limit(1);
      if (existing) {
        await db.update(therapistProfiles)
          .set({ availableHours: parsed.data.hours as any, updatedAt: new Date() })
          .where(eq(therapistProfiles.userId, uid));
      } else {
        await db.insert(therapistProfiles).values({
          userId: uid,
          availableHours: parsed.data.hours as any,
        });
      }

      res.json({ ok: true, hours: parsed.data.hours });
    } catch (e: any) {
      console.error('[therapists] hours update error', e);
      res.status(500).json({ error: 'Failed to save hours' });
    }
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
