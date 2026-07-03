import type { Express } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { notificationPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';

const notifPrefSchema = z.object({
  checkinReminderHour: z.number().int().min(0).max(23).optional(),
  streakBreakEmail: z.boolean().optional(),
  weeklyRepGoal: z.number().int().min(1).max(200).optional(),
  weeklyDigestEnabled: z.boolean().optional(),
  caregiverShareEnabled: z.boolean().optional(),
});

export function registerProgressRoutes(app: Express, isAuthenticated: any) {

  // GET /api/recovery/progress — full history for the Progress Hub
  app.get('/api/recovery/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const isoNinetyDaysAgo = ninetyDaysAgo.toISOString();

      // Streak data
      const streakRows = await db.execute(sql`
        SELECT current_streak, longest_streak, total_active_days, last_activity_date
        FROM user_streaks WHERE user_id = ${userId}
      `);
      const streak = (streakRows.rows ?? streakRows)[0] as any ?? {
        current_streak: 0, longest_streak: 0, total_active_days: 0, last_activity_date: null,
      };

      // Never-zero logs — reps per calendar day (last 90 days)
      const repRows = await db.execute(sql`
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, SUM(reps) AS reps
        FROM never_zero_logs
        WHERE user_id = ${userId} AND created_at >= ${isoNinetyDaysAgo}
        GROUP BY day ORDER BY day ASC
      `);

      // Daily checkins — mood, energy, counts (last 90 days)
      const checkinRows = await db.execute(sql`
        SELECT
          DATE(checkin_date AT TIME ZONE 'UTC') AS day,
          AVG(mood_score) AS mood,
          AVG(energy_score) AS energy,
          1 AS checked_in
        FROM daily_checkins
        WHERE user_id = ${userId} AND checkin_date >= ${isoNinetyDaysAgo}
        GROUP BY day ORDER BY day ASC
      `);

      // Merge into unified 90-day array
      const repMap: Record<string, number> = {};
      for (const r of (repRows.rows ?? repRows) as any[]) {
        repMap[r.day] = Number(r.reps) || 0;
      }
      const checkinMap: Record<string, { mood: number; energy: number }> = {};
      for (const r of (checkinRows.rows ?? checkinRows) as any[]) {
        checkinMap[r.day] = {
          mood: Number(r.mood) || 0,
          energy: Number(r.energy) || 0,
        };
      }

      const last90Days: Array<{
        date: string; reps: number; checkinDone: boolean; moodScore: number; energyScore: number;
      }> = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        last90Days.push({
          date: key,
          reps: repMap[key] ?? 0,
          checkinDone: !!checkinMap[key],
          moodScore: checkinMap[key]?.mood ?? 0,
          energyScore: checkinMap[key]?.energy ?? 0,
        });
      }

      // This week (Mon–Sun)
      const dayOfWeek = today.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - mondayOffset);
      const weekStartKey = weekStart.toISOString().slice(0, 10);
      const thisWeekDays = last90Days.filter(d => d.date >= weekStartKey);
      const thisWeekReps = thisWeekDays.reduce((s, d) => s + d.reps, 0);

      // All-time totals
      const allTimeRows = await db.execute(sql`
        SELECT COUNT(*) AS total_reps, COUNT(DISTINCT DATE(created_at)) AS total_days
        FROM never_zero_logs WHERE user_id = ${userId}
      `);
      const allTime = (allTimeRows.rows ?? allTimeRows)[0] as any ?? {};

      // Notification prefs (for weeklyRepGoal)
      let prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
      const weeklyRepGoal = prefs[0]?.weeklyRepGoal ?? 21;

      res.json({
        streak: {
          current: Number(streak.current_streak) || 0,
          longest: Number(streak.longest_streak) || 0,
          totalActive: Number(streak.total_active_days) || 0,
          lastActivityDate: streak.last_activity_date,
        },
        goal: { weeklyReps: weeklyRepGoal, thisWeekReps },
        last90Days,
        allTime: {
          totalReps: Number(allTime.total_reps) || 0,
          totalDays: Number(allTime.total_days) || 0,
        },
      });
    } catch (err) {
      console.error('[progress] GET /api/recovery/progress', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // GET /api/recovery/notification-prefs
  app.get('/api/recovery/notification-prefs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
      if (!rows[0]) {
        // Insert defaults on first access
        const inserted = await db.insert(notificationPreferences).values({ userId }).returning();
        rows = inserted;
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('[progress] GET /api/recovery/notification-prefs', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // PATCH /api/recovery/notification-prefs
  app.patch('/api/recovery/notification-prefs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const parsed = notifPrefSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.errors });

      const update = { ...parsed.data, updatedAt: new Date() };

      const existing = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
      let result;
      if (existing[0]) {
        result = await db.update(notificationPreferences).set(update).where(eq(notificationPreferences.userId, userId)).returning();
      } else {
        result = await db.insert(notificationPreferences).values({ userId, ...parsed.data }).returning();
      }
      res.json(result[0]);
    } catch (err) {
      console.error('[progress] PATCH /api/recovery/notification-prefs', err);
      res.status(500).json({ message: 'Internal error' });
    }
  });
}
