---
name: server/ vs artifacts/api-server/src/ divergence
description: The two backend trees are NOT auto-synced; a server-side change must be applied to both or it won't reach the running app.
---

# Two backend trees, no sync step

There are two copies of the backend: workspace-root `server/` and
`artifacts/api-server/src/`. The **running app is `artifacts/api-server/src/`**
(the "Start api-server" workflow runs `tsx artifacts/api-server/src/index.ts`).

**The trees have diverged and there is no sync script.** `scripts/post-merge.sh`
only runs `npm install` + `drizzle-kit migrate` — it does NOT copy `server/` →
`artifacts/api-server/src/`. Prior tasks edited only `server/` (e.g. added
`circleReminderService.ts` + a `circle-reminders` job, `med-adherence`,
`institutionRoutes.ts`) and those changes **never reached the running app** —
api-server still booted 14 jobs while `server/` had 16.

**Rule:** any backend change must be applied to BOTH `server/<path>` and
`artifacts/api-server/src/<path>`, then restart "Start api-server" and confirm
the effect in the fresh boot log (e.g. scheduler job count went 14 → 15).

**Why:** task "Relevant files" still point at the old `server/` tree, but only
`artifacts/api-server/src/` is executed. Editing one tree alone is a silent no-op
for the user.

**Import portability:** `artifacts/api-server/src/` uses `@workspace/db` (not
`@shared/schema`) and relative `./db` imports. A service that only imports `./db`,
`./messaging`, `drizzle-orm` (no `@shared/*`) copies between trees byte-for-byte.
Files importing `@shared/schema` must be rewritten to `@workspace/db` for the
api-server copy (see multi-artifact-workspace.md).
