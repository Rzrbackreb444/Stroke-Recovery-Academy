---
name: Replit workflow waitForPort gotcha
description: Replit's configureWorkflow waitForPort fails on port 3001 even when vite successfully binds it; omit waitForPort for artifact frontend workflows.
---

# Replit workflow waitForPort gotcha

## The rule
When configuring a `console`-type workflow that runs a vite dev server on port 3001 (or similar non-5000 port), do NOT set `waitForPort`. The Replit workflow health-check marks the workflow FAILED even when vite is genuinely listening on that port and serving HTTP 200.

**Why:** The Replit system's port health check for console-type workflows on port 3001 appears to either fail its HTTP check or race against vite's startup. The process exits cleanly from the system's perspective but the workflow gets marked FAILED and killed. Removing `waitForPort` lets the process run indefinitely.

**How to apply:** When calling `configureWorkflow` for any vite/frontend artifact workflow not on port 5000:
- Set `outputType: "console"` 
- Do NOT pass `waitForPort`
- The workflow will show as RUNNING once the process starts

## Verified behavior
- Port 5000 with `outputType: "webview"` + `waitForPort: 5000` — works normally (main Express server)
- Port 23636 with `waitForPort: 23636` — works (mockup-sandbox, configured by artifact system)
- Port 3001 with `waitForPort: 3001` — FAILS despite vite printing "ready on port 3001" and serving HTTP 200
- Port 3001 without `waitForPort` — workflow stays RUNNING indefinitely ✓
