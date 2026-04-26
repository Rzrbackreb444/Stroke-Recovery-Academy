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
- Quote Studio update endpoints already enforce field allowlists.

## Known Security Debt — Follow-up Required

| Item | Severity | Owner action |
|---|---|---|
| 23 HIGH dependency vulnerabilities (no critical) | High | Run `npm audit fix` and re-scan; pin transitive offenders. |
| 3 SAST property-injection findings in `quoteStudioRoutes.ts` | High (false positive — code uses allowlist) | Convert to `z.object().pick()` to silence scanner and lock contract. |
| 2 XSS findings in `BookPreview.tsx` | High (false positive — detached DOM, text-only extraction) | **Fixed** via DOMParser conversion (2026-04-26). |
| Hashicorp tf-password gitleaks finding in `multiProviderAuth.ts` | High (false positive — Passport field-name strings) | Suppress with `.semgrepignore` line comment. |
| Tainted SQL string in `personaRoutes.ts` | High (false positive — LLM prompt template, no DB query) | Add inline `nosemgrep` comment. |
| 165 MEDIUM SAST findings | Medium | Triage in batches; most are stylistic. |
| 6 LOW HoundDog privacy findings | Low | Review for PII redaction in logs. |
| Object Storage suspension | Operational | Migrate base64 payloads off-DB once budget restored. |

## Review Cadence

Re-run dependency audit + SAST + HoundDog quarterly or whenever a new external integration is added. Re-review STRIDE whenever a new admin surface (e.g., blog draft generator, podcast pipeline) is shipped.
