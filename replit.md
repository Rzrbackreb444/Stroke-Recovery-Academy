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