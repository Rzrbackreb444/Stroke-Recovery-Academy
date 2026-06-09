---
name: storage RETURNING * snake_case rows
description: Some server/storage.ts methods return raw snake_case DB rows, not camelCase-mapped objects — consumers must not assume camelCase.
---

# Raw `db.execute(sql\`...RETURNING *\`)` returns snake_case keys

Several `server/storage.ts` methods (e.g. the recovery-journal create/update) are
implemented with raw `db.execute(sql\`INSERT ... RETURNING *\`)` and return
`result.rows[0]` **verbatim**. Those rows carry the DB's snake_case column names
(`is_shared`, `photo_url`, `voice_url`), NOT the Drizzle camelCase property names.

This is inconsistent with Drizzle-query-builder methods elsewhere in the same
file, which return camelCase. There is no compile-time signal because these
methods are typed `Promise<any>`.

**Why:** A server-side consumer that read `entry.isShared` / `entry.photoUrl`
off such a row silently got `undefined` — a feature (journal media share→public
ACL flip) was inert with zero errors. The client already reads snake_case
(`entry.is_shared`) off the same payload, which is the tell.

**How to apply:** When consuming the return value of a storage method, confirm
whether it uses raw `RETURNING *` (snake_case) or the query builder (camelCase).
When in doubt, read both: `entry?.isShared ?? entry?.is_shared`. Don't trust the
`any` type or the field name you'd expect from the schema.
