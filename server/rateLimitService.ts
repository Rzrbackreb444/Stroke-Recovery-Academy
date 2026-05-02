/**
 * Rate Limiting Service
 * Tier-based rate limiting for API endpoints and AI generations
 */

import { db } from './db';
import { usageEvents } from '../shared/schema';
import { eq, and, gte, inArray, sql } from 'drizzle-orm';
import { getUserTier, getTierConfig, LimitKey } from './subscriptionTierService';

/**
 * Feature keys that count toward the per-tier AI generation quota.
 * Restricting `getUsageCount` to this allowlist prevents unrelated
 * `usage_events` rows (e.g. `daily_spin`, `export`) from prematurely
 * exhausting a user's AI quota.
 *
 * Add new entries here whenever a new direct-Gemini/OpenAI/ElevenLabs
 * route calls `recordUsage(userId, '<key>')`.
 */
export const AI_USAGE_FEATURE_KEYS = [
  'ai_generation',
  'persona_forge',
  'quote_generate',
  'voice_synthesis',
] as const;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  message?: string;
}

/**
 * Get reset time for rate limit window
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
    // Scope to AI-related feature keys + successful events only so unrelated
    // rows (daily_spin, export, etc.) don't burn the AI generation quota.
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(usageEvents)
      .where(and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.success, true),
        inArray(usageEvents.featureKey, AI_USAGE_FEATURE_KEYS as unknown as string[]),
        gte(usageEvents.createdAt, startDate)
      ));

    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.error('Error getting usage count:', error);
    return 0;
  }
}

/**
 * Record usage for rate limiting.
 *
 * Persisted to the usage_events table so the count is shared across replicas
 * and survives restarts. Previously this wrote to an in-memory Map that no
 * other code path read — which meant `getUsageCount` (which queries this
 * table) always returned 0 for events that hadn't been logged elsewhere,
 * effectively bypassing the per-user rate limit on AI generations.
 */
export async function recordUsage(userId: string, action: string): Promise<void> {
  try {
    await db.insert(usageEvents).values({
      userId,
      featureKey: action,
      creditsCost: 0,
      success: true,
    });
  } catch (error) {
    console.error('Error recording usage event:', error);
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
