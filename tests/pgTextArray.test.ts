/**
 * tests/pgTextArray.test.ts — integration guard against malformed Postgres
 * array writes through raw `db.execute(sql`...`)` under the neon-serverless
 * driver.
 *
 * Why these tests matter:
 *   - Interpolating a bare JS array into a raw sql template does NOT serialize
 *     to a Postgres array — the driver hands Postgres an unbraced scalar and it
 *     throws `22P02 malformed array literal`, silently 500-ing the save. This
 *     already broke medications (reminder_times), spotlight nominations
 *     (media_urls), community video tags, and the premium entitlement lookup.
 *   - The fix routes every array write through `pgTextArray()`. These tests
 *     exercise that helper against the REAL text[] columns those surfaces
 *     write to, with both a NON-EMPTY and an EMPTY array, and assert the values
 *     round-trip. If anyone reintroduces the bad `${jsArray}` pattern (or
 *     breaks the helper), a surface here starts throwing 22P02 and this fails.
 *
 * Coverage (per task): medications.reminder_times (INSERT + UPDATE),
 * spotlight_nominations.media_urls (INSERT), community_videos.tags +
 * deficit_tags (UPDATE), and the premium `= ANY(...)` read form.
 *
 * Test isolation:
 *   - A throwaway user row is created per run (FK parent for medications /
 *     community_videos) and everything is torn down in a finally{} block so a
 *     failed assertion never leaves zombie rows in the dev DB.
 */

import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { pool as dbPool } from "../server/db";
import { pgTextArray } from "../server/lib/pgArray";

// ── tiny test harness (matches stripeWebhook.test.ts) ──────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: any, msg: string) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    failed++;
    failures.push(msg);
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  }
}

// Read a text[] column back as a real JS array regardless of driver shape.
function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v == null) return [];
  // neon may hand back the raw postgres literal "{a,b}"
  if (typeof v === "string" && v.startsWith("{") && v.endsWith("}")) {
    const inner = v.slice(1, -1);
    return inner.length ? inner.split(",").map((s) => s.replace(/^"|"$/g, "")) : [];
  }
  return [];
}

async function run() {
  const runId = randomUUID().slice(0, 8);
  const userId = `test_pgarr_${runId}`;
  const createdMedIds: number[] = [];
  const createdVideoIds: number[] = [];
  const createdNominationIds: number[] = [];

  console.log(`\npgTextArray.test.ts (runId=${runId})\n`);

  try {
    // FK parent for medications + community_videos.
    await db.execute(sql`
      INSERT INTO users (id, email, first_name)
      VALUES (${userId}, ${`${userId}@test.invalid`}, 'PgArray Test')
      ON CONFLICT (id) DO NOTHING
    `);

    // ─────────────────────────────────────────────────────────────────────
    console.log("• helper output shape");
    {
      const empty = pgTextArray([]);
      const nonEmpty = pgTextArray(["a", "b"]);
      const notArray = pgTextArray(undefined);
      assert(!!empty && !!nonEmpty && !!notArray, "pgTextArray always returns an SQL chunk");
    }

    // ─────────────────────────────────────────────────────────────────────
    console.log("\n• medications.reminder_times — INSERT (non-empty + empty)");
    for (const times of [["08:00", "20:00"], [] as string[]]) {
      const r = await db.execute(sql`
        INSERT INTO medications (user_id, name, dosage, frequency, reminder_times)
        VALUES (${userId}, 'TestMed', '10mg', 'daily', ${pgTextArray(times)})
        RETURNING id, reminder_times
      `);
      const row: any = r.rows[0];
      createdMedIds.push(row.id);
      assert(
        JSON.stringify(asArray(row.reminder_times)) === JSON.stringify(times),
        `INSERT round-trips reminder_times=${JSON.stringify(times)} (got ${JSON.stringify(asArray(row.reminder_times))})`,
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    console.log("\n• medications.reminder_times — UPDATE (non-empty + empty)");
    {
      const medId = createdMedIds[0];
      for (const times of [["06:30"], [] as string[]]) {
        await db.execute(sql`
          UPDATE medications SET reminder_times = ${pgTextArray(times)}
          WHERE id = ${medId} AND user_id = ${userId}
        `);
        const r = await db.execute(sql`SELECT reminder_times FROM medications WHERE id = ${medId}`);
        assert(
          JSON.stringify(asArray((r.rows[0] as any).reminder_times)) === JSON.stringify(times),
          `UPDATE round-trips reminder_times=${JSON.stringify(times)}`,
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    console.log("\n• spotlight_nominations.media_urls — INSERT (non-empty + empty)");
    for (const media of [["https://x/1.png", "https://x/2.png"], [] as string[]]) {
      const r = await db.execute(sql`
        INSERT INTO spotlight_nominations
          (submitter_user_id, type, nominee_name, description, media_urls)
        VALUES (${userId}, 'self', 'Nominee', 'A description', ${pgTextArray(media)})
        RETURNING id, media_urls
      `);
      const row: any = r.rows[0];
      createdNominationIds.push(row.id);
      assert(
        JSON.stringify(asArray(row.media_urls)) === JSON.stringify(media),
        `INSERT round-trips media_urls=${JSON.stringify(media)} (got ${JSON.stringify(asArray(row.media_urls))})`,
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    console.log("\n• community_videos.tags + deficit_tags — UPDATE (non-empty + empty)");
    {
      const seed = await db.execute(sql`
        INSERT INTO community_videos (uploader_id, title, video_url)
        VALUES (${userId}, 'Test Video', 'https://x/v.mp4')
        RETURNING id
      `);
      const videoId = (seed.rows[0] as any).id;
      createdVideoIds.push(videoId);

      for (const [tags, deficits] of [
        [["strokerecovery", "survivor"], ["motor"]],
        [[] as string[], [] as string[]],
      ]) {
        await db.execute(sql`
          UPDATE community_videos
             SET tags = ${pgTextArray(tags)},
                 deficit_tags = ${pgTextArray(deficits)}
           WHERE id = ${videoId}
        `);
        const r = await db.execute(sql`SELECT tags, deficit_tags FROM community_videos WHERE id = ${videoId}`);
        const row: any = r.rows[0];
        assert(
          JSON.stringify(asArray(row.tags)) === JSON.stringify(tags) &&
            JSON.stringify(asArray(row.deficit_tags)) === JSON.stringify(deficits),
          `UPDATE round-trips tags=${JSON.stringify(tags)} deficit_tags=${JSON.stringify(deficits)}`,
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    console.log("\n• premium `= ANY(...)` read form (non-empty + empty)");
    {
      // Mirrors sasquatchPremiumService: filter a VALUES set by ANY(text[]).
      const eligible = ["price_alpha", "price_beta"];
      const hit = await db.execute(sql`
        SELECT p FROM (VALUES ('price_alpha'), ('price_gamma')) AS t(p)
         WHERE p = ANY(${pgTextArray(eligible)})
      `);
      assert(hit.rows.length === 1, `ANY(non-empty) matches exactly the eligible price (got ${hit.rows.length})`);

      const miss = await db.execute(sql`
        SELECT p FROM (VALUES ('price_alpha')) AS t(p)
         WHERE p = ANY(${pgTextArray([])})
      `);
      assert(miss.rows.length === 0, "ANY(empty) matches nothing and does not error");
    }
  } finally {
    // Teardown in finally{} so a failed assertion never leaks rows.
    try {
      if (createdMedIds.length)
        await db.execute(sql`DELETE FROM medications WHERE id = ANY(${sql`ARRAY[${sql.join(createdMedIds.map((i) => sql`${i}`), sql`, `)}]::int[]`})`);
      if (createdVideoIds.length)
        await db.execute(sql`DELETE FROM community_videos WHERE id = ANY(${sql`ARRAY[${sql.join(createdVideoIds.map((i) => sql`${i}`), sql`, `)}]::int[]`})`);
      if (createdNominationIds.length)
        await db.execute(sql`DELETE FROM spotlight_nominations WHERE id = ANY(${sql`ARRAY[${sql.join(createdNominationIds.map((i) => sql`${i}`), sql`, `)}]::int[]`})`);
      await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
    } catch (e) {
      console.error("[cleanup] failed:", e);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  await dbPool.end().catch(() => {});
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (e) => {
  console.error("fatal:", e);
  await dbPool.end().catch(() => {});
  process.exit(2);
});
