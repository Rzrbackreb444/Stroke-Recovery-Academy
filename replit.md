# KreAIte.xyz

**"CREATE. PUBLISH. EARN."**

**Powered by KremersX**

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform featuring seven professional studios (Book, Video, Music, Course, Image, Doctrine Engine, Website Builder) to empower creators. It enables content production, publishing, and monetization through an integrated marketplace (KreAItorverse) offering an 85/15 revenue split. The platform leverages advanced AI for content generation, editing, and analysis, streamlining the creative workflow from concept to publication, and includes unified media editing, a robust marketplace for templates and finished works, comprehensive publishing tools, and full-featured website hosting with custom subdomains.

## User Preferences

Preferred communication style: Simple, everyday language.
Design mandate: Literary warm palette - cream background (#FAF8F3), antique gold accent (#C9941A)
Icons: lucide-react only (no emoji)

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite, Wouter, TailwindCSS.
- **UI Component System**: Shadcn/ui (built on Radix UI) with a literary warm theme, using Crimson Pro/Playfair Display/Inter fonts.
- **State Management**: TanStack Query for server state, custom hooks for authentication.
- **Key Design Decisions**: Literary warm theme, mobile-first responsive design, accessibility-first approach.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript.
- **Authentication & Session Management**: Replit Auth (OpenID Connect) via Passport.js, PostgreSQL session store, session-based authentication with HTTP-only cookies.
- **API Design**: RESTful patterns, JSON format, CORS.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless driver with pgvector extension.
- **ORM**: Drizzle ORM for type-safe queries and schema management.
- **Schema Design**: Comprehensive for users, projects, assets, sessions, credit systems, and an AI Author Brain for semantic memory using pgvector embeddings and HNSW indexing.
- **Migration Strategy**: Drizzle Kit.

### Global Platform Services
- **Credit System**: Wallet management, deduction logic, API for balance and transactions.
- **Geolocation & Localization**: IP-based location, 50+ countries/currencies, 20-language translation (i18n).
- **Background Job Processing**: EventEmitter-based queue with SSE streaming.
- **Analytics**: Per-studio usage tracking, token consumption, feature usage breakdown.

### UI/UX Decisions
- Consistent literary warm theme with cream backgrounds (#FAF8F3) and antique gold accents (#C9941A) across all studios and components.
- **GlobalHeader Component**: Unified premium navigation with `default`, `minimal`, and `transparent` variants, featuring studios dropdown, mobile-responsive menu, credit display, and user account management.
- Intuitive interfaces for professional tools like the TipTap book editor, MediaStudio (Photoshop-like layers, multi-track timeline), and Cover Designer.
- Emphasis on responsive design and persistent user inputs (e.g., Book Studio auto-sync).

### Feature Specifications
- **The 7 Studios**: Specialized tools and AI integration for Book, Video, Music, Course, Image, Doctrine Engine, and Website Builder.
- **Creator Production Engine**: Content vaults, SERP research, batch production, music sandbox, script studio, life story engine, unified production dashboard.
- **Marketplace (KreAItorverse)**: For selling content with an 85% creator revenue share.
- **Creator Dashboard**: Unified command center with tabs for Overview, Studios, Earnings, Referrals, and Admin (for platform analytics).
- **Affiliate/Referral System**: APIs for unique referral codes, tracking, and commission payouts.
- **AI Integration**: Google Gemini, OpenAI, Lyria for music, specialized models for images/video, AI Consultant.
- **Quick Create**: One-click content generation tools.
- **Doc Hub**: Document import/parsing, merging, snippet vault, manuscript builder.
- **Book Projects**: Autosave, chapter management, full workflow persistence, KDP-ready export.
- **Manuscript Analysis**: AI-powered structure detection, publication readiness scoring.
- **Book Studio Workspace**: Professional publishing workspace with 5 view modes (Canvas, Grid, Focus, Split, KDP), SplitPaneEditor, KDPPreview, DoctrineChecker, CharacterDialogue, ConsistencyMonitor, FrontBackMatter generation, and a CommandPalette.
- **Premium Blog SEO Suite**: Enterprise-grade optimization including meta tag optimization, focus keyphrase tracking, canonical URLs, breadcrumb schema, featured image SEO, internal linking intelligence, external authority links, AEO (Answer Engine Optimization), E-E-A-T signals, geo-targeting, technical SEO, 100-point scoring, auto-optimization, blog sitemap, readability analysis, and various Schema Types.
- **SEO Command Center**: External website optimization tools for website analysis, keyword research, content optimization, competitor analysis, backlink profiling, sitemap generation, robots.txt builder, Local Business Schema, and Hreflang tags.
- **Enhanced Dynamic Sitemaps**: Main, Sitemap Index, Blog, and Marketplace sitemaps with extensive coverage.
- **Lulu Publishing Integration**: Professional Print-on-Demand via OAuth2 API for book templates, trim sizes, binding types, print types, paper types, cover finishes, project creation, cost calculation, print orders, and webhook management.
- **Stroke Recovery Academy**: Extended user profiles for recovery creators, monetization (tips, subscriptions, premium content), recovery stories, journey milestones, support groups, and curated resources.
- **SquatchQR Platform**: Enterprise-grade dynamic QR code system for delivering daily quotes and rituals.
  - **Quote Studio** (`/squatch-qr/studio`): 4-tab dashboard (Projects, Create New, Quote Library, Analytics) with 4-step wizard for AI quote generation.
  - **QR Code Designer**: Customizable QR codes with color presets, logo overlay, PNG/SVG export.
  - **Public Quote Page** (`/q/:projectId`): Landing page for QR scans with streak tracking, voice delivery (ElevenLabs TTS), and social sharing.
  - **Gamification**: Streak tracking with badges (First Scan, Week Warrior, Consistency King, Century Club) and leaderboard.
  - **Analytics Dashboard**: Scan metrics, weekly charts, device breakdown, top projects, peak hours.
  - **White-label Support**: Custom domains, branding removal, custom colors (schema ready).
  - **Design Theme**: Forest green (#1B4332), gold accent (#C9941A), dark base (#0D0D0D).
  - **Real Use Cases**: Squatch Mix (stroke recovery supplement), WashBizHub (laundromat community 75K members).

### Stripe Products & Subscription Tiers
- **KreAIte Tiers**: Free, Creator, Pro, Enterprise.
- **Recovery Academy Tiers**: Free, Survivor, Creator.
- **Credit Packs**: Various credit bundles.
- **Publishing Add-ons**: Basic, Premium, Cover Design, ISBN.

## External Dependencies

1.  **Replit Auth (OpenID Connect)**: User authentication.
2.  **Stripe**: Payment processing, subscriptions.
3.  **Google Gemini AI**: AI content generation.
4.  **OpenAI**: Advanced AI writing and analysis.
5.  **Remove.bg API**: Image background removal.
6.  **Neon Database**: Serverless PostgreSQL.
7.  **Radix UI**: Accessible UI primitives.
8.  **Lucide React / React Icons**: Iconography.
9.  **TipTap**: Rich text editing.
10. **Tone.js**: Audio/music processing.
11. **Drizzle ORM / Drizzle Kit**: Database queries and migrations.
12. **mammoth / pdf-parse**: Document parsing.
13. **SERP API**: Keyword research.
14. **Lulu API**: Print-on-demand publishing.
15. **ElevenLabs API**: Text-to-speech for voice delivery in SquatchQR.