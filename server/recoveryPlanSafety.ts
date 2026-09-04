import { z } from "zod";
import {
  recoveryPlanSchema,
  type RecoveryPlan,
  type RecoveryExercise,
} from "../shared/schema";

const recoveryPlanDomainSchema = z.enum([
  "physical",
  "cognitive",
  "speech",
  "emotional",
  "memory",
]);

const aiRecoveryPlanDraftSchema = z.object({
  exerciseSlugs: z.array(z.string().min(1).max(80)).min(1).max(7),
  focusDomains: z.array(recoveryPlanDomainSchema).min(1).max(5),
}).strict();

export type RecoveryPlanCatalogExercise = Pick<
  RecoveryExercise,
  | "id"
  | "slug"
  | "name"
  | "domain"
  | "description"
  | "safetyNotes"
  | "level"
  | "category"
  | "position"
>;

export type AiRecoveryPlanDraft = z.infer<typeof aiRecoveryPlanDraftSchema>;

export class RecoveryPlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoveryPlanValidationError";
  }
}

// These are intentionally key-based checks. Free-form model text is not
// persisted, but a model response containing one of these fields is rejected
// rather than partially trusted.
const UNSAFE_PLAN_KEY = /(?:prescri|dosage|dose|sets?|reps?|hold(?:sec|seconds?)?|intensit|frequency|duration|minutes?|meal|hydration|calor|servings?|medication|supplement|progress|schedule|routine)/i;

function findUnsafeKeys(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUnsafeKeys(item, `${path}[${index}]`));
  }
  if (!value || typeof value !== "object") return [];

  const unsafe: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (UNSAFE_PLAN_KEY.test(key)) unsafe.push(`${path}.${key}`);
    unsafe.push(...findUnsafeKeys(child, `${path}.${key}`));
  }
  return unsafe;
}

function rejectUnsafeKeys(value: unknown, label: string): void {
  const unsafeKeys = findUnsafeKeys(value);
  if (unsafeKeys.length > 0) {
    throw new RecoveryPlanValidationError(
      `${label} contains unsafe fields: ${unsafeKeys.slice(0, 4).join(", ")}`,
    );
  }
}

export function parseAiRecoveryPlanDraft(input: unknown): AiRecoveryPlanDraft {
  rejectUnsafeKeys(input, "AI recovery plan draft");
  const parsed = aiRecoveryPlanDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new RecoveryPlanValidationError(
      `AI recovery plan draft does not match the slug-only schema: ${parsed.error.issues
        .map((issue) => issue.path.join(".") || "root")
        .join(", ")}`,
    );
  }

  if (new Set(parsed.data.exerciseSlugs).size !== parsed.data.exerciseSlugs.length) {
    throw new RecoveryPlanValidationError("AI recovery plan draft contains duplicate exercise slugs");
  }
  return parsed.data;
}

export function validateStoredRecoveryPlan(input: unknown): RecoveryPlan {
  rejectUnsafeKeys(input, "Stored recovery plan");
  const parsed = recoveryPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new RecoveryPlanValidationError(
      `Stored recovery plan does not match the safe schema: ${parsed.error.issues
        .map((issue) => issue.path.join(".") || "root")
        .join(", ")}`,
    );
  }
  return parsed.data;
}

export function isSafeRecoveryPlan(input: unknown): input is RecoveryPlan {
  try {
    validateStoredRecoveryPlan(input);
    return true;
  } catch {
    return false;
  }
}

function hasSafetyNotes(exercise: RecoveryPlanCatalogExercise): boolean {
  return typeof exercise.safetyNotes === "string" && exercise.safetyNotes.trim().length > 0;
}

function uniqueSlugs(slugs: string[]): string[] {
  return [...new Set(slugs)];
}

export function pickSafeExerciseSlugs(
  catalog: RecoveryPlanCatalogExercise[],
  userLevel: "beginner" | "moderate" | "advanced",
): string[] {
  const levelRank = { beginner: 0, moderate: 1, advanced: 2 } as const;
  const eligible = catalog.filter(
    (exercise) =>
      hasSafetyNotes(exercise) &&
      levelRank[exercise.level as keyof typeof levelRank] <= levelRank[userLevel],
  );
  const by = (predicate: (exercise: RecoveryPlanCatalogExercise) => boolean) =>
    eligible.find(predicate)?.slug;
  const preferredPosition = "seated";

  const picks = [
    by((exercise) => exercise.category === "spasticity" && exercise.position === preferredPosition),
    by((exercise) => exercise.category === "lower" && exercise.position === preferredPosition),
    by((exercise) => exercise.category === "upper" && exercise.position === preferredPosition),
    by((exercise) => exercise.category === "hand_fine_motor"),
    by((exercise) => exercise.category === "stretch"),
  ].filter((slug): slug is string => Boolean(slug));

  // A small safe catalog should still produce a valid draft without inventing
  // a placeholder exercise.
  return uniqueSlugs(picks).slice(0, 7);
}

const SAFE_SUMMARY =
  "This is an education draft built from the recovery library, not a medical prescription. Review any activity with your clinician before trying it.";

const SAFE_BRAIN_GYM_EDUCATION =
  "Brain Gym activities are optional education. Choose only activities already approved for you, and stop if symptoms worsen.";

const SAFE_NUTRITION_EDUCATION = [
  "Nutrition and hydration needs vary with medications, swallowing, diabetes, kidney or heart conditions, appetite, and clinician guidance.",
  "This draft does not set calories, portions, hydration amounts, supplements, or foods to avoid. Discuss nutrition changes with your clinician or a registered dietitian.",
];

const SAFE_WEEKLY_REFLECTION: RecoveryPlan["weeklyReflection"] = {
  Mon: "Notice one clinician-approved activity that feels appropriate to discuss.",
  Tue: "Write down what felt comfortable, difficult, or unclear for your care team.",
  Wed: "Review the catalog safety notes before discussing an activity with your clinician.",
  Thu: "Reflect on sleep, energy, mood, and symptoms without changing any routine on your own.",
  Fri: "Bring one recovery question to your clinician or therapist.",
  Sat: "Celebrate consistency in your approved routine, not intensity or volume.",
  Sun: "Prepare questions for the week ahead; do not use this draft to set dosage.",
};

const SAFE_TIPS = [
  "This draft is for education and clinician-approved routine planning only.",
  "Never change exercise intensity, dosage, medication, or nutrition targets from an AI suggestion.",
  "Stop and contact your care team if an activity causes pain, new symptoms, or concern.",
];

export function buildSafeRecoveryPlan(args: {
  catalog: RecoveryPlanCatalogExercise[];
  exerciseSlugs: string[];
  focusDomains: string[];
}): RecoveryPlan {
  const catalogBySlug = new Map(args.catalog.map((exercise) => [exercise.slug, exercise]));
  const slugs = uniqueSlugs(args.exerciseSlugs);
  if (slugs.length === 0 || slugs.length > 7) {
    throw new RecoveryPlanValidationError("Recovery plan must select 1–7 exercises");
  }

  const exercises = slugs.map((slug) => {
    const exercise = catalogBySlug.get(slug);
    if (!exercise) {
      throw new RecoveryPlanValidationError(`AI selected an exercise outside the approved catalog: ${slug}`);
    }
    if (!hasSafetyNotes(exercise)) {
      throw new RecoveryPlanValidationError(`Approved catalog exercise is missing safety notes: ${slug}`);
    }
    if (!recoveryPlanDomainSchema.safeParse(exercise.domain).success) {
      throw new RecoveryPlanValidationError(`Approved catalog exercise has an invalid domain: ${slug}`);
    }
    return {
      exerciseId: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      domain: exercise.domain as RecoveryPlan["focusDomains"][number],
      description: exercise.description,
      safetyNotes: exercise.safetyNotes!.trim(),
      clinicianReviewRequired: true as const,
    };
  });

  const focusDomains = uniqueSlugs(args.focusDomains).filter((domain) =>
    recoveryPlanDomainSchema.safeParse(domain).success,
  ) as RecoveryPlan["focusDomains"];
  if (focusDomains.length === 0) {
    throw new RecoveryPlanValidationError("Recovery plan needs at least one valid focus domain");
  }

  return validateStoredRecoveryPlan({
    planVersion: 2,
    planType: "education_and_clinician_review",
    summary: SAFE_SUMMARY,
    focusDomains,
    exercises,
    education: {
      brainGym: SAFE_BRAIN_GYM_EDUCATION,
      nutrition: SAFE_NUTRITION_EDUCATION,
    },
    weeklyReflection: SAFE_WEEKLY_REFLECTION,
    tips: SAFE_TIPS,
    safetyNote:
      "Not medical advice. This education draft does not prescribe exercise, medication, therapy, or nutrition. Confirm every new activity or change with your doctor, therapist, or registered dietitian.",
  });
}