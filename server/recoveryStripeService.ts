import { db } from './db';
import { users, recoveryCreatorTips, recoveryPremiumPurchases } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getRecoveryStripeClient, isRecoveryStripeConfigured } from './recoveryStripeClient';

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

  async createTipCheckout(
    customerId: string,
    creatorId: number,
    amount: number,
    storyId?: number,
    successUrl: string = '/recovery/dashboard',
    cancelUrl: string = '/recovery/dashboard'
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
        creatorId: creatorId.toString(),
        storyId: storyId?.toString() || '',
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
    cancelUrl: string
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
        platform: 'stroke_recovery_academy',
      },
    });

    return session;
  }

  async createSubscriptionCheckout(
    customerId: string,
    tier: 'survivor' | 'creator',
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = getRecoveryStripeClient();

    const priceMap = {
      survivor: process.env.RECOVERY_SURVIVOR_PRICE_ID,
      creator: process.env.RECOVERY_CREATOR_PRICE_ID,
    };

    const priceId = priceMap[tier];
    if (!priceId) {
      throw new Error(`Price ID not configured for tier: ${tier}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'subscription',
        tier,
        platform: 'stroke_recovery_academy',
      },
    });

    return session;
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
    }
  }

  private async processTip(session: any) {
    const { creatorId, storyId } = session.metadata;
    const amount = session.amount_total;
    const creatorShare = Math.floor(amount * (CREATOR_SHARE_PERCENT / 100));
    const platformFee = amount - creatorShare;

    await db.insert(recoveryCreatorTips).values({
      fromUserId: session.customer ? parseInt(session.customer) : null,
      toCreatorId: parseInt(creatorId),
      storyId: storyId ? parseInt(storyId) : null,
      amount: amount,
      creatorShare: creatorShare,
      platformFee: platformFee,
      stripePaymentId: session.payment_intent,
      message: null,
    });
  }

  private async processPremiumPurchase(session: any) {
    const { storyId } = session.metadata;
    const amount = session.amount_total;
    const creatorShare = Math.floor(amount * (CREATOR_SHARE_PERCENT / 100));
    const platformFee = amount - creatorShare;

    await db.insert(recoveryPremiumPurchases).values({
      buyerId: parseInt(session.customer),
      storyId: parseInt(storyId),
      amount: amount,
      creatorShare: creatorShare,
      platformFee: platformFee,
      stripePaymentId: session.payment_intent,
    });
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
}

export const recoveryStripeService = new RecoveryStripeService();
