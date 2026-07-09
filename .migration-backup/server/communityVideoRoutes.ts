import type { Express, RequestHandler } from "express";
import { db } from "./db";
import {
  communityVideos, videoLikes, videoComments, videoReposts, videoSaves,
  sparksFollows, users, userProfiles, userSettings,
} from "@shared/schema";
import { eq, desc, and, sql, inArray, ne } from "drizzle-orm";
import { getUserId } from "./lib/authUtils";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { z } from "zod";

const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const COMMENT_MAX_LEN = 1000;
const objectStorage = new ObjectStorageService();

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreVideo(
  video: { deficitTags: string[]; tags: string[]; likeCount: number; commentCount: number; isFeatured: boolean; isPinned: boolean; createdAt: Date; boostedUntil?: Date | string | null },
  userDeficits: string[],
  userGoals: string[],
): number {
  const isBoosted = video.boostedUntil ? new Date(video.boostedUntil) > new Date() : false;
  const deficitOverlap = video.deficitTags.filter((t) => userDeficits.includes(t)).length;
  const goalOverlap = video.tags.filter((t) =>
    userGoals.some((g) => g.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(g.toLowerCase()))
  ).length;
  const daysSince = (Date.now() - new Date(video.createdAt).getTime()) / 86_400_000;
  const recencyScore = Math.max(0, 7 - daysSince) * 0.5;
  const engagementScore = Math.log1p(video.likeCount) * 0.8 + Math.log1p(video.commentCount) * 0.4;
  return (
    (video.isFeatured ? 8 : 0) +
    (video.isPinned ? 4 : 0) +
    (isBoosted ? 6 : 0) +
    deficitOverlap * 3 +
    goalOverlap * 2 +
    recencyScore +
    engagementScore
  );
}

async function getUserContext(userId: string | null): Promise<{ deficits: string[]; goals: string[] }> {
  if (!userId) return { deficits: [], goals: [] };
  const profile = await db
    .select({ deficits: userProfiles.deficits, recoveryGoals: userProfiles.recoveryGoals })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (!profile[0]) return { deficits: [], goals: [] };
  const raw = profile[0].deficits as Record<string, number> | null;
  const deficits = raw ? Object.entries(raw).filter(([, v]) => v > 0).map(([k]) => k) : [];
  const goals = (profile[0].recoveryGoals as string[] | null) ?? [];
  return { deficits, goals };
}

// Shared SELECT columns for feed + single-video
const videoSelectCols = {
  id: communityVideos.id,
  uploaderId: communityVideos.uploaderId,
  title: communityVideos.title,
  description: communityVideos.description,
  tags: communityVideos.tags,
  deficitTags: communityVideos.deficitTags,
  videoUrl: communityVideos.videoUrl,
  thumbnailUrl: communityVideos.thumbnailUrl,
  durationSeconds: communityVideos.durationSeconds,
  viewCount: communityVideos.viewCount,
  likeCount: communityVideos.likeCount,
  commentCount: communityVideos.commentCount,
  repostCount: communityVideos.repostCount,
  saveCount: communityVideos.saveCount,
  shareCount: communityVideos.shareCount,
  isFeatured: communityVideos.isFeatured,
  isPinned: communityVideos.isPinned,
  isPremium: communityVideos.isPremium,
  source: communityVideos.source,
  createdAt: communityVideos.createdAt,
  boostedUntil: sql<Date | null>`community_videos.boosted_until`,
  uploaderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, 'Survivor')`,
  uploaderAvatar: users.profileImageUrl,
  uploaderIsTherapist: users.isVerifiedTherapist,
  uploaderUsername: userSettings.username,
};

// ── route registration ────────────────────────────────────────────────────────

export function registerCommunityVideoRoutes(app: Express, isAuthenticated: RequestHandler): void {

  // Self-provision boosted_until column (can't db:push over stripe schema)
  db.execute(sql`ALTER TABLE community_videos ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP`).catch(() => {});

  // ── Upload presigned URLs ───────────────────────────────────────────────────
  app.post("/api/community/video/upload-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to upload." });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("[sparks] upload-url error:", err);
      res.status(500).json({ message: "Could not start upload — try again." });
    }
  });

  app.post("/api/community/video/thumbnail-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to upload." });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("[sparks] thumbnail-url error:", err);
      res.status(500).json({ message: "Could not start thumbnail upload." });
    }
  });

  // ── Tag autocomplete ────────────────────────────────────────────────────────
  app.get("/api/community/tags/search", async (req: any, res) => {
    try {
      const q = String(req.query.q ?? "").replace(/^#/, "").trim();
      if (!q) return res.json({ tags: [] });
      const rows = await db.execute(sql`
        SELECT tag, COUNT(*)::int AS video_count
          FROM community_videos cv, unnest(cv.tags) AS tag
         WHERE LOWER(tag) LIKE LOWER(${q + "%"})
           AND cv.is_public = true
         GROUP BY tag
         ORDER BY video_count DESC
         LIMIT 10
      `);
      res.json({ tags: (rows.rows as any[]).map((r) => ({ tag: r.tag, count: Number(r.video_count) })) });
    } catch (err) {
      console.error("[sparks] tag-search error:", err);
      res.json({ tags: [] });
    }
  });

  // ── Finalize + create video record ─────────────────────────────────────────
  app.post("/api/community/video", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to post." });

      const schema = z.object({
        objectPath: z.string().startsWith("/objects/"),
        thumbnailObjectPath: z.string().startsWith("/objects/").optional(),
        title: z.string().min(1).max(120),
        description: z.string().max(2000).optional(),
        tags: z.array(z.string().max(40)).max(10).default([]),
        deficitTags: z.array(z.string().max(40)).max(10).default([]),
        durationSeconds: z.number().int().positive().optional(),
        fileSizeBytes: z.number().int().positive().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid fields.", errors: parsed.error.issues });
      const { objectPath, thumbnailObjectPath, title, description, tags, deficitTags, durationSeconds, fileSizeBytes } = parsed.data;

      const file = await objectStorage.getObjectEntityFile(objectPath);
      const [metadata] = await file.getMetadata();
      const size = parseInt(String(metadata.size || "0"), 10);
      const contentType = String(metadata.contentType || "");

      if (!contentType.startsWith("video/")) {
        await file.delete().catch(() => {});
        return res.status(415).json({ message: "Only video files are accepted." });
      }
      if (size > VIDEO_MAX_BYTES) {
        await file.delete().catch(() => {});
        return res.status(413).json({ message: "Video must be under 500 MB." });
      }

      const [video] = await db.insert(communityVideos).values({
        uploaderId: userId, title, description: description ?? null, tags, deficitTags,
        videoUrl: objectPath, thumbnailUrl: thumbnailObjectPath ?? null,
        durationSeconds: durationSeconds ?? null, fileSizeBytes: fileSizeBytes ?? size ?? null,
        isPublic: true, source: "upload",
      }).returning();

      res.json(video);
    } catch (err) {
      console.error("[sparks] create error:", err);
      res.status(500).json({ message: "Could not save video — try again." });
    }
  });

  // ── Personalized feed ───────────────────────────────────────────────────────
  app.get("/api/community/videos", async (req: any, res) => {
    try {
      const userId = getUserId(req) ?? null;
      const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10));
      const q = String(req.query.q ?? "").trim().slice(0, 100);
      const topic = String(req.query.topic ?? "").trim().slice(0, 40);
      const limit = 24;

      const [{ deficits, goals }, allVideos] = await Promise.all([
        getUserContext(userId),
        db
          .select(videoSelectCols)
          .from(communityVideos)
          .leftJoin(users, eq(communityVideos.uploaderId, users.id))
          .leftJoin(userSettings, eq(communityVideos.uploaderId, userSettings.userId))
          .where(and(
            eq(communityVideos.isPublic, true),
            q ? sql`(${communityVideos.title} ILIKE ${`%${q}%`} OR ${communityVideos.description} ILIKE ${`%${q}%`})` : undefined,
            topic ? sql`${topic}::text = ANY(${communityVideos.deficitTags})` : undefined,
          ))
          .orderBy(desc(communityVideos.isPinned), desc(communityVideos.isFeatured), desc(communityVideos.createdAt))
          .limit(q || topic ? 500 : 200),
      ]);

      const scored = allVideos
        .map((v) => ({ ...v, score: scoreVideo(v as any, deficits, goals) }))
        .sort((a, b) => b.score - a.score)
        .slice(page * limit, (page + 1) * limit);

      let likedIds = new Set<number>();
      let repostedIds = new Set<number>();
      let savedIds = new Set<number>();
      if (userId && scored.length) {
        const ids = scored.map((v) => v.id);
        const [likes, reposts, saves] = await Promise.all([
          db.select({ videoId: videoLikes.videoId }).from(videoLikes).where(and(eq(videoLikes.userId, userId), inArray(videoLikes.videoId, ids))),
          db.select({ videoId: videoReposts.videoId }).from(videoReposts).where(and(eq(videoReposts.userId, userId), inArray(videoReposts.videoId, ids))),
          db.select({ videoId: videoSaves.videoId }).from(videoSaves).where(and(eq(videoSaves.userId, userId), inArray(videoSaves.videoId, ids))),
        ]);
        likedIds = new Set(likes.map((l) => l.videoId));
        repostedIds = new Set(reposts.map((r) => r.videoId));
        savedIds = new Set(saves.map((s) => s.videoId));
      }

      res.json({
        videos: scored.map((v) => ({
          ...v,
          isLikedByMe: likedIds.has(v.id),
          isRepostedByMe: repostedIds.has(v.id),
          isSavedByMe: savedIds.has(v.id),
        })),
        hasMore: allVideos.length > (page + 1) * limit,
        page,
      });
    } catch (err) {
      console.error("[sparks] feed error:", err);
      res.status(500).json({ message: "Could not load feed." });
    }
  });

  // ── Following feed ──────────────────────────────────────────────────────────
  app.get("/api/community/videos/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });
      const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10));
      const limit = 24;

      const followingIds = await db
        .select({ followingId: sparksFollows.followingId })
        .from(sparksFollows)
        .where(eq(sparksFollows.followerId, userId));
      const ids = followingIds.map((f) => f.followingId);

      if (!ids.length) return res.json({ videos: [], hasMore: false, page });

      const allVideos = await db
        .select(videoSelectCols)
        .from(communityVideos)
        .leftJoin(users, eq(communityVideos.uploaderId, users.id))
        .leftJoin(userSettings, eq(communityVideos.uploaderId, userSettings.userId))
        .where(and(eq(communityVideos.isPublic, true), inArray(communityVideos.uploaderId as any, ids)))
        .orderBy(desc(communityVideos.createdAt))
        .limit(200);

      const paged = allVideos.slice(page * limit, (page + 1) * limit);

      const videoIds = paged.map((v) => v.id);
      const [likes, reposts, saves] = videoIds.length
        ? await Promise.all([
            db.select({ videoId: videoLikes.videoId }).from(videoLikes).where(and(eq(videoLikes.userId, userId), inArray(videoLikes.videoId, videoIds))),
            db.select({ videoId: videoReposts.videoId }).from(videoReposts).where(and(eq(videoReposts.userId, userId), inArray(videoReposts.videoId, videoIds))),
            db.select({ videoId: videoSaves.videoId }).from(videoSaves).where(and(eq(videoSaves.userId, userId), inArray(videoSaves.videoId, videoIds))),
          ])
        : [[], [], []];

      const likedSet = new Set(likes.map((l) => l.videoId));
      const repostedSet = new Set(reposts.map((r) => r.videoId));
      const savedSet = new Set(saves.map((s) => s.videoId));

      res.json({
        videos: paged.map((v) => ({
          ...v,
          isLikedByMe: likedSet.has(v.id),
          isRepostedByMe: repostedSet.has(v.id),
          isSavedByMe: savedSet.has(v.id),
        })),
        hasMore: allVideos.length > (page + 1) * limit,
        page,
      });
    } catch (err) {
      console.error("[sparks] following feed error:", err);
      res.status(500).json({ message: "Could not load feed." });
    }
  });

  // ── Profile by username ─────────────────────────────────────────────────────
  app.get("/api/sparks/profile/:username", async (req: any, res) => {
    try {
      const { username } = req.params;
      const currentUserId = getUserId(req) ?? null;

      const usernameRow = await db
        .select({ userId: userSettings.userId })
        .from(userSettings)
        .where(eq(userSettings.username, username))
        .limit(1);
      if (!usernameRow[0]) return res.status(404).json({ message: "User not found." });
      return res.json({ userId: usernameRow[0].userId });
    } catch (err) {
      console.error("[sparks] profile-by-username error:", err);
      res.status(500).json({ message: "Could not load profile." });
    }
  });

  // ── Profile by userId ───────────────────────────────────────────────────────
  app.get("/api/community/videos/profile/:userId", async (req: any, res) => {
    try {
      const { userId: profileUserId } = req.params;
      const currentUserId = getUserId(req) ?? null;

      const [profileVideos, uploader, profileRow, usernameRow, followerCount, followingCount, isFollowedRow] = await Promise.all([
        db
          .select({
            id: communityVideos.id,
            title: communityVideos.title,
            thumbnailUrl: communityVideos.thumbnailUrl,
            videoUrl: communityVideos.videoUrl,
            durationSeconds: communityVideos.durationSeconds,
            viewCount: communityVideos.viewCount,
            likeCount: communityVideos.likeCount,
            commentCount: communityVideos.commentCount,
            repostCount: communityVideos.repostCount,
            saveCount: communityVideos.saveCount,
            isFeatured: communityVideos.isFeatured,
            isPinned: communityVideos.isPinned,
            isPremium: communityVideos.isPremium,
            deficitTags: communityVideos.deficitTags,
            tags: communityVideos.tags,
            createdAt: communityVideos.createdAt,
          })
          .from(communityVideos)
          .where(and(eq(communityVideos.uploaderId, profileUserId), eq(communityVideos.isPublic, true)))
          .orderBy(desc(communityVideos.isPinned), desc(communityVideos.createdAt)),
        db.select().from(users).where(eq(users.id, profileUserId)).limit(1),
        db.select({ bio: userProfiles.bio }).from(userProfiles).where(eq(userProfiles.userId, profileUserId)).limit(1),
        db.select({ username: userSettings.username }).from(userSettings).where(eq(userSettings.userId, profileUserId)).limit(1),
        db.select({ count: sql<number>`cast(count(*) as int)` }).from(sparksFollows).where(eq(sparksFollows.followingId, profileUserId)),
        db.select({ count: sql<number>`cast(count(*) as int)` }).from(sparksFollows).where(eq(sparksFollows.followerId, profileUserId)),
        currentUserId
          ? db.select({ id: sparksFollows.id }).from(sparksFollows).where(and(eq(sparksFollows.followerId, currentUserId), eq(sparksFollows.followingId, profileUserId))).limit(1)
          : Promise.resolve([]),
      ]);

      if (!uploader[0]) return res.status(404).json({ message: "User not found." });
      const u = uploader[0];
      const totalViews = profileVideos.reduce((s, v) => s + v.viewCount, 0);
      const totalLikes = profileVideos.reduce((s, v) => s + v.likeCount, 0);

      let likedIds = new Set<number>();
      let repostedIds = new Set<number>();
      let savedIds = new Set<number>();
      if (currentUserId && profileVideos.length) {
        const ids = profileVideos.map((v) => v.id);
        const [likes, reposts, saves] = await Promise.all([
          db.select({ videoId: videoLikes.videoId }).from(videoLikes).where(and(eq(videoLikes.userId, currentUserId), inArray(videoLikes.videoId, ids))),
          db.select({ videoId: videoReposts.videoId }).from(videoReposts).where(and(eq(videoReposts.userId, currentUserId), inArray(videoReposts.videoId, ids))),
          db.select({ videoId: videoSaves.videoId }).from(videoSaves).where(and(eq(videoSaves.userId, currentUserId), inArray(videoSaves.videoId, ids))),
        ]);
        likedIds = new Set(likes.map((l) => l.videoId));
        repostedIds = new Set(reposts.map((r) => r.videoId));
        savedIds = new Set(saves.map((s) => s.videoId));
      }

      res.json({
        uploader: {
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Survivor",
          avatar: u.profileImageUrl,
          isTherapist: u.isVerifiedTherapist,
          bio: profileRow[0]?.bio ?? null,
          username: usernameRow[0]?.username ?? null,
          videoCount: profileVideos.length,
          totalViews,
          totalLikes,
          followerCount: followerCount[0]?.count ?? 0,
          followingCount: followingCount[0]?.count ?? 0,
        },
        videos: profileVideos.map((v) => ({
          ...v,
          uploaderId: profileUserId,
          source: "upload",
          isPremium: (v as any).isPremium ?? false,
          uploaderName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Survivor",
          uploaderAvatar: u.profileImageUrl,
          uploaderIsTherapist: u.isVerifiedTherapist,
          uploaderUsername: usernameRow[0]?.username ?? null,
          isLikedByMe: likedIds.has(v.id),
          isRepostedByMe: repostedIds.has(v.id),
          isSavedByMe: savedIds.has(v.id),
        })),
        isOwnProfile: currentUserId === profileUserId,
        isFollowedByMe: (isFollowedRow as any[]).length > 0,
      });
    } catch (err) {
      console.error("[sparks] profile error:", err);
      res.status(500).json({ message: "Could not load profile." });
    }
  });

  // ── Adjacent videos (prev/next for swipe navigation) ───────────────────────
  app.get("/api/community/videos/adjacent/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });

      const [currentRows] = await Promise.all([
        db.select({ createdAt: communityVideos.createdAt })
          .from(communityVideos)
          .where(and(eq(communityVideos.id, id), eq(communityVideos.isPublic, true)))
          .limit(1),
      ]);
      const current = currentRows[0];
      if (!current) return res.json({ prevId: null, nextId: null });

      const [nextRows, prevRows] = await Promise.all([
        db.select({ id: communityVideos.id })
          .from(communityVideos)
          .where(and(
            eq(communityVideos.isPublic, true),
            ne(communityVideos.id, id),
            sql`${communityVideos.createdAt} < ${current.createdAt}`,
          ))
          .orderBy(desc(communityVideos.createdAt))
          .limit(1),
        db.select({ id: communityVideos.id })
          .from(communityVideos)
          .where(and(
            eq(communityVideos.isPublic, true),
            ne(communityVideos.id, id),
            sql`${communityVideos.createdAt} > ${current.createdAt}`,
          ))
          .orderBy(communityVideos.createdAt)
          .limit(1),
      ]);

      res.json({
        nextId: nextRows[0]?.id ?? null,
        prevId: prevRows[0]?.id ?? null,
      });
    } catch (err) {
      console.error("[sparks] adjacent error:", err);
      res.status(500).json({ message: "Could not load adjacent." });
    }
  });

  // ── Single video ─────────────────────────────────────────────────────────────
  app.get("/api/community/video/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req) ?? null;

      const rows = await db
        .select({
          ...videoSelectCols,
          uploaderFollowerCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM sparks_follows WHERE following_id = ${communityVideos.uploaderId})`,
        })
        .from(communityVideos)
        .leftJoin(users, eq(communityVideos.uploaderId, users.id))
        .leftJoin(userSettings, eq(communityVideos.uploaderId, userSettings.userId))
        .where(and(eq(communityVideos.id, id), eq(communityVideos.isPublic, true)))
        .limit(1);

      if (!rows[0]) return res.status(404).json({ message: "Video not found." });

      db.update(communityVideos)
        .set({ viewCount: sql`${communityVideos.viewCount} + 1` })
        .where(eq(communityVideos.id, id))
        .catch(() => {});

      let isLikedByMe = false;
      let isRepostedByMe = false;
      let isSavedByMe = false;
      let isFollowingUploader = false;

      if (userId) {
        const [like, repost, save_, follow] = await Promise.all([
          db.select({ id: videoLikes.id }).from(videoLikes).where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId))).limit(1),
          db.select({ id: videoReposts.id }).from(videoReposts).where(and(eq(videoReposts.videoId, id), eq(videoReposts.userId, userId))).limit(1),
          db.select({ id: videoSaves.id }).from(videoSaves).where(and(eq(videoSaves.videoId, id), eq(videoSaves.userId, userId))).limit(1),
          rows[0].uploaderId ? db.select({ id: sparksFollows.id }).from(sparksFollows).where(and(eq(sparksFollows.followerId, userId), eq(sparksFollows.followingId, rows[0].uploaderId))).limit(1) : Promise.resolve([]),
        ]);
        isLikedByMe = like.length > 0;
        isRepostedByMe = repost.length > 0;
        isSavedByMe = save_.length > 0;
        isFollowingUploader = (follow as any[]).length > 0;
      }

      res.json({
        ...rows[0],
        viewCount: rows[0].viewCount + 1,
        isLikedByMe,
        isRepostedByMe,
        isSavedByMe,
        isFollowingUploader,
      });
    } catch (err) {
      console.error("[sparks] get error:", err);
      res.status(500).json({ message: "Could not load video." });
    }
  });

  // ── Toggle like ─────────────────────────────────────────────────────────────
  app.post("/api/community/video/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to like." });

      const existing = await db.select({ id: videoLikes.id }).from(videoLikes).where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId))).limit(1);
      if (existing.length > 0) {
        await db.delete(videoLikes).where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId)));
        const [updated] = await db.update(communityVideos).set({ likeCount: sql`GREATEST(0, ${communityVideos.likeCount} - 1)` }).where(eq(communityVideos.id, id)).returning({ likeCount: communityVideos.likeCount });
        return res.json({ liked: false, likeCount: updated?.likeCount ?? 0 });
      } else {
        await db.insert(videoLikes).values({ videoId: id, userId }).onConflictDoNothing();
        const [updated] = await db.update(communityVideos).set({ likeCount: sql`${communityVideos.likeCount} + 1` }).where(eq(communityVideos.id, id)).returning({ likeCount: communityVideos.likeCount });
        return res.json({ liked: true, likeCount: updated?.likeCount ?? 0 });
      }
    } catch (err) {
      console.error("[sparks] like error:", err);
      res.status(500).json({ message: "Could not update like." });
    }
  });

  // ── Toggle repost ───────────────────────────────────────────────────────────
  app.post("/api/community/video/:id/repost", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });

      const existing = await db.select({ id: videoReposts.id }).from(videoReposts).where(and(eq(videoReposts.videoId, id), eq(videoReposts.userId, userId))).limit(1);
      if (existing.length > 0) {
        await db.delete(videoReposts).where(and(eq(videoReposts.videoId, id), eq(videoReposts.userId, userId)));
        const [updated] = await db.update(communityVideos).set({ repostCount: sql`GREATEST(0, ${communityVideos.repostCount} - 1)` }).where(eq(communityVideos.id, id)).returning({ repostCount: communityVideos.repostCount });
        return res.json({ reposted: false, repostCount: updated?.repostCount ?? 0 });
      } else {
        await db.insert(videoReposts).values({ videoId: id, userId }).onConflictDoNothing();
        const [updated] = await db.update(communityVideos).set({ repostCount: sql`${communityVideos.repostCount} + 1` }).where(eq(communityVideos.id, id)).returning({ repostCount: communityVideos.repostCount });
        return res.json({ reposted: true, repostCount: updated?.repostCount ?? 0 });
      }
    } catch (err) {
      console.error("[sparks] repost error:", err);
      res.status(500).json({ message: "Could not update repost." });
    }
  });

  // ── Toggle save ─────────────────────────────────────────────────────────────
  app.post("/api/community/video/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });

      const existing = await db.select({ id: videoSaves.id }).from(videoSaves).where(and(eq(videoSaves.videoId, id), eq(videoSaves.userId, userId))).limit(1);
      if (existing.length > 0) {
        await db.delete(videoSaves).where(and(eq(videoSaves.videoId, id), eq(videoSaves.userId, userId)));
        const [updated] = await db.update(communityVideos).set({ saveCount: sql`GREATEST(0, ${communityVideos.saveCount} - 1)` }).where(eq(communityVideos.id, id)).returning({ saveCount: communityVideos.saveCount });
        return res.json({ saved: false, saveCount: updated?.saveCount ?? 0 });
      } else {
        await db.insert(videoSaves).values({ videoId: id, userId }).onConflictDoNothing();
        const [updated] = await db.update(communityVideos).set({ saveCount: sql`${communityVideos.saveCount} + 1` }).where(eq(communityVideos.id, id)).returning({ saveCount: communityVideos.saveCount });
        return res.json({ saved: true, saveCount: updated?.saveCount ?? 0 });
      }
    } catch (err) {
      console.error("[sparks] save error:", err);
      res.status(500).json({ message: "Could not update save." });
    }
  });

  // ── Toggle follow ───────────────────────────────────────────────────────────
  app.post("/api/sparks/follow/:targetId", isAuthenticated, async (req: any, res) => {
    try {
      const { targetId } = req.params;
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });
      if (userId === targetId) return res.status(400).json({ message: "Cannot follow yourself." });

      const existing = await db.select({ id: sparksFollows.id }).from(sparksFollows).where(and(eq(sparksFollows.followerId, userId), eq(sparksFollows.followingId, targetId))).limit(1);
      if (existing.length > 0) {
        await db.delete(sparksFollows).where(and(eq(sparksFollows.followerId, userId), eq(sparksFollows.followingId, targetId)));
        const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(sparksFollows).where(eq(sparksFollows.followingId, targetId));
        return res.json({ following: false, followerCount: count });
      } else {
        await db.insert(sparksFollows).values({ followerId: userId, followingId: targetId }).onConflictDoNothing();
        const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(sparksFollows).where(eq(sparksFollows.followingId, targetId));
        return res.json({ following: true, followerCount: count });
      }
    } catch (err) {
      console.error("[sparks] follow error:", err);
      res.status(500).json({ message: "Could not update follow." });
    }
  });

  // ── Sparks profile settings (username) ─────────────────────────────────────
  app.patch("/api/sparks/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });

      const schema = z.object({
        username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Lowercase, numbers, underscores only").optional(),
        displayName: z.string().min(1).max(60).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid fields.", errors: parsed.error.issues });

      const updates: Record<string, any> = {};
      if (parsed.data.username) updates.username = parsed.data.username;
      if (parsed.data.displayName) updates.displayName = parsed.data.displayName;
      if (!Object.keys(updates).length) return res.status(400).json({ message: "Nothing to update." });

      const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
      if (existing.length) {
        const [row] = await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId)).returning();
        return res.json(row);
      } else {
        const [row] = await db.insert(userSettings).values({ userId, ...updates }).returning();
        return res.json(row);
      }
    } catch (err: any) {
      if (err?.code === "23505") return res.status(409).json({ message: "That username is already taken." });
      console.error("[sparks] settings error:", err);
      res.status(500).json({ message: "Could not update settings." });
    }
  });

  // ── Get current user's Sparks settings ────────────────────────────────────
  app.get("/api/sparks/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in." });
      const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
      res.json(rows[0] ?? { userId, username: null, displayName: null });
    } catch (err) {
      console.error("[sparks] get settings error:", err);
      res.status(500).json({ message: "Could not load settings." });
    }
  });

  // ── Comments ────────────────────────────────────────────────────────────────
  app.get("/api/community/video/:id/comments", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const comments = await db
        .select({
          id: videoComments.id,
          videoId: videoComments.videoId,
          userId: videoComments.userId,
          body: videoComments.body,
          createdAt: videoComments.createdAt,
          userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, 'Survivor')`,
          userAvatar: users.profileImageUrl,
          userIsTherapist: users.isVerifiedTherapist,
        })
        .from(videoComments)
        .leftJoin(users, eq(videoComments.userId, users.id))
        .where(eq(videoComments.videoId, id))
        .orderBy(desc(videoComments.createdAt))
        .limit(100);
      res.json(comments);
    } catch (err) {
      console.error("[sparks] comments error:", err);
      res.status(500).json({ message: "Could not load comments." });
    }
  });

  app.post("/api/community/video/:id/comment", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to comment." });

      const body = String(req.body?.body ?? "").trim().slice(0, COMMENT_MAX_LEN);
      if (!body) return res.status(400).json({ message: "Comment cannot be empty." });

      const [comment] = await db.insert(videoComments).values({ videoId: id, userId, body }).returning();
      await db.update(communityVideos).set({ commentCount: sql`${communityVideos.commentCount} + 1` }).where(eq(communityVideos.id, id)).catch(() => {});

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const u = user[0];
      res.json({
        ...comment,
        userName: [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Survivor",
        userAvatar: u?.profileImageUrl ?? null,
        userIsTherapist: u?.isVerifiedTherapist ?? false,
      });
    } catch (err) {
      console.error("[sparks] comment error:", err);
      res.status(500).json({ message: "Could not post comment." });
    }
  });

  // ── Admin: toggle featured / pinned ────────────────────────────────────────
  app.patch("/api/community/video/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized." });

      const video = await db.select().from(communityVideos).where(eq(communityVideos.id, id)).limit(1);
      if (!video[0]) return res.status(404).json({ message: "Video not found." });

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const isOwner = video[0].uploaderId === userId;
      const isAdmin = user[0]?.role === "admin";
      if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed." });

      const updates: Partial<typeof communityVideos.$inferInsert> = {};
      if (typeof req.body.isFeatured === "boolean" && isAdmin) updates.isFeatured = req.body.isFeatured;
      if (typeof req.body.isPinned === "boolean" && (isOwner || isAdmin)) updates.isPinned = req.body.isPinned;
      if (typeof req.body.isPublic === "boolean" && (isOwner || isAdmin)) updates.isPublic = req.body.isPublic;
      if (typeof req.body.title === "string" && isOwner) updates.title = req.body.title.slice(0, 120);
      if (typeof req.body.description === "string" && isOwner) updates.description = req.body.description.slice(0, 2000);
      if (typeof req.body.thumbnailUrl === "string" && isOwner && req.body.thumbnailUrl.startsWith("/objects/")) {
        updates.thumbnailUrl = req.body.thumbnailUrl;
      }

      if (!Object.keys(updates).length) return res.status(400).json({ message: "Nothing to update." });
      const [updated] = await db.update(communityVideos).set(updates).where(eq(communityVideos.id, id)).returning();
      res.json(updated);
    } catch (err) {
      console.error("[sparks] patch error:", err);
      res.status(500).json({ message: "Could not update video." });
    }
  });

  // ── Report video ─────────────────────────────────────────────────────────────
  app.post("/api/community/video/:id/report", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to report." });
      const reason = String(req.body?.reason ?? "").trim().slice(0, 200) || "unspecified";
      console.log(JSON.stringify({ event: "sparks_report", videoId: id, reporterId: userId, reason, ts: new Date().toISOString() }));
      res.json({ ok: true });
    } catch (err) {
      console.error("[sparks] report error:", err);
      res.status(500).json({ message: "Could not submit report." });
    }
  });

  // ── AI metadata generation ─────────────────────────────────────────────────
  app.post("/api/community/video/generate-metadata", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = z
        .object({
          prompt: z.string().max(600).default(""),
          frames: z.array(z.string().max(500_000)).max(5).default([]),
        })
        .safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid request body." });

      const { prompt, frames } = parsed.data;
      if (!prompt.trim() && frames.length === 0) {
        return res.status(400).json({ message: "Provide a prompt or video frames." });
      }

      const { generateSparkMetadata } = await import("./geminiService");
      const meta = await generateSparkMetadata(prompt || "stroke recovery video", frames);
      res.json(meta);
    } catch (err) {
      console.error("[sparks] generate-metadata error:", err);
      res.status(500).json({ message: "Generation failed — try again." });
    }
  });

  // ── Boost video ─────────────────────────────────────────────────────────────
  app.post("/api/community/video/:id/boost", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to boost." });

      const parsed = z.object({ days: z.number().int().min(1).max(30) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "days (1–30) required." });

      const [video] = await db.select().from(communityVideos).where(eq(communityVideos.id, id)).limit(1);
      if (!video) return res.status(404).json({ message: "Video not found." });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const isOwner = video.uploaderId === userId;
      const isAdmin = user?.role === "admin";
      if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not your video." });

      await db.execute(
        sql`UPDATE community_videos
               SET boosted_until = GREATEST(COALESCE(boosted_until, NOW()), NOW()) + (${parsed.data.days} || ' days')::interval
             WHERE id = ${id}`,
      );

      const boostedUntil = new Date(Date.now() + parsed.data.days * 86_400_000);
      res.json({ ok: true, boostedUntil });
    } catch (err) {
      console.error("[sparks] boost error:", err);
      res.status(500).json({ message: "Could not boost video." });
    }
  });

  // ── Admin: reindex (recompute counts + return catalog stats) ────────────────
  app.post("/api/admin/community/videos/reindex", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized." });
      const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
      if (user?.role !== "admin") return res.status(403).json({ message: "Admin only." });

      // Recompute like_count, comment_count, repost_count, save_count from junction tables
      await db.execute(sql`
        UPDATE community_videos cv SET
          like_count    = (SELECT COUNT(*) FROM video_likes     WHERE video_id = cv.id),
          comment_count = (SELECT COUNT(*) FROM video_comments  WHERE video_id = cv.id),
          repost_count  = (SELECT COUNT(*) FROM video_reposts   WHERE video_id = cv.id),
          save_count    = (SELECT COUNT(*) FROM video_saves     WHERE video_id = cv.id)
      `);

      const [stats] = await db.execute(sql`
        SELECT
          COUNT(*)::int                                        AS total,
          COUNT(*) FILTER (WHERE is_public  = true)::int      AS public,
          COUNT(*) FILTER (WHERE is_featured = true)::int     AS featured,
          COUNT(*) FILTER (WHERE is_pinned   = true)::int     AS pinned,
          COUNT(*) FILTER (WHERE source = 'upload')::int      AS uploaded,
          COUNT(*) FILTER (WHERE source = 'seed')::int        AS seeded,
          SUM(view_count)::int                                AS total_views,
          SUM(like_count)::int                                AS total_likes
        FROM community_videos
      `);

      res.json({ ok: true, reindexed: true, stats: (stats as any).rows?.[0] ?? stats });
    } catch (err) {
      console.error("[sparks] reindex error:", err);
      res.status(500).json({ message: "Reindex failed." });
    }
  });

  // ── Delete video ────────────────────────────────────────────────────────────
  app.delete("/api/community/video/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized." });

      const video = await db.select().from(communityVideos).where(eq(communityVideos.id, id)).limit(1);
      if (!video[0]) return res.status(404).json({ message: "Video not found." });

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const isOwner = video[0].uploaderId === userId;
      const isAdmin = user[0]?.role === "admin";
      if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed." });

      await db.delete(communityVideos).where(eq(communityVideos.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error("[sparks] delete error:", err);
      res.status(500).json({ message: "Could not delete video." });
    }
  });
}
