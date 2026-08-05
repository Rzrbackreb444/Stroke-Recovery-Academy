---
name: Full-project typecheck
description: How to run repo-wide tsc quickly and reliably in this workspace
---

# Full-project typecheck

- `npx tsc --noEmit` runs in ~13s here thanks to `incremental: true` + tsbuildinfo in tsconfig. The old ">15 min" belief is stale.
- **Run it via the validation runner** (`typecheck` validation command is registered: `npx tsc --noEmit --pretty false`). Full error log lands under `.local/state/workflow-logs/<runId>/validation.shell.exec.0`.
- Do NOT try `nohup`/`setsid` background shells for long commands — background processes do not survive across ShellExec sessions in this environment. Also `pgrep -f` inside a compound command matches the command's own shell line (false RUNNING).
- Codebase conventions used when cleaning up errors: `getUserId(req)!` under `isAuthenticated` routes (450+ uses); `publicRateLimit` option is `bucketName`, not `name`/`message`; drizzle disallows chained `.where().where()` — use `and(...)`.
- `users` table has NO `subscriptionTier` column in Drizzle schema; sparkRoutes email targeting reads raw `subscription_tier` SQL — verify the column actually exists in the DB before trusting that path.
