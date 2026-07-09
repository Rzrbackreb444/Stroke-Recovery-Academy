/**
 * Audio storage helpers — upload audio buffers to Replit Object Storage
 * instead of encoding them as base64 data URLs in Postgres.
 *
 * Pattern:
 *   1. Generate audio Buffer (ElevenLabs / any TTS).
 *   2. Call uploadAudioBuffer() → returns a /objects/... path.
 *   3. Store that path in the DB column (audio_url, imageUrl, etc.).
 *   4. When serving, call serveAudioResponse() — handles both modern paths
 *      and legacy base64 data URLs transparently.
 *   5. When a survivor shares an anchor/anthem, call setAudioObjectVisibility()
 *      to flip the GCS ACL to public so unauthenticated share pages can play it.
 *
 * Backward-compatible: isBase64AudioUrl() lets callers detect legacy rows.
 */

import { ObjectStorageService } from "../replit_integrations/object_storage/objectStorage";
import type { ObjectAclPolicy } from "../replit_integrations/object_storage/objectAcl";
import type { Response } from "express";

const objectStorage = new ObjectStorageService();

export type AudioVisibility = "private" | "public";

export interface UploadAudioOptions {
  buffer: Buffer;
  /** MIME type. Defaults to audio/mpeg */
  contentType?: string;
  /** userId for private objects; omit or null for public objects */
  owner?: string | null;
  visibility: AudioVisibility;
  /** Used only in structured log messages */
  context?: string;
}

/**
 * Upload an audio Buffer to object storage via the Replit sidecar presigned
 * URL flow. Returns the normalized /objects/... path for storage in the DB.
 *
 * Throws on any failure — callers should catch and decide whether to fall
 * back to base64 or abort the request.
 */
export async function uploadAudioBuffer({
  buffer,
  contentType = "audio/mpeg",
  owner,
  visibility,
  context = "audio",
}: UploadAudioOptions): Promise<string> {
  // 1. Request a presigned PUT URL from the Replit object-storage sidecar.
  const uploadURL = await objectStorage.getObjectEntityUploadURL();

  // 2. Stream the buffer directly to GCS via the presigned URL.
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: buffer,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
    },
  });

  if (!uploadRes.ok) {
    throw new Error(
      `[${context}] Object storage PUT failed: ${uploadRes.status} ${uploadRes.statusText}`,
    );
  }

  // 3. Set ACL metadata — owner + visibility. Returns normalized /objects/... path.
  // ObjectAclPolicy.owner is required by the type; use empty string for public/unowned objects.
  const aclPolicy: ObjectAclPolicy = {
    owner: owner ?? "",
    visibility,
  };

  return objectStorage.trySetObjectEntityAclPolicy(uploadURL, aclPolicy);
}

/**
 * Upload a generated image buffer to object storage.
 * Mirrors uploadAudioBuffer but with a configurable MIME type.
 */
export async function uploadImageBuffer({
  buffer,
  contentType = "image/png",
  owner,
  visibility,
  context = "image",
}: UploadAudioOptions): Promise<string> {
  return uploadAudioBuffer({ buffer, contentType, owner, visibility, context });
}

/**
 * Flip an already-stored object's ACL between public and private.
 *
 * Call when a survivor shares/unshares an anchor or anthem so the audio
 * becomes publicly accessible (or locked back to owner-only).
 *
 * Silently no-ops on:
 *   - null / undefined paths (no audio was generated)
 *   - legacy base64 data URLs (can't have ACL — stored in Postgres, not GCS)
 *   - transient storage errors (best-effort; logs a warning)
 */
export async function setAudioObjectVisibility(
  objectPath: string | null | undefined,
  visibility: AudioVisibility,
  owner?: string | null,
): Promise<void> {
  if (!objectPath || isBase64AudioUrl(objectPath)) return;
  try {
    const aclPolicy: ObjectAclPolicy = { owner: owner ?? "", visibility };
    await objectStorage.trySetObjectEntityAclPolicy(objectPath, aclPolicy);
  } catch (e) {
    console.warn(
      "[audioStorage] ACL flip failed (non-fatal):",
      (e as any)?.message ?? e,
    );
  }
}

/**
 * True if the stored value is a legacy base64 data URL rather than an
 * object storage path. Used to gate legacy decode paths during the
 * migration window when both formats coexist in the DB.
 */
export function isBase64AudioUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("data:");
}

/**
 * Serve an audio resource as a streaming response.
 *
 * Handles both:
 *   - Modern /objects/... paths  → proxies through the object storage service
 *     (respects Cache-Control: public for public objects)
 *   - Legacy base64 data URLs   → decodes in-process and sends binary bytes
 *
 * This means the podcast audio endpoint, DJ intro stream, etc. never need to
 * care which storage format is in the DB — they just call this helper.
 */
export async function serveAudioResponse(
  audioUrl: string,
  res: Response,
  opts?: { cacheMaxAge?: number },
): Promise<void> {
  const cacheMaxAge = opts?.cacheMaxAge ?? 86_400;

  if (isBase64AudioUrl(audioUrl)) {
    const m = audioUrl.match(/^data:(audio\/[^;]+);base64,(.+)$/s);
    if (!m) {
      if (!res.headersSent) res.status(500).send("Corrupt audio record");
      return;
    }
    const buf = Buffer.from(m[2], "base64");
    res.set({
      "Content-Type": m[1],
      "Accept-Ranges": "bytes",
      "Cache-Control": `public, max-age=${cacheMaxAge}`,
      "Content-Length": String(buf.length),
    });
    // nosemgrep: javascript.express.security.audit.xss.direct-response-write
    res.send(buf);
    return;
  }

  // Object storage path — proxy through GCS streaming.
  try {
    const file = await objectStorage.getObjectEntityFile(audioUrl);
    await objectStorage.downloadObject(file, res, cacheMaxAge);
  } catch (e: any) {
    if (!res.headersSent) res.status(404).send("Audio not found");
  }
}

/**
 * Compute an approximate raw byte length from either storage format.
 * Used to populate the <enclosure length> tag in the podcast RSS feed.
 *
 *   - base64: decode the payload length from the base64 string length
 *   - /objects/ path: return null (caller should skip or use 0)
 */
export function estimateAudioBytes(audioUrl: string | null | undefined): number | null {
  if (!audioUrl) return null;
  if (isBase64AudioUrl(audioUrl)) {
    const m = audioUrl.match(/^data:[^;]+;base64,(.+)$/s);
    if (!m) return null;
    // base64 encodes 3 bytes per 4 chars; subtract padding.
    const b64len = m[1].length;
    const padding = (m[1].match(/=+$/) ?? [""])[0].length;
    return Math.floor((b64len * 3) / 4) - padding;
  }
  return null; // object storage — byte length requires a HEAD call; skip for now
}
