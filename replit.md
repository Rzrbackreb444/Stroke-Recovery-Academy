# Stroke Recovery Academy

## Overview
Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first stroke recovery platform designed to accelerate recovery and foster community support. It provides recovery exercises, daily routine tools, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also includes a creator toolkit (Book Studio, Course Studio) for survivor-authors to publish content and a Marketplace with an 85/15 revenue split, aiming to empower survivors and share effective recovery strategies.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a literary warm theme for the main interface and a dark OS theme for the Stroke Recovery OS. Design principles emphasize mobile-first responsiveness, accessibility, and intuitive interfaces with persistent user inputs for professional tools.

### Technical Implementations
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TailwindCSS with Shadcn/ui components. State management is handled by TanStack Query and custom authentication hooks. The backend is built with Express.js and TypeScript, adhering to RESTful API principles. Authentication leverages Replit Auth (OpenID Connect) via Passport.js, supporting email/password and Google OAuth. PostgreSQL is the primary data store, utilizing Neon serverless driver and pgvector for AI functionalities, with Drizzle ORM for type-safe queries. The system includes a global credit system, geolocation, i18n for over 50 countries/currencies and 20 languages, and an EventEmitter-based background job processing queue with SSE streaming.

### Feature Specifications
- **Seven Studios**: AI-integrated content creation tools.
- **Creator Production Engine**: Tools for content vaults, SERP research, batch production, and a unified dashboard.
- **Marketplace**: Content selling platform with an 85% creator revenue share.
- **AI Integration**: Utilizes Google Gemini, OpenAI, Lyria for music, and specialized models for images/video, with pre-LLM crisis detection for chat messages.
- **Book Studio Workspace**: Professional publishing tools with KDP-ready export and AI analysis.
- **Course Social Layer**: Community features including forums, groups, cohorts, reviews, and Live Circles (Campfire).
- **Offline PWA**: Progressive Web App with offline caching and push notifications.
- **Accountability Buddy**: System for survivor pairing and daily recovery tasks (The Bonfire) adapted to user feedback.
- **Stroke Recovery OS**: Dedicated platform featuring a Recovery Dashboard, University, Center Finder, Blog, Sasquatch Coach (AI companion), Survivor Community, Daily Routine System, and the 66-Day Sasquatch Transformation Challenge.
- **Motivation Studio**: Tools for recovery motivation like Anthem Maker, Vision Card, and Daily Quote.
- **Recovery Anchor Studio**: Musical-mnemonic encoder grounded in Melodic Intonation Therapy.
- **Survivor Voice Cloning**: Integrates ElevenLabs Instant Voice Cloning with a two-tier paywall.
- **SEO SSR Layer**: Server-side rendered HTML for Tier-1 landing pages and blog posts, including JSON-LD for SEO, and Generative-Engine SEO (GEO) configured for AI-crawler citation.
- **In-App Feedback Inbox**: Public submission and admin triage.
- **Content Machine**: Admin tool for AI-generated SEO-optimized blog drafts and infographics.
- **Podcast Pipeline**: Admin action to convert blog posts to narrated podcasts via AI.
- **Lyrics Studio**: AI-powered lyric generation for survivors with structured production sheets.
- **Observability**: Request ID tracking, structured error logging, health routes, and client-side Sentry for browser error reporting.
- **Branded Onboarding**: Streamlined welcome flow for new users.
- **Sasquatch Personal Chat**: The existing dynamic AI Coach (Gemini + ElevenLabs + crisis gate + persona context) is now persistent — every authenticated turn is best-effort persisted to `sasquatch_chat_messages` and replayed on widget reopen so survivors can resume mid-thread. The accountability scheduler also fires a once-per-UTC-day Sasquatch push ping at 13:00 UTC (~8am ET) with a rotating motivational prompt (30-prompt rotation by day-of-year), idempotent via `sasquatch_daily_pings` UNIQUE(user_id, ping_date). Push deep-links to `/recovery/coach?ping=1` which auto-opens the chat widget.

### Sasquatch Premium — Wave F Funnel Telemetry (May 2026)
Instruments the conversion path so we can measure whether Wave C/E surfaces actually move the needle. New service `server/services/sasquatchFunnelService.ts` lazy-creates `subscription_funnel_events` (`id BIGSERIAL`, `user_id VARCHAR nullable`, `event_type VARCHAR(40)`, `plan VARCHAR(16)`, `metadata JSONB`, `created_at TIMESTAMPTZ`) at runtime via `CREATE TABLE IF NOT EXISTS` — same pattern as `coach_daily_usage` / `sasquatch_chat_messages`, no migration. Three event types: `premium_page_view` (top-of-funnel, fired client-side on page mount, anon-friendly), `checkout_click` (recorded server-side from `/api/sasquatch-premium/checkout` so we can't be spoofed and can't be missed when the browser hard-navigates to Stripe), `trial_start` (fired client-side from the `?subscribed=1` redirect handler, plan extracted from the `?plan=` query param appended to `success_url`). Plan dimension splits monthly vs annual conversion. Public route `POST /api/sasquatch-premium/track` is auth-optional, validates event+plan against allowlists, REFUSES `checkout_click` from the client (server-only), and always returns 204 to avoid leaking shape. Telemetry writes are fire-and-forget — `recordFunnelEvent` swallows errors so a DB hiccup never breaks the page surface. Admin diagnostic `GET /api/sasquatch-premium/funnel?days=30` returns counts grouped by event+plan, gated by `isAuthenticated + requireAdmin`. Verified end-to-end: `premium_page_view/annual` and `trial_start/monthly` both landed in the DB on smoke; spoofed `checkout_click` correctly absent.

### Sasquatch Premium — Wave D Annual Plan (May 2026)
Adds a $190/yr SKU alongside the existing $19/mo SKU — annual saves $38/yr (~17% discount vs $19×12=$228). Both prices live under the SAME Stripe product (`metadata.feature='sasquatch_premium'`, distinguished by `metadata.interval` + `recurring.interval`), so a single product + a single entitlement check serves both billing cadences. `sasquatchPremiumService` was extended with `ensureSasquatchPremiumPrices()` (returns `{monthlyPriceId, annualPriceId}`, lazy-creates whichever is missing — backwards-compatible with the legacy state where only the monthly price exists), `getSasquatchPremiumPriceIds()` (cache-or-DB read), and `hasActiveSasquatchPremium` now checks BOTH price IDs via a `Set` membership test — falls back to monthly-only if annual hasn't been provisioned. The legacy `ensureSasquatchPremiumProduct()` + `getSasquatchPremiumPriceId()` exports kept as back-compat shims. Checkout route accepts `{ plan?: 'monthly' | 'annual' }` body param (default `monthly`), passes the chosen `priceId`, and appends `&plan=<chosen>` to `success_url` so the post-redirect funnel-event knows which plan converted. Status route now returns the full price grid: `priceUsd / annualUsd / annualMonthlyEquivalentUsd / annualSavingsUsd / trialDays` so the landing page renders the toggle + savings badge without a second roundtrip. Landing page UI gains a Monthly/Annual `role="tablist"` toggle above the price card with a "Save $38" badge on the Annual tab; price headline reflows between `$19/month` and `$15.83/month` (with billed-yearly subline) based on selection. The "Why $19?" explainer card mentions the annual discount inline. The 7-day trial applies to BOTH SKUs — Stripe natively enforces "one trial per customer" across the product, so a survivor can't trial monthly then trial annual on the same Stripe customer.

### Sasquatch Premium — Wave E 7-Day Free Trial (May 2026)
Removes the cold-start objection on the $19/mo SKU. `stripeService.createCheckoutSession` gained an optional 6th `options: { trialDays?: number }` arg that sets `subscription_data.trial_period_days` only when `mode === 'subscription'` and `trialDays > 0` — backwards-compatible for every existing payment-mode caller. `sasquatchPremiumRoutes` passes `{ trialDays: SASQUATCH_PREMIUM_TRIAL_DAYS }` (= 7) on the checkout call. Stripe natively enforces "one trial per customer" via the customer record, so re-subscribing after a cancel does NOT re-trial — Stripe simply omits the trial from the new session. Abuse would require a fresh email + fresh Stripe customer record. CTA copy on `/recovery/premium` updated to "Start 7-day free trial" + "7-day free trial. Cancel anytime." subline + SEO description "7-day free trial. … Then $19/month. Cancel anytime." Survivors entitled the moment Stripe creates the trialing subscription — `hasActiveSasquatchPremium` already accepts both `active` and `trialing` statuses (Stripe's standard list), so the entitlement OR-in across Coach cap, Recovery Anchor `isPremium`, voice cloning, and premium Campfire rooms all unlock instantly without any extra wiring.

### Sasquatch Premium — Wave C Conversion Surface (May 2026)
Upsell hooks placed where the friction actually bites — Wave B shipped the SKU but only converted survivors who happened to find `/recovery/premium`. (1) `/api/coach/chat` success response now includes `quota: { used, limit, premium }`; `SasquatchChatWidget` shows a thin amber "X/25 messages today · Unlock unlimited →" banner above the scroll area once usage hits 80% of cap, and on the 429 `capped` response (parsed out of `apiRequest`'s `"<status>: <body>"` thrown error string) appends an inline coach message with an "Unlock Unlimited — $19/mo →" CTA instead of the generic "I hit a bump" line. (2) `RecoveryAnchorStudio` renders an amber upgrade banner inside the `CardContent` whenever `overLimit` is truthy, linking to `/recovery/premium` — the existing render button still disables but now there's an obvious next step. (3) `RecoveryCampfire` shows a "Coach Circle + Live with Nick — Premium fires · $19/mo · Cancel anytime" CTA card above the room grid when the user isn't premium AND at least one premium-only room exists in the room list (defensive — won't show on accounts that already subscribed, won't show if the premium-only rooms list ever empties). All three banners are stateless `<a href>` to `/recovery/premium` — no client-side router import needed, deep-links survive page reloads, no extra event tracking yet (deferred to Wave E analytics). Premium users see no banner anywhere because the success-path `quota.premium === true` and the room-list `isPremium` flag both short-circuit the render. Architect-reviewed clean.

### Sasquatch Premium — Wave B Monetization (May 2026)
Single $19/mo SKU bundling unlimited Coach + unlimited Recovery Anchor renders + Voice Cloning + premium Campfire circles. Stripe-direct entitlement check (60s cache) mirrors `voiceCloneEntitlement` — no webhook fulfillment write needed. New service `server/services/sasquatchPremiumService.ts` (lazy product+price create with `metadata.feature='sasquatch_premium'`, `hasActiveSasquatchPremium(customerId)`, `isSasquatchPremium(userId)`); routes `server/sasquatchPremiumRoutes.ts` (`POST /api/sasquatch-premium/checkout` subscription mode, `GET /status`, `POST /portal`) mounted post-`setupAuth`. `voiceCloneEntitlement.hasActiveVoiceCloneSubscription` and `recoveryAnchorRoutes.isPremium` both OR-in the Sasquatch price so a single subscription unlocks every entitlement. Coach daily soft-cap (`COACH_FREE_DAILY_LIMIT=25`, table `coach_daily_usage`, atomic `INSERT…ON CONFLICT DO UPDATE…RETURNING`) sits in `server/sasquatchHistoryService.ts`; wired into `/api/coach/chat` AFTER the crisis gate (we never block a crisis message) and BEFORE the LLM call, with refund-on-error so a Gemini outage doesn't burn a survivor's quota. Two new premium-only Campfire rooms (`coach-circle` Mon/Wed/Fri lunch ET, `live-with-nick` Sat morning ET) gated with 402 + `upgradeUrl` on both GET messages and POST messages. Client landing page `/recovery/premium` (`client/src/pages/RecoveryPremium.tsx`) registered in App.tsx; `RecoveryCampfire` shows a Lock badge on premium rooms and redirects to the landing page on click when not subscribed.

## External Dependencies
- **Replit Auth**: User authentication.
- **Stripe**: Payment processing.
- **Google Gemini AI**: AI content generation.
- **OpenAI**: AI writing and analysis.
- **Neon Database**: Serverless PostgreSQL.
- **Radix UI**: Accessible UI primitives.
- **Drizzle ORM / Drizzle Kit**: Database interaction.
- **SERP API**: Keyword research.
- **ElevenLabs API**: Text-to-speech services.
- **Google Places**: Recovery Center Finder integration.
- **Tone.js**: Audio/music processing.
- **Lulu API**: Print-on-demand publishing.