/**
 * tests/noRawArrayInterpolation.test.ts — static guard that flags raw-SQL
 * array interpolation of bare JS values creeping back into the codebase.
 *
 * The neon-serverless driver serializes a bare `${jsArray}` interpolated into a
 * raw `sql` template as an unbraced scalar, producing `22P02 malformed array
 * literal` at runtime. The safe pattern is `server/lib/pgArray.ts::pgTextArray`
 * (or an inline `ARRAY[${sql.join(...)}]` constructor). This lint scans server
 * source for the dangerous forms and fails if any appear.
 *
 * Flagged forms:
 *   - `${identifier}::text[]`      → a JS value cast to text[] (must be ARRAY[…])
 *   - `${JSON.stringify(...)}::`   → JSON string cast to a PG array (always wrong)
 *   - `ANY(${identifier}::`        → bare JS value in an ANY(...) array cast
 *
 * A bare `${...sql.join...}` or `${pgTextArray(...)}` inside `ARRAY[...]` is the
 * safe pattern and is NOT flagged.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "lib") continue; // pgArray.ts lives in lib and is the sanctioned constructor
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

// A value cast straight to a PG array type: `${something}::text[]` /
// `${something}::int[]`. The `something` may not be a `sql`...`` chunk or a
// call producing one. We approximate "dangerous" as: a bare identifier or a
// JSON.stringify call directly followed by `::<type>[]`.
const CAST_RE = /\$\{\s*(?:JSON\.stringify\([^)]*\)|[A-Za-z_$][\w$.]*)\s*\}::\w+\[\]/g;
// A bare value handed to ANY(...) with an array cast: `ANY(${ident}::text[])`.
const ANY_RE = /ANY\(\s*\$\{\s*(?:JSON\.stringify\([^)]*\)|[A-Za-z_$][\w$.]*)\s*\}::/g;

function run() {
  console.log("\nnoRawArrayInterpolation.test.ts\n");

  const files = walk("server");
  const offenders: string[] = [];

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      // Skip the safe constructor: `ARRAY[${sql.join(...)}]::text[]` produces
      // `${...}::text[]` only when the interpolation is a full sql chunk, which
      // our identifier regex ignores (sql.join(...) is a call, not `ident::`).
      for (const re of [CAST_RE, ANY_RE]) {
        re.lastIndex = 0;
        if (re.test(line)) {
          offenders.push(`${file}:${i + 1}  ${line.trim()}`);
        }
      }
    });
  }

  assert(
    offenders.length === 0,
    offenders.length === 0
      ? "no raw bare-array ::text[] / ANY(${...}::) interpolations found"
      : `found ${offenders.length} dangerous raw-array interpolation(s):\n    ${offenders.join("\n    ")}`,
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(failed === 0 ? 0 : 1);
}

run();
