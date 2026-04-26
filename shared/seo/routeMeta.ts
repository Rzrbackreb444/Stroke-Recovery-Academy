// Single source of truth for per-route SEO meta.
// Imported by both the server (for head injection) and the client (for tab/title updates).
//
// Title rules: ≤60 chars (Google truncates ~60). Brand placement varies by intent.
// Description rules: 140-160 chars (Google truncates ~155).
// Title pattern that ranks: primary keyword first, brand at end (or omitted) when the page
// targets a query like "how to X"; brand-led when the query is "site:brand X".

export interface RouteMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
  schemaType?: "WebPage" | "Article" | "MedicalWebPage" | "AboutPage" | "CollectionPage" | "FAQPage";
}

export interface RouteMetaRule {
  pattern: RegExp;
  meta: RouteMeta;
}

const SITE = "Stroke Recovery Academy";
const BRAND = "KreAIte.xyz";

// ── Indexable public routes (bespoke meta, brand placement deliberate) ────────
export const INDEXABLE_RULES: RouteMetaRule[] = [
  // KreAIte main domain
  {
    pattern: /^\/$/,
    meta: {
      title: "KreAIte.xyz: Create. Publish. Earn. AI Studios for Creators",
      description: "Seven AI-powered studios for books, video, music, courses, images, websites, and more. Sell on the KreAItorverse marketplace with an 85/15 revenue split.",
      keywords: ["AI creator platform", "AI book writer", "AI music studio", "AI course builder", "creator marketplace"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/marketplace\/?$/,
    meta: {
      title: "KreAItorverse Marketplace: Buy & Sell Creator Content",
      description: "Books, courses, music, and digital products from independent creators. 85% revenue goes to the creator. Discover survivor-led, AI-built work.",
      keywords: ["creator marketplace", "indie books", "indie courses", "85/15 revenue split"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/marketplace\/books\/?$/,
    meta: {
      title: "Indie Books from Survivor Authors | KreAItorverse",
      description: "Browse books written by independent authors and stroke survivors. KDP-ready. Print-on-demand via Lulu. Real lived experience, not algorithmic filler.",
      keywords: ["indie books", "survivor authors", "stroke recovery books", "print on demand"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/pricing\/?$/,
    meta: {
      title: "KreAIte Pricing: Free, Pro, and Studio Plans",
      description: "Start free. Upgrade when you publish. Transparent pricing for creators using AI studios for books, music, video, courses, and more.",
      keywords: ["KreAIte pricing", "AI creator pricing", "indie creator plans"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/publishing\/?$/,
    meta: {
      title: "KreAIte Publishing: KDP-Ready Books & Lulu Print-on-Demand",
      description: "Publish your book directly to Amazon KDP and Lulu Print-on-Demand from inside KreAIte. Royalty tracking, OAuth-secured, no formatting headaches.",
      keywords: ["KDP publishing", "Lulu print on demand", "self publishing platform"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/squatch-qr\/?$/,
    meta: {
      title: "SquatchQR: Dynamic QR Codes with Quote Studio & Analytics",
      description: "Enterprise dynamic QR codes that route to live quote pages. Designer, scan analytics, A/B variants. Free tier available.",
      keywords: ["dynamic QR codes", "quote QR", "QR analytics", "branded QR codes"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/(about|about-us)\/?$/,
    meta: {
      title: "About KreAIte.xyz: The Creator Operating System",
      description: "KreAIte.xyz is the operating system for independent creators. Built by Nick Kremers — 7-year stroke survivor, author, and founder.",
      keywords: ["about KreAIte", "Nick Kremers founder", "creator OS"],
      schemaType: "AboutPage",
    },
  },
  {
    pattern: /^\/community\/?$/,
    meta: {
      title: "KreAIte Community: Discussion, Threads & Creator Groups",
      description: "Discuss craft, share works in progress, find collaborators. Survivor and creator threads, moderated, ad-free.",
      keywords: ["creator community", "indie author community", "stroke survivor community"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/groups\/?$/,
    meta: {
      title: "KreAIte Groups: Find Your Creator Community",
      description: "Join groups for indie authors, course creators, musicians, stroke survivors, caregivers, and more. Share work, get feedback, build together.",
      keywords: ["creator groups", "writer groups", "stroke survivor groups"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/stories\/?$/,
    meta: {
      title: "Stories on KreAIte: Read & Share Survivor & Creator Stories",
      description: "Real stories from stroke survivors, caregivers, and creators. Read, react, and share your own. No paywall.",
      keywords: ["survivor stories", "stroke recovery stories", "creator stories"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/terms\/?$/,
    meta: {
      title: `Terms of Service | ${BRAND}`,
      description: "Terms of Service for KreAIte.xyz, KreAItorverse Marketplace, and Stroke Recovery Academy. Plain-language, creator-friendly.",
      noindex: false,
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/privacy\/?$/,
    meta: {
      title: `Privacy Policy | ${BRAND}`,
      description: "How KreAIte.xyz collects, uses, and protects your data. Plain-language, GDPR/CCPA-aligned, no dark patterns.",
      schemaType: "WebPage",
    },
  },

  // Stroke Recovery Academy public surface
  {
    pattern: /^\/recovery\/?$/,
    meta: {
      title: "Stroke Recovery Academy: Daily Routines, Coach, Community",
      description: "The operating system for stroke survivors. Daily routines, neuroplasticity exercises, AI coach, 66-day challenge, survivor community — by Nick Kremers.",
      keywords: ["stroke recovery", "stroke survivor support", "stroke recovery program", "Nick Kremers", "Sasquatch Method"],
      schemaType: "MedicalWebPage",
    },
  },
  {
    pattern: /^\/recovery\/academy\/?$/,
    meta: {
      title: "Recovery Academy: Free Stroke Survivor Education Hub",
      description: "Free survivor-led courses on neuroplasticity, daily routines, communication, mobility, and the 66-day Sasquatch transformation.",
      keywords: ["stroke recovery academy", "stroke survivor education", "neuroplasticity courses"],
      schemaType: "MedicalWebPage",
    },
  },
  {
    pattern: /^\/recovery\/sasquatch-coach\/?$/,
    meta: {
      title: "Sasquatch Coach: Free 24/7 AI Stroke Recovery Companion",
      description: "Free AI recovery coach trained on Nick Kremers' 7-year survivor playbook. Ask anything about stroke recovery, exercises, motivation. 24/7. No login.",
      keywords: ["AI stroke coach", "stroke recovery chatbot", "free stroke support", "Sasquatch Coach"],
      schemaType: "MedicalWebPage",
    },
  },
  {
    pattern: /^\/recovery\/sasch\/?$/,
    meta: {
      title: "Sasquatch Method: From 0% to 90% Stroke Recovery",
      description: "The repetition-based neuroplasticity protocol Nick Kremers used to go from total paralysis to 90% recovery. Free overview, no email required.",
      keywords: ["Sasquatch Method", "stroke recovery method", "neuroplasticity protocol"],
      schemaType: "MedicalWebPage",
    },
  },
  {
    pattern: /^\/recovery\/builder\/?$/,
    meta: {
      title: "Build Your Stroke Recovery Routine in 3 Minutes",
      description: "Free routine builder that picks daily exercises by your stroke side, mobility level, and recovery week. Print or save to your dashboard.",
      keywords: ["stroke recovery routine", "daily stroke exercises", "personalized stroke plan"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/recovery\/about-nick\/?$/,
    meta: {
      title: "Nick Kremers: Stroke Survivor & Sasquatch Method Founder",
      description: "Nick Kremers had a hemorrhagic stroke at 35. Seven years later he's at 90% recovery. This is the playbook he wishes he'd had on day one.",
      keywords: ["Nick Kremers", "stroke survivor founder", "Sasquatch Method origin"],
      schemaType: "AboutPage",
    },
  },
  {
    pattern: /^\/recovery\/blog\/?$/,
    meta: {
      title: "Stroke Recovery Blog: Survivor-Led Articles & Guides",
      description: "Long-form articles on neuroplasticity, hemiparesis, aphasia, caregiver life, and recovery milestones — written from lived experience.",
      keywords: ["stroke recovery blog", "stroke survivor blog", "neuroplasticity articles"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/recovery\/exercises\/?$/,
    meta: {
      title: "Stroke Recovery Exercises Library | Nick Kremers",
      description: "Free library of stroke recovery exercises by category — upper body, lower body, hand, core, balance, speech, cognitive — with sets, reps, and progression.",
      keywords: ["stroke recovery exercises", "stroke rehab exercises", "post-stroke workouts"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/recovery\/center-finder\/?$/,
    meta: {
      title: "Find a Stroke Recovery Center Near You — Free Directory",
      description: "Free directory of stroke rehab centers, neurologists, and outpatient PT/OT/SLP. Search by ZIP. Refreshed every 30 days from Google Places.",
      keywords: ["stroke recovery center near me", "stroke rehab center", "stroke neurologist directory"],
      schemaType: "WebPage",
    },
  },
  {
    pattern: /^\/recovery\/protocols\/?$/,
    meta: {
      title: "Stroke Recovery Protocols: Daily, Weekly, 66-Day Plans",
      description: "Structured daily, weekly, and 66-day recovery protocols — built around repetition and neuroplasticity. Free to view and adapt.",
      keywords: ["stroke recovery protocol", "66-day stroke challenge", "daily stroke routine"],
      schemaType: "MedicalWebPage",
    },
  },
  {
    pattern: /^\/recovery\/university\/?$/,
    meta: {
      title: "Stroke Recovery University: Free Survivor Courses",
      description: "Free, structured courses on stroke recovery — neuroplasticity, hemiparesis, aphasia, caregiving, and the Sasquatch Method. Survivor-led.",
      keywords: ["stroke recovery university", "free stroke recovery courses", "stroke survivor education"],
      schemaType: "CollectionPage",
    },
  },
  {
    pattern: /^\/recovery\/survival-grid\/?$/,
    meta: {
      title: "Survival Grid: Daily Stroke Recovery Tracker",
      description: "Track your daily wins across mobility, speech, cognition, mood, and routine. Built for stroke survivors who want progress they can see.",
      keywords: ["stroke recovery tracker", "stroke daily progress", "survival grid"],
      schemaType: "WebPage",
    },
  },
];

// ── Noindex routes (private app surfaces — don't dilute domain authority) ─────
export const NOINDEX_PATTERNS: RegExp[] = [
  /^\/dashboard/,
  /^\/recovery\/(dashboard|journal|medical-log|flicker-log|achievements|reminders)/,
  /^\/admin/,
  /^\/auth/,
  /^\/magic-link/,
  /^\/checkout/,
  /^\/marketplace\/(order|my-orders|purchase-success)/,
  /^\/(sell-books|author-dashboard|author-profile)/,
  /^\/creator(\/|-)/,
  /^\/(production-dashboard|analytics|affiliate)/,
  /^\/settings/,
  // Studios and creator surfaces (app, not landing pages)
  /^\/(book-studio|book-perfection-suite|music-studio|music-sandbox|video-studio|course-studio|image-studio|website-studio|podcast-studio|avatar-studio|movie-studio|voice-library|audiobook-factory|dj-studio|music-production|script-studio|life-story|quick-create|ai-consultant|media-studio|templates|doc-hub|moderation|seo-command-center|workflows)/,
  /^\/(write|studio|mobile-studio)$/,
  /^\/squatch-qr\/studio/,
  /^\/(white-label|creator-store|creator-products|creator-hub)/,
  // Games / no SEO value
  /^\/(slots|games|roulette|blackjack|texas-holdem|wilderness-survival|powerball|scratch-off|bingo)/,
  // Misc app utilities
  /^\/(power-points|stories\/(new|my|edit)|therapists|settings\/avatar)/,
];

export function lookupRouteMeta(pathname: string): RouteMeta | null {
  const path = pathname.split("?")[0].split("#")[0];

  for (const rule of INDEXABLE_RULES) {
    if (rule.pattern.test(path)) return rule.meta;
  }
  for (const re of NOINDEX_PATTERNS) {
    if (re.test(path)) {
      return {
        title: `${BRAND}`,
        description: "Private app surface — not for indexing.",
        noindex: true,
      };
    }
  }
  return null;
}

export function isPrivatePath(pathname: string): boolean {
  const path = pathname.split("?")[0].split("#")[0];
  return NOINDEX_PATTERNS.some((re) => re.test(path));
}
