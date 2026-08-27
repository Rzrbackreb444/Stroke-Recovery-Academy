---
name: Object storage /objects ACL enforcement
description: How the shared GET /objects route enforces per-owner ACL, and the mount-order requirement that makes it work.
---

# `GET /objects/:objectPath(*)` ACL model

The shared object-serve route enforces access control **only** when the object's
ACL policy has `visibility === "private"`. It calls `getObjectAclPolicy(file)`:
- policy is `null` (legacy/never-set) → **bypass**, serve openly (backward compat
  for avatars, lesson media, etc.)
- policy `visibility: "public"` → **bypass**, serve openly
- policy `visibility: "private"` → require owner via
  `canAccessObjectEntity({ userId, objectFile, READ })`; deny returns **404**
  (not 403) to avoid leaking object existence.

`userId` is read cross-strategy: `(req).user?.claims?.sub ?? (req).user?.id`.

**Why mount order matters:** `registerObjectStorageRoutes(app)` MUST be mounted
**after** `await setupAuth(app)`. If mounted before, the `/objects` GET never sees
`req.user`, so the private-ACL check reads `undefined` and 404s owners out of
their own media. Keep exactly one mount site, in the post-`setupAuth` block.

**Share lifecycle:** Private media is flipped to `public` (and back) by writing a
new ACL policy with `trySetObjectEntityAclPolicy(path, { owner, visibility })`.
For survivor journal entries this is driven by the entry's share state — see the
`syncJournalMediaAcl` helper in routes.ts.

**Caveat:** `downloadObject` sets `Cache-Control: private, max-age=3600` for
private objects, so a viewer who fetched media while it was shared keeps a browser
cache up to ~1h after unshare. Acceptable; not a server-side leak.

## Owner-bound upload intents

New presigned uploads are recorded in a short-lived owner-bound intent before
the URL is returned. The `/objects` route must consult that intent when ACL
metadata is still absent; otherwise the legacy “no ACL means public” fallback
creates a readable window between the direct PUT and attachment. Protected
attachment code should validate and consume the intent, while staging/finalize
steps may validate without consuming it.

**Why:** Object Storage cannot apply the application ACL until after a direct
browser PUT has landed, and the legacy route intentionally permits old objects
without ACL metadata.

**How to apply:** Preserve the intent check for all new protected object paths,
but keep explicit public ACLs and legacy paths backward-compatible.
