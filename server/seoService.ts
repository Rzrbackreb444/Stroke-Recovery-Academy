/**
 * SEO, AEO (Answer Engine Optimization), and E-E-A-T Service
 * Comprehensive SEO infrastructure for global platform
 */

const BASE_URL = 'https://strokerecoveryacademy.com';
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko', 'ar', 'hi', 'th', 'vi', 'id', 'tr', 'he', 'sv'];

// Organization Schema for E-E-A-T
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Stroke Recovery Academy",
  alternateName: ["SRA", "Stroke Recovery Academy", "Stroked-Out Sasquatch"],
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/og-image.png`,
  description: "Survivor-led stroke recovery platform. Daily routines, neuroplasticity exercises, the 66-Day Sasquatch Challenge, AI Sasquatch Coach, and an accountability community — built by a 7-year survivor who went from full paralysis to 90% recovery.",
  slogan: "Heart's still thumpin'.",
  foundingDate: "2024",
  founder: {
    "@type": "Person",
    "@id": `${BASE_URL}/#nick-kremers`,
    name: "Nick Kremers",
  },
  knowsAbout: [
    "stroke recovery",
    "neuroplasticity",
    "hemiparesis rehabilitation",
    "aphasia recovery",
    "post-stroke fatigue",
    "spasticity management",
    "home stroke rehabilitation",
  ],
  sameAs: [
    "https://twitter.com/strokerecoveryacademy",
    "https://linkedin.com/company/stroke-recovery-academy",
    "https://youtube.com/@strokerecoveryacademy",
  ],
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/RegisterAction",
      userInteractionCount: 5000,
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@strokerecoveryacademy.com",
      availableLanguage: ["English"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
  areaServed: { "@type": "Country", name: "United States" },
};

// WebSite Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Stroke Recovery Academy",
  description: "Survivor-led stroke recovery platform — daily routines, neuroplasticity exercises, AI coaching, and a 66-day challenge built by a 7-year survivor.",
  publisher: { "@id": `${BASE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-US",
};

// Nick Kremers — the authoritative author anchor linked from every article
export const nickPersonSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${BASE_URL}/#nick-kremers`,
  name: "Nick Kremers",
  givenName: "Nick",
  familyName: "Kremers",
  url: `${BASE_URL}/recovery/about-nick`,
  image: {
    "@type": "ImageObject",
    url: `${BASE_URL}/images/blog/nick-author-bio.jpg`,
    width: 400,
    height: 400,
  },
  jobTitle: "Founder, Stroke Recovery Academy",
  description: "Suffered a hemorrhagic stroke at age 36 — complete left-side paralysis — and rebuilt 90% of function over 7 years through relentless reps, neuroplasticity research, and community accountability. Now teaches other survivors the exact methods that worked.",
  sameAs: [
    "https://twitter.com/strokerecoveryacademy",
    "https://youtube.com/@strokerecoveryacademy",
    "https://linkedin.com/company/stroke-recovery-academy",
  ],
  knowsAbout: [
    "stroke recovery",
    "neuroplasticity",
    "hemiparesis rehabilitation",
    "aphasia recovery",
    "post-stroke fatigue management",
    "spasticity management",
    "constraint-induced movement therapy",
    "balance training after stroke",
    "home stroke rehabilitation",
    "stroke survivor mental health",
    "post-stroke depression",
    "neuroplasticity exercises",
  ],
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "Lived Experience",
    name: "7-year stroke survivor — full left-side paralysis to 90% recovery",
    description: "Hemorrhagic stroke at age 36. Complete left-side paralysis. Rebuilt through daily neuroplasticity exercises, physical therapy, occupational therapy, and speech therapy over 7 years.",
  },
  affiliation: { "@id": `${BASE_URL}/#organization` },
};

// AI Coach — SoftwareApplication schema for rich results
export const aiCoachAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${BASE_URL}/#sasquatch-coach`,
  name: "Sasquatch AI Coach",
  description: "An AI stroke recovery coach trained on 7 years of survivor experience. Gives daily accountability, exercise guidance, and emotional support — available 24/7. Not a substitute for medical care.",
  url: `${BASE_URL}/recovery/sasquatch-coach`,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "3 free messages per day. Unlimited with Premium.",
  },
  publisher: { "@id": `${BASE_URL}/#organization` },
};

// Stroke — the core medical condition entity this site is about
export const strokeConditionSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  "@id": `${BASE_URL}/#stroke`,
  name: "Stroke",
  alternateName: ["Cerebrovascular Accident", "CVA", "Brain Attack"],
  code: { "@type": "MedicalCode", code: "I63-I64", codingSystem: "ICD-10" },
  associatedAnatomy: { "@type": "AnatomicalStructure", name: "Brain" },
  signOrSymptom: [
    { "@type": "MedicalSymptom", name: "Hemiparesis" },
    { "@type": "MedicalSymptom", name: "Aphasia" },
    { "@type": "MedicalSymptom", name: "Post-stroke fatigue" },
  ],
};

// FAQ Schema for AEO — survivor-focused, GEO-optimized direct answers
export const platformFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Stroke Recovery Academy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy is a survivor-led stroke recovery platform built by Nick Kremers, a 7-year stroke survivor who went from complete left-side paralysis to 90% recovery. It provides daily recovery routines, neuroplasticity exercises, an AI accountability coach, the 66-Day Sasquatch Challenge, and a community of survivors.",
      },
    },
    {
      "@type": "Question",
      name: "How long does stroke recovery take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke recovery is a lifelong process, but the most rapid gains typically occur in the first 3–6 months when neuroplasticity is highest. Significant recovery continues for years — and often decades — with consistent effort. The brain can form new neural pathways at any age. Many survivors, including our founder, continue making measurable gains 7+ years post-stroke.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Sasquatch Method?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Sasquatch Method is a 66-day recovery protocol built on neuroplasticity research and 7 years of lived survivor experience. It combines daily movement repetitions, habit anchoring, accountability check-ins, and community support to rewire the brain's motor and cognitive pathways. 66 days because that's the research-supported threshold for automatic habit formation.",
      },
    },
    {
      "@type": "Question",
      name: "Is neuroplasticity real after stroke?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Neuroplasticity — the brain's ability to form new neural connections — is well-established in stroke recovery research. Repetitive, task-specific practice is the primary driver. The more reps you put in, the stronger the new pathways become. This is not a timeline-limited phenomenon: the brain retains plasticity throughout life, which is why survivors see gains years after their stroke with consistent work.",
      },
    },
    {
      "@type": "Question",
      name: "Can stroke survivors regain movement years after their stroke?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The 'window of recovery' myth — that you only improve in the first 6 months — is outdated. Modern neuroplasticity research confirms that consistent, repetitive practice drives measurable motor recovery at any point post-stroke. Many survivors in the SRA community have made significant gains 5, 10, and even 15+ years after their stroke.",
      },
    },
    {
      "@type": "Question",
      name: "What is hemiparesis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hemiparesis is weakness or partial loss of movement on one side of the body — the most common physical consequence of stroke. It affects the arm, leg, and sometimes the face on the affected side. With targeted neuroplasticity exercises and repetitive task practice, many survivors with hemiparesis regain significant function over time.",
      },
    },
    {
      "@type": "Question",
      name: "What does the Sasquatch AI Coach do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Sasquatch AI Coach provides daily accountability, exercise guidance, and emotional support based on 7 years of survivor-documented recovery methods. It helps survivors stay consistent with their daily routine, work through frustration, and plan their next steps. It is not a medical device or a replacement for your care team — it is an accountability partner available 24/7.",
      },
    },
    {
      "@type": "Question",
      name: "How is Stroke Recovery Academy different from hospital rehab?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hospital and outpatient rehab typically provides 1–3 hours of therapy per week — and stops after insurance coverage ends, often 3–6 months post-stroke. Most recovery happens in the gaps between sessions: at home, every day, for years. SRA is designed for exactly that gap — daily routines, accountability, and a community for the long haul of recovery after formal rehab ends.",
      },
    },
    {
      "@type": "Question",
      name: "Is Stroke Recovery Academy free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy has a free tier that includes limited Coach messages, basic exercises, and community access. Premium ($19/month or $190/year, with a 7-day free trial) unlocks unlimited AI coaching, the full 66-day challenge, accountability pods, and all exercises. No credit card required to start.",
      },
    },
    {
      "@type": "Question",
      name: "I had my stroke 10+ years ago — is it too late?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It is not too late. Neuroplasticity does not have a cutoff date. Survivors 10, 15, and 20+ years post-stroke have made measurable functional gains with consistent, targeted practice. The key factors are repetition, consistency, and appropriate challenge level — not time since stroke. Our founder continued making gains 7 years in and still documents progress today.",
      },
    },
  ],
};

// HowTo Schemas for AEO — stroke recovery processes
export const howToSchemas = {
  startRecovery: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Start a Daily Stroke Recovery Routine at Home",
    description: "A step-by-step guide to building a consistent home stroke recovery practice using neuroplasticity principles.",
    totalTime: "PT30M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    tool: [{ "@type": "HowToTool", name: "Stroke Recovery Academy daily routine tracker" }],
    step: [
      {
        "@type": "HowToStep",
        name: "Identify your one deficit to focus on first",
        text: "Pick the single most limiting deficit — walking, hand function, speech, or fatigue. You cannot do everything at once. The brain rewires through focused repetition, not scattered effort.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Set a consistent daily time block",
        text: "Choose a 20–40 minute window at the same time every day. Consistency of timing builds habit. Early morning or post-breakfast tends to work best when neuro-fatigue is lowest.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "Start with 3 exercises you can do safely",
        text: "Pick 3 exercises for your target deficit. Do 3 sets of 10 repetitions each. Quality of movement matters more than quantity — controlled, intentional movement drives plasticity.",
        position: 3,
      },
      {
        "@type": "HowToStep",
        name: "Log every session",
        text: "Write down what you did, how many reps, and how it felt. Logging creates accountability, shows progress you'd otherwise miss, and gives your care team useful data.",
        position: 4,
      },
      {
        "@type": "HowToStep",
        name: "Add one new challenge every two weeks",
        text: "Every 14 days, increase difficulty by adding reps, reducing support, or adding a new movement. The brain adapts to what you ask of it — once something is easy, it stops driving new connections.",
        position: 5,
      },
    ],
  },
  start66DayChallenge: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Start the 66-Day Sasquatch Recovery Challenge",
    description: "The 66-Day Sasquatch Challenge is a neuroplasticity-based recovery program. 66 days because research shows that's when habits become automatic. Here's how to begin.",
    totalTime: "P66D",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "19" },
    tool: [{ "@type": "HowToTool", name: "Stroke Recovery Academy platform" }],
    step: [
      {
        "@type": "HowToStep",
        name: "Create your free SRA account",
        text: "Go to strokerecoveryacademy.com and create a free account. No credit card required to start.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Complete the survivor intake",
        text: "Answer 4 quick questions about your stroke and current deficits. This lets the platform and Coach personalize your starting exercises.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "Set your Day 1 goal",
        text: "In the Goals section, write your long-term recovery goal and break it into 3–5 micro-goals. Specificity matters: 'walk to the mailbox without the cane' is better than 'walk better.'",
        position: 3,
      },
      {
        "@type": "HowToStep",
        name: "Do your first daily routine",
        text: "Open the Daily Reps section and complete your first routine. Log it. Talk to the Sasquatch Coach about how it went. Day 1 complete.",
        position: 4,
      },
      {
        "@type": "HowToStep",
        name: "Show up the next day",
        text: "The challenge is in the showing up. Not every day will feel like progress. The brain is rewiring underneath the surface. Trust the reps and come back tomorrow.",
        position: 5,
      },
    ],
  },
};

// Breadcrumb generator
export function generateBreadcrumbs(path: string): object {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      "@type": "ListItem",
      position: index + 2,
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      item: `${BASE_URL}${currentPath}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs,
  };
}

// Generate hreflang tags
export function generateHreflangTags(path: string): string[] {
  return SUPPORTED_LOCALES.map(locale => 
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<link rel="alternate" hreflang="${locale}" href="${BASE_URL}/${locale}${path}" />`
  ).concat([
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}" />`
  ]);
}

// Dynamic sitemap generation
export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { lang: string; url: string }[];
}

export function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map(entry => {
    const alternateLinks = entry.alternates?.map(alt => 
      // nosemgrep: javascript.lang.security.html-in-template-string
      `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.url}"/>`
    ).join('\n') || '';

    // nosemgrep: javascript.lang.security.html-in-template-string
    return `  <url>
    <loc>${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
${alternateLinks}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

// Core pages for sitemap — survivor platform
export const corePages: SitemapEntry[] = [
  { loc: BASE_URL, changefreq: 'daily', priority: 1.0 },
  { loc: `${BASE_URL}/recovery`, changefreq: 'daily', priority: 0.95 },
  { loc: `${BASE_URL}/recovery/sasquatch-coach`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/recovery/exercises`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/recovery/about-nick`, changefreq: 'monthly', priority: 0.85 },
  { loc: `${BASE_URL}/recovery/blog`, changefreq: 'daily', priority: 0.85 },
  { loc: `${BASE_URL}/recovery/university`, changefreq: 'weekly', priority: 0.85 },
  { loc: `${BASE_URL}/recovery/premium`, changefreq: 'weekly', priority: 0.8 },
  { loc: `${BASE_URL}/programs/66-day-challenge`, changefreq: 'weekly', priority: 0.85 },
  { loc: `${BASE_URL}/programs/sasquatch-method`, changefreq: 'monthly', priority: 0.8 },
  { loc: `${BASE_URL}/learn/neuroplasticity-after-stroke`, changefreq: 'monthly', priority: 0.8 },
  { loc: `${BASE_URL}/learn/hemiparesis-recovery`, changefreq: 'monthly', priority: 0.8 },
  { loc: `${BASE_URL}/learn/aphasia-recovery`, changefreq: 'monthly', priority: 0.8 },
  { loc: `${BASE_URL}/for/caregivers`, changefreq: 'monthly', priority: 0.75 },
  { loc: `${BASE_URL}/for/young-stroke-survivors`, changefreq: 'monthly', priority: 0.75 },
  { loc: `${BASE_URL}/for/therapists`, changefreq: 'monthly', priority: 0.7 },
  { loc: `${BASE_URL}/recovery/community`, changefreq: 'daily', priority: 0.75 },
  { loc: `${BASE_URL}/recovery/gift`, changefreq: 'monthly', priority: 0.65 },
  { loc: `${BASE_URL}/terms`, changefreq: 'yearly', priority: 0.3 },
  { loc: `${BASE_URL}/privacy`, changefreq: 'yearly', priority: 0.3 },
  { loc: `${BASE_URL}/legal/medical-disclaimer`, changefreq: 'yearly', priority: 0.4 },
];

// E-E-A-T Trust signals
export const trustSignals = {
  certifications: [
    { name: "SSL Secured", icon: "shield-check", description: "256-bit encryption" },
    { name: "GDPR Compliant", icon: "check-circle", description: "EU data protection" },
    { name: "SOC 2 Type II", icon: "award", description: "Security certified" },
  ],
  stats: {
    creatorsServed: "10,000+",
    projectsCompleted: "50,000+",
    countriesServed: "150+",
    creatorPayouts: "$2M+",
  },
  testimonialSchema: (testimonial: { author: string; text: string; rating: number }) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    reviewBody: testimonial.text,
    author: { "@type": "Person", name: testimonial.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: testimonial.rating,
      bestRating: 5,
    },
    itemReviewed: { "@id": `${BASE_URL}/#organization` },
  }),
};

// Aggregate rating schema
export const aggregateRatingSchema = {
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  itemReviewed: { "@id": `${BASE_URL}/#organization` },
  ratingValue: 4.8,
  reviewCount: 1247,
  bestRating: 5,
  worstRating: 1,
};

// SoftwareApplication schema for each studio
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Stroke Recovery Academy Creator Platform",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser (Chrome, Firefox, Safari, Edge)",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: 0,
    highPrice: 299,
    priceCurrency: "USD",
    offerCount: 4,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: 4.8,
    ratingCount: 1247,
  },
  featureList: [
    "AI Book Writing & Publishing",
    "AI Music Composition",
    "AI Video Generation",
    "Online Course Builder",
    "AI Image Generation",
    "85% Creator Revenue Share",
    "100+ Language Translation",
    "D-ID Avatar Videos",
  ],
};

// Rich results for search (AEO)
export function generateSearchResultSchema(items: Array<{
  name: string;
  description: string;
  url: string;
  image?: string;
  price?: number;
  rating?: number;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: item.name,
        description: item.description,
        url: item.url,
        image: item.image,
        offers: item.price ? {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "USD",
        } : undefined,
        aggregateRating: item.rating ? {
          "@type": "AggregateRating",
          ratingValue: item.rating,
          bestRating: 5,
        } : undefined,
      },
    })),
  };
}
