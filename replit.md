# KreAIte.xyz

**"CREATE. PUBLISH. EARN."**

**Powered by KremersX**

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform designed to empower creators through seven professional studios (Book, Video, Music, Course, Image, Doctrine Engine, Website Builder). It facilitates content production, publishing, and monetization via an integrated marketplace (KreAItorverse) offering an 85/15 revenue split. The platform leverages advanced AI for content generation, editing, and analysis, streamlining the creative workflow from concept to publication. Key features include unified media editing, a robust marketplace for templates and finished works, comprehensive publishing tools, and full-featured website hosting with custom subdomains. The platform also includes a dedicated Stroke Recovery OS with specialized tools, community features, and a 66-day transformation challenge, alongside an enterprise-grade dynamic QR code system (SquatchQR) for engaging content delivery.

## User Preferences

Preferred communication style: Simple, everyday language.

## SEO / Indexing

**`client/index.html` is the source of truth for what Google indexes.** It must always carry Stroke Recovery Academy branding, canonical = `https://strokerecoveryacademy.com/`, and the full structured-data block (Organization, WebSite, MedicalWebPage, Course, FAQPage). Never let it revert to KreAIte/kreaite.xyz tags — that triggers duplicate-content penalties and blocks indexing.

**GSC verification code is installed in `client/index.html`.** After deploy, log in to Google Search Console, click **Verify** on the `strokerecoveryacademy.com` property, and submit `https://strokerecoveryacademy.com/sitemap-index.xml`.
Design mandate: 
- Creator Platform: Literary warm palette - cream background (#FAF8F3), antique gold accent (#C9941A)
- Stroke Recovery OS: Dark OS theme - black background (#0D0D0D), gold accents (#C9941A), card backgrounds (#1a1a1a), borders (#333)
Icons: lucide-react only (no emoji)

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite, Wouter, TailwindCSS.
- **UI Component System**: Shadcn/ui (built on Radix UI) with a literary warm theme, using Crimson Pro/Playfair Display/Inter fonts.
- **State Management**: TanStack Query for server state, custom hooks for authentication.
- **Key Design Decisions**: Literary warm theme for the main platform, dark OS theme for Stroke Recovery OS, mobile-first responsive design, accessibility-first approach.

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
- Consistent literary warm theme for the main platform and a dark OS aesthetic for the Stroke Recovery OS.
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
- **Course Social Layer (P2)**: Forums, Groups, per-course Cohorts (auto-created weekly with 30-day window, voice posts via Whisper, crisis-keyword detection → 988), course Reviews + ratings (1-5 stars, verified-completion badge from `userCourseProgress`, helpful upvotes), and an Instructor Analytics dashboard at `/instructor/analytics` (enrollments, completion %, weighted avg rating, 85% earnings split — pending vs paid).
- **Direct Messaging + Therapist Open Hours (P3-01)**: 1:1 and group DMs at `/messages` with read receipts and conversation list. Verified therapists set weekly availability windows at `/settings/therapist-hours` (`PUT /api/therapists/me/hours`); the `TherapistAvailabilityBadge` component fetches `/api/therapists/:userId/availability` and shows survivors an "Open Hours · until 17:00" / "Open tomorrow 09:00" hint in the chat header so they know when to expect a reply.
- **Live Circles (P3-02)**: Weekly community video calls at `/recovery/circles`, layered on existing `videoSessions` + `videoSessionParticipants`. Public `GET /api/circles/upcoming` lists scheduled and live events (filtered by `scheduled_at + duration > NOW()`). Verified therapists and admins host via `POST /api/circles` (gated client-side by `/api/circles/can-host`). RSVPs are atomic — single SQL `INSERT ... SELECT WHERE count < cap ... ON CONFLICT DO NOTHING` inside a `FOR UPDATE` lock on the session row, backed by a unique index on `video_session_participants(session_id, user_id)` so concurrent requests can never overbook or duplicate. Daily.co rooms are auto-created when `DAILY_API_KEY` is set; otherwise hosts paste any meeting URL (Zoom/Meet/Daily). Survivors see a "Join in 15m" / "Join live" button when the event is within 15 minutes of start or running.
- **Course Refund Window (P3-06)**: Buyers can request a refund within 7 days of unlocking a course as long as they've watched less than 25% (read from `userCourseProgress.progressPercentage`). `GET /api/courses/:id/refund-eligibility` returns `{eligible, reason, daysLeft, watchedPercent}`. `POST /api/courses/:id/refund` is double-submit-safe via an atomic `UPDATE … WHERE refunded_at IS NULL RETURNING id` claim, refunds Power Points to the buyer, and — if the instructor's payout actually transferred — calls `stripe.transfers.createReversal` for the 85% creator share. If `addCredits` fails after the claim, the claim is rolled back so the user can retry instead of being stranded refund-locked-but-uncredited. Refunded unlocks revoke access (`/api/courses/:id/unlock-info` reports `unlocked:false` once `refundedAt` is set), and re-unlocking the same course updates the existing row in place to respect the `(buyer_id, course_id)` unique index. The `<CourseRefundButton>` lives in the CoursePlayer header next to share.
- **Course Sharing + Affiliate Hooks (P3-05)**: `<CourseShareButton courseId>` (mounted in the CoursePlayer header) opens a dropdown with X / Facebook / Reddit / LinkedIn / WhatsApp / SMS / Copy / native share. `GET /api/share/course/:id` returns the canonical `shareUrl` (auto-suffixed with the signed-in user's referral code from `referralCodes`), title, summary, OG image, and prebuilt provider URLs. `POST /api/share/track` logs to `share_events` (course_id, channel, user_id, ref_code) with two security guarantees: (1) origin is built from `APP_BASE_URL`/`PUBLIC_BASE_URL`/`SITE_URL` env to block Host-header poisoning of share links, and (2) `ref_code` is server-derived from the authenticated session — client-supplied ref codes are ignored to prevent attribution fraud. A 10s in-memory dedupe per (user|ip, course, channel) blocks trivial telemetry spam.
- **My Path Recommender (P3-04)**: `GET /api/recommendations/next-courses?limit=N` (1–10) returns unstarted, published courses ranked by category-tag overlap with the user's `userCourseProgress` history, then by `enrollment_count` as the popularity signal. Cold-start users fall back to most-popular. Each result includes a heuristic "why this fits" reason ("Builds on your Cognitive & Emotional work", "Most-loved by survivors", etc.). The `MyPathRecommender` card lives on `/recovery/dashboard` between the 66-day tracker and check-in grid.
- **Accountability Buddy (P3-03)**: Survivors opt in at `/recovery/buddy` with their routine level (0 Survival → 4 Full Power), interests, and a short bio. `POST /api/buddy/find` scores candidates by interest overlap + routine-level proximity and atomically pairs the top match. Atomicity is enforced by a normalized `buddy_active_members` table whose `PRIMARY KEY (user_id)` makes double-pairing impossible — concurrent finders simply fall through to the next candidate on `unique_violation`. `POST /api/buddy/end` clears both membership rows and resets profiles to `looking` (or `paused` if opted out), so re-matching is immediate. Active pair card shows partner avatar, interests, and a Send-a-check-in button that links to `/messages`.
- **Stroke Recovery OS**: Dedicated platform with a dark OS theme, including:
    - **Recovery Dashboard**: Daily check-ins, habit tracking, motivational content.
    - **Recovery University**: Interactive, graded curriculum with lessons, quizzes, and certificates.
    - **Recovery Center Finder**: ZIP-based search for rehab centers and specialists.
    - **Recovery Blog**: Survivor stories and expert articles.
    - **Forge Your Beast**: Persona/alter-ego system for survivors with AI-assisted creed generation.
    - **Sasquatch Coach**: 24/7 AI companion with ElevenLabs voice.
    - **Survivor Community**: Social hub with post feed, member directory, live events, and classroom integration.
    - **Daily Routine System**: 5-level structured daily routine (Level 0 Survival → Level 4 Full Power) with four time blocks (Morning, Midday, Evening, Wind-Down), auto-saving checkbox tasks, streak tracking, bad day protocol/modal, and medical disclaimer. Lives at `/recovery/routine`. Database table: `routine_completions`. API: GET/PUT `/api/recovery/routine/today`.
    - **66-Day Sasquatch Transformation Challenge**: Structured program with daily missions and progress tracking.
    - **Gift a Survivor**: Donation page for scholarships to the platform.
- **SquatchQR Platform**: Enterprise-grade dynamic QR code system featuring:
    - **Quote Studio**: AI quote generation and project management.
    - **QR Code Designer**: Customizable QR codes with branding options.
    - **Public Quote Page**: Landing page for QR scans with streak tracking, voice delivery, and social sharing.
    - **Gamification**: Streak tracking, badges, and leaderboard.
    - **Analytics Dashboard**: Comprehensive scan metrics and user engagement data.

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