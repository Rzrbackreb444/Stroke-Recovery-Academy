import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";
import { db } from "../../db";
import { objectUploadIntents } from "@shared/schema";
import { and, asc, eq, isNull, gt, lte } from "drizzle-orm";
import {
  normalizeUploadMetadata,
  type UploadMetadata,
  UPLOAD_INTENT_TTL_SECONDS,
} from "./uploadPolicy";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectUploadIntentError extends Error {
  constructor(message = "Upload reference is invalid or expired") {
    super(message);
    this.name = "ObjectUploadIntentError";
    Object.setPrototypeOf(this, ObjectUploadIntentError.prototype);
  }
}

const CONTENT_SNIFF_BYTES = 64;

export const UPLOAD_INTENT_CLEANUP_BATCH_SIZE = 100;
export const UPLOAD_INTENT_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export interface UploadIntentCleanupResult {
  scanned: number;
  objectsDeleted: number;
  intentsDeleted: number;
  failures: number;
}

export interface UploadIntentCleanupHealth {
  lastRunAt: Date;
  lastStatus: "success" | "failure";
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalFailures: number;
  lastScanned: number;
  lastObjectsDeleted: number;
  lastIntentsDeleted: number;
  lastFailureCount: number;
  lastError: string | null;
  updatedAt: Date;
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  private static uploadIntentTableReady: Promise<void> | null = null;

  constructor() {}

  /**
   * The migration is the source of truth, while this additive initializer
   * keeps existing development databases usable until they run the migration.
   */
  private async ensureUploadIntentTable(): Promise<void> {
    if (!ObjectStorageService.uploadIntentTableReady) {
      ObjectStorageService.uploadIntentTableReady = db.execute(sql`
        CREATE TABLE IF NOT EXISTS object_upload_intents (
          object_path TEXT PRIMARY KEY NOT NULL,
          owner_id VARCHAR NOT NULL,
          original_name TEXT NOT NULL,
          declared_size INTEGER NOT NULL,
          content_type TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          consumed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `)
        .then(async () => {
          await db.execute(sql`
            CREATE INDEX IF NOT EXISTS object_upload_intents_unconsumed_expiry_idx
              ON object_upload_intents (expires_at)
              WHERE consumed_at IS NULL
          `);
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS object_upload_cleanup_health (
              id INTEGER PRIMARY KEY,
              last_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
              last_status VARCHAR(16) NOT NULL,
              last_success_at TIMESTAMP WITH TIME ZONE,
              last_failure_at TIMESTAMP WITH TIME ZONE,
              consecutive_failures INTEGER NOT NULL DEFAULT 0,
              total_runs INTEGER NOT NULL DEFAULT 0,
              total_failures INTEGER NOT NULL DEFAULT 0,
              last_scanned INTEGER NOT NULL DEFAULT 0,
              last_objects_deleted INTEGER NOT NULL DEFAULT 0,
              last_intents_deleted INTEGER NOT NULL DEFAULT 0,
              last_failure_count INTEGER NOT NULL DEFAULT 0,
              last_error TEXT,
              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
          `);
        })
        .then(() => undefined);
    }
    await ObjectStorageService.uploadIntentTableReady;
  }

  /**
   * Persist the latest cleanup outcome without allowing observability to
   * change cleanup behavior. The singleton row makes the signal queryable
   * even when a pass finds no expired intents.
   */
  private async recordUploadIntentCleanupHealth(
    result: UploadIntentCleanupResult,
    error?: unknown,
  ): Promise<void> {
    const failureCount = error ? Math.max(1, result.failures) : result.failures;
    const status = failureCount > 0 ? "failure" : "success";
    const lastError = error
      ? error instanceof Error
        ? error.message
        : String(error)
      : result.failures > 0
        ? `${result.failures} cleanup item(s) failed`
        : null;

    try {
      await db.execute(sql`
        INSERT INTO object_upload_cleanup_health (
          id,
          last_run_at,
          last_status,
          last_success_at,
          last_failure_at,
          consecutive_failures,
          total_runs,
          total_failures,
          last_scanned,
          last_objects_deleted,
          last_intents_deleted,
          last_failure_count,
          last_error,
          updated_at
        )
        VALUES (
          1,
          NOW(),
          ${status},
          CASE WHEN ${failureCount} = 0 THEN NOW() ELSE NULL END,
          CASE WHEN ${failureCount} > 0 THEN NOW() ELSE NULL END,
          ${failureCount > 0 ? 1 : 0},
          1,
          ${failureCount},
          ${result.scanned},
          ${result.objectsDeleted},
          ${result.intentsDeleted},
          ${failureCount},
          ${lastError},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          last_run_at = EXCLUDED.last_run_at,
          last_status = EXCLUDED.last_status,
          last_success_at = CASE
            WHEN EXCLUDED.last_status = 'success'
              THEN EXCLUDED.last_run_at
            ELSE object_upload_cleanup_health.last_success_at
          END,
          last_failure_at = CASE
            WHEN EXCLUDED.last_status = 'failure'
              THEN EXCLUDED.last_run_at
            ELSE object_upload_cleanup_health.last_failure_at
          END,
          consecutive_failures = CASE
            WHEN EXCLUDED.last_status = 'success'
              THEN 0
            ELSE object_upload_cleanup_health.consecutive_failures + 1
          END,
          total_runs = object_upload_cleanup_health.total_runs + 1,
          total_failures = object_upload_cleanup_health.total_failures
            + EXCLUDED.last_failure_count,
          last_scanned = EXCLUDED.last_scanned,
          last_objects_deleted = EXCLUDED.last_objects_deleted,
          last_intents_deleted = EXCLUDED.last_intents_deleted,
          last_failure_count = EXCLUDED.last_failure_count,
          last_error = EXCLUDED.last_error,
          updated_at = NOW()
      `);
    } catch (healthError) {
      console.error(
        "[object-storage] failed to record upload cleanup health:",
        healthError,
      );
    }
  }

  async getUploadIntentCleanupHealth(): Promise<UploadIntentCleanupHealth | null> {
    await this.ensureUploadIntentTable();
    const result = await db.execute(sql`
      SELECT
        last_run_at AS "lastRunAt",
        last_status AS "lastStatus",
        last_success_at AS "lastSuccessAt",
        last_failure_at AS "lastFailureAt",
        consecutive_failures AS "consecutiveFailures",
        total_runs AS "totalRuns",
        total_failures AS "totalFailures",
        last_scanned AS "lastScanned",
        last_objects_deleted AS "lastObjectsDeleted",
        last_intents_deleted AS "lastIntentsDeleted",
        last_failure_count AS "lastFailureCount",
        last_error AS "lastError",
        updated_at AS "updatedAt"
      FROM object_upload_cleanup_health
      WHERE id = 1
    `);
    const rows =
      (result as unknown as { rows?: UploadIntentCleanupHealth[] }).rows ?? [];
    return rows[0] ?? null;
  }

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets an owner-bound upload URL for an object entity.
  async getObjectEntityUploadURL({
    ownerId,
    metadata,
  }: {
    ownerId: string;
    metadata: UploadMetadata;
  }): Promise<string> {
    const normalizedMetadata = normalizeUploadMetadata(metadata);
    await this.ensureUploadIntentTable();
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL.
    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: UPLOAD_INTENT_TTL_SECONDS,
    });
    const objectPath = this.normalizeObjectEntityPath(uploadURL);
    const expiresAt = new Date(Date.now() + UPLOAD_INTENT_TTL_SECONDS * 1000);
    await db.insert(objectUploadIntents).values({
      objectPath,
      ownerId,
      originalName: normalizedMetadata.name,
      declaredSize: normalizedMetadata.size,
      contentType: normalizedMetadata.contentType,
      expiresAt,
    });
    return uploadURL;
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<File> {
    const objectFile = this.getObjectEntityFileReference(objectPath);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  /**
   * Delete an object issued through the /objects upload namespace.
   *
   * Missing objects are treated as already cleaned up. Other storage errors
   * are allowed to reach the caller so the corresponding intent stays in the
   * database and can be retried on the next cleanup pass.
   */
  async deleteObjectEntity(objectPath: string): Promise<void> {
    const objectFile = this.getObjectEntityFileReference(objectPath);
    try {
      await objectFile.delete();
    } catch (error) {
      if ((error as { code?: number })?.code !== 404) {
        throw error;
      }
    }
  }

  /**
   * Remove expired upload intents in a bounded batch.
   *
   * Consumed intents are metadata only after attachment and can be removed
   * once expired. An unconsumed intent still owns a potentially abandoned
   * object, so its object is deleted before the intent row is removed. If
   * storage deletion fails, the row is retained for a later retry.
   */
  async cleanupExpiredUploadIntents(
    batchSize = UPLOAD_INTENT_CLEANUP_BATCH_SIZE,
  ): Promise<UploadIntentCleanupResult> {
    const result: UploadIntentCleanupResult = {
      scanned: 0,
      objectsDeleted: 0,
      intentsDeleted: 0,
      failures: 0,
    };

    try {
      await this.ensureUploadIntentTable();
      const requestedBatchSize = Number.isFinite(batchSize)
        ? Math.floor(batchSize)
        : UPLOAD_INTENT_CLEANUP_BATCH_SIZE;
      const limit = Math.max(
        1,
        Math.min(requestedBatchSize, UPLOAD_INTENT_CLEANUP_BATCH_SIZE),
      );
      const now = new Date();
      const intents = await db
        .select()
        .from(objectUploadIntents)
        .where(lte(objectUploadIntents.expiresAt, now))
        .orderBy(asc(objectUploadIntents.expiresAt))
        .limit(limit);
      result.scanned = intents.length;

      for (const intent of intents) {
        if (intent.consumedAt === null) {
          try {
            await this.deleteObjectEntity(intent.objectPath);
            result.objectsDeleted += 1;
          } catch (error) {
            result.failures += 1;
            console.error(
              `[object-storage] failed to delete abandoned upload ${intent.objectPath}:`,
              error,
            );
            continue;
          }
        }

        try {
          const deleted = await db
            .delete(objectUploadIntents)
            .where(
              and(
                eq(objectUploadIntents.objectPath, intent.objectPath),
                lte(objectUploadIntents.expiresAt, now),
                intent.consumedAt === null
                  ? isNull(objectUploadIntents.consumedAt)
                  : eq(objectUploadIntents.consumedAt, intent.consumedAt),
              ),
            )
            .returning({ objectPath: objectUploadIntents.objectPath });
          if (deleted.length > 0) {
            result.intentsDeleted += 1;
          }
        } catch (error) {
          result.failures += 1;
          console.error(
            `[object-storage] failed to remove expired upload intent ${intent.objectPath}:`,
            error,
          );
        }
      }

      await this.recordUploadIntentCleanupHealth(result);
      return result;
    } catch (error) {
      await this.recordUploadIntentCleanupHealth(result, error);
      throw error;
    }
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
  
    // Extract the entity ID from the path
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
    options: {
      requireUploadIntent?: boolean;
      consumeUploadIntent?: boolean;
    } = {},
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    let intent: typeof objectUploadIntents.$inferSelect | undefined;
    if (options.requireUploadIntent) {
      intent = await this.getUploadIntent(normalizedPath, aclPolicy.owner);
      const [metadata] = await objectFile.getMetadata();
      const actualSize = Number(metadata.size);
      const actualContentType = String(metadata.contentType || "")
        .split(";", 1)[0]
        .trim()
        .toLowerCase();
      if (
        !Number.isSafeInteger(actualSize) ||
        actualSize > intent.declaredSize ||
        actualContentType !== intent.contentType
      ) {
        throw new ObjectUploadIntentError("Uploaded file metadata does not match the issued upload.");
      }
      await validateObjectContentType(objectFile, intent.contentType);
    }
    await setObjectAclPolicy(objectFile, aclPolicy);
    if (intent && options.consumeUploadIntent !== false) {
      const claimed = await db
        .update(objectUploadIntents)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(objectUploadIntents.objectPath, normalizedPath),
            eq(objectUploadIntents.ownerId, aclPolicy.owner),
            isNull(objectUploadIntents.consumedAt),
            gt(objectUploadIntents.expiresAt, new Date()),
          ),
        )
        .returning({ objectPath: objectUploadIntents.objectPath });
      if (claimed.length === 0) {
        throw new ObjectUploadIntentError();
      }
    }
    return normalizedPath;
  }

  private async getUploadIntent(
    objectPath: string,
    ownerId: string,
  ): Promise<typeof objectUploadIntents.$inferSelect> {
    await this.ensureUploadIntentTable();
    const [intent] = await db
      .select()
      .from(objectUploadIntents)
      .where(
        and(
          eq(objectUploadIntents.objectPath, objectPath),
          eq(objectUploadIntents.ownerId, ownerId),
          isNull(objectUploadIntents.consumedAt),
          gt(objectUploadIntents.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!intent) throw new ObjectUploadIntentError();
    return intent;
  }

  /**
   * Missing ACL metadata remains publicly readable for legacy objects. Newly
   * issued objects are the exception: until their ACL is written, an active
   * upload intent is enough to keep the object owner-only.
   *
   * Returns null when the path was not issued by this flow, so callers can
   * retain the existing legacy-object behavior.
   */
  async canAccessIssuedUpload(
    objectPath: string,
    userId?: string,
  ): Promise<boolean | null> {
    await this.ensureUploadIntentTable();
    const [intent] = await db
      .select({
        ownerId: objectUploadIntents.ownerId,
        expiresAt: objectUploadIntents.expiresAt,
      })
      .from(objectUploadIntents)
      .where(eq(objectUploadIntents.objectPath, objectPath))
      .limit(1);
    if (!intent) return null;
    return Boolean(
      userId &&
        intent.ownerId === userId &&
        intent.expiresAt.getTime() > Date.now(),
    );
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  private getObjectEntityFileReference(objectPath: string): File {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2 || !parts.slice(1).join("/")) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    return objectStorageClient.bucket(bucketName).file(objectName);
  }
}

function hasBytes(
  bytes: Uint8Array,
  expected: readonly number[],
  offset = 0,
): boolean {
  return expected.every(
    (value, index) => bytes[offset + index] === value,
  );
}
function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}


/**
 * Read only enough of an uploaded object to validate its declared type.
 */
export async function validateObjectContentType(
  file: File,
  contentType: string,
): Promise<void> {
  const [bytes] = await file.download({
    start: 0,
    end: CONTENT_SNIFF_BYTES - 1,
    validation: false,
  });
  if (!matchesObjectContentType(bytes, contentType)) {
    throw new ObjectUploadIntentError(
      "Uploaded file contents do not match the declared type.",
    );
  }
}

function isHeifContainer(bytes: Uint8Array): boolean {
  if (!isIsoBmffContainer(bytes)) return false;

  const heifBrands = new Set([
    "heic",
    "heix",
    "hevc",
    "hevx",
    "heif",
    "mif1",
    "msf1",
  ]);
  const brands = [ascii(bytes, 8, 4)];
  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    brands.push(ascii(bytes, offset, 4));
  }
  return brands.some((brand) => heifBrands.has(brand));
}

function isIsoBmffContainer(bytes: Uint8Array): boolean {
  // An ISO Base Media File Format file starts with a box whose type is ftyp.
  return hasAscii(bytes, 4, "ftyp") && bytes.length >= 12;
}

/**
 * Check the small set of file signatures supported by the upload policy.
 * This is intentionally a lightweight content check, not a full parser or
 * malware scan. Container formats such as WebM and MP4 cannot distinguish
 * audio from video from their leading bytes alone, so their shared container
 * signature is the strongest check available here.
 */
export function matchesObjectContentType(
  bytes: Uint8Array,
  contentType: string,
): boolean {
  const normalizedType = contentType.split(";", 1)[0].trim().toLowerCase();

  switch (normalizedType) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return hasAscii(bytes, 0, "GIF87a") || hasAscii(bytes, 0, "GIF89a");
    case "image/webp":
      return hasAscii(bytes, 0, "RIFF") && hasAscii(bytes, 8, "WEBP");
    case "image/heic":
    case "image/heif":
      return isHeifContainer(bytes);
    case "audio/webm":
    case "video/webm":
      return hasBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
    case "audio/mpeg":
    case "audio/mp3":
      return (
        hasAscii(bytes, 0, "ID3") ||
        (bytes.length >= 2 &&
          bytes[0] === 0xff &&
          (bytes[1] & 0xe0) === 0xe0 &&
          (bytes[1] & 0x06) !== 0)
      );
    case "audio/wav":
    case "audio/x-wav":
      return hasAscii(bytes, 0, "RIFF") && hasAscii(bytes, 8, "WAVE");
    case "audio/ogg":
      return hasAscii(bytes, 0, "OggS");
    case "audio/mp4":
    case "audio/x-m4a":
    case "video/mp4":
      return isIsoBmffContainer(bytes);
    case "audio/aac":
      return (
        bytes.length >= 2 &&
        bytes[0] === 0xff &&
        (bytes[1] & 0xf6) === 0xf0
      );
    case "application/pdf":
      return hasAscii(bytes, 0, "%PDF-");
    default:
      return false;
  }
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function hasAscii(
  bytes: Uint8Array,
  offset: number,
  expected: string,
): boolean {
  if (bytes.length < offset + expected.length) return false;
  return expected.split("").every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  );
}
