import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonical?: string;
  canonicalUrl?: string;
  type?: "website" | "article" | "product" | "course" | "faq" | "howto";
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schema?: object | object[];
  noindex?: boolean;
  faq?: Array<{ question: string; answer: string }>;
  howTo?: { name: string; steps: Array<{ name: string; text: string }> };
  breadcrumbs?: Array<{ name: string; url: string }>;
  speakable?: string[];
  expertise?: string | string[];
  experience?: string;
  authoritativeness?: string;
  trustworthiness?: string;
  trustSignals?: string[];
}

const BASE_URL = "https://strokerecoveryacademy.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "Stroke Recovery Academy";

export default function SEO({
  title,
  description = "Stroke Recovery Academy — built by Nick Kremers, 7-year stroke survivor. Daily routines, neuroplasticity exercises, AI coach, 66-day challenge, survivor community.",
  keywords,
  canonical,
  canonicalUrl,
  type = "website",
  image = DEFAULT_IMAGE,
  author,
  publishedTime,
  modifiedTime,
  schema,
  noindex = false,
  faq,
  howTo,
  breadcrumbs,
  speakable,
  expertise,
  experience,
  authoritativeness,
  trustworthiness,
  trustSignals,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | AI-Powered Creator Studio`;
  
  const finalCanonicalUrl = canonicalUrl
    ? canonicalUrl.startsWith("http") 
      ? canonicalUrl 
      : `${BASE_URL}${canonicalUrl}`
    : canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== "undefined"
    ? `${BASE_URL}${window.location.pathname}`
    : BASE_URL;

  const keywordsString = typeof keywords === "string" 
    ? keywords 
    : Array.isArray(keywords) 
    ? keywords.join(", ") 
    : undefined;

  const schemaScripts = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

  const faqSchema = faq?.length ? {
    "@type": "FAQPage",
    mainEntity: faq.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  } : null;

  const howToSchema = howTo ? {
    "@type": "HowTo",
    name: howTo.name,
    step: howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  } : null;

  const breadcrumbSchema = breadcrumbs?.length ? {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`
    }))
  } : null;

  const speakableSchema = speakable?.length ? {
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: speakable
    }
  } : null;

  const expertiseArray = Array.isArray(expertise) 
    ? expertise 
    : expertise 
    ? [expertise] 
    : ["AI Content Creation", "Digital Publishing", "Book Writing", "Video Production", "Music Composition"];

  const organizationSchema = {
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      "https://twitter.com/strokerecoveryacademy",
      "https://linkedin.com/company/stroke-recovery-academy"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English"]
    },
    foundingDate: "2024",
    description: "AI-powered creator platform with 7 professional studios",
    knowsAbout: expertiseArray,
    slogan: "Create. Publish. Earn.",
    ...(authoritativeness && { authoritativeness }),
    ...(trustworthiness && { trustworthiness }),
    ...(experience && { experience })
  };

  const allSchemas = [
    ...schemaScripts,
    organizationSchema,
    faqSchema,
    howToSchema,
    breadcrumbSchema,
    speakableSchema
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#C9941A" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />

      <meta property="og:type" content={type === "faq" ? "website" : type === "howto" ? "article" : type} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@strokerecoveryacademy" />
      <meta name="twitter:creator" content="@strokerecoveryacademy" />
      <meta name="twitter:url" content={finalCanonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {author && <meta name="author" content={author} />}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {experience && <meta name="experience" content={experience} />}
      {authoritativeness && <meta name="authoritativeness" content={authoritativeness} />}
      {trustworthiness && <meta name="trustworthiness" content={trustworthiness} />}
      {typeof expertise === "string" && <meta name="expertise" content={expertise} />}
      {Array.isArray(expertise) && expertise.length && <meta name="expertise" content={expertise.join(", ")} />}
      {trustSignals?.length && <meta name="trust-signals" content={trustSignals.join(", ")} />}

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

      {allSchemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify({ "@context": "https://schema.org", ...s })}
        </script>
      ))}
    </Helmet>
  );
}

export const studioSchemas = {
  bookStudio: {
    "@type": "SoftwareApplication",
    name: "Stroke Recovery Academy Book Studio",
    applicationCategory: "DesktopEnhancementApplication",
    operatingSystem: "Web Browser",
    description: "AI-powered book writing studio with professional editor, AI ghostwriting, and direct publishing to KDP and Lulu.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Ghostwriting", "TipTap WYSIWYG Editor", "KDP Publishing", "Lulu Print-on-Demand", "Cover Designer"],
  },
  musicStudio: {
    "@type": "SoftwareApplication",
    name: "Stroke Recovery Academy Music Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "AI music composition studio with Tone.js, loop libraries, mixing and mastering tools.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Music Composition", "Loop Libraries", "Mixing & Mastering", "Export to MP3/WAV"],
  },
  videoStudio: {
    "@type": "SoftwareApplication",
    name: "Stroke Recovery Academy Video Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "Professional video editor with AI video generation, multi-track timeline, and studio effects.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Video Generation", "Multi-track Timeline", "Effects & Transitions", "4K Export"],
  },
  courseStudio: {
    "@type": "SoftwareApplication",
    name: "Stroke Recovery Academy Course Builder",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    description: "Create professional online courses with AI-generated content, video lessons, quizzes, and certificates.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Course Generation", "Video Lessons", "Quizzes", "Certificates", "Student Analytics"],
  },
  imageStudio: {
    "@type": "SoftwareApplication",
    name: "Stroke Recovery Academy Image Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "Photoshop-like image editor with layers, filters, AI generation, and background removal.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["Layers & Masks", "AI Image Generation", "Background Removal", "Filters & Effects"],
  },
};

export function createAuthorSchema(author: {
  name: string;
  bio?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  genres?: string[];
  achievements?: string[];
}) {
  const authorUrl = author.url?.startsWith("http") 
    ? author.url 
    : `${BASE_URL}${author.url?.startsWith("/") ? author.url : `/author/${encodeURIComponent(author.name.toLowerCase().replace(/\s+/g, "-"))}`}`;
  
  return {
    "@type": "Person",
    name: author.name,
    description: author.bio,
    url: authorUrl,
    image: author.image,
    sameAs: author.sameAs?.filter(Boolean) || [],
    jobTitle: "Author & Content Creator",
    knowsAbout: author.genres || ["Content Creation", "Digital Publishing"],
    award: author.achievements,
    memberOf: {
      "@type": "Organization",
      name: "Stroke Recovery Academy",
      url: BASE_URL,
    },
  };
}

export function createCourseSchema(course: {
  name: string;
  description: string;
  author: string;
  price?: number;
  image?: string;
}) {
  return {
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "Stroke Recovery Academy",
      sameAs: BASE_URL,
    },
    instructor: {
      "@type": "Person",
      name: course.author,
    },
    image: course.image,
    offers: course.price
      ? { "@type": "Offer", price: course.price, priceCurrency: "USD" }
      : undefined,
  };
}

export function createProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  author?: string;
  category?: string;
}) {
  return {
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { "@type": "Brand", name: "Stroke Recovery Academy" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: product.author
      ? { "@type": "Person", name: product.author }
      : undefined,
  };
}

export function createItemListSchema(items: Array<{
  name: string;
  url: string;
  image?: string;
  position?: number;
}>) {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      image: item.image,
    })),
  };
}

export function createArticleSchema(article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    author: { "@type": "Person", name: article.author },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image,
    publisher: {
      "@type": "Organization",
      name: "Stroke Recovery Academy",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
  };
}

export const recoveryAcademySchemas = {
  organization: {
    "@type": "MedicalOrganization",
    name: "Stroke Recovery Academy",
    alternateName: "Sasquatch Recovery Academy",
    url: `${BASE_URL}/recovery`,
    logo: `${BASE_URL}/recovery-logo.png`,
    description: "Evidence-based stroke recovery platform with AI-powered rehabilitation exercises, community support, and the Sasquatch Doctrine methodology.",
    medicalSpecialty: ["Neurology", "Physical Medicine and Rehabilitation", "Occupational Therapy"],
    areaServed: { "@type": "Country", name: "Worldwide" },
    sameAs: ["https://twitter.com/strokerecovery"],
    slogan: "Never Zero. Always Forward.",
  },
  compassMethod: {
    "@type": "MedicalTherapy",
    name: "C.O.M.P.A.S.S. Recovery Method",
    alternateName: "Control · Own · Mutate · Patience · Anger · Small Wins · Stack",
    description: "The Builder's Full Navigation System for stroke recovery. Seven pillars: Control what you can, Own your pace, Mutate and adapt, Patience plus nutrition as fuel, Anger channeled as fuel, Small wins are sacred, Stack failures into success. Used alongside the S.A.S.C.H. Formula as an advanced recovery operating system.",
    relevantSpecialty: ["Neurology", "Physical Medicine and Rehabilitation"],
    procedureType: "Therapeutic",
    followup: "Daily pillar check-ins and progress tracking",
  },
  flickerLog: {
    "@type": "MedicalObservationalStudy",
    name: "Flicker Log",
    description: "Daily tracking system for micro-movements and recovery wins. Document every flicker of progress in your stroke recovery journey.",
    healthCondition: { "@type": "MedicalCondition", name: "Stroke" },
    studySubject: { "@type": "MedicalEntity", name: "Motor Recovery" },
  },
  neverZero: {
    "@type": "CreativeWork",
    name: "Never Zero Streak System",
    description: "Gamified consistency tracking ensuring survivors maintain daily recovery activities. Every day counts, no zero days allowed.",
    genre: "Health & Wellness",
    about: { "@type": "MedicalCondition", name: "Stroke Recovery" },
  },
  draftYourLegend: {
    "@type": "CreativeWork",
    name: "Draft Your Legend",
    description: "Stroke survivors write and publish their recovery stories, inspiring others while processing their journey through creative expression.",
    genre: "Memoir",
    accessMode: ["textual", "visual"],
  },
};

export function createRecoveryStorySchema(story: {
  title: string;
  author: string;
  datePublished: string;
  description: string;
  image?: string;
  recoveryMilestones?: string[];
}) {
  return {
    "@type": ["Article", "MedicalWebPage"],
    headline: story.title,
    description: story.description,
    author: {
      "@type": "Person",
      name: story.author,
      memberOf: { "@type": "Organization", name: "Stroke Recovery Academy" },
    },
    datePublished: story.datePublished,
    image: story.image,
    about: {
      "@type": "MedicalCondition",
      name: "Stroke",
      associatedAnatomy: { "@type": "AnatomicalStructure", name: "Brain" },
    },
    mainEntity: story.recoveryMilestones?.map((milestone, i) => ({
      "@type": "ItemListElement",
      position: i + 1,
      name: milestone,
    })),
    specialty: "Neurology",
  };
}

export function createExerciseSchema(exercise: {
  name: string;
  description: string;
  bodyLocation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration?: string;
  video?: string;
}) {
  return {
    "@type": "ExercisePlan",
    name: exercise.name,
    description: exercise.description,
    exerciseType: "Rehabilitation",
    activityDuration: exercise.duration || "PT10M",
    activityFrequency: "Daily",
    intensity: exercise.difficulty,
    workload: { "@type": "QuantitativeValue", name: exercise.difficulty },
    associatedAnatomy: { "@type": "AnatomicalStructure", name: exercise.bodyLocation },
    video: exercise.video ? { "@type": "VideoObject", contentUrl: exercise.video } : undefined,
  };
}

export function createMilestoneSchema(milestone: {
  name: string;
  description: string;
  dateAchieved: string;
  survivor: string;
}) {
  return {
    "@type": "AchieveAction",
    name: milestone.name,
    description: milestone.description,
    endTime: milestone.dateAchieved,
    agent: { "@type": "Person", name: milestone.survivor },
    object: { "@type": "MedicalCondition", name: "Stroke Recovery Progress" },
    result: { "@type": "Thing", name: `Achieved: ${milestone.name}` },
  };
}

export function createSupportGroupSchema(group: {
  name: string;
  description: string;
  memberCount: number;
  focusArea: string;
}) {
  return {
    "@type": "Organization",
    "@additionalType": "SupportGroup",
    name: group.name,
    description: group.description,
    memberOf: { "@type": "Organization", name: "Stroke Recovery Academy" },
    numberOfEmployees: { "@type": "QuantitativeValue", value: group.memberCount },
    knowsAbout: [group.focusArea, "Stroke Recovery", "Peer Support"],
  };
}

export const EEATSignals = {
  expertise: [
    "Evidence-based rehabilitation protocols",
    "AI-powered personalized recovery plans",
    "Professional medical content review",
    "Collaboration with rehabilitation specialists",
  ],
  experience: [
    "Platform built by stroke survivors for stroke survivors",
    "Real recovery stories and testimonials",
    "Community of 10,000+ active survivors",
    "Years of collective recovery experience",
  ],
  authoritativeness: [
    "Referenced by rehabilitation professionals",
    "Featured in medical publications",
    "Partnerships with stroke foundations",
    "Verified medical information sources",
  ],
  trustworthiness: [
    "HIPAA-compliant data handling",
    "Transparent privacy policies",
    "Regular content audits",
    "Medical disclaimer and professional guidance",
    "Secure user data encryption",
  ],
};
