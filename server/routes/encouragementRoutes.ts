import type { Express } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { encouragements, notificationPreferences } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const sendSchema = z.object({
  toUserId: z.string().min(1).max(200),
  loopDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['flame', 'cheer', 'message']).default('flame'),
  message: z.string().max(280).optional(),
});

async function isConnected(fromUserId: string, toUserId: string): Promise<boolean> {
  // Allow if linked via caregiver_links OR shared accountability pod
  const [cg, pod] = await Promise.all([
    db.execute(sql`
      SELECT 1 FROM caregiver_links
      WHERE status = 'active'
        AND ((caregiver_id = ${fromUserId} AND survivor_id = ${toUserId})
          OR (caregiver_id = ${toUserId} AND survivor_id = ${fromUserId}))
      LIMIT 1
    `),
    db.execute(sql`
      SELECT 1 FROM pod_members pm1
      JOIN pod_members pm2 ON pm1.pod_id = pm2.pod_id
      WHERE pm1.user_id = ${fromUserId} AND pm2.user_id = ${toUserId}
      LIMIT 1
    `),
  ]);
  return (cg.rows ?? cg).length > 0 || (pod.rows ?? pod).length > 0;
}

export function registerEncouragementRoutes(app: Express, isAuthenticated: any) {

  // POST /api/recovery/encouragements — send an encouragement
  app.post('/api/recovery/encouragements', isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!fromUserId) return res.status(401).json({ message: 'Unauthorized' });

      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.errors });

      const { toUserId, loopDate, type, message } = parsed.data;

      if (fromUserId === toUserId) return res.status(400).json({ message: 'Cannot encourage yourself' });

      const connected = await isConnected(fromUserId, toUserId);
      if (!connected) return res.status(403).json({ message: 'Not connected to this survivor' });

      // Rate limit: 5 per sender per recipient per day
      const countRows = await db.execute(sql`
        SELECT COUNT(*) AS n FROM encouragements
        WHERE from_user_id = ${fromUserId} AND to_user_id = ${toUserId} AND loop_date = ${loopDate}
      `);
      const count = Number((countRows.rows ?? countRows)[0]?.n ?? 0);
      if (count >= 5) return res.status(429).json({ message: 'Limit reached for today' });

      const inserted = await db.insert(encouragements).values({
        fromUserId,
        toUserId,
        loopDate,
        type,
        message: message ?? null,
      }).returning();

      res.json(inserted[0]);
    } catch (err) {
      console.error('[encouragements] POST', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // GET /api/recovery/encouragements?date=YYYY-MM-DD — encouragements received by the caller
  app.get('/api/recovery/encouragements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const date = String(req.query.date || new Date().toISOString().slice(0, 10));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date' });

      const rows = await db.execute(sql`
        SELECT e.id, e.from_user_id, e.type, e.message, e.created_at,
               u.first_name, u.last_name, u.avatar_url
        FROM encouragements e
        JOIN users u ON u.id = e.from_user_id
        WHERE e.to_user_id = ${userId} AND e.loop_date = ${date}
        ORDER BY e.created_at DESC
        LIMIT 50
      `);

      res.json(rows.rows ?? rows);
    } catch (err) {
      console.error('[encouragements] GET', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // GET /api/recovery/supporter/:survivorId — caregiver read-only summary view
  app.get('/api/recovery/supporter/:survivorId', isAuthenticated, async (req: any, res) => {
    try {
      const viewerId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });

      const survivorId = req.params.survivorId;

      // Must have an active caregiver link
      const linkRows = await db.execute(sql`
        SELECT 1 FROM caregiver_links
        WHERE status = 'active'
          AND caregiver_id = ${viewerId} AND survivor_id = ${survivorId}
        LIMIT 1
      `);
      if ((linkRows.rows ?? linkRows).length === 0) {
        return res.status(404).json({ message: 'No active supporter link found' });
      }

      // Check survivor has enabled sharing
      const prefRows = await db.select().from(notificationPreferences)
        .where(eq(notificationPreferences.userId, survivorId)).limit(1);
      if (!prefRows[0]?.caregiverShareEnabled) {
        return res.status(403).json({ message: 'Survivor has not enabled supporter sharing', sharingDisabled: true });
      }

      // Survivor basic info
      const survivorRows = await db.execute(sql`
        SELECT first_name, last_name, avatar_url FROM users WHERE id = ${survivorId}
      `);
      const survivor = (survivorRows.rows ?? survivorRows)[0] as any;

      // Streak
      const streakRows = await db.execute(sql`
        SELECT current_streak, longest_streak, total_active_days, last_activity_date
        FROM user_streaks WHERE user_id = ${survivorId}
      `);
      const streak = (streakRows.rows ?? streakRows)[0] as any ?? { current_streak: 0, longest_streak: 0 };

      // Today's status
      const today = new Date().toISOString().slice(0, 10);
      const todayRepRows = await db.execute(sql`
        SELECT SUM(reps) AS reps FROM never_zero_logs
        WHERE user_id = ${survivorId} AND DATE(created_at AT TIME ZONE 'UTC') = ${today}
      `);
      const todayReps = Number((todayRepRows.rows ?? todayRepRows)[0]?.reps ?? 0);

      // Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
      const weekRows = await db.execute(sql`
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, SUM(reps) AS reps
        FROM never_zero_logs
        WHERE user_id = ${survivorId} AND DATE(created_at AT TIME ZONE 'UTC') >= ${sevenDaysAgoStr}
        GROUP BY day ORDER BY day ASC
      `);
      const repMap: Record<string, number> = {};
      for (const r of (weekRows.rows ?? weekRows) as any[]) repMap[r.day] = Number(r.reps);
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return { date: key, reps: repMap[key] ?? 0 };
      });

      // My recent encouragements sent to this survivor
      const sentRows = await db.execute(sql`
        SELECT id, type, message, loop_date, created_at FROM encouragements
        WHERE from_user_id = ${viewerId} AND to_user_id = ${survivorId}
        ORDER BY created_at DESC LIMIT 10
      `);

      res.json({
        survivor: {
          id: survivorId,
          firstName: survivor?.first_name,
          lastName: survivor?.last_name,
          avatarUrl: survivor?.avatar_url,
        },
        streak: {
          current: Number(streak.current_streak) || 0,
          longest: Number(streak.longest_streak) || 0,
          totalActive: Number(streak.total_active_days) || 0,
        },
        today: { reps: todayReps, date: today },
        last7Days,
        mySentEncouragements: sentRows.rows ?? sentRows,
      });
    } catch (err) {
      console.error('[encouragements] GET /api/recovery/supporter/:survivorId', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // GET /api/recovery/my-caregivers — list active caregiver links with sharing option
  // (survivor calls this to see who is watching their progress)
  app.get('/api/recovery/my-caregivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const rows = await db.execute(sql`
        SELECT l.id, l.caregiver_id, l.relationship, l.accepted_at,
               u.first_name, u.last_name, u.email, u.avatar_url
        FROM caregiver_links l
        JOIN users u ON u.id = l.caregiver_id
        WHERE l.survivor_id = ${userId} AND l.status = 'active'
        ORDER BY l.accepted_at DESC
      `);

      const prefRows = await db.select().from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId)).limit(1);
      const sharingEnabled = prefRows[0]?.caregiverShareEnabled ?? false;

      res.json({ caregivers: rows.rows ?? rows, sharingEnabled });
    } catch (err) {
      console.error('[encouragements] GET /api/recovery/my-caregivers', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });
}
