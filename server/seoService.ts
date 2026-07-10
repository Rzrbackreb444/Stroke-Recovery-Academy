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
  alternateName: ["Stroke Recovery Academy", "Stroke Recovery Academy Creator Platform"],
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/og-image.png`,
  description: "Survivor-led stroke recovery platform with neuroplasticity exercises, the 66-Day Sasquatch Transformation Challenge, AI Sasquatch Coach, and a survivor community.",
  foundingDate: "2024",
  sameAs: [
    "https://twitter.com/strokerecoveryacademy",
    "https://linkedin.com/company/stroke-recovery-academy",
    "https://youtube.com/@strokerecoveryacademy",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@strokerecoveryacademy.com",
      availableLanguage: ["English", "Spanish", "French", "German"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
};

// WebSite Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Stroke Recovery Academy",
  description: "AI-powered creator platform for books, videos, music, courses, and images",
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

// FAQ Schema for AEO
export const platformFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Stroke Recovery Academy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy is an AI-powered creator platform with 6 professional studios for creating books, videos, music, courses, and images. Creators earn 85% of sales through our marketplace.",
      },
    },
    {
      "@type": "Question",
      name: "How does the 85/15 revenue split work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When you sell content on Stroke Recovery Academy marketplace, you keep 85% of each sale. The 15% platform fee covers payment processing, hosting, and platform maintenance.",
      },
    },
    {
      "@type": "Question",
      name: "What AI features are included?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy includes AI text generation, image generation, music composition, voice cloning, video intelligence, speech-to-text, text-to-speech, translation in 100+ languages, and D-ID avatar creation.",
      },
    },
    {
      "@type": "Question",
      name: "Can I publish books to Amazon KDP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Book Studio exports KDP-ready manuscripts in PDF, EPUB, and DOCX formats with proper formatting, trim sizes, and bleed settings for both eBook and print editions.",
      },
    },
    {
      "@type": "Question",
      name: "Is Stroke Recovery Academy free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy offers a free tier with 100 monthly credits. Premium plans start at $29/month for creators, $79/month for professionals, and $299/month for enterprises.",
      },
    },
    {
      "@type": "Question",
      name: "What languages does Stroke Recovery Academy support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stroke Recovery Academy supports 20+ interface languages and translation in 100+ languages via Google Cloud Translation. The platform is fully internationalized for global creators.",
      },
    },
  ],
};

// HowTo Schemas for AEO
export const howToSchemas = {
  createBook: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Create and Publish a Book with AI",
    description: "Step-by-step guide to creating, formatting, and publishing a book using Stroke Recovery Academy Book Studio",
    totalTime: "PT2H",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    tool: [{ "@type": "HowToTool", name: "Stroke Recovery Academy Book Studio" }],
    step: [
      {
        "@type": "HowToStep",
        name: "Create Your Project",
        text: "Start a new book project and enter your title, genre, and target audience.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Generate Outline with AI",
        text: "Use AI to generate a chapter outline based on your book concept.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "Write with AI Assistance",
        text: "Write your chapters using the TipTap editor with AI ghostwriting assistance.",
        position: 3,
      },
      {
        "@type": "HowToStep",
        name: "Design Your Cover",
        text: "Create a professional book cover using the Cover Designer with AI image generation.",
        position: 4,
      },
      {
        "@type": "HowToStep",
        name: "Export for Publishing",
        text: "Export your manuscript as KDP-ready PDF, EPUB, or submit for print-on-demand.",
        position: 5,
      },
    ],
  },
  createCourse: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Create an Online Course with AI",
    description: "Complete guide to building and selling online courses on Stroke Recovery Academy",
    totalTime: "PT4H",
    step: [
      {
        "@type": "HowToStep",
        name: "Define Your Course Topic",
        text: "Choose your expertise area and define learning outcomes.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Generate Curriculum with AI",
        text: "Let AI create a structured curriculum with modules and lessons.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "Create Video Lessons",
        text: "Record or generate video content using Video Studio and AI avatars.",
        position: 3,
      },
      {
        "@type": "HowToStep",
        name: "Add Quizzes and Assessments",
        text: "Use AI to generate quizzes that reinforce learning.",
        position: 4,
      },
      {
        "@type": "HowToStep",
        name: "Publish to Marketplace",
        text: "Set your price and publish to Marketplace marketplace.",
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

// Core pages for sitemap
export const corePages: SitemapEntry[] = [
  { loc: BASE_URL, changefreq: 'daily', priority: 1.0 },
  { loc: `${BASE_URL}/creator`, changefreq: 'daily', priority: 0.9 },
  { loc: `${BASE_URL}/book-studio`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/video-studio`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/music-studio`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/course-studio`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/image-studio`, changefreq: 'weekly', priority: 0.9 },
  { loc: `${BASE_URL}/publishing`, changefreq: 'weekly', priority: 0.8 },
  { loc: `${BASE_URL}/marketplace`, changefreq: 'daily', priority: 0.9 },
  { loc: `${BASE_URL}/pricing`, changefreq: 'weekly', priority: 0.8 },
  { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: 0.6 },
  { loc: `${BASE_URL}/faq`, changefreq: 'monthly', priority: 0.7 },
  { loc: `${BASE_URL}/terms`, changefreq: 'yearly', priority: 0.3 },
  { loc: `${BASE_URL}/privacy`, changefreq: 'yearly', priority: 0.3 },
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
