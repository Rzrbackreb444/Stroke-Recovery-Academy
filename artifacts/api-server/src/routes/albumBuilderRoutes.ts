import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import archiver from "archiver";
import { z } from "zod/v4";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  survivorAlbums,
  survivorAlbumTracks,
  sasquatchVoiceGenerations,
} from "@workspace/db";
import {
  resolveTier,
  featuresFor,
  STUDIO_TIERS,
} from "@shared/studioTiers";
import { getActiveStudioSub } from "./sasquatchStudioRoutes";
import { getUserId } from "../lib/authUtils";

// -------- helpers --------
function safeFilename(s: string): string {
  return (s || "untitled")
    .toString()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "untitled";
}

function makeShareSlug(): string {
  // 8-char base36-ish slug; uniqueness enforced by DB index w/ retry-on-conflict.
  return crypto.randomBytes(6).toString("base64url").toLowerCase().slice(0, 8);
}

function diskPathFromUrl(url: string, uploadsDir: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.startsWith("/uploads/")) return null;
  // Decode + normalize, then containment-check against uploadsDir to block
  // path-traversal (e.g. /uploads/../../etc/passwd)
  let rel: string;
  try {
    rel = decodeURIComponent(url.slice("/uploads/".length));
  } catch {
    return null;
  }
  if (rel.includes("\0")) return null;
  const resolved = path.resolve(uploadsDir, rel);
  const root = path.resolve(uploadsDir);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

// Resolve features for the calling user. The album builder is paid-only:
// users without an active Studio subscription get a 402 directing them to
// /sasquatch-studio. (User explicitly rejected a free album builder — it's
// monetized via the tiered Studio subscription.)
async function resolveUserFeatures(userId: string, res: Response): Promise<
  | { sub: NonNullable<Awaited<ReturnType<typeof getActiveStudioSub>>>; tier: ReturnType<typeof resolveTier>; features: ReturnType<typeof featuresFor> }
  | null
> {
  const sub = await getActiveStudioSub(userId);
  if (!sub) {
    res.status(402).json({
      error:
        "The Album Builder is part of Sasquatch Studio. Subscribe to start building albums.",
      code: "tier_no_subscription",
      upgradeUrl: "/sasquatch-studio",
    });
    return null;
  }
  const tier = resolveTier(sub.tier);
  return { sub, tier, features: featuresFor(tier) };
}

const createAlbumSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

const updateAlbumSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  artist: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  isPublic: z.boolean().optional(),
  shareSlug: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
});

// POST /tracks only handles studio refs — direct file uploads must go through
// /tracks/upload so the audioUrl is server-issued (never client-controlled).
const addTrackSchema = z.object({
  source: z.literal("studio"),
  sourceRef: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  audioUrl: z.string().trim().max(400).optional(),
  durationSeconds: z.number().int().positive().optional(),
});

const reorderSchema = z.object({
  trackIds: z.array(z.number().int()),
});

export function registerAlbumBuilderRoutes(
  app: Express,
  isAuthenticated: any,
  uploadsDir: string
) {
  const albumDir = path.join(uploadsDir, "sasquatch-albums");
  const coverDir = path.join(albumDir, "covers");
  const trackDir = path.join(albumDir, "tracks");
  for (const d of [albumDir, coverDir, trackDir]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per track upload
  });
  const coverUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // -------- LIST my albums --------
  app.get(
    "/api/albums",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const rows = await db
        .select()
        .from(survivorAlbums)
        .where(eq(survivorAlbums.userId, userId))
        .orderBy(desc(survivorAlbums.createdAt));
      // Attach track counts
      const enriched = await Promise.all(
        rows.map(async (a) => {
          const tracks = await db
            .select({ id: survivorAlbumTracks.id })
            .from(survivorAlbumTracks)
            .where(eq(survivorAlbumTracks.albumId, a.id));
          return { ...a, trackCount: tracks.length };
        })
      );
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { tier, features } = ctx;
      return res.json({
        items: enriched,
        tier,
        limits: {
          albumsAllowed: features.albumsAllowed,
          tracksPerAlbum: features.tracksPerAlbum,
          publicSharePages: features.publicSharePages,
          customShareSlug: features.customShareSlug,
          distributionMetadata: features.distributionMetadata,
        },
      });
    }
  );

  // -------- GET one album (with tracks) --------
  app.get(
    "/api/albums/:id",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const tracks = await db
        .select()
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id))
        .orderBy(asc(survivorAlbumTracks.position));
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      return res.json({ album, tracks, features: ctx.features });
    }
  );

  // -------- PUBLIC view by share slug --------
  app.get("/api/albums/share/:slug", async (req: Request, res: Response) => {
    const slug = String(req.params.slug || "").toLowerCase();
    if (!slug) return res.status(400).json({ error: "Bad slug" });
    const [album] = await db
      .select()
      .from(survivorAlbums)
      .where(eq(survivorAlbums.shareSlug, slug))
      .limit(1);
    if (!album || !album.isPublic) {
      return res.status(404).json({ error: "Not found" });
    }
    // Re-check the *owner's* current tier — if they downgraded after going
    // public, the public page goes away (Pro+ only feature).
    const ownerSub = await getActiveStudioSub(album.userId);
    const ownerFeatures = featuresFor(resolveTier(ownerSub?.tier));
    if (!ownerFeatures.publicSharePages) {
      return res.status(404).json({ error: "Not found" });
    }
    const tracks = await db
      .select({
        id: survivorAlbumTracks.id,
        position: survivorAlbumTracks.position,
        title: survivorAlbumTracks.title,
        audioUrl: survivorAlbumTracks.audioUrl,
        durationSeconds: survivorAlbumTracks.durationSeconds,
      })
      .from(survivorAlbumTracks)
      .where(eq(survivorAlbumTracks.albumId, album.id))
      .orderBy(asc(survivorAlbumTracks.position));
    return res.json({
      album: {
        id: album.id,
        title: album.title,
        artist: album.artist,
        description: album.description,
        coverUrl: album.coverUrl,
        shareSlug: album.shareSlug,
      },
      tracks,
    });
  });

  // -------- CREATE album --------
  app.post(
    "/api/albums",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const parsed = createAlbumSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid", details: parsed.error.format() });
      }
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { features } = ctx;
      // Enforce album cap
      if (features.albumsAllowed !== -1) {
        const existing = await db
          .select({ id: survivorAlbums.id })
          .from(survivorAlbums)
          .where(eq(survivorAlbums.userId, userId));
        if (existing.length >= features.albumsAllowed) {
          return res.status(402).json({
            error: `Your tier allows ${features.albumsAllowed} albums. Upgrade to Pro for unlimited.`,
            code: "tier_album_limit",
          });
        }
      }
      const [row] = await db
        .insert(survivorAlbums)
        .values({
          userId,
          title: parsed.data.title,
          artist: parsed.data.artist || null,
          description: parsed.data.description || null,
        })
        .returning();
      return res.json({ album: row });
    }
  );

  // -------- UPDATE album metadata --------
  app.patch(
    "/api/albums/:id",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const parsed = updateAlbumSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid", details: parsed.error.format() });
      }
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { features } = ctx;
      const updates: any = { updatedAt: new Date() };
      if (parsed.data.title !== undefined) updates.title = parsed.data.title;
      if (parsed.data.artist !== undefined) updates.artist = parsed.data.artist || null;
      if (parsed.data.description !== undefined)
        updates.description = parsed.data.description || null;
      if (parsed.data.isPublic !== undefined) {
        if (parsed.data.isPublic && !features.publicSharePages) {
          return res.status(402).json({
            error: "Public share pages are a Pro feature. Upgrade to share publicly.",
            code: "tier_public_share",
          });
        }
        updates.isPublic = parsed.data.isPublic;
        // Auto-assign a slug the first time we go public.
        if (parsed.data.isPublic && !album.shareSlug) {
          let slug = makeShareSlug();
          for (let i = 0; i < 5; i++) {
            const [exists] = await db
              .select({ id: survivorAlbums.id })
              .from(survivorAlbums)
              .where(eq(survivorAlbums.shareSlug, slug))
              .limit(1);
            if (!exists) break;
            slug = makeShareSlug();
          }
          updates.shareSlug = slug;
        }
      }
      if (parsed.data.shareSlug !== undefined) {
        if (!features.customShareSlug) {
          return res.status(402).json({
            error: "Custom share slugs are a Label feature.",
            code: "tier_custom_slug",
          });
        }
        const [exists] = await db
          .select({ id: survivorAlbums.id })
          .from(survivorAlbums)
          .where(eq(survivorAlbums.shareSlug, parsed.data.shareSlug))
          .limit(1);
        if (exists && exists.id !== id) {
          return res.status(400).json({ error: "Slug already taken" });
        }
        updates.shareSlug = parsed.data.shareSlug;
      }
      const [updated] = await db
        .update(survivorAlbums)
        .set(updates)
        .where(eq(survivorAlbums.id, id))
        .returning();
      return res.json({ album: updated });
    }
  );

  // -------- DELETE album --------
  app.delete(
    "/api/albums/:id",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const result = await db
        .delete(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .returning({ id: survivorAlbums.id });
      if (!result.length) return res.status(404).json({ error: "Not found" });
      // Tracks are not FK-cascaded; clean them too
      await db
        .delete(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id));
      return res.json({ ok: true });
    }
  );

  // -------- UPLOAD cover image --------
  app.post(
    "/api/albums/:id/cover",
    isAuthenticated,
    coverUpload.single("cover"),
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const file = req.file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "No file" });
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const ext = (file.mimetype || "image/jpeg").includes("png") ? "png" : "jpg";
      const token = crypto.randomBytes(16).toString("hex");
      const filename = `cover-${id}-${token}.${ext}`;
      fs.writeFileSync(path.join(coverDir, filename), file.buffer);
      const coverUrl = `/uploads/sasquatch-albums/covers/${filename}`;
      const [updated] = await db
        .update(survivorAlbums)
        .set({ coverUrl, updatedAt: new Date() })
        .where(eq(survivorAlbums.id, id))
        .returning();
      return res.json({ album: updated });
    }
  );

  // -------- UPLOAD a track audio file (returns stable URL) --------
  app.post(
    "/api/albums/:id/tracks/upload",
    isAuthenticated,
    audioUpload.single("audio"),
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const file = req.file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "No file" });
      const title = String(req.body?.title || file.originalname || "Untitled")
        .trim()
        .slice(0, 200);
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { features } = ctx;
      if (features.tracksPerAlbum !== -1) {
        const existing = await db
          .select({ id: survivorAlbumTracks.id })
          .from(survivorAlbumTracks)
          .where(eq(survivorAlbumTracks.albumId, id));
        if (existing.length >= features.tracksPerAlbum) {
          return res.status(402).json({
            error: `Your tier allows ${features.tracksPerAlbum} tracks per album. Upgrade for more.`,
            code: "tier_track_limit",
          });
        }
      }
      const token = crypto.randomBytes(16).toString("hex");
      const filename = `track-${id}-${token}.mp3`;
      fs.writeFileSync(path.join(trackDir, filename), file.buffer);
      const audioUrl = `/uploads/sasquatch-albums/tracks/${filename}`;
      // Determine next position
      const existingTracks = await db
        .select({ position: survivorAlbumTracks.position })
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id));
      const nextPos =
        existingTracks.reduce((m, t) => Math.max(m, t.position), -1) + 1;
      const [row] = await db
        .insert(survivorAlbumTracks)
        .values({
          albumId: id,
          position: nextPos,
          source: "upload",
          sourceRef: filename,
          title,
          audioUrl,
        })
        .returning();
      await db
        .update(survivorAlbums)
        .set({ updatedAt: new Date() })
        .where(eq(survivorAlbums.id, id));
      return res.json({ track: row });
    }
  );

  // -------- ADD a track from existing source (studio generation) --------
  app.post(
    "/api/albums/:id/tracks",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const parsed = addTrackSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid", details: parsed.error.format() });
      }
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { features } = ctx;
      if (features.tracksPerAlbum !== -1) {
        const existing = await db
          .select({ id: survivorAlbumTracks.id })
          .from(survivorAlbumTracks)
          .where(eq(survivorAlbumTracks.albumId, id));
        if (existing.length >= features.tracksPerAlbum) {
          return res.status(402).json({
            error: `Your tier allows ${features.tracksPerAlbum} tracks per album. Upgrade for more.`,
            code: "tier_track_limit",
          });
        }
      }
      // source=studio: verify generation belongs to this user; ignore any
      // client-supplied audioUrl entirely.
      const genId = Number(parsed.data.sourceRef);
      if (!Number.isFinite(genId)) {
        return res.status(400).json({ error: "Invalid generation ref" });
      }
      const [gen] = await db
        .select()
        .from(sasquatchVoiceGenerations)
        .where(
          and(
            eq(sasquatchVoiceGenerations.id, genId),
            eq(sasquatchVoiceGenerations.userId, userId)
          )
        )
        .limit(1);
      if (!gen) return res.status(403).json({ error: "Generation not yours" });
      const trustedAudioUrl = gen.audioUrl;
      const trustedDuration =
        parsed.data.durationSeconds || gen.durationSeconds || null;
      const existingTracks = await db
        .select({ position: survivorAlbumTracks.position })
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id));
      const nextPos =
        existingTracks.reduce((m, t) => Math.max(m, t.position), -1) + 1;
      const [row] = await db
        .insert(survivorAlbumTracks)
        .values({
          albumId: id,
          position: nextPos,
          source: "studio",
          sourceRef: parsed.data.sourceRef,
          title: parsed.data.title,
          audioUrl: trustedAudioUrl,
          durationSeconds: trustedDuration,
        })
        .returning();
      await db
        .update(survivorAlbums)
        .set({ updatedAt: new Date() })
        .where(eq(survivorAlbums.id, id));
      return res.json({ track: row });
    }
  );

  // -------- DELETE a track --------
  app.delete(
    "/api/albums/:id/tracks/:trackId",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const trackId = Number(req.params.trackId);
      if (!Number.isFinite(id) || !Number.isFinite(trackId)) {
        return res.status(400).json({ error: "Bad id" });
      }
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const result = await db
        .delete(survivorAlbumTracks)
        .where(
          and(
            eq(survivorAlbumTracks.id, trackId),
            eq(survivorAlbumTracks.albumId, id)
          )
        )
        .returning({ id: survivorAlbumTracks.id });
      return res.json({ ok: true, deleted: result.length });
    }
  );

  // -------- REORDER tracks --------
  app.patch(
    "/api/albums/:id/reorder",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const parsed = reorderSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid order" });
      }
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      // Validate the payload is an exact permutation of this album's tracks
      // (no duplicates, no foreign IDs, no missing IDs) — otherwise positions
      // would collide or tracks would be stranded.
      const ownTracks = await db
        .select({ id: survivorAlbumTracks.id })
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id));
      const ownSet = new Set(ownTracks.map((t) => t.id));
      const incoming = parsed.data.trackIds;
      const incomingSet = new Set(incoming);
      if (
        incoming.length !== ownTracks.length ||
        incomingSet.size !== incoming.length ||
        !incoming.every((tid) => ownSet.has(tid))
      ) {
        return res.status(400).json({
          error:
            "Reorder payload must include each track in this album exactly once.",
        });
      }
      // Apply new positions
      for (let i = 0; i < incoming.length; i++) {
        await db
          .update(survivorAlbumTracks)
          .set({ position: i })
          .where(
            and(
              eq(survivorAlbumTracks.id, incoming[i]),
              eq(survivorAlbumTracks.albumId, id)
            )
          );
      }
      await db
        .update(survivorAlbums)
        .set({ updatedAt: new Date() })
        .where(eq(survivorAlbums.id, id));
      return res.json({ ok: true });
    }
  );

  // -------- DOWNLOAD album as ZIP (mp3s + cover + tracklist + .m3u) --------
  app.get(
    "/api/albums/:id/download.zip",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const tracks = await db
        .select()
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id))
        .orderBy(asc(survivorAlbumTracks.position));
      if (!tracks.length) {
        return res.status(400).json({ error: "Album has no tracks yet" });
      }

      const folder = safeFilename(album.title);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${folder}.zip"`
      );
      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("error", (err) => {
        console.error("[albums/zip]", err);
        try {
          res.status(500).end();
        } catch {}
      });
      archive.pipe(res);

      // Cover
      const coverDisk = album.coverUrl ? diskPathFromUrl(album.coverUrl, uploadsDir) : null;
      if (coverDisk && fs.existsSync(coverDisk)) {
        const ext = path.extname(coverDisk).slice(1).toLowerCase() || "jpg";
        archive.file(coverDisk, { name: `${folder}/cover.${ext}` });
      }

      // Tracks + tracklist + m3u
      const tracklistLines: string[] = [
        `${album.title}`,
        album.artist ? `by ${album.artist}` : "",
        "",
        "Tracklist:",
      ];
      const m3uLines: string[] = ["#EXTM3U"];

      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const num = String(i + 1).padStart(2, "0");
        const safeTitle = safeFilename(t.title);
        const filename = `${num} - ${safeTitle}.mp3`;
        const disk = diskPathFromUrl(t.audioUrl, uploadsDir);
        if (disk && fs.existsSync(disk)) {
          archive.file(disk, { name: `${folder}/${filename}` });
          tracklistLines.push(
            `${num}. ${t.title}${t.durationSeconds ? `  (${formatDuration(t.durationSeconds)})` : ""}`
          );
          m3uLines.push(
            `#EXTINF:${t.durationSeconds || -1},${t.title}`,
            filename
          );
        } else {
          tracklistLines.push(`${num}. ${t.title}  (file unavailable)`);
        }
      }
      tracklistLines.push("", "Built on Sasquatch Studio · sasquatchsound.com");
      archive.append(tracklistLines.join("\n"), { name: `${folder}/tracklist.txt` });
      archive.append(m3uLines.join("\n"), { name: `${folder}/album.m3u` });

      archive.finalize();
    }
  );

  // -------- DISTRIBUTION metadata (Pro+) --------
  app.get(
    "/api/albums/:id/distribution.json",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const ctx = await resolveUserFeatures(userId, res);
      if (!ctx) return;
      const { features } = ctx;
      if (!features.distributionMetadata) {
        return res.status(402).json({
          error: "Distribution metadata is a Pro+ feature.",
          code: "tier_distribution",
        });
      }
      const [album] = await db
        .select()
        .from(survivorAlbums)
        .where(and(eq(survivorAlbums.id, id), eq(survivorAlbums.userId, userId)))
        .limit(1);
      if (!album) return res.status(404).json({ error: "Not found" });
      const tracks = await db
        .select()
        .from(survivorAlbumTracks)
        .where(eq(survivorAlbumTracks.albumId, id))
        .orderBy(asc(survivorAlbumTracks.position));
      const totalSec = tracks.reduce((s, t) => s + (t.durationSeconds || 0), 0);
      const meta = {
        title: album.title,
        artist: album.artist || null,
        description: album.description || null,
        coverUrl: album.coverUrl,
        totalDurationSeconds: totalSec,
        trackCount: tracks.length,
        tracks: tracks.map((t, i) => ({
          position: i + 1,
          title: t.title,
          durationSeconds: t.durationSeconds || null,
          audioUrl: t.audioUrl,
          isrc: null,
        })),
        spotify: {
          albumName: album.title,
          artistName: album.artist || "Unknown Artist",
          recordLabel: "Sasquatch Sound",
          genre: "Rock",
          subGenre: "Recovery",
          language: "en",
        },
        apple: {
          collectionName: album.title,
          artistName: album.artist || "Unknown Artist",
          primaryGenreName: "Rock",
          contentAdvisoryRating: "Clean",
        },
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename(album.title)}-distribution.json"`
      );
      return res.json(meta);
    }
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
