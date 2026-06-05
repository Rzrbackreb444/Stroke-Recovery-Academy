---
name: Amazon Affiliate Tag Application
description: How the Amazon associate tag is applied to product links platform-wide
---

**Tag source:** `AMAZON_AFFILIATE_TAG` secret (server-side). Exposed to the frontend (public, non-secret) via `GET /api/config/affiliate` → `{ amazonTag }`.

**Rule:** Every Amazon product link in the platform must carry the associate tag. The tag is only appended to `amazon.*` hostnames — `a.co/d/...` short links are left untouched on purpose (they already carry the associate tag baked in via SiteStripe, and the param cannot be reassigned).

**Helpers:**
- Client: `buildAmazonUrl(asinOrUrl, tag)` in `client/src/lib/amazonLink.ts` — accepts a bare ASIN or full URL, sets `?tag=` only on amazon hostnames, no-ops on `a.co` / null tag.
- Server: `appendAffiliateTag(url)` (local closure in `server/routes.ts`) — used by `/api/marketplace/products` + `/:id`.

**Where each surface gets its tag (verified June 2026):**
- `/recovery/shop` (`SurvivorShop.tsx`) — fetches `/api/config/affiliate`, builds via `buildAmazonUrl`. Tagged.
- `/creator-store` (`CreatorStore.tsx`) — consumes `/api/marketplace/products` which tags server-side. Tagged.
- `/store` + `/recovery/store` (`RecoveryStore.tsx`) — was the leak: 15 hardcoded products rendered raw `amazonUrl` with no tag. Fixed by fetching `/api/config/affiliate` and wrapping both the Buy Now `href` and the schema.org offer `url` with `buildAmazonUrl`.
- Amazon PA-API results (`server/amazonService.ts`) — tag baked into constructed `dp` URLs.

**Why:** Untagged `amazon.com/dp/ASIN` links earn the operator zero commission. Any new product surface MUST route its links through one of the two helpers above.
