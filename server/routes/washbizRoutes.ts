import type { Express, Response } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { getUserId } from "../lib/authUtils";
import { publicRateLimit } from "../middleware/publicRateLimit";
import {
  forumCategories,
  forumPosts,
  forumThreads,
  forumVotes,
  users,
  washbizCourseProgress,
  washbizEquipmentPlanItems,
  washbizScorecards,
} from "@shared/schema";

const BOARDS = [
  { name: "Start Smart", slug: "washbiz-start-smart", description: "Foundations, market research, and first-store decisions.", icon: "Target", order: 1010 },
  { name: "Buy Right", slug: "washbiz-buy-right", description: "Locations, leases, equipment, and deal analysis.", icon: "Store", order: 1020 },
  { name: "Run Profitable", slug: "washbiz-run-profitable", description: "Operations, margins, and the numbers that matter.", icon: "Gauge", order: 1030 },
  { name: "Scale the Legacy", slug: "washbiz-scale-legacy", description: "Second stores, team systems, and long-term ownership.", icon: "TrendingUp", order: 1040 },
] as const;

const BOARD_SLUGS = BOARDS.map((board) => board.slug);
const EQUIPMENT = {
  "hard-mount-washer": "Hard-Mount Washer",
  "stack-dryer": "Stack Dryer",
  "single-dryer": "Single Dryer",
  "stack-combo": "Stack Combo",
} as const;
const TRAFFIC_AND_COMPETITION = ["high", "moderate", "low"] as const;
const RENT_LEVELS = ["high", "fair", "low"] as const;

function currentUserId(req: any): string | undefined {
  return getUserId(req) ?? req.session?.userId;
}

function scoreSite(eveningTraffic: string, competition: string, rent: string): number {
  return 58
    + (eveningTraffic === "high" ? 18 : eveningTraffic === "moderate" ? 8 : -8)
    + (competition === "low" ? 12 : competition === "moderate" ? 4 : -8)
    + (rent === "fair" ? 8 : rent === "low" ? 14 : -10);
}

function isWashbizBoard(slug: string): boolean {
  return BOARD_SLUGS.includes(slug as typeof BOARD_SLUGS[number]);
}

const communityWriteLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 12,
  bucketName: "washbiz-community-write",
  keyFn: (req) => currentUserId(req as any) ?? req.ip ?? "anonymous",
});

async function getWashbizThread(threadId: number) {
  return (await db.select({
    id: forumThreads.id,
    categoryId: forumThreads.categoryId,
    title: forumThreads.title,
    replyCount: forumThreads.replyCount,
    isLocked: forumThreads.isLocked,
  }).from(forumThreads)
    .innerJoin(forumCategories, eq(forumCategories.id, forumThreads.categoryId))
    .where(and(eq(forumThreads.id, threadId), inArray(forumCategories.slug, BOARD_SLUGS)))
    .limit(1))[0];
}

export async function seedWashbizBoards() {
  await db.insert(forumCategories).values([...BOARDS]).onConflictDoNothing({ target: forumCategories.slug });
}

export function registerWashbizRoutes(app: Express, isAuthenticated: any) {
  app.get("/api/washbiz/community/boards", isAuthenticated, async (_req, res) => {
    try {
      const boards = await db.select({
        id: forumCategories.id,
        name: forumCategories.name,
        slug: forumCategories.slug,
        description: forumCategories.description,
      }).from(forumCategories)
        .where(and(eq(forumCategories.isActive, true), inArray(forumCategories.slug, BOARD_SLUGS)))
        .orderBy(forumCategories.order);
      res.json({ boards });
    } catch (error) {
      res.status(500).json({ message: "Could not load community spaces." });
    }
  });

  app.get("/api/washbiz/community/threads", isAuthenticated, async (req, res) => {
    try {
      const board = String(req.query.board || "all");
      if (board !== "all" && !isWashbizBoard(board)) {
        return res.status(400).json({ message: "Invalid community space." });
      }
      const filters = [inArray(forumCategories.slug, BOARD_SLUGS), eq(forumPosts.isOriginal, true), eq(forumPosts.isDeleted, false)];
      if (board !== "all") filters.push(eq(forumCategories.slug, board));
      const threads = await db.select({
        id: forumThreads.id,
        postId: forumPosts.id,
        title: forumThreads.title,
        replyCount: forumThreads.replyCount,
        score: forumPosts.score,
        content: forumPosts.content,
        createdAt: forumThreads.createdAt,
        lastActivityAt: forumThreads.lastActivityAt,
        authorId: forumThreads.authorId,
        authorName: users.firstName,
        categoryName: forumCategories.name,
        categorySlug: forumCategories.slug,
      }).from(forumThreads)
        .innerJoin(forumPosts, and(eq(forumPosts.threadId, forumThreads.id), eq(forumPosts.isOriginal, true)))
        .innerJoin(forumCategories, eq(forumCategories.id, forumThreads.categoryId))
        .leftJoin(users, eq(users.id, forumThreads.authorId))
        .where(and(...filters))
        .orderBy(desc(forumThreads.lastActivityAt))
        .limit(50);
      res.json({ threads });
    } catch (error) {
      console.error("[washbiz] community list failed", error);
      res.status(500).json({ message: "Could not load discussions." });
    }
  });

  app.get("/api/washbiz/community/threads/:id", isAuthenticated, async (req, res) => {
    try {
      const threadId = Number(req.params.id);
      if (!Number.isInteger(threadId)) return res.status(400).json({ message: "Invalid discussion." });
      const thread = await getWashbizThread(threadId);
      if (!thread) return res.status(404).json({ message: "Discussion not found." });
      const posts = await db.select({
        id: forumPosts.id,
        parentId: forumPosts.parentId,
        content: forumPosts.content,
        score: forumPosts.score,
        isOriginal: forumPosts.isOriginal,
        createdAt: forumPosts.createdAt,
        authorId: forumPosts.authorId,
        authorName: users.firstName,
      }).from(forumPosts)
        .leftJoin(users, eq(users.id, forumPosts.authorId))
        .where(and(eq(forumPosts.threadId, threadId), eq(forumPosts.isDeleted, false)))
        .orderBy(forumPosts.createdAt);
      res.json({ thread, posts });
    } catch (error) {
      res.status(500).json({ message: "Could not load this discussion." });
    }
  });

  app.post("/api/washbiz/community/threads", isAuthenticated, communityWriteLimiter, async (req: any, res: Response) => {
    try {
      const userId = currentUserId(req);
      const boardSlug = String(req.body?.boardSlug || "");
      const title = String(req.body?.title || "").trim().slice(0, 200);
      const content = String(req.body?.content || "").trim().slice(0, 10_000);
      if (!userId || !isWashbizBoard(boardSlug) || !title || !content) {
        return res.status(400).json({ message: "Choose a space, title, and discussion text." });
      }
      const board = (await db.select().from(forumCategories).where(eq(forumCategories.slug, boardSlug)).limit(1))[0];
      if (!board) return res.status(404).json({ message: "Community space not found." });
      const result = await db.transaction(async (tx) => {
        const thread = (await tx.insert(forumThreads).values({
          categoryId: board.id,
          authorId: userId,
          title,
          slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "discussion"}-${Date.now()}`,
          lastActivityAt: new Date(),
        }).returning())[0];
        const post = (await tx.insert(forumPosts).values({
          threadId: thread.id,
          authorId: userId,
          content,
          isOriginal: true,
        }).returning())[0];
        return { thread, post };
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("[washbiz] discussion create failed", error);
      res.status(500).json({ message: "Could not publish your discussion." });
    }
  });

  app.post("/api/washbiz/community/threads/:id/replies", isAuthenticated, communityWriteLimiter, async (req: any, res: Response) => {
    try {
      const userId = currentUserId(req);
      const threadId = Number(req.params.id);
      const content = String(req.body?.content || "").trim().slice(0, 10_000);
      if (!userId || !Number.isInteger(threadId) || !content) return res.status(400).json({ message: "A reply is required." });
      const thread = await getWashbizThread(threadId);
      if (!thread) return res.status(404).json({ message: "Discussion not found." });
      if (thread.isLocked) return res.status(403).json({ message: "This discussion is locked." });
      const post = await db.transaction(async (tx) => {
        const reply = (await tx.insert(forumPosts).values({ threadId, authorId: userId, content }).returning())[0];
        await tx.update(forumThreads).set({
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastActivityAt: new Date(),
        }).where(eq(forumThreads.id, threadId));
        return reply;
      });
      res.status(201).json({ post });
    } catch (error) {
      res.status(500).json({ message: "Could not publish your reply." });
    }
  });

  app.post("/api/washbiz/community/posts/:id/helpful", isAuthenticated, communityWriteLimiter, async (req: any, res: Response) => {
    try {
      const userId = currentUserId(req);
      const postId = Number(req.params.id);
      if (!userId || !Number.isInteger(postId)) return res.status(400).json({ message: "Invalid reaction." });
      const post = (await db.select({
        id: forumPosts.id,
        authorId: forumPosts.authorId,
        score: forumPosts.score,
        threadId: forumPosts.threadId,
      }).from(forumPosts).where(eq(forumPosts.id, postId)).limit(1))[0];
      if (!post || !(await getWashbizThread(post.threadId))) return res.status(404).json({ message: "Discussion post not found." });
      if (post.authorId === userId) return res.status(400).json({ message: "You cannot mark your own post helpful." });
      const updated = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT id FROM forum_posts WHERE id = ${postId} FOR UPDATE`);
        const existing = (await tx.select().from(forumVotes)
          .where(and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId))).limit(1))[0];
        const nextValue = existing?.value === 1 ? 0 : 1;
        if (existing && nextValue === 0) {
          await tx.delete(forumVotes).where(and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId)));
        } else if (existing) {
          await tx.update(forumVotes).set({ value: 1 }).where(and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId)));
        } else {
          await tx.insert(forumVotes).values({ userId, postId, value: 1 });
        }
        await tx.update(forumPosts).set({ score: sql`${forumPosts.score} + ${nextValue - (existing?.value ?? 0)}` }).where(eq(forumPosts.id, postId));
        const row = (await tx.select({ score: forumPosts.score }).from(forumPosts).where(eq(forumPosts.id, postId)).limit(1))[0];
        return { score: row?.score ?? 0, helpful: nextValue === 1 };
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Could not save your reaction." });
    }
  });

  app.get("/api/washbiz/course-progress", isAuthenticated, async (req: any, res) => {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await db.insert(washbizCourseProgress).values({
      userId,
      completedLessons: 0,
      reflection: "",
      revision: 1,
    }).onConflictDoNothing({ target: washbizCourseProgress.userId });
    const progress = (await db.select().from(washbizCourseProgress)
      .where(eq(washbizCourseProgress.userId, userId)).limit(1))[0];
    res.json(progress);
  });

  app.put("/api/washbiz/course-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = currentUserId(req);
      const completedLessons = Number(req.body?.completedLessons);
      const reflection = String(req.body?.reflection || "").trim().slice(0, 4_000);
      const expectedRevision = Number(req.body?.revision);
      if (!userId || !Number.isInteger(completedLessons) || completedLessons < 0 || completedLessons > 6) {
        return res.status(400).json({ message: "Invalid course progress." });
      }
      if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
        return res.status(400).json({ message: "Invalid progress version." });
      }
      const progress = (await db.update(washbizCourseProgress).set({
        completedLessons: sql`greatest(${washbizCourseProgress.completedLessons}, ${completedLessons})`,
        reflection,
        revision: sql`${washbizCourseProgress.revision} + 1`,
        updatedAt: new Date(),
      }).where(and(
        eq(washbizCourseProgress.userId, userId),
        eq(washbizCourseProgress.revision, expectedRevision),
      ))
        .returning())[0];
      if (!progress) return res.status(409).json({ message: "Your course work changed on another device. Reloaded data is required before saving again." });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Could not save course progress." });
    }
  });

  app.get("/api/washbiz/scorecards", isAuthenticated, async (req: any, res) => {
    const userId = currentUserId(req);
    const scorecards = userId
      ? await db.select().from(washbizScorecards).where(eq(washbizScorecards.userId, userId)).orderBy(desc(washbizScorecards.updatedAt)).limit(20)
      : [];
    res.json({ scorecards });
  });

  app.post("/api/washbiz/scorecards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = currentUserId(req);
      const siteName = String(req.body?.siteName || "").trim().slice(0, 160);
      const eveningTraffic = String(req.body?.eveningTraffic || "");
      const competition = String(req.body?.competition || "");
      const rent = String(req.body?.rent || "");
      if (!userId || !siteName || !TRAFFIC_AND_COMPETITION.includes(eveningTraffic as typeof TRAFFIC_AND_COMPETITION[number]) || !TRAFFIC_AND_COMPETITION.includes(competition as typeof TRAFFIC_AND_COMPETITION[number]) || !RENT_LEVELS.includes(rent as typeof RENT_LEVELS[number])) {
        return res.status(400).json({ message: "Enter a site and choose each scorecard factor." });
      }
      const scorecard = (await db.insert(washbizScorecards).values({
        userId, siteName, eveningTraffic, competition, rent,
        score: scoreSite(eveningTraffic, competition, rent),
        updatedAt: new Date(),
      }).returning())[0];
      res.status(201).json({ scorecard });
    } catch (error) {
      res.status(500).json({ message: "Could not save this scorecard." });
    }
  });

  app.get("/api/washbiz/equipment-plan", isAuthenticated, async (req: any, res) => {
    const userId = currentUserId(req);
    const items = userId
      ? await db.select().from(washbizEquipmentPlanItems).where(eq(washbizEquipmentPlanItems.userId, userId)).orderBy(desc(washbizEquipmentPlanItems.createdAt))
      : [];
    res.json({ items });
  });

  app.put("/api/washbiz/equipment-plan/:equipmentKey", isAuthenticated, async (req: any, res) => {
    try {
      const userId = currentUserId(req);
      const equipmentKey = String(req.params.equipmentKey);
      const displayName = EQUIPMENT[equipmentKey as keyof typeof EQUIPMENT];
      if (!userId || !displayName) return res.status(400).json({ message: "Invalid equipment selection." });
      const inserted = (await db.insert(washbizEquipmentPlanItems)
        .values({ userId, equipmentKey, displayName })
        .onConflictDoNothing({ target: [washbizEquipmentPlanItems.userId, washbizEquipmentPlanItems.equipmentKey] })
        .returning())[0];
      const item = inserted ?? (await db.select().from(washbizEquipmentPlanItems).where(and(
        eq(washbizEquipmentPlanItems.userId, userId),
        eq(washbizEquipmentPlanItems.equipmentKey, equipmentKey),
      )).limit(1))[0];
      res.status(inserted ? 201 : 200).json({ saved: true, item });
    } catch (error) {
      res.status(500).json({ message: "Could not update your equipment plan." });
    }
  });

  app.delete("/api/washbiz/equipment-plan/:equipmentKey", isAuthenticated, async (req: any, res) => {
    try {
      const userId = currentUserId(req);
      const equipmentKey = String(req.params.equipmentKey);
      if (!userId || !EQUIPMENT[equipmentKey as keyof typeof EQUIPMENT]) {
        return res.status(400).json({ message: "Invalid equipment selection." });
      }
      await db.delete(washbizEquipmentPlanItems).where(and(
        eq(washbizEquipmentPlanItems.userId, userId),
        eq(washbizEquipmentPlanItems.equipmentKey, equipmentKey),
      ));
      res.json({ saved: false, equipmentKey });
    } catch (error) {
      res.status(500).json({ message: "Could not update your equipment plan." });
    }
  });
}