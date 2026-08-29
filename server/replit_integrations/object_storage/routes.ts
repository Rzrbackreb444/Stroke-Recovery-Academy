import type { Express } from "express";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  UPLOAD_INTENT_CLEANUP_BATCH_SIZE,
  UPLOAD_INTENT_CLEANUP_INTERVAL_MS,
} from "./objectStorage";
import { getObjectAclPolicy, ObjectPermission } from "./objectAcl";
import { isAuthenticated } from "../../replitAuth";
import { getUserId } from "../../lib/authUtils";
import { requireAdmin } from "../../middleware/requireAdmin";
import {
  normalizeUploadMetadata,
  UploadMetadataValidationError,
} from "./uploadPolicy";

const uploadRateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();
const UPLOAD_RATE_LIMIT_MAX = 30;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function uploadRequestRateLimit(req: any, res: any, next: any): void {
  const userId = getUserId(req) || "anonymous";
  const ip = (
    (req.headers["x-forwarded-for"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  )
    .split(",")[0]
    .trim();
  const key = `${userId}:${ip}`;
  const now = Date.now();
  const entry = uploadRateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    uploadRateLimitStore.set(key, {
      count: 1,
      resetAt: now + UPLOAD_RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }
  entry.count += 1;
  if (entry.count > UPLOAD_RATE_LIMIT_MAX) {
    res.setHeader(
      "Retry-After",
      Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    );
    res.status(429).json({
      error: "Too many upload requests. Please wait before trying again.",
    });
    return;
  }
  next();
}

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();
  let cleanupInFlight = false;
  const cleanupExpiredUploads = () => {
    if (cleanupInFlight) return;
    cleanupInFlight = true;
    void objectStorageService
      .cleanupExpiredUploadIntents(UPLOAD_INTENT_CLEANUP_BATCH_SIZE)
      .then((result) => {
        if (result.intentsDeleted > 0 || result.failures > 0) {
          console.info(
            `[object-storage] upload cleanup: ${result.intentsDeleted} intents removed, ` +
              `${result.objectsDeleted} objects removed, ${result.failures} failures`,
          );
        }
      })
      .catch((error) => {
        console.error("[object-storage] upload cleanup failed:", error);
      })
      .finally(() => {
        cleanupInFlight = false;
      });
  };
  const cleanupTimer = setInterval(
    cleanupExpiredUploads,
    UPLOAD_INTENT_CLEANUP_INTERVAL_MS,
  );
  cleanupTimer.unref?.();

  app.get(
    "/api/admin/object-storage/upload-cleanup-health",
    isAuthenticated,
    requireAdmin,
    async (_req, res) => {
      try {
        const health = await objectStorageService.getUploadIntentCleanupHealth();
        res.json(health);
      } catch (error) {
        console.error("[object-storage] failed to read upload cleanup health:", error);
        res.status(500).json({ message: "Failed to read upload cleanup health" });
      }
    },
  );

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post(
    "/api/uploads/request-url",
    isAuthenticated,
    uploadRequestRateLimit,
    async (req: any, res) => {
      try {
        const ownerId = getUserId(req);
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });
        const metadata = normalizeUploadMetadata(req.body);
        const uploadURL = await objectStorageService.getObjectEntityUploadURL({
          ownerId,
          metadata,
        });

        // Extract object path from the presigned URL for later reference
        const objectPath =
          objectStorageService.normalizeObjectEntityPath(uploadURL);

        res.json({
          uploadURL,
          objectPath,
          metadata,
        });
      } catch (error) {
        if (error instanceof UploadMetadataValidationError) {
          return res.status(error.statusCode).json({ error: error.message });
        }
        console.error("Error generating upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
      }
    },
  );

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      // Enforce ACL only on objects explicitly marked private. Public objects
      // and legacy objects without an ACL policy stay openly readable, so this
      // is backward-compatible for avatars, lesson media, etc. Private objects
      // (survivor journal photos/voice/PDFs) require the owner.
      const aclPolicy = await getObjectAclPolicy(objectFile);
      if (aclPolicy && aclPolicy.visibility === "private") {
        const userId =
          (req as any).user?.claims?.sub ?? (req as any).user?.id;
        const allowed = await objectStorageService.canAccessObjectEntity({
          userId,
          objectFile,
          requestedPermission: ObjectPermission.READ,
        });
        if (!allowed) {
          // 404 (not 403) to avoid leaking object existence.
          return res.status(404).json({ error: "Object not found" });
        }
      } else if (!aclPolicy) {
        // A just-uploaded object has not received its ACL metadata yet. An
        // upload intent closes that otherwise-public gap without changing
        // access to legacy objects that predate the intent table.
        const userId = getUserId(req);
        const issuedUploadAccess =
          await objectStorageService.canAccessIssuedUpload(req.path, userId);
        if (issuedUploadAccess === false) {
          return res.status(404).json({ error: "Object not found" });
        }
      }
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

