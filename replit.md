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
- **SquatchQR Platform**: Enterprise-grade dynamic QR code system featuring Quote Studio (AI quote generation), QR Code Designer, Public Quote Page (landing page for QR scans with gamification), and Analytics Dashboard.

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