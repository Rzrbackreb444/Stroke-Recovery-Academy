# Stroke Recovery Academy

## Overview
Stroke Recovery Academy ("REBUILD. REWIRE. RISE.") is a survivor-first platform designed to accelerate stroke recovery and foster a supportive community. It provides recovery exercises, daily routines, an AI Sasquatch Coach, and a survivor community with accountability pairing. The platform also enables survivor-authors to create, publish, and monetize content through tools like Book Studio and Course Studio via a Marketplace, promoting economic independence and sharing effective recovery strategies. The vision is to empower stroke survivors globally, offering personalized recovery journeys and fostering a vibrant community.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a literary warm theme for the main interface and a dark OS theme for the Stroke Recovery OS. Design prioritizes mobile-first responsiveness, accessibility, and intuitive interfaces. Professional tools maintain persistent user inputs. The "More" dropdown in the header is a 3-column megamenu structured by recovery progression (Practice / Connect / Earn) to improve navigation for users with aphasia or executive dysfunction.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Wouter, and TailwindCSS with Shadcn/ui, using TanStack Query for state management and custom authentication hooks. The backend utilizes Express.js with TypeScript, following RESTful API principles. Authentication is handled via Replit Auth (OpenID Connect) and Passport.js. PostgreSQL, with Neon serverless driver and pgvector, serves as the primary data store, managed by Drizzle ORM. Key technical features include a global credit system, geolocation, i18n support, an EventEmitter-based background job processing queue with SSE streaming, and server-side rendering (SSR) for SEO on Tier-1 landing pages and blog posts, including JSON-LD and Generative-Engine SEO (GEO). Observability includes request ID tracking, structured error logging, health routes, and client-side Sentry. Performance optimizations include specific `Cache-Control` headers for API endpoints and composite indexes for frequently queried tables.

### Feature Specifications
- **Seven Studios**: AI-integrated content creation tools (e.g., Book Studio, Lyrics Studio, Motivation Studio, Recovery Anchor Studio for musical-mnemonic encoding).
- **Creator Production Engine**: Tools for content vaults, SERP research, batch production, and a unified dashboard.
- **Marketplace**: Content selling platform with an 85% creator revenue share.
- **AI Integration**: Leverages Google Gemini, OpenAI, and Lyria for various functionalities, including pre-LLM crisis detection and personalized recommendations.
- **Course Social Layer**: Community features like forums, groups, cohorts, reviews, and Live Circles (Campfire).
- **Offline PWA**: Progressive Web App with offline caching and push notifications.
- **Accountability Buddy**: System for survivor pairing and daily recovery tasks (The Bonfire).
- **Stroke Recovery OS**: Dedicated platform with a Recovery Dashboard, University, Center Finder, Blog, Sasquatch Coach, Survivor Community, Daily Routine System, and the 66-Day Sasquatch Transformation Challenge.
- **Survivor Voice Cloning**: Integration with ElevenLabs Instant Voice Cloning.
- **In-App Feedback Inbox**: Public submission and admin triage.
- **Content Machine & Podcast Pipeline**: Admin tools for AI-generated blog drafts, infographics, and narrated podcasts.
- **Branded Onboarding & Daily Journey Funnel**: Streamlined new user welcome flow and a single-page daily activity integration with live completion tracking.
- **Gemini Recommendation Cards & Nick Quote Library**: Contextual recommendations and a curated collection of founder and survivor quotes for motivation.
- **Anonymous Coach Gate & Sasquatch Premium**: Rate-limited free messages for anonymous users and a premium subscription model for enhanced Coach access, Recovery Anchor renders, and voice cloning.
- **Premium SEO / E-E-A-T pass**: Enhancements for Marketplace Product schema, Course schema, and Nick Person `sameAs` data.
- **AI Studio Sign-in UX Hardening**: Improved error handling and state persistence for authentication-gated AI features.
- **Coach Voice + Push-to-talk + Latency Cut**: Upgrades to the Sasquatch Coach for improved interaction, including client-side SpeechRecognition and text-first/TTS-in-parallel response delivery.
- **Never Zero Audit**: A structured daily check-in with personalized audits, gamification (streak tiers), and a dedicated dashboard hero card.
- **Header Accountability Refocus**: Restructured primary navigation to prioritize daily action surfaces like Coach, Today, Never Zero, and Bonfire.
- **Hostile Construction Album Pages**: Permanent landing pages for the *Hostile Construction* album, featuring tracklists, embedded players, and streaming service links.
- **Coach + Audit 95+ Pass**: Enhanced Sasquatch Coach voice and integration with Never Zero audit data for more personalized and structured responses.
- **Sasquatch Sound Label**: Public landing page for founder album tracks, tiered offerings, and interest signup.
- **Sasquatch Studio**: Auth-gated tiered subscription service for voice cloning and album building with varying capabilities based on subscription level (Creator, Pro, Label). This includes the ability to clone voices, generate audio, and download generations, with Stripe handling subscription management.
- **Album Builder**: Tools for survivors to create and publish albums from Studio generations or uploaded MP3s, with tier-gated features like album count caps, tracks per album, public share pages, custom share slugs, and distribution metadata export.
- **Daily Circuit**: Guided multi-station recovery sessions in three lengths (Quick ~10min / Standard ~20min / Power ~40min) that string together check-in, breath reset, brain games, dexterity drills, hydration, coach moments, community, and reflection. Stations are bridged with voice-cloned (ElevenLabs) Nick quotes whose audio is lazily generated and cached. Per-station feeling buttons (good / hard / too_hard) gently steer subsequent quote categories and intensity. Atomic JSONB writes guard against double-credit on station logging and quote dedupe; streak is computed from a 60-day completed-day window so it remains correct beyond the recent-items page size. Tables: `circuit_sessions`, `nick_quote_audio`. Routes: picker `/recovery/circuit`, player `/recovery/circuit/:slug`. APIs under `/api/circuit/`.

## External Dependencies
- **Replit Auth**: User authentication.
- **Stripe**: Payment processing.
- **Google Gemini AI**: AI content generation and recommendations.
- **OpenAI**: AI writing and analysis.
- **Neon Database**: Serverless PostgreSQL.
- **Radix UI**: Accessible UI primitives.
- **Drizzle ORM / Drizzle Kit**: Database interaction.
- **SERP API**: Keyword research.
- **ElevenLabs API**: Text-to-speech services and voice cloning.
- **Google Places**: Recovery Center Finder integration.
- **Tone.js**: Audio/music processing.
- **Lulu API**: Print-on-demand publishing.
- **Resend**: Email delivery for pre-launch interest signups.