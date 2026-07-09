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
- Entry point: `artifacts/api-server/src/index.ts` calls `runApp(noopSetup)` (no Vite). `noopSetup` also adds a minimal `GET /` 200 JSON handler so the port-5000 webview health-check stays green without serving any frontend.
- **tsx tsconfig gotcha:** running `tsx artifacts/api-server/src/index.ts` from the workspace root picks up the ROOT tsconfig (which lacks `@workspace/db`) and fails with `ERR_MODULE_NOT_FOUND`. The workflow command MUST set `TSX_TSCONFIG_PATH=artifacts/api-server/tsconfig.json` so tsx resolves the artifact's path aliases.

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

## Workflow pattern (current — standalone split)
- "Start api-server" (port 5000, webview): `PORT=5000 NODE_ENV=development TSX_TSCONFIG_PATH=artifacts/api-server/tsconfig.json tsx artifacts/api-server/src/index.ts` — API only, no Vite. Replaced the retired root "Start application"/`npm run dev` monolith.
- "artifacts/stroke-recovery-academy: App": `cd artifacts/stroke-recovery-academy && PORT=3001 BASE_PATH=/ npm run dev` — Vite dev server, proxies /api,/auth,/objects,/anchor → localhost:5000. This is the actual web UI (the port-5000 webview is now just the API).
- Root `npm run dev` still exists in root package.json (cannot edit — forbidden) but is no longer wired to any workflow = retired.
