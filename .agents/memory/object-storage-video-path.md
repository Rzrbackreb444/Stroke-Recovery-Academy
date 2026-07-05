---
name: Object storage video URL path
description: The correct format for video/media URLs stored in DB when using the private uploads dir
---

## Rule

When uploading community videos (or any file) to object storage via the seed script or server-side GCS client, store the path as:

```
/objects/uploads/<uuid>
```

**NOT** `/objects/.private/uploads/<uuid>`.

## Why

`getObjectEntityFile(objectPath)` in `objectStorage.ts` does:
1. Strips `/objects/` prefix → gets `uploads/<uuid>` (the entity id)
2. Prepends `PRIVATE_OBJECT_DIR + "/"` → `.private/uploads/<uuid>`
3. Prepends bucket name → full GCS path

So PRIVATE_OBJECT_DIR is added internally. If you include `.private/` in the stored path you get double-prefixing: `.private/.private/uploads/<uuid>` → 404.

## How to apply

- In seed scripts: store `return \`/objects/uploads/${objectId}\``
- In server upload finalize: `normalizeObjectEntityPath(signedUrl)` already produces the correct `/objects/uploads/<uuid>` form — use that helper, don't construct manually
- The `/objects/:objectPath(*)` Express route calls `getObjectEntityFile(req.path)` which handles the prefix internally

## Also

- `trySetObjectEntityAclPolicy` does NOT exist as a standalone export from `objectAcl.ts` — it is a **method on the ObjectStorageService class**: `objectStorageService.trySetObjectEntityAclPolicy(rawPath, policy)`. Community (public) videos don't need ACL at all — null-policy objects pass through the ACL check automatically.
