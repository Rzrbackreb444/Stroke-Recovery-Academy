---
name: db.execute text[] array serialization
description: Inserting/updating a Postgres text[] column via drizzle db.execute(sql`...`) with the neon driver — a bare JS array param arrives malformed
---

# text[] with db.execute + neon serverless driver

When writing a Postgres `text[]` column through `db.execute(sql\`...\`)` (raw sql template, neon-serverless HTTP driver), interpolating a bare JS array as a parameter (e.g. `VALUES (..., ${reminderTimes || []})`) does NOT serialize to a Postgres array. Postgres receives an unbraced scalar and throws `22P02 malformed array literal: "08:00"`.

**Fix — build a parametrized ARRAY constructor with `sql.join`:**
```ts
const arr: string[] = Array.isArray(v) ? v.map(String) : [];
const arrSql = arr.length
  ? sql`ARRAY[${sql.join(arr.map((t) => sql`${t}`), sql`, `)}]::text[]`
  : sql`ARRAY[]::text[]`;
// then: VALUES (..., ${arrSql})
```
For an UPDATE where the field may be absent (preserve existing), fall back to the column name: `: sql\`reminder_times\``.

**Why:** each element stays a bound parameter (injection-safe) and the explicit `::text[]` cast + `ARRAY[]` constructor guarantees valid array typing. This is the established codebase pattern (see `ARRAY[${taskId}]::text[]` in routes.ts routine-completions).

**How to apply:** any new raw-`sql` insert/update touching a `text[]` (or other array) column. Do not rely on `${jsArray}` interpolation. The `medications` POST/PUT routes were silently broken by this before the fix.
