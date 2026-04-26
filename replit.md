# KreAIte.xyz

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform designed to empower creators to "CREATE. PUBLISH. EARN." It offers seven professional studios (Book, Video, Music, Course, Image, Doctrine Engine, Website Builder) for content production, an integrated marketplace (KreAItorverse) with an 85/15 revenue split for monetization, and comprehensive publishing tools. The platform features advanced AI for content generation and editing, unified media editing, full-featured website hosting with custom subdomains, a dedicated Stroke Recovery OS with specialized tools, and an enterprise-grade dynamic QR code system (SquatchQR). Its vision is to streamline the creative workflow from concept to publication, fostering a vibrant creator economy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and TailwindCSS for styling. UI components are built with Shadcn/ui (Radix UI base) featuring a literary warm theme with Crimson Pro, Playfair Display, and Inter fonts. State management is handled by TanStack Query for server state and custom hooks for authentication. Design prioritizes mobile-first responsiveness and accessibility, with icons exclusively from lucide-react. The Stroke Recovery OS utilizes a distinct dark OS theme.

### Backend
The backend is built with Express.js and TypeScript, following RESTful API patterns with JSON format and CORS. Authentication uses Replit Auth (OpenID Connect) via Passport.js, with session-based authentication and HTTP-only cookies stored in PostgreSQL.

### Data Storage
Primary data storage is PostgreSQL, utilizing Neon serverless driver and the pgvector extension for AI-related functionalities. Drizzle ORM is used for type-safe queries and schema management. The schema includes comprehensive models for users, projects, assets, sessions, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing for semantic memory.

### Global Platform Services
The platform includes a credit system with wallet management, geolocation and localization supporting 50+ countries/currencies and 20 languages (i18n), and an EventEmitter-based background job processing queue with SSE streaming. Analytics track per-studio usage, token consumption, and feature utilization.

### UI/UX Decisions
A consistent literary warm theme is applied to the main platform, while the Stroke Recovery OS uses a dark OS aesthetic. UI/UX emphasizes intuitive interfaces for professional tools like the TipTap book editor and MediaStudio, with a focus on responsive design and persistent user inputs.

### Feature Specifications
- **Seven Studios**: AI-integrated tools for various content types.
- **Creator Production Engine**: Content vaults, SERP research, batch production, unified dashboard.
- **KreAItorverse Marketplace**: Content selling platform with an 85% creator revenue share.
- **Creator Dashboard**: Centralized management for projects, earnings, and administration.
- **Affiliate/Referral System**: APIs for tracking and commission payouts.
- **AI Integration**: Leverages Google Gemini, OpenAI, Lyria for music, and specialized models for images/video.
- **Book Studio Workspace**: Professional publishing with KDP-ready export and AI analysis (DoctrineChecker, ConsistencyMonitor).
- **Premium Blog SEO Suite & SEO Command Center**: Enterprise-grade SEO optimization tools.
- **Lulu Publishing Integration**: Print-on-Demand via OAuth2 API.
- **Course Social Layer**: Forums, groups, cohorts, reviews, instructor analytics, direct messaging, and Live Circles.
- **Course Refund Window & Sharing**: Features for course management and promotion.
- **My Path Recommender, Survivor Scholarship, Caregiver Seats**: Specialized features for the course platform.
- **Course Translations**: On-demand translation of course content.
- **Offline PWA**: Progressive Web App with offline caching.
- **Accountability Buddy**: System for survivor pairing.
- **Stroke Recovery OS**: Dedicated platform with Recovery Dashboard, University, Center Finder, Blog, Forge Your Beast, Sasquatch Coach (AI companion), Survivor Community, Daily Routine System, and 66-Day Sasquatch Transformation Challenge.
- **Motivation Studio**: Anthem Maker (AI-generated audio affirmations), Vision Card (AI-generated image visualization), and Daily Quote for recovery motivation.
- **Survivor Shop**: Curated Amazon affiliate storefront for recovery products.
- **The Bonfire (Adaptive Today Session)**: Daily recovery task system adapting to user feedback.
- **SquatchQR Platform**: Enterprise dynamic QR code system with Quote Studio, Designer, Public Quote Page, and Analytics.
- **SEO SSR Layer (strokerecoveryacademy.com)**: Server-side rendered HTML for Tier-1 landing pages and blog posts, including JSON-LD for SEO.
- **Recovery Center Finder**: Google Places integration with a cached database, providing search and SSR detail pages for recovery centers.
- **Generative-Engine SEO (GEO)**: `/llms.txt` exposes platform identity and citation-friendly section summaries; robots.txt explicitly allows GPTBot, Claude-Web, and PerplexityBot for AI-crawler citation. Tier-1 SSR landing pages emit FAQ/HowTo/MedicalEntity JSON-LD with TL;DR + definition + comparison-table blocks for AI-citable formatting.
- **Programmatic SEO Pages** (`server/seo/programmaticRoutes.ts`): Three SSR templates auto-included in sitemap-recovery.xml — `/recovery/exercise/:slug` (HowTo + Article JSON-LD with sets/reps/safety table per recovery exercise), `/recovery/week/:n` for weeks 1–52 ("Week N of stroke recovery: what to expect" with FAQPage JSON-LD), and `/recovery/centers/state/:code` (ItemList JSON-LD aggregating all metros for that US state). DB-derived values are HTML-escaped before reaching `ssrShell.rawHtml`.
- **In-App Feedback Inbox**: `feedback_items` table (id/userId/route/kind/body/severity/status) + public `POST /api/feedback/items` (auth-optional, route-aware) + admin GET/PATCH at `/api/admin/feedback/items`. `<FeedbackButton>` is a floating, persistent widget mounted globally; `/admin/feedback-inbox` is the Nick-only triage view with status filters.
- **Content Machine** (admin-only at `/admin/blog/draft`): Topic/keyword goes in, full SEO-optimized blog draft comes out (H1/H2/H3 outline, FAQ section, meta description, slug, schema-ready JSON) via Gemini 2.0 Flash. Drafts save into the existing blog system; one-click "Generate hero infographic" calls Imagen with a prompt derived from the post outline and attaches it as the post's hero image.
- **Podcast Pipeline** (`server/podcastRoutes.ts`): Admin action `POST /api/admin/podcast/from-blog/:postId` polishes a blog post into a narration script via Gemini, narrates with the ElevenLabs Nick voice via `sasquatchSpeak`, stores MP3 as a base64 data URL (object storage suspended), and exposes it via `GET /podcast/episode/:id/audio.mp3`. `GET /podcast/feed.xml` serves valid RSS 2.0 + iTunes namespace; the feed query projects display columns only and computes `OCTET_LENGTH(audio_url)` in SQL for real `<enclosure length>` so it never loads base64 blobs into Node memory.
- **PWA (mobile experience)**: Production-ready Progressive Web App at `client/public/manifest.webmanifest` + `client/public/sw.js`. Manifest declares `display: standalone`, dark theme color `#0D0D0D`, maskable + any-purpose 192/512 icons, and four `shortcuts` (Today's check-in, Daily routine, My courses, Sasquatch coach). Service worker handles push notifications and offline caching for static + course assets with versioned cache namespaces (`sra-static-v2`, `sra-course-v2`, `sra-runtime-v2`). `<InstallPrompt>` listens for `beforeinstallprompt` and surfaces a survivor-friendly install banner. **Future**: native App Store + Play Store presence is planned via Capacitor wrapper (1–2 sessions; reuses the React app, adds native shell for permissions/push). Trigger is "first paying users in production"; no Expo / React Native rewrite planned.
- **Per-route Meta Architecture**: `shared/seo/routeMeta.ts` is the source-of-truth registry — `INDEXABLE_RULES` (24 entries) holds ≤60-char titles + 140–160-char descriptions for every public SPA route (/, /pricing, /studios/*, /recovery/*, /sasquatch-coach, etc.) with brand at the end; `NOINDEX_PATTERNS` covers private app surfaces (/dashboard, /admin/*, /checkout, /book-studio/*, journal/medical/flicker logs). `lookupRouteMeta(path)` resolves either to a `RouteMeta` or to a noindex stub. `server/seo/applyRouteMeta.ts` rewrites the SPA `index.html` `<head>` server-side on every non-SSR GET (wired into both `server/index-dev.ts` after `vite.transformIndexHtml` and `server/index-prod.ts` with cached `readFile` + transform). Canonical URL is host-allowlisted via `resolveCanonicalOrigin(host)` — `process.env.CANONICAL_ORIGIN` wins, then `{strokerecoveryacademy.com, www.strokerecoveryacademy.com, kreaite.xyz, www.kreaite.xyz}`, else collapses to `https://strokerecoveryacademy.com` (closes a host-header poisoning vector). Client-side `client/src/hooks/useRouteMeta.ts` re-syncs `document.title` + meta tags on every wouter route change. SSR routes (programmaticRoutes, blogRoutes, landingRoutes, centerFinderRoutes) short-circuit upstream and never reach the SPA transformer, so they keep their bespoke per-page meta.
- **Marketplace Order Integrity**: Listing counters (`marketplace_listings.totalSales` / `totalRevenue`) are bumped from a single source of truth — `fulfillOrder()` in `server/fulfillmentService.ts` — and only for items whose individual fulfillment succeeded. `creator_earnings` rows are inserted in `'pending'` status before fulfillment runs; on total fulfillment failure, the parent `book_orders.status` becomes `'fulfillment_failed'` and the earnings row stays in `'pending'` so it cannot be auto-paid. The Lulu-not-configured path now hard-fails (logs an error + writes a `failed` `lulu_print_jobs` row) instead of silently returning a fake `MOCK_…` order id.

## External Dependencies

1.  **Replit Auth**: User authentication.
2.  **Stripe**: Payment processing.
3.  **Google Gemini AI**: AI content generation.
4.  **OpenAI**: AI writing and analysis.
5.  **Remove.bg API**: Image background removal.
6.  **Neon Database**: Serverless PostgreSQL.
7.  **Radix UI**: Accessible UI primitives.
8.  **Lucide React**: Iconography.
9.  **TipTap**: Rich text editing.
10. **Tone.js**: Audio/music processing.
11. **Drizzle ORM / Drizzle Kit**: Database interaction.
12. **mammoth / pdf-parse**: Document parsing.
13. **SERP API**: Keyword research.
14. **Lulu API**: Print-on-demand publishing.
15. **ElevenLabs API**: Text-to-speech services.