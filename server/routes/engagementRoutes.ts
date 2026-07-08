// Daily engagement: one free "Pass the Power" gift per 24h that must be
// given away to another survivor. Builds reciprocity + community warmth.
import type { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, powerPointGifts } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { addCredits } from '../creditService';
import { getUserId } from "../lib/authUtils";

const DAILY_GIFT_POINTS = 25; // one free "Cheer" tier every 24h
const GIFT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const sendSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().max(280).optional(),
});

function sanitizeMsg(s: string) {
  return s.trim().slice(0, 280);
}

export function registerEngagementRoutes(app: Express, isAuthenticated: any) {
  // Can I send my free daily gift?
  app.get('/api/engagement/daily-gift/status', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req) as string;
    const [me] = await db.select({ lastAt: users.lastDailyGiftAt }).from(users).where(eq(users.id, userId)).limit(1);
    const last = me?.lastAt ? new Date(me.lastAt).getTime() : 0;
    const now = Date.now();
    const elapsed = now - last;
    const canSend = elapsed >= GIFT_COOLDOWN_MS;
    res.json({
      canSend,
      pointsPerGift: DAILY_GIFT_POINTS,
      nextAvailableAt: canSend ? null : new Date(last + GIFT_COOLDOWN_MS).toISOString(),
    });
  });

  // Send the free daily gift to another survivor
  app.post('/api/engagement/daily-gift', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = getUserId(req) as string;
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });
      const { receiverId, message } = parsed.data;

      if (receiverId === senderId) {
        return res.status(400).json({ error: "You can't gift this to yourself — it's meant to support someone else" });
      }

      // Cooldown check (24h rolling)
      const [sender] = await db.select({ lastAt: users.lastDailyGiftAt }).from(users).where(eq(users.id, senderId)).limit(1);
      const last = sender?.lastAt ? new Date(sender.lastAt).getTime() : 0;
      if (Date.now() - last < GIFT_COOLDOWN_MS) {
        const nextAt = new Date(last + GIFT_COOLDOWN_MS).toISOString();
        return res.status(429).json({ error: "You've already passed the power today. Come back tomorrow.", nextAvailableAt: nextAt });
      }

      // Receiver must exist + accept gifts
      const [receiver] = await db.select({ id: users.id, accepts: users.acceptsPowerPoints })
        .from(users).where(eq(users.id, receiverId)).limit(1);
      if (!receiver) return res.status(404).json({ error: 'Recipient not found' });
      if (!receiver.accepts) return res.status(403).json({ error: "This survivor isn't accepting Power Points right now" });

      // Stamp the cooldown FIRST to prevent double-sends on double-click
      await db.update(users).set({ lastDailyGiftAt: new Date() }).where(eq(users.id, senderId));

      // Credit the recipient (bonus credits, no Stripe charge)
      await addCredits(receiverId, DAILY_GIFT_POINTS, 'bonus', 'Free daily Pass-the-Power gift', { fromUserId: senderId });

      // Record the gift as delivered, zero-dollar, so inbox + totals light up
      const [gift] = await db.insert(powerPointGifts).values({
        senderId,
        receiverId,
        packageKey: 'daily_free',
        points: DAILY_GIFT_POINTS,
        amountCents: 0,
        message: message ? sanitizeMsg(message) : null,
        isAnonymous: false,
        status: 'delivered',
        deliveredAt: new Date(),
      }).returning();

      res.json({ ok: true, gift, pointsSent: DAILY_GIFT_POINTS, nextAvailableAt: new Date(Date.now() + GIFT_COOLDOWN_MS).toISOString() });
    } catch (err: any) {
      console.error('[engagement/daily-gift] error', err);
      res.status(500).json({ error: err?.message || 'Failed to send' });
    }
  });
}
