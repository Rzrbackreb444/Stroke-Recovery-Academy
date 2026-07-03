---
name: Image performance pass
description: How platform image optimization is done here + two non-obvious dev-console gotchas (React 18 fetchPriority, screenshot stale-cache)
---

# Platform image optimization pattern

Large source images live in `attached_assets/` (the `@assets` vite alias resolves there). To optimize:
1. `sharp(input).resize({width}).webp({quality}).toFile(out)` — write a new `*-opt.webp` beside the source; never mutate originals.
2. Repoint every import via `sed` on the `@assets/...png` path string only (variable names stay). Then grep to confirm zero stale refs.
3. Sensible display-driven widths: header/footer logos ~600px, portraits ~1200px (retina), card/exercise images ~1000px, book cover ~896px. Hero images want ≥1600px source — the Landing hero source (`image_1783088334022.png`) is natively only 472px wide, so the desktop hero is soft; a wider hero asset is the biggest remaining front-door visual lever.
4. Add loading hints on `<img>`: hero/above-fold = high priority + `decoding="async"` (NOT lazy); below-fold = `loading="lazy" decoding="async"`.

**Why:** cut ~15MB of PNGs to <700K platform-wide; combined with route code-splitting + `staleTime: Infinity` this is the dominant real speed win.

# Gotcha: React 18.3.1 does not support `fetchPriority` (camelCase)

Passing `fetchPriority="high"` on an `<img>` triggers a dev-console warning ("React does not recognize the `fetchPriority` prop … spell it as lowercase `fetchpriority`"). Native support is React 19+.
**How to apply:** use a lowercase spread instead: `{...({ fetchpriority: "high" } as any)}`. The DOM attribute lands correctly in prod either way; the spread just silences the dev warning. Only clears after a workflow restart (see below).

# Gotcha: app_preview screenshot HTTP-caches un-versioned Vite modules

The screenshot/app_preview browser caches Vite source paths that have NO `?v=` hash (e.g. plain hooks like `useAnalytics.ts`), so an edited file's OLD output can persist in the console/render even after a fresh page load — while versioned lazy-route modules (`App.tsx?v=...`) DO refresh. A workflow restart clears versioned modules but the un-versioned ones can still show stale.
**How to apply:** don't chase it via repeated restart+screenshot. Verify the source with grep/read; if the source is correct, trust it. Dev-only (`import.meta.env.DEV`) messages never ship to prod regardless. This is the same class as the benign Vite HMR WebSocket `400` in preview.
