# Stroke Recovery Academy

## Overview

Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first stroke recovery platform dedicated to empowering stroke survivors beyond traditional medical timelines. It provides recovery exercises, challenges, daily routine tools, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also includes a creator-side toolkit (Book Studio, Course Studio) for survivor-authors to publish recovery content and a Marketplace with an 85/15 creator revenue split. The core vision is to accelerate survivor recovery and foster the sharing of effective strategies within the community.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and TailwindCSS for styling. It leverages Shadcn/ui (Radix UI base) for components, featuring a literary warm theme for the main platform and a distinct dark OS theme for the Stroke Recovery OS. State management uses TanStack Query for server state and custom hooks for authentication. The design prioritizes mobile-first responsiveness, accessibility, and uses lucide-react for icons. Routes are code-split for optimized loading.

### Backend
The backend uses Express.js and TypeScript, adhering to RESTful API principles with JSON and CORS. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js for session-based authentication and HTTP-only cookies. A multi-provider Passport strategy handles email/password and Google OAuth, with unified user ID retrieval regardless of authentication method.

### Data Storage
PostgreSQL is the primary data store, utilizing Neon serverless driver and the pgvector extension for AI functionalities. Drizzle ORM provides type-safe queries and schema management, including models for users, projects, assets, credit systems, and an AI Author Brain with pgvector embeddings and HNSW indexing.

### Global Platform Services
The platform includes a credit system with wallet management, geolocation and i18n supporting 50+ countries/currencies and 20 languages, and an EventEmitter-based background job processing queue with SSE streaming. Analytics track usage, token consumption, and feature utilization.

### UI/UX Decisions
A consistent literary warm theme is used for the main platform, while the Stroke Recovery OS employs a dark OS aesthetic. UI/UX focuses on intuitive interfaces, responsive design, and persistent user inputs for professional tools.

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
- **Observability**: Request ID tracking, structured error logging, and health routes with DB ping.
- **Branded Onboarding**: Streamlined welcome flow for new users focusing on key recovery pillars.
- **Transactional Email Disclaimers**: Inclusion of medical disclaimers and crisis support information in emails.
- **Bonfire Personalization**: Adapts daily recovery tasks based on survivor intake data.
- **AI Coach Crisis Safety**: Pre-LLM crisis detection for chat messages, providing crisis resources upon detection.
- **Recovery Anchor Studio**: Survivor-first musical-mnemonic encoder grounded in Melodic Intonation Therapy and Rhythmic Auditory Stimulation.

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