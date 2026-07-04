---
name: dispatcher.useContext dev overlay
description: The Vite red "dispatcher.useContext" overlay is a dev HMR artifact, not an app bug
---

The Vite dev overlay `[plugin:runtime-error-plugin] null is not an object (evaluating 'dispatcher.useContext')` on the user's already-open (often mobile Safari) tab is a **dev-only Fast-Refresh/HMR artifact**, not a real React bug.

**Why:** it appears when the dev server hot-reloads or fully restarts while a tab stays open — the client's module graph gets half-swapped and React's current dispatcher goes null mid-render. It fires most when the agent is actively saving edits / restarting the "Start application" workflow. It does NOT exist in the production build (no HMR, no runtime-error-plugin). An earlier session mis-attributed it solely to orphaned duplicate dev servers on port 5000 — killing orphans helped but the deeper cause is HMR-across-restart on an open tab.

**How to apply — don't re-diagnose from scratch:** Confirm quickly, then tell the user to hard-reload (dismissing the overlay isn't enough). Confirmation checklist (all cheap):
- workflow logs healthy, requests 200, single dev server on :5000
- `ls node_modules/*/node_modules/react` → no duplicate React in the MAIN app (`@tiptap/react`/`@uppy/react` are wrappers, not copies)
- anon headless `app_preview` of `/` clean
- if the user is authed (look for `GET /api/auth/user 200`), the crashing route is behind login — reproduce with the testing skill (`testReplitAuth:true`, mobile 400x720) across the authed routes; a clean run = no app bug.
Fix on the user's end: full page reload (iOS Safari: reload icon / pull-to-refresh). Reassure: production/published site is unaffected.
