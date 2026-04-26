// shared/seo/routeRegistry.ts
//
// SINGLE SOURCE OF TRUTH for every route's SEO/AEO metadata.
//
// Add a route to App.tsx? Add it here. The system then auto-derives:
//   - <head> meta tags (title, description, robots, OG, Twitter, canonical)
//   - JSON-LD structured data with EEAT signals (Org + Person + Page schema)
//   - Sitemap entries (only if `canonical` is set; dynamic routes feed the
//     sitemap from the database in server/routes.ts)
//   - Indexability decisions (noindex flag drives robots meta + sitemap exclusion)
//
// Title rule: ≤60 chars (Google truncates ~60).
// Description rule: 140-160 chars (Google truncates ~155).
// Brand placement: ranking-keyword first, brand at end.
//
// Categories drive default schema type and EEAT defaults so individual entries
// stay short. Override per-entry only when warranted.

export type RouteCategory =
  | "home"
  | "marketplace"
  | "pricing"
  | "publishing"
  | "about"
  | "legal"
  | "community"
  | "content"
  | "recovery-landing"
  | "recovery-content"
  | "recovery-app"
  | "studio"
  | "app"
  | "admin"
  | "auth"
  | "checkout"
  | "games"
  | "misc";

export type RouteIntent =
  | "informational"
  | "transactional"
  | "navigational"
  | "private";

export type SchemaType =
  | "WebPage"
  | "Article"
  | "MedicalWebPage"
  | "AboutPage"
  | "CollectionPage"
  | "FAQPage"
  | "Product"
  | "Course"
  | "Service"
  | "ContactPage";

export interface RouteEntry {
  /** Regex pattern matched against pathname (no query/hash). */
  pattern: RegExp;
  /** Canonical example path used by sitemap auto-include. Omit for dynamic
   *  routes whose URLs come from the database (those feed the sitemap separately). */
  canonical?: string;
  /** Categorization — drives EEAT defaults and AEO formatting. */
  category: RouteCategory;
  /** Search intent. */
  intent: RouteIntent;
  /** schema.org @type for the page-level JSON-LD block. */
  schemaType: SchemaType;
  /** ≤60 char title. */
  title: string;
  /** 140-160 char description. */
  description: string;
  /** Optional keyword hints (for internal/content tooling, not output to <head>). */
  keywords?: string[];
  /** EEAT author attribution. `nick` for survivor-led content, `platform` for product pages. */
  author?: "nick" | "platform";
  /** True → emit `<meta name="robots" content="noindex,nofollow">` and exclude from sitemap. */
  noindex?: boolean;
  /** Sitemap changefreq (only used if `canonical` is set). */
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  /** Sitemap priority 0.0–1.0 (only used if `canonical` is set). */
  priority?: number;
  /** True if a server-side renderer (programmaticRoutes / blogRoutes / landingRoutes /
   *  centerFinderRoutes) emits its own bespoke <head> + JSON-LD. The head injector
   *  short-circuits before reaching these. */
  ssrHandled?: boolean;
}

const SITE = "Stroke Recovery Academy";
const BRAND = "KreAIte.xyz";

/** Strict allowlist of canonical hosts. Any other Host header collapses to this. */
export const CANONICAL_DEFAULT = "https://strokerecoveryacademy.com";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
//
// Order matters: more specific patterns must come before more general ones.
// First match wins.
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTES: RouteEntry[] = [
  // ─── KreAIte main domain ──────────────────────────────────────────────────
  {
    pattern: /^\/$/,
    canonical: "/",
    category: "home",
    intent: "informational",
    schemaType: "WebPage",
    title: "KreAIte.xyz: Create. Publish. Earn. AI Studios for Creators",
    description:
      "Seven AI-powered studios for books, video, music, courses, images, and websites. Sell on the KreAItorverse marketplace with an 85/15 revenue split.",
    keywords: ["AI creator platform", "AI book writer", "AI music studio", "AI course builder", "creator marketplace"],
    author: "platform",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    pattern: /^\/marketplace\/?$/,
    canonical: "/marketplace",
    category: "marketplace",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: "KreAItorverse Marketplace: Buy & Sell Creator Content",
    description:
      "Books, courses, music, and digital products from independent creators. 85% revenue goes to the creator. Discover survivor-led, AI-built work.",
    keywords: ["creator marketplace", "indie books", "indie courses", "85/15 revenue split"],
    author: "platform",
    changefreq: "daily",
    priority: 0.9,
  },
  {
    pattern: /^\/marketplace\/books\/?$/,
    canonical: "/marketplace/books",
    category: "marketplace",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: "Indie Books from Survivor Authors | KreAItorverse",
    description:
      "Books written by independent authors and stroke survivors. KDP-ready. Print-on-demand via Lulu. Real lived experience, not algorithmic filler.",
    keywords: ["indie books", "survivor authors", "stroke recovery books", "print on demand"],
    author: "platform",
    changefreq: "daily",
    priority: 0.8,
  },
  {
    pattern: /^\/listing\/[^/]+\/?$/,
    category: "marketplace",
    intent: "transactional",
    schemaType: "Product",
    title: "Listing | KreAItorverse Marketplace",
    description:
      "Listing detail on the KreAItorverse creator marketplace. Buy directly from independent creators. 85% revenue goes to the creator.",
    author: "platform",
    // Sitemap is fed from DB in server/routes.ts; no canonical here
  },
  {
    pattern: /^\/courses\/?$/,
    canonical: "/courses",
    category: "content",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: "Browse Courses | Indie Creator Courses on KreAIte",
    description:
      "Browse independent creator courses on KreAIte — recovery, craft, business, AI, and more. Self-paced, survivor-friendly, with course refund window.",
    keywords: ["indie courses", "creator courses", "online courses", "survivor courses"],
    author: "platform",
    changefreq: "daily",
    priority: 0.8,
  },
  {
    pattern: /^\/books\/?$/,
    canonical: "/books",
    category: "content",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: "Browse Books | Indie Books from KreAIte Creators",
    description:
      "Discover books written by independent creators on KreAIte. Survivor memoirs, recovery guides, fiction, and craft — all royalty-shared 85/15.",
    keywords: ["indie books", "self published books", "creator books"],
    author: "platform",
    changefreq: "daily",
    priority: 0.8,
  },
  {
    pattern: /^\/course\/[^/]+\/?$/,
    category: "content",
    intent: "transactional",
    schemaType: "Course",
    title: "Course | KreAIte",
    description:
      "Course detail on KreAIte. Self-paced lessons, instructor-led discussion, and a course refund window. Direct revenue share with the creator.",
    author: "platform",
  },
  {
    pattern: /^\/pricing\/?$/,
    canonical: "/pricing",
    category: "pricing",
    intent: "transactional",
    schemaType: "WebPage",
    title: "KreAIte Pricing: Free, Pro, and Studio Plans",
    description:
      "Start free. Upgrade when you publish. Transparent pricing for creators using AI studios for books, music, video, courses, and websites.",
    keywords: ["KreAIte pricing", "AI creator pricing", "indie creator plans"],
    author: "platform",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    pattern: /^\/publishing\/?$/,
    canonical: "/publishing",
    category: "publishing",
    intent: "transactional",
    schemaType: "Service",
    title: "KreAIte Publishing: KDP-Ready Books & Lulu Print-on-Demand",
    description:
      "Publish your book directly to Amazon KDP and Lulu Print-on-Demand from inside KreAIte. Royalty tracking, OAuth-secured, no formatting headaches.",
    keywords: ["KDP publishing", "Lulu print on demand", "self publishing platform"],
    author: "platform",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/squatch-qr\/?$/,
    canonical: "/squatch-qr",
    category: "marketplace",
    intent: "transactional",
    schemaType: "Service",
    title: "SquatchQR: Dynamic QR Codes with Quote Studio & Analytics",
    description:
      "Enterprise dynamic QR codes that route to live quote pages. Designer, scan analytics, A/B variants. Free tier available.",
    keywords: ["dynamic QR codes", "quote QR", "QR analytics", "branded QR codes"],
    author: "platform",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/q\/[^/]+\/?$/,
    category: "content",
    intent: "informational",
    schemaType: "WebPage",
    title: "Live Quote | SquatchQR",
    description:
      "A live quote page served by SquatchQR. Dynamic destinations, scan analytics, and on-demand redirect — without re-printing the QR code.",
    author: "platform",
  },
  {
    pattern: /^\/(about|about-us)\/?$/,
    canonical: "/about",
    category: "about",
    intent: "informational",
    schemaType: "AboutPage",
    title: "About KreAIte.xyz: The Creator Operating System",
    description:
      "KreAIte.xyz is the operating system for independent creators. Built by Nick Kremers — 7-year stroke survivor, author, and founder.",
    keywords: ["about KreAIte", "Nick Kremers founder", "creator OS"],
    author: "platform",
    changefreq: "monthly",
    priority: 0.6,
  },

  // ─── Community / Social ───────────────────────────────────────────────────
  {
    pattern: /^\/community\/?$/,
    canonical: "/community",
    category: "community",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "KreAIte Community: Discussion, Threads & Creator Groups",
    description:
      "Discuss craft, share works in progress, find collaborators. Survivor and creator threads, moderated, ad-free.",
    keywords: ["creator community", "indie author community", "stroke survivor community"],
    author: "platform",
    changefreq: "daily",
    priority: 0.7,
  },
  {
    pattern: /^\/community\/thread\/[^/]+\/?$/,
    category: "community",
    intent: "informational",
    schemaType: "Article",
    title: "Discussion Thread | KreAIte Community",
    description:
      "Discussion thread on the KreAIte creator community. Survivor-friendly, moderated, ad-free.",
  },
  {
    pattern: /^\/groups\/?$/,
    canonical: "/groups",
    category: "community",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "KreAIte Groups: Find Your Creator Community",
    description:
      "Join groups for indie authors, course creators, musicians, stroke survivors, caregivers, and more. Share work, get feedback, build together.",
    keywords: ["creator groups", "writer groups", "stroke survivor groups"],
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    pattern: /^\/groups\/[^/]+\/?$/,
    category: "community",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Group | KreAIte Community",
    description:
      "Join this group on KreAIte. Discussion threads, shared resources, member feed.",
  },
  {
    pattern: /^\/stories\/?$/,
    canonical: "/stories",
    category: "community",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stories on KreAIte: Read & Share Survivor & Creator Stories",
    description:
      "Real stories from stroke survivors, caregivers, and creators. Read, react, and share your own. No paywall.",
    keywords: ["survivor stories", "stroke recovery stories", "creator stories"],
    changefreq: "daily",
    priority: 0.7,
  },
  {
    pattern: /^\/stories\/(?!new$|my$|edit\/)[^/]+\/?$/,
    category: "community",
    intent: "informational",
    schemaType: "Article",
    title: "Survivor Story | KreAIte",
    description:
      "A survivor story shared on KreAIte. Real lived experience from stroke survivors, caregivers, and creators.",
    author: "platform",
  },
  {
    pattern: /^\/survivor\/[^/]+\/?$/,
    category: "community",
    intent: "informational",
    schemaType: "AboutPage",
    title: "Survivor Profile | Stroke Recovery Academy",
    description:
      "Survivor profile on Stroke Recovery Academy. Recovery journey, milestones, and community contributions.",
  },
  {
    pattern: /^\/author\/[^/]+\/?$/,
    category: "community",
    intent: "informational",
    schemaType: "AboutPage",
    title: "Author Profile | KreAIte",
    description:
      "Author profile on KreAIte. Books, courses, and published work from this independent creator.",
  },

  // ─── Legal ────────────────────────────────────────────────────────────────
  {
    pattern: /^\/terms\/?$/,
    canonical: "/terms",
    category: "legal",
    intent: "informational",
    schemaType: "WebPage",
    title: `Terms of Service | ${BRAND}`,
    description:
      "Terms of Service for KreAIte.xyz, KreAItorverse Marketplace, and Stroke Recovery Academy. Plain-language, creator-friendly.",
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    pattern: /^\/privacy\/?$/,
    canonical: "/privacy",
    category: "legal",
    intent: "informational",
    schemaType: "WebPage",
    title: `Privacy Policy | ${BRAND}`,
    description:
      "How KreAIte.xyz collects, uses, and protects your data. Plain-language, GDPR/CCPA-aligned, no dark patterns.",
    changefreq: "yearly",
    priority: 0.3,
  },

  // ─── Stroke Recovery Academy — public landings ────────────────────────────
  {
    pattern: /^\/recovery\/?$/,
    canonical: "/recovery",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: `${SITE}: Daily Routines, AI Coach, Survivor Community`,
    description:
      "The operating system for stroke survivors. Daily routines, neuroplasticity exercises, AI coach, 66-day challenge, survivor community — by Nick Kremers.",
    keywords: ["stroke recovery", "stroke survivor support", "stroke recovery program", "Nick Kremers", "Sasquatch Method"],
    author: "nick",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    pattern: /^\/recovery\/academy\/?$/,
    canonical: "/recovery/academy",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Recovery Academy: Free Stroke Survivor Education Hub",
    description:
      "Free survivor-led courses on neuroplasticity, daily routines, communication, mobility, and the 66-day Sasquatch transformation.",
    keywords: ["stroke recovery academy", "stroke survivor education", "neuroplasticity courses"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    pattern: /^\/recovery\/(sasquatch-coach|coach)\/?$/,
    canonical: "/recovery/sasquatch-coach",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Sasquatch Coach: Free 24/7 AI Stroke Recovery Companion",
    description:
      "Free AI recovery coach trained on Nick Kremers' 7-year survivor playbook. Ask anything about stroke recovery, exercises, motivation. 24/7. No login.",
    keywords: ["AI stroke coach", "stroke recovery chatbot", "free stroke support", "Sasquatch Coach"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.95,
  },
  {
    pattern: /^\/recovery\/sasch\/?$/,
    canonical: "/recovery/sasch",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Sasquatch Method: From 0% to 90% Stroke Recovery",
    description:
      "The repetition-based neuroplasticity protocol Nick Kremers used to go from total paralysis to 90% recovery. Free overview, no email required.",
    keywords: ["Sasquatch Method", "stroke recovery method", "neuroplasticity protocol"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/builder\/?$/,
    canonical: "/recovery/builder",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "WebPage",
    title: "Build Your Stroke Recovery Routine in 3 Minutes",
    description:
      "Free routine builder that picks daily exercises by your stroke side, mobility level, and recovery week. Print or save to your dashboard.",
    keywords: ["stroke recovery routine", "daily stroke exercises", "personalized stroke plan"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/about-nick\/?$/,
    canonical: "/recovery/about-nick",
    category: "about",
    intent: "informational",
    schemaType: "AboutPage",
    title: "Nick Kremers: Stroke Survivor & Sasquatch Method Founder",
    description:
      "Nick Kremers had a hemorrhagic stroke at 35. Seven years later he's at 90% recovery. This is the playbook he wishes he'd had on day one.",
    keywords: ["Nick Kremers", "stroke survivor founder", "Sasquatch Method origin"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/blog\/?$/,
    canonical: "/recovery/blog",
    category: "recovery-content",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stroke Recovery Blog: Survivor-Led Articles & Guides",
    description:
      "Long-form articles on neuroplasticity, hemiparesis, aphasia, caregiver life, and recovery milestones — written from lived experience.",
    keywords: ["stroke recovery blog", "stroke survivor blog", "neuroplasticity articles"],
    author: "nick",
    changefreq: "daily",
    priority: 0.95,
  },
  {
    pattern: /^\/recovery\/blog\/[^/]+\/?$/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "Article",
    title: "Recovery Blog Post | Stroke Recovery Academy",
    description:
      "Long-form survivor-led recovery article from Stroke Recovery Academy.",
    author: "nick",
    ssrHandled: true,
  },
  {
    pattern: /^\/recovery\/exercises\/?$/,
    canonical: "/recovery/exercises",
    category: "recovery-content",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stroke Recovery Exercises Library | Nick Kremers",
    description:
      "Free library of stroke recovery exercises by category — upper body, lower body, hand, core, balance, speech, cognitive — with sets, reps, and progression.",
    keywords: ["stroke recovery exercises", "stroke rehab exercises", "post-stroke workouts"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.95,
  },
  {
    pattern: /^\/recovery\/exercises\/[^/]+\/?$/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "Article",
    title: "Stroke Recovery Exercise | Stroke Recovery Academy",
    description:
      "Stroke recovery exercise with sets, reps, safety guidance, and progression — from Stroke Recovery Academy.",
    author: "nick",
    ssrHandled: true,
  },
  {
    pattern: /^\/recovery\/center-finder\/?$/,
    canonical: "/recovery/center-finder",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "WebPage",
    title: "Find a Stroke Recovery Center Near You — Free Directory",
    description:
      "Free directory of stroke rehab centers, neurologists, and outpatient PT/OT/SLP. Search by ZIP. Refreshed every 30 days from Google Places.",
    keywords: ["stroke recovery center near me", "stroke rehab center", "stroke neurologist directory"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/protocols\/?$/,
    canonical: "/recovery/protocols",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Stroke Recovery Protocols: Daily, Weekly, 66-Day Plans",
    description:
      "Structured daily, weekly, and 66-day recovery protocols — built around repetition and neuroplasticity. Free to view and adapt.",
    keywords: ["stroke recovery protocol", "66-day stroke challenge", "daily stroke routine"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    pattern: /^\/recovery\/university\/?$/,
    canonical: "/recovery/university",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stroke Recovery University: Free Survivor Courses",
    description:
      "Free, structured courses on stroke recovery — neuroplasticity, hemiparesis, aphasia, caregiving, and the Sasquatch Method. Survivor-led.",
    keywords: ["stroke recovery university", "free stroke recovery courses", "stroke survivor education"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    pattern: /^\/recovery\/survival-grid\/?$/,
    canonical: "/recovery/survival-grid",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "WebPage",
    title: "Survival Grid: Daily Stroke Recovery Tracker",
    description:
      "Track your daily wins across mobility, speech, cognition, mood, and routine. Built for stroke survivors who want progress they can see.",
    keywords: ["stroke recovery tracker", "stroke daily progress", "survival grid"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/forge\/?$/,
    canonical: "/recovery/forge",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Forge Your Beast: Stroke Recovery Strength Protocol",
    description:
      "The Forge Your Beast strength + neuroplasticity protocol for stroke survivors who want to come back stronger. Free overview.",
    keywords: ["forge your beast", "stroke strength training", "stroke recovery protocol"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/today\/?$/,
    canonical: "/recovery/today",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "The Bonfire: Today's Adaptive Stroke Recovery Session",
    description:
      "Your daily Bonfire — a 5-minute recovery session that adapts to how you feel today. Cognition, mobility, speech, breath. Free.",
    keywords: ["daily stroke recovery", "5 minute recovery", "Bonfire", "adaptive stroke"],
    author: "nick",
    changefreq: "daily",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/circles\/?$/,
    canonical: "/recovery/circles",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "Service",
    title: "Live Circles: Group Stroke Recovery Coaching",
    description:
      "Live Circles — small-group, instructor-led recovery coaching for stroke survivors. Weekly sessions, accountability, peer support.",
    keywords: ["group stroke recovery", "stroke coaching", "live circles", "stroke support group"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/community\/?$/,
    canonical: "/recovery/community",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stroke Survivor Community: Forums, Threads & Support",
    description:
      "The Stroke Recovery Academy survivor community. Threads on hemiparesis, aphasia, caregiving, milestones, and 66-day challenge progress.",
    keywords: ["stroke survivor community", "stroke recovery forum", "hemiparesis community"],
    author: "nick",
    changefreq: "daily",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/buddy\/?$/,
    canonical: "/recovery/buddy",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "Service",
    title: "Accountability Buddy: Daily Stroke Recovery Pairing",
    description:
      "Get paired with another stroke survivor for daily check-ins. Same time zone, similar recovery week, mutual accountability. Free.",
    keywords: ["stroke recovery buddy", "stroke accountability partner", "stroke peer support"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/anthem\/?$/,
    canonical: "/recovery/anthem",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "Service",
    title: "Anthem Maker: AI-Generated Stroke Recovery Affirmations",
    description:
      "Generate a personalized recovery anthem — AI-narrated affirmations set to music, built around your name and recovery goals. Free.",
    keywords: ["recovery affirmations", "stroke motivation", "AI affirmations", "anthem maker"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/motivation\/?$/,
    canonical: "/recovery/motivation",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "WebPage",
    title: "Motivation Studio: Anthem, Vision Card & Daily Quote",
    description:
      "Free motivation tools for stroke survivors — AI-narrated anthem, vision card visualization, and daily survivor quote. Built by Nick Kremers.",
    keywords: ["stroke motivation", "recovery motivation", "vision card", "daily quote"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/scholarship\/?$/,
    canonical: "/recovery/scholarship",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "Service",
    title: "Survivor Scholarship: Free Stroke Recovery Academy Access",
    description:
      "Survivor Scholarship — free Pro access for stroke survivors who can't afford it. Apply in under 5 minutes. No financial documentation required.",
    keywords: ["stroke scholarship", "free stroke recovery", "survivor financial aid"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/challenge\/?$/,
    canonical: "/recovery/challenge",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "66-Day Sasquatch Stroke Recovery Transformation Challenge",
    description:
      "Free 66-day stroke recovery challenge built on neuroplasticity research. Daily routine, weekly milestones, survivor community check-ins.",
    keywords: ["66 day challenge", "stroke transformation", "stroke recovery challenge", "Sasquatch challenge"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.95,
  },
  {
    pattern: /^\/recovery\/(store|shop)\/?$/,
    canonical: "/recovery/store",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: "Survivor Shop: Curated Stroke Recovery Products",
    description:
      "Curated Amazon storefront for stroke survivors — therapy tools, mobility aids, cognitive games, and adaptive gear Nick personally uses.",
    keywords: ["stroke recovery products", "stroke therapy tools", "survivor shop", "adaptive equipment"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/strokelyfe-org\/?$/,
    canonical: "/recovery/strokelyfe-org",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "AboutPage",
    title: "StrokeLyfe.org: Survivor-Led 501(c)(3) Recovery Nonprofit",
    description:
      "StrokeLyfe.org — the survivor-led 501(c)(3) nonprofit funding scholarships, equipment grants, and community programs for stroke survivors.",
    keywords: ["stroke nonprofit", "stroke 501c3", "StrokeLyfe", "survivor charity"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/wearables\/?$/,
    canonical: "/recovery/wearables",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "WebPage",
    title: "Stroke Recovery Wearables: Reviews & Survivor-Tested Picks",
    description:
      "Survivor-tested reviews of recovery wearables — FES units, smart gloves, gait trainers, fitness trackers. What works in real recovery.",
    keywords: ["stroke wearables", "FES units", "smart glove", "stroke fitness tracker"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/brain-gym\/?$/,
    canonical: "/recovery/brain-gym",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Brain Gym: Stroke Cognitive Recovery Exercises",
    description:
      "Brain Gym — daily cognitive recovery exercises for stroke survivors. Memory, attention, executive function. Free, survivor-led, science-backed.",
    keywords: ["stroke brain gym", "cognitive rehab", "stroke memory exercises", "post-stroke cognition"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/compass\/?$/,
    canonical: "/recovery/compass",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "WebPage",
    title: "Recovery Compass: Find Your Next Stroke Recovery Step",
    description:
      "Recovery Compass — answer 5 questions and get a personalized next step in your stroke recovery. Free, no email required.",
    keywords: ["stroke recovery quiz", "stroke recovery compass", "next step recovery"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/resources\/?$/,
    canonical: "/recovery/resources",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Stroke Recovery Resources: Books, Tools, Programs",
    description:
      "Curated stroke recovery resources — books, programs, tools, support groups, financial aid, and assistive tech. Survivor-vetted.",
    keywords: ["stroke recovery resources", "stroke survivor resources", "stroke programs"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/social\/?$/,
    canonical: "/recovery/social",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Survivor Social: Stroke Recovery on Every Platform",
    description:
      "Follow Stroke Recovery Academy across YouTube, Instagram, TikTok, podcasts, and email. Free survivor-led recovery content, daily.",
    keywords: ["stroke recovery YouTube", "stroke survivor TikTok", "stroke podcast"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.65,
  },
  {
    pattern: /^\/recovery\/survivor-income\/?$/,
    canonical: "/recovery/survivor-income",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "Service",
    title: "Survivor Income: Stroke Recovery & Earning a Living",
    description:
      "Practical guide to earning income after stroke — disability, remote work, creator income, and the KreAItorverse 85/15 marketplace.",
    keywords: ["stroke disability", "income after stroke", "stroke survivor income", "work after stroke"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/therapist-marketplace\/?$/,
    canonical: "/recovery/therapist-marketplace",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "Service",
    title: "Find a Stroke Therapist: PT, OT & SLP Marketplace",
    description:
      "Marketplace for licensed stroke therapists — PT, OT, SLP. Filter by specialty, insurance, telehealth. Direct booking, no middleman.",
    keywords: ["stroke therapist", "stroke PT", "stroke OT", "stroke SLP", "stroke therapy marketplace"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.85,
  },
  {
    pattern: /^\/recovery\/therapist\/?$/,
    canonical: "/recovery/therapist",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "Service",
    title: "Stroke Recovery Therapist Directory & Onboarding",
    description:
      "Are you a stroke recovery therapist? List your practice on Stroke Recovery Academy. Free directory, paid premium tier, survivor-vetted.",
    keywords: ["stroke therapist directory", "stroke therapist signup", "PT directory"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.65,
  },
  {
    pattern: /^\/recovery\/legend\/?$/,
    canonical: "/recovery/legend",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "AboutPage",
    title: "Survivor Legends: Stroke Recovery Hall of Fame",
    description:
      "Survivor Legends — stories of stroke survivors who turned recovery into transformation. Read their journeys, celebrate their wins.",
    keywords: ["survivor legends", "stroke recovery stories", "stroke hall of fame"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/never-zero\/?$/,
    canonical: "/recovery/never-zero",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "MedicalWebPage",
    title: "Never Zero: The Stroke Recovery Streak System",
    description:
      "Never Zero — the streak system that keeps stroke survivors moving every single day. One minute counts. The streak matters more than the minutes.",
    keywords: ["never zero", "stroke streak", "daily stroke recovery", "stroke habit"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    pattern: /^\/recovery\/gift\/?$/,
    canonical: "/recovery/gift",
    category: "recovery-landing",
    intent: "transactional",
    schemaType: "Product",
    title: "Gift a Survivor: Stroke Recovery Academy Pro Access",
    description:
      "Gift a stroke survivor a year of Pro access to Stroke Recovery Academy. Routines, courses, AI coach, community. From $99/year.",
    keywords: ["gift stroke survivor", "stroke recovery gift", "survivor gift card"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/spotlight\/?$/,
    canonical: "/recovery/spotlight",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "CollectionPage",
    title: "Survivor Spotlight: Featured Stroke Recovery Stories",
    description:
      "Survivor Spotlight — weekly featured stroke recovery stories. Real survivors, real timelines, real comebacks. No filters.",
    keywords: ["survivor spotlight", "stroke recovery stories", "featured survivor"],
    author: "nick",
    changefreq: "weekly",
    priority: 0.75,
  },
  {
    pattern: /^\/recovery\/spotlight\/[^/]+\/?$/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "Article",
    title: "Survivor Spotlight | Stroke Recovery Academy",
    description:
      "Featured survivor spotlight on Stroke Recovery Academy.",
    author: "nick",
  },
  {
    pattern: /^\/recovery\/pricing\/?$/,
    canonical: "/recovery/pricing",
    category: "pricing",
    intent: "transactional",
    schemaType: "WebPage",
    title: "Stroke Recovery Academy Pricing: Free, Pro, Founder",
    description:
      "Free forever for survivors. Pro adds advanced routines, courses, and 1:1 coach time. Founder unlocks lifetime access. Survivor-friendly pricing.",
    keywords: ["stroke recovery pricing", "stroke academy pricing", "free stroke recovery"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.95,
  },
  {
    pattern: /^\/strokelyfe\/?$/,
    canonical: "/strokelyfe",
    category: "recovery-landing",
    intent: "informational",
    schemaType: "AboutPage",
    title: "StrokeLyfe: Survivor-Led Recovery Lifestyle",
    description:
      "StrokeLyfe — the survivor-led recovery lifestyle from Nick Kremers. Daily routines, mindset, community, and the Sasquatch Method.",
    keywords: ["StrokeLyfe", "stroke lifestyle", "survivor lifestyle", "Nick Kremers"],
    author: "nick",
    changefreq: "monthly",
    priority: 0.7,
  },

  // ─── Affiliate (public landing) ───────────────────────────────────────────
  {
    pattern: /^\/affiliate\/?$/,
    canonical: "/affiliate",
    category: "marketplace",
    intent: "transactional",
    schemaType: "WebPage",
    title: "KreAIte Affiliate Program: Refer & Earn Recurring",
    description:
      "Refer creators to KreAIte and earn recurring commission. Survivor-friendly tier, transparent attribution, monthly payouts.",
    keywords: ["KreAIte affiliate", "creator affiliate program", "referral program"],
    author: "platform",
    changefreq: "monthly",
    priority: 0.6,
  },

  // ─── Recovery — private user surfaces (NOINDEX) ───────────────────────────
  {
    pattern: /^\/recovery\/(dashboard|journal|medical-log|flicker-log|achievements|reminders|me|messages|onboarding|login|activity|command-center|video|admin)/,
    category: "recovery-app",
    intent: "private",
    schemaType: "WebPage",
    title: `Recovery Dashboard | ${SITE}`,
    description: "Private survivor surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/recovery\/university\/lesson(\/|$)/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "Article",
    author: "nick",
    title: `Lesson — Stroke Recovery University | ${SITE}`,
    description:
      "Free survivor-led stroke recovery lesson. Neuroplasticity, daily routines, communication, mobility — taught by Nick Kremers.",
    keywords: ["stroke recovery lesson", "neuroplasticity", "free stroke education"],
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/recovery\/university\/quiz(\/|$)/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "WebPage",
    author: "nick",
    title: `Quiz — Stroke Recovery University | ${SITE}`,
    description:
      "Reinforce stroke recovery knowledge with a free quiz. Test what you learned in Recovery University, taught by Nick Kremers.",
    keywords: ["stroke recovery quiz", "neuroplasticity quiz"],
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    pattern: /^\/recovery\/university\/certificate(\/|$)/,
    category: "recovery-content",
    intent: "informational",
    schemaType: "WebPage",
    title: `Certificate — Stroke Recovery University | ${SITE}`,
    description:
      "Earn a free completion certificate from Stroke Recovery University. Survivor-led education from Nick Kremers.",
    keywords: ["stroke recovery certificate", "free recovery course"],
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    pattern: /^\/recovery\/course-builder/,
    category: "studio",
    intent: "private",
    schemaType: "WebPage",
    title: `Course Builder | ${SITE}`,
    description: "Private creator surface — not for indexing.",
    noindex: true,
  },

  // ─── KreAIte — private app surfaces (NOINDEX) ─────────────────────────────
  {
    pattern: /^\/dashboard/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Dashboard | ${BRAND}`,
    description: "Private app surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/admin/,
    category: "admin",
    intent: "private",
    schemaType: "WebPage",
    title: `Admin | ${BRAND}`,
    description: "Admin surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/auth(\/|$)/,
    category: "auth",
    intent: "private",
    schemaType: "WebPage",
    title: `Sign In | ${BRAND}`,
    description: "Authentication flow — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/magic-link/,
    category: "auth",
    intent: "private",
    schemaType: "WebPage",
    title: `Magic Link | ${BRAND}`,
    description: "Authentication flow — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/checkout/,
    category: "checkout",
    intent: "private",
    schemaType: "WebPage",
    title: `Checkout | ${BRAND}`,
    description: "Checkout flow — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/marketplace\/(order|my-orders|purchase-success)/,
    category: "checkout",
    intent: "private",
    schemaType: "WebPage",
    title: `Order | ${BRAND}`,
    description: "Order flow — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/(sell-books|author-dashboard|author-profile)/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Author Dashboard | ${BRAND}`,
    description: "Private creator surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/creator(\/|-)/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Creator | ${BRAND}`,
    description: "Private creator surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/(production-dashboard|analytics)/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Analytics | ${BRAND}`,
    description: "Private analytics surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/settings/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Settings | ${BRAND}`,
    description: "Account settings — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/instructor\//,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Instructor | ${BRAND}`,
    description: "Private instructor surface — not for indexing.",
    noindex: true,
  },
  // /therapists/apply — public recruitment page (high SEO value)
  {
    pattern: /^\/therapists\/apply\/?$/,
    canonical: "/therapists/apply",
    category: "misc",
    intent: "transactional",
    schemaType: "Service",
    title: `Apply to join — Therapist Marketplace | ${SITE}`,
    description:
      "Join the Stroke Recovery Academy therapist marketplace. PT, OT, SLP, neuro specialists welcome. Direct booking, no middleman, fair payouts.",
    keywords: ["therapist marketplace", "join therapist platform", "stroke recovery PT OT SLP"],
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    pattern: /^\/(my-book|my-learning|power-points|white-label)/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `My Account | ${BRAND}`,
    description: "Private account surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/stories\/(new|my|edit)/,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `My Stories | ${BRAND}`,
    description: "Private author surface — not for indexing.",
    noindex: true,
  },
  // Course-internal private (quiz, certificate)
  {
    pattern: /^\/course\/[^/]+\/quiz\//,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Course Quiz | ${BRAND}`,
    description: "Private learner surface — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/certificate\//,
    category: "app",
    intent: "private",
    schemaType: "WebPage",
    title: `Certificate | ${BRAND}`,
    description: "Private learner surface — not for indexing.",
    noindex: true,
  },

  // ─── Public catalog surfaces (extracted from the studios bucket) ──────────
  {
    pattern: /^\/voice-library\/?$/,
    canonical: "/voice-library",
    category: "misc",
    intent: "navigational",
    schemaType: "CollectionPage",
    title: `Voice Library — AI narration voices | ${BRAND}`,
    description:
      "Browse the KreAIte voice library — premium AI narration voices for audiobooks, podcasts, courses, and video. Try samples free.",
    keywords: ["AI voice library", "AI narration voices", "audiobook voices", "ElevenLabs alternative"],
    changefreq: "weekly",
    priority: 0.7,
  },
  {
    pattern: /^\/templates\/?$/,
    canonical: "/templates",
    category: "misc",
    intent: "navigational",
    schemaType: "CollectionPage",
    title: `Templates — Books, courses, sites, music | ${BRAND}`,
    description:
      "Free starter templates for KreAIte studios. Books, courses, websites, music projects — launch in minutes with proven structures.",
    keywords: ["creator templates", "book templates", "course templates", "website templates"],
    changefreq: "weekly",
    priority: 0.7,
  },
  // ─── Studios (creator app — NOINDEX) ──────────────────────────────────────
  {
    pattern: /^\/(book-studio|book-perfection-suite|music-studio|music-sandbox|video-studio|course-studio|image-studio|website-studio|podcast-studio|avatar-studio|movie-studio|audiobook-factory|dj-studio|music-production|script-studio|life-story|quick-create|ai-consultant|media-studio|doc-hub|moderation|seo-command-center|workflows)(\/|$)/,
    category: "studio",
    intent: "private",
    schemaType: "WebPage",
    title: `Studio | ${BRAND}`,
    description: "Private creator studio — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/(write|studio|mobile-studio)$/,
    category: "studio",
    intent: "private",
    schemaType: "WebPage",
    title: `Studio | ${BRAND}`,
    description: "Private creator studio — not for indexing.",
    noindex: true,
  },
  {
    pattern: /^\/squatch-qr\/studio/,
    category: "studio",
    intent: "private",
    schemaType: "WebPage",
    title: `SquatchQR Studio | ${BRAND}`,
    description: "Private creator studio — not for indexing.",
    noindex: true,
  },

  // ─── Games (NOINDEX — no SEO value) ───────────────────────────────────────
  {
    pattern: /^\/games\/?$/,
    canonical: "/games",
    category: "games",
    intent: "navigational",
    schemaType: "CollectionPage",
    title: `Free games — Brain training & cognitive recovery | ${BRAND}`,
    description:
      "Free online games — slots, blackjack, roulette, Texas Hold'em, bingo, scratch-off. Brain training that doubles as cognitive recovery practice.",
    keywords: ["free online games", "brain training games", "cognitive recovery games"],
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    pattern: /^\/slots\/?$/,
    canonical: "/slots",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Slots — Sasquatch reels | ${BRAND}`,
    description: "Play free Sasquatch slots online. No download, no signup. A fun cognitive break for stroke survivors and everyone else.",
    keywords: ["free slots", "free online slots", "sasquatch slots"],
    changefreq: "weekly",
    priority: 0.55,
  },
  {
    pattern: /^\/blackjack\/?$/,
    canonical: "/blackjack",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Blackjack — Play online | ${BRAND}`,
    description: "Play free blackjack online. Fast hands, classic rules, no signup. Sharpens decision-making and short-term memory.",
    keywords: ["free blackjack", "play blackjack online"],
    changefreq: "weekly",
    priority: 0.55,
  },
  {
    pattern: /^\/roulette\/?$/,
    canonical: "/roulette",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Roulette — Spin the wheel | ${BRAND}`,
    description: "Free online roulette — European and American wheels. No signup. A relaxing brain-break game built by survivors.",
    keywords: ["free roulette", "play roulette online"],
    changefreq: "weekly",
    priority: 0.5,
  },
  {
    pattern: /^\/texas-holdem\/?$/,
    canonical: "/texas-holdem",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Texas Hold'em Poker | ${BRAND}`,
    description: "Free Texas Hold'em poker online. Practice hands against AI opponents. Builds focus, pattern recognition, and decision speed.",
    keywords: ["free texas holdem", "free poker online", "play poker"],
    changefreq: "weekly",
    priority: 0.55,
  },
  {
    pattern: /^\/bingo\/?$/,
    canonical: "/bingo",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Bingo — Play online | ${BRAND}`,
    description: "Free online bingo — classic 75-ball play. No signup. Survivor-friendly: large numbers, calm pacing.",
    keywords: ["free bingo", "play bingo online"],
    changefreq: "weekly",
    priority: 0.5,
  },
  {
    pattern: /^\/powerball\/?$/,
    canonical: "/powerball",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Powerball — Quick-pick generator | ${BRAND}`,
    description: "Free Powerball quick-pick number generator. Instant random picks, no signup, no spam. Just for fun.",
    keywords: ["powerball quick pick", "powerball numbers"],
    changefreq: "weekly",
    priority: 0.45,
  },
  {
    pattern: /^\/scratch-off\/?$/,
    canonical: "/scratch-off",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Free Scratch-Off Cards | ${BRAND}`,
    description: "Play free virtual scratch-off cards online. Quick rewards, no download, survivor-friendly tap-to-reveal.",
    keywords: ["free scratch off", "scratch off online"],
    changefreq: "weekly",
    priority: 0.45,
  },
  {
    pattern: /^\/wilderness-survival\/?$/,
    canonical: "/wilderness-survival",
    category: "games",
    intent: "navigational",
    schemaType: "WebPage",
    title: `Wilderness Survival — Sasquatch adventure | ${BRAND}`,
    description: "Free wilderness survival game — make decisions, manage resources, outlast the wild. Builds problem-solving and resilience.",
    keywords: ["wilderness survival game", "free survival game online"],
    changefreq: "weekly",
    priority: 0.5,
  },
  // ─── Public alias /store → Survivor Shop ────────────────────────────────────
  {
    pattern: /^\/store\/?$/,
    canonical: "/store",
    category: "misc",
    intent: "transactional",
    schemaType: "CollectionPage",
    title: `Survivor Shop — Recovery products curated by Nick | ${SITE}`,
    description:
      "Curated Amazon storefront for stroke survivors — therapy tools, mobility aids, cognitive games, and adaptive gear Nick personally uses.",
    keywords: ["stroke recovery products", "survivor shop", "recovery store"],
    changefreq: "weekly",
    priority: 0.7,
  },
  // ─── /recovery/routine — public routine builder landing ────────────────────
  {
    pattern: /^\/recovery\/routine\/?$/,
    canonical: "/recovery/routine",
    category: "recovery-content",
    intent: "transactional",
    schemaType: "WebPage",
    author: "nick",
    title: `Daily Recovery Routine Builder | ${SITE}`,
    description:
      "Build a personalized stroke recovery routine. Daily exercises by stroke side, mobility level, and recovery week. Free survivor-led tool.",
    keywords: ["stroke recovery routine", "daily recovery plan", "stroke exercise schedule"],
    changefreq: "weekly",
    priority: 0.85,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Strip query and fragment, normalize trailing slash for matching. */
function normalizePath(pathname: string): string {
  return pathname.split("?")[0].split("#")[0];
}

/** Resolve the registry entry for a path, or null if no match. */
export function lookupRoute(pathname: string): RouteEntry | null {
  const path = normalizePath(pathname);
  for (const entry of ROUTES) {
    if (entry.pattern.test(path)) return entry;
  }
  return null;
}

/** True if the path matches any noindex registry entry. */
export function isPrivatePath(pathname: string): boolean {
  const entry = lookupRoute(pathname);
  return Boolean(entry?.noindex);
}

/** Static sitemap entries derived from the registry: only entries with `canonical`
 *  and not noindex'd and not SSR-handled. */
export interface SitemapEntry {
  loc: string;
  changefreq: string;
  priority: number;
}
export function getStaticSitemapEntries(): SitemapEntry[] {
  return ROUTES.filter((r) => r.canonical && !r.noindex && !r.ssrHandled).map(
    (r) => ({
      loc: r.canonical!,
      changefreq: r.changefreq ?? "monthly",
      priority: r.priority ?? 0.5,
    }),
  );
}

/** Coverage stats — used by the admin SEO dashboard. */
export interface RegistryStats {
  total: number;
  indexable: number;
  noindex: number;
  byCategory: Record<string, number>;
  ssrHandled: number;
  staticSitemapCount: number;
}
export function getRegistryStats(): RegistryStats {
  const stats: RegistryStats = {
    total: ROUTES.length,
    indexable: 0,
    noindex: 0,
    byCategory: {},
    ssrHandled: 0,
    staticSitemapCount: getStaticSitemapEntries().length,
  };
  for (const r of ROUTES) {
    if (r.noindex) stats.noindex++;
    else stats.indexable++;
    if (r.ssrHandled) stats.ssrHandled++;
    stats.byCategory[r.category] = (stats.byCategory[r.category] ?? 0) + 1;
  }
  return stats;
}
