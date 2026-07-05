# SEO Strategy

## In scope
- Public marketing pages
- Public survivor acquisition and retention pages
- Public book / companion / storefront pages
- Public SSR landing pages, blog pages, and programmatic SEO pages
- Public legal pages that can be shared or indexed

## Out of scope
- Authenticated survivor dashboard and tools (`/recovery/dashboard`, `/recovery/**` behind `ProtectedRoute`)
- Admin pages (`/admin/**`, `/recovery/admin/**`)
- API routes

## Target audience
- Stroke survivors
- Caregivers and spouses of stroke survivors
- Young stroke survivors
- Therapists evaluating survivor resources

## Primary keywords
- Unknown — infer from public page copy per route.
- Core site themes appear to be: stroke recovery, stroke rehabilitation, neuroplasticity, stroke survivor community, Sasquatch Method, stroke recovery coach.

## Rendering model
- Hybrid app: Express + Vite + React SPA with important SSR/public SEO routes under `server/seo/*`.
- SPA routes depend on server-side `applyRouteMeta()` injection for initial crawler-visible head tags.
- Client-side `useRouteMeta()` updates are not sufficient for social bots or AI crawlers.

## Dismissed categories
- None yet.
