// Reflections journal media: photo uploads (presigned PUT) and voice notes
// (multer -> Whisper transcript -> object storage). Mounted AFTER setupAuth so
// isAuthenticated / getUserId see the session middleware.
//
// Privacy note: journal media is stored visibility "private" by default. The
// shared GET /objects/:path route enforces per-owner ACL on private objects, so
// only the owner can read it. The journal share/unshare PATCH flips media to
// "public" (and back) so the community feed can render shared photos/voice.
// downloadObject emits private cache headers for private objects automatically.
import type { Express, RequestHandler } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { transcribeVideo } from "./videoTranscription";
import { getUserId } from "./lib/authUtils";

const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const VOICE_MAX_BYTES = 25 * 1024 * 1024; // 25MB — Whisper hard limit

export function registerJournalMediaRoutes(
  app: Express,
  isAuthenticated: RequestHandler,
  uploadsDir: string,
): void {
  const objectStorage = new ObjectStorageService();

  const voiceStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname || "") || ".webm").slice(0, 8);
      cb(null, `journal-voice-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
  const voiceUpload = multer({
    storage: voiceStorage,
    limits: { fileSize: VOICE_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") return cb(null, true);
      cb(new Error("Only audio files are accepted"));
    },
  });

  // 1) Request a presigned PUT URL for a photo. Client uploads directly to GCS.
  app.post("/api/recovery/journal/photo/upload-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to add a photo." });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error creating journal photo upload URL:", error);
      res.status(500).json({ message: "Couldn't start the upload — try again." });
    }
  });

  // 2) Finalize: validate the uploaded photo (type + size), set ACL, return the
  //    durable /objects path to persist on the entry. Presigned PUTs can't be
  //    size-capped server-side, so we check metadata AFTER the upload lands.
  app.post("/api/recovery/journal/photo/finalize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Sign in to add a photo." });
      const objectPath: string = (req.body?.objectPath || "").toString();
      if (!objectPath.startsWith("/objects/")) {
        return res.status(400).json({ message: "Invalid upload reference." });
      }

      const file = await objectStorage.getObjectEntityFile(objectPath);
      const [metadata] = await file.getMetadata();
      const size = parseInt(String(metadata.size || "0"), 10);
      const contentType = String(metadata.contentType || "");

      if (!contentType.startsWith("image/")) {
        await file.delete().catch(() => {});
        return res.status(415).json({ message: "That file isn't an image." });
      }
      if (size > PHOTO_MAX_BYTES) {
        await file.delete().catch(() => {});
        return res.status(413).json({ message: "Photo is over 10MB — pick a smaller one." });
      }

      await objectStorage.trySetObjectEntityAclPolicy(objectPath, {
        owner: userId,
        visibility: "private",
      });
      res.json({ photoUrl: objectPath });
    } catch (error) {
      console.error("Error finalizing journal photo:", error);
      res.status(500).json({ message: "Couldn't save that photo — try again." });
    }
  });

  // 3) Voice note: multer to disk (≤25MB) -> Whisper transcript -> push the
  //    audio to object storage -> clean up the temp file. Transcription failure
  //    degrades gracefully: the audio is still saved, transcript comes back empty.
  app.post(
    "/api/recovery/journal/voice",
    isAuthenticated,
    voiceUpload.single("audio"),
    async (req: any, res) => {
      const tempPath: string | undefined = req.file?.path;
      try {
        const userId = getUserId(req);
        if (!userId) {
          if (tempPath) await fs.promises.unlink(tempPath).catch(() => {});
          return res.status(401).json({ message: "Sign in to record a voice note." });
        }
        if (!req.file || !tempPath) {
          return res.status(400).json({ message: "No audio received." });
        }

        let transcript = "";
        let duration = 0;
        let transcriptionFailed = false;
        try {
          const result = await transcribeVideo(tempPath);
          transcript = (result.transcript || "").trim();
          duration = result.duration || 0;
        } catch (err) {
          transcriptionFailed = true;
          console.error("Journal voice transcription failed:", err);
        }

        const buffer = await fs.promises.readFile(tempPath);
        const uploadURL = await objectStorage.getObjectEntityUploadURL();
        const putRes = await fetch(uploadURL, {
          method: "PUT",
          body: buffer,
          headers: { "Content-Type": req.file.mimetype || "audio/webm" },
        });
        if (!putRes.ok) throw new Error(`Object PUT failed: ${putRes.status}`);

        const voiceUrl = await objectStorage.trySetObjectEntityAclPolicy(uploadURL, {
          owner: userId,
          visibility: "private",
        });

        res.json({ voiceUrl, transcript, duration, transcriptionFailed });
      } catch (error) {
        console.error("Error saving journal voice note:", error);
        res.status(500).json({ message: "Couldn't save that voice note — try again." });
      } finally {
        if (tempPath) await fs.promises.unlink(tempPath).catch(() => {});
      }
    },
  );
}
