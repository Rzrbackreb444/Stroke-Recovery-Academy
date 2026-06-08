import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

/**
 * Uploads book PDFs to Replit Object Storage.
 * Files go to the public bucket for Lulu download access.
 */

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const ROOT = path.resolve('attached_assets/book_v2');
const INTERIOR_PDF = path.join(ROOT, 'THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION.pdf');
const COVER_PDF = path.join(ROOT, 'cover.pdf');

// Public bucket from PUBLIC_OBJECT_SEARCH_PATHS
const publicPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map(p => p.trim()).filter(Boolean);
const firstPath = publicPaths[0];

if (!firstPath) {
  console.error("PUBLIC_OBJECT_SEARCH_PATHS not set. Cannot upload to Object Storage.");
  process.exit(1);
}

const parts = firstPath.split("/").filter(Boolean);
const bucketName = parts[0];
const bucket = storageClient.bucket(bucketName);

async function uploadFile(localPath, objectName, contentType) {
  const file = bucket.file(objectName);
  const buffer = fs.readFileSync(localPath);

  await file.save(buffer, {
    contentType,
    resumable: false,
  });

  // Make it public-read
  await file.setMetadata({
    metadata: {
      visibility: "public",
    },
  });

  const [metadata] = await file.getMetadata();
  const publicUrl = metadata.mediaLink || `https://storage.googleapis.com/${bucketName}/${objectName}`;

  return publicUrl;
}

async function main() {
  console.log("Uploading book files to Object Storage...");
  console.log(`  Bucket: ${bucketName}`);

  if (!fs.existsSync(INTERIOR_PDF)) {
    console.error("Interior PDF not found:", INTERIOR_PDF);
    process.exit(1);
  }
  if (!fs.existsSync(COVER_PDF)) {
    console.error("Cover PDF not found:", COVER_PDF);
    process.exit(1);
  }

  const interiorUrl = await uploadFile(INTERIOR_PDF, "book/full.pdf", "application/pdf");
  console.log("Interior PDF uploaded:", interiorUrl);

  const coverUrl = await uploadFile(COVER_PDF, "book/cover.pdf", "application/pdf");
  console.log("Cover PDF uploaded:", coverUrl);

  // Print URL constants for the seed script
  console.log("\n--- Seed script references ---");
  console.log(`interiorPdfUrl: ${interiorUrl}`);
  console.log(`coverPdfUrl: ${coverUrl}`);
}

main().catch(e => {
  console.error("Upload failed:", e);
  process.exit(1);
});
