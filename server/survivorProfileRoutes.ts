import { Router, type Response } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { db } from "./db";
import { userProfiles } from "@shared/schema";
import { publicRateLimit } from "./middleware/publicRateLimit";
import {
  getCanonicalSurvivorProfile,
  updateCanonicalSurvivorProfile,
  type ProfileSource,
} from "./survivorProfileService";

const router = Router();

const deficitsSchema = z.object({
  motor: z.number().int().min(0).max(4).optional(),
  speech: z.number().int().min(0).max(4).optional(),
  cognitive: z.number().int().min(0).max(4).optional(),
  fatigue: z.number().int().min(0).max(4).optional(),
  vision: z.number().int().min(0).max(4).optional(),
  swallowing: z.number().int().min(0).max(4).optional(),
  emotional: z.number().int().min(0).max(4).optional(),
  sensory: z.number().int().min(0).max(4).optional(),
}).strict().partial();

const profilePatchSchema = z.object({
  profileSource: z.enum([
    "survivor_intake",
    "survivor_profile_settings",
    "recovery_onboarding",
  ]).optional(),
  preferredName: z.string().max(80).optional().nullable(),
  pronouns: z.string().max(40).optional().nullable(),

  strokeDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  strokeType: z.enum(["ischemic", "hemorrhagic", "tia", "unknown"]).optional().nullable(),
  affectedSide: z.enum(["left", "right", "both", "none", "unsure"]).optional().nullable(),

  deficits: deficitsSchema.optional().nullable(),

  recoveryGoals: z.array(z.string().max(80)).max(20).optional().nullable(),
  currentChallenges: z.array(z.string().max(120)).max(20).optional().nullable(),
  customGoal: z.string().max(280).optional().nullable(),
  goalDetails: z.array(z.object({
    horizon: z.enum(["short", "long"]),
    domain: z.enum(["physical", "cognitive", "speech", "emotional", "memory", "other"]),
    goal: z.string().min(3).max(240),
    status: z.string().max(24).optional(),
  })).max(20).optional().nullable(),
  assessmentScores: z.object({
    physical: z.number().int().min(1).max(10).optional(),
    cognitive: z.number().int().min(1).max(10).optional(),
    speech: z.number().int().min(1).max(10).optional(),
    emotional: z.number().int().min(1).max(10).optional(),
    memory: z.number().int().min(1).max(10).optional(),
  }).strict().optional().nullable(),
  assessmentNotes: z.string().max(1000).optional().nullable(),
  equipment: z.array(z.string().max(60)).max(40).optional().nullable(),
  mobilityAids: z.array(z.string().max(60)).max(20).optional().nullable(),

  dailyTimeBudgetMinutes: z.number().int().min(5).max(240).optional().nullable(),
  energyPattern: z.enum(["morning", "afternoon", "evening", "variable"]).optional().nullable(),

  hasCaregiver: z.boolean().optional().nullable(),
  caregiverEmail: z.string().email().max(255).optional().nullable().or(z.literal("")),
  caregiverRelationship: z.enum(["spouse", "child", "parent", "friend", "professional", "other"]).optional().nullable(),

  bigButtonMode: z.boolean().optional().nullable(),
  dyslexiaFont: z.boolean().optional().nullable(),
  reducedMotion: z.boolean().optional().nullable(),
  voicePrefersTts: z.boolean().optional().nullable(),

  bio: z.string().max(2000).optional().nullable(),
  story: z.string().max(5000).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  timeZone: z.string().max(64).optional().nullable(),

  currentIntakeStep: z.number().int().min(0).max(20).optional(),
}).strict().partial();

function authedUserId(req: any): string | null {
  return req.user?.claims?.sub ?? req.session?.userId ?? null;
}

// Per-user write limiter — generous (60/min) to accommodate typing-driven autosave
// but still defends against runaway client loops or accidental write storms.
const perUserWriteLimit = publicRateLimit({
  windowMs: 60_000,
  max: 60,
  bucketName: "survivor-profile-write",
  keyFn: (req: any) => authedUserId(req) || req.ip || "anon",
});

// GET — returns the current survivor's profile, or null if none yet.
router.get("/profile", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = authedUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const profile = await getCanonicalSurvivorProfile(userId);
    if (!profile) return res.json({ profile: null });

    return res.json({
      profile: {
        ...profile,
        intakeComplete: !!profile.intakeCompletedAt,
      },
    });
  } catch (err: any) {
    console.error("[survivor/profile GET]", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// PATCH — partial update via atomic upsert. Safe under autosave concurrency.
router.patch("/profile", isAuthenticated, perUserWriteLimit, async (req: any, res: Response) => {
  try {
    const userId = authedUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const parsed = profilePatchSchema.parse(req.body);
    const {
      profileSource = "survivor_profile_settings",
      ...data
    } = parsed;

    const cleaned: any = { ...data };
    if (cleaned.strokeDate) {
      const d = new Date(cleaned.strokeDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid strokeDate" });
      }
      cleaned.strokeDate = d;
    }
    if (cleaned.caregiverEmail === "") cleaned.caregiverEmail = null;

    const profile = await updateCanonicalSurvivorProfile(
      userId,
      cleaned,
      profileSource as ProfileSource,
    );

    res.json({
      profile: {
        ...profile,
        intakeComplete: !!profile?.intakeCompletedAt,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: err.errors });
    }
    console.error("[survivor/profile PATCH]", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// POST /complete — mark the intake as finished. Idempotent, atomic.
router.post("/profile/complete", isAuthenticated, perUserWriteLimit, async (req: any, res: Response) => {
  try {
    const userId = authedUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const existing = await getCanonicalSurvivorProfile(userId);
    const row = await updateCanonicalSurvivorProfile(
      userId,
      { intakeCompletedAt: existing?.intakeCompletedAt ?? new Date() },
      "survivor_intake",
    );

    res.json({ profile: { ...row, intakeComplete: true } });
  } catch (err: any) {
    console.error("[survivor/profile/complete]", err);
    res.status(500).json({ error: "Failed to complete intake" });
  }
});

// POST /reset — re-open the intake (lets the survivor revise from scratch).
router.post("/profile/reset-intake", isAuthenticated, perUserWriteLimit, async (req: any, res: Response) => {
  try {
    const userId = authedUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const existing = await storage.getUserProfile(userId);
    if (!existing) return res.json({ profile: null });

    const [row] = await db
      .update(userProfiles)
      .set({ intakeCompletedAt: null, currentIntakeStep: 0, updatedAt: sql`now()` })
      .where(eq(userProfiles.userId, userId))
      .returning();

    res.json({ profile: { ...row, intakeComplete: false } });
  } catch (err: any) {
    console.error("[survivor/profile/reset-intake]", err);
    res.status(500).json({ error: "Failed to reset intake" });
  }
});

export default router;
