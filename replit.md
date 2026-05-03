# Stroke Recovery Academy

## Overview

Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first stroke recovery platform dedicated to empowering stroke survivors beyond traditional medical timelines. It provides recovery exercises, challenges, daily routine tools, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also includes a creator-side toolkit (Book Studio, Course Studio) for survivor-authors to publish recovery content and a Marketplace with an 85/15 creator revenue split. The core vision is to accelerate survivor recovery and foster the sharing of effective strategies within the community.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and TailwindCSS for styling. It leverages Shadcn/ui (Radix UI base) for components, featuring a literary warm theme for the main platform and a distinct dark OS theme for the Stroke Recovery OS. State management uses TanStack Query for server state and custom hooks for authentication. The design prioritizes mobile-first responsiveness, accessibility, and uses lucide-react for icons. Routes are code-split for optimized loading.

### Backend
The backend uses Express.js and TypeScript, adhering to RESTful API principles with JSON and CORS. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js for session-based authentication and HTTP-only cookies. A multi-provider Passport strategy handles email/password and Google OAuth, with unified user ID retrieval regardless of authentication method.

### Data Storage
PostgreSQL is the primary data store, utilizing Neon serverless driver and the pgvector extension for AI functionalities. Drizzle ORM provides type-safe queries and schema management, including models for users, projects, assets, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing.

### Global Platform Services
The platform includes a credit system with wallet management, geolocation and i18n supporting 50+ countries/currencies and 20 languages, and an EventEmitter-based background job processing queue with SSE streaming. Analytics track usage, token consumption, and feature utilization.

### UI/UX Decisions
A consistent literary warm theme is used for the main platform, while the Stroke Recovery OS employs a dark OS aesthetic. UI/UX focuses on intuitive interfaces, responsive design, and persistent user inputs for professional tools.

### Feature Specifications
- **Seven Studios**: AI-integrated content creation tools.
- **Creator Production Engine**: Tools for content vaults, SERP research, batch production, and a unified dashboard.
- **Marketplace**: Content selling platform with an 85% creator revenue share.
- **AI Integration**: Utilizes Google Gemini, OpenAI, Lyria for music, and specialized models for images/video.
- **Book Studio Workspace**: Professional publishing tools with KDP-ready export and AI analysis.
- **Course Social Layer**: Community features including forums, groups, cohorts, reviews, and Live Circles.
- **Offline PWA**: Progressive Web App with offline caching.
- **Accountability Buddy**: System for survivor pairing.
- **Stroke Recovery OS**: Dedicated platform featuring a Recovery Dashboard, University, Center Finder, Blog, Sasquatch Coach (AI companion), Survivor Community, Daily Routine System, and the 66-Day Sasquatch Transformation Challenge.
- **Motivation Studio**: Tools for recovery motivation like Anthem Maker, Vision Card, and Daily Quote.
- **The Bonfire (Adaptive Today Session)**: Daily recovery task system adaptable to user feedback and intake profiles.
- **SEO SSR Layer**: Server-side rendered HTML for Tier-1 landing pages and blog posts, including JSON-LD for SEO.
- **Recovery Center Finder**: Google Places integration with cached database.
- **Generative-Engine SEO (GEO)**: Configured for AI-crawler citation with explicit `robots.txt` and schema-rich SSR pages.
- **In-App Feedback Inbox**: Public submission and admin triage.
- **Content Machine**: Admin tool for AI-generated SEO-optimized blog drafts and infographics.
- **Podcast Pipeline**: Admin action to convert blog posts to narrated podcasts via AI.
- **PWA (mobile experience)**: Production-ready PWA with offline caching, push notifications, and install prompt.
- **Registry-Driven SEO Meta + JSON-LD Architecture**: Single source of truth for SEO metadata across all routes.
- **Account Privacy Controls**: Features for data export, account deletion, and data anonymization.
- **Observability**: Request ID tracking, structured error logging, and health routes with DB ping. **Frontend Sentry (May 2026)**: `@sentry/react` wired into `client/src/main.tsx` via lazy `client/src/lib/sentry.ts` — fetches DSN from new `GET /api/observability/client-config` endpoint (Sentry DSNs are publicly safe by design, so this avoids needing a `VITE_`-prefixed duplicate of the `SENTRY_DSN` secret) and dynamically imports `@sentry/react` only after init succeeds. tracesSampleRate=0 / replaysSampleRate=0 by design (survivors care about working features, not telemetry overhead). `beforeSend` strips query strings from `event.request.url` so `clone_session_id` / `subscribed=1` tokens never reach Sentry. `ignoreErrors` filters known browser-extension noise (`ResizeObserver loop` × 2, generic `Failed to fetch`/`Load failed`). Init is fire-and-forget so it never blocks first paint, and any failure is swallowed so Sentry can never break the app. **Server-side Sentry intentionally NOT installed** — the existing `structuredErrorLogger` already emits one JSON line per server error to Replit deployment logs, which `fetch_deployment_logs` can grep by request id; the real blind spot was browser-side crashes (post-stroke users on older browsers / assistive tech).
- **Branded Onboarding**: Streamlined welcome flow for new users focusing on key recovery pillars.
- **Transactional Email Disclaimers**: Inclusion of medical disclaimers and crisis support information in emails.
- **Bonfire Personalization**: Adapts daily recovery tasks based on survivor intake data.
- **AI Coach Crisis Safety**: Pre-LLM crisis detection for chat messages, providing crisis resources upon detection.
- **Recovery Anchor Studio**: Survivor-first musical-mnemonic encoder grounded in Melodic Intonation Therapy and Rhythmic Auditory Stimulation.
- **Survivor Voice Cloning — Slice 2 paywall (May 2026)**: Slice 1's admin gate (`requireAdmin`) was swapped for a Stripe-driven two-tier paywall: **$9/mo subscription unlocks the feature** + **$5 single-use checkout per minted clone (unlimited cadence)**. New `server/services/voiceCloneEntitlement.ts`: `ensureVoiceCloneStripeProducts()` (idempotent — creates the two products tagged `metadata.feature='voice_clone_subscription'` / `'voice_clone_purchase'` independent of the existing Creator/Pro/Enterprise tiers), `getVoiceClonePriceIds()` (DB-backed lookup against the `stripe.prices`+`stripe.products` mirror), `hasActiveVoiceCloneSubscription()` (authoritative `subscriptions.list` against the Stripe API for both `active` and `trialing` statuses, with a 60-second in-process cache for read paths and a `{skipCache:true}` opt-out so checkout/mint money paths always re-verify against Stripe), `verifyVoiceClonePurchaseSession()` (validates customer match + `mode=payment` + `payment_status=paid` + `status=complete` + correct `priceId` matched against the expanded line items). New columns: `voice_clones.stripe_session_id text UNIQUE` (DB-enforced single-use against replay; mirrored in `shared/schema.ts`). New endpoints: admin `POST /api/admin/voice-clones/setup-stripe` (one-time idempotent product seeding behind the shared `requireAdmin` middleware), public `GET /api/voice-clones/entitlement` (drives the UI paywall), `POST /api/voice-clones/checkout` with `{mode:'subscription'|'clone'}` — `clone` mode requires an active sub *first* (server-enforced) so the $5 charge is meaningful, success URLs are `/voice-library?subscribed=1` and `/voice-library?clone_session_id={CHECKOUT_SESSION_ID}`. Mint endpoint (`POST /api/voice-clones`) now requires (a) active sub, (b) verified single-use `stripeSessionId` — pre-checked against the unique index *before* the ElevenLabs call to avoid burning an EL voice slot on a replay, with a 23505/`/unique/i` catch on the insert as a defense-in-depth fallback if two concurrent submits race past the pre-check (Slice 1's compensating `eleven.deleteVoice` already handles the rollback). Preview gate also requires active sub. Frontend (`client/src/pages/VoiceLibrary.tsx`): entitlement query drives a Subscribe paywall card → "Buy clone slot" CTA → "Mint voice" CTA progression with dynamic submit-button labels at each gate. The per-clone purchase token from the success URL is **persisted to `sessionStorage`** under key `voiceClonePendingSessionId` (architect-caught fragility — earlier in-React-state-only version stranded the paid slot on refresh/navigation between purchase and mint), with an explicit "Discard slot" button so survivors can intentionally abandon. Money paths (checkout-clone-mode and mint) bypass the entitlement cache via `{skipCache:true}` so a survivor cancelling their sub mid-purchase cannot squeeze through a stale `true`. Slices 3-4 will wire cloned voices into Anthem builder, Anchor Studio, Motivation Studio Daily Quote, and AI Coach voice replies.
- **Survivor Voice Cloning (Slice 1, May 2026)**: ElevenLabs Instant Voice Cloning wired into the existing `/voice-library` page. Survivors record a 30-180s sample in-browser via `MediaRecorder`, read aloud the ElevenLabs-required consent statement (`VOICE_CLONE_CONSENT_TEXT` exported from `server/voiceCloneRoutes.ts` so it's a single source of truth between client display and server-side legal record), check the consent box, and submit. The audio is base64-encoded JSON (route mounted with its own `express.json({limit: '15mb'})` middleware so the global 5mb cap stays in place for every other endpoint), forwarded to ElevenLabs `/voices/add` via the existing `getElevenLabsService().cloneVoice()`, and the returned `voice_id` is stored on `voice_clones.voiceModelId` along with `consent_text`, `consent_signed_at`, `consent_ip`, and `sample_duration_sec` (new columns added via SQL ALTER, mirrored in `shared/schema.ts`). Endpoints `GET/POST/DELETE /api/voice-clones` + `POST /api/voice-clones/:id/preview`. **Slice 1 is admin-gated** (`isAuthenticated + requireAdmin`) so Nick can stress-test the consent flow + clone quality before survivors see it. Architect-caught hardening: (1) the larger 15mb body parser is now mounted in `server/app.ts` *before* the global 5mb cap so the global parser doesn't reject voice samples first; (2) consent text is server-enforced — the client only sends `consentAccepted: true` and the server persists the canonical `VOICE_CLONE_CONSENT_TEXT` constant so the legal record can't be tampered; (3) `usageCount` increment uses an atomic SQL `usage_count + 1` to avoid concurrent-preview drift; (4) if the DB insert fails after a successful ElevenLabs clone, a compensating `eleven.deleteVoice(voiceId)` runs so the EL voice slot is not orphaned. Per-row ownership check on every read/preview/delete prevents cross-user IDOR. Delete is best-effort against ElevenLabs (slot freed) + always soft-deletes the DB row (`deleted_at` set, `status='deleted'`) so consent records survive for legal traceability. Page is wrapped in `<ProtectedRoute>` so unauthenticated visitors are bounced. Slice 2 will swap the `requireAdmin` gate for a Stripe $9/mo subscription check + $5/clone purchase model + monthly generation quota; Slices 3-4 wire cloned voices into Anthem builder, Anchor Studio, Motivation Studio Daily Quote, and AI Coach voice replies.
- **Coach Sasquatch DJ (Sasquatch Radio Phase 2.5)**: Between-track ElevenLabs voice intros for Sasquatch Radio. Uses a *separate* premade voice (Brian by default, env-overridable via `SASQUATCH_DJ_VOICE_ID`) so the DJ filler never co-mingles with Nick's brand coach voice. Intros are admin-minted via `POST /api/admin/radio/dj/intro` (upsert by trackId so re-mints replace), cached as base64 data URLs in `radio_dj_intros` (one row per track), and served publicly via a rate-limited `GET /api/recovery/radio/dj/intros` that projects only `{trackId, audioUrl}`. The Sasquatch Radio player has a "DJ On/Off" toggle (default OFF, persisted to `localStorage`) that plays the cached intro through a second `<audio ref={introRef}>` element before the main track, with an `introPlayedFor` Set to prevent intro replay on prev/next/scrub. Admin curation surface (`/admin/radio-queue`) lists all 17 seed tracks plus approved survivor tracks (using the same `anthem-${anthem.id}` id format the public radio endpoint emits, so admin-minted intros actually match the player's lookup) with mint/re-mint/delete buttons and shows the truncated script. Intro lifecycle is hardened against deadlock: an `<audio onError>` handler and a "DJ-mode toggled OFF mid-intro" effect both clear `isPlayingIntro` and resume the main track immediately, so the player can never get stuck with `isPlaying === true` but no audio progressing.

## External Dependencies

- **Replit Auth**: User authentication.
- **Stripe**: Payment processing.
- **Google Gemini AI**: AI content generation.
- **OpenAI**: AI writing and analysis.
- **Remove.bg API**: Image background removal.
- **Neon Database**: Serverless PostgreSQL.
- **Radix UI**: Accessible UI primitives.
- **Lucide React**: Iconography.
- **TipTap**: Rich text editing.
- **Tone.js**: Audio/music processing.
- **Drizzle ORM / Drizzle Kit**: Database interaction.
- **mammoth / pdf-parse**: Document parsing.
- **SERP API**: Keyword research.
- **Lulu API**: Print-on-demand publishing.
- **ElevenLabs API**: Text-to-speech services.