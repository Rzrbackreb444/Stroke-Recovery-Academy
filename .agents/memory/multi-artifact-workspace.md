---
name: Multi-artifact workspace layout
description: pnpm workspace structure, how imports are wired between artifacts, and the key patterns for the api-server and frontend artifact.
---

# Multi-artifact workspace layout

## Workspace root
- `pnpm-workspace.yaml` lists `artifacts/*` and `lib/*`
- Root `package.json` + `node_modules` remain for the legacy `npm run dev` workflow

## artifacts/api-server
- All 117+ server files copied from `server/` to `artifacts/api-server/src/`
- `tsconfig.json` at `artifacts/api-server/`:
  - `"baseUrl": "."` (relative to `artifacts/api-server/`)
  - `"@shared/*": ["../../shared/*"]` → resolves to workspace-root `shared/`
  - `"@workspace/db": ["../../shared/schema.ts"]` → resolves to workspace-root schema
- Import patterns used:
  - `@shared/X` imports: kept as-is via tsconfig path alias
  - `@shared/schema` static: replaced with `@workspace/db`
  - `../shared/schema` relative: replaced with `@workspace/db`
  - `import('@shared/schema')` dynamic: replaced with `import('@workspace/db')`
- Entry point: `artifacts/api-server/src/index.ts` calls `runApp(noopSetup)` (no Vite)

## artifacts/stroke-recovery-academy (frontend)
- All `client/src/*` copied to `artifacts/stroke-recovery-academy/src/`
- `vite.config.ts` aliases:
  - `@` → `./src`
  - `@shared` → `../../shared` (workspace-root shared/)
  - `@assets` → `../../attached_assets`
- Proxy in dev: `/api`, `/auth`, `/objects`, `/anchor` → `http://localhost:5000`
- `fs.strict: false` so vite can traverse above the artifact root for shared files
- All `@shared/X` imports in frontend remain — resolved by vite alias at build/dev time
- package.json must explicitly list `vite`, `@vitejs/plugin-react`, `react`, `react-dom` etc. as devDependencies

## lib/
- `lib/db/`, `lib/api-spec/`, `lib/api-client-react/` are stub packages (placeholders for future shared libs)

## Workflow pattern
- "Start application": `npm run dev` (port 5000) — legacy, serves API + Vite together, unchanged
- "artifacts/stroke-recovery-academy: App": `cd artifacts/stroke-recovery-academy && PORT=3001 BASE_PATH=/ npm run dev` — no waitForPort (see waitForPort gotcha)
