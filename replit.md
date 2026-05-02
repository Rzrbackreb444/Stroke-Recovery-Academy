# KreAIte.xyz

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform designed to empower creators to "CREATE. PUBLISH. EARN." It offers seven professional studios (Book, Video, Music, Course, Image, Doctrine Engine, Website Builder) for content production, an integrated marketplace (KreAItorverse) with an 85/15 revenue split, and comprehensive publishing tools. The platform features advanced AI for content generation and editing, unified media editing, full-featured website hosting, a dedicated Stroke Recovery OS with specialized tools, and an enterprise-grade dynamic QR code system (SquatchQR). Its vision is to streamline the creative workflow from concept to publication, fostering a vibrant creator economy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and TailwindCSS for styling. UI components are built with Shadcn/ui (Radix UI base) featuring a literary warm theme, with a distinct dark OS theme for the Stroke Recovery OS. State management is handled by TanStack Query for server state and custom hooks for authentication. Design prioritizes mobile-first responsiveness and accessibility, with icons exclusively from lucide-react.

### Backend
The backend is built with Express.js and TypeScript, following RESTful API patterns with JSON format and CORS. Authentication uses Replit Auth (OpenID Connect) via Passport.js, with session-based authentication and HTTP-only cookies.

### Data Storage
Primary data storage is PostgreSQL, utilizing Neon serverless driver and the pgvector extension for AI-related functionalities. Drizzle ORM is used for type-safe queries and schema management, including models for users, projects, assets, sessions, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing.

### Global Platform Services
The platform includes a credit system with wallet management, geolocation and localization supporting 50+ countries/currencies and 20 languages (i18n), and an EventEmitter-based background job processing queue with SSE streaming. Analytics track per-studio usage, token consumption, and feature utilization.

### UI/UX Decisions
A consistent literary warm theme is applied to the main platform, while the Stroke Recovery OS uses a dark OS aesthetic. UI/UX emphasizes intuitive interfaces for professional tools, with a focus on responsive design and persistent user inputs.

### Feature Specifications
- **Seven Studios**: AI-integrated tools for various content types.
- **Creator Production Engine**: Content vaults, SERP research, batch production, unified dashboard.
- **KreAItorverse Marketplace**: Content selling platform with an 85% creator revenue share.
- **Creator Dashboard**: Centralized management for projects, earnings, and administration.
- **Affiliate/Referral System**: APIs for tracking and commission payouts.
- **AI Integration**: Leverages Google Gemini, OpenAI, Lyria for music, and specialized models for images/video.
- **Book Studio Workspace**: Professional publishing with KDP-ready export and AI analysis.
- **Premium Blog SEO Suite & SEO Command Center**: Enterprise-grade SEO optimization tools.
- **Lulu Publishing Integration**: Print-on-Demand via OAuth2 API.
- **Course Social Layer**: Forums, groups, cohorts, reviews, instructor analytics, direct messaging, and Live Circles, with features like My Path Recommender, Survivor Scholarship, and Course Translations.
- **Offline PWA**: Progressive Web App with offline caching.
- **Accountability Buddy**: System for survivor pairing.
- **Stroke Recovery OS**: Dedicated platform with Recovery Dashboard, University, Center Finder, Blog, Forge Your Beast, Sasquatch Coach (AI companion), Survivor Community, Daily Routine System, and 66-Day Sasquatch Transformation Challenge.
- **Motivation Studio**: Anthem Maker, Vision Card, and Daily Quote for recovery motivation.
- **Survivor Shop**: Curated Amazon affiliate storefront for recovery products.
- **The Bonfire (Adaptive Today Session)**: Daily recovery task system adapting to user feedback.
- **SquatchQR Platform**: Enterprise dynamic QR code system with Quote Studio, Designer, Public Quote Page, and Analytics.
- **SEO SSR Layer**: Server-side rendered HTML for Tier-1 landing pages and blog posts, including JSON-LD for SEO.
- **Recovery Center Finder**: Google Places integration with a cached database, providing search and SSR detail pages.
- **Generative-Engine SEO (GEO)**: Configured for AI-crawler citation with explicit `robots.txt` allowances and schema-rich SSR pages.
- **Programmatic SEO Pages**: Three SSR templates (`/recovery/exercise/:slug`, `/recovery/week/:n`, `/recovery/centers/state/:code`) auto-included in sitemap.
- **In-App Feedback Inbox**: Public feedback submission and admin triage view.
- **Content Machine**: Admin-only tool for AI-generated SEO-optimized blog drafts and hero infographics.
- **Podcast Pipeline**: Admin action to convert blog posts into narrated podcasts via AI, exposed via RSS feed.
- **PWA (mobile experience)**: Production-ready Progressive Web App with offline caching, push notifications, and an install prompt.
- **Registry-Driven SEO Meta + JSON-LD Architecture**: A single source of truth for SEO metadata and schema generation for all public and private routes, ensuring consistent and discoverable content.
- **Admin SEO Command Center**: Admin dashboard for managing SEO registry, inspecting routes, viewing distribution charts, and submitting URLs to IndexNow.
- **IndexNow Push**: Automated submission of indexable URLs to Bing, Yandex, Seznam, and Naver.
- **Marketplace Order Integrity**: Robust fulfillment process with detailed status tracking and conditional earnings recording.
- **Security/Cost-Control Hardening**: Implemented body limits, explicit `sameSite` for session cookies, persistent rate-limiting, and AI/voice quota gates on direct-LLM routes.
- **FK Indexes**: Optimized database performance with 32 indexes across 20 high-traffic tables.

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