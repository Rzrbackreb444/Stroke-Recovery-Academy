import { Helmet } from "react-helmet-async";
import { safeJsonLd } from "@/lib/safeJsonLd";

const RECOVERY_BASE_URL = "https://strokerecoveryacademy.com";
const KREAITE_BASE_URL = "https://strokerecoveryacademy.com";
const TODAY = new Date().toISOString().split("T")[0];

export const NICK_KREMERS_SCHEMA = {
  "@type": ["Person", "Patient"],
  "@id": `${RECOVERY_BASE_URL}/recovery/about-nick#nick-kremers`,
  name: "Nick Kremers",
  alternateName: "The Stroked Out Sasquatch",
  description:
    "Nick Kremers is a stroke survivor who recovered from 0% to 90% functional ability through relentless rehabilitation, neuroplasticity-based training, and the Sasquatch Method. Founder of Stroke Recovery Academy and author of three stroke recovery books.",
  url: `${RECOVERY_BASE_URL}/recovery/about-nick`,
  image: `${RECOVERY_BASE_URL}/images/nick-kremers.jpg`,
  jobTitle: "Stroke Recovery Coach, Author & Platform Founder",
  worksFor: {
    "@type": "MedicalOrganization",
    name: "Stroke Recovery Academy",
    url: RECOVERY_BASE_URL,
  },
  knowsAbout: [
    "Stroke rehabilitation",
    "Neuroplasticity",
    "Physical therapy for stroke",
    "Cognitive rehabilitation",
    "Mirror therapy",
    "Baseball bat therapy",
    "Drop foot recovery",
    "Stroke survivor mindset",
    "Post-stroke depression management",
    "Speech therapy for aphasia",
    "Upper extremity rehabilitation",
    "Gait and balance training",
  ],
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "Personal Experience",
    description:
      "First-hand stroke survivor with documented recovery from 0% to 90% functional ability, author of three comprehensive stroke recovery books",
  },
  award: [
    "Stroke survivor — 0% to 90% recovery achievement",
    "Author of The Stroked Out Sasquatch",
    "Author of The Ultimate Stroke Recovery Revolution",
    "Creator of the S.A.S.C.H. Formula (Seize-Absorb-Swing-Combine-Hammer)",
  ],
  sameAs: [
    `${RECOVERY_BASE_URL}/recovery/about-nick`,
    "https://www.tiktok.com/@nickkremers",
    "https://www.facebook.com/NicholasKremersSr",
    "https://www.facebook.com/strokerecoveryacademy",
    "https://twitter.com/strokerecovery",
    "https://www.youtube.com/@strokerecoveryacademy",
  ],
  homeLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lavaca",
      addressRegion: "AR",
      addressCountry: "US",
    },
  },
};

export const STROKE_RECOVERY_ORG_SCHEMA = {
  "@type": "MedicalOrganization",
  "@id": `${RECOVERY_BASE_URL}/#organization`,
  name: "Stroke Recovery Academy",
  alternateName: ["StrokeRecoveryAcademy.com", "Sasquatch Recovery Academy"],
  url: RECOVERY_BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${RECOVERY_BASE_URL}/images/stroke-recovery-academy-logo.png`,
    width: 400,
    height: 100,
  },
  description:
    "Stroke Recovery Academy is the world's most comprehensive stroke recovery platform, offering evidence-based rehabilitation protocols, AI-powered coaching, a 33-chapter curriculum, and a global community of stroke survivors. Founded by Nick Kremers, a stroke survivor who went from 0% to 90% functional recovery.",
  medicalSpecialty: [
    "Neurology",
    "Physical Medicine and Rehabilitation",
    "Occupational Therapy",
    "Speech-Language Pathology",
    "Neuropsychology",
  ],
  areaServed: { "@type": "Country", name: "Worldwide" },
  founder: NICK_KREMERS_SCHEMA,
  foundingDate: "2023",
  slogan: "Never Zero. Always Forward. Rebuild. Rewire. Rise.",
  knowsAbout: [
    "Stroke recovery",
    "Neuroplasticity",
    "Rehabilitation medicine",
    "Physical therapy",
    "Occupational therapy",
    "Speech-language therapy",
    "Cognitive rehabilitation",
    "Post-stroke depression",
    "Mirror therapy",
    "Constraint-induced movement therapy",
  ],
  sameAs: [
    "https://www.tiktok.com/@nickkremers",
    "https://www.facebook.com/strokerecoveryacademy",
    "https://www.facebook.com/NicholasKremersSr",
    "https://twitter.com/strokerecovery",
    "https://www.youtube.com/@strokerecoveryacademy",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "info@strokerecoveryacademy.com",
    availableLanguage: ["English"],
  },
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "Healthcare Platform",
    description:
      "Evidence-based stroke recovery content developed by a stroke survivor with clinical research support",
  },
};

export const STROKE_CONDITION_SCHEMA = {
  "@type": "MedicalCondition",
  name: "Stroke",
  alternateName: [
    "Cerebrovascular Accident",
    "CVA",
    "Brain Attack",
    "Ischemic Stroke",
    "Hemorrhagic Stroke",
  ],
  description:
    "A stroke occurs when blood supply to part of the brain is cut off, causing brain cells to die. Stroke is the leading cause of long-term disability in the United States. Recovery is possible through neuroplasticity-based rehabilitation.",
  code: {
    "@type": "MedicalCode",
    codeValue: "I63",
    codingSystem: "ICD-10",
  },
  associatedAnatomy: {
    "@type": "AnatomicalStructure",
    name: "Brain",
    description: "The central nervous system organ affected by stroke",
  },
  possibleTreatment: [
    {
      "@type": "MedicalTherapy",
      name: "Physical Therapy",
      description:
        "Exercise-based rehabilitation to restore movement and strength",
    },
    {
      "@type": "MedicalTherapy",
      name: "Occupational Therapy",
      description: "Training to regain daily living skills and fine motor function",
    },
    {
      "@type": "MedicalTherapy",
      name: "Speech-Language Therapy",
      description:
        "Treatment for aphasia, dysphagia, and communication difficulties",
    },
    {
      "@type": "MedicalTherapy",
      name: "Neuroplasticity Training",
      description:
        "Targeted repetitive exercises that rewire neural pathways to bypass damaged brain tissue",
    },
    {
      "@type": "MedicalTherapy",
      name: "Mirror Therapy",
      description:
        "Visual feedback therapy using a mirror to improve arm and hand function after stroke",
    },
    {
      "@type": "MedicalTherapy",
      name: "Constraint-Induced Movement Therapy (CIMT)",
      description:
        "Restricting the unaffected limb to force use of the affected limb, accelerating motor recovery",
    },
  ],
  signOrSymptom: [
    { "@type": "MedicalSymptom", name: "Sudden weakness or numbness on one side" },
    { "@type": "MedicalSymptom", name: "Facial drooping" },
    { "@type": "MedicalSymptom", name: "Speech difficulty or slurring" },
    { "@type": "MedicalSymptom", name: "Vision problems" },
    { "@type": "MedicalSymptom", name: "Severe headache" },
    { "@type": "MedicalSymptom", name: "Loss of balance or coordination" },
  ],
  primaryPrevention: [
    "Blood pressure management",
    "Healthy diet",
    "Regular exercise",
    "Smoking cessation",
    "Limiting alcohol",
    "Managing diabetes and cholesterol",
  ],
};

export const SASQUATCH_METHOD_SCHEMA = {
  "@type": "MedicalTherapy",
  name: "The Sasquatch Method",
  alternateName: "66-Day Recovery Revolution",
  description:
    "A comprehensive 3-phase, 66-day stroke recovery methodology developed by Nick Kremers based on his personal journey from 0% to 90%+ recovery. The Method runs on three integrated systems: S.A.S.C.H. (daily formula — Seize, Absorb, Swing, Combine, Hammer), S.O.S. (daily reset — Survive, Organize, Strive), and C.O.M.P.A.S.S. (7-pillar long-game navigation — Control, Own, Mutate, Patience, Anger, Small Wins, Stack). It combines neuroplasticity science, mindset mastery, physical rehabilitation, and community support.",
  relevantSpecialty: [
    "Physical Medicine and Rehabilitation",
    "Neurology",
    "Neuropsychology",
  ],
  procedureType: "Therapeutic",
  followup: "Daily check-ins, streak tracking, and AI-powered coaching",
  recognizingAuthority: {
    "@type": "MedicalOrganization",
    name: "Stroke Recovery Academy",
  },
  study: {
    "@type": "MedicalObservationalStudy",
    description:
      "Personal recovery case study: 0% to 90% functional recovery through systematic rehabilitation over 2+ years",
  },
};

interface RecoverySEOProps {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  pageType?: "website" | "article" | "course" | "faq" | "medical" | "product";
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  faq?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  additionalSchema?: object | object[];
  speakableSelectors?: string[];
  noindex?: boolean;
  geoRegion?: string;
  geoPlaceName?: string;
  medicalDisclaimer?: boolean;
}

export default function RecoverySEO({
  title,
  description,
  canonical,
  keywords = [],
  pageType = "website",
  image,
  author = "Nick Kremers",
  publishedTime,
  modifiedTime,
  faq,
  breadcrumbs,
  additionalSchema,
  speakableSelectors,
  noindex = false,
  geoRegion = "US",
  geoPlaceName = "United States",
  medicalDisclaimer = true,
}: RecoverySEOProps) {
  const fullTitle = `${title} | Stroke Recovery Academy`;
  const canonicalUrl = canonical.startsWith("http")
    ? canonical
    : `${RECOVERY_BASE_URL}${canonical}`;
  const ogImage = image || `${RECOVERY_BASE_URL}/images/stroke-recovery-og.png`;

  const defaultKeywords = [
    "stroke recovery",
    "stroke rehabilitation",
    "stroke survivor",
    "neuroplasticity exercises",
    "stroke recovery exercises",
    "post-stroke therapy",
    "stroke recovery tips",
    "Nick Kremers",
    "Stroke Recovery Academy",
    "Sasquatch Method",
  ];
  const allKeywords = [...defaultKeywords, ...keywords].join(", ");

  const faqSchema = faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const breadcrumbSchema = breadcrumbs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: RECOVERY_BASE_URL,
          },
          ...breadcrumbs.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: crumb.name,
            item: crumb.url.startsWith("http")
              ? crumb.url
              : `${RECOVERY_BASE_URL}${crumb.url}`,
          })),
        ],
      }
    : null;

  const speakableSchema = speakableSelectors?.length
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: fullTitle,
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: speakableSelectors,
        },
        url: canonicalUrl,
      }
    : null;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": pageType === "medical" ? "MedicalWebPage" : "WebPage",
    name: fullTitle,
    description,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${RECOVERY_BASE_URL}/#website`,
      name: "Stroke Recovery Academy",
      url: RECOVERY_BASE_URL,
      publisher: {
        "@id": `${RECOVERY_BASE_URL}/#organization`,
      },
    },
    author: {
      "@type": "Person",
      name: author,
      "@id": `${RECOVERY_BASE_URL}/recovery/about-nick#nick-kremers`,
    },
    inLanguage: "en-US",
    dateModified: modifiedTime || TODAY,
    ...(publishedTime && { datePublished: publishedTime }),
    ...(pageType === "medical" && {
      medicalAudience: {
        "@type": "MedicalAudience",
        audienceType: "Patient",
        healthCondition: {
          "@type": "MedicalCondition",
          name: "Stroke",
        },
      },
      lastReviewed: TODAY,
      reviewedBy: {
        "@type": "Person",
        name: "Nick Kremers",
        description: "Stroke survivor and recovery specialist",
      },
    }),
  };

  const orgSchema = {
    "@context": "https://schema.org",
    ...STROKE_RECOVERY_ORG_SCHEMA,
  };

  const additionalSchemas = additionalSchema
    ? Array.isArray(additionalSchema)
      ? additionalSchema
      : [additionalSchema]
    : [];

  const allSchemas = [
    webPageSchema,
    orgSchema,
    faqSchema,
    breadcrumbSchema,
    speakableSchema,
    ...additionalSchemas,
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#C9941A" />
      <meta name="application-name" content="Stroke Recovery Academy" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Recovery Academy" />

      {geoRegion && <meta name="geo.region" content={geoRegion} />}
      {geoPlaceName && <meta name="geo.placename" content={geoPlaceName} />}
      <meta name="geo.position" content="38.8951;-77.0364" />
      <meta name="ICBM" content="38.8951, -77.0364" />

      <meta name="expertise" content="Stroke recovery, neuroplasticity, rehabilitation medicine" />
      <meta name="experience" content="First-hand stroke survivor recovery from 0% to 90% — documented multi-year journey" />
      <meta name="authoritativeness" content="Founded by Nick Kremers, stroke survivor and author of three comprehensive recovery books" />
      <meta name="trustworthiness" content="Evidence-based content, medical disclaimer provided, transparent methodology, survivor-built platform" />

      {medicalDisclaimer && (
        <meta
          name="medical-disclaimer"
          content="Content on Stroke Recovery Academy is for informational purposes only and does not constitute medical advice. Always consult your healthcare provider before beginning any rehabilitation program."
        />
      )}

      <meta
        property="og:type"
        content={
          pageType === "product"
            ? "product"
            : pageType === "article" || pageType === "medical"
            ? "article"
            : "website"
        }
      />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - Stroke Recovery Academy`} />
      <meta property="og:site_name" content="Stroke Recovery Academy" />
      <meta property="og:locale" content="en_US" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {(pageType === "article" || pageType === "medical") && (
        <meta property="article:author" content={`${RECOVERY_BASE_URL}/recovery/about-nick`} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@strokerecovery" />
      <meta name="twitter:creator" content="@strokerecovery" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${title} - Stroke Recovery Academy`} />

      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {allSchemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(s) }}
        />
      ))}
    </Helmet>
  );
}

export function createRecoveryCourseSchema(course: {
  name: string;
  description: string;
  url: string;
  numberOfLessons: number;
  durationHours: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  free?: boolean;
  price?: number;
  lessons?: Array<{
    name: string;
    url: string;
    position: number;
    description?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: `${RECOVERY_BASE_URL}${course.url}`,
    provider: {
      "@type": "MedicalOrganization",
      name: "Stroke Recovery Academy",
      url: RECOVERY_BASE_URL,
    },
    instructor: {
      "@type": "Person",
      name: "Nick Kremers",
      "@id": `${RECOVERY_BASE_URL}/recovery/about-nick#nick-kremers`,
      description: "Stroke survivor, 0% to 90% recovery, author and founder",
    },
    educationalLevel: course.level,
    numberOfCredits: course.numberOfLessons,
    timeRequired: `PT${course.durationHours}H`,
    inLanguage: "en-US",
    availableLanguage: "en",
    offers: {
      "@type": "Offer",
      price: course.free ? "0" : course.price?.toString() || "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${RECOVERY_BASE_URL}${course.url}`,
      category: course.free ? "Free" : "Subscription",
    },
    about: {
      "@type": "MedicalCondition",
      name: "Stroke Recovery",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${course.durationHours}H`,
    },
    ...(course.lessons?.length && {
      hasPart: course.lessons.map((lesson) => ({
        "@type": "LearningResource",
        name: lesson.name,
        url: `${RECOVERY_BASE_URL}${lesson.url}`,
        position: lesson.position,
        ...(lesson.description && { description: lesson.description }),
        learningResourceType: "Lesson",
        educationalLevel: course.level,
        inLanguage: "en-US",
        isAccessibleForFree: false,
        isPartOf: {
          "@type": "Course",
          name: course.name,
          url: `${RECOVERY_BASE_URL}${course.url}`,
        },
      })),
    }),
  };
}

export function createRecoveryProductSchema(product: {
  name: string;
  description: string;
  url: string;
  image?: string;
  /** Pass a verified current price in major-currency units. Omit when no
   *  authoritative price source is available — the schema will then ship
   *  without an `offers` block rather than guess and risk a Google
   *  "misleading information" flag. */
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  category: string;
  authorName?: string;
  authorUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  totalSales?: number;
}) {
  const url = product.url.startsWith("http") ? product.url : `${RECOVERY_BASE_URL}${product.url}`;
  const hasValidRating =
    typeof product.averageRating === "number" &&
    Number.isFinite(product.averageRating) &&
    product.averageRating > 0 &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0;
  const hasValidPrice =
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url,
    ...(product.image && { image: product.image }),
    category: product.category,
    brand: {
      "@type": "MedicalOrganization",
      name: "Stroke Recovery Academy",
      "@id": `${RECOVERY_BASE_URL}/#organization`,
    },
    ...(product.authorName && {
      author: {
        "@type": "Person",
        name: product.authorName,
        ...(product.authorUrl && { url: product.authorUrl }),
      },
    }),
    ...(hasValidPrice && {
      offers: {
        "@type": "Offer",
        price: (product.price as number).toFixed(2),
        priceCurrency: product.priceCurrency || "USD",
        availability: `https://schema.org/${product.availability || "InStock"}`,
        url,
        seller: {
          "@type": "MedicalOrganization",
          name: "Stroke Recovery Academy",
          "@id": `${RECOVERY_BASE_URL}/#organization`,
        },
      },
    }),
    ...(hasValidRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (product.averageRating as number).toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };
}

export function createRecoveryExerciseSchema(exercise: {
  name: string;
  description: string;
  bodyLocation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  repetitions?: number;
  sets?: number;
  benefits?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ExercisePlan",
    name: exercise.name,
    description: exercise.description,
    exerciseType: "Stroke Rehabilitation",
    activityDuration: exercise.duration,
    activityFrequency: "Daily",
    intensity: exercise.difficulty,
    repetitions: exercise.repetitions,
    sets: exercise.sets,
    associatedAnatomy: {
      "@type": "AnatomicalStructure",
      name: exercise.bodyLocation,
    },
    relevantCondition: {
      "@type": "MedicalCondition",
      name: "Stroke",
    },
    ...(exercise.benefits?.length && {
      result: exercise.benefits.map((b) => ({ "@type": "MedicalTherapy", name: b })),
    }),
  };
}

export function createRecoveryArticleSchema(article: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  topics?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["Article", "MedicalWebPage"],
    headline: article.headline,
    description: article.description,
    url: `${RECOVERY_BASE_URL}${article.url}`,
    image: article.image || `${RECOVERY_BASE_URL}/images/stroke-recovery-og.png`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Person",
      name: "Nick Kremers",
      "@id": `${RECOVERY_BASE_URL}/recovery/about-nick#nick-kremers`,
      url: `${RECOVERY_BASE_URL}/recovery/about-nick`,
    },
    publisher: {
      "@type": "MedicalOrganization",
      name: "Stroke Recovery Academy",
      url: RECOVERY_BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${RECOVERY_BASE_URL}/images/stroke-recovery-academy-logo.png`,
      },
    },
    about: {
      "@type": "MedicalCondition",
      name: "Stroke",
    },
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
    lastReviewed: article.dateModified || article.datePublished,
    reviewedBy: {
      "@type": "Person",
      name: "Nick Kremers",
      description: "Stroke survivor and recovery specialist",
    },
    ...(article.topics?.length && {
      keywords: article.topics.join(", "),
    }),
  };
}

export function createRecoveryHowToSchema(howTo: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; imageUrl?: string }>;
  totalTime?: string;
  tool?: string[];
  supply?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime || "PT30M",
    tool: howTo.tool?.map((t) => ({ "@type": "HowToTool", name: t })),
    supply: howTo.supply?.map((s) => ({ "@type": "HowToSupply", name: s })),
    step: howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.imageUrl && {
        image: { "@type": "ImageObject", url: step.imageUrl },
      }),
    })),
    about: {
      "@type": "MedicalCondition",
      name: "Stroke Recovery",
    },
  };
}

export function createLocalBusinessSchema(location: {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  address?: {
    city: string;
    state: string;
    country: string;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalOrganization", "LocalBusiness"],
    name: location.name,
    description: location.description,
    url: RECOVERY_BASE_URL,
    ...(location.latitude && location.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.latitude,
        longitude: location.longitude,
      },
    }),
    ...(location.address && {
      address: {
        "@type": "PostalAddress",
        addressLocality: location.address.city,
        addressRegion: location.address.state,
        addressCountry: location.address.country,
      },
    }),
    areaServed: {
      "@type": "Country",
      name: "Worldwide",
    },
    serviceType: "Stroke Recovery Education and Coaching",
  };
}
