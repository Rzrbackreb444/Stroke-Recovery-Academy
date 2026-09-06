import { db } from './db';
import { users, recoveryCreatorTips, recoveryPremiumPurchases } from '@shared/schema';
import { getRecoveryStripeClient, isRecoveryStripeConfigured } from './recoveryStripeClient';
import {
  createStripeCustomerStore,
  ensureStripeCustomerForUser,
} from './stripeClient';
import { eq, sql } from 'drizzle-orm';
import { isStripeResourceMissingError } from './stripeClient';

const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

export class RecoveryStripeService {
  async isConfigured(): Promise<boolean> {
    return isRecoveryStripeConfigured();
  }

  async createCustomer(email: string, userId: string) {
    const stripe = getRecoveryStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId, platform: 'stroke_recovery_academy' },
    });
  }

  async getOrCreateCustomer(
    _customerId: string | null | undefined,
    email: string,
    userId: string,
  ) {
    const stripe = getRecoveryStripeClient();
    return ensureStripeCustomerForUser(
      stripe,
      createStripeCustomerStore(),
      userId,
      {
        email: email || undefined,
        metadata: { userId, platform: 'stroke_recovery_academy' },
      },
      _customerId,
    );
  }

  async createTipCheckout(
    customerId: string,
    creatorId: string,
    amount: number,
    storyId?: number,
    successUrl: string = '/recovery/dashboard',
    cancelUrl: string = '/recovery/dashboard',
    fromUserId?: string
  ) {
    const stripe = getRecoveryStripeClient();
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Support a Recovery Creator',
            description: 'Thank you for supporting stroke recovery stories!',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'tip',
        creatorId: creatorId,
        storyId: storyId?.toString() || '',
        fromUserId: fromUserId || '',
        platform: 'stroke_recovery_academy',
      },
    });

    return session;
  }

  async createPremiumPurchaseCheckout(
    customerId: string,
    storyId: number,
    price: number,
    title: string,
    successUrl: string,
    cancelUrl: string,
    buyerId?: string
  ) {
    const stripe = getRecoveryStripeClient();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Premium Content: ${title}`,
            description: 'Access to premium recovery content',
          },
          unit_amount: price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'premium_purchase',
        storyId: storyId.toString(),
        buyerId: buyerId || '',
        platform: 'stroke_recovery_academy',
      },
    });

    return session;
  }

  async createSubscriptionCheckout(
    customerId: string,
    tier: 'survivor' | 'creator' | 'warrior_monthly' | 'warrior_annual',
    successUrl: string,
    cancelUrl: string,
    withTrial: boolean = true
  ) {
    const stripe = getRecoveryStripeClient();

    // Warrior tiers use inline price_data so no env var pre-configuration needed.
    // Survivor/Creator still fall back to env-var price IDs for backward compat.
    const inlinePriceMap: Record<string, { amount: number; interval: 'month' | 'year'; name: string }> = {
      warrior_monthly: { amount: 4700, interval: 'month', name: 'Warrior Monthly Membership — Stroke Recovery Academy' },
      warrior_annual:  { amount: 39700, interval: 'year',  name: 'Warrior Annual Membership — Stroke Recovery Academy' },
    };

    const isInline = tier in inlinePriceMap;

    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        type: 'subscription',
        tier,
        platform: 'stroke_recovery_academy',
      },
    };

    if (customerId) sessionParams.customer = customerId;

    if (isInline) {
      const cfg = inlinePriceMap[tier];
      sessionParams.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: cfg.name },
          unit_amount: cfg.amount,
          recurring: { interval: cfg.interval },
        },
        quantity: 1,
      }];
      if (withTrial) {
        sessionParams.subscription_data = { trial_period_days: 7 };
      }
    } else {
      const priceMap: Record<string, string | undefined> = {
        survivor: process.env.RECOVERY_SURVIVOR_PRICE_ID,
        creator: process.env.RECOVERY_CREATOR_PRICE_ID,
      };
      const priceId = priceMap[tier];
      if (!priceId) throw new Error(`Price ID not configured for tier: ${tier}`);
      sessionParams.line_items = [{ price: priceId, quantity: 1 }];
    }

    return await stripe.checkout.sessions.create(sessionParams);
  }

  async createCoachingCheckout(
    customerId: string,
    coachingType: 'single' | 'package',
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = getRecoveryStripeClient();

    const priceMap = {
      single: { amount: 9900, name: 'Single Coaching Session (30 min)' },
      package: { amount: 34900, name: 'Coaching Package (4 sessions)' },
    };

    const config = priceMap[coachingType];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.name,
            description: '1-on-1 coaching with Nick',
          },
          unit_amount: config.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'coaching',
        coachingType,
        platform: 'stroke_recovery_academy',
      },
    });

    return session;
  }

  async createDonationCheckout(
    customerId: string | null,
    amount: number,
    successUrl: string,
    cancelUrl: string,
    isRecurring: boolean = false
  ) {
    const stripe = getRecoveryStripeClient();

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Donation to Stroke Recovery Academy',
            description: 'Supporting stroke survivors worldwide',
          },
          unit_amount: amount,
          ...(isRecurring && {
            recurring: { interval: 'month' as const },
          }),
        },
        quantity: 1,
      }],
      mode: isRecurring ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'donation',
        isRecurring: isRecurring.toString(),
        platform: 'stroke_recovery_academy',
      },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    }

    return await stripe.checkout.sessions.create(sessionParams);
  }

  async handleWebhook(payload: string, signature: string) {
    const stripe = getRecoveryStripeClient();
    const webhookSecret = process.env.RECOVERY_STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('RECOVERY_STRIPE_WEBHOOK_SECRET not configured');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  }

  async processSuccessfulPayment(session: any) {
    const metadata = session.metadata || {};
    const type = metadata.type;

    switch (type) {
      case 'tip':
        await this.processTip(session);
        break;
      case 'premium_purchase':
        await this.processPremiumPurchase(session);
        break;
      case 'subscription':
        await this.processSubscription(session);
        break;
      case 'coaching':
        await this.processCoachingPurchase(session);
        break;
      case 'donation':
        await this.processDonation(session);
        break;
      case 'power_points':
        await this.processPowerPoints(session);
        break;
    }
  }

  private async processPowerPoints(session: any) {
    const { deliverPowerPoints } = await import('./powerPointsService');
    await deliverPowerPoints(session);
  }

  private async processTip(session: any) {
    const { creatorId, storyId, fromUserId } = session.metadata || {};
    const amount = session.amount_total;
    const creatorPayout = Math.floor(amount * (CREATOR_SHARE_PERCENT / 100));
    const platformFee = amount - creatorPayout;
    const stripePaymentId = session.payment_intent;

    if (!creatorId || typeof stripePaymentId !== 'string' || !stripePaymentId) {
      console.error('[recoveryStripe] processTip missing creatorId or payment_intent; skipping insert');
      return;
    }

    // The payment reference is the stable idempotency key for this one-time
    // checkout. ON CONFLICT also makes two different event deliveries safe.
    await db.insert(recoveryCreatorTips).values({
      fromUserId: fromUserId || null,
      toCreatorId: creatorId,
      storyId: storyId ? parseInt(storyId) : null,
      amount: amount,
      creatorPayout,
      platformFee,
      stripePaymentId,
      message: null,
      status: 'completed',
    }).onConflictDoNothing();
  }

  private async processPremiumPurchase(session: any) {
    const { storyId, buyerId } = session.metadata || {};
    const amount = session.amount_total;
    const creatorPayout = Math.floor(amount * (CREATOR_SHARE_PERCENT / 100));
    const platformFee = amount - creatorPayout;
    const stripePaymentId = session.payment_intent;

    if (!buyerId || !storyId || typeof stripePaymentId !== 'string' || !stripePaymentId) {
      console.error('[recoveryStripe] processPremiumPurchase missing buyerId/storyId/payment_intent; skipping insert');
      return;
    }

    await db.insert(recoveryPremiumPurchases).values({
      buyerId,
      storyId: parseInt(storyId),
      amount: amount,
      creatorPayout,
      platformFee,
      stripePaymentId,
      status: 'completed',
    }).onConflictDoNothing();
  }

  private async processSubscription(session: any) {
    const { tier } = session.metadata;
    console.log(`Processing subscription for tier: ${tier}`, session.subscription);
  }

  private async processCoachingPurchase(session: any) {
    const { coachingType } = session.metadata;
    console.log(`Processing coaching purchase: ${coachingType}`, session.payment_intent);
  }

  private async processDonation(session: any) {
    console.log('Processing donation', session.amount_total, session.payment_intent);
  }

  async getCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = getRecoveryStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async repairCustomer(userId: string, email: string, staleCustomerId?: string): Promise<string> {
    const customer = await this.getOrCreateCustomer(staleCustomerId, email, userId);
    if (customer.created) {
      await db.update(users)
        .set({
          stripeSubscriptionId: null,
          subscriptionStatus: null,
        })
        .where(eq(users.id, userId));
    }
    return customer.id;
  }

  async ensureCustomer(userId: string, email: string, customerId?: string): Promise<string> {
    const customer = await this.getOrCreateCustomer(customerId, email, userId);
    return customer.id;
  }

  /**
   * Recovery checkout routes all use the same Stripe customer column. Retry
   * exactly once only when Stripe confirms that the stored ID is gone.
   */
  async createCheckoutWithCustomerRecovery<T>(
    userId: string,
    email: string,
    customerId: string | undefined,
    createSession: (customerId: string) => Promise<T>,
  ): Promise<T> {
    let effectiveCustomerId = await this.ensureCustomer(userId, email, customerId);
    try {
      return await createSession(effectiveCustomerId);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) throw error;
      effectiveCustomerId = await this.repairCustomer(userId, email, effectiveCustomerId);
      return await createSession(effectiveCustomerId);
    }
  }
}

export const recoveryStripeService = new RecoveryStripeService();
