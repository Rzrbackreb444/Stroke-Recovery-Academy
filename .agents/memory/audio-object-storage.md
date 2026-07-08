---
name: Audio Object Storage migration
description: How audio is uploaded, served, and ACL-managed via Replit Object Storage; backward-compat dual-mode serving.
---

## Rule
New audio is uploaded to Replit Object Storage via `uploadAudioBuffer()` in
`server/lib/audioStorage.ts`. Never encode audio as base64 data URLs in Postgres.

## How to apply
- Call `uploadAudioBuffer({ buffer, contentType, owner, visibility, context })` after
  ElevenLabs/TTS call. Returns `/objects/...` path to store in the DB column.
- `owner` = userId for private survivor content; `null`/`""` for public platform content.
- `visibility`: private = anchors/anthems/motivation artifacts; public = podcast, DJ intros, daily quotes.
- When a survivor shares/unshares an anchor or anthem, call `setAudioObjectVisibility(path, "public"|"private", userId)`.
- Serving endpoints call `serveAudioResponse(audioUrl, res)` — handles both /objects/ paths and legacy `data:` URLs transparently.
- `isBase64AudioUrl(url)` guards legacy decode paths during migration window.

## Why
Object Storage object rows are tiny (path only); base64 blobs were multi-MB per row,
creating OOM risk on every in-process decode and bloating Postgres storage.

## Migration
`scripts/migrateAudioToObjectStorage.ts` — run with `--dry-run` first. Safe to re-run;
skips rows already at /objects/... path. Supports `--table` and `--limit` flags.

## ObjectAclPolicy shape
`{ owner: string, visibility: "public"|"private" }` — `owner` is required; use `""` for public/unowned objects.
