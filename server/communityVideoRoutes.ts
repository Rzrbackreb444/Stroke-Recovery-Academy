import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { communityVideos, videoLikes, videoComments, users, userProfiles } from "@shared/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { getUserId } from "./lib/authUtils";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { z } from "zod";

const VIDEO_MAX_BYTES = 500 * 1024 * 1024; // 500MB
const COMMENT_MAX_LEN = 1000;

const objectStorage = new ObjectStorageService();

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreVideo(
  video: { deficitTags: string[]; tags: string[]; likeCount: number; commentCount: number; isFeatured: boolean; isPinned: boolean; createdAt: Date },
  userDeficits: string[],
  userGoals: string[],
): number {
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

// ── route registration ────────────────────────────────────────────────────────

export function registerCommunityVideoRoutes(app: Express, isAuthenticated: RequestHandler): void {

  // ── Request presigned upload URL ────────────────────────────────────────────
  app.post("/api/community/video/upload-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to upload." });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("[community-video] upload-url error:", err);
      res.status(500).json({ message: "Could not start upload — try again." });
    }
  });

  // ── Request presigned thumbnail upload URL ──────────────────────────────────
  app.post("/api/community/video/thumbnail-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to upload." });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("[community-video] thumbnail-url error:", err);
      res.status(500).json({ message: "Could not start thumbnail upload." });
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

      // Validate video file
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

      // No ACL policy needed — null-policy objects are served as public passthrough
      // by the existing /objects/:objectPath(*) route (community videos are intentionally public).

      const [video] = await db.insert(communityVideos).values({
        uploaderId: userId,
        title,
        description: description ?? null,
        tags,
        deficitTags,
        videoUrl: objectPath,
        thumbnailUrl: thumbnailObjectPath ?? null,
        durationSeconds: durationSeconds ?? null,
        fileSizeBytes: fileSizeBytes ?? size ?? null,
        isPublic: true,
        source: "upload",
      }).returning();

      res.json(video);
    } catch (err) {
      console.error("[community-video] create error:", err);
      res.status(500).json({ message: "Could not save video — try again." });
    }
  });

  // ── Personalized feed ───────────────────────────────────────────────────────
  app.get("/api/community/videos", async (req: any, res) => {
    try {
      const userId = getUserId(req) ?? null;
      const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10));
      const limit = 24;

      const [{ deficits, goals }, allVideos] = await Promise.all([
        getUserContext(userId),
        db
          .select({
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
            isFeatured: communityVideos.isFeatured,
            isPinned: communityVideos.isPinned,
            isPremium: communityVideos.isPremium,
            source: communityVideos.source,
            createdAt: communityVideos.createdAt,
            uploaderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, 'Survivor')`,
            uploaderAvatar: users.profileImageUrl,
            uploaderIsTherapist: users.isVerifiedTherapist,
          })
          .from(communityVideos)
          .leftJoin(users, eq(communityVideos.uploaderId, users.id))
          .where(eq(communityVideos.isPublic, true))
          .orderBy(desc(communityVideos.isPinned), desc(communityVideos.isFeatured), desc(communityVideos.createdAt))
          .limit(200),
      ]);

      // Score + sort
      const scored = allVideos
        .map((v) => ({ ...v, score: scoreVideo(v as any, deficits, goals) }))
        .sort((a, b) => b.score - a.score)
        .slice(page * limit, (page + 1) * limit);

      // Attach like status for auth user
      let likedIds = new Set<number>();
      if (userId && scored.length) {
        const ids = scored.map((v) => v.id);
        const likes = await db
          .select({ videoId: videoLikes.videoId })
          .from(videoLikes)
          .where(and(eq(videoLikes.userId, userId), inArray(videoLikes.videoId, ids)));
        likedIds = new Set(likes.map((l) => l.videoId));
      }

      res.json({
        videos: scored.map((v) => ({ ...v, isLikedByMe: likedIds.has(v.id) })),
        hasMore: allVideos.length > (page + 1) * limit,
        page,
      });
    } catch (err) {
      console.error("[community-video] feed error:", err);
      res.status(500).json({ message: "Could not load feed." });
    }
  });

  // ── Profile videos for a specific user ─────────────────────────────────────
  app.get("/api/community/videos/profile/:userId", async (req: any, res) => {
    try {
      const { userId: profileUserId } = req.params;
      const currentUserId = getUserId(req) ?? null;

      const [profileVideos, uploader, profileRow] = await Promise.all([
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
            isFeatured: communityVideos.isFeatured,
            isPinned: communityVideos.isPinned,
            createdAt: communityVideos.createdAt,
          })
          .from(communityVideos)
          .where(and(eq(communityVideos.uploaderId, profileUserId), eq(communityVideos.isPublic, true)))
          .orderBy(desc(communityVideos.isPinned), desc(communityVideos.createdAt)),
        db.select().from(users).where(eq(users.id, profileUserId)).limit(1),
        db.select({ bio: userProfiles.bio }).from(userProfiles).where(eq(userProfiles.userId, profileUserId)).limit(1),
      ]);

      if (!uploader[0]) return res.status(404).json({ message: "User not found." });

      const u = uploader[0];
      const totalViews = profileVideos.reduce((s, v) => s + v.viewCount, 0);
      const totalLikes = profileVideos.reduce((s, v) => s + v.likeCount, 0);

      // Like status
      let likedIds = new Set<number>();
      if (currentUserId && profileVideos.length) {
        const ids = profileVideos.map((v) => v.id);
        const likes = await db
          .select({ videoId: videoLikes.videoId })
          .from(videoLikes)
          .where(and(eq(videoLikes.userId, currentUserId), inArray(videoLikes.videoId, ids)));
        likedIds = new Set(likes.map((l) => l.videoId));
      }

      res.json({
        uploader: {
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Survivor",
          avatar: u.profileImageUrl,
          isTherapist: u.isVerifiedTherapist,
          bio: profileRow[0]?.bio ?? null,
          videoCount: profileVideos.length,
          totalViews,
          totalLikes,
        },
        videos: profileVideos.map((v) => ({ ...v, isLikedByMe: likedIds.has(v.id) })),
        isOwnProfile: currentUserId === profileUserId,
      });
    } catch (err) {
      console.error("[community-video] profile error:", err);
      res.status(500).json({ message: "Could not load profile." });
    }
  });

  // ── Single video ────────────────────────────────────────────────────────────
  app.get("/api/community/video/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const userId = getUserId(req) ?? null;

      const rows = await db
        .select({
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
          isFeatured: communityVideos.isFeatured,
          isPinned: communityVideos.isPinned,
          isPremium: communityVideos.isPremium,
          source: communityVideos.source,
          createdAt: communityVideos.createdAt,
          uploaderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, 'Survivor')`,
          uploaderAvatar: users.profileImageUrl,
          uploaderIsTherapist: users.isVerifiedTherapist,
        })
        .from(communityVideos)
        .leftJoin(users, eq(communityVideos.uploaderId, users.id))
        .where(and(eq(communityVideos.id, id), eq(communityVideos.isPublic, true)))
        .limit(1);

      if (!rows[0]) return res.status(404).json({ message: "Video not found." });

      // Increment view count (fire-and-forget)
      db.update(communityVideos)
        .set({ viewCount: sql`${communityVideos.viewCount} + 1` })
        .where(eq(communityVideos.id, id))
        .catch(() => {});

      let isLikedByMe = false;
      if (userId) {
        const like = await db
          .select({ id: videoLikes.id })
          .from(videoLikes)
          .where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId)))
          .limit(1);
        isLikedByMe = like.length > 0;
      }

      res.json({ ...rows[0], isLikedByMe, viewCount: rows[0].viewCount + 1 });
    } catch (err) {
      console.error("[community-video] get error:", err);
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

      const existing = await db
        .select({ id: videoLikes.id })
        .from(videoLikes)
        .where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(videoLikes).where(and(eq(videoLikes.videoId, id), eq(videoLikes.userId, userId)));
        const [updated] = await db
          .update(communityVideos)
          .set({ likeCount: sql`GREATEST(0, ${communityVideos.likeCount} - 1)` })
          .where(eq(communityVideos.id, id))
          .returning({ likeCount: communityVideos.likeCount });
        return res.json({ liked: false, likeCount: updated?.likeCount ?? 0 });
      } else {
        await db.insert(videoLikes).values({ videoId: id, userId }).onConflictDoNothing();
        const [updated] = await db
          .update(communityVideos)
          .set({ likeCount: sql`${communityVideos.likeCount} + 1` })
          .where(eq(communityVideos.id, id))
          .returning({ likeCount: communityVideos.likeCount });
        return res.json({ liked: true, likeCount: updated?.likeCount ?? 0 });
      }
    } catch (err) {
      console.error("[community-video] like error:", err);
      res.status(500).json({ message: "Could not update like." });
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
      console.error("[community-video] comments error:", err);
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
      await db
        .update(communityVideos)
        .set({ commentCount: sql`${communityVideos.commentCount} + 1` })
        .where(eq(communityVideos.id, id))
        .catch(() => {});

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const u = user[0];
      res.json({
        ...comment,
        userName: [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Survivor",
        userAvatar: u?.profileImageUrl ?? null,
        userIsTherapist: u?.isVerifiedTherapist ?? false,
      });
    } catch (err) {
      console.error("[community-video] comment error:", err);
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

      if (Object.keys(updates).length === 0) return res.status(400).json({ message: "Nothing to update." });
      const [updated] = await db.update(communityVideos).set(updates).where(eq(communityVideos.id, id)).returning();
      res.json(updated);
    } catch (err) {
      console.error("[community-video] patch error:", err);
      res.status(500).json({ message: "Could not update video." });
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
      console.error("[community-video] delete error:", err);
      res.status(500).json({ message: "Could not delete video." });
    }
  });
}
