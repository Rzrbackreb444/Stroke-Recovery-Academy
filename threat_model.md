# Threat Model — KreAIte / Stroke Recovery Academy

_Last reviewed: 2026-04-26_

## Project Overview

A medical-adjacent platform for stroke survivors built around AI-driven coaching, content authoring (book / video / music / course / image / website studios), recovery routines, and a creator marketplace. The platform leans on the lived experience of its founder (Nick Kremers, 7-year survivor) and is explicitly framed as **non-clinical**.

**Stack:** Express.js + TypeScript backend · React 18 + Vite frontend · PostgreSQL (Neon serverless + pgvector) · Drizzle ORM · Replit Auth (OpenID Connect via Passport.js, session-based with HTTP-only cookies stored in Postgres) · Stripe (managed webhook) · Google Gemini, OpenAI, ElevenLabs, Imagen.

**Storage caveat:** Replit Object Storage is currently suspended on this account; image / audio data is held as base64 data URLs or Postgres blobs. This shapes several of the DoS / memory considerations below.

## Assets

| Asset | Why it matters |
|---|---|
| **Sessions / identity** | Replit Auth identifiers + Postgres-backed sessions. Compromise → impersonation of survivors or admins. |
| **AI persona prompts** | System instructions (Sasquatch Coach, Bonfire, Quote Studio, Persona) are competitive IP and prompt-injection targets. |
| **Survivor content** | Book drafts, journals, recovery progress, medical logs, flicker logs — sensitive PHI-adjacent data. |
| **Financial data** | Stripe customer/payment intent references (no raw cards). |
| **Application secrets** | OpenAI / Gemini / ElevenLabs / Stripe / Resend / Notion / HubSpot API keys; `DATABASE_URL`; `SESSION_SECRET`. |
| **Editorial trust** | Survivor-led credibility — injection of harmful medical misinformation would damage the brand and survivors. |

## Trust Boundaries

1. **Public ↔ authenticated** — marketing/SSR pages and `/api/feedback/platform` (public POST) vs. dashboards and AI studios.
2. **User ↔ admin** — gated by `user.role === 'admin'`; `AdminRoute` is UI-only and **must** be mirrored by server-side checks on every admin endpoint.
3. **Client ↔ server** — every user-supplied object (quote text, persona inputs, blog drafts, feedback bodies) crosses this boundary and must be validated.
4. **Server ↔ external AI** — outbound boundary; user content is sent to Gemini/OpenAI/ElevenLabs/Imagen. Prompt-injection mitigation lives here.
5. **Stripe webhook** — inbound unauthenticated POSTs that **must** be verified against `STRIPE_WEBHOOK_SECRET` using the raw request body.

## Scan Anchors (highest-risk files)

- `server/app.ts` — Express entry, raw-body handling for Stripe.
- `server/routes.ts` — central route registration (~23k LOC).
- `server/seo/*` — SSR with user-derived data (`blogRoutes.ts`, `centerFinderRoutes.ts`, `landingRoutes.ts`, `ssrShell.ts`).
- `server/quoteStudioRoutes.ts` — bracket-notation property assignment (allowlisted but historically flagged).
- `server/personaRoutes.ts` — LLM prompt construction; prime prompt-injection surface.
- `server/motivationStudioRoutes.ts` — AI gen with Gemini + ElevenLabs + Imagen; quota-protected.
- `server/webhookHandlers.ts` (Stripe) — signature verification + fulfillment.
- `server/replitAuth.ts` + `server/multiProviderAuth.ts` — Passport configuration.
- `client/src/components/AdminRoute.tsx` — UI gate (server-side checks remain authoritative).

## STRIDE

### Spoofing
Replit Auth is robust, but server-side session verification on **every** `/api/*` route is required. Stripe webhooks must use `stripe.webhooks.constructEvent` against the raw body — any reliance on parsed JSON breaks signature validation.

### Tampering
Any merge of `req.body` into internal state must use an explicit allowlist or a Zod-parsed object. The bracket-iteration pattern in `quoteStudioRoutes.ts` is currently safe because it iterates a hardcoded `allowedFields` array (SAST flags it as a high-severity false positive); converting to `z.object().pick()` would silence the scanner and lock the contract.

### Repudiation
Sessions persist 7 days; admin actions on the blog draft generator, podcast pipeline, and feedback inbox should be logged with `userId + action + timestamp` so editorial provenance is traceable.

### Information Disclosure
- Error responses must not include stack traces in production.
- SSR routes that join user data (recovery centers, blog) must scope queries to public rows or the authenticated user.
- AI prompt construction must never echo other users' data into a single LLM call.
- Object Storage is suspended; base64 payloads sit in Postgres blobs — backup/restore exposes them in plain form. Encrypt at rest at the provider layer (Neon) and avoid logging payload contents.

### Denial of Service
- AI generation (Gemini / OpenAI / ElevenLabs / Imagen) is the most expensive path. Per-user daily quotas live in Postgres; **must** be checked before any external call.
- Long base64 payloads can OOM the Node process — cap multipart/JSON request size in Express middleware.
- Public SSR endpoints (`/recovery/centers/:metroSlug`, `/blog/:slug`, `/recovery/exercise/:slug`) are cacheable; add CDN/edge caching headers and per-IP rate limits on the public POST `/api/feedback/platform`, `/api/feedback/items`, and `/api/contact-*` endpoints.

### Elevation of Privilege
- All admin endpoints **must** check `user.role === 'admin'` server-side, not rely on `AdminRoute`.
- The blog draft generator, infographic generator, podcast pipeline, and feedback inbox admin views are admin-only and must each include the role check.
- Stripe price IDs / amounts must never be trusted from the client — always look them up server-side from a fixed catalog.

## Mitigations Already in Place

- Robots.txt explicitly allows GPTBot / Claude-Web / PerplexityBot for GEO; disallows `/admin/`, `/api/`, `/checkout`, journal/medical/flicker logs.
- Sitemap-index architecture lives behind cacheable XML routes.
- SSR shell escapes all interpolated values via `esc()` and strips `</script` tokens from JSON-LD.
- BookPreview text-extraction switched from `innerHTML` to `DOMParser` (no script execution path even in detached DOM).
- Quote Studio update endpoints already enforce field allowlists. (Note: `server/quoteStudioRoutes.ts` and the SquatchQR surface were removed entirely in May 2026 — the SAST findings against that file are no longer reachable.)
- **AI Coach crisis gate (May 2026)**: `server/services/crisisDetection.ts` runs a regex matcher across 4 categories on every `/api/coach/chat` message before the LLM call. On a hit, the handler short-circuits Gemini + ElevenLabs entirely and returns a structured 988/Crisis-Text/Veterans/911 response. Mitigates self-harm liability + cost-control DoS via the most expensive path. Logs structured `coach_crisis_intercept` for editorial-trust auditing.
- **Account data portability + erasure**: `GET /api/account/export` (multi-table JSON dump, password hash stripped, per-user rate-limited to 3/hour with `Retry-After`) and `POST /api/account/delete` (confirm-by-typing-email PII scrub, tombstone email + free-text anonymization across `daily_checkins` / `recovery_journal_entries` / `medical_log_entries` / `flicker_log_entries` / `recovery_journals` / `flicker_logs`, `req.logout()` + session destroy + cookie clear) reduce GDPR/CCPA exposure and let survivors actually leave with their data. Both routes are mounted **after** `setupAuth(app)` so `isAuthenticated` correctly sees the session middleware.
- **Per-request correlation**: `requestId` middleware injects `X-Request-Id` on every request; `structuredErrorLogger` emits a single JSON line per unhandled error with `{ requestId, path, status, userId, name, msg }`. Stack traces are suppressed in production. Enables auditable triage in Replit deployment logs without an external SIEM.
- **Health endpoint**: `GET /api/health` performs a real `SELECT 1` round-trip to Postgres and returns 503 (with the DB-down marker) so deployment health checks fail closed.
- **Magic-link email hardened**: Now includes a 988/911 crisis callout and `/legal/medical-disclaimer` link in both HTML and plain-text variants — closes a regulatory gap where a user re-entering the platform saw no safety messaging until they reached the dashboard.
- **Recovery Anchor Studio (May 2026)**: New survivor-first LLM surface in `server/services/recoveryAnchor/`. Two-pass Gemini engine with the same regex crisis pre-gate as the AI Coach (`server/services/crisisDetection.ts`) — Pass 1 LLM classifier acts as second-line crisis catch (paraphrased ideation the regex misses), Pass 2 only fires on `disposition === "clear"`. All Gemini calls use `responseMimeType: application/json` plus `safeParseJson` (fence stripping + outermost-`{}` extraction) plus zod validation, so model drift cannot crash the engine. Audit-then-render quota model means the cheap Pass-1 path is the free tier; expensive Pass-2 + ElevenLabs voice is metered (3/mo free, unlimited on premium). Atomic SQL `UPDATE … RETURNING` reservation + automatic refund on engine failure / non-anchor disposition prevents both race-condition over-charging and silent quota loss when a crisis short-circuit fires. Every generation regardless of disposition writes one row to `recovery_anchor_audit` (`{ userId, anchorId, anchorType, disposition, category, metadata }`) — same editorial-trust audit pattern as `coach_crisis_intercept`.
- **Public anchor-share surface**: New unauthenticated `GET /api/recovery/anchor/share/:shareId` and `GET /anchor/s/:shareId` route. Consent-gated — anchors are private by default; the survivor must explicitly POST to `/api/recovery/anchor/:id/share` with `{ isShared: true }` to mint a 12-char URL-safe `share_id` (crypto.randomBytes base64url, collision risk negligible at scale). Toggling share off nullifies the share_id immediately so the public link 404s. Public response projects only the display columns — never the survivor's input text, never the audit metadata, never the userId. shareId is path-length-capped (≤64 chars) before the DB query to prevent storage probing.
- **Survivor input is sent to Gemini**: The Recovery Anchor input textarea is a new outbound surface to Gemini. Inputs are capped at 2000 chars in the zod schema before reaching the prompt builder. Other survivors' content never enters the same LLM call (no batching). The realityFooter and producerNotes shown to the user are model output, so they pass through `anchorOutputSchema` validation (which caps lengths) but are NOT sanitized as HTML — they're rendered as text content via React, never via `dangerouslySetInnerHTML`, so XSS via prompt injection is contained.

## New Security Debt — Recovery Anchor

| Item | Severity | Owner action |
|---|---|---|
| Public `/anchor/s/:shareId` lacks per-IP rate limiting | Medium | Add the same per-IP rate limit middleware used by `/api/feedback/platform` once budget allows. Risk: scraping. |
| `audio_url` is stored as base64 data URL inside `recovery_anchors.anchor_data` adjacent jsonb (large rows) | Medium (operational) | Migrate to Object Storage when the suspension lifts. |
| Public share endpoint serves the full base64 audio inline | Medium | Same migration — once Object Storage returns, swap to short-lived signed URLs. |

## Week 2 Hardening — Shipped May 2026

- **Route-level code splitting (`client/src/App.tsx`)**: Converted 149 of 153 page imports from eager `import` to `React.lazy(() => import(...))` and wrapped the `<Switch>` in `<Suspense fallback={<LazyRouteFallback />}>`. Eager set kept to the 4 cold-path-critical pages: `CreatorLanding`, `StrokeRecoveryLanding` (Landing.tsx), `StrokeLyfeOrg` — the three branches of `HomeLanding` that render synchronously at `/` so the first paint never flashes the Suspense fallback — plus `NotFound` (always-mounted catch-all). The one named-export edge case (`MagicLinkVerify` from `MagicLinkLogin.tsx`) uses the `.then(m => ({ default: m.MagicLinkVerify }))` idiom; Vite shares the underlying chunk between the default and named lazy imports. **Result**: cold-load main bundle dropped from 5.1 MB → 772 KB (-85%); production build now emits 313 per-route chunks fetched on demand. Survivors on slow connections (the literal target audience — many use post-stroke ISP-grade DSL) now see the landing page in roughly 1/7th the JS download time. **Security implication**: smaller initial attack surface — admin/creator/studio code is no longer parsed in every survivor's browser, only in browsers that actually navigate to those routes. The `LazyRouteFallback` is a minimal dark-themed div that sits *inside* the existing layout shell (above-`<Switch>` components like `RecoveryHeader`, `SurvivorIntakeBanner`, `AccessibilityProvider` continue to render normally during chunk fetch), so navigation transitions don't lose chrome.

## Week 1 Hardening — Shipped May 2026

- **Centralized admin gate (`server/middleware/requireAdmin.ts`)**: New shared middleware that consolidates the admin-role check at the route declaration line, eliminating the "copy-pasted admin route forgot the inline check" failure mode. Seven highest-traffic admin endpoints converted in this pass: `/api/admin/seo/submit`, `/api/admin/blog/draft`, `/api/admin/blog/draft/save`, `/api/admin/blog/draft/infographic`, `/api/admin/stripe/sync`, `/api/admin/stripe/products`, `/api/admin/seed-recovery-data`. The legacy `requireAdminLocal` alias used by Survivor Spotlight routes is now a thin re-export of the new middleware so spotlight + new endpoints share one source of truth. Approximately 25 additional admin endpoints (newsletter, forum, Amazon, recovery plans, content reports, user management) still use the legacy inline-check pattern — they remain SECURE (every one of them performs the `user.role === 'admin'` check) but should be migrated to the middleware in a follow-up cleanup pass for consistency.
- **Public POST rate limiting expanded**: `/api/feedback/items` (auth-optional public submission) now uses `publicPostLimiter` (10/min/IP) — closes the burst-flood gap noted in the prior debt list. The unauthenticated `GET /api/recovery/anchor/share/:shareId` surface is now wrapped in a dedicated 30/min/IP limiter (`anchorShareLimiter`) — defends against share-id enumeration / scraping at the edge.
- **Stripe webhook idempotency tests (`tests/stripeWebhook.test.ts`)**: 11-assertion integration test against the real dev DB covering the Buffer-only contract, the `webhook_events` ledger transitions (received → processed | failed), Stripe-retry semantics for `failed` rows (not lost), 5-minute stale-recovery for `received` rows stuck behind a crashed worker, and concurrency-guard behavior for fresh `received` rows. Closes the highest-revenue-risk untested surface.
- **Dependency audit pass**: `npm audit fix` (non-breaking, no `--force`) reduced vulnerabilities from 25 (12 high, 10 mod, 3 low) to 10 (1 high, 9 mod). Remaining items are all transitive `uuid` issues under `googleapis` 33.x that require a major-version jump (33 → 171) to resolve — deferred to its own scoped task because it touches every Google Workspace integration surface.

## Known Security Debt — Follow-up Required

| Item | Severity | Owner action |
|---|---|---|
| 1 HIGH + 9 MODERATE dependency vulnerabilities (transitive `uuid` < 14 under `googleapis` 33.x) | Medium | Schedule a dedicated upgrade window: `googleapis` 33 → latest is a breaking change that touches Drive, Docs, Sheets, Slides, Forms, and Speech surfaces. |
| 3 SAST property-injection findings in `quoteStudioRoutes.ts` | High (false positive — code uses allowlist) | **Resolved (May 2026)** — file deleted along with the SquatchQR surface. |
| 2 XSS findings in `BookPreview.tsx` | High (false positive — detached DOM, text-only extraction) | **Fixed** via DOMParser conversion (2026-04-26). |
| Missing admin role check on legacy `GET /api/admin/feedback` | High | **Fixed** — now requires `role === 'admin'` (2026-04-26). |
| Unescaped DB-derived values in programmatic SSR `rawHtml` (`/recovery/exercise/:slug`, `/recovery/centers/state/:state`) | High | **Fixed** — `esc()` helper wraps every interpolated DB field before reaching `ssrShell.rawHtml` (2026-04-26). |
| Podcast feed loaded full base64 audio blobs into Node memory and emitted hardcoded `enclosure length="0"` | Medium | **Fixed** — feed query now projects only display columns plus a SQL-computed `OCTET_LENGTH(audio_url)` byte size, used for real `<enclosure length>` (2026-04-26). |
| Hashicorp tf-password gitleaks finding in `multiProviderAuth.ts` | High (false positive — Passport field-name strings) | Suppress with `.semgrepignore` line comment. |
| Tainted SQL string in `personaRoutes.ts` | High (false positive — LLM prompt template, no DB query) | Add inline `nosemgrep` comment. |
| 165 MEDIUM SAST findings | Medium | Triage in batches; most are stylistic. |
| 6 LOW HoundDog privacy findings | Low | Review for PII redaction in logs. |
| Object Storage suspension | Operational | Migrate base64 payloads off-DB once budget restored. |

## Review Cadence

Re-run dependency audit + SAST + HoundDog quarterly or whenever a new external integration is added. Re-review STRIDE whenever a new admin surface (e.g., blog draft generator, podcast pipeline) is shipped.
