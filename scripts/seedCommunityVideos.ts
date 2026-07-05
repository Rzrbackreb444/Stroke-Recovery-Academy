/**
 * Seeds 3 community videos from attached_assets into object storage + DB.
 * Run: npx tsx scripts/seedCommunityVideos.ts
 */

import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { createReadStream, statSync } from "fs";
import path from "path";
import { db } from "../server/db";
import { communityVideos } from "../shared/schema";
import { eq } from "drizzle-orm";

// ── Config ────────────────────────────────────────────────────────────────────

const BUCKET = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
const PRIVATE_DIR = (process.env.PRIVATE_OBJECT_DIR ?? "").replace(/^\/[^/]+\//, ""); // strip leading bucket prefix → ".private"
const SIDECAR = "http://127.0.0.1:1106";
const ADMIN_USER_ID = "45009283"; // Nick Kremers

const SEED_VIDEOS = [
  {
    filePath: "attached_assets/v12044gd0000cfujmsbc77u1e71oqg7g_1783280555377.mp4",
    title: "Early Days — Finding My Footing After Stroke",
    description: "Six months post-stroke. Left side still fighting me on every step. Sharing this because nobody tells you how long the grind actually is — and that the grind is the point.",
    deficitTags: ["motor", "fatigue"],
    tags: ["walking", "left-side", "early recovery", "week by week"],
    isFeatured: true,
    isPinned: false,
  },
  {
    filePath: "attached_assets/v12044gd0000ckvb5snog65mnhlqf4n0_1783280582445.mp4",
    title: "Speech Reps — 100 Days of Saying Words Out Loud",
    description: "Aphasia hit me harder than the paralysis. This is day 100 of doing speech drills every single morning. Some days I nail it. Most days I don't. Both count.",
    deficitTags: ["speech", "cognitive"],
    tags: ["aphasia", "speech therapy", "daily reps", "100 days"],
    isFeatured: true,
    isPinned: false,
  },
  {
    filePath: "attached_assets/v12044gd0000cj7tjpbc77ubs6sne45g_1783280689842.mp4",
    title: "Year Two — What Nobody Warns You About",
    description: "The plateau hits around month 14. Your team calls it progress. You feel stuck. Here's what actually got me moving again — and why Sasquatch energy is the only framework that made sense.",
    deficitTags: ["fatigue", "emotional"],
    tags: ["plateau", "year two", "mindset", "sasquatch", "long-haul"],
    isFeatured: false,
    isPinned: true,
  },
];

// ── GCS client (same sidecar auth as the server) ──────────────────────────────

const gcs = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  } as any,
  projectId: "",
});

async function uploadFile(localPath: string): Promise<string> {
  const objectId = randomUUID();
  // PRIVATE_DIR env has format like ".private", strip leading slash if any
  const privatePart = PRIVATE_DIR.replace(/^\//, "");
  const objectName = `${privatePart}/uploads/${objectId}`;

  console.log(`  Uploading ${path.basename(localPath)} → gs://${BUCKET}/${objectName}`);
  const bucket = gcs.bucket(BUCKET);
  await bucket.upload(localPath, {
    destination: objectName,
    metadata: { contentType: "video/mp4" },
  });

  // The /objects route handler prepends PRIVATE_OBJECT_DIR internally, so
  // we only store the sub-path after the private dir prefix: /objects/uploads/<uuid>
  return `/objects/uploads/${objectId}`;
}

async function main() {
  console.log("[seed-community-videos] Starting…");
  console.log(`  Bucket: ${BUCKET}`);
  console.log(`  Private dir: ${PRIVATE_DIR}`);
  console.log(`  Admin user: ${ADMIN_USER_ID}`);

  // Skip if already seeded
  const existing = await db
    .select({ id: communityVideos.id })
    .from(communityVideos)
    .where(eq(communityVideos.uploaderId, ADMIN_USER_ID))
    .limit(1);

  if (existing.length > 0) {
    console.log("[seed-community-videos] Already seeded — skipping.");
    process.exit(0);
  }

  for (const v of SEED_VIDEOS) {
    const fullPath = path.resolve(process.cwd(), v.filePath);
    let size: number;
    try {
      size = statSync(fullPath).size;
    } catch {
      console.error(`  File not found: ${fullPath} — skipping.`);
      continue;
    }

    console.log(`\n[${v.title}]`);
    const videoUrl = await uploadFile(fullPath);

    const [row] = await db.insert(communityVideos).values({
      uploaderId: ADMIN_USER_ID,
      title: v.title,
      description: v.description,
      tags: v.tags,
      deficitTags: v.deficitTags,
      videoUrl,
      thumbnailUrl: null,
      durationSeconds: null,
      fileSizeBytes: size,
      isPublic: true,
      isFeatured: v.isFeatured,
      isPinned: v.isPinned,
      source: "seed",
    }).returning();

    console.log(`  Inserted community_videos id=${row.id}`);
  }

  console.log("\n[seed-community-videos] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-community-videos] Fatal:", err);
  process.exit(1);
});
