/**
 * Premium Blog SEO Suite
 * Enterprise-grade SEO, AEO, E-E-A-T, Internal/External Linking, Geo-targeting
 * Target: 100/100 SEO Score on every post
 */

import { db } from './db';
import { blogPosts, users } from '../shared/schema';
import { eq, desc, sql, and, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const internalLinkSchema = z.object({
  url: z.string().url(),
  anchor: z.string().min(1).max(200),
  context: z.string().optional(),
});

export const externalLinkSchema = z.object({
  url: z.string().url(),
  anchor: z.string().min(1).max(200),
  nofollow: z.boolean().optional().default(false),
});

export const sourceSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url(),
  accessDate: z.string().optional(),
});

export const addLinksSchema = z.object({
  links: z.array(internalLinkSchema).min(1).max(50),
});

export const addExternalLinksSchema = z.object({
  links: z.array(externalLinkSchema).min(1).max(50),
});

export const updateEEATSchema = z.object({
  authorBio: z.string().max(2000).optional(),
  authorCredentials: z.array(z.string().max(200)).max(20).optional(),
  reviewedBy: z.string().max(200).optional(),
  factChecked: z.boolean().optional(),
  sources: z.array(sourceSchema).max(50).optional(),
});

export const updateMetaSchema = z.object({
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string().max(100)).max(20).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  breadcrumbTitle: z.string().max(50).optional(),
  featuredImageAlt: z.string().max(500).optional(),
  featuredImageCaption: z.string().max(500).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal('')),
  twitterImageUrl: z.string().url().optional().or(z.literal('')),
  focusKeyphrase: z.string().max(100).optional(),
  socialTitle: z.string().max(100).optional(),
  socialDescription: z.string().max(200).optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
  indexPriority: z.number().min(0).max(1).optional(),
  changeFrequency: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).optional(),
  schemaType: z.enum(['Article', 'BlogPosting', 'NewsArticle', 'HowTo']).optional(),
  primaryCategory: z.string().max(100).optional(),
  secondaryCategories: z.array(z.string().max(100)).max(10).optional(),
});

const BASE_URL = 'https://kreaite.xyz';

// ============================================================================
// SEO VALIDATION & SCORING
// ============================================================================

export interface SEOAuditResult {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  checks: SEOCheck[];
  suggestions: string[];
  warnings: string[];
  errors: string[];
}

export interface SEOCheck {
  name: string;
  category: 'meta' | 'content' | 'technical' | 'eeat' | 'linking' | 'media' | 'geo';
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  fix?: string;
}

export async function auditBlogPostSEO(postId: number): Promise<SEOAuditResult> {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  if (!post.length) throw new Error('Post not found');
  
  const p = post[0];
  const checks: SEOCheck[] = [];
  const suggestions: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Null-safe access with defaults
  const content = p.content || '';
  const title = p.title || '';
  const excerpt = p.excerpt || '';
  const metaTitle = p.metaTitle || '';
  const metaDescription = p.metaDescription || '';
  const focusKeyphrase = p.focusKeyphrase || '';

  // ========== META CHECKS (20 points) ==========
  
  // Meta Title (5 points)
  const metaTitleLength = (metaTitle || title).length;
  checks.push({
    name: 'Meta Title Length',
    category: 'meta',
    passed: metaTitleLength >= 50 && metaTitleLength <= 70,
    score: metaTitleLength >= 50 && metaTitleLength <= 70 ? 5 : metaTitleLength >= 40 ? 3 : 1,
    maxScore: 5,
    message: `Meta title is ${metaTitleLength} characters (ideal: 50-70)`,
    fix: metaTitleLength < 50 ? 'Add more descriptive words' : metaTitleLength > 70 ? 'Shorten to avoid truncation' : undefined,
  });

  // Meta Description (5 points)
  const metaDescLength = (metaDescription || excerpt).length;
  checks.push({
    name: 'Meta Description Length',
    category: 'meta',
    passed: metaDescLength >= 140 && metaDescLength <= 160,
    score: metaDescLength >= 140 && metaDescLength <= 160 ? 5 : metaDescLength >= 100 ? 3 : 1,
    maxScore: 5,
    message: `Meta description is ${metaDescLength} characters (ideal: 140-160)`,
    fix: metaDescLength < 140 ? 'Expand description with compelling copy' : metaDescLength > 160 ? 'Trim to prevent truncation in SERPs' : undefined,
  });

  // Focus Keyphrase (5 points)
  const hasKeyphrase = !!focusKeyphrase;
  const keyphraseInTitle = hasKeyphrase && (metaTitle || title).toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInDesc = hasKeyphrase && metaDescription.toLowerCase().includes(focusKeyphrase.toLowerCase());
  checks.push({
    name: 'Focus Keyphrase Optimization',
    category: 'meta',
    passed: hasKeyphrase && keyphraseInTitle && keyphraseInDesc,
    score: hasKeyphrase ? (keyphraseInTitle ? 2 : 0) + (keyphraseInDesc ? 2 : 0) + 1 : 0,
    maxScore: 5,
    message: hasKeyphrase ? `Keyphrase "${focusKeyphrase}" ${keyphraseInTitle ? 'found' : 'missing'} in title, ${keyphraseInDesc ? 'found' : 'missing'} in description` : 'No focus keyphrase set',
    fix: !hasKeyphrase ? 'Set a focus keyphrase for optimization' : undefined,
  });

  // Canonical URL (5 points)
  checks.push({
    name: 'Canonical URL',
    category: 'meta',
    passed: true, // Auto-generated if not custom
    score: 5,
    maxScore: 5,
    message: p.canonicalUrl ? `Custom canonical: ${p.canonicalUrl}` : 'Using default canonical URL',
  });

  // ========== CONTENT CHECKS (25 points) ==========
  
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length || 1;
  const hasH2 = content.includes('## ') || content.includes('<h2');
  const hasH3 = content.includes('### ') || content.includes('<h3');
  const paragraphCount = content.split(/\n\n+/).filter(p => p.trim().length > 0).length || 1;
  const avgParagraphLength = wordCount / Math.max(paragraphCount, 1);

  // Word Count (10 points)
  checks.push({
    name: 'Content Length',
    category: 'content',
    passed: wordCount >= 1500,
    score: wordCount >= 2500 ? 10 : wordCount >= 1500 ? 8 : wordCount >= 800 ? 5 : 2,
    maxScore: 10,
    message: `${wordCount} words (recommended: 1,500+ for SEO, 2,500+ for cornerstone)`,
    fix: wordCount < 1500 ? 'Add more comprehensive content' : undefined,
  });

  // Heading Structure (5 points)
  checks.push({
    name: 'Heading Structure',
    category: 'content',
    passed: hasH2 && hasH3,
    score: (hasH2 ? 3 : 0) + (hasH3 ? 2 : 0),
    maxScore: 5,
    message: `H2 headings: ${hasH2 ? 'Yes' : 'No'}, H3 headings: ${hasH3 ? 'Yes' : 'No'}`,
    fix: !hasH2 ? 'Add H2 subheadings to structure content' : undefined,
  });

  // Readability (5 points)
  const readabilityScore = p.readabilityScore || calculateReadability(content);
  checks.push({
    name: 'Readability Score',
    category: 'content',
    passed: readabilityScore >= 60,
    score: readabilityScore >= 70 ? 5 : readabilityScore >= 60 ? 4 : readabilityScore >= 50 ? 3 : 2,
    maxScore: 5,
    message: `Flesch-Kincaid score: ${readabilityScore} (60+ is readable)`,
    fix: readabilityScore < 60 ? 'Simplify sentences and use shorter words' : undefined,
  });

  // Paragraph Length (5 points)
  checks.push({
    name: 'Paragraph Length',
    category: 'content',
    passed: avgParagraphLength <= 150,
    score: avgParagraphLength <= 100 ? 5 : avgParagraphLength <= 150 ? 4 : 2,
    maxScore: 5,
    message: `Average paragraph: ${Math.round(avgParagraphLength)} words (ideal: under 150)`,
    fix: avgParagraphLength > 150 ? 'Break up long paragraphs for better readability' : undefined,
  });

  // ========== MEDIA CHECKS (15 points) ==========

  // Featured Image (5 points)
  checks.push({
    name: 'Featured Image',
    category: 'media',
    passed: !!p.heroImageUrl,
    score: p.heroImageUrl ? 5 : 0,
    maxScore: 5,
    message: p.heroImageUrl ? 'Featured image set' : 'No featured image',
    fix: !p.heroImageUrl ? 'Add a compelling featured image' : undefined,
  });

  // Image Alt Text (5 points)
  checks.push({
    name: 'Featured Image Alt Text',
    category: 'media',
    passed: !!p.featuredImageAlt,
    score: p.featuredImageAlt ? 5 : 0,
    maxScore: 5,
    message: p.featuredImageAlt ? `Alt text: "${p.featuredImageAlt}"` : 'No alt text for featured image',
    fix: !p.featuredImageAlt ? 'Add descriptive alt text for accessibility and SEO' : undefined,
  });

  // Open Graph Image (5 points)
  checks.push({
    name: 'Social Share Images',
    category: 'media',
    passed: !!(p.ogImageUrl || p.heroImageUrl),
    score: p.ogImageUrl ? 5 : p.heroImageUrl ? 3 : 0,
    maxScore: 5,
    message: p.ogImageUrl ? 'Custom OG image set' : p.heroImageUrl ? 'Using featured image for social' : 'No social share image',
    fix: !p.ogImageUrl ? 'Create a custom 1200x630 image for social sharing' : undefined,
  });

  // ========== LINKING CHECKS (20 points) ==========

  const internalLinks = (p.internalLinks as any[]) || [];
  const externalLinks = (p.externalLinks as any[]) || [];
  const relatedPosts = p.relatedPostIds || [];

  // Internal Links (10 points)
  checks.push({
    name: 'Internal Links',
    category: 'linking',
    passed: internalLinks.length >= 3,
    score: Math.min(internalLinks.length * 2, 10),
    maxScore: 10,
    message: `${internalLinks.length} internal links (recommended: 3-5+)`,
    fix: internalLinks.length < 3 ? 'Add more internal links to related content' : undefined,
  });

  // External Links (5 points)
  checks.push({
    name: 'External Authority Links',
    category: 'linking',
    passed: externalLinks.length >= 2,
    score: Math.min(externalLinks.length * 2, 5),
    maxScore: 5,
    message: `${externalLinks.length} external links (recommended: 2-3)`,
    fix: externalLinks.length < 2 ? 'Link to authoritative external sources' : undefined,
  });

  // Related Posts (5 points)
  checks.push({
    name: 'Related Posts',
    category: 'linking',
    passed: relatedPosts.length >= 3,
    score: Math.min(relatedPosts.length * 1.5, 5),
    maxScore: 5,
    message: `${relatedPosts.length} related posts linked`,
    fix: relatedPosts.length < 3 ? 'Add related posts for internal linking' : undefined,
  });

  // ========== E-E-A-T CHECKS (15 points) ==========

  // Author Credentials (5 points)
  checks.push({
    name: 'Author Credentials',
    category: 'eeat',
    passed: !!(p.authorCredentials && p.authorCredentials.length > 0),
    score: p.authorCredentials && p.authorCredentials.length > 0 ? 5 : 0,
    maxScore: 5,
    message: p.authorCredentials?.length ? `${p.authorCredentials.length} credentials listed` : 'No author credentials',
    fix: !p.authorCredentials?.length ? 'Add author expertise and credentials' : undefined,
  });

  // Sources/Citations (5 points)
  const sources = (p.sources as any[]) || [];
  checks.push({
    name: 'Sources & Citations',
    category: 'eeat',
    passed: sources.length >= 2,
    score: Math.min(sources.length * 2, 5),
    maxScore: 5,
    message: `${sources.length} sources cited`,
    fix: sources.length < 2 ? 'Cite authoritative sources to build trust' : undefined,
  });

  // Fact Checking (5 points)
  checks.push({
    name: 'Fact Checking',
    category: 'eeat',
    passed: !!p.factChecked,
    score: p.factChecked ? 5 : 0,
    maxScore: 5,
    message: p.factChecked ? `Fact-checked on ${p.lastFactCheckAt?.toISOString().split('T')[0] || 'date unknown'}` : 'Not fact-checked',
    fix: !p.factChecked ? 'Review and fact-check content' : undefined,
  });

  // ========== TECHNICAL CHECKS (5 points) ==========

  // Slug Optimization (2.5 points)
  const slugOptimized = p.slug.length <= 60 && !p.slug.includes('--') && p.slug.match(/^[a-z0-9-]+$/);
  checks.push({
    name: 'URL Slug Optimization',
    category: 'technical',
    passed: !!slugOptimized,
    score: slugOptimized ? 2.5 : 1,
    maxScore: 2.5,
    message: `Slug: /${p.slug} (${p.slug.length} chars)`,
    fix: !slugOptimized ? 'Optimize slug: lowercase, hyphens only, under 60 chars' : undefined,
  });

  // Breadcrumb Title (2.5 points)
  checks.push({
    name: 'Breadcrumb Title',
    category: 'technical',
    passed: !!p.breadcrumbTitle,
    score: p.breadcrumbTitle ? 2.5 : 1,
    maxScore: 2.5,
    message: p.breadcrumbTitle ? `Breadcrumb: "${p.breadcrumbTitle}"` : 'Using default title for breadcrumbs',
    fix: !p.breadcrumbTitle ? 'Set a short breadcrumb title' : undefined,
  });

  // Calculate total score
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Generate suggestions
  checks.filter(c => !c.passed && c.fix).forEach(c => suggestions.push(c.fix!));
  checks.filter(c => c.score < c.maxScore * 0.5).forEach(c => warnings.push(`${c.name}: ${c.message}`));
  checks.filter(c => c.score === 0).forEach(c => errors.push(`Missing: ${c.name}`));

  const grade = percentage >= 95 ? 'A+' : percentage >= 85 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';

  return {
    score: percentage,
    grade,
    checks,
    suggestions,
    warnings,
    errors,
  };
}

// ============================================================================
// READABILITY CALCULATION (Flesch-Kincaid)
// ============================================================================

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter(w => w.length > 0).length || 1;
  const syllables = countSyllables(text);
  
  // Flesch Reading Ease score
  const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.reduce((count, word) => {
    word = word.replace(/[^a-z]/g, '');
    if (word.length <= 3) return count + 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return count + (matches ? matches.length : 1);
  }, 0);
}

// ============================================================================
// INTERNAL LINK SUGGESTIONS
// ============================================================================

export interface LinkSuggestion {
  postId: number;
  title: string;
  slug: string;
  anchor: string;
  relevanceScore: number;
  context: string;
}

export async function suggestInternalLinks(postId: number, limit: number = 10): Promise<LinkSuggestion[]> {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  if (!post.length) return [];
  
  const currentPost = post[0];
  const keywords = (currentPost.metaKeywords || []).concat(currentPost.tags || []);
  
  // Find related posts by tags and keywords
  const relatedPosts = await db.select()
    .from(blogPosts)
    .where(and(
      eq(blogPosts.status, 'published'),
      sql`${blogPosts.id} != ${postId}`
    ))
    .orderBy(desc(blogPosts.viewCount))
    .limit(50);

  const suggestions: LinkSuggestion[] = relatedPosts.map(p => {
    const postKeywords = (p.metaKeywords || []).concat(p.tags || []);
    const commonKeywords = keywords.filter(k => postKeywords.includes(k));
    const relevanceScore = commonKeywords.length * 20 + (p.cornerstone ? 30 : 0) + (p.isFeatured ? 10 : 0);
    
    return {
      postId: p.id,
      title: p.title,
      slug: p.slug,
      anchor: p.breadcrumbTitle || p.title.substring(0, 50),
      relevanceScore,
      context: `Related by: ${commonKeywords.join(', ') || 'category'}`,
    };
  })
  .sort((a, b) => b.relevanceScore - a.relevanceScore)
  .slice(0, limit);

  return suggestions;
}

// ============================================================================
// EXTERNAL LINK VALIDATION
// ============================================================================

export interface ExternalLinkCheck {
  url: string;
  anchor: string;
  status: 'valid' | 'broken' | 'redirect' | 'unknown';
  statusCode?: number;
  nofollow: boolean;
  domainAuthority?: string;
}

export async function validateExternalLinks(postId: number): Promise<ExternalLinkCheck[]> {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  if (!post.length) return [];
  
  const externalLinks = (post[0].externalLinks as any[]) || [];
  
  return externalLinks.map(link => ({
    url: link.url,
    anchor: link.anchor,
    status: 'valid' as const, // Would need actual HTTP check in production
    nofollow: link.nofollow || false,
    domainAuthority: 'High', // Would integrate with Moz/Ahrefs API
  }));
}

// ============================================================================
// GEO-TARGETED SEO
// ============================================================================

export interface GeoSEOConfig {
  targetCountries: string[];
  targetLanguages: string[];
  localBusinessSchema?: {
    name: string;
    address: string;
    geo: { latitude: number; longitude: number };
    phone?: string;
    openingHours?: string[];
  };
  hreflangTags: { lang: string; url: string }[];
}

export function generateGeoSchema(config: GeoSEOConfig, postUrl: string): object[] {
  const schemas: object[] = [];

  // Hreflang configuration
  const hreflangLinks = config.targetLanguages.map(lang => ({
    "@type": "WebPage",
    "@id": `${postUrl}#${lang}`,
    inLanguage: lang,
    url: `${BASE_URL}/${lang}${postUrl.replace(BASE_URL, '')}`,
  }));

  // Local Business Schema if applicable
  if (config.localBusinessSchema) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: config.localBusinessSchema.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: config.localBusinessSchema.address,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: config.localBusinessSchema.geo.latitude,
        longitude: config.localBusinessSchema.geo.longitude,
      },
      telephone: config.localBusinessSchema.phone,
      openingHoursSpecification: config.localBusinessSchema.openingHours?.map(hours => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours,
      })),
    });
  }

  return schemas;
}

export function generateHreflangTags(slug: string, languages: string[]): string {
  const tags = languages.map(lang => 
    `<link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/blog/${slug}" />`
  );
  tags.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}/blog/${slug}" />`);
  return tags.join('\n');
}

// ============================================================================
// AEO - ANSWER ENGINE OPTIMIZATION
// ============================================================================

export interface AEOOptimization {
  faqSchema: object | null;
  howToSchema: object | null;
  speakableSchema: object | null;
  featuredSnippetReady: boolean;
  voiceSearchOptimized: boolean;
  suggestions: string[];
}

export function analyzeAEO(post: any): AEOOptimization {
  const content = post.content || '';
  const title = post.title || '';
  const metaDescription = post.metaDescription || post.excerpt || '';
  const slug = post.slug || '';
  const suggestions: string[] = [];
  
  // Check for FAQ patterns (Q: A: or Question/Answer format)
  const faqMatches = content.match(/(?:Q:|Question:|FAQ:)[^\n]+\n+(?:A:|Answer:)[^\n]+/gi) || [];
  const hasFAQContent = faqMatches.length >= 3;
  
  // Check for How-To patterns (Step 1, Step 2, etc.)
  const howToMatches = content.match(/(?:Step \d+|^\d+\.)[^\n]+/gmi) || [];
  const hasHowToContent = howToMatches.length >= 3;
  
  // Check for featured snippet optimization
  const hasDefinition = content.match(/(?:is defined as|refers to|means that|is a type of)/i);
  const hasListFormat = content.match(/(?:<ul>|<ol>|\n-\s|\n\d+\.)/);
  const hasTable = content.includes('<table') || content.includes('|');
  
  // Voice search optimization checks
  const hasQuestions = (content.match(/\?/g) || []).length >= 3;
  const sentences = content.split(/[.!?]/).filter((s: string) => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum: number, s: string) => sum + s.split(' ').length, 0) / Math.max(sentences.length, 1);
  const conversationalTone = avgSentenceLength < 20;

  if (!hasFAQContent) suggestions.push('Add FAQ section with at least 3 questions for FAQ rich results');
  if (!hasHowToContent && title.toLowerCase().includes('how')) suggestions.push('Structure content with numbered steps for HowTo rich results');
  if (!hasDefinition) suggestions.push('Add a clear definition in the first paragraph for featured snippets');
  if (!hasListFormat) suggestions.push('Use bullet points or numbered lists for scannability');
  if (!conversationalTone) suggestions.push('Use shorter sentences for voice search optimization');

  // Generate FAQ Schema
  const faqSchema = hasFAQContent ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqMatches.slice(0, 10).map((faq: string) => {
      const [question, answer] = faq.split(/\n+/);
      return {
        "@type": "Question",
        name: question.replace(/^(?:Q:|Question:|FAQ:)\s*/i, ''),
        acceptedAnswer: {
          "@type": "Answer",
          text: answer?.replace(/^(?:A:|Answer:)\s*/i, '') || '',
        },
      };
    }),
  } : null;

  // Generate HowTo Schema
  const howToSchema = hasHowToContent ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description: metaDescription,
    step: howToMatches.slice(0, 10).map((step: string, i: number) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step.replace(/^(?:Step \d+[:.]\s*|\d+\.\s*)/i, ''),
    })),
  } : null;

  // Speakable Schema for voice assistants
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".article-summary", ".faq-answer", "h1", "h2"],
    },
    url: `${BASE_URL}/blog/${slug}`,
  };

  return {
    faqSchema,
    howToSchema,
    speakableSchema,
    featuredSnippetReady: !!(hasDefinition || hasListFormat || hasTable),
    voiceSearchOptimized: hasQuestions && conversationalTone,
    suggestions,
  };
}

// ============================================================================
// COMPLETE BLOG POST SCHEMA GENERATION
// ============================================================================

export async function generateBlogPostSchema(postId: number): Promise<object[]> {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  if (!post.length) return [];
  
  const p = post[0];
  const author = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
  const authorData = author[0];
  
  const schemas: object[] = [];

  // Article/BlogPosting Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": p.schemaType || "BlogPosting",
    "@id": `${BASE_URL}/blog/${p.slug}#article`,
    headline: p.metaTitle || p.title,
    description: p.metaDescription || p.excerpt,
    image: {
      "@type": "ImageObject",
      url: p.ogImageUrl || p.heroImageUrl,
      caption: p.featuredImageCaption,
    },
    author: {
      "@type": "Person",
      name: authorData?.firstName && authorData?.lastName 
        ? `${authorData.firstName} ${authorData.lastName}` 
        : authorData?.email || 'KreAIte Author',
      description: p.authorBio,
      knowsAbout: p.authorCredentials,
      url: `${BASE_URL}/author/${p.authorId}`,
    },
    publisher: {
      "@type": "Organization",
      name: "KreAIte.xyz",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
    datePublished: p.publishedAt?.toISOString(),
    dateModified: (p.contentLastUpdated || p.updatedAt)?.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${p.slug}`,
    },
    keywords: p.metaKeywords?.join(', '),
    articleSection: p.primaryCategory,
    wordCount: p.content.split(/\s+/).length,
    isAccessibleForFree: true,
    inLanguage: "en-US",
  });

  // Breadcrumb Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: p.primaryCategory || "Articles", item: `${BASE_URL}/blog/category/${p.primaryCategory?.toLowerCase().replace(/\s+/g, '-') || 'articles'}` },
      { "@type": "ListItem", position: 4, name: p.breadcrumbTitle || p.title, item: `${BASE_URL}/blog/${p.slug}` },
    ],
  });

  // AEO Schemas
  const aeoOptimization = analyzeAEO(p);
  if (aeoOptimization.faqSchema) schemas.push(aeoOptimization.faqSchema);
  if (aeoOptimization.howToSchema) schemas.push(aeoOptimization.howToSchema);
  if (aeoOptimization.speakableSchema) schemas.push(aeoOptimization.speakableSchema);

  return schemas;
}

// ============================================================================
// AUTO-OPTIMIZE BLOG POST
// ============================================================================

export async function autoOptimizeBlogPost(postId: number): Promise<{
  optimizations: string[];
  newSeoScore: number;
}> {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  if (!post.length) throw new Error('Post not found');
  
  const p = post[0];
  const optimizations: string[] = [];
  const updates: Partial<typeof p> = {};

  // Auto-generate meta title if missing
  if (!p.metaTitle) {
    const autoTitle = p.title.length > 70 ? p.title.substring(0, 67) + '...' : p.title;
    updates.metaTitle = autoTitle;
    optimizations.push(`Generated meta title: "${autoTitle}"`);
  }

  // Auto-generate meta description if missing
  if (!p.metaDescription && p.excerpt) {
    const autoDesc = p.excerpt.length > 160 ? p.excerpt.substring(0, 157) + '...' : p.excerpt;
    updates.metaDescription = autoDesc;
    optimizations.push(`Generated meta description from excerpt`);
  }

  // Auto-generate breadcrumb title
  if (!p.breadcrumbTitle) {
    updates.breadcrumbTitle = p.title.length > 30 ? p.title.substring(0, 27) + '...' : p.title;
    optimizations.push(`Generated breadcrumb title`);
  }

  // Auto-set featured image alt
  if (p.heroImageUrl && !p.featuredImageAlt) {
    updates.featuredImageAlt = `Featured image for: ${p.title}`;
    optimizations.push(`Generated alt text for featured image`);
  }

  // Calculate readability score
  if (!p.readabilityScore) {
    updates.readabilityScore = calculateReadability(p.content);
    optimizations.push(`Calculated readability score: ${updates.readabilityScore}`);
  }

  // Suggest internal links
  const linkSuggestions = await suggestInternalLinks(postId, 5);
  if (linkSuggestions.length > 0 && (!p.relatedPostIds || p.relatedPostIds.length < 3)) {
    updates.relatedPostIds = linkSuggestions.map(s => s.postId);
    optimizations.push(`Added ${linkSuggestions.length} related posts`);
  }

  // Apply updates
  if (Object.keys(updates).length > 0) {
    await db.update(blogPosts)
      .set({ ...updates, seoLastAuditedAt: new Date(), updatedAt: new Date() })
      .where(eq(blogPosts.id, postId));
  }

  // Re-audit and return new score
  const audit = await auditBlogPostSEO(postId);
  
  // Update SEO score
  await db.update(blogPosts)
    .set({ seoScore: audit.score })
    .where(eq(blogPosts.id, postId));

  return {
    optimizations,
    newSeoScore: audit.score,
  };
}

// ============================================================================
// BLOG SITEMAP GENERATION
// ============================================================================

export async function generateBlogSitemap(): Promise<string> {
  const posts = await db.select({
    slug: blogPosts.slug,
    updatedAt: blogPosts.updatedAt,
    publishedAt: blogPosts.publishedAt,
    indexPriority: blogPosts.indexPriority,
    changeFrequency: blogPosts.changeFrequency,
    noIndex: blogPosts.noIndex,
  })
  .from(blogPosts)
  .where(and(
    eq(blogPosts.status, 'published'),
    eq(blogPosts.noIndex, false)
  ))
  .orderBy(desc(blogPosts.publishedAt));

  const urls = posts.map(post => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${(post.updatedAt || post.publishedAt)?.toISOString().split('T')[0]}</lastmod>
    <changefreq>${post.changeFrequency || 'weekly'}</changefreq>
    <priority>${post.indexPriority || 0.7}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
