# KreAIte.xyz

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform with the vision to "CREATE. PUBLISH. EARN." It empowers creators through seven professional studios (Book, Video, Music, Course, Image, Doctrine Engine, Website Builder), facilitating content production, publishing, and monetization via an integrated marketplace (KreAItorverse) offering an 85/15 revenue split. The platform leverages advanced AI for content generation, editing, and analysis, streamlining the creative workflow from concept to publication. Key capabilities include unified media editing, a robust marketplace for templates and finished works, comprehensive publishing tools, and full-featured website hosting with custom subdomains. It also integrates a dedicated Stroke Recovery OS with specialized tools and community features, and an enterprise-grade dynamic QR code system (SquatchQR) for engaging content delivery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite, Wouter, TailwindCSS.
- **UI Component System**: Shadcn/ui (built on Radix UI) with a literary warm theme, using Crimson Pro/Playfair Display/Inter fonts.
- **State Management**: TanStack Query for server state, custom hooks for authentication.
- **Key Design Decisions**: Literary warm theme for the main platform, dark OS theme for Stroke Recovery OS, mobile-first responsive design, accessibility-first approach. Icons exclusively from lucide-react.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript.
- **Authentication & Session Management**: Replit Auth (OpenID Connect) via Passport.js, PostgreSQL session store, session-based authentication with HTTP-only cookies.
- **API Design**: RESTful patterns, JSON format, CORS.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless driver with pgvector extension.
- **ORM**: Drizzle ORM for type-safe queries and schema management.
- **Schema Design**: Comprehensive schemas for users, projects, assets, sessions, credit systems, and an AI Author Brain for semantic memory using pgvector embeddings and HNSW indexing.

### Global Platform Services
- **Credit System**: Wallet management, deduction logic, API for balance and transactions.
- **Geolocation & Localization**: IP-based location, 50+ countries/currencies, 20-language translation (i18n).
- **Background Job Processing**: EventEmitter-based queue with SSE streaming.
- **Analytics**: Per-studio usage tracking, token consumption, feature usage breakdown.

### UI/UX Decisions
- Consistent literary warm theme for the main platform (cream background, antique gold accent) and a dark OS aesthetic for the Stroke Recovery OS (black background, gold accents, dark card backgrounds).
- Unified premium navigation with `GlobalHeader` component, mobile-responsive menus, and user account management.
- Intuitive interfaces for professional tools like the TipTap book editor, MediaStudio, and Cover Designer.
- Emphasis on responsive design and persistent user inputs.

### Feature Specifications
- **The 7 Studios**: Specialized AI-integrated tools for Book, Video, Music, Course, Image, Doctrine Engine, and Website Builder.
- **Creator Production Engine**: Content vaults, SERP research, batch production, and a unified production dashboard.
- **Marketplace (KreAItorverse)**: Platform for selling content with an 85% creator revenue share.
- **Creator Dashboard**: Unified command center for overview, studios, earnings, referrals, and admin.
- **Affiliate/Referral System**: APIs for tracking and commission payouts.
- **AI Integration**: Utilizes Google Gemini, OpenAI, Lyria (for music), specialized models for images/video, and an AI Consultant.
- **Book Studio Workspace**: Professional publishing workspace with multiple view modes, KDP-ready export, and AI-powered analysis (DoctrineChecker, ConsistencyMonitor).
- **Premium Blog SEO Suite**: Enterprise-grade optimization tools including meta tag optimization, focus keyphrase tracking, and various Schema Types.
- **SEO Command Center**: External website optimization tools for analysis, keyword research, and sitemap generation.
- **Lulu Publishing Integration**: Professional Print-on-Demand via OAuth2 API for book production and orders.
- **Course Social Layer**: Forums, Groups, per-course Cohorts, Reviews + ratings, and Instructor Analytics.
- **Direct Messaging + Therapist Open Hours**: 1:1 and group DMs with read receipts and therapist availability.
- **Live Circles**: Weekly community video calls with RSVP and hosting capabilities.
- **Course Refund Window**: Buyers can request a refund within 7 days with specific progress limitations.
- **Course Sharing + Affiliate Hooks**: Sharing courses with automatic affiliate code inclusion and tracking.
- **My Path Recommender**: Recommends courses based on user history and popularity.
- **Survivor Scholarship**: System for donors to fund scholarships for survivors to access courses.
- **Caregiver Seats**: Allows one paid caregiver seat to mirror course unlocks to a linked survivor.
- **Course Translations**: On-demand translation of course transcripts and captions into 19 locales using Gemini 2.0-flash.
- **Offline PWA**: Progressive Web App with offline caching for key assets and an install prompt.
- **Accountability Buddy**: System for pairing survivors based on routine level and interests.
- **Stroke Recovery OS**: Dedicated platform with a dark OS theme, including Recovery Dashboard, Recovery University, Recovery Center Finder, Recovery Blog, Forge Your Beast (persona system), Sasquatch Coach (24/7 AI companion), Survivor Community, Daily Routine System (5-level structured routine with streak tracking), and 66-Day Sasquatch Transformation Challenge.
- **Survivor Shop — Amazon Affiliate Engine**: A curated affiliate storefront at `/recovery/shop` that monetizes the platform without ads, paywalls, or kickbacks. Catalog lives in `client/src/data/survivorShop.ts` (35 products across 6 categories: Mobility & Balance, Hand & Grip, Foot Drop & AFO, Speech & Cognition, Caregiver Essentials, Recovery Bedside) — each product has a "why Nick recommends it" blurb, optional therapist-required note, and price class. The pure helper `client/src/lib/amazonLink.ts` builds tagged Amazon URLs from either an ASIN or a full URL (hostname-allowlisted to amazon.* and uses `searchParams.set('tag')` so existing tags are overwritten not duplicated). The affiliate tag (`AMAZON_AFFILIATE_TAG=nicholaskreme-20`) is exposed via the public `GET /api/config/affiliate` endpoint and consumed client-side via TanStack Query — the "View on Amazon" CTA stays in a disabled "Loading…" state until the tag is loaded so attribution is never lost. Compliance is built in: FTC disclosure card sits directly above the product grid (not buried at the bottom), full disclosure footer below, every outbound link has `rel="noopener noreferrer sponsored nofollow"`, and the "this is survivor opinion not medical prescription" disclaimer is hard-wired via `MedicalDisclaimerCard`. Wired into `App.tsx` and surfaced on `RecoveryDashboard` as a nav card above the Anthem hero.
- **The Bonfire — Adaptive Today Session**: A unified "what to do, right now" daily UX at `/recovery/today` that adapts to yesterday's per-exercise feedback. Backed by `routine_feedback` (PK on `(user_id, date, task_id)`, idempotent upsert) and a `/api/recovery/today/recommendation` endpoint whose rules are: drop one level if 2+ exercises were marked "too_hard" yesterday; step up one level after a 3-day steady streak with no "too_hard" and ≥60% "good"; otherwise hold. The Bonfire is a sequential one-task-at-a-time walkthrough — every step prompts felt-strong / hard / too-much; the sequence ends with a `WalkingCooldown` modal **only when chosenLevel ≥ 3 (Assisted Standing or Full Power)**. The walking modal is hard-gated by three mandatory checkboxes (spotter present, therapist clearance, assistive device ready) with a runtime guard inside `startTimer()`. Disclaimers are everywhere: `MedicalDisclaimerCard` (compact / full / modal variants) flags every page that "this is survivor-built education, not medical care" and surfaces 911 prominently. Implementation: `client/src/pages/RecoveryToday.tsx`, `client/src/components/recovery/{MedicalDisclaimerCard,WalkingCooldown}.tsx`. The shared `client/src/lib/recoveryRoutine.ts` is the single source of truth for LEVELS and BLOCKS — `DailyRoutine.tsx` was refactored to import from it (eliminates drift). Hero CTA wired into `RecoveryDashboard.tsx` directly above the Anthem hero.
- **SquatchQR Platform**: Enterprise-grade dynamic QR code system featuring Quote Studio (AI quote generation), QR Code Designer, Public Quote Page (landing page for QR scans with gamification), and Analytics Dashboard.
- **SEO SSR Layer (strokerecoveryacademy.com)**: To replace the SPA-only soft-404 shell that capped audit grades at ~49/100, the platform now serves dedicated server-rendered HTML for every Tier-1 landing URL via Express routes registered ahead of the Vite catch-all. Includes 14 long-form Tier-1 pages (`/for/{stroke-survivors,caregivers,young-stroke-survivors,spouses,therapists}`, `/programs/{sasquatch-method,66-day-challenge,daily-routine}`, `/learn/{neuroplasticity-after-stroke,hemiparesis-recovery,stroke-recovery-exercises-at-home,aphasia-recovery,depression-after-stroke,stroke-recovery-timeline}`) plus 3 hub pages (`/for`, `/programs`, `/learn`). Each page returns full HTML with unique H1/H2, 1500-2500 words of original Sasquatch Method content, three JSON-LD blocks (Article + FAQPage + BreadcrumbList), 5 FAQs, hero CTA, and internal-link clusters. Implemented in `server/seo/{ssrShell.ts,landingContent.ts,landingRoutes.ts}`; sitemap `/sitemap-recovery.xml` lists all 38 SSR URLs. Footer (`Footer.tsx`) wired with whoItsFor / programs / learn columns so none are orphan.
- **SSR Blog Engine (PAA capture)**: A second SSR layer at `/blog/[slug]` (separate namespace from the legacy DB-backed `/recovery/blog/[slug]`) targeting high-intent "People Also Ask" queries. Implemented in `server/seo/{blogContent.ts,blogRoutes.ts}` and reuses the same dark/gold `renderSsrPage` shell as the Tier-1 landings. Currently 12 in-depth posts (rehab duration, full recovery, second-stroke signs/prevention, TIA vs stroke, ischemic vs hemorrhagic, driving after stroke, best foods, fatigue, spasticity, memory, pseudobulbar affect) plus a `/blog` hub. Each post is ~700–1000 words, includes 5 FAQs (FAQPage JSON-LD), MedicalWebPage schema, breadcrumbs, unique CTAs, and an internal-link cluster of 4 related posts/Tier-1 pages. `registerBlogRoutes(app)` is wired into `server/routes.ts` after the landing/center-finder registrations (so it precedes the Vite catch-all). All 13 URLs (1 hub + 12 posts) are added to `/sitemap-recovery.xml` via `getBlogPageUrls()`. Footer (`Footer.tsx`) `learnLinks` now exposes `/blog` so the hub is not orphan.
- **Recovery Center Finder (rebuilt)**: Real Google Places integration backed by a `recovery_centers` Postgres cache (place_id PK, lat/lng, services, ratings, hours, services array, metro slug) with a 30-day TTL. The service `server/recoveryCentersService.ts` performs a 5-query fan-out per ZIP/metro (stroke rehab, neurologist, physical therapy, occupational therapy, speech-language pathologist), dedupes by place_id, computes Haversine distance, persists results, and optionally enriches the top 20 with `place_details`. The `/api/recovery/centers` endpoint resolves any ZIP into a city/state and returns 90+ deduped centers with distance and category. `server/seo/centerFinderRoutes.ts` provides three SSR endpoints: `/recovery/centers/:slug` (50 US metro hubs from `server/seo/metros.ts`, each rendering 25 real centers + ItemList JSON-LD), `/recovery/center/:placeId` (per-center detail with MedicalBusiness + AggregateRating + GeoCoordinates schema and a "What to ask on your first visit" checklist), and `/sitemap-centers.xml` (50 metros + every cached center detail page; currently 323 URLs, included in `sitemap-index.xml`). All SSR-rendered external links pass through a `safeHttpUrl()` allowlist that strips `javascript:`, `data:`, `vbscript:`, and other non-HTTP schemes before emitting `<a href>`. The React Center Finder page (`client/src/pages/RecoveryCenterFinder.tsx`) consumes the new API shape (placeId/category/distanceMiles), shows a "Live Google Places data" badge plus the resolved city/state, surfaces a "Bring this list to your first call" guide above results, supports filters for the 5 service categories, and links each card to its SSR detail page.

## External Dependencies

1.  **Replit Auth (OpenID Connect)**: User authentication.
2.  **Stripe**: Payment processing, subscriptions.
3.  **Google Gemini AI**: AI content generation.
4.  **OpenAI**: Advanced AI writing and analysis.
5.  **Remove.bg API**: Image background removal.
6.  **Neon Database**: Serverless PostgreSQL.
7.  **Radix UI**: Accessible UI primitives.
8.  **Lucide React**: Iconography.
9.  **TipTap**: Rich text editing.
10. **Tone.js**: Audio/music processing.
11. **Drizzle ORM / Drizzle Kit**: Database queries and migrations.
12. **mammoth / pdf-parse**: Document parsing.
13. **SERP API**: Keyword research.
14. **Lulu API**: Print-on-demand publishing.
15. **ElevenLabs API**: Text-to-speech services.