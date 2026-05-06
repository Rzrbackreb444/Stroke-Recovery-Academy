/**
 * Generate a single audiobook sample from the manuscript using ElevenLabs +
 * Nick Kremers' cloned voice, then upload to Replit Object Storage as a PUBLIC
 * object so the user can preview quality before authorizing the full ~$110
 * 30-chapter generation.
 *
 * Usage:  tsx scripts/generateAudiobookSample.ts
 *
 * Cost:   ~$0.75 in EL credits (one ~700-word excerpt, single API call).
 */
import fs from "fs";
import path from "path";
import { objectStorageClient } from "../server/replit_integrations/object_storage";

const VOICE_ID = "l99zGWzl56Nw1DioDn7G"; // Nick Kremers
const MODEL_ID = "eleven_multilingual_v2";
const MD_PATH = path.resolve("attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md");
const SAMPLE_KEY = "audiobook/samples/sasquatch-battle-cry-sample.mp3";

function extractSampleText(): string {
  const raw = fs.readFileSync(MD_PATH, "utf8");
  // Pull from "## Author's Note: The Sasquatch Battle Cry" through the next "##"
  const start = raw.indexOf("## Author's Note: The Sasquatch Battle Cry");
  if (start < 0) throw new Error("Author's Note section not found");
  const after = raw.slice(start + 1);
  const end = after.indexOf("\n## ");
  const section = end > 0 ? raw.slice(start, start + 1 + end) : raw.slice(start);

  // Strip the heading itself + any leading hashes/quotes
  const lines = section.split("\n").slice(1);

  const cleaned = lines
    .map(l =>
      l
        .replace(/^>\s?/, "")
        .replace(/^#+\s+/, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Cap at ~3500 chars to stay safely inside ElevenLabs' single-request limit
  // and keep the sample cost predictable.
  return cleaned.length > 3500 ? cleaned.slice(0, 3500).replace(/\s+\S*$/, ".") : cleaned;
}

async function ttsToBuffer(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
    }),
  });

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`ElevenLabs ${r.status}: ${body.slice(0, 500)}`);
  }
  return Buffer.from(await r.arrayBuffer());
}

async function uploadPublic(bucketPath: string, body: Buffer): Promise<string> {
  // bucketPath like "/replit-objstore-<id>/public/audiobook/samples/foo.mp3"
  const publicPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!publicPaths.length) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  const fullPath = `${publicPaths[0]}/${bucketPath}`;
  const parts = fullPath.replace(/^\/+/, "").split("/");
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");

  const file = objectStorageClient.bucket(bucketName).file(objectName);
  await file.save(body, {
    contentType: "audio/mpeg",
    metadata: {
      cacheControl: "public, max-age=3600",
    },
  });
  // Replit's public search-path makes this URL stable + cacheable via /public-objects/* serving.
  // Return both the storage path and a hint URL the user can curl directly via signed-URL fallback.
  return `gs://${bucketName}/${objectName}`;
}

async function signedReadUrl(gsPath: string, ttlSec = 86400): Promise<string> {
  const m = gsPath.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!m) throw new Error(`Bad gs path: ${gsPath}`);
  const [, bucket, object] = m;
  const r = await fetch("http://127.0.0.1:1106/object-storage/signed-object-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucket,
      object_name: object,
      method: "GET",
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
  });
  if (!r.ok) throw new Error(`sign URL failed ${r.status}`);
  const j = (await r.json()) as { signed_url: string };
  return j.signed_url;
}

async function main() {
  const text = extractSampleText();
  console.log(`[sample] text length: ${text.length} chars`);
  console.log(`[sample] first 200: ${text.slice(0, 200)}…`);
  console.log(`[sample] requesting TTS from ElevenLabs (voice=${VOICE_ID})…`);
  const t0 = Date.now();
  const mp3 = await ttsToBuffer(text);
  console.log(`[sample] received ${(mp3.length / 1024).toFixed(1)} KB in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const gsPath = await uploadPublic(SAMPLE_KEY, mp3);
  console.log(`[sample] uploaded → ${gsPath}`);
  const url = await signedReadUrl(gsPath, 86400);
  console.log(`\n[sample] PREVIEW URL (24h):\n${url}\n`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
