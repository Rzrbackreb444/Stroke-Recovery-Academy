---
name: Dev lazy import vs prod bundle
description: Why a broken/stale static import can pass tsx dev but fail the production esbuild build
---

A broken or stale **static** import in a server module can run fine in dev yet fail the deploy build.

**Why:** dev runs `tsx server/index-dev.ts`, which resolves/loads modules **lazily** — a module that's only reached from an un-exercised route is never loaded, so its bad import never surfaces. The production build runs `esbuild server/index-prod.ts --bundle`, which resolves the **entire static import graph** up front, so the bad import fails the publish with `Could not resolve "..."`. (Real instance: `newsletterService.ts` imported `./messaging/messagingService`, but the export lives in `./messaging/index.ts`.)

**How to apply:** Before telling the user to publish after server-side changes, verify resolution by running the real bundle step — it's fast (vite is the slow half, esbuild is ~300ms):
`npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=/tmp/verify.js` then `rm -f /tmp/verify.js`. Exit 0 = the whole graph resolves. Don't rely on the dev workflow being green.
