export const MAX_UPLOAD_NAME_LENGTH = 255;
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const UPLOAD_INTENT_TTL_SECONDS = 15 * 60;

// Keep this list deliberately small. Object Storage upload URLs are writable,
// so accepting an unknown type here would turn this generic endpoint into an
// unbounded file-drop service.
export const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "audio/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/mp3",
  "audio/x-wav",
  "audio/x-m4a",
  "video/webm",
  "video/mp4",
  "application/pdf",
]);

export interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

export class UploadMetadataValidationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 413 | 415,
  ) {
    super(message);
    this.name = "UploadMetadataValidationError";
    Object.setPrototypeOf(this, UploadMetadataValidationError.prototype);
  }
}

/**
 * Normalize client-declared metadata before it is signed or persisted.
 * The filename is metadata only; it is never used to construct the object
 * path, but stripping path separators avoids persisting misleading names.
 */
export function normalizeUploadMetadata(input: unknown): UploadMetadata {
  if (!input || typeof input !== "object") {
    throw new UploadMetadataValidationError("Upload metadata is required.", 400);
  }

  const candidate = input as Record<string, unknown>;
  if (typeof candidate.name !== "string") {
    throw new UploadMetadataValidationError("A file name is required.", 400);
  }

  const name = candidate.name
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]+/g, "_")
    .trim();
  if (!name) {
    throw new UploadMetadataValidationError("A file name is required.", 400);
  }
  if (name.length > MAX_UPLOAD_NAME_LENGTH) {
    throw new UploadMetadataValidationError(
      `File name must be ${MAX_UPLOAD_NAME_LENGTH} characters or fewer.`,
      400,
    );
  }

  const size = candidate.size;
  if (
    typeof size !== "number" ||
    !Number.isSafeInteger(size) ||
    size <= 0
  ) {
    throw new UploadMetadataValidationError(
      "File size must be a positive integer.",
      400,
    );
  }
  if (size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadMetadataValidationError(
      "File is too large. The maximum upload size is 25MB.",
      413,
    );
  }

  if (typeof candidate.contentType !== "string") {
    throw new UploadMetadataValidationError("A content type is required.", 400);
  }
  const contentType = candidate.contentType
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType)) {
    throw new UploadMetadataValidationError(
      "That file type is not supported.",
      415,
    );
  }

  return { name, size, contentType };
}