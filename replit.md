# Stroke Recovery Academy

## Overview

Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first stroke recovery platform designed to empower stroke survivors beyond traditional medical recovery timelines. It offers recovery exercises, challenges, daily routine tools, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also features a creator-side toolkit (Book Studio, Course Studio) for survivor-authors to publish recovery content and a Marketplace with an 85/15 creator revenue split. The core vision is to help survivors rebuild faster and share effective recovery strategies within the community.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and TailwindCSS for styling. Shadcn/ui (Radix UI base) is used for components, featuring a literary warm theme for the main platform and a distinct dark OS theme for the Stroke Recovery OS. State management relies on TanStack Query for server state and custom hooks for authentication. Design emphasizes mobile-first responsiveness, accessibility, and uses lucide-react for icons. Routes are code-split via `React.lazy()` + `<Suspense>` in `client/src/App.tsx` — only the home-landing trio (`CreatorLanding` / `Landing` / `StrokeLyfeOrg`) plus `NotFound` ship in the cold-load main chunk; every other page is fetched on demand. Production cold-load main chunk is ~770 KB (down from ~5.1 MB before code splitting).

### Backend
The backend utilizes Express.js and TypeScript, adhering to RESTful API principles with JSON and CORS. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js, incorporating session-based authentication and HTTP-only cookies. A second Passport strategy in `server/multiProviderAuth.ts` handles email/password + Google OAuth sign-in; cross-strategy identity reads go through `server/lib/authUtils.ts` (`getUserId(req)` / `getUserEmail(req)`) which fall back from `req.user.claims.sub` (Replit OIDC) to `req.user.id` (multi-provider) so route handlers and the shared `requireAdmin` middleware work uniformly regardless of how the user authenticated. Type-check budget: `tsc --noEmit` requires `NODE_OPTIONS='--max-old-space-size=4096'` to avoid OOM on the project's ~250k LOC TypeScript graph.

### Data Storage
PostgreSQL serves as the primary data store, leveraging Neon serverless driver and the pgvector extension for AI functionalities. Drizzle ORM ensures type-safe queries and schema management, including models for users, projects, assets, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing.

### Global Platform Services
The platform incorporates a credit system with wallet management, geolocation and i18n supporting 50+ countries/currencies and 20 languages, and an EventEmitter-based background job processing queue with SSE streaming. Analytics track usage, token consumption, and feature utilization.

### UI/UX Decisions
A consistent literary warm theme is applied to the main platform, while the Stroke Recovery OS adopts a dark OS aesthetic. UI/UX focuses on intuitive interfaces, responsive design, and persistent user inputs for professional tools.

### Feature Specifications
- **Seven Studios**: AI-integrated content creation tools.
- **Creator Production Engine**: Tools for content vaults, SERP research, batch production, and a unified dashboard.
- **Marketplace**: Content selling platform with an 85% creator revenue share.
- **Creator Dashboard**: Centralized management for creators.
- **Affiliate/Referral System**: APIs for tracking and payouts.
- **AI Integration**: Utilizes Google Gemini, OpenAI, Lyria for music, and specialized models for images/video.
- **Book Studio Workspace**: Professional publishing tools with KDP-ready export and AI analysis.
- **Premium Blog SEO Suite & SEO Command Center**: Enterprise-grade SEO optimization.
- **Lulu Publishing Integration**: Print-on-Demand via OAuth2 API.
- **Course Social Layer**: Community features like forums, groups, cohorts, reviews, and Live Circles. Includes personalized recommendations and scholarship options.
- **Offline PWA**: Progressive Web App with offline caching capabilities.
- **Accountability Buddy**: System for survivor pairing.
- **Stroke Recovery OS**: Dedicated platform featuring a Recovery Dashboard, University, Center Finder, Blog, Sasquatch Coach (AI companion), Survivor Community, Daily Routine System, and the 66-Day Sasquatch Transformation Challenge.
- **Motivation Studio**: Tools for recovery motivation like Anthem Maker, Vision Card, and Daily Quote.
- **Survivor Shop**: Curated Amazon affiliate storefront.
- **The Bonfire (Adaptive Today Session)**: Daily recovery task system adaptable to user feedback and intake profiles.
- **SEO SSR Layer**: Server-side rendered HTML for Tier-1 landing pages and blog posts, including JSON-LD for SEO.
- **Recovery Center Finder**: Google Places integration with cached database.
- **Generative-Engine SEO (GEO)**: Configured for AI-crawler citation with explicit `robots.txt` and schema-rich SSR pages.
- **Programmatic SEO Pages**: Three SSR templates for recovery content, weeks, and centers.
- **In-App Feedback Inbox**: Public submission and admin triage.
- **Content Machine**: Admin tool for AI-generated SEO-optimized blog drafts and infographics.
- **Podcast Pipeline**: Admin action to convert blog posts to narrated podcasts via AI.
- **PWA (mobile experience)**: Production-ready PWA with offline caching, push notifications, and install prompt.
- **Registry-Driven SEO Meta + JSON-LD Architecture**: Single source of truth for SEO metadata across all routes.
- **Admin SEO Command Center**: Admin dashboard for SEO management and IndexNow submissions.
- **Account Privacy Controls**: Features for data export, account deletion, and data anonymization.
- **Observability**: Request ID tracking, structured error logging, and health routes with DB ping.
- **Branded Onboarding**: Streamlined welcome flow for new users focusing on key recovery pillars.
- **Transactional Email Disclaimers**: Inclusion of medical disclaimers and crisis support information in emails.
- **Bonfire Personalization**: Adapts daily recovery tasks based on survivor intake data, including deficit severity, mobility aids, time budget, and goals. The Recovery Dashboard's Bonfire hero card surfaces a live preview of today's recommended level, reason, energy pattern, time budget, goal-highlight count, and any safety cap, sharing the same recommendation cache as the Bonfire session view.
- **AI Coach Crisis Safety**: Pre-LLM crisis detection for chat messages, providing crisis resources upon detection.
- **Recovery Anchor Studio**: Survivor-first musical-mnemonic encoder grounded in Melodic Intonation Therapy and Rhythmic Auditory Stimulation (used between, not in place of, real clinical sessions). v1 ships three anchor types — affirmation (4-line survivor anthem), speech (two-voice call-and-response for word-finding practice), memory (sung mnemonic for names/addresses/medication schedules). Two-pass Gemini engine: cheap classifier first (safety + clarification + audit-preview), then full Pass-2 generation only if cleared. Free preview tier (`/audit`) returns the engine's distilled goal + skeleton lines + producer notes without burning quota; paid render (`/render`) charges `motivation_usage.anchor_render_count` (3/month free, unlimited on creator/pro/enterprise). Regex crisis pre-gate plus LLM second-line crisis catch route to the existing `CrisisCard` resources. Every generation writes a row to `recovery_anchor_audit` regardless of disposition (clear / crisis / clarification / refused / engine_error). ElevenLabs voice synthesis is non-fatal — anchor saves without audio if voice fails.
- **Today's Anchor**: Daily-habit surface at `/recovery/anchor/today` with current/longest streak, yesterday's retention check (remembered/struggled/forgot), today's anchor card, and a "set as today's" picker over the user's existing anchors. Dashboard hero card mirrors `BonfireHeroCard` styling for surface parity.
- **Public Anchor Share**: Consent-gated sharing — anchors are private by default; toggling on mints a 12-char URL-safe `share_id`. Public surface at `/anchor/s/:shareId` (no auth, mobile-first vertical layout) shows the anchor + audio + a "build your own" CTA back to SRA. Toggling share off nullifies the `share_id` immediately.
- **html-in-template-string sweep + 3 real-XSS fixes (May 2026)**: SAST total 182 → 70 (HIGH = 0, MEDIUM = 44, LOW = 26 — all 44 remaining MEDIUM are the same `html-in-template-string` rule on multi-line template literals at safe call sites where the per-line nosemgrep directive can't be inserted without becoming literal text in rendered HTML output). 112 single-line matches suppressed via inline `// nosemgrep` directives. **Architect review of the suppression caught 3 real XSS sinks the bulk suppression would have permanently hidden + 1 rendering bug from misplaced directives** — all 4 fixed in the same pass: (1) `RecoveryBlogPost.tsx` had a public stored XSS (`startsWith('<')` raw-HTML passthrough into `dangerouslySetInnerHTML` plus unescaped `processInline()` markdown helper) — removed the raw passthrough, added `escapeHtml()` at top of `processInline()`, added `safeUrl()` allowlisting `http:`/`https:`/`mailto:`/relative for link URLs; (2) `server/emailTemplate.ts` interpolated `eyebrow`/`headline`/`subheadline`/`hero`/`unsubscribeUrl` raw plus `ctaButton(href, label)` was raw — wrapped each in the `escapeText()`/`escapeAttr()` helpers that already existed in the file; (3) `server/newsletterService.ts` interpolated subscriber-supplied `firstName` raw into drip-edition HTML — escaped before interpolation; (4) the bulk-insertion script had inserted 44 nosemgrep directives *inside* multi-line template-literal bodies across 13 files (SSR HTML, marketing emails, exported book HTML, podcast RSS, course extras, SEO command center) — would have rendered as literal `// nosemgrep: ...` text in production output. All 44 removed; the rule re-fires for those sites and they're tracked as the deferred `safeHtml` tagged-template helper refactor. Public surfaces all 200; only `nosemgrep` text in rendered HTML is the legitimate comment for `html.security.audit.missing-integrity` on the canonical link in `client/index.html`.
- **Real-Risk MEDIUM SAST sweep (May 2026)**: All 25 non-`html-in-template-string` MEDIUM findings closed (SAST total 207 → 182). Five real fixes — i18n key walkers in `client/src/lib/hooks/useLocale.tsx` and `server/i18nService.ts` now reject `__proto__`/`constructor`/`prototype` and use `hasOwnProperty.call` instead of `k in result` (closes 3 prototype-pollution-loop findings); Schema.org Product price in `RecoveryStore.tsx` switched from `replace("$", "")` (single-replace bug) to `replace(/[^0-9.]/g, "")` (closes 1 incomplete-sanitization, also fixes a real Schema.org-validation bug for prices like `"$9.99 USD"`); `manuscriptAnalysisService.detectAuthor()` now caps input to first 4096 chars before its nested-quantifier regexes run (closes 1 detect-redos / catastrophic-backtracking attack on `.docx`/`.pdf` import). Twenty verified false positives (multer-supplied `req.file.path`, server-generated filenames, literal sub-dirs, BookPreview author-only innerHTML, podcast audio Buffer) suppressed with adjacency-correct `nosemgrep` directives.
- **PII Log Redaction (`server/lib/redact.ts`)**: `redactEmail()` (`n***@example.com`) and `redactZip()` (`100**`) helpers wired through every log site that previously emitted survivor PII to stdout/stderr — welcome-email send/fail, newsletter drip + broadcast, spotlight broadcast, Google Geocoding fail. Preserves diagnostic bucket-level debuggability while closing GDPR-A5-32 / CCPA / NIST-800-53 transient-log exposure (HoundDog dropped 6 LOW → 0). All 2 HIGH semgrep findings (passport-local field-name string + Gemini prompt template) also closed via `nosemgrep` directive + array-join refactor respectively; SAST HIGH = 0.

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