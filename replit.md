# KreAIte.xyz

**"CREATE. PUBLISH. EARN."**

**Powered by KremersX**

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform offering six professional studios for content creation: Book, Video, Music, Course, Image, and Doctrine Engine. Its purpose is to empower creators to produce, publish, and monetize their content across various formats, including a marketplace (KreAItorverse) that offers an 85/15 revenue split for creators. The platform integrates advanced AI for content generation, editing, and analysis, aiming to simplify the creative workflow from concept to publication. Key capabilities include unified media editing, AI-driven content generation, a robust marketplace for templates and finished works, and comprehensive tools for publishing and earning.

## User Preferences

Preferred communication style: Simple, everyday language.
Design mandate: Literary warm palette - cream background (#FAF8F3), antique gold accent (#C9941A)
Icons: lucide-react only (no emoji)

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite for fast HMR, Wouter for routing, TailwindCSS for styling.
- **UI Component System**: Shadcn/ui built on Radix UI, warm cream background (#FAF8F3), antique gold accent (#C9941A), Crimson Pro/Playfair Display/Inter fonts.
- **State Management**: TanStack Query for server state, custom hooks for authentication and shared logic.
- **Key Design Decisions**: Literary warm theme, mobile-first responsive design, accessibility-first approach.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript.
- **Authentication & Session Management**: Replit Auth (OpenID Connect) via Passport.js, PostgreSQL session store, session-based authentication with HTTP-only cookies, token refresh.
- **API Design**: RESTful patterns, consistent error handling, JSON format, CORS configured for Replit.
- **Key Architectural Decisions**: Session storage in DB, webhook routes registered before express.json(), environment-aware configuration.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless driver with pgvector extension.
- **ORM**: Drizzle ORM for type-safe queries and schema management.
- **Schema Design**: Users, roles, media projects, assets, sessions, conversationSessions, assetRegistry, studioPipelines, creditWallets, creditLedger, usageEvents.
- **Author Brain Schema** (`author_brain.*`): Semantic memory system using pgvector for AI context retention across sessions.
  - `project_context`: Links memories to specific projects (book, music, video, course)
  - `author_memory`: Stores characters, lore, research, style with 1536-dim vector embeddings
  - HNSW index for blazing-fast cosine similarity search
- **Migration Strategy**: Drizzle Kit for database migrations.

### Global Platform Services
- **Credit System**: Wallet management, deduction logic, API for balance, transactions, usage.
- **Geolocation & Localization**: IP-based location, 50+ countries/currencies, 20-language translation system (i18n).
- **Background Job Processing**: EventEmitter-based queue, max 5 concurrent jobs, SSE streaming.
- **Analytics**: Per-studio usage tracking, daily token consumption, feature usage breakdown.

### UI/UX Decisions
- Literary warm theme with cream backgrounds and gold accents across all studios and components.
- Intuitive interfaces for professional tools like the TipTap book editor, MediaStudio (Photoshop-like layers for images, multi-track timeline for video), and Cover Designer.
- Emphasis on responsive design to ensure functionality across devices.
- Book Studio uses auto-sync state management with 500ms debouncing for persistent user inputs across step navigation.

### Feature Specifications
- **The 6 Studios**: Book, Video, Music, Course, Image, Doctrine Engine, each with specialized tools and AI integration.
- **Creator Production Engine**: Content vaults, SERP research hub, batch production, music sandbox, script studio, life story engine, and a unified production dashboard.
- **Marketplace (KreAItorverse)**: For selling books, courses, music, videos, and templates with an 85% creator revenue share.
- **Creator Dashboard (/dashboard)**: Unified command center with 5 tabs:
  - *Overview*: Credit Balance, Projects Count, Credits Used, Total Earnings
  - *Studios*: Quick access to all 6 studios plus additional tools
  - *Earnings*: All users track revenue (Total, Pending, Paid Out, Sales, Revenue Split visualization)
  - *Referrals*: Affiliate system with shareable links, stats, reward breakdown (500 credits referrer/250 friend/10% commission)
  - *Admin* (admin only): Platform revenue + Subscription Analytics (Active, New, Churned, By Tier)
- **Affiliate/Referral System**: APIs at `/api/affiliate/*` for unique referral codes, tracking conversions, commission payouts. Schema: referralCodes, referralConversions tables.
- **AI Integration**: Google Gemini and OpenAI for text, Lyria for music, specialized models for images/video, AI Consultant for content monetization.
- **Quick Create**: One-click magic tools for instant content generation.
- **Doc Hub**: Document import/parsing, merging, snippet vault, manuscript builder.
- **Book Projects**: Autosave, chapter management, full workflow persistence.
- **Manuscript Analysis**: AI-powered structure detection, publication readiness scoring.
- **Book Studio API Integration** (fully wired):
  - `generateBookImage()` - AI image generation for book illustrations
  - `uploadImageToServer()` - Backend image upload with persistence
  - `removeImageBackground()` - Remove.bg integration for image processing
  - `qualityPolish()` - Multi-pass editing (developmental, line, copy, proofread)
  - `editChapter()` - Single chapter editing with pass type selection
  - `generateBlurb()` - AI-powered marketing copy generation (short/medium/long)
  - `generateKeywords()` - Amazon-optimized keyword generation
  - `exportBook()` - KDP-ready export (PDF, EPUB, DOCX formats)
- **Book Studio Workspace** (professional publishing workspace at /book-studio):
  - **5 View Modes**: Canvas (floating windows), Grid (card layout), Focus (distraction-free), Split (manuscript+panels), KDP (print preview)
  - **SplitPaneEditor**: Manuscript editing with dockable left panel (chapters/outline) and right panel (research/characters/worldbuilding)
  - **KDPPreview**: Live print preview with 8 trim sizes, margin guides, bleed settings, page navigation, 6 automated guardrail checks
  - **DoctrineChecker**: AI validates manuscript against source of truth doctrine with 8 consistency rule categories
  - **CharacterDialogue**: Deep Dialogue Engine for AI roleplay where characters maintain voice, personality, speech patterns
  - **ConsistencyMonitor**: Recursive tracking across 200k+ words detecting conflicts in character attributes, timeline, locations
  - **FrontBackMatter**: One-click AI generation of dedication, foreword, TOC, acknowledgments, epilogue, etc (11 section types)
  - **CommandPalette**: Quick access to all features via ⌘K shortcut
  - **Multi-language support**: 20+ languages with language selector in toolbar
- **Premium Blog SEO Suite** (enterprise-grade 100/100 optimization):
  - **Meta Tag Optimization**: 70-char meta titles, 160-char descriptions with validation and auto-truncation
  - **Focus Keyphrase Tracking**: Primary keyphrase scoring, presence in title/description/content
  - **Canonical URLs**: Custom canonical support for syndicated/republished content
  - **Breadcrumb Schema**: Short breadcrumb titles, full BreadcrumbList schema.org markup
  - **Featured Image SEO**: Alt text, captions, custom OG/Twitter images, Pinterest pins
  - **Internal Linking Intelligence**: AI-powered suggestions, relevance scoring, automatic related posts
  - **External Authority Links**: Link validation, nofollow control, domain authority tracking
  - **AEO (Answer Engine Optimization)**: FAQ schema, HowTo schema, Speakable schema for voice search
  - **E-E-A-T Signals**: Author credentials, reviewer info, fact-checking, source citations
  - **Geo-Targeting**: Hreflang tags for 7+ languages, LocalBusiness schema, country targeting
  - **Technical SEO**: noindex/nofollow controls, sitemap priority, change frequency
  - **100-Point SEO Scoring**: 7-category audit (meta, content, media, linking, E-E-A-T, technical, geo)
  - **Auto-Optimization**: One-click optimization for missing fields with score recalculation
  - **Blog Sitemap**: Dedicated blog sitemap.xml with priority and frequency settings
  - **Readability Analysis**: Flesch-Kincaid scoring with paragraph length optimization
  - **Cornerstone Content**: Flag important posts for enhanced internal linking
  - **Schema Types**: Article, BlogPosting, NewsArticle, HowTo support

### Lulu Publishing Integration (Professional Print-on-Demand)
- **API Service**: Full OAuth2 client credentials flow with automatic token refresh
- **Book Templates**: 12 professional templates for recovery memoirs, workbooks, photo books, children's books, cookbooks
- **Trim Sizes**: 12 industry-standard sizes from pocket (4.25x6.87") to landscape large (11x8.5")
- **Binding Types**: Perfect bound, case wrap, dust jacket, coil, saddle stitch, linen wrap
- **Print Types**: B&W, standard color, premium color
- **Paper Types**: 60# white/cream, 80# white/coated, 100# coated premium
- **Cover Finishes**: Matte, gloss
- **API Routes** (`/api/lulu/*`):
  - `GET /templates` - All book templates
  - `GET /templates/category/:category` - Templates by category
  - `GET /specifications` - Full print specs (trim sizes, bindings, papers)
  - `POST /projects` - Create publishing project
  - `POST /calculate-cost` - Get printing cost estimate
  - `GET /cover-specs/:podPackageId/:pageCount` - Cover dimensions/bleed
  - `POST /print-jobs` - Create print order
  - `GET /print-jobs/:jobId` - Track order status
  - `POST /webhooks/setup` - Configure Lulu webhooks (admin)
  - `POST /webhooks/lulu` - Webhook endpoint for order updates

### Stroke Recovery Academy (Powered by Stroke Lyfe Inc)
- **Recovery Creator Profiles**: Extended user profiles with stroke type, affected areas, credentials
- **Monetization**: Tips, subscriptions, premium content (85/15 revenue split)
- **Recovery Stories**: Journey narratives with story types (journey, milestone, tip, inspiration)
- **Journey Milestones**: Personal achievement tracking with celebration counts
- **Support Groups**: Community spaces with roles (admin, moderator, member)
- **Resources**: Curated exercises, guides, videos by category and difficulty

### Stripe Products & Subscription Tiers
- **KreAIte Tiers**: Free (100 credits), Creator $29/mo (2,500 credits), Pro $79/mo (10,000 credits), Enterprise $299/mo (unlimited)
- **Recovery Academy Tiers**: Free, Survivor $14.99/mo, Creator $29.99/mo
- **Credit Packs**: 500/$9.99, 2,000/$29.99, 5,000/$59.99, 20,000/$199.99
- **Publishing Add-ons**: Basic $99, Premium $299, Cover Design $49, ISBN $25
- **Seed Script**: `server/seedStripeProducts.ts` - Run to create Stripe products

## External Dependencies

1.  **Replit Auth (OpenID Connect)**: User authentication and identity.
2.  **Stripe**: Payment processing, subscriptions, customer portal.
3.  **Google Gemini AI (via Replit AI Integrations)**: AI-powered content generation and analysis.
4.  **OpenAI (via Replit AI Integrations)**: Advanced AI writing and analysis.
5.  **Remove.bg API**: Background removal for images.
6.  **Neon Database**: Serverless PostgreSQL.
7.  **Radix UI**: Accessible UI primitives.
8.  **Lucide React / React Icons**: Iconography.
9.  **date-fns**: Date formatting.
10. **TipTap**: Rich text editing.
11. **Tone.js**: Audio/music processing.
12. **@neondatabase/serverless**: PostgreSQL driver.
13. **Drizzle ORM / Drizzle Kit**: Type-safe database queries and migrations.
14. **mammoth / pdf-parse**: Document parsing.
15. **SERP API**: Trending topics, keyword research (integrated into SERP Research Hub).
16. **Lulu API**: Professional print-on-demand book publishing (OAuth2, webhooks).