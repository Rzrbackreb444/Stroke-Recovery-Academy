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
- **Transactional Email Disclaimers**: Inclusion of medical disclaimers and crisis support information in emails.
- **Bonfire Personalization**: Adapts daily recovery tasks based on survivor intake data.
- **AI Coach Crisis Safety**: Pre-LLM crisis detection for chat messages, providing crisis resources upon detection.
- **Recovery Anchor Studio**: Survivor-first musical-mnemonic encoder grounded in Melodic Intonation Therapy and Rhythmic Auditory Stimulation.
- **Survivor Voice Cloning**: Integrates ElevenLabs Instant Voice Cloning with a two-tier paywall ($9/mo subscription + $5 per clone) and administrative tools for managing voice intros and content.
- **Coach Sasquatch DJ**: ElevenLabs voice intros for Sasquatch Radio, using a separate premade voice.

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