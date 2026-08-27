// Daily engagement: one free "Pass the Power" gift per 24h that must be
// given away to another survivor. Builds reciprocity + community warmth.
import type { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, powerPointGifts } from '@shared/schema';
import { and, eq, isNull, lte, or } from 'drizzle-orm';
import { addCreditsInTransaction } from '../creditService';
import { getUserId } from '../lib/authUtils';

const DAILY_GIFT_POINTS = 25; // one free "Cheer" tier every 24h
const GIFT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const sendSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().max(280).optional(),
});

function sanitizeMsg(s: string) {
  return s.trim().slice(0, 280);
}

export class DailyGiftCooldownError extends Error {
  constructor(public readonly nextAvailableAt: string) {
    super("You've already passed the power today. Come back tomorrow.");
    this.name = 'DailyGiftCooldownError';
  }
}

export class DailyGiftRecipientError extends Error {
  constructor(
    public readonly statusCode: 404 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'DailyGiftRecipientError';
  }
}

export function registerEngagementRoutes(app: Express, isAuthenticated: any) {
  // Can I send my free daily gift?
  app.get('/api/engagement/daily-gift/status', isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
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
      const senderId = getUserId(req)!;
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });
      const { receiverId, message } = parsed.data;

      if (receiverId === senderId) {
        return res.status(400).json({ error: "You can't gift this to yourself — it's meant to support someone else" });
      }

      const now = new Date();
      const cooldownCutoff = new Date(now.getTime() - GIFT_COOLDOWN_MS);
      const gift = await db.transaction(async (tx) => {
        // Validate the recipient in the transaction, before reserving the
        // cooldown, so rejected requests never consume the daily gift.
        const [receiver] = await tx.select({
          id: users.id,
          accepts: users.acceptsPowerPoints,
        }).from(users).where(eq(users.id, receiverId)).limit(1);
        if (!receiver) {
          throw new DailyGiftRecipientError(404, 'Recipient not found');
        }
        if (!receiver.accepts) {
          throw new DailyGiftRecipientError(403, "This survivor isn't accepting Power Points right now");
        }

        // This conditional update is the concurrency gate. PostgreSQL locks
        // the sender row for the update, so only one simultaneous request can
        // reserve a given 24-hour window.
        const [reserved] = await tx.update(users)
          .set({ lastDailyGiftAt: now })
          .where(and(
            eq(users.id, senderId),
            or(isNull(users.lastDailyGiftAt), lte(users.lastDailyGiftAt, cooldownCutoff)),
          ))
          .returning({ id: users.id });

        if (!reserved) {
          const [sender] = await tx.select({ lastAt: users.lastDailyGiftAt })
            .from(users).where(eq(users.id, senderId)).limit(1);
          const last = sender?.lastAt ? new Date(sender.lastAt).getTime() : now.getTime();
          throw new DailyGiftCooldownError(new Date(last + GIFT_COOLDOWN_MS).toISOString());
        }

        // Insert first only to obtain a durable gift id for the ledger
        // reference. Any later failure rolls back both this row and the
        // cooldown reservation, allowing the survivor to retry.
        const [gift] = await tx.insert(powerPointGifts).values({
          senderId,
          receiverId,
          packageKey: 'daily_free',
          points: DAILY_GIFT_POINTS,
          amountCents: 0,
          message: message ? sanitizeMsg(message) : null,
          isAnonymous: false,
          status: 'delivered',
          deliveredAt: now,
        }).returning();

        await addCreditsInTransaction(
          tx,
          receiverId,
          DAILY_GIFT_POINTS,
          'bonus',
          'Free daily Pass-the-Power gift',
          { fromUserId: senderId, giftId: gift.id },
          'power_point_gift',
          String(gift.id),
        );

        return gift;
      });

      res.json({ ok: true, gift, pointsSent: DAILY_GIFT_POINTS, nextAvailableAt: new Date(now.getTime() + GIFT_COOLDOWN_MS).toISOString() });
    } catch (err: any) {
      if (err instanceof DailyGiftCooldownError) {
        return res.status(429).json({ error: err.message, nextAvailableAt: err.nextAvailableAt });
      }
      if (err instanceof DailyGiftRecipientError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('[engagement/daily-gift] error', err);
      res.status(500).json({ error: err?.message || 'Failed to send' });
    }
  });
}
