---
name: Canonical profile migration registry
description: Raw SQL migrations must be registered in the Drizzle journal or publish can omit them while disposable migration tests still pass
---

Raw SQL migrations are not discoverable by the production migrator from their filenames alone; the matching tag must also be present in migrations/meta/_journal.json.

**Why:** The repository’s disposable migration runner reads every SQL file directly, so it can pass even when the production migration registry would never apply a newly added migration.

**How to apply:** When adding a hand-written migration, register its exact filename tag in the journal and keep a release test that checks both the registry entry and the required schema columns.