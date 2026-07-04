// SSR shell — server-rendered HTML for SEO landing pages.
// Pixel-matches dark/gold theme of the live SPA so search-engine cache + first paint
// look identical. JS still hydrates the SPA on top of this when the user clicks through.

export interface FAQItem {
  q: string;
  a: string;
}

export interface InternalLink {
  href: string;
  label: string;
  blurb?: string;
}

export interface ContentSection {
  h2?: string;
  /** Alias for h2 — accepted interchangeably */
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Optional illustration: served from /images/blog/ */
  image?: { src: string; alt: string; caption?: string } | string;
  /** Footnote-style external citation links rendered below section content */
  externalLinks?: { label: string; href?: string; url?: string; note?: string }[];
  /** Inline product cards — affiliate tag applied server-side via tagAmazonLink */
  products?: { name: string; price: string; link: string; note: string }[];
  /** Inline cross-links to related posts — renders a "Also check out" line in the section */
  relatedLinks?: { href: string; label: string }[];
  /**
   * Comparison table — rendered as HTML table with headers + rows.
   * Use for product comparisons, feature matrices, price breakdowns.
   */
  table?: {
    headers: string[];
    rows: string[][];
    caption?: string;
  };
  /** Inline step-by-step instructions — renders numbered steps for HowTo schema */
  steps?: { name: string; text: string; image?: string }[];
  /**
   * Optional pre-sanitized HTML appended after paragraphs/bullets.
   * Only use for trusted, server-controlled content (e.g. SSR center cards).
   */
  rawHtml?: string;
  /** Alias for rawHtml — accepts trusted HTML body string */
  body?: string;
}

export interface SsrPageConfig {
  url: string;                       // canonical path, e.g. /learn/neuroplasticity-after-stroke
  title: string;                     // <title> — keep ≤ 65 chars
  description: string;               // <meta description> — 140-160 chars
  h1: string;
  hero: { eyebrow?: string; subhead: string; ctaPrimary?: { href: string; label: string }; ctaSecondary?: { href: string; label: string } };
  sections: ContentSection[];
  faqs: FAQItem[];
  related: InternalLink[];
  publishedDate?: string;            // ISO; defaults to a fixed date
  modifiedDate?: string;             // ISO; defaults to today
  keywords?: string[];
  schemaType?: 'Article' | 'MedicalWebPage' | 'WebPage';
  breadcrumbs?: { name: string; href: string }[];
  /** Optional product card for affiliate/gear showcase */
  productCard?: {
    title?: string;
    /** Alias for title */
    name?: string;
    description: string;
    link: string;
    label: string;
    note?: string;
  };
  /** Optional book promotion CTA */
  bookPromo?: {
    title: string;
    description: string;
    link: string;
    label: string;
  };
  /** Optional featured image URL for og:image, hero image, and schema */
  image?: string;
  /** Optional video — enables VideoObject schema for rich video snippets */
  video?: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration: string; // ISO 8601 duration, e.g. "PT8M32S"
    contentUrl?: string;
    embedUrl?: string;
  };
}

const SITE_URL = 'https://strokerecoveryacademy.com';
const AUTHOR = {
  name: 'Nick Kremers',
  bio: '7-year stroke survivor who went from complete paralysis to 90% recovery. Founder of Stroke Recovery Academy and creator of the Sasquatch Method.',
  url: `${SITE_URL}/recovery/about-nick`,
  image: `${SITE_URL}/images/blog/nick-author-bio.jpg`,
};

function tagAmazonLink(url: string): string {
  const tag = process.env.AMAZON_AFFILIATE_TAG;
  if (!tag || !url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.includes('amazon.')) return url;
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return url;
  }
}

function esc(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(s: string | undefined | null): string {
  return esc(s);
}

function jsonLd(obj: unknown): string {
  // Strip </script> from any string values defensively.
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script');
}

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ');
}

// Single source of truth for word count. Counts structured fields AND the
// trusted rawHtml/body path (DB-backed recovery blog posts render their whole
// body as rawHtml — without this they'd report wordCount:0 / "1 min read").
function countWords(sections: ContentSection[]): number {
  let words = 0;
  for (const s of sections) {
    if (s.paragraphs) words += s.paragraphs.reduce((a, p) => a + p.split(/\s+/).filter(Boolean).length, 0);
    if (s.bullets) words += s.bullets.reduce((a, b) => a + b.split(/\s+/).filter(Boolean).length, 0);
    if (s.table) words += s.table.rows.reduce((a, r) => a + r.reduce((b, c) => b + c.split(/\s+/).filter(Boolean).length, 0), 0);
    if (s.steps) words += s.steps.reduce((a, st) => a + st.name.split(/\s+/).filter(Boolean).length + st.text.split(/\s+/).filter(Boolean).length, 0);
    const raw = s.rawHtml || s.body;
    if (raw) words += stripHtmlToText(raw).split(/\s+/).filter(Boolean).length;
  }
  return words;
}

function estimateReadingTime(sections: ContentSection[]): number {
  return Math.max(1, Math.round(countWords(sections) / 200));
}

function buildArticleSchema(cfg: SsrPageConfig): object {
  const url = `${SITE_URL}${cfg.url}`;
  const date = cfg.publishedDate || '2026-01-15';
  const modified = cfg.modifiedDate || cfg.publishedDate || '2026-01-15';
  const readTime = estimateReadingTime(cfg.sections);
  // Prefer the featured image, then first section image, then default
  const featuredImage = cfg.image;
  const firstSectionImage = cfg.sections.find(s => s.image)?.image;
  const chosenImage = featuredImage || (firstSectionImage
    ? (typeof firstSectionImage === 'string' ? firstSectionImage : firstSectionImage.src)
    : null);
  const imageUrl = chosenImage ? `${SITE_URL}${chosenImage}` : `${SITE_URL}/og-image.jpg`;
  return {
    '@context': 'https://schema.org',
    '@type': cfg.schemaType === 'MedicalWebPage' ? 'MedicalWebPage' : 'Article',
    headline: cfg.h1,
    description: cfg.description,
    url,
    datePublished: date,
    dateModified: modified,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      description: AUTHOR.bio,
      url: AUTHOR.url,
      image: AUTHOR.image,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stroke Recovery Academy',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: imageUrl,
    ...(cfg.keywords && cfg.keywords.length > 0 ? { keywords: cfg.keywords.join(', ') } : {}),
    ...(cfg.schemaType === 'MedicalWebPage' ? {
      medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
      lastReviewed: modified,
    } : {}),
    // Word count and reading time for rich snippet eligibility
    wordCount: countWords(cfg.sections),
    timeRequired: `PT${readTime}M`,
  };
}

function buildHowToSchema(cfg: SsrPageConfig): object | null {
  const steps = cfg.sections.flatMap(s => s.steps || []);
  if (steps.length === 0) return null;
  const url = `${SITE_URL}${cfg.url}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: cfg.h1,
    description: cfg.description,
    url,
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image ? { image: { '@type': 'ImageObject', url: `${SITE_URL}${step.image}` } } : {}),
    })),
  };
}

function buildProductReviewSchema(cfg: SsrPageConfig): object | null {
  const pc = cfg.productCard;
  if (!pc) return null;
  const url = `${SITE_URL}${cfg.url}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: pc.title || pc.name || cfg.h1,
    reviewBody: pc.description,
    url,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
      image: AUTHOR.image,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stroke Recovery Academy',
      url: SITE_URL,
    },
    itemReviewed: {
      '@type': 'Product',
      name: pc.title || pc.name || cfg.h1,
      description: pc.description,
      url: pc.link,
      offers: {
        '@type': 'Offer',
        url: pc.link,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  };
}

function buildFaqSchema(faqs: FAQItem[]): object | null {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function buildBreadcrumbSchema(cfg: SsrPageConfig): object | null {
  const crumbs = cfg.breadcrumbs;
  if (!crumbs || crumbs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href}`,
    })),
  };
}

function buildVideoObjectSchema(cfg: SsrPageConfig): object | null {
  const v = cfg.video;
  if (!v) return null;
  // Only emit VideoObject when a real video is actually present on the page.
  // Schema-only video (no contentUrl/embedUrl, no player) violates Google's
  // structured-data policy and can suppress rankings.
  if (!v.contentUrl && !v.embedUrl) return null;
  const url = `${SITE_URL}${cfg.url}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.name,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl.startsWith('http') ? v.thumbnailUrl : `${SITE_URL}${v.thumbnailUrl}`,
    uploadDate: v.uploadDate,
    duration: v.duration,
    ...(v.contentUrl ? { contentUrl: v.contentUrl.startsWith('http') ? v.contentUrl : `${SITE_URL}${v.contentUrl}` } : {}),
    ...(v.embedUrl ? { embedUrl: v.embedUrl.startsWith('http') ? v.embedUrl : `${SITE_URL}${v.embedUrl}` } : {}),
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stroke Recovery Academy',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-512.png`,
      },
    },
  };
}

function renderHeader(): string {
  return `
<header class="sra-header">
  <a href="/" class="sra-logo" aria-label="Stroke Recovery Academy home">
    <span class="sra-logo-mark" aria-hidden="true"></span>
    <span class="sra-logo-text">Stroke Recovery Academy</span>
  </a>
  <nav class="sra-nav" aria-label="Primary">
    <a href="/recovery/university">University</a>
    <a href="/recovery/exercises">Exercises</a>
    <a href="/recovery/challenge">66-Day Challenge</a>
    <a href="/blog">Blog</a>
    <a href="/recovery/center-finder">Center Finder</a>
    <a href="/recovery/pricing" class="sra-cta-btn">Start Free</a>
  </nav>
</header>`;
}

function renderFooter(): string {
  // nosemgrep: javascript.lang.security.html-in-template-string
  return `
<footer class="sra-footer">
  <div class="sra-footer-grid">
    <div class="sra-footer-col">
      <div class="sra-footer-title">Who it's for</div>
      <a href="/for/stroke-survivors">Stroke survivors</a>
      <a href="/for/caregivers">Caregivers</a>
      <a href="/for/young-stroke-survivors">Young survivors</a>
      <a href="/for/spouses">Spouses</a>
      <a href="/for/therapists">Therapists</a>
    </div>
    <div class="sra-footer-col">
      <div class="sra-footer-title">Programs</div>
      <a href="/programs/sasquatch-method">The Sasquatch Method</a>
      <a href="/programs/66-day-challenge">66-Day Challenge</a>
      <a href="/programs/daily-routine">Daily Routine</a>
      <a href="/recovery/university">Recovery University</a>
    </div>
    <div class="sra-footer-col">
      <div class="sra-footer-title">Learn</div>
      <a href="/learn/neuroplasticity-after-stroke">Neuroplasticity</a>
      <a href="/learn/hemiparesis-recovery">Hemiparesis</a>
      <a href="/learn/stroke-recovery-exercises-at-home">Exercises at home</a>
      <a href="/learn/aphasia-recovery">Aphasia recovery</a>
      <a href="/learn/depression-after-stroke">Depression after stroke</a>
      <a href="/learn/stroke-recovery-timeline">Recovery timeline</a>
    </div>
    <div class="sra-footer-col">
      <div class="sra-footer-title">Resources</div>
      <a href="/recovery/center-finder">Find a recovery center</a>
      <a href="/blog">Survivor blog</a>
      <a href="/recovery/about-nick">About Nick</a>
      <a href="/recovery/pricing">Pricing</a>
    </div>
  </div>
  <div class="sra-footer-bottom">
    <span>© ${new Date().getFullYear()} Stroke Recovery Academy. Built by a survivor, for survivors.</span>
    <span><a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></span>
  </div>
</footer>`;
}

function sectionSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function renderEmailCapture(variant: 'inline' | 'final' = 'inline'): string {
  const heading = variant === 'final'
    ? 'Get the free stroke recovery cheat sheet'
    : 'The cheat sheet I wish I had on day one';
  const sub = variant === 'final'
    ? 'One email. The first-90-days moves, plus the weekly field notes I send survivors and caregivers. No spam — unsubscribe anytime.'
    : 'First-90-days moves from a 7-year survivor. Drop your email — I\'ll send the cheat sheet and my weekly field notes.';
  return `
<section class="sra-email-capture">
  <h2>${esc(heading)}</h2>
  <p>${esc(sub)}</p>
  <form class="sra-email-form" method="POST" action="/api/newsletter/subscribe-form">
    <input type="text" name="hp_field" class="sra-hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
    <input type="hidden" name="source" value="blog" />
    <input type="email" name="email" required placeholder="you@email.com" aria-label="Email address" class="sra-email-input" />
    <button type="submit" class="sra-btn-primary">Send me the cheat sheet</button>
  </form>
  <div class="sra-email-fineprint">No spam. Unsubscribe anytime. Written by a survivor, not a marketing team.</div>
</section>`;
}

function renderSections(sections: ContentSection[]): string {
  const blocks = sections.map((s, idx) => {
    const heading = s.h2 || s.heading || '';
    const html = s.rawHtml || s.body || '';
    const slug = heading ? sectionSlug(heading) : `section-${idx}`;
    const id = heading ? `id="${slug}"` : '';
    // normalise image to object form
    const img = s.image
      ? (typeof s.image === 'string'
          ? { src: s.image, alt: '', caption: undefined }
          : s.image)
      : null;
    return `
<section class="sra-section" ${id}>
  ${heading ? `<h2>${esc(heading)}</h2>` : ''}
  ${Array.isArray(s.paragraphs) && s.paragraphs.length > 0 ? s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n  ') : ''}
  ${s.bullets && s.bullets.length > 0 ? `<ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  ${img ? `<figure class="sra-blog-fig">
    <img src="${escAttr(img.src)}" alt="${escAttr(img.alt || '')}" class="sra-blog-img" loading="lazy" width="680" />
    ${img.caption ? `<figcaption class="sra-blog-caption">${esc(img.caption)}</figcaption>` : ''}
  </figure>` : ''}
  ${s.products && s.products.length > 0 ? `<div class="sra-product-grid">${s.products.map(p => `
  <div class="sra-product-card">
    <div class="sra-product-card-name">${esc(p.name)}</div>
    <div class="sra-product-card-price">${esc(p.price)}</div>
    <p class="sra-product-card-note">${esc(p.note)}</p>
    <a href="${escAttr(tagAmazonLink(p.link))}" class="sra-product-card-link" target="_blank" rel="noopener noreferrer sponsored nofollow">View on Amazon ↗</a>
  </div>`).join('')}</div>` : ''}
  ${s.externalLinks && s.externalLinks.length > 0 ? `<div class="sra-citations" role="list" aria-label="Sources">${s.externalLinks.map(l =>
    `<a href="${escAttr(l.href || l.url || '#')}" class="sra-citation-link" target="_blank" rel="noopener noreferrer" role="listitem">${esc(l.label)}</a>${l.note ? ` <span class="sra-citation-note">${esc(l.note)}</span>` : ''}`
  ).join(' ')}</div>` : ''}
  ${s.table && s.table.headers.length > 0 ? `<div class="sra-table-wrap">
    <table class="sra-table">
      <thead><tr>${s.table.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${s.table.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    ${s.table.caption ? `<div class="sra-table-caption">${esc(s.table.caption)}</div>` : ''}
  </div>` : ''}
  ${s.steps && s.steps.length > 0 ? `<div class="sra-steps" role="list">${s.steps.map((step, i) => `
    <div class="sra-step" role="listitem">
      <span class="sra-step-num">${i + 1}</span>
      <div class="sra-step-body">
        <strong>${esc(step.name)}</strong>
        <p>${esc(step.text)}</p>
      </div>
    </div>`).join('')}</div>` : ''}
  ${s.relatedLinks && s.relatedLinks.length > 0 ? `<div class="sra-related-inline"><strong>Also check out:</strong> ${s.relatedLinks.map((l, i) => `<a href="${escAttr(l.href)}">${esc(l.label)}</a>${i < s.relatedLinks.length - 1 ? ', ' : ''}`).join('')}</div>` : ''}
  ${html}
</section>`;
  });
  // Inject a mid-article email capture after the 2nd section on substantial pages.
  if (blocks.length >= 4) {
    blocks.splice(2, 0, renderEmailCapture('inline'));
  }
  return blocks.join('\n');
}

function renderTableOfContents(sections: ContentSection[]): string {
  const headings = sections
    .map(s => s.h2 || s.heading || '')
    .filter(Boolean);
  if (headings.length === 0) return '';
  return `
<div class="sra-toc" role="navigation" aria-label="Table of contents">
  <h2>Table of Contents</h2>
  <ul>
    ${headings.map(h => `<li><a href="#${sectionSlug(h)}">${esc(h)}</a></li>`).join('\n    ')}
  </ul>
</div>`;
}

function renderFaqs(faqs: FAQItem[]): string {
  if (!faqs || faqs.length === 0) return '';
  return `
<section class="sra-faq">
  <h2>Frequently asked questions</h2>
  ${faqs.map(f => `
  <details class="sra-faq-item">
    <summary>${esc(f.q)}</summary>
    <p>${esc(f.a)}</p>
  </details>`).join('\n')}
</section>`;
}

function renderRelated(related: InternalLink[]): string {
  if (!related || related.length === 0) return '';
  return `
<section class="sra-related">
  <h2>Also check out</h2>
  <div class="sra-related-grid">
  ${related.map(r => `
    <a href="${escAttr(r.href)}" class="sra-related-card">
      <span class="sra-related-label">${esc(r.label)}</span>
      ${r.blurb ? `<span class="sra-related-blurb">${esc(r.blurb)}</span>` : ''}
    </a>`).join('\n  ')}
  </div>
</section>`;
}

function renderRelatedInline(related: InternalLink[]): string {
  if (!related || related.length === 0) return '';
  return `
<div class="sra-related-inline">
  <strong>Also check out:</strong>
  ${related.map((r, i) => `<a href="${escAttr(r.href)}">${esc(r.label)}</a>${i < related.length - 1 ? ', ' : ''}`).join('')}
</div>`;
}

function renderBreadcrumbs(cfg: SsrPageConfig): string {
  const c = cfg.breadcrumbs;
  if (!c || c.length === 0) return '';
  return `
<nav class="sra-crumbs" aria-label="Breadcrumb">
  ${c.map((b, i) => i === c.length - 1
    ? `<span aria-current="page">${esc(b.name)}</span>`
    : `<a href="${escAttr(b.href)}">${esc(b.name)}</a><span class="sra-crumb-sep" aria-hidden="true">›</span>`
  ).join(' ')}
</nav>`;
}

function inlineCss(): string {
  return `
:root {
  --sra-bg: #0D0D0D;
  --sra-bg-card: #1a1a1a;
  --sra-border: #333;
  --sra-text: #f5f1e6;
  --sra-text-dim: #a8a39a;
  --sra-gold: #C9941A;
  --sra-gold-soft: rgba(201, 148, 26, 0.15);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--sra-bg);
  color: var(--sra-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  line-height: 1.65;
  font-size: 17px;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--sra-gold); text-decoration: none; }
a:hover { text-decoration: underline; }
.sra-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 32px;
  border-bottom: 1px solid var(--sra-border);
  background: var(--sra-bg);
  position: sticky; top: 0; z-index: 50;
}
.sra-logo { display: flex; align-items: center; gap: 10px; color: var(--sra-text); font-weight: 600; font-size: 18px; }
.sra-logo:hover { text-decoration: none; }
.sra-logo-mark {
  width: 28px; height: 28px; border-radius: 4px;
  background: var(--sra-gold);
  display: inline-block;
}
.sra-nav { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
.sra-nav a { color: var(--sra-text-dim); font-size: 14px; }
.sra-nav a:hover { color: var(--sra-text); }
.sra-cta-btn {
  background: var(--sra-gold) !important;
  color: #000 !important;
  padding: 8px 16px; border-radius: 4px;
  font-weight: 600;
}
.sra-cta-btn:hover { text-decoration: none !important; opacity: 0.92; }
.sra-page { max-width: 880px; margin: 0 auto; padding: 32px 24px 80px; }
.sra-crumbs { font-size: 13px; color: var(--sra-text-dim); margin-bottom: 24px; }
.sra-crumbs a { color: var(--sra-text-dim); }
.sra-crumb-sep { margin: 0 6px; }
.sra-hero { padding: 24px 0 32px; border-bottom: 1px solid var(--sra-border); margin-bottom: 32px; }
.sra-hero-img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 8px; border: 1px solid var(--sra-border); margin-bottom: 24px; display: block; }
.sra-eyebrow {
  display: inline-block;
  font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sra-gold); margin-bottom: 16px;
}
.sra-hero h1 {
  font-family: 'Crimson Pro', 'Playfair Display', Georgia, serif;
  font-size: clamp(34px, 5vw, 52px); font-weight: 700;
  line-height: 1.15; margin: 0 0 16px;
  color: var(--sra-text);
}
.sra-hero p { font-size: 19px; color: var(--sra-text-dim); margin: 0 0 24px; max-width: 720px; }
.sra-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
.sra-btn-primary {
  background: var(--sra-gold); color: #000 !important; padding: 12px 24px;
  border-radius: 4px; font-weight: 600; display: inline-block;
}
.sra-btn-secondary {
  background: transparent; color: var(--sra-text) !important;
  border: 1px solid var(--sra-border); padding: 11px 24px;
  border-radius: 4px; font-weight: 500; display: inline-block;
}
.sra-btn-primary:hover, .sra-btn-secondary:hover { text-decoration: none; opacity: 0.92; }
.sra-author {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 0; margin-bottom: 32px;
  font-size: 14px; color: var(--sra-text-dim);
  border-bottom: 1px solid var(--sra-border);
}
.sra-author-img {
  width: 44px; height: 44px; border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--sra-gold);
  display: inline-block;
  flex-shrink: 0;
}
.sra-author a { color: var(--sra-text); font-weight: 500; }
.sra-section { margin: 32px 0; }
.sra-section h2 {
  font-family: 'Crimson Pro', 'Playfair Display', Georgia, serif;
  font-size: 28px; font-weight: 700; color: var(--sra-text);
  margin: 0 0 16px; line-height: 1.25;
}
.sra-section p { margin: 0 0 16px; color: var(--sra-text); }
.sra-section ul { padding-left: 22px; margin: 0 0 16px; }
.sra-section li { margin-bottom: 8px; color: var(--sra-text); }
.sra-faq { margin: 48px 0 32px; padding: 24px; background: var(--sra-bg-card); border: 1px solid var(--sra-border); border-radius: 6px; }
.sra-faq h2 { font-family: 'Crimson Pro', Georgia, serif; font-size: 24px; margin: 0 0 16px; color: var(--sra-text); }
.sra-faq-item { border-top: 1px solid var(--sra-border); padding: 14px 0; }
.sra-faq-item:first-of-type { border-top: 0; padding-top: 4px; }
.sra-faq-item summary { cursor: pointer; font-weight: 600; color: var(--sra-text); list-style: none; padding: 4px 0; }
.sra-faq-item summary::-webkit-details-marker { display: none; }
.sra-faq-item summary::after { content: '+'; color: var(--sra-gold); float: right; font-size: 18px; }
.sra-faq-item[open] summary::after { content: '–'; }
.sra-faq-item p { margin: 8px 0 4px; color: var(--sra-text-dim); }
.sra-related { margin: 48px 0 16px; }
.sra-related h2 { font-family: 'Crimson Pro', Georgia, serif; font-size: 22px; color: var(--sra-text); margin: 0 0 16px; }
.sra-related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.sra-related-card {
  display: block; padding: 16px;
  background: var(--sra-bg-card); border: 1px solid var(--sra-border); border-radius: 6px;
  color: var(--sra-text) !important;
}
.sra-related-card:hover { border-color: var(--sra-gold); text-decoration: none; }
.sra-related-label { display: block; font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.sra-related-blurb { display: block; font-size: 13px; color: var(--sra-text-dim); }
.sra-final-cta {
  margin: 56px 0 24px; padding: 32px 24px;
  background: linear-gradient(135deg, var(--sra-gold-soft), transparent);
  border: 1px solid var(--sra-gold); border-radius: 8px; text-align: center;
}
.sra-affiliate {
  margin: 56px 0 24px; padding: 24px;
  background: var(--sra-bg-card); border: 1px solid var(--sra-border);
  border-radius: 8px;
}
.sra-affiliate h2 { font-family: 'Crimson Pro', Georgia, serif; font-size: 24px; color: var(--sra-text); margin: 0 0 12px; }
.sra-affiliate p { color: var(--sra-text-dim); margin: 0 0 16px; }
.sra-affiliate .sra-btn-primary { display: inline-block; }
.sra-affiliate-note { font-size: 12px; color: var(--sra-text-dim); margin-top: 12px; font-style: italic; }
.sra-final-cta h2 { font-family: 'Crimson Pro', Georgia, serif; font-size: 28px; color: var(--sra-text); margin: 0 0 12px; }
.sra-final-cta p { color: var(--sra-text-dim); margin: 0 0 20px; }
.sra-email-capture {
  margin: 40px 0; padding: 28px 24px;
  background: var(--sra-bg-card); border: 1px solid var(--sra-gold); border-radius: 8px;
}
.sra-email-capture h2 { font-family: 'Crimson Pro', Georgia, serif; font-size: 24px; color: var(--sra-text); margin: 0 0 8px; }
.sra-email-capture p { color: var(--sra-text-dim); margin: 0 0 16px; }
.sra-email-form { display: flex; gap: 10px; flex-wrap: wrap; }
.sra-email-input {
  flex: 1 1 220px; min-width: 0; padding: 11px 14px; font-size: 15px;
  background: var(--sra-bg); border: 1px solid var(--sra-border); border-radius: 4px; color: var(--sra-text);
}
.sra-email-input:focus { outline: none; border-color: var(--sra-gold); }
.sra-email-form .sra-btn-primary { flex: 0 0 auto; border: 0; cursor: pointer; font-family: inherit; font-size: 15px; }
.sra-email-fineprint { font-size: 12px; color: var(--sra-text-dim); margin-top: 10px; }
.sra-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.sra-ftc-disclosure {
  margin: 4px 0 20px; padding: 10px 14px; font-size: 12px; line-height: 1.5;
  color: var(--sra-text-dim); background: var(--sra-bg-card);
  border: 1px solid var(--sra-border); border-radius: 4px;
}
.sra-footer { border-top: 1px solid var(--sra-border); background: var(--sra-bg); padding: 40px 24px 24px; margin-top: 64px; }
.sra-footer-grid {
  max-width: 1100px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
}
.sra-footer-col { display: flex; flex-direction: column; gap: 8px; }
.sra-footer-title { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sra-gold); margin-bottom: 4px; }
.sra-footer-col a { color: var(--sra-text-dim); font-size: 14px; }
.sra-footer-col a:hover { color: var(--sra-text); text-decoration: none; }
.sra-footer-bottom {
  max-width: 1100px; margin: 32px auto 0; padding-top: 16px;
  border-top: 1px solid var(--sra-border);
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  font-size: 13px; color: var(--sra-text-dim);
}
.sra-footer-bottom a { color: var(--sra-text-dim); }
.sra-blog-fig { margin: 28px 0; }
.sra-blog-img { max-width: 100%; border-radius: 6px; border: 1px solid var(--sra-border); display: block; }
.sra-blog-caption { font-size: 13px; color: var(--sra-text-dim); margin-top: 8px; font-style: italic; }
.sra-citations { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--sra-border); display: flex; flex-wrap: wrap; gap: 8px; }
.sra-citation-link { font-size: 12px; color: var(--sra-gold); border: 1px solid var(--sra-border); padding: 3px 10px; border-radius: 3px; display: inline-block; }
.sra-citation-link:hover { border-color: var(--sra-gold); text-decoration: none; }
.sra-citation-note { font-size: 12px; color: var(--sra-text-dim); }
.sra-related-inline { margin-top: 14px; padding: 12px 16px; background: var(--sra-bg-card); border-left: 3px solid var(--sra-gold); border-radius: 0 4px 4px 0; font-size: 14px; }
.sra-related-inline a { color: var(--sra-gold); font-weight: 600; }
.sra-related-inline a:hover { text-decoration: underline; }
.sra-product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0; }
.sra-product-card { background: var(--sra-bg-card); border: 1px solid var(--sra-border); border-radius: 6px; padding: 18px; display: flex; flex-direction: column; gap: 6px; }
.sra-product-card-name { font-weight: 700; font-size: 15px; color: var(--sra-text); }
.sra-product-card-price { font-size: 13px; color: var(--sra-gold); font-weight: 600; }
.sra-product-card-note { font-size: 13px; color: var(--sra-text-dim); margin: 4px 0 8px; line-height: 1.5; }
.sra-product-card-link { display: inline-block; background: var(--sra-gold); color: #000 !important; padding: 9px 18px; border-radius: 4px; font-size: 13px; font-weight: 700; margin-top: auto; align-self: flex-start; }
.sra-product-card-link:hover { text-decoration: none; opacity: 0.9; }
.sra-table-wrap { margin: 20px 0; overflow-x: auto; }
.sra-table { width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid var(--sra-border); border-radius: 6px; overflow: hidden; }
.sra-table thead { background: var(--sra-bg-card); }
.sra-table th { padding: 12px 14px; text-align: left; font-weight: 600; color: var(--sra-gold); border-bottom: 1px solid var(--sra-border); font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
.sra-table td { padding: 12px 14px; border-bottom: 1px solid var(--sra-border); color: var(--sra-text); }
.sra-table tr:last-child td { border-bottom: none; }
.sra-table tr:hover td { background: var(--sra-bg-card); }
.sra-table-caption { font-size: 12px; color: var(--sra-text-dim); margin-top: 8px; font-style: italic; }
.sra-steps { margin: 20px 0; display: flex; flex-direction: column; gap: 16px; }
.sra-step { display: flex; gap: 14px; align-items: flex-start; }
.sra-step-num { min-width: 32px; height: 32px; border-radius: 50%; background: var(--sra-gold); color: #000; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sra-step-body { flex: 1; }
.sra-step-body strong { color: var(--sra-text); font-size: 15px; display: block; margin-bottom: 4px; }
.sra-step-body p { color: var(--sra-text-dim); margin: 0; font-size: 14px; }
.sra-video-wrap { margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--sra-border); background: var(--sra-bg-card); }
.sra-video-wrap video { width: 100%; display: block; aspect-ratio: 16/9; }
.sra-share-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 40px 0 0; padding: 16px 0; border-top: 1px solid var(--sra-border); font-size: 13px; color: var(--sra-text-dim); }
.sra-share-btn { display: inline-block; padding: 7px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; text-decoration: none !important; }
.sra-share-fb { background: #1877f2; color: #fff !important; }
.sra-share-tw { background: #000; color: #fff !important; }
.sra-share-em { background: var(--sra-bg-card); border: 1px solid var(--sra-border); color: var(--sra-text) !important; }
.sra-share-btn:hover { opacity: 0.88; }
@media (max-width: 600px) {
  .sra-header { padding: 12px 16px; }
  .sra-logo-text { display: none; }
  .sra-nav { gap: 14px; }
  .sra-page { padding: 20px 16px 64px; }
  .sra-hero h1 { font-size: 32px; }
  .sra-product-grid { grid-template-columns: 1fr; }
}
`;
}

export function renderSsrPage(cfg: SsrPageConfig): string {
  const url = `${SITE_URL}${cfg.url}`;
  const articleSchema = buildArticleSchema(cfg);
  const faqSchema = buildFaqSchema(cfg.faqs);
  const breadcrumbSchema = buildBreadcrumbSchema(cfg);
  const howToSchema = buildHowToSchema(cfg);
  const reviewSchema = buildProductReviewSchema(cfg);
  const videoSchema = buildVideoObjectSchema(cfg);

  const hero = cfg.hero;
  const ctaPrimary = hero.ctaPrimary || { href: '/api/login', label: 'Start free' };
  const ctaSecondary = hero.ctaSecondary;

  const productCard = cfg.productCard;
  const bookPromo = cfg.bookPromo;
  const hasAffiliate = !!cfg.productCard || cfg.sections.some(s => Array.isArray(s.products) && s.products.length > 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5" />
<title>${esc(cfg.title)}</title>
<meta name="description" content="${escAttr(cfg.description)}" />
<link rel="canonical" href="${escAttr(url)}" />
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
<meta name="author" content="Nick Kremers" />
${cfg.keywords && cfg.keywords.length > 0 ? `<meta name="keywords" content="${escAttr(cfg.keywords.join(', '))}" />` : ''}
<meta property="og:type" content="article" />
<meta property="og:url" content="${escAttr(url)}" />
<meta property="og:title" content="${escAttr(cfg.title)}" />
<meta property="og:description" content="${escAttr(cfg.description)}" />
<meta property="og:image" content="${cfg.image ? (cfg.image.startsWith('http') ? cfg.image : `${SITE_URL}${cfg.image}`) : `${SITE_URL}/og-image-1200x630.png`}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="${escAttr(cfg.title)}" />
<meta property="og:site_name" content="Stroke Recovery Academy" />
<meta property="og:locale" content="en_US" />
<meta property="article:author" content="Nick Kremers" />
<meta property="article:published_time" content="${escAttr(cfg.publishedDate || '2026-01-15')}" />
<meta property="article:modified_time" content="${escAttr(cfg.modifiedDate || cfg.publishedDate || '2026-01-15')}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@strokerecovery" />
<meta name="twitter:title" content="${escAttr(cfg.title)}" />
<meta name="twitter:description" content="${escAttr(cfg.description)}" />
<meta name="twitter:image" content="${cfg.image ? (cfg.image.startsWith('http') ? cfg.image : `${SITE_URL}${cfg.image}`) : `${SITE_URL}/og-image-1200x630.png`}" />
<meta name="twitter:image:alt" content="${escAttr(cfg.title)}" />
<meta name="theme-color" content="#0D0D0D" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=Inter:wght@400;500;600&display=swap" />
<style>${inlineCss()}</style>
<script type="application/ld+json">${jsonLd(articleSchema)}</script>
${faqSchema ? `<script type="application/ld+json">${jsonLd(faqSchema)}</script>` : ''}
${breadcrumbSchema ? `<script type="application/ld+json">${jsonLd(breadcrumbSchema)}</script>` : ''}
${howToSchema ? `<script type="application/ld+json">${jsonLd(howToSchema)}</script>` : ''}
${reviewSchema ? `<script type="application/ld+json">${jsonLd(reviewSchema)}</script>` : ''}
${videoSchema ? `<script type="application/ld+json">${jsonLd(videoSchema)}</script>` : ''}
</head>
<body>
${renderHeader()}
<main class="sra-page">
  ${renderBreadcrumbs(cfg)}
  <div class="sra-hero">
    ${cfg.image ? `<img src="${cfg.image}" alt="${escAttr(cfg.title)}" class="sra-hero-img" loading="eager" />` : ''}
    ${hero.eyebrow ? `<div class="sra-eyebrow">${esc(hero.eyebrow)}</div>` : ''}
    <h1>${esc(cfg.h1)}</h1>
    <p>${esc(hero.subhead)}</p>
    <div class="sra-cta-row">
      <a href="${escAttr(ctaPrimary.href)}" class="sra-btn-primary">${esc(ctaPrimary.label)}</a>
      ${ctaSecondary ? `<a href="${escAttr(ctaSecondary.href)}" class="sra-btn-secondary">${esc(ctaSecondary.label)}</a>` : ''}
    </div>
  </div>

  ${renderTableOfContents(cfg.sections)}

  <div class="sra-author">
    <img src="${AUTHOR.image}" alt="${AUTHOR.name}" class="sra-author-img" loading="lazy" width="44" height="44" />
    <div>
      Written by <a href="${AUTHOR.url}">Nick Kremers</a> · Stroke survivor, 7 years in — full left-side paralysis to 90% back. I write what I actually lived.
      <br /><span style="font-size:12px;">Last reviewed: ${esc(cfg.modifiedDate || cfg.publishedDate || '2026-01-15')}</span>
      <br /><span style="font-size:12px; color: var(--sra-text-dim);">${estimateReadingTime(cfg.sections)} min read · ${countWords(cfg.sections).toLocaleString()} words</span>
      <br /><span class="sra-medical-badge" style="font-size:12px; color: var(--sra-text-dim);">Written from 7 years of lived recovery — not medical advice. <a href="/legal/medical-disclaimer" style="color: var(--sra-gold);">See your doctor, PT, or OT.</a></span>
    </div>
  </div>

  ${hasAffiliate ? `<div class="sra-ftc-disclosure">Heads up — some links in this post are Amazon affiliate links. Buy through them and I earn a small commission at no extra cost to you. I only point at gear I'd tell another survivor to use.</div>` : ''}

  ${renderSections(cfg.sections)}

  ${renderFaqs(cfg.faqs)}

  ${productCard ? `
  <section class="sra-affiliate">
    <h2>${esc(productCard.title || productCard.name || '')}</h2>
    <p>${esc(productCard.description)}</p>
    <a href="${escAttr(tagAmazonLink(productCard.link))}" class="sra-btn-primary" target="_blank" rel="noopener noreferrer sponsored nofollow">${esc(productCard.label)}</a>
    ${productCard.note ? `<div class="sra-affiliate-note">${esc(productCard.note)}</div>` : ''}
  </section>
  ` : ''}

  ${bookPromo ? `
  <section class="sra-affiliate" style="border-color: var(--sra-gold);">
    <h2 style="color: var(--sra-gold);">${esc(bookPromo.title)}</h2>
    <p>${esc(bookPromo.description)}</p>
    <a href="${escAttr(bookPromo.link)}" class="sra-btn-primary">${esc(bookPromo.label)}</a>
  </section>
  ` : ''}

  ${renderEmailCapture('final')}

  <section class="sra-final-cta">
    <h2>Or start your recovery free.</h2>
    <p>Daily routine. AI coach. 66-day challenge. Built by a survivor for survivors.</p>
    <a href="/api/login" class="sra-btn-secondary">Create free account</a>
  </section>

  ${renderRelated(cfg.related)}
</main>
${renderFooter()}
</body>
</html>`;
}

export function renderSsrThanks(ok: boolean = true): string {
  const eyebrow = ok ? "You're in" : 'Hmm';
  const h1 = ok ? 'Check your inbox.' : 'That email did not look right.';
  const body = ok
    ? "Your cheat sheet is on the way — should land in the next minute. If it's not there, check spam and add me to your contacts. My first field-note email hits in a few days."
    : "I could not read that address, so nothing got sent. Head back and try once more — it's one field.";
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(ok ? "You're in · Stroke Recovery Academy" : 'Try again · Stroke Recovery Academy')}</title>
<meta name="description" content="Your stroke recovery cheat sheet is on the way." />
<meta name="robots" content="noindex,follow" />
<link rel="icon" href="/favicon.ico" />
<style>${inlineCss()}</style>
</head><body>
${renderHeader()}
<main class="sra-page">
  <div class="sra-hero">
    <div class="sra-eyebrow">${esc(eyebrow)}</div>
    <h1>${esc(h1)}</h1>
    <p>${esc(body)}</p>
    <div class="sra-cta-row">
      ${ok
        ? `<a href="/api/sasch/cheat-sheet.pdf" class="sra-btn-primary">Download the cheat sheet now</a>
      <a href="/blog" class="sra-btn-secondary">Back to the blog</a>`
        : `<a href="/blog" class="sra-btn-primary">Back to the blog</a>`}
    </div>
  </div>
</main>
${renderFooter()}
</body></html>`;
}

export function renderSsr404(): string {
  const cfg: Pick<SsrPageConfig, 'url' | 'title' | 'description' | 'h1' | 'hero'> = {
    url: '/404',
    title: 'Page not found · Stroke Recovery Academy',
    description: 'That page does not exist. Try one of these instead.',
    h1: 'That page does not exist.',
    hero: {
      subhead: 'But your recovery does. Pick one of the doors below and keep moving.',
      ctaPrimary: { href: '/', label: 'Go home' },
    },
  };
  const links: InternalLink[] = [
    { href: '/recovery/university', label: 'Recovery University', blurb: '7 parts, 33 chapters of survivor doctrine.' },
    { href: '/recovery/exercises', label: 'Daily exercises', blurb: 'Real movements, real protocols.' },
    { href: '/recovery/challenge', label: '66-Day Challenge', blurb: 'The transformation arc.' },
    { href: '/recovery/center-finder', label: 'Center Finder', blurb: 'Find a stroke recovery center near you.' },
    { href: '/blog', label: 'Survivor blog', blurb: 'Posts from the trenches.' },
    { href: '/learn/neuroplasticity-after-stroke', label: 'How neuroplasticity works', blurb: 'The science of rewiring.' },
  ];
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(cfg.title)}</title>
<meta name="description" content="${escAttr(cfg.description)}" />
<meta name="robots" content="noindex,follow" />
<link rel="icon" href="/favicon.ico" />
<style>${inlineCss()}</style>
</head><body>
${renderHeader()}
<main class="sra-page">
  <div class="sra-hero">
    <div class="sra-eyebrow">404</div>
    <h1>${esc(cfg.h1)}</h1>
    <p>${esc(cfg.hero.subhead)}</p>
    <div class="sra-cta-row">
      <a href="/" class="sra-btn-primary">Go home</a>
      <a href="/recovery/university" class="sra-btn-secondary">Browse Recovery University</a>
    </div>
  </div>
  ${renderRelated(links)}
</main>
${renderFooter()}
</body></html>`;
}
