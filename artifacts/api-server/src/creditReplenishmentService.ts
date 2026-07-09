/**
 * Credit Replenishment Service
 * Handles monthly credit grants for subscribers
 */

import { db } from './db';
import { userSubscriptions, creditWallets, creditLedger } from '@workspace/db';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { addCredits } from './creditService';

/**
 * Grant monthly credits to all active subscribers
 * Should be run daily via cron job or scheduled task
 */
export async function processMonthlyCredits(): Promise<{ processed: number; granted: number }> {
  const now = new Date();
  let processed = 0;
  let granted = 0;

  try {
    // Find all active subscriptions that haven't received credits this period
    const subscriptions = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.status, 'active'),
        isNotNull(userSubscriptions.monthlyCreditsQuota),
        lt(userSubscriptions.currentPeriodEnd, now)
      ));

    for (const sub of subscriptions) {
      try {
        // Check if we should grant credits (period ended)
        const shouldGrant = !sub.lastCreditGrantAt || 
          sub.lastCreditGrantAt < sub.currentPeriodStart!;

        if (shouldGrant && sub.monthlyCreditsQuota > 0) {
          // Grant credits
          await addCredits(
            sub.userId,
            sub.monthlyCreditsQuota,
            'subscription',
            `Monthly credit grant - ${sub.billingPeriod} subscription`
          );

          // Update last grant time and period
          const newPeriodStart = new Date();
          const newPeriodEnd = new Date(newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

          await db.update(userSubscriptions)
            .set({
              lastCreditGrantAt: now,
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
              updatedAt: now,
            })
            .where(eq(userSubscriptions.id, sub.id));

          granted++;
          console.log(`Granted ${sub.monthlyCreditsQuota} credits to user ${sub.userId}`);
        }
        processed++;
      } catch (error) {
        console.error(`Error processing credits for user ${sub.userId}:`, error);
      }
    }

    return { processed, granted };
  } catch (error) {
    console.error('Error in monthly credit processing:', error);
    return { processed, granted };
  }
}

/**
 * Grant credits immediately when a subscription is created or renewed
 */
export async function grantSubscriptionCredits(
  userId: string, 
  credits: number,
  reason: string = 'Subscription activation'
): Promise<boolean> {
  try {
    await addCredits(userId, credits, 'subscription', reason);
    
    await db.update(userSubscriptions)
      .set({ lastCreditGrantAt: new Date(), updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, userId));

    console.log(`Granted ${credits} subscription credits to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error granting subscription credits:', error);
    return false;
  }
}

/**
 * Check if user is due for credit replenishment
 */
export async function checkCreditReplenishment(userId: string): Promise<{
  isDue: boolean;
  nextReplenishment: Date | null;
  creditsToReceive: number;
}> {
  try {
    const subscription = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ))
      .limit(1);

    if (subscription.length === 0) {
      return { isDue: false, nextReplenishment: null, creditsToReceive: 0 };
    }

    const sub = subscription[0];
    const now = new Date();
    const isDue = sub.currentPeriodEnd! < now;

    return {
      isDue,
      nextReplenishment: sub.currentPeriodEnd,
      creditsToReceive: sub.monthlyCreditsQuota,
    };
  } catch (error) {
    console.error('Error checking credit replenishment:', error);
    return { isDue: false, nextReplenishment: null, creditsToReceive: 0 };
  }
}

/**
 * Handle subscription renewal from Stripe webhook
 */
export async function handleSubscriptionRenewal(
  stripeSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<boolean> {
  try {
    const subscription = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (subscription.length === 0) {
      console.error(`Subscription not found: ${stripeSubscriptionId}`);
      return false;
    }

    const sub = subscription[0];

    // Grant credits for new period
    if (sub.monthlyCreditsQuota > 0) {
      await addCredits(
        sub.userId,
        sub.monthlyCreditsQuota,
        'subscription',
        'Monthly subscription renewal'
      );
    }

    // Update subscription period
    await db.update(userSubscriptions)
      .set({
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        lastCreditGrantAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, sub.id));

    return true;
  } catch (error) {
    console.error('Error handling subscription renewal:', error);
    return false;
  }
}
