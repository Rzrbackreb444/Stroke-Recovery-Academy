import { desc, eq } from "drizzle-orm";
import { db as defaultDb } from "./db";
import {
  sasquatchAssessments,
  survivorGoals,
  userProfiles,
} from "@shared/schema";

export type ProfileSource =
  | "survivor_intake"
  | "survivor_profile_settings"
  | "recovery_onboarding"
  | "legacy_user_profile"
  | "legacy_sasquatch_assessment"
  | "legacy_survivor_goal";

export type ProfileProvenance = Record<string, {
  source: ProfileSource | string;
  updatedAt: string;
}>;

export type CanonicalProfilePatch = Partial<typeof userProfiles.$inferInsert>;

export type CanonicalGoalDetail = {
  horizon: "short" | "long";
  domain: "physical" | "cognitive" | "speech" | "emotional" | "memory" | "other";
  goal: string;
  status?: string;
};

const TRACKED_FIELDS = [
  "preferredName",
  "pronouns",
  "strokeDate",
  "strokeType",
  "affectedSide",
  "deficits",
  "recoveryGoals",
  "currentChallenges",
  "customGoal",
  "goalDetails",
  "assessmentScores",
  "assessmentNotes",
  "equipment",
  "mobilityAids",
  "dailyTimeBudgetMinutes",
  "energyPattern",
  "hasCaregiver",
  "caregiverEmail",
  "caregiverRelationship",
  "bigButtonMode",
  "dyslexiaFont",
  "reducedMotion",
  "voicePrefersTts",
  "bio",
  "story",
  "location",
  "timeZone",
  "intakeCompletedAt",
] as const;

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined;
}

function provenanceForFields(
  patch: Record<string, unknown>,
  source: ProfileSource,
  updatedAt: string,
  existing: ProfileProvenance = {},
): ProfileProvenance {
  const next = { ...existing };
  for (const field of TRACKED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, field) && hasValue(patch[field])) {
      next[field] = { source, updatedAt };
    }
  }
  return next;
}

function legacyProvenance(
  row: typeof userProfiles.$inferSelect,
): ProfileProvenance {
  const rowUpdatedAt = (row as any).updatedAt;
  const updatedAt = rowUpdatedAt
    ? new Date(rowUpdatedAt).toISOString()
    : new Date().toISOString();
  const result: ProfileProvenance = { ...(row.profileProvenance ?? {}) };
  for (const field of TRACKED_FIELDS) {
    if (hasValue((row as any)[field]) && !result[field]) {
      result[field] = { source: "legacy_user_profile", updatedAt };
    }
  }
  return result;
}

/**
 * Keep the legacy string list and structured goal records aligned.
 *
 * Profile settings submits both fields. During a text edit the structured
 * record can still contain the old text for one request, so the string list
 * is the canonical text while the structured record supplies its metadata.
 * Existing records are the final fallback, which also preserves status when a
 * partial client payload omits it.
 */
export function synchronizeGoalDetails(
  recoveryGoals: unknown,
  incomingDetails: unknown,
  existingDetails: unknown,
): { recoveryGoals: string[]; goalDetails: CanonicalGoalDetail[] } | null {
  const goals = Array.isArray(recoveryGoals)
    ? recoveryGoals.filter((goal): goal is string => typeof goal === "string")
    : null;
  const details = Array.isArray(incomingDetails)
    ? incomingDetails.filter((detail): detail is Record<string, any> => !!detail && typeof detail === "object")
    : [];
  const existing = Array.isArray(existingDetails)
    ? existingDetails.filter((detail): detail is Record<string, any> => !!detail && typeof detail === "object")
    : [];

  if (goals) {
    return {
      recoveryGoals: goals,
      goalDetails: goals.map((goal, index) => {
        const detailByText = details.find((detail) => detail.goal === goal)
          ?? existing.find((detail) => detail.goal === goal);
        const detail = detailByText ?? details[index] ?? existing[index];
        return {
          ...(detail ?? {}),
          goal,
          status: typeof detail?.status === "string"
            ? detail.status
            : typeof existing[index]?.status === "string"
              ? existing[index].status
              : "active",
        } as CanonicalGoalDetail;
      }),
    };
  }

  if (Array.isArray(incomingDetails)) {
    const structuredGoals = details.map((detail, index) => {
      const prior = existing.find((candidate) => candidate.goal === detail.goal) ?? existing[index];
      return {
        ...prior,
        ...detail,
        goal: detail.goal,
        status: typeof detail.status === "string"
          ? detail.status
          : typeof prior?.status === "string"
            ? prior.status
            : "active",
      } as CanonicalGoalDetail;
    });
    return {
      recoveryGoals: structuredGoals.map((detail) => detail.goal),
      goalDetails: structuredGoals,
    };
  }

  return null;
}

/**
 * Read the one profile used by Coach, Today, Journey, and plan generation.
 *
 * The first read also normalizes older assessment/goal records into the
 * profile. The old tables are intentionally not deleted: they are snapshots
 * used by progress history and remain the lossless source for migration.
 */
export async function getCanonicalSurvivorProfile(
  userId: string,
  database: typeof defaultDb = defaultDb,
) {
  let [profile] = await database
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const [latestAssessment] = await database
    .select()
    .from(sasquatchAssessments)
    .where(eq(sasquatchAssessments.userId, userId))
    .orderBy(desc(sasquatchAssessments.takenAt))
    .limit(1);
  const legacyGoals = await database
    .select()
    .from(survivorGoals)
    .where(eq(survivorGoals.userId, userId))
    .orderBy(desc(survivorGoals.createdAt));

  const normalized: Record<string, any> = {};
  if (!profile && (latestAssessment || legacyGoals.length > 0)) {
    normalized.userId = userId;
  }

  if (latestAssessment && !profile?.assessmentScores) {
    normalized.assessmentScores = {
      physical: latestAssessment.physical,
      cognitive: latestAssessment.cognitive,
      speech: latestAssessment.speech,
      emotional: latestAssessment.emotional,
      memory: latestAssessment.memory,
    };
    normalized.assessmentNotes = latestAssessment.notes ?? null;
  }

  if (legacyGoals.length > 0 && !profile?.goalDetails) {
    normalized.goalDetails = legacyGoals.map((goal) => ({
      horizon: goal.horizon,
      domain: goal.domain,
      goal: goal.goal,
      status: goal.status,
    }));
    const existingGoals = profile?.recoveryGoals ?? [];
    normalized.recoveryGoals = Array.from(new Set([
      ...existingGoals,
      ...legacyGoals.map((goal) => goal.goal),
    ]));
  }

  const base = profile ?? (normalized.userId ? normalized : null);
  if (!base) return null;

  const normalizedAt = new Date().toISOString();
  const baseProvenance = legacyProvenance(base as typeof userProfiles.$inferSelect);
  if (latestAssessment && normalized.assessmentScores) {
    baseProvenance.assessmentScores = {
      source: "legacy_sasquatch_assessment",
      updatedAt: latestAssessment.takenAt.toISOString(),
    };
    if (latestAssessment.notes) {
      baseProvenance.assessmentNotes = {
        source: "legacy_sasquatch_assessment",
        updatedAt: latestAssessment.takenAt.toISOString(),
      };
    }
  }
  if (legacyGoals.length > 0 && normalized.goalDetails) {
    baseProvenance.goalDetails = {
      source: "legacy_survivor_goal",
      updatedAt: legacyGoals[0].createdAt.toISOString(),
    };
    baseProvenance.recoveryGoals = {
      source: "legacy_survivor_goal",
      updatedAt: legacyGoals[0].createdAt.toISOString(),
    };
  }

  const needsWrite = Object.keys(normalized).length > 0
    || Object.keys(baseProvenance).length !== Object.keys(profile?.profileProvenance ?? {}).length;
  if (needsWrite) {
    const [updated] = await database
      .insert(userProfiles)
      .values({
        userId,
        ...normalized,
        profileProvenance: baseProvenance,
      } as any)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...normalized,
          profileProvenance: baseProvenance,
          updatedAt: new Date(normalizedAt),
        } as any,
      })
      .returning();
    profile = updated;
  }

  return profile ?? base;
}

export async function updateCanonicalSurvivorProfile(
  userId: string,
  patch: CanonicalProfilePatch,
  source: ProfileSource,
  database: typeof defaultDb = defaultDb,
) {
  const cleaned: Record<string, any> = { ...patch };
  delete cleaned.userId;
  delete cleaned.id;
  delete cleaned.updatedAt;
  delete cleaned.profileProvenance;
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === undefined) delete cleaned[key];
  }

  // The long intake stores simple goal strings while Recovery Onboarding
  // stores horizon/domain metadata. Keep both representations synchronized
  // when a survivor corrects their goals in the profile editor.
  const [existing] = await database
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  const synchronizedGoals = synchronizeGoalDetails(
    cleaned.recoveryGoals,
    cleaned.goalDetails,
    existing?.goalDetails,
  );
  if (synchronizedGoals) {
    cleaned.recoveryGoals = synchronizedGoals.recoveryGoals;
    cleaned.goalDetails = synchronizedGoals.goalDetails;
  }

  const now = new Date().toISOString();
  const profileProvenance = provenanceForFields(
    cleaned,
    source,
    now,
    existing?.profileProvenance ?? {},
  );

  const [row] = await database
    .insert(userProfiles)
    .values({
      userId,
      ...cleaned,
      profileProvenance,
    } as any)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...cleaned,
        profileProvenance,
        updatedAt: new Date(now),
      } as any,
    })
    .returning();
  return row;
}
