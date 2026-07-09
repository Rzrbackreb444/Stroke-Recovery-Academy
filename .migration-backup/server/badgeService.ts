// Badge detection, award, tier computation, and daily scheduler job.
// All badge awards are idempotent (INSERT ON CONFLICT DO NOTHING).
// Tier is recomputed after every badge award and daily by the scheduler.

import { db } from "./db";
import { sql } from "drizzle-orm";

// ── Catalog ───────────────────────────────────────────────────────────────────
export interface BadgeMeta {
  name: string;
  description: string;
  category: "automated" | "nominated";
  icon: string; // lucide icon name
}

export const BADGE_CATALOG: Record<string, BadgeMeta> = {
  streak_7:     { name: "7-Day Flame",       description: "7 consecutive days of showing up — never zero.",                          category: "automated", icon: "Flame" },
  streak_30:    { name: "30-Day Forge",       description: "30 days straight. You built something real.",                             category: "automated", icon: "Zap" },
  streak_66:    { name: "66-Day Habit",       description: "Science says 66 days makes it automatic. You made it automatic.",         category: "automated", icon: "RefreshCw" },
  streak_365:   { name: "One Full Year",      description: "365 days. A full orbit around the sun, never zero.",                     category: "automated", icon: "Sun" },
  first_log:    { name: "First Log",          description: "First time you put your recovery into words. That took guts.",            category: "automated", icon: "BookOpen" },
  first_spark:  { name: "First Spark",        description: "First time you shared your recovery publicly. Others needed to see that.", category: "automated", icon: "Sparkles" },
  goal_complete:{ name: "Goal Crusher",       description: "Set a goal. Broke it down. Crushed it.",                                 category: "automated", icon: "Trophy" },
  consistent_4: { name: "Consistent",         description: "Completed 4+ micro-goals. Consistency over intensity.",                  category: "automated", icon: "CheckCircle" },
  forge:        { name: "The Forge",          description: "Found a new way through when the old way stopped working. Nick noticed.", category: "nominated", icon: "Hammer" },
  lighthouse:   { name: "Lighthouse",         description: "Your words pulled another survivor back from a dark place.",              category: "nominated", icon: "Lightbulb" },
  teacher:      { name: "The Teacher",        description: "Another survivor nominated you for teaching them something that helped.", category: "nominated", icon: "GraduationCap" },
  pioneer:      { name: "Pioneer",            description: "You invented an adaptation the community adopted as their own.",          category: "nominated", icon: "Compass" },
  legend:       { name: "Legend",             description: "Nick personally selected you. This one is rare.",                        category: "nominated", icon: "Star" },
};

// Ordered display — automated first by difficulty, then nominated
export const BADGE_DISPLAY_ORDER = [
  "streak_7","streak_30","streak_66","streak_365",
  "first_log","first_spark","goal_complete","consistent_4",
  "forge","lighthouse","teacher","pioneer","legend",
];

// ── Quarter key ───────────────────────────────────────────────────────────────
export function currentQuarterKey(date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

// ── Tier logic ────────────────────────────────────────────────────────────────
export function computeTierFromBadges(badges: { badge_key: string; category: string }[]): string | null {
  const total = badges.length;
  const nominated = badges.filter(b => b.category === "nominated").length;
  const automated = badges.filter(b => b.category === "automated").length;
  const hasLegend = badges.some(b => b.badge_key === "legend");

  if (hasLegend) return "legend";
  if (total >= 5 && nominated >= 1) return "forge";
  if (total >= 3 && automated >= 2) return "bonfire";
  if (total >= 1) return "ember";
  return null;
}

export function decayTier(tier: string, isLegendAwarded: boolean): string {
  if (isLegendAwarded) return "legend"; // Nick-awarded Legend never decays
  if (tier === "legend") return "forge";
  if (tier === "forge") return "bonfire";
  if (tier === "bonfire") return "ember";
  return "ember";
}

// Tier display metadata
export const TIER_META: Record<string, { label: string; color: string; description: string }> = {
  ember:   { label: "Ember",   color: "#F97316", description: "You're here. The fire started." },
  bonfire: { label: "Bonfire", color: "#E2741B", description: "You're consistent. Others can feel the heat." },
  forge:   { label: "Forge",   color: "#C06B3E", description: "You've contributed something lasting to this community." },
  legend:  { label: "Legend",  color: "#D4AF37", description: "Nick personally selected you. This tier doesn't come easy." },
};

// ── Core operations ───────────────────────────────────────────────────────────

// Award a badge — idempotent. Returns true if newly awarded.
export async function awardBadge(
  userId: string,
  badgeKey: string,
  reason?: string,
  awardedByUserId?: string,
): Promise<boolean> {
  const meta = BADGE_CATALOG[badgeKey];
  if (!meta) throw new Error(`Unknown badge key: ${badgeKey}`);

  const result = await db.execute(sql`
    INSERT INTO survivor_badges (user_id, badge_key, badge_name, reason, category, awarded_by_user_id)
    VALUES (${userId}, ${badgeKey}, ${meta.name}, ${reason ?? null}, ${meta.category}, ${awardedByUserId ?? null})
    ON CONFLICT (user_id, badge_key) DO NOTHING
    RETURNING id
  `);

  const wasNew = ((result as any).rows?.length ?? 0) > 0;
  if (wasNew) {
    await recomputeTier(userId);
  }
  return wasNew;
}

// Recompute and upsert the survivor's tier based on current badges.
export async function recomputeTier(userId: string): Promise<void> {
  const badgeRows = await db.execute(sql`
    SELECT badge_key, category FROM survivor_badges WHERE user_id = ${userId}
  `);
  const badges: { badge_key: string; category: string }[] = (badgeRows as any).rows ?? [];

  const tier = computeTierFromBadges(badges);
  if (!tier) return;

  const isLegendAwarded = badges.some(b => b.badge_key === "legend");
  const qKey = currentQuarterKey();

  await db.execute(sql`
    INSERT INTO survivor_tiers (user_id, tier, quarter_key, is_legend_awarded, last_active_at, updated_at)
    VALUES (${userId}, ${tier}, ${qKey}, ${isLegendAwarded}, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      tier              = EXCLUDED.tier,
      quarter_key       = EXCLUDED.quarter_key,
      is_legend_awarded = EXCLUDED.is_legend_awarded,
      last_active_at    = NOW(),
      updated_at        = NOW()
  `);
}

// Refresh last_active_at (call on check-in or any significant user action).
export async function touchUserActivity(userId: string): Promise<void> {
  await db.execute(sql`
    UPDATE survivor_tiers SET last_active_at = NOW(), updated_at = NOW()
    WHERE user_id = ${userId}
  `).catch(() => {}); // non-fatal if no tier row yet
}

// ── Automated badge detection for one user ────────────────────────────────────
export async function checkAutomatedBadgesForUser(userId: string): Promise<string[]> {
  const awarded: string[] = [];

  // Streak badges
  const streakRow = await db.execute(sql`
    SELECT current_streak FROM user_streaks WHERE user_id = ${userId}
  `).catch(() => ({ rows: [] }));
  const streak = Number(((streakRow as any).rows?.[0] ?? {}).current_streak ?? 0);

  for (const [key, threshold] of [
    ["streak_7",  7],
    ["streak_30", 30],
    ["streak_66", 66],
    ["streak_365",365],
  ] as [string, number][]) {
    if (streak >= threshold) {
      if (await awardBadge(userId, key)) awarded.push(key);
    }
  }

  // first_log — any recovery journal entry
  const logRow = await db.execute(sql`
    SELECT 1 FROM recovery_journal_entries WHERE user_id = ${userId} LIMIT 1
  `).catch(() => ({ rows: [] }));
  if (((logRow as any).rows?.length ?? 0) > 0) {
    if (await awardBadge(userId, "first_log")) awarded.push("first_log");
  }

  // first_spark — any public community video
  const sparkRow = await db.execute(sql`
    SELECT 1 FROM community_videos WHERE uploader_id = ${userId} AND is_public = TRUE LIMIT 1
  `).catch(() => ({ rows: [] }));
  if (((sparkRow as any).rows?.length ?? 0) > 0) {
    if (await awardBadge(userId, "first_spark")) awarded.push("first_spark");
  }

  // goal_complete — any completed recovery goal
  const goalRow = await db.execute(sql`
    SELECT 1 FROM recovery_goals WHERE user_id = ${userId} AND status = 'completed' LIMIT 1
  `).catch(() => ({ rows: [] }));
  if (((goalRow as any).rows?.length ?? 0) > 0) {
    if (await awardBadge(userId, "goal_complete")) awarded.push("goal_complete");
  }

  // consistent_4 — 4+ completed micro-goals
  const microRow = await db.execute(sql`
    SELECT COUNT(*) AS cnt FROM recovery_micro_goals WHERE user_id = ${userId} AND status = 'completed'
  `).catch(() => ({ rows: [{ cnt: 0 }] }));
  if (Number(((microRow as any).rows?.[0] ?? {}).cnt ?? 0) >= 4) {
    if (await awardBadge(userId, "consistent_4")) awarded.push("consistent_4");
  }

  return awarded;
}

// ── Daily scheduler job ───────────────────────────────────────────────────────
export async function runDailyBadgeCheck(): Promise<void> {
  // Check automated badges for all users active in the last 90 days
  const activeUsers = await db.execute(sql`
    SELECT DISTINCT user_id FROM daily_checkins
    WHERE created_at > NOW() - INTERVAL '90 days'
    LIMIT 1000
  `);
  const userIds: string[] = ((activeUsers as any).rows ?? []).map((r: any) => String(r.user_id));

  let awarded = 0;
  for (const userId of userIds) {
    const newBadges = await checkAutomatedBadgesForUser(userId).catch(e => {
      console.warn(`[badge-check] ${userId}:`, e?.message);
      return [];
    });
    awarded += newBadges.length;
  }

  // Quarterly tier decay — users inactive > 90 days who aren't Legend-awarded
  const inactiveRows = await db.execute(sql`
    SELECT user_id, tier, is_legend_awarded
    FROM survivor_tiers
    WHERE last_active_at < NOW() - INTERVAL '90 days'
      AND tier != 'ember'
      AND is_legend_awarded = FALSE
  `);
  const toDecay: any[] = (inactiveRows as any).rows ?? [];

  for (const row of toDecay) {
    const newTier = decayTier(row.tier, row.is_legend_awarded);
    if (newTier !== row.tier) {
      await db.execute(sql`
        UPDATE survivor_tiers SET tier = ${newTier}, updated_at = NOW()
        WHERE user_id = ${row.user_id}
      `).catch(() => {});
    }
  }

  console.log(
    `[badge-check] checked ${userIds.length} users, awarded ${awarded} badges, decayed ${toDecay.length} tiers`,
  );
}
