// shared/seo/schemaGenerator.ts
//
// EEAT layer. Generates JSON-LD blocks tied together by stable @id references
// so search engines and AI answer engines can graph-merge Organization, Person,
// WebSite, and the per-page schema into one knowledge graph entry.
//
// Strategy:
//   - Every public page emits Organization + WebSite + Person (Nick) once.
//   - Every public page emits one schemaType-specific block (WebPage by default,
//     Article / MedicalWebPage / AboutPage / CollectionPage / Course / Service / Product
//     when the registry says so).
//   - All blocks are linked by @id so Google merges them.
//
// Output: an array of objects ready to be JSON.stringify'd into <script type="application/ld+json"> blocks.

import type { RouteEntry } from "./routeRegistry";

const SITE = "Stroke Recovery Academy";
const BRAND_KREAITE = "KreAIte.xyz";
const SITE_URL = "https://strokerecoveryacademy.com";
const FOUNDED = "2024";
const NICK_NAME = "Nick Kremers";

// Stable cross-reference IDs.
const ID_ORG = `${SITE_URL}/#organization`;
const ID_WEBSITE = `${SITE_URL}/#website`;
const ID_NICK = `${SITE_URL}/#nick`;

/** Organization JSON-LD — shared by every public page. */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ID_ORG,
    name: SITE,
    alternateName: [BRAND_KREAITE, "StrokeLyfe", "SRA"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description:
      "Survivor-led stroke recovery platform built by Nick Kremers — daily routines, neuroplasticity exercises, AI coach, 66-day challenge, and survivor community.",
    foundingDate: FOUNDED,
    founder: { "@id": ID_NICK },
    sameAs: [
      "https://www.youtube.com/@strokerecoveryacademy",
      "https://www.instagram.com/strokerecoveryacademy",
      "https://www.tiktok.com/@strokerecoveryacademy",
    ],
    knowsAbout: [
      "stroke recovery",
      "neuroplasticity",
      "hemiparesis",
      "aphasia",
      "stroke rehabilitation",
      "survivor support",
    ],
  };
}

/** Person JSON-LD — Nick Kremers, the platform's primary author/founder. */
export function generateNickPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ID_NICK,
    name: NICK_NAME,
    url: `${SITE_URL}/recovery/about-nick`,
    jobTitle: "Founder & Stroke Recovery Coach",
    description:
      "7-year stroke survivor who recovered from complete paralysis to 90% function. Founder of Stroke Recovery Academy and creator of the Sasquatch Method.",
    knowsAbout: [
      "stroke recovery",
      "neuroplasticity",
      "hemiparesis",
      "aphasia",
      "daily recovery routines",
      "survivor community",
    ],
    worksFor: { "@id": ID_ORG },
  };
}

/** WebSite JSON-LD with SearchAction — improves sitelinks search box. */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID_WEBSITE,
    url: SITE_URL,
    name: SITE,
    publisher: { "@id": ID_ORG },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** Per-page block. Returns an object keyed by the registry's schemaType, linked
 *  to Org / Person / WebSite via @id so Google graph-merges them. */
export function generatePageSchema(entry: RouteEntry, fullUrl: string): object {
  const today = new Date().toISOString().split("T")[0];
  const baseId = `${fullUrl}#${entry.schemaType.toLowerCase()}`;
  const author =
    entry.author === "nick"
      ? { "@id": ID_NICK }
      : { "@id": ID_ORG };
  const publisher = { "@id": ID_ORG };

  // Common scaffolding every page-type block shares.
  const common = {
    "@context": "https://schema.org",
    "@type": entry.schemaType,
    "@id": baseId,
    url: fullUrl,
    name: entry.title,
    description: entry.description,
    inLanguage: "en-US",
    isPartOf: { "@id": ID_WEBSITE },
    publisher,
  };

  switch (entry.schemaType) {
    case "Article":
      return {
        ...common,
        headline: entry.title,
        author,
        datePublished: "2024-01-01",
        dateModified: today,
        mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl },
      };
    case "MedicalWebPage":
      return {
        ...common,
        about: { "@type": "MedicalCondition", name: "Stroke" },
        audience: { "@type": "MedicalAudience", audienceType: "Patient" },
        author,
        reviewedBy: { "@id": ID_NICK },
        lastReviewed: today,
        datePublished: "2024-01-01",
        dateModified: today,
        specialty: "Neurology",
      };
    case "AboutPage":
      return { ...common, mainEntity: author };
    case "CollectionPage":
      return { ...common, dateModified: today };
    case "Product":
      return {
        ...common,
        brand: { "@id": ID_ORG },
      };
    case "Service":
      return {
        ...common,
        provider: { "@id": ID_ORG },
        areaServed: "Worldwide",
      };
    case "Course":
      return {
        ...common,
        provider: { "@id": ID_ORG },
      };
    case "FAQPage":
    case "ContactPage":
    case "WebPage":
    default:
      return { ...common, dateModified: today };
  }
}

/** Build the full JSON-LD bundle for a route. Org + WebSite + Person + page. */
export function generateRouteSchemas(
  entry: RouteEntry,
  fullUrl: string,
): object[] {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateNickPersonSchema(),
    generatePageSchema(entry, fullUrl),
  ];
}

/** Render JSON-LD blocks as serializable HTML script tags.
 *  CALLER is responsible for HTML-safe context — we strip `</script` tokens
 *  to prevent escape via injected content. */
export function renderJsonLdScripts(blocks: object[]): string {
  return blocks
    .map((b) => {
      const json = JSON.stringify(b).replace(/<\/script/gi, "<\\/script");
      return `<script type="application/ld+json">${json}</script>`;
    })
    .join("\n");
}
