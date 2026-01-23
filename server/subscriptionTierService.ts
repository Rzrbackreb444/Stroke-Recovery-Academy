/**
 * Subscription Tier Service
 * Manages tier-based access control, feature gating, and rate limiting
 */

import { db } from './db';
import { subscriptionTiers, userSubscriptions, featureGates, users } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// Default tier configurations
export const TIER_CONFIGS = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: 'Get started with basic features',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 100,
    maxProjects: 3,
    maxStorageGb: 1,
    maxTeamMembers: 1,
    features: {
      bookStudio: true,
      musicStudio: false,
      videoStudio: false,
      courseStudio: false,
      imageStudio: true,
      doctrineEngine: false,
      marketplace: true,
      marketplaceSelling: false,
      aiGeneration: true,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      customBranding: false,
    },
    limits: {
      dailyAiGenerations: 10,
      monthlyAiGenerations: 100,
      maxUploadSizeMb: 10,
      maxExportsPerDay: 3,
      maxBookLength: 10000,
      maxVideoMinutes: 5,
      maxMusicTracks: 3,
    },
  },
  creator: {
    name: 'creator',
    displayName: 'Creator',
    description: 'For serious content creators - 50 AI generations/day',
    monthlyPrice: 2900,
    annualPrice: 24900,
    monthlyCredits: 2500,
    maxProjects: 25,
    maxStorageGb: 25,
    maxTeamMembers: 1,
    features: {
      bookStudio: true,
      musicStudio: true,
      videoStudio: false,
      courseStudio: false,
      imageStudio: true,
      doctrineEngine: true,
      marketplace: true,
      marketplaceSelling: true,
      aiGeneration: true,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      customBranding: false,
    },
    limits: {
      dailyAiGenerations: 50,
      monthlyAiGenerations: 1000,
      maxUploadSizeMb: 100,
      maxExportsPerDay: 25,
      maxBookLength: 100000,
      maxVideoMinutes: 30,
      maxMusicTracks: 25,
    },
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: 'Unlimited creation power - All studios, priority support',
    monthlyPrice: 7900,
    annualPrice: 69900,
    monthlyCredits: 10000,
    maxProjects: 100,
    maxStorageGb: 100,
    maxTeamMembers: 5,
    features: {
      bookStudio: true,
      musicStudio: true,
      videoStudio: true,
      courseStudio: true,
      imageStudio: true,
      doctrineEngine: true,
      marketplace: true,
      marketplaceSelling: true,
      aiGeneration: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: false,
      customBranding: true,
    },
    limits: {
      dailyAiGenerations: 500,
      monthlyAiGenerations: 10000,
      maxUploadSizeMb: 500,
      maxExportsPerDay: 100,
      maxBookLength: 500000,
      maxVideoMinutes: 120,
      maxMusicTracks: 100,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For teams and agencies - 10 seats, white-label, API access',
    monthlyPrice: 29900,
    annualPrice: 249900,
    monthlyCredits: 50000,
    maxProjects: -1, // unlimited
    maxStorageGb: 1000,
    maxTeamMembers: 10,
    features: {
      bookStudio: true,
      musicStudio: true,
      videoStudio: true,
      courseStudio: true,
      imageStudio: true,
      doctrineEngine: true,
      marketplace: true,
      marketplaceSelling: true,
      aiGeneration: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: true,
      customBranding: true,
    },
    limits: {
      dailyAiGenerations: -1, // unlimited
      monthlyAiGenerations: -1,
      maxUploadSizeMb: 2000,
      maxExportsPerDay: -1,
      maxBookLength: -1,
      maxVideoMinutes: -1,
      maxMusicTracks: -1,
    },
  },
};

export type TierName = keyof typeof TIER_CONFIGS;
export type FeatureKey = keyof typeof TIER_CONFIGS.free.features;
export type LimitKey = keyof typeof TIER_CONFIGS.free.limits;

/**
 * Seed subscription tiers into the database
 */
export async function seedSubscriptionTiers(): Promise<void> {
  for (const [tierName, config] of Object.entries(TIER_CONFIGS)) {
    const existing = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, tierName)).limit(1);
    
    if (existing.length === 0) {
      await db.insert(subscriptionTiers).values({
        name: config.name,
        displayName: config.displayName,
        description: config.description,
        monthlyPrice: config.monthlyPrice,
        annualPrice: config.annualPrice,
        monthlyCredits: config.monthlyCredits,
        maxProjects: config.maxProjects,
        maxStorageGb: config.maxStorageGb,
        maxTeamMembers: config.maxTeamMembers,
        features: config.features,
        limits: config.limits,
      });
      console.log(`Created subscription tier: ${config.displayName}`);
    }
  }
}

/**
 * Get user's current subscription tier
 */
export async function getUserTier(userId: string): Promise<TierName> {
  try {
    const subscription = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ))
      .limit(1);

    if (subscription.length === 0) {
      return 'free';
    }

    const tier = await db.select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, subscription[0].tierId!))
      .limit(1);

    return (tier[0]?.name as TierName) || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Get tier configuration
 */
export function getTierConfig(tierName: TierName) {
  return TIER_CONFIGS[tierName] || TIER_CONFIGS.free;
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  return config.features[feature] === true;
}

/**
 * Get user's limit for a specific resource
 */
export async function getUserLimit(userId: string, limitKey: LimitKey): Promise<number> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  return config.limits[limitKey];
}

/**
 * Check if user is within their limit
 */
export async function isWithinLimit(
  userId: string, 
  limitKey: LimitKey, 
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const limit = await getUserLimit(userId, limitKey);
  
  if (limit === -1) {
    return { allowed: true, limit: -1, current: currentUsage };
  }
  
  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage,
  };
}

/**
 * Get all tier details for pricing page
 */
export async function getAllTiers() {
  const tiers = await db.select().from(subscriptionTiers).orderBy(subscriptionTiers.monthlyPrice);
  return tiers.length > 0 ? tiers : Object.values(TIER_CONFIGS).map((config, index) => ({
    id: index + 1,
    ...config,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    stripeProductId: null,
    createdAt: new Date(),
  }));
}

/**
 * Upgrade user to a new tier
 */
export async function upgradeTier(
  userId: string, 
  newTierName: TierName,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
): Promise<boolean> {
  try {
    const tier = await db.select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, newTierName))
      .limit(1);

    if (tier.length === 0) {
      console.error(`Tier not found: ${newTierName}`);
      return false;
    }

    // Check for existing subscription
    const existing = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (existing.length > 0) {
      await db.update(userSubscriptions)
        .set({
          tierId: tier[0].id,
          stripeSubscriptionId,
          stripeCustomerId,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          monthlyCreditsQuota: tier[0].monthlyCredits,
          updatedAt: now,
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      await db.insert(userSubscriptions).values({
        userId,
        tierId: tier[0].id,
        stripeSubscriptionId,
        stripeCustomerId,
        status: 'active',
        billingPeriod: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        monthlyCreditsQuota: tier[0].monthlyCredits,
      });
    }

    return true;
  } catch (error) {
    console.error('Error upgrading tier:', error);
    return false;
  }
}

/**
 * Cancel user subscription (downgrade to free)
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    await db.update(userSubscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: string) {
  const subscription = await db.select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (subscription.length === 0) {
    return {
      tier: 'free',
      status: 'active',
      config: TIER_CONFIGS.free,
    };
  }

  const tier = await db.select()
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.id, subscription[0].tierId!))
    .limit(1);

  const tierName = (tier[0]?.name as TierName) || 'free';

  return {
    ...subscription[0],
    tier: tierName,
    config: getTierConfig(tierName),
  };
}
