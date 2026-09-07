import { db } from './db';
import { users, creatorEarnings, creatorPayouts } from '@shared/schema';
import type Stripe from 'stripe';
import {
  createStripeCustomerStore,
  ensureStripeCustomerForUser,
  getUncachableStripeClient,
  isStripeResourceMissingError,
  type StripeCustomerDatabase,
} from './stripeClient';
import { eq, sql, and, inArray } from 'drizzle-orm';
import {
  ensureCanonicalStripeCatalog,
  type CanonicalStripeCatalog,
} from './stripeCatalog';

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee
const CREATOR_SHARE_PERCENT = 85; // 85% to creators

export class StripeService {
  constructor(
    private readonly customerDatabase: StripeCustomerDatabase = db,
    private readonly stripeClientFactory: typeof getUncachableStripeClient = getUncachableStripeClient,
  ) {}

  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async getOrCreateCustomer(
    customerId: string | null | undefined,
    email: string,
    userId: string,
  ) {
    const stripe = await this.stripeClientFactory();
    const store = createStripeCustomerStore(this.customerDatabase, {
      clearSubscriptionStateOnCreate: true,
    });

    return ensureStripeCustomerForUser(stripe, store, userId, {
      email: email || undefined,
      metadata: { userId },
    }, customerId);
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'payment',
    options: { trialDays?: number; allowPromotionCodes?: boolean; promotionCode?: string } = {}
  ) {
    const stripe = await getUncachableStripeClient();
    const params: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    };
    if (mode === 'subscription' && options.trialDays && options.trialDays > 0) {
      params.subscription_data = { trial_period_days: options.trialDays };
    }
    // Pre-apply a promo code if a customer-supplied code resolves to an
    // active Stripe promotion code. We never trust the raw string — we look
    // it up via the Stripe API and use the resolved promotion_code id, so
    // a tampered request can't synthesize a discount that doesn't exist.
    // Stripe forbids combining `discounts` with `allow_promotion_codes` in
    // the same session, so when we pre-apply we must NOT also enable the
    // "enter a code" link — and vice versa.
    let preApplied = false;
    if (options.promotionCode && typeof options.promotionCode === 'string') {
      try {
        const found = await stripe.promotionCodes.list({
          code: options.promotionCode.trim().toUpperCase(),
          active: true,
          limit: 1,
        });
        const promo = found.data[0];
        if (promo) {
          params.discounts = [{ promotion_code: promo.id }];
          preApplied = true;
        }
      } catch (e: any) {
        // Bad code string → silently ignore; survivor still gets full price
        // and can manually enter a code at the Stripe Checkout page if
        // allow_promotion_codes is enabled below.
        console.warn('[stripe] promo lookup failed', e?.message || e);
      }
    }
    if (!preApplied && options.allowPromotionCodes) {
      params.allow_promotion_codes = true;
    }
    return await stripe.checkout.sessions.create(params);
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
  }) {
    const [user] = await db.update(users)
      .set(stripeInfo)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // ----------------------------------------------------------------------------
  // PRODUCT & PRICE CREATION - Stroke Recovery Academy Subscription Tiers
  // ----------------------------------------------------------------------------

  async createSraProducts() {
    const catalog = await ensureCanonicalStripeCatalog();
    return [
      {
        name: 'Stroke Recovery Academy Creator',
        monthlyAmount: 2900,
        annualAmount: 24900,
        ...catalog.creator,
      },
      {
        name: 'Stroke Recovery Academy Pro',
        monthlyAmount: 7900,
        annualAmount: 69900,
        ...catalog.pro,
      },
      {
        name: 'Stroke Recovery Academy Enterprise',
        monthlyAmount: 29900,
        annualAmount: 249900,
        ...catalog.enterprise,
      },
    ];
  }

  async getCanonicalCatalog(): Promise<CanonicalStripeCatalog> {
    return ensureCanonicalStripeCatalog();
  }

  async getSraProducts() {
    const catalog = await ensureCanonicalStripeCatalog();
    const stripe = await getUncachableStripeClient();
    const priceIds = [
      catalog.creator.monthlyPriceId,
      catalog.creator.annualPriceId,
      catalog.pro.monthlyPriceId,
      catalog.pro.annualPriceId,
      catalog.enterprise.monthlyPriceId,
      catalog.enterprise.annualPriceId,
    ];
    const rows = [];
    const products = new Map<string, Stripe.Product>();

    for (const priceId of priceIds) {
      const price = await stripe.prices.retrieve(priceId);
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      let product = products.get(productId);
      if (!product) {
        product = await stripe.products.retrieve(productId);
        products.set(productId, product);
      }
      rows.push({
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        product_metadata: product.metadata,
        price_id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        price_metadata: price.metadata,
      });
    }

    return rows;
  }

  // ----------------------------------------------------------------------------
  // STRIPE CONNECT - Creator Onboarding & Payouts
  // ----------------------------------------------------------------------------

  async createConnectAccount(userId: string, email: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    
    // Create Express Connect account for creator
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Update user with Connect account ID
    await db.update(users)
      .set({ 
        stripeConnectAccountId: account.id,
        stripeConnectOnboarded: false 
      })
      .where(eq(users.id, userId));

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return { accountId: account.id, onboardingUrl: accountLink.url };
  }

  async getConnectAccountStatus(userId: string) {
    const stripe = await getUncachableStripeClient();
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user?.stripeConnectAccountId) {
      return { connected: false, onboarded: false };
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const isOnboarded = account.details_submitted && account.charges_enabled;

    // Update onboarding status if changed
    if (isOnboarded !== user.stripeConnectOnboarded) {
      await db.update(users)
        .set({ 
          stripeConnectOnboarded: isOnboarded,
          creatorPayoutEnabled: isOnboarded 
        })
        .where(eq(users.id, userId));
    }

    return {
      connected: true,
      onboarded: isOnboarded,
      accountId: user.stripeConnectAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  }

  async createConnectLoginLink(userId: string) {
    const stripe = await getUncachableStripeClient();
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user?.stripeConnectAccountId) {
      throw new Error('No Connect account found');
    }

    const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectAccountId);
    return loginLink.url;
  }

  // Calculate revenue split (85% creator, 15% platform)
  calculateRevenueSplit(saleAmountCents: number) {
    const platformFee = Math.round(saleAmountCents * PLATFORM_FEE_PERCENT / 100);
    const creatorShare = saleAmountCents - platformFee;
    return { platformFee, creatorShare };
  }

  // Record a sale and creator earnings
  async recordSale(params: {
    creatorId: string;
    productType: string;
    productId: number;
    productTitle: string;
    saleAmount: number;
    orderId?: number;
    customerEmail?: string;
  }) {
    const { platformFee, creatorShare } = this.calculateRevenueSplit(params.saleAmount);

    const [earning] = await db.insert(creatorEarnings).values({
      creatorId: params.creatorId,
      orderId: params.orderId,
      productType: params.productType,
      productId: params.productId,
      productTitle: params.productTitle,
      saleAmount: params.saleAmount,
      platformFee,
      creatorShare,
      status: 'pending',
      customerEmail: params.customerEmail,
    }).returning();

    return earning;
  }

  // Get creator earnings summary
  async getCreatorEarnings(creatorId: string) {
    const earnings = await db.select().from(creatorEarnings)
      .where(eq(creatorEarnings.creatorId, creatorId))
      .orderBy(creatorEarnings.createdAt);

    const summary = earnings.reduce((acc, e) => {
      acc.totalSales += e.saleAmount;
      acc.totalCreatorShare += e.creatorShare;
      acc.totalPlatformFee += e.platformFee;
      if (e.status === 'pending') acc.pendingBalance += e.creatorShare;
      if (e.status === 'available') acc.availableBalance += e.creatorShare;
      if (e.status === 'paid') acc.paidOut += e.creatorShare;
      return acc;
    }, {
      totalSales: 0,
      totalCreatorShare: 0,
      totalPlatformFee: 0,
      pendingBalance: 0,
      availableBalance: 0,
      paidOut: 0,
      salesCount: earnings.length
    });

    return { earnings, summary };
  }

  // Get creator payouts
  async getCreatorPayouts(creatorId: string) {
    return db.select().from(creatorPayouts)
      .where(eq(creatorPayouts.creatorId, creatorId))
      .orderBy(creatorPayouts.createdAt);
  }

  // Transfer funds to creator's Connect account
  async transferToCreator(creatorId: string, earningIds: number[]) {
    const stripe = await getUncachableStripeClient();

    // Get creator's Connect account
    const [user] = await db.select().from(users).where(eq(users.id, creatorId));
    if (!user?.stripeConnectAccountId || !user.stripeConnectOnboarded) {
      throw new Error('Creator not connected to Stripe or not fully onboarded');
    }

    // Get pending earnings
    const pendingEarnings = await db.select().from(creatorEarnings)
      .where(and(
        eq(creatorEarnings.creatorId, creatorId),
        eq(creatorEarnings.status, 'available'),
        inArray(creatorEarnings.id, earningIds)
      ));

    if (!pendingEarnings.length) {
      throw new Error('No available earnings to transfer');
    }

    const totalAmount = pendingEarnings.reduce((sum, e) => sum + e.creatorShare, 0);

    // Create transfer to Connected account
    const transfer = await stripe.transfers.create({
      amount: totalAmount,
      currency: 'usd',
      destination: user.stripeConnectAccountId,
      metadata: {
        creatorId,
        earningIds: earningIds.join(','),
      },
    });

    // Create payout record
    const [payout] = await db.insert(creatorPayouts).values({
      creatorId,
      amount: totalAmount,
      currency: 'USD',
      status: 'processing',
      stripeTransferId: transfer.id,
      earningsIncluded: earningIds,
    }).returning();

    // Update earnings status
    await db.update(creatorEarnings)
      .set({ 
        status: 'paid',
        stripeTransferId: transfer.id,
        payoutId: payout.id,
        paidAt: new Date()
      })
      .where(inArray(creatorEarnings.id, earningIds));

    return payout;
  }

  /**
   * Create a replacement customer after Stripe confirms that the stored
   * customer no longer exists. The shared customer store holds the
   * transaction-scoped lock and uses a deterministic Stripe idempotency key,
   * so a database rollback after Stripe succeeds is safe to retry.
   */
  async repairCustomer(userId: string, email: string, staleCustomerId?: string): Promise<string> {
    const customer = await this.getOrCreateCustomer(staleCustomerId, email, userId);
    return customer.id;
  }

  async ensureCustomer(userId: string, email: string, customerId?: string): Promise<string> {
    return customerId || this.repairCustomer(userId, email);
  }

  async withCustomerRecovery<T>(
    userId: string,
    email: string,
    customerId: string | undefined,
    operation: (customerId: string) => Promise<T>,
  ): Promise<T> {
    let effectiveCustomerId = await this.ensureCustomer(userId, email, customerId);
    try {
      return await operation(effectiveCustomerId);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) throw error;
      effectiveCustomerId = await this.repairCustomer(userId, email, effectiveCustomerId);
      return await operation(effectiveCustomerId);
    }
  }

  async createCheckoutSessionWithCustomerRecovery(
    userId: string,
    email: string,
    customerId: string | undefined,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'payment',
    options: { trialDays?: number; allowPromotionCodes?: boolean; promotionCode?: string } = {},
  ) {
    return this.withCustomerRecovery(userId, email, customerId, (effectiveCustomerId) =>
      this.createCheckoutSession(
        effectiveCustomerId,
        priceId,
        successUrl,
        cancelUrl,
        mode,
        options,
      )
    );
  }

  async createCustomerPortalSessionWithCustomerRecovery(
    userId: string,
    email: string,
    customerId: string | undefined,
    returnUrl: string,
  ) {
    return this.withCustomerRecovery(userId, email, customerId, (effectiveCustomerId) =>
      this.createCustomerPortalSession(effectiveCustomerId, returnUrl)
    );
  }
}

export const stripeService = new StripeService();
