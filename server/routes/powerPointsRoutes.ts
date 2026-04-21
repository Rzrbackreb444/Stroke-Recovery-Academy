import type { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, giftSenderBlocks, powerPointGifts } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';
import {
  POWER_POINT_PACKAGES,
  createPowerPointsCheckout,
  getPackages,
  getReceivedGifts,
  getSentGifts,
  getTopSupporters,
  getUnreadCount,
  markRead,
  type PowerPointPackageKey,
} from '../powerPointsService';
import { recoveryStripeService } from '../recoveryStripeService';

// Tiny profanity filter — list intentionally short; production should plug in a real moderation API.
const SLUR_PATTERNS = [
  /\bf+u+c+k/i, /\bs+h+i+t/i, /\bb+i+t+c+h/i, /\bc+u+n+t/i, /\bn+i+g/i, /\bf+a+g/i,
  /\bk+i+l+l\s+y+o+u+r+s+e+l+f/i, /\bk+y+s\b/i, /\bd+i+e\b/i,
];

function sanitizeMessage(raw: string): string {
  const trimmed = (raw || '').trim().slice(0, 500);
  let cleaned = trimmed;
  for (const pat of SLUR_PATTERNS) {
    cleaned = cleaned.replace(pat, (m) => '*'.repeat(m.length));
  }
  return cleaned;
}

const checkoutSchema = z.object({
  receiverId: z.string().min(1),
  packageKey: z.enum(['cheer', 'spark', 'boost', 'surge', 'beast']),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().optional(),
});

export function registerPowerPointsRoutes(app: Express, isAuthenticated: any) {
  // Public: list of packages
  app.get('/api/power-points/packages', (_req, res) => {
    res.json({ packages: getPackages() });
  });

  // Authenticated: send a power-points gift via Stripe checkout
  app.post('/api/power-points/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub as string;
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.format() });
      }
      const { receiverId, packageKey, message, isAnonymous } = parsed.data;

      if (receiverId === senderId) {
        return res.status(400).json({ error: 'Cannot send Power Points to yourself' });
      }

      // Receiver must accept gifts
      const [receiver] = await db.select({
        id: users.id,
        accepts: users.acceptsPowerPoints,
        stripeCustomerId: users.stripeCustomerId,
      }).from(users).where(eq(users.id, receiverId)).limit(1);
      if (!receiver) return res.status(404).json({ error: 'Recipient not found' });
      if (!receiver.accepts) return res.status(403).json({ error: 'This survivor is not accepting Power Points right now' });

      // Receiver may have blocked sender
      const [blocked] = await db.select().from(giftSenderBlocks).where(and(
        eq(giftSenderBlocks.receiverId, receiverId),
        eq(giftSenderBlocks.blockedSenderId, senderId),
      )).limit(1);
      if (blocked) return res.status(403).json({ error: 'Cannot send Power Points to this user' });

      // Ensure sender has a Stripe customer record
      const [sender] = await db.select().from(users).where(eq(users.id, senderId)).limit(1);
      if (!sender) return res.status(401).json({ error: 'Sender not found' });
      let customerId = sender.stripeCustomerId;
      if (!customerId) {
        const customer = await recoveryStripeService.createCustomer(sender.email || '', sender.id);
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, sender.id));
      }

      const origin = req.headers.origin || `https://${req.headers.host}`;
      const successUrl = `${origin}/power-points/sent?status=success`;
      const cancelUrl = `${origin}/power-points/send/${receiverId}?status=cancel`;

      const cleanMessage = message ? sanitizeMessage(message) : undefined;

      const { url, giftId } = await createPowerPointsCheckout({
        senderId,
        receiverId,
        packageKey: packageKey as PowerPointPackageKey,
        message: cleanMessage,
        isAnonymous: !!isAnonymous,
        customerId: customerId!,
        successUrl,
        cancelUrl,
      });

      res.json({ url, giftId });
    } catch (e: any) {
      console.error('[powerPoints] checkout error', e);
      res.status(500).json({ error: e?.message || 'Checkout failed' });
    }
  });

  // Authenticated: my received gifts (inbox)
  app.get('/api/power-points/received', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const gifts = await getReceivedGifts(userId);
    res.json({ gifts });
  });

  // Authenticated: my sent gifts
  app.get('/api/power-points/sent', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const gifts = await getSentGifts(userId);
    res.json({ gifts });
  });

  // Authenticated: unread count for header badge
  app.get('/api/power-points/unread-count', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const count = await getUnreadCount(userId);
    res.json({ count });
  });

  // Authenticated: mark a gift read
  app.post('/api/power-points/:id/read', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await markRead(userId, id);
    res.json({ ok: true });
  });

  // Authenticated: top supporters of a given user (public-ish — no message text exposed)
  app.get('/api/power-points/top-supporters/:userId', async (req, res) => {
    const userId = req.params.userId;
    const supporters = await getTopSupporters(userId, 10);
    res.json({ supporters });
  });

  // Authenticated: block a sender
  app.post('/api/power-points/block/:senderId', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const senderId = req.params.senderId;
    if (!senderId || senderId === userId) return res.status(400).json({ error: 'Invalid sender' });
    await db.insert(giftSenderBlocks).values({ receiverId: userId, blockedSenderId: senderId }).onConflictDoNothing();
    res.json({ ok: true });
  });

  // Authenticated: unblock
  app.post('/api/power-points/unblock/:senderId', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const senderId = req.params.senderId;
    await db.delete(giftSenderBlocks).where(and(
      eq(giftSenderBlocks.receiverId, userId),
      eq(giftSenderBlocks.blockedSenderId, senderId),
    ));
    res.json({ ok: true });
  });

  // Authenticated: toggle accepting Power Points
  app.post('/api/power-points/preferences', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub as string;
    const accepts = !!req.body?.acceptsPowerPoints;
    await db.update(users).set({ acceptsPowerPoints: accepts }).where(eq(users.id, userId));
    res.json({ ok: true, acceptsPowerPoints: accepts });
  });

  // Lifetime totals widget
  app.get('/api/power-points/totals/:userId', async (req, res) => {
    const userId = req.params.userId;
    const [row] = await db
      .select({
        totalPoints: sql<number>`COALESCE(sum(${powerPointGifts.points}), 0)::int`,
        giftCount: sql<number>`count(*)::int`,
      })
      .from(powerPointGifts)
      .where(and(
        eq(powerPointGifts.receiverId, userId),
        eq(powerPointGifts.status, 'delivered'),
      ));
    res.json(row || { totalPoints: 0, giftCount: 0 });
  });
}

export { POWER_POINT_PACKAGES };
