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