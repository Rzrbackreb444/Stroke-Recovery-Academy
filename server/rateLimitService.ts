/**
 * Rate Limiting Service
 * Tier-based rate limiting for API endpoints and AI generations
 */

import { db } from './db';
import { usageEvents } from '../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getUserTier, getTierConfig, LimitKey } from './subscriptionTierService';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  message?: string;
}

// In-memory cache for rate limits (reset on restart)
const rateLimitCache = new Map<string, { count: number; resetAt: Date }>();

/**
 * Get rate limit key for user + action
 */
function getRateLimitKey(userId: string, action: string, period: 'daily' | 'monthly'): string {
  const now = new Date();
  const dateKey = period === 'daily' 
    ? `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`
    : `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
  return `${userId}:${action}:${dateKey}`;
}

/**
 * Get reset time for rate limit
 */
function getResetTime(period: 'daily' | 'monthly'): Date {
  const now = new Date();
  if (period === 'daily') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Check rate limit for AI generations
 */
export async function checkAiGenerationLimit(userId: string): Promise<RateLimitResult> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  
  const dailyLimit = config.limits.dailyAiGenerations;
  const monthlyLimit = config.limits.monthlyAiGenerations;

  // Unlimited check
  if (dailyLimit === -1 && monthlyLimit === -1) {
    return { allowed: true, remaining: -1, limit: -1, resetAt: new Date() };
  }

  // Check daily limit
  const dailyKey = getRateLimitKey(userId, 'ai_generation', 'daily');
  const dailyCount = await getUsageCount(userId, 'daily');
  
  if (dailyLimit !== -1 && dailyCount >= dailyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: dailyLimit,
      resetAt: getResetTime('daily'),
      message: `Daily AI generation limit reached (${dailyLimit}). Resets at midnight UTC.`,
    };
  }

  // Check monthly limit
  const monthlyCount = await getUsageCount(userId, 'monthly');
  
  if (monthlyLimit !== -1 && monthlyCount >= monthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: monthlyLimit,
      resetAt: getResetTime('monthly'),
      message: `Monthly AI generation limit reached (${monthlyLimit}). Upgrade your plan for more.`,
    };
  }

  const remainingDaily = dailyLimit === -1 ? -1 : dailyLimit - dailyCount;
  const remainingMonthly = monthlyLimit === -1 ? -1 : monthlyLimit - monthlyCount;
  const remaining = Math.min(
    remainingDaily === -1 ? Infinity : remainingDaily,
    remainingMonthly === -1 ? Infinity : remainingMonthly
  );

  return {
    allowed: true,
    remaining: remaining === Infinity ? -1 : remaining,
    limit: dailyLimit,
    resetAt: getResetTime('daily'),
  };
}

/**
 * Get usage count from database
 */
async function getUsageCount(userId: string, period: 'daily' | 'monthly'): Promise<number> {
  const now = new Date();
  let startDate: Date;

  if (period === 'daily') {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(usageEvents)
      .where(and(
        eq(usageEvents.userId, userId),
        gte(usageEvents.createdAt, startDate)
      ));

    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.error('Error getting usage count:', error);
    return 0;
  }
}

/**
 * Record usage for rate limiting
 */
export async function recordUsage(userId: string, action: string): Promise<void> {
  const dailyKey = getRateLimitKey(userId, action, 'daily');
  const cached = rateLimitCache.get(dailyKey);
  
  if (cached) {
    cached.count++;
  } else {
    rateLimitCache.set(dailyKey, { count: 1, resetAt: getResetTime('daily') });
  }
}

/**
 * Check rate limit for exports
 */
export async function checkExportLimit(userId: string): Promise<RateLimitResult> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  const limit = config.limits.maxExportsPerDay;

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, resetAt: new Date() };
  }

  const count = await getExportCount(userId);
  
  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: getResetTime('daily'),
      message: `Daily export limit reached (${limit}). Upgrade for more exports.`,
    };
  }

  return {
    allowed: true,
    remaining: limit - count,
    limit,
    resetAt: getResetTime('daily'),
  };
}

/**
 * Get export count for today
 */
async function getExportCount(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(usageEvents)
      .where(and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.featureKey, 'export'),
        gte(usageEvents.createdAt, startOfDay)
      ));

    return Number(result[0]?.count) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Check upload size limit
 */
export async function checkUploadLimit(userId: string, fileSizeMb: number): Promise<RateLimitResult> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  const limit = config.limits.maxUploadSizeMb;

  if (limit === -1 || fileSizeMb <= limit) {
    return { allowed: true, remaining: limit - fileSizeMb, limit, resetAt: new Date() };
  }

  return {
    allowed: false,
    remaining: 0,
    limit,
    resetAt: new Date(),
    message: `File too large. Max upload size: ${limit}MB. Upgrade for larger files.`,
  };
}

/**
 * Check project limit
 */
export async function checkProjectLimit(userId: string, currentProjects: number): Promise<RateLimitResult> {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  const limit = config.maxProjects;

  if (limit === -1 || currentProjects < limit) {
    return { allowed: true, remaining: limit === -1 ? -1 : limit - currentProjects, limit, resetAt: new Date() };
  }

  return {
    allowed: false,
    remaining: 0,
    limit,
    resetAt: new Date(),
    message: `Project limit reached (${limit}). Upgrade for more projects.`,
  };
}

/**
 * Get rate limit status for user
 */
export async function getRateLimitStatus(userId: string) {
  const tierName = await getUserTier(userId);
  const config = getTierConfig(tierName);
  
  const dailyUsage = await getUsageCount(userId, 'daily');
  const monthlyUsage = await getUsageCount(userId, 'monthly');

  return {
    tier: tierName,
    daily: {
      used: dailyUsage,
      limit: config.limits.dailyAiGenerations,
      remaining: config.limits.dailyAiGenerations === -1 ? -1 : Math.max(0, config.limits.dailyAiGenerations - dailyUsage),
      resetAt: getResetTime('daily'),
    },
    monthly: {
      used: monthlyUsage,
      limit: config.limits.monthlyAiGenerations,
      remaining: config.limits.monthlyAiGenerations === -1 ? -1 : Math.max(0, config.limits.monthlyAiGenerations - monthlyUsage),
      resetAt: getResetTime('monthly'),
    },
    limits: config.limits,
  };
}
