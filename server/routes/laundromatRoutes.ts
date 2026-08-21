import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { getUserId } from "../lib/authUtils";
import {
  laundromatDiscussionReplies,
  laundromatDiscussionReports,
  laundromatDiscussions,
  laundromatEquipmentPlans,
  laundromatSiteScorecards,
  users,
} from "@shared/schema";

export const LAUNDROMAT_SPACES = ["start-smart", "buy-right", "run-profitable", "scale-legacy", "wins-numbers"] as const;
const discussionSchema = z.object({
  space: z.enum(LAUNDROMAT_SPACES),
  title: z.string().trim().min(4).max(160),
  body: z.string().trim().min(4).max(10_000),
});
const replySchema = z.object({
  body: z.string().trim().min(1).max(5_000),
  parentId: z.number().int().positive().nullable().optional(),
});
const planSchema = z.object({
  name: z.string().trim().min(1).max(80),
  items: z.array(z.string().trim().min(1).max(120)).max(30),
  notes: z.string().trim().max(2_000).nullable().optional(),
});
const scorecardSchema = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(3).max(300),
  eveningTraffic: z.enum(["high", "moderate", "low"]),
  competition: z.enum(["low", "moderate", "high"]),
  rent: z.enum(["low", "fair", "high"]),
  notes: z.string().trim().max(2_000).nullable().optional(),
});
const reportSchema = z.object({
  reason: z.enum(["spam", "harassment", "unsafe_advice", "off_topic", "other"]),
  details: z.string().trim().max(1_000).optional(),
});

const writeWindows = new Map<string, number[]>();
function allowWrite(userId: string, action: string, limit = 12, windowMs = 60_000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const recent = (writeWindows.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  writeWindows.set(key, recent);
  return true;
}

function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function requireLaundromatMember(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Sign in to use the Laundromat Mastery workspace." });
  try {
    const member = (await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1))[0];
    if (!member) return res.status(403).json({ message: "Your signed-in member record could not be found." });
    (req as any).laundromatUserId = userId;
    next();
  } catch (error) {
    console.error("[laundromat] membership check failed", error);
    res.status(500).json({ message: "Unable to verify your community membership." });
  }
}

async function isModerator(userId: string) {
  const user = (await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0];
  return user?.role === "admin" || user?.role === "moderator";
}

function currentUserId(req: Request) {
  return (req as any).laundromatUserId as string;
}

function calculateScore(input: Pick<z.infer<typeof scorecardSchema>, "eveningTraffic" | "competition" | "rent">) {
  return 58
    + (input.eveningTraffic === "high" ? 18 : input.eveningTraffic === "moderate" ? 8 : -8)
    + (input.competition === "low" ? 12 : input.competition === "moderate" ? 4 : -8)
    + (input.rent === "fair" ? 8 : input.rent === "low" ? 14 : -10);
}

function sendValidation(res: Response, parsed: z.SafeParseReturnType<unknown, unknown>) {
  return res.status(400).json({ message: "Please check the fields and try again.", errors: (parsed as { error: z.ZodError }).error.flatten() });
}

export function registerLaundromatRoutes(app: Express, isAuthenticated: any) {
  // All laundromat content is intentionally private to signed-in members.
  app.get("/api/laundromat/discussions", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const rawLimit = Number.parseInt(String(req.query.limit ?? "25"), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 25;
    const cursor = req.query.cursor ? parseId(String(req.query.cursor)) : null;
    const space = req.query.space ? String(req.query.space) : undefined;
    if (space && !LAUNDROMAT_SPACES.includes(space as typeof LAUNDROMAT_SPACES[number])) {
      return res.status(400).json({ message: "Unknown laundromat space." });
    }
    try {
      const conditions = [eq(laundromatDiscussions.status, "visible")];
      if (space) conditions.push(eq(laundromatDiscussions.space, space));
      if (cursor) conditions.push(lt(laundromatDiscussions.id, cursor));
      const rows = await db.select({
        id: laundromatDiscussions.id, space: laundromatDiscussions.space, title: laundromatDiscussions.title,
        body: laundromatDiscussions.body, replyCount: laundromatDiscussions.replyCount, isLocked: laundromatDiscussions.isLocked,
        createdAt: laundromatDiscussions.createdAt, lastActivityAt: laundromatDiscussions.lastActivityAt,
        authorId: laundromatDiscussions.authorId, authorName: users.firstName, authorLastName: users.lastName,
      }).from(laundromatDiscussions).leftJoin(users, eq(users.id, laundromatDiscussions.authorId))
        .where(and(...conditions)).orderBy(desc(laundromatDiscussions.id)).limit(limit + 1);
      const hasMore = rows.length > limit;
      const discussions = rows.slice(0, limit);
      res.json({ discussions, nextCursor: hasMore ? discussions.at(-1)?.id ?? null : null });
    } catch (error) {
      console.error("[laundromat] list discussions failed", error);
      res.status(500).json({ message: "Unable to load community discussions." });
    }
  });

  app.get("/api/laundromat/discussions/:id", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid discussion." });
    try {
      const discussion = (await db.select({
        id: laundromatDiscussions.id, space: laundromatDiscussions.space, title: laundromatDiscussions.title,
        body: laundromatDiscussions.body, replyCount: laundromatDiscussions.replyCount, isLocked: laundromatDiscussions.isLocked,
        createdAt: laundromatDiscussions.createdAt, updatedAt: laundromatDiscussions.updatedAt,
        authorId: laundromatDiscussions.authorId, authorName: users.firstName, authorLastName: users.lastName,
      }).from(laundromatDiscussions).leftJoin(users, eq(users.id, laundromatDiscussions.authorId))
        .where(and(eq(laundromatDiscussions.id, id), eq(laundromatDiscussions.status, "visible"))).limit(1))[0];
      if (!discussion) return res.status(404).json({ message: "Discussion not found." });
      const replies = await db.select({
        id: laundromatDiscussionReplies.id, parentId: laundromatDiscussionReplies.parentId, body: laundromatDiscussionReplies.body,
        authorId: laundromatDiscussionReplies.authorId, createdAt: laundromatDiscussionReplies.createdAt,
        authorName: users.firstName, authorLastName: users.lastName,
      }).from(laundromatDiscussionReplies).leftJoin(users, eq(users.id, laundromatDiscussionReplies.authorId))
        .where(and(eq(laundromatDiscussionReplies.discussionId, id), eq(laundromatDiscussionReplies.status, "visible")))
        .orderBy(laundromatDiscussionReplies.createdAt);
      res.json({ discussion, replies });
    } catch (error) {
      console.error("[laundromat] get discussion failed", error);
      res.status(500).json({ message: "Unable to load the discussion." });
    }
  });

  app.post("/api/laundromat/discussions", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const parsed = discussionSchema.safeParse(req.body);
    if (!parsed.success) return sendValidation(res, parsed);
    const userId = currentUserId(req);
    if (!allowWrite(userId, "discussion", 5)) return res.status(429).json({ message: "Please wait a minute before posting again." });
    try {
      const [discussion] = await db.insert(laundromatDiscussions).values({ authorId: userId, ...parsed.data }).returning();
      res.status(201).json({ discussion });
    } catch (error) {
      console.error("[laundromat] create discussion failed", error);
      res.status(500).json({ message: "Unable to publish your discussion." });
    }
  });

  app.patch("/api/laundromat/discussions/:id", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = discussionSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid discussion." });
    if (!parsed.success) return sendValidation(res, parsed);
    const userId = currentUserId(req);
    try {
      const existing = (await db.select().from(laundromatDiscussions).where(eq(laundromatDiscussions.id, id)).limit(1))[0];
      if (!existing) return res.status(404).json({ message: "Discussion not found." });
      if (existing.authorId !== userId && !(await isModerator(userId))) return res.status(403).json({ message: "You can only edit your own discussion." });
      const [discussion] = await db.update(laundromatDiscussions).set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(laundromatDiscussions.id, id)).returning();
      res.json({ discussion });
    } catch (error) {
      console.error("[laundromat] edit discussion failed", error);
      res.status(500).json({ message: "Unable to update this discussion." });
    }
  });

  app.post("/api/laundromat/discussions/:id/replies", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = replySchema.safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid discussion." });
    if (!parsed.success) return sendValidation(res, parsed);
    const userId = currentUserId(req);
    if (!allowWrite(userId, "reply", 12)) return res.status(429).json({ message: "Please wait a minute before replying again." });
    try {
      const discussion = (await db.select().from(laundromatDiscussions).where(eq(laundromatDiscussions.id, id)).limit(1))[0];
      if (!discussion || discussion.status !== "visible") return res.status(404).json({ message: "Discussion not found." });
      if (discussion.isLocked) return res.status(403).json({ message: "This discussion is locked." });
      if (parsed.data.parentId) {
        const parent = (await db.select().from(laundromatDiscussionReplies).where(and(
          eq(laundromatDiscussionReplies.id, parsed.data.parentId),
          eq(laundromatDiscussionReplies.discussionId, id),
        )).limit(1))[0];
        if (!parent) return res.status(400).json({ message: "That reply does not belong to this discussion." });
      }
      const reply = await db.transaction(async (tx) => {
        const [created] = await tx.insert(laundromatDiscussionReplies).values({ discussionId: id, authorId: userId, ...parsed.data }).returning();
        await tx.update(laundromatDiscussions).set({
          replyCount: sql`${laundromatDiscussions.replyCount} + 1`, lastActivityAt: new Date(), updatedAt: new Date(),
        }).where(eq(laundromatDiscussions.id, id));
        return created;
      });
      res.status(201).json({ reply });
    } catch (error) {
      console.error("[laundromat] create reply failed", error);
      res.status(500).json({ message: "Unable to post your reply." });
    }
  });

  app.patch("/api/laundromat/replies/:id", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = replySchema.pick({ body: true }).safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid reply." });
    if (!parsed.success) return sendValidation(res, parsed);
    const userId = currentUserId(req);
    try {
      const reply = (await db.select().from(laundromatDiscussionReplies).where(eq(laundromatDiscussionReplies.id, id)).limit(1))[0];
      if (!reply) return res.status(404).json({ message: "Reply not found." });
      if (reply.authorId !== userId && !(await isModerator(userId))) return res.status(403).json({ message: "You can only edit your own reply." });
      const [updated] = await db.update(laundromatDiscussionReplies).set({ body: parsed.data.body, editedAt: new Date(), updatedAt: new Date() })
        .where(eq(laundromatDiscussionReplies.id, id)).returning();
      res.json({ reply: updated });
    } catch (error) {
      console.error("[laundromat] edit reply failed", error);
      res.status(500).json({ message: "Unable to update this reply." });
    }
  });

  app.get("/api/laundromat/equipment-plans", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const plans = await db.select().from(laundromatEquipmentPlans).where(eq(laundromatEquipmentPlans.userId, currentUserId(req)))
      .orderBy(desc(laundromatEquipmentPlans.updatedAt));
    res.json({ plans });
  });

  app.post("/api/laundromat/equipment-plans", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) return sendValidation(res, parsed);
    try {
      const [plan] = await db.insert(laundromatEquipmentPlans).values({ userId: currentUserId(req), ...parsed.data }).returning();
      res.status(201).json({ plan });
    } catch (error: any) {
      if (error?.code === "23505") return res.status(409).json({ message: "You already have a plan with that name." });
      res.status(500).json({ message: "Unable to save your equipment plan." });
    }
  });

  app.patch("/api/laundromat/equipment-plans/:id", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = planSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid plan." });
    if (!parsed.success) return sendValidation(res, parsed);
    const [plan] = await db.update(laundromatEquipmentPlans).set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(laundromatEquipmentPlans.id, id), eq(laundromatEquipmentPlans.userId, currentUserId(req)))).returning();
    if (!plan) return res.status(404).json({ message: "Plan not found." });
    res.json({ plan });
  });

  app.get("/api/laundromat/scorecards", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const scorecards = await db.select().from(laundromatSiteScorecards).where(eq(laundromatSiteScorecards.userId, currentUserId(req)))
      .orderBy(desc(laundromatSiteScorecards.updatedAt));
    res.json({ scorecards });
  });

  app.post("/api/laundromat/scorecards", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const parsed = scorecardSchema.safeParse(req.body);
    if (!parsed.success) return sendValidation(res, parsed);
    try {
      const [scorecard] = await db.insert(laundromatSiteScorecards).values({
        userId: currentUserId(req), ...parsed.data, score: calculateScore(parsed.data),
      }).returning();
      res.status(201).json({ scorecard });
    } catch (error: any) {
      if (error?.code === "23505") return res.status(409).json({ message: "Use a different name for this scorecard." });
      res.status(500).json({ message: "Unable to save your site scorecard." });
    }
  });

  app.patch("/api/laundromat/scorecards/:id", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = scorecardSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid scorecard." });
    if (!parsed.success) return sendValidation(res, parsed);
    const [scorecard] = await db.update(laundromatSiteScorecards).set({
      ...parsed.data, score: calculateScore(parsed.data), updatedAt: new Date(),
    })
      .where(and(eq(laundromatSiteScorecards.id, id), eq(laundromatSiteScorecards.userId, currentUserId(req)))).returning();
    if (!scorecard) return res.status(404).json({ message: "Scorecard not found." });
    res.json({ scorecard });
  });

  app.post("/api/laundromat/:targetType(discussions|replies)/:id/report", isAuthenticated, requireLaundromatMember, async (req, res) => {
    const id = parseId(req.params.id);
    const parsed = reportSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid report target." });
    if (!parsed.success) return sendValidation(res, parsed);
    const targetType = req.params.targetType === "discussions" ? "discussion" : "reply";
    const userId = currentUserId(req);
    if (!allowWrite(userId, "report", 5)) return res.status(429).json({ message: "Too many reports. Please try again shortly." });
    try {
      const target = targetType === "discussion"
        ? (await db.select({ id: laundromatDiscussions.id }).from(laundromatDiscussions).where(eq(laundromatDiscussions.id, id)).limit(1))[0]
        : (await db.select({ id: laundromatDiscussionReplies.id }).from(laundromatDiscussionReplies).where(eq(laundromatDiscussionReplies.id, id)).limit(1))[0];
      if (!target) return res.status(404).json({ message: "Content not found." });
      await db.insert(laundromatDiscussionReports).values({ reporterId: userId, targetType, targetId: id, ...parsed.data });
      res.status(201).json({ message: "Thanks. Your report has been sent to the moderator team." });
    } catch (error: any) {
      if (error?.code === "23505") return res.status(409).json({ message: "You have already reported this content." });
      res.status(500).json({ message: "Unable to submit your report." });
    }
  });

  app.get("/api/admin/laundromat/reports", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId || !(await isModerator(userId))) return res.status(403).json({ message: "Moderator access required." });
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const reports = await db.select().from(laundromatDiscussionReports)
      .where(eq(laundromatDiscussionReports.status, status)).orderBy(desc(laundromatDiscussionReports.createdAt)).limit(100);
    res.json({ reports });
  });

  app.patch("/api/admin/laundromat/reports/:id", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const id = parseId(req.params.id);
    const parsed = z.object({
      status: z.enum(["in_review", "resolved", "dismissed"]),
      notes: z.string().trim().max(2_000).optional(),
      targetStatus: z.enum(["visible", "hidden", "removed"]).optional(),
    }).safeParse(req.body);
    if (!userId || !(await isModerator(userId))) return res.status(403).json({ message: "Moderator access required." });
    if (!id) return res.status(400).json({ message: "Invalid report." });
    if (!parsed.success) return sendValidation(res, parsed);
    const report = (await db.select().from(laundromatDiscussionReports).where(eq(laundromatDiscussionReports.id, id)).limit(1))[0];
    if (!report) return res.status(404).json({ message: "Report not found." });
    await db.transaction(async (tx) => {
      await tx.update(laundromatDiscussionReports).set({
        status: parsed.data.status, moderatorNotes: parsed.data.notes ?? null, moderatorId: userId,
        resolvedAt: parsed.data.status === "in_review" ? null : new Date(),
      }).where(eq(laundromatDiscussionReports.id, id));
      if (parsed.data.targetStatus) {
        if (report.targetType === "discussion") {
          await tx.update(laundromatDiscussions).set({ status: parsed.data.targetStatus, updatedAt: new Date() })
            .where(eq(laundromatDiscussions.id, report.targetId));
        } else {
          const reply = (await tx.select().from(laundromatDiscussionReplies)
            .where(eq(laundromatDiscussionReplies.id, report.targetId)).limit(1))[0];
          if (reply) {
            const [updatedReply] = await tx.update(laundromatDiscussionReplies)
              .set({ status: parsed.data.targetStatus, updatedAt: new Date() })
              .where(and(
                eq(laundromatDiscussionReplies.id, reply.id),
                eq(laundromatDiscussionReplies.status, reply.status),
              ))
              .returning({ id: laundromatDiscussionReplies.id });
            const visibilityChanged = (reply.status === "visible") !== (parsed.data.targetStatus === "visible");
            if (updatedReply && visibilityChanged) {
              const delta = parsed.data.targetStatus === "visible" ? 1 : -1;
              await tx.update(laundromatDiscussions).set({
                replyCount: sql`GREATEST(${laundromatDiscussions.replyCount} + ${delta}, 0)`,
                updatedAt: new Date(),
              }).where(eq(laundromatDiscussions.id, reply.discussionId));
            }
          }
        }
      }
    });
    res.json({ message: "Moderation decision saved." });
  });
}