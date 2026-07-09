import { db } from './db';
import { powerPointGifts, users } from '@workspace/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { addCredits } from './creditService';
import { getRecoveryStripeClient } from './recoveryStripeClient';

export type PowerPointPackageKey = 'cheer' | 'spark' | 'boost' | 'surge' | 'beast';

export interface PowerPointPackage {
  key: PowerPointPackageKey;
  label: string;
  tagline: string;
  points: number;
  amountCents: number;
}

export const POWER_POINT_PACKAGES: Record<PowerPointPackageKey, PowerPointPackage> = {
  cheer: { key: 'cheer', label: 'Cheer', tagline: 'Just say I see you', points: 25, amountCents: 100 },
  spark: { key: 'spark', label: 'Spark',     tagline: 'A quick push',         points: 100,  amountCents: 500  },
  boost: { key: 'boost', label: 'Boost',     tagline: 'A real lift',          points: 250,  amountCents: 1000 },
  surge: { key: 'surge', label: 'Surge',     tagline: 'Game-changer',         points: 600,  amountCents: 2000 },
  beast: { key: 'beast', label: 'Beast Mode', tagline: 'Full Sasquatch fuel', points: 1500, amountCents: 4000 },
};

export function getPackages(): PowerPointPackage[] {
  return Object.values(POWER_POINT_PACKAGES);
}

export async function createPowerPointsCheckout(opts: {
  senderId: string;
  receiverId: string;
  packageKey: PowerPointPackageKey;
  message?: string;
  isAnonymous?: boolean;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const pkg = POWER_POINT_PACKAGES[opts.packageKey];
  if (!pkg) throw new Error(`Unknown power-point package: ${opts.packageKey}`);

  // Receiver must exist
  const [receiver] = await db.select({ id: users.id, firstName: users.firstName }).from(users).where(eq(users.id, opts.receiverId)).limit(1);
  if (!receiver) throw new Error('Recipient not found');

  // Persist a pending gift first so we can attribute it post-payment
  const [pending] = await db.insert(powerPointGifts).values({
    senderId: opts.senderId,
    receiverId: opts.receiverId,
    packageKey: pkg.key,
    points: pkg.points,
    amountCents: pkg.amountCents,
    message: (opts.message || '').slice(0, 500) || null,
    isAnonymous: !!opts.isAnonymous,
  }).returning();

  const stripe = getRecoveryStripeClient();
  const recipientName = receiver.firstName || 'a survivor';
  const session = await stripe.checkout.sessions.create({
    customer: opts.customerId,
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Power Points — ${pkg.label} for ${recipientName}`,
          description: `${pkg.points.toLocaleString()} Power Points delivered with your message.`,
        },
        unit_amount: pkg.amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: {
      type: 'power_points',
      giftId: String(pending.id),
      senderId: opts.senderId,
      receiverId: opts.receiverId,
      packageKey: pkg.key,
      points: String(pkg.points),
      platform: 'stroke_recovery_academy',
    },
  });

  return { url: session.url, giftId: pending.id };
}

export async function deliverPowerPoints(session: any) {
  const meta = session.metadata || {};
  const giftId = parseInt(meta.giftId, 10);
  if (!Number.isFinite(giftId)) {
    console.error('[powerPoints] missing giftId in metadata; cannot deliver');
    return;
  }
  const [gift] = await db.select().from(powerPointGifts).where(eq(powerPointGifts.id, giftId)).limit(1);
  if (!gift) {
    console.error('[powerPoints] gift not found', giftId);
    return;
  }
  if (gift.status === 'delivered') return; // idempotent

  // Credit the receiver as bonus credits (kept distinct from earned/purchased)
  await addCredits(
    gift.receiverId,
    gift.points,
    'bonus',
    `Power Points received${gift.isAnonymous ? '' : gift.senderId ? ` from supporter` : ''}`,
    { giftId: gift.id, senderId: gift.senderId, packageKey: gift.packageKey },
  );

  await db.update(powerPointGifts)
    .set({
      status: 'delivered',
      deliveredAt: new Date(),
      stripePaymentId: session.payment_intent || null,
    })
    .where(eq(powerPointGifts.id, gift.id));
}

export async function getReceivedGifts(receiverId: string, limit = 50) {
  return db
    .select({
      id: powerPointGifts.id,
      senderId: powerPointGifts.senderId,
      packageKey: powerPointGifts.packageKey,
      points: powerPointGifts.points,
      message: powerPointGifts.message,
      isAnonymous: powerPointGifts.isAnonymous,
      status: powerPointGifts.status,
      deliveredAt: powerPointGifts.deliveredAt,
      readAt: powerPointGifts.readAt,
      createdAt: powerPointGifts.createdAt,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
      senderProfileImageUrl: users.profileImageUrl,
      senderIsTherapist: users.isVerifiedTherapist,
      senderTherapistTitle: users.therapistTitle,
    })
    .from(powerPointGifts)
    .leftJoin(users, eq(users.id, powerPointGifts.senderId))
    .where(and(
      eq(powerPointGifts.receiverId, receiverId),
      eq(powerPointGifts.status, 'delivered'),
    ))
    .orderBy(desc(powerPointGifts.createdAt))
    .limit(limit);
}

export async function getSentGifts(senderId: string, limit = 50) {
  return db
    .select({
      id: powerPointGifts.id,
      receiverId: powerPointGifts.receiverId,
      packageKey: powerPointGifts.packageKey,
      points: powerPointGifts.points,
      amountCents: powerPointGifts.amountCents,
      message: powerPointGifts.message,
      status: powerPointGifts.status,
      createdAt: powerPointGifts.createdAt,
      receiverFirstName: users.firstName,
      receiverLastName: users.lastName,
      receiverProfileImageUrl: users.profileImageUrl,
    })
    .from(powerPointGifts)
    .leftJoin(users, eq(users.id, powerPointGifts.receiverId))
    .where(eq(powerPointGifts.senderId, senderId))
    .orderBy(desc(powerPointGifts.createdAt))
    .limit(limit);
}

export async function markRead(receiverId: string, giftId: number) {
  await db.update(powerPointGifts)
    .set({ readAt: new Date() })
    .where(and(
      eq(powerPointGifts.id, giftId),
      eq(powerPointGifts.receiverId, receiverId),
    ));
}

export async function getUnreadCount(receiverId: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(powerPointGifts)
    .where(and(
      eq(powerPointGifts.receiverId, receiverId),
      eq(powerPointGifts.status, 'delivered'),
      sql`${powerPointGifts.readAt} IS NULL`,
    ));
  return row?.c ?? 0;
}

export async function getTopSupporters(receiverId: string, limit = 5) {
  return db
    .select({
      senderId: powerPointGifts.senderId,
      totalPoints: sql<number>`sum(${powerPointGifts.points})::int`,
      giftCount: sql<number>`count(*)::int`,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isTherapist: users.isVerifiedTherapist,
    })
    .from(powerPointGifts)
    .leftJoin(users, eq(users.id, powerPointGifts.senderId))
    .where(and(
      eq(powerPointGifts.receiverId, receiverId),
      eq(powerPointGifts.status, 'delivered'),
      sql`${powerPointGifts.isAnonymous} = false`,
      sql`${powerPointGifts.senderId} IS NOT NULL`,
    ))
    .groupBy(powerPointGifts.senderId, users.firstName, users.lastName, users.profileImageUrl, users.isVerifiedTherapist)
    .orderBy(desc(sql`sum(${powerPointGifts.points})`))
    .limit(limit);
}
