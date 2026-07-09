import { sql, type SQL } from "drizzle-orm";

/**
 * Build a parametrized Postgres array literal for a raw `db.execute(sql`...`)`
 * write against a `text[]` column (or an `= ANY(...)` lookup).
 *
 * WHY THIS EXISTS: interpolating a bare JS array directly into a raw sql
 * template (e.g. `VALUES (..., ${jsArray})`) does NOT serialize to a Postgres
 * array under the neon-serverless driver — Postgres receives an unbraced scalar
 * and throws `22P02 malformed array literal`, silently 500-ing the save.
 * `${JSON.stringify(arr)}::text[]` is ALSO broken (emits JSON `["a"]`, not PG
 * `{a}`). Always route array writes through this helper.
 *
 * Each element stays a bound parameter (injection-safe) and the explicit
 * `ARRAY[...]::text[]` constructor guarantees valid array typing. An empty /
 * non-array input yields `ARRAY[]::text[]`.
 *
 * See `.agents/memory/db-execute-text-array.md` for the full rationale.
 */
export function pgTextArray(value: unknown): SQL {
  const arr = Array.isArray(value) ? value.map((v) => String(v)) : [];
  return arr.length
    ? sql`ARRAY[${sql.join(arr.map((t) => sql`${t}`), sql`, `)}]::text[]`
    : sql`ARRAY[]::text[]`;
}
