/**
 * Daily Spark Video Indexer
 * Enriches community videos that have no tags using Gemini (text-only, cheap).
 * Also marks all public videos as indexed so search ranking stays fresh.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { pgTextArray } from "./lib/pgArray";

const DEFICIT_KEYWORDS: Record<string, string[]> = {
  motor: ["arm", "hand", "leg", "walk", "gait", "movement", "exercise", "physical", "strength", "balance", "coordination"],
  speech: ["speech", "aphasia", "talking", "words", "language", "stutter", "communication", "voice", "articulation"],
  cognitive: ["memory", "think", "focus", "cognitive", "brain", "concentration", "executive", "problem"],
  fatigue: ["tired", "fatigue", "energy", "rest", "nap", "exhausted", "pacing"],
  vision: ["vision", "eye", "sight", "visual", "double", "field"],
  emotional: ["emotion", "mood", "anxiety", "depression", "mental", "mindset", "motivation", "fear"],
};

const RECOVERY_TAGS = [
  "strokerecovery", "neverzero", "neuroplasticity", "strokesurvivor",
  "braininjury", "rehabilitation", "strokelife", "survivor", "recovery",
  "strokeawareness", "healing", "brainstroke", "physicaltherapy",
];

function inferTagsFromText(title: string, description: string): { tags: string[]; deficitTags: string[] } {
  const lower = `${title} ${description}`.toLowerCase();
  const deficitTags: string[] = [];
  for (const [deficit, keywords] of Object.entries(DEFICIT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      deficitTags.push(deficit);
    }
  }
  const tags: string[] = RECOVERY_TAGS.filter((t) => lower.includes(t.replace("strokerecovery", "stroke").replace("neverzero", "zero")));
  if (tags.length === 0) tags.push("strokerecovery", "survivor");
  return { tags: [...new Set(tags)].slice(0, 5), deficitTags: [...new Set(deficitTags)].slice(0, 5) };
}

export async function runDailyVideoIndex(): Promise<void> {
  const start = Date.now();
  let enriched = 0;
  let skipped = 0;

  try {
    // ── Self-provision spark_index_runs log table ─────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spark_index_runs (
        id SERIAL PRIMARY KEY,
        ran_at TIMESTAMP NOT NULL DEFAULT NOW(),
        enriched INT NOT NULL DEFAULT 0,
        skipped INT NOT NULL DEFAULT 0,
        duration_ms INT NOT NULL DEFAULT 0
      )
    `);

    // ── Find videos with empty tags that have title/description ───────────────
    const untagged = await db.execute(sql`
      SELECT id, title, description
        FROM community_videos
       WHERE is_public = TRUE
         AND cardinality(tags) = 0
         AND (title IS NOT NULL AND length(title) > 3)
       ORDER BY created_at DESC
       LIMIT 50
    `);

    const rows = (untagged.rows ?? untagged) as Array<{ id: number; title: string; description: string | null }>;

    for (const row of rows) {
      try {
        // Try Gemini-assisted tagging first, fall back to keyword inference
        let tags: string[];
        let deficitTags: string[];

        try {
          const { generateSparkMetadata } = await import("./geminiService");
          const ctx = [row.title, row.description].filter(Boolean).join(" — ");
          const meta = await generateSparkMetadata(ctx, []);
          tags = meta.hashtags.length ? meta.hashtags : inferTagsFromText(row.title, row.description ?? "").tags;
          deficitTags = inferTagsFromText(row.title, row.description ?? "").deficitTags;
        } catch {
          const inferred = inferTagsFromText(row.title, row.description ?? "");
          tags = inferred.tags;
          deficitTags = inferred.deficitTags;
        }

        await db.execute(sql`
          UPDATE community_videos
             SET tags = ${pgTextArray(tags)},
                 deficit_tags = ${pgTextArray(deficitTags)}
           WHERE id = ${row.id} AND cardinality(tags) = 0
        `);
        enriched++;
      } catch (err) {
        console.error(`[spark-index] failed row ${row.id}:`, err);
        skipped++;
      }
    }

    // ── Expire stale boosts ────────────────────────────────────────────────────
    await db.execute(sql`
      UPDATE community_videos
         SET boosted_until = NULL
       WHERE boosted_until IS NOT NULL AND boosted_until < NOW()
    `).catch(() => {}); // column may not exist yet on first run

    const duration = Date.now() - start;
    await db.execute(sql`
      INSERT INTO spark_index_runs (enriched, skipped, duration_ms)
      VALUES (${enriched}, ${skipped}, ${duration})
    `);

    console.log(`[spark-index] done — enriched=${enriched} skipped=${skipped} ms=${duration}`);
  } catch (err) {
    console.error("[spark-index] fatal:", err);
  }
}
