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
import { and, eq, isNull, gt } from "drizzle-orm";
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
      `).then(() => undefined);
    }
    await ObjectStorageService.uploadIntentTableReady;
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
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
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

