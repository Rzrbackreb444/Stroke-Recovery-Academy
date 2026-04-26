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
- **Registry-Driven SEO Meta + JSON-LD Architecture**: `shared/seo/routeRegistry.ts` is the single source of truth — 70+ `RouteEntry` items covering every public wouter route plus every private surface, each with regex `pattern`, `category`, `intent`, `schemaType`, EEAT `author`, ≤60-char title, 140–160-char description, sitemap fields (`priority`, `changefreq`), and `ssrHandled` flag. Exports `lookupRoute`, `isPrivatePath`, `getStaticSitemapEntries`, `getRegistryStats`. `shared/seo/routeMeta.ts` is now a thin compat shim deriving from the registry (preserves `lookupRouteMeta`, `isPrivatePath`, `RouteMeta` for existing callers; unknown paths get a generic indexable WebPage default — no silent noindex). `shared/seo/schemaGenerator.ts` emits `Organization` + `WebSite` + `Person` (Nick) + per-page schema (`WebPage`/`MedicalWebPage`/`AboutPage`/`CollectionPage`/`Article`/`Course`/`Service`/`Product`) with stable `@id` references (`/#organization`, `/#website`, `/#nick`, `/#webpage`) so Google graph-merges blocks across the site; `MedicalWebPage` blocks include `reviewedBy: {@id #nick}` + `lastReviewed` + `specialty: Neurology` for survivor-led EEAT signal. `server/seo/applyRouteMeta.ts` rewrites the SPA `index.html` `<head>` on every non-SSR GET — strips legacy meta + injects per-route title/description/robots/canonical/OG/Twitter and (for indexable routes only) JSON-LD blocks. Canonical URL is host-allowlisted via `resolveCanonicalOrigin(host)` — `process.env.CANONICAL_ORIGIN` wins, then `{strokerecoveryacademy.com, www.strokerecoveryacademy.com, kreaite.xyz, www.kreaite.xyz}`, else collapses to `https://strokerecoveryacademy.com` (closes a host-header poisoning vector). The sitemap (`server/routes.ts /sitemap.xml` + `/sitemap-recovery.xml`) derives static entries from `getStaticSitemapEntries()` so any route added to the registry auto-appears (sitemap.xml: 25 → 57 URLs after migration); dynamic content (blogs, listings, exercises, week pages, state hubs) is still appended from DB. SSR routes (programmaticRoutes, blogRoutes, landingRoutes, centerFinderRoutes) short-circuit upstream and keep bespoke per-page meta + schema.
- **Admin SEO Command Center** (`/admin/seo` — `client/src/pages/AdminSEODashboard.tsx`, gated by `<AdminRoute>`): four tabs surfacing the registry — Registry table (filter by pattern/category/intent/title with indexable+SSR badges), Per-route inspector (POST a path → see matched entry + generated JSON-LD blocks), Distribution charts (by category/intent/schema type), Submit (pushes every indexable URL to IndexNow). Backend endpoints `GET /api/admin/seo/registry`, `GET /api/admin/seo/inspect?path=`, `POST /api/admin/seo/submit` all use `isAuthenticated` middleware + inline `u.role === 'admin'` 403 check (mirrors the existing admin-endpoint pattern; never trusts the `<AdminRoute>` UI gate alone).
- **IndexNow Push (Bing / Yandex / Seznam / Naver)**: `POST /api/admin/seo/submit` builds the URL list from `getStaticSitemapEntries()` (registry-derived, ~71 URLs) plus DB-derived blog/marketplace/programmatic URLs, dedupes, chunks at 1,000 URLs/batch, and POSTs to `https://api.indexnow.org/indexnow` with the IndexNow protocol envelope. The verification key file is served at `/<INDEXNOW_KEY>.txt` (default `b4467db1ff1a56507f0cd0b4754c969e`, override via `INDEXNOW_KEY` env var). Google's legacy sitemap-ping endpoint was retired in 2023 — Google now auto-discovers via the `Sitemap:` directive in `robots.txt` (already declares `https://strokerecoveryacademy.com/sitemap-index.xml`, which fans out to sitemap.xml + sitemap-recovery.xml + sitemap-blog.xml + sitemap-centers.xml + sitemap-marketplace.xml). Per-URL Google push requires the GSC URL Inspection tool or the Indexing API (job-postings/livestream only).
- **Indexable surface coverage**: Sitemap.xml grew from 25 → 57 → 71 static URLs after flipping wrongly-noindex'd public pages: `/games`, `/slots`, `/blackjack`, `/roulette`, `/texas-holdem`, `/bingo`, `/powerball`, `/scratch-off`, `/wilderness-survival` (Forge Your Beast brain-training games), `/store` (Survivor Shop alias), `/voice-library`, `/templates` (creator catalogs), `/therapists/apply`, `/recovery/routine`, `/recovery/university/lesson|quiz|certificate`. Private surfaces (`/book-studio`, `/dashboard`, `/admin/*`, `/settings`, `/my-book`, `/my-learning`, creator dashboards, magic-link, marketplace order detail, course-builder) remain noindex.
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