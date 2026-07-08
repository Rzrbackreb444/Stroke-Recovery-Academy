/**
 * One-time migration: move legacy base64 audio data URLs from Postgres
 * into Replit Object Storage.
 *
 * Run:
 *   npx tsx scripts/migrateAudioToObjectStorage.ts [--dry-run] [--table TABLE]
 *
 * Options:
 *   --dry-run   Print what would be uploaded without writing anything.
 *   --table     Migrate only one table (anchors|anthems|motivation|quotes|podcast|dj).
 *               Defaults to all tables.
 *   --limit N   Stop after N rows per table (default: unlimited). Useful for testing.
 *
 * Safe to re-run: rows whose audioUrl is already an /objects/... path are skipped.
 */

import "dotenv/config";
import { db } from "../server/db";
import {
  recoveryAnchors,
  recoveryAnthems,
  motivationArtifacts,
  dailyQuotes,
  podcastEpisodes,
  radioDjIntros,
} from "../shared/schema";
import { eq, like } from "drizzle-orm";
import { uploadAudioBuffer, isBase64AudioUrl } from "../server/lib/audioStorage";

// ──────────────────────────────────────────────────────────────
// CLI args
// ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const tableFlag = args.find((_, i) => args[i - 1] === "--table");
const limitFlag = args.find((_, i) => args[i - 1] === "--limit");
const ROW_LIMIT = limitFlag ? parseInt(limitFlag, 10) : Infinity;

if (DRY_RUN) console.log("[migrate] DRY RUN — no writes will occur");

// ──────────────────────────────────────────────────────────────
// Generic row migrator
// ──────────────────────────────────────────────────────────────
interface MigrateTableOpts<T> {
  label: string;
  fetchRows: () => Promise<T[]>;
  getAudioUrl: (row: T) => string | null | undefined;
  getId: (row: T) => number;
  getOwner: (row: T) => string | null | undefined;
  visibility: "public" | "private";
  updateRow: (id: number, newPath: string) => Promise<void>;
}

async function migrateTable<T>(opts: MigrateTableOpts<T>) {
  const { label, fetchRows, getAudioUrl, getId, getOwner, visibility, updateRow } = opts;
  console.log(`\n[${label}] fetching rows with base64 audio...`);

  const rows = await fetchRows();
  const legacy = rows
    .filter((r) => isBase64AudioUrl(getAudioUrl(r)))
    .slice(0, ROW_LIMIT);

  console.log(`[${label}] found ${legacy.length} base64 rows to migrate`);
  if (legacy.length === 0) return;

  let ok = 0;
  let fail = 0;

  for (const row of legacy) {
    const id = getId(row);
    const audioUrl = getAudioUrl(row)!;
    const owner = getOwner(row) ?? null;

    const m = audioUrl.match(/^data:(audio\/[^;]+);base64,(.+)$/s);
    if (!m) {
      console.warn(`[${label}] row ${id}: malformed data URL — skipping`);
      fail++;
      continue;
    }

    const contentType = m[1];
    const buf = Buffer.from(m[2], "base64");

    if (DRY_RUN) {
      console.log(
        `[${label}] DRY row ${id}: would upload ${buf.length} bytes as ${contentType} (${visibility}, owner=${owner ?? "none"})`,
      );
      ok++;
      continue;
    }

    try {
      const newPath = await uploadAudioBuffer({
        buffer: buf,
        contentType,
        owner,
        visibility,
        context: `migrate:${label}`,
      });
      await updateRow(id, newPath);
      console.log(`[${label}] row ${id}: migrated → ${newPath}`);
      ok++;
    } catch (e: any) {
      console.error(`[${label}] row ${id}: FAILED — ${e?.message ?? e}`);
      fail++;
    }
  }

  console.log(`[${label}] done. ok=${ok} fail=${fail}`);
}

// ──────────────────────────────────────────────────────────────
// Table definitions
// ──────────────────────────────────────────────────────────────
async function migrateAnchors() {
  await migrateTable({
    label: "anchors",
    fetchRows: () =>
      db
        .select({ id: recoveryAnchors.id, audioUrl: recoveryAnchors.audioUrl, userId: recoveryAnchors.userId })
        .from(recoveryAnchors)
        .where(like(recoveryAnchors.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: (r) => r.userId,
    visibility: "private",
    updateRow: async (id, path) => {
      await db.update(recoveryAnchors).set({ audioUrl: path }).where(eq(recoveryAnchors.id, id));
    },
  });
}

async function migrateAnthems() {
  await migrateTable({
    label: "anthems",
    fetchRows: () =>
      db
        .select({ id: recoveryAnthems.id, audioUrl: recoveryAnthems.audioUrl, userId: recoveryAnthems.userId })
        .from(recoveryAnthems)
        .where(like(recoveryAnthems.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: (r) => r.userId,
    visibility: "private",
    updateRow: async (id, path) => {
      await db.update(recoveryAnthems).set({ audioUrl: path }).where(eq(recoveryAnthems.id, id));
    },
  });
}

async function migrateMotivation() {
  await migrateTable({
    label: "motivation",
    fetchRows: () =>
      db
        .select({ id: motivationArtifacts.id, audioUrl: motivationArtifacts.audioUrl, userId: motivationArtifacts.userId })
        .from(motivationArtifacts)
        .where(like(motivationArtifacts.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: (r) => r.userId,
    visibility: "private",
    updateRow: async (id, path) => {
      await db.update(motivationArtifacts).set({ audioUrl: path }).where(eq(motivationArtifacts.id, id));
    },
  });
}

async function migrateQuotes() {
  await migrateTable({
    label: "daily-quotes",
    fetchRows: () =>
      db
        .select({ id: dailyQuotes.id, audioUrl: dailyQuotes.audioUrl })
        .from(dailyQuotes)
        .where(like(dailyQuotes.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: () => null,
    visibility: "public",
    updateRow: async (id, path) => {
      await db.update(dailyQuotes).set({ audioUrl: path }).where(eq(dailyQuotes.id, id));
    },
  });
}

async function migratePodcast() {
  await migrateTable({
    label: "podcast",
    fetchRows: () =>
      db
        .select({ id: podcastEpisodes.id, audioUrl: podcastEpisodes.audioUrl })
        .from(podcastEpisodes)
        .where(like(podcastEpisodes.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: () => null,
    visibility: "public",
    updateRow: async (id, path) => {
      await db.update(podcastEpisodes).set({ audioUrl: path }).where(eq(podcastEpisodes.id, id));
    },
  });
}

async function migrateDj() {
  await migrateTable({
    label: "dj-intros",
    fetchRows: () =>
      db
        .select({ id: radioDjIntros.id, audioUrl: radioDjIntros.audioUrl })
        .from(radioDjIntros)
        .where(like(radioDjIntros.audioUrl, "data:%")),
    getAudioUrl: (r) => r.audioUrl,
    getId: (r) => r.id,
    getOwner: () => null,
    visibility: "public",
    updateRow: async (id, path) => {
      await db.update(radioDjIntros).set({ audioUrl: path }).where(eq(radioDjIntros.id, id));
    },
  });
}

// ──────────────────────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────────────────────
const TABLE_MAP: Record<string, () => Promise<void>> = {
  anchors: migrateAnchors,
  anthems: migrateAnthems,
  motivation: migrateMotivation,
  quotes: migrateQuotes,
  podcast: migratePodcast,
  dj: migrateDj,
};

async function main() {
  if (tableFlag && !TABLE_MAP[tableFlag]) {
    console.error(`Unknown --table: ${tableFlag}. Valid: ${Object.keys(TABLE_MAP).join(", ")}`);
    process.exit(1);
  }

  const tasks = tableFlag ? [TABLE_MAP[tableFlag]] : Object.values(TABLE_MAP);
  for (const fn of tasks) await fn();

  console.log("\n[migrate] all done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("[migrate] fatal:", e);
  process.exit(1);
});
