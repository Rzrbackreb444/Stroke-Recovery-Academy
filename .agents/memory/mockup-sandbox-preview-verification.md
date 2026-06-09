---
name: Verifying mockup-sandbox previews
description: How to screenshot/verify a mockup-sandbox component without chasing a phantom 404
---

The `app_preview` screenshot type hits the **main app on port 5000**. The `/__mockup/` route is NOT proxied there — so `app_preview` with a `/__mockup/preview/<dir>/<Component>` path returns the **main app's own 404 page** (you'll see the SRA nav header + "404 Page Not Found"), not the sandbox.

**To verify a mockup-sandbox component:**
- Screenshot via `external_url` at the picard dev domain: `https://<repl-domain>/__mockup/preview/<dir>/<ComponentName>`, OR
- Trust the canvas iframe (it renders directly from the component path).

**After a subagent writes a NEW mockup file**, restart the `artifacts/mockup-sandbox: Component Preview Server` workflow so vite rescans and the route resolves (a fresh file can 404 until rescan).

**Why:** burned two screenshot calls chasing a 404 that was just the wrong server.
**How to apply:** never use `app_preview` with a `/__mockup` path; use `external_url` against the dev domain.
