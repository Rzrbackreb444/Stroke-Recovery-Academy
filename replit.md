# Stroke Recovery Academy

## Overview
Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first stroke recovery platform designed to accelerate recovery and foster community support beyond traditional medical timelines. It offers recovery exercises, daily routine tools, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also features a creator toolkit (Book Studio, Course Studio) for survivor-authors to publish content and a Marketplace with an 85/15 revenue split, aiming to empower survivors and share effective recovery strategies.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and TailwindCSS for styling, utilizing Shadcn/ui (Radix UI base) for components. It employs a literary warm theme for the main platform and a dark OS theme for the Stroke Recovery OS. State management uses TanStack Query for server state and custom hooks for authentication. The design emphasizes mobile-first responsiveness, accessibility, and uses lucide-react for icons, with code-split routes for optimization.

### Backend
The backend is developed with Express.js and TypeScript, adhering to RESTful API principles. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js for session-based and HTTP-only cookie authentication, supporting email/password and Google OAuth with unified user ID retrieval.

### Data Storage
PostgreSQL serves as the primary data store, leveraging Neon serverless driver and the pgvector extension for AI functionalities. Drizzle ORM provides type-safe queries and schema management, including models for users, projects, assets, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing.

### Global Platform Services
The platform integrates a credit system with wallet management, geolocation and i18n supporting over 50 countries/currencies and 20 languages. It features an EventEmitter-based background job processing queue with SSE streaming and analytics for usage and token consumption.

### UI/UX Decisions
A consistent literary warm theme is applied to the main platform, while the Stroke Recovery OS uses a distinct dark OS aesthetic. UI/UX design focuses on intuitive interfaces, responsive design, and persistent user inputs for professional tools.

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
- **Observability**: Request ID tracking, structured error logging, and health routes with DB ping, with client-side Sentry (`@sentry/browser`, no React peer dep) for browser error reporting. Sentry init is dynamically imported AFTER `createRoot(...).render()` returns and DSN is fetched lazily from `GET /api/observability/client-config` — defense in depth so Sentry's module evaluation cannot interleave with React's first render. Conservative sampling (`tracesSampleRate: 0`, no replays); `beforeSend` strips query strings to avoid leaking voice-clone session ids or `subscribed=1` tokens. The earlier `@sentry/react` integration was removed because its React peer dep produced a duplicate-React optimizeDeps state on mobile (manifested as `dispatcher.useContext` null crash).
- **Branded Onboarding**: Streamlined welcome flow for new users focusing on key recovery pillars.
- **DOM Nesting + Dead Link Sweep (May 2026)**: Eliminated all `<Link><a>...</a></Link>` nestings across the client (21 sites in 9 files: `RecoveryDashboard.tsx` ×7, `RecoveryToday.tsx` ×4, `SasquatchCoach.tsx` ×3, `RecoveryExerciseDetail.tsx` ×2, `RecoverySpotlight.tsx` ×2, `MyPathRecommender.tsx` ×1, `RecoveryExercises.tsx` ×1, `AnchorShare.tsx` ×1). Wouter's `Link` already renders an anchor element — wrapping its child in another `<a>` produced React's "validateDOMNesting: <a> cannot appear as a descendant of <a>" warnings and produced unclickable inner regions in some browsers. Each fix moves `className`, `data-testid`, `aria-label`, and `style` props onto the `Link` itself and removes the inner `<a>` shell. The first-pass single-line `rg '<Link[^>]*>\s*<a '` regex missed 11 multi-line cases where the `<Link>` opening tag spanned several lines; final verification used the multi-line pattern `rg -nU --multiline '<Link\b[^>]*(?:\n[^<>]*)*>\s*\n?\s*<a\s'` which now returns zero matches. Also fixed dead `/login` link in `client/src/components/os/OSLayout.tsx:135` (no `/login` route exists; the OS-themed login is at `/recovery/login`).
- **Music in Header Nav (May 2026)**: New top-level **Music** dropdown in `client/src/components/RecoveryHeader.tsx` (between My Coach and Resources, both desktop and mobile). Surfaces three products: **Anchor Studio** (`/recovery/motivation` — paid musical-mnemonic encoder, gets a `Crown · PRO` badge), **Anthem Builder** (`/recovery/anthem/build`), **Sasquatch Radio** (`/recovery/radio`). Mobile collapsible mirrors desktop. Closes the discovery gap where the paid music product was buried inside the Motivation Studio with no nav entry. Anchor Studio production audit: 612-line component with auth gate, two-tier API (audit-free / render-quota'd for cost control), `UsagePill` showing monthly limits, Crown premium badge, CrisisCard integration (Pass-1 LLM classifier as second-line crisis catch), error toasts, mobile-responsive grid. Removed dead `TYPES` const that was cast-as-any object stubbed in place of an array.
- **Survivor-First Auth UI (May 2026)**: `client/src/pages/AuthPage.tsx` redesigned around survivor needs (post-stroke memory/aphasia → password burden removed). Default mode is **email OTP** (6-digit code via `/api/auth/otp/send` → `/api/auth/otp/verify`, 10-min expiry, auto-creates `member` accounts on first verify, server flags `isNewUser` so the client routes new accounts to `/welcome` and returning ones to `/creator-hub`). **Continue with Google** sits next to the email field, gated by a `/api/auth/providers` query so the button is hidden when `GOOGLE_CLIENT_ID` is unset (no dead button). Password and magic-link demoted to secondary outline buttons under "or use email". The pure Replit Auth button users described as "cheap and developeresque" is now a small underlined "Or continue with Replit" link below the card — fallback only, not removed (`/api/login`). Hero copy realigned from generic "Create. Publish. Earn." to "Rebuild. Rewire. Rise." with survivor-first subhead.
- **Transactional Email Disclaimers**: Inclusion of medical disclaimers and crisis support information in emails.
- **Bonfire Personalization**: Adapts daily recovery tasks based on survivor intake data.
- **AI Coach Crisis Safety**: Pre-LLM crisis detection for chat messages, providing crisis resources upon detection.
- **Recovery Anchor Studio**: Survivor-first musical-mnemonic encoder grounded in Melodic Intonation Therapy and Rhythmic Auditory Stimulation.
- **Survivor Voice Cloning**: Integrates ElevenLabs Instant Voice Cloning with a two-tier paywall ($9/mo subscription + $5 per clone) and administrative tools for managing voice intros and content.
- **Coach Sasquatch DJ**: ElevenLabs voice intros for Sasquatch Radio, using a separate premade voice.
- **Lyrics Studio (May 2026)**: New paid headliner in the Music nav (between Anchor Studio and Anthem Builder, Crown · PRO badge) at `/recovery/lyrics`. Survivor inputs a story / description / aesthetic (≤5000 chars), picks one of 14 genres + singer arrangement (male / female / duet / auto), and Gemini returns a Grammy-grade structured production sheet (Suno/Udio-ready): `{ title, styleHeader{style,tempo,vibe}, sections[{label, sceneNote, lines[{voice, direction, text}]}], hashtags, producerNotes }`. Single-pass engine in `server/services/lyricsStudio/` with the same regex crisis pre-gate as the AI Coach + Anchor Studio (`detectCrisis`), `responseMimeType: application/json` + `safeParseJson` + zod validation so model drift cannot crash the engine. Quota: free tier = 1 draft/mo (atomic `UPDATE motivation_usage SET lyrics_draft_count = lyrics_draft_count + 1 WHERE … AND lyrics_draft_count < 1 RETURNING …` reservation pattern + automatic refund on engine failure / crisis short-circuit / DB persist failure), premium (creator/pro/enterprise via `getUserTier`) = unlimited monthly. **Burst limiter** (`publicRateLimit` keyed by user-id with IP fallback, 6/min) is also applied to `POST /api/lyrics/generate` so a compromised premium account cannot rapidly drive expensive Gemini traffic — even premium is throttled per minute. Drafts persist to new `lyrics_drafts` table; private by default. **Public sharing is consent-gated** (mirrors Anchor pattern): toggle on mints a 12-char URL-safe `share_id` (`crypto.randomBytes(9).base64url`), public route at `GET /api/lyrics/share/:shareId` (rate-limited 30/min/IP, projects only display columns — never the original `storyText`, never the userId, never `isShared` toggle history). Toggle off nullifies the share_id immediately so the public link 404s. Auth uses the cross-strategy `getUserId(req)` helper so both Replit-Auth and email/Google-OAuth sessions work. Routes registered in their **own** try/catch in `server/routes.ts` (not coupled to recovery-anchor) so a partial-mount failure on either surface doesn't mask the other in deployment logs.

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