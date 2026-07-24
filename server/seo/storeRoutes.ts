// SSR store route — server-renders /recovery/store and /store with the full
// product catalog, Product + ItemList + BreadcrumbList + FAQPage JSON-LD, and a
// premium dark/orange storefront that pixel-matches the SPA. Crawlers (Google,
// GPTBot, PerplexityBot, Claude-Web) see every product in raw HTML with rich
// structured data; the SPA hydrates on top for interactive users.

import type { Express } from 'express';
import { RECOVERY_PRODUCTS, type Product } from '@shared/recoveryProducts';

const SITE_URL = 'https://strokerecoveryacademy.com';
const STORE_PATH = '/recovery/store';

const CATEGORIES: { id: string; name: string }[] = [
  { id: 'strength', name: 'Strength Training' },
  { id: 'mobility', name: 'Mobility & Drop Foot' },
  { id: 'therapy', name: 'Therapy Tools' },
  { id: 'adaptive', name: 'Adaptive Aids' },
  { id: 'brain', name: 'Brain Games & Books' },
];

const STORE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Are these products recommended by a real stroke survivor?',
    a: 'Yes. Every product is hand-picked or personally used by Nick Kremers, a 7-year stroke survivor who recovered from near-total paralysis to roughly 90% function. Items marked "Nick\u2019s Pick" are ones he uses in his own daily routine.',
  },
  {
    q: 'How are the products chosen?',
    a: 'Products are selected for genuine therapeutic value in stroke recovery \u2014 grip and strength rebuilding, drop-foot and mobility support, fine-motor therapy, adaptive daily-living aids, and cognitive training. There are no paid placements; selection is based on real-world usefulness and verified customer ratings.',
  },
  {
    q: 'Does buying through these links cost me more?',
    a: 'No. Prices are exactly the same as buying directly on Amazon. Stroke Recovery Academy earns a small affiliate commission at no extra cost to you, and that revenue funds free resources and scholarships for stroke survivors.',
  },
  {
    q: 'What if I have weakness or limited hand function?',
    a: 'Many items \u2014 adaptive utensils, dressing aids, transfer slings, and rotating-grip trainers \u2014 are chosen specifically for survivors with hemiparesis or limited grip. Each product lists its recovery benefits so you can match a tool to where you are today.',
  },
  {
    q: 'Is this medical advice?',
    a: 'No. The Recovery Store is curated from lived experience and is non-clinical. Always check with your doctor or therapist before starting new exercises or equipment, especially early in recovery.',
  },
];

function esc(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script');
}

function priceNumber(price: string): string {
  return price.replace(/[^0-9.]/g, '');
}

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

function absImage(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function buildStoreSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Stroke Recovery Academy Recovery Store',
    description:
      'Curated recovery products hand-picked by stroke survivor Nick Kremers \u2014 strength trainers, drop-foot and mobility aids, fine-motor therapy tools, adaptive daily-living aids, and brain games.',
    url: `${SITE_URL}${STORE_PATH}`,
    image: `${SITE_URL}/og-image.jpg`,
    brand: { '@type': 'Brand', name: 'Stroke Recovery Academy' },
    founder: {
      '@type': 'Person',
      name: 'Nick Kremers',
      description:
        'Stroke survivor who recovered from 0% to 90% function. Founder of Stroke Recovery Academy and creator of the Sasquatch Method.',
      url: `${SITE_URL}/recovery/about-nick`,
      knowsAbout: ['Stroke Recovery', 'Neuroplasticity', 'Physical Therapy', 'Cognitive Rehabilitation', 'Adaptive Equipment'],
    },
  };
}

function buildBreadcrumbSchema(): object {
  const crumbs = [
    { name: 'Home', href: '/' },
    { name: 'Recovery', href: '/recovery' },
    { name: 'Recovery Store', href: STORE_PATH },
  ];
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

function buildProductSchema(p: Product): object {
  return {
    '@type': 'Product',
    name: p.name,
    description: p.description,
    brand: { '@type': 'Brand', name: p.brand },
    image: absImage(p.imageUrl),
    category: p.category,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
    },
    offers: {
      '@type': 'Offer',
      price: priceNumber(p.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: tagAmazonLink(p.amazonUrl),
    },
    review: {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
      author: { '@type': 'Person', name: 'Nick Kremers' },
      reviewBody: p.nickSays || p.whyRecommended,
    },
  };
}

function buildItemListSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Stroke Recovery Products',
    numberOfItems: RECOVERY_PRODUCTS.length,
    itemListElement: RECOVERY_PRODUCTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: buildProductSchema(p),
    })),
  };
}

function buildFaqSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STORE_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let out = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) out += '<span class="star full">\u2605</span>';
    else if (i === full + 1 && half) out += '<span class="star half">\u2605</span>';
    else out += '<span class="star">\u2605</span>';
  }
  return out;
}

function renderProductCard(p: Product): string {
  const url = tagAmazonLink(p.amazonUrl);
  const badges = [
    p.isNicksPick ? '<span class="badge pick">Nick\u2019s Pick</span>' : '',
    p.isBestSeller ? '<span class="badge best">Best Seller</span>' : '',
  ].join('');
  const tags = (p.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join('');
  const benefits = (p.recoveryBenefits || [])
    .map((b) => `<li>${esc(b)}</li>`)
    .join('');
  const nick = p.nickSays
    ? `<blockquote class="nick"><span class="nick-mark">\u201C</span>${esc(p.nickSays)}<cite>\u2014 Nick Kremers</cite></blockquote>`
    : '';
  const orig = p.originalPrice ? `<span class="orig">${esc(p.originalPrice)}</span>` : '';
  return `
<article class="card" id="${esc(p.id)}" itemscope itemtype="https://schema.org/Product">
  <div class="card-media">
    ${badges ? `<div class="badges">${badges}</div>` : ''}
    <img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy" width="320" height="320" itemprop="image" />
  </div>
  <div class="card-body">
    <div class="brand" itemprop="brand">${esc(p.brand)}</div>
    <h3 class="card-title" itemprop="name">${esc(p.name)}</h3>
    <div class="rating" aria-label="Rated ${esc(String(p.rating))} out of 5 from ${esc(String(p.reviewCount))} reviews">
      <span class="stars">${renderStars(p.rating)}</span>
      <span class="rating-text">${esc(String(p.rating))} (${p.reviewCount.toLocaleString()})</span>
    </div>
    <p class="desc" itemprop="description">${esc(p.description)}</p>
    ${tags ? `<div class="tags">${tags}</div>` : ''}
    ${nick}
    <div class="price-row">
      <div class="price"><span class="now">${esc(p.price)}</span>${orig}</div>
      <a class="buy" href="${esc(url)}" target="_blank" rel="noopener noreferrer sponsored nofollow" aria-label="Buy ${esc(p.name)} on Amazon">Buy on Amazon \u2197</a>
    </div>
    ${benefits ? `<div class="benefits"><span class="benefits-label">Recovery benefits</span><ul>${benefits}</ul></div>` : ''}
  </div>
</article>`;
}

function renderCategorySection(catId: string, catName: string): string {
  const items = RECOVERY_PRODUCTS.filter((p) => p.category === catId);
  if (items.length === 0) return '';
  return `
<section class="cat" id="cat-${esc(catId)}">
  <div class="cat-head">
    <h2>${esc(catName)}</h2>
    <span class="cat-count">${items.length} product${items.length === 1 ? '' : 's'}</span>
  </div>
  <div class="grid">
    ${items.map(renderProductCard).join('')}
  </div>
</section>`;
}

function renderNicksPicks(): string {
  const picks = RECOVERY_PRODUCTS.filter((p) => p.isNicksPick).slice(0, 12);
  if (picks.length === 0) return '';
  return `
<section class="picks">
  <div class="picks-head">
    <h2>Nick\u2019s Top Picks</h2>
    <p>The gear I actually use in my own recovery.</p>
  </div>
  <div class="picks-row">
    ${picks
      .map(
        (p) => `
    <a class="pick-chip" href="#${esc(p.id)}">
      <img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy" width="72" height="72" />
      <span>${esc(p.name)}</span>
    </a>`,
      )
      .join('')}
  </div>
</section>`;
}

function renderFaqs(): string {
  return `
<section class="faq">
  <h2>Frequently asked questions</h2>
  ${STORE_FAQS.map(
    (f) => `
  <details class="faq-item">
    <summary>${esc(f.q)}</summary>
    <p>${esc(f.a)}</p>
  </details>`,
  ).join('')}
</section>`;
}

function renderPage(): string {
  const title = 'Recovery Store \u2014 Stroke Survivor-Tested Gear | Nick Kremers';
  const description =
    'Shop recovery products hand-picked by 7-year stroke survivor Nick Kremers: grip and strength trainers, drop-foot and mobility aids, fine-motor therapy tools, adaptive utensils, transfer slings, and brain games. Survivor-tested, expert-curated.';
  const keywords = [
    'stroke recovery products',
    'stroke rehabilitation equipment',
    'adaptive aids for stroke survivors',
    'grip strengthener stroke',
    'drop foot brace',
    'hand therapy tools stroke',
    'adaptive utensils tremor',
    'transfer sling caregiver',
    'gait belt',
    'brain games stroke recovery',
  ].join(', ');
  const canonical = `${SITE_URL}${STORE_PATH}`;
  const total = RECOVERY_PRODUCTS.length;

  const graph = [
    buildStoreSchema(),
    buildBreadcrumbSchema(),
    buildItemListSchema(),
    buildFaqSchema(),
  ];

  // nosemgrep: javascript.lang.security.html-in-template-string
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="keywords" content="${esc(keywords)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Stroke Recovery Academy" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${SITE_URL}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE_URL}/og-image.jpg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<script type="application/ld+json">${jsonLd(graph)}</script>
<style>${inlineCss()}</style>
</head>
<body>
${renderHeader()}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a><span class="sep">\u203A</span>
    <a href="/recovery">Recovery</a><span class="sep">\u203A</span>
    <span aria-current="page">Recovery Store</span>
  </nav>

  <section class="hero">
    <span class="eyebrow">Curated by Nick Kremers \u00B7 7-Year Survivor</span>
    <h1>Recovery Store</h1>
    <p>Every product hand-picked for stroke recovery success \u2014 tested and approved by survivors who\u2019ve been where you are. ${total} survivor-tested tools across strength, mobility, therapy, adaptive living, and brain training.</p>
    <div class="trust">
      <span class="trust-item">Survivor Tested</span>
      <span class="trust-item">Expert Recommended</span>
      <span class="trust-item">Community Approved</span>
      <span class="trust-item">No Paid Placements</span>
    </div>
    <div class="cat-nav">
      ${CATEGORIES.map((c) => `<a href="#cat-${esc(c.id)}">${esc(c.name)}</a>`).join('')}
    </div>
  </section>

  ${renderNicksPicks()}

  ${CATEGORIES.map((c) => renderCategorySection(c.id, c.name)).join('')}

  ${renderFaqs()}

  <section class="disclosure">
    <p><strong>Affiliate disclosure:</strong> As an Amazon Associate, Stroke Recovery Academy earns from qualifying purchases. Prices are identical to buying directly on Amazon \u2014 your purchase costs you nothing extra and helps fund free resources and scholarships for stroke survivors. Product links open on Amazon.</p>
    <p class="non-clinical">The Recovery Store is non-clinical and curated from lived experience. It is not medical advice. Talk to your doctor or therapist before starting new equipment or exercises.</p>
  </section>
</main>
${renderFooter()}
</body>
</html>`;
}

function renderHeader(): string {
  return `
<header class="site-header">
  <a href="/" class="logo" aria-label="Stroke Recovery Academy home">
    <span class="logo-mark" aria-hidden="true"></span>
    <span class="logo-text">Stroke Recovery Academy</span>
  </a>
  <nav class="site-nav" aria-label="Primary">
    <a href="/recovery/university">University</a>
    <a href="/recovery/exercises">Exercises</a>
    <a href="/blog">Blog</a>
    <a href="/recovery/store" aria-current="page">Store</a>
    <a href="/recovery/pricing" class="nav-cta">Start Free</a>
  </nav>
</header>`;
}

function renderFooter(): string {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <span>\u00A9 ${new Date().getFullYear()} Stroke Recovery Academy \u00B7 Part of Stroke Lyfe Inc., a 501(c)(3) nonprofit. Built by a survivor, for survivors.</span>
    <span class="footer-tag">REBUILD. REWIRE. RISE.</span>
  </div>
</footer>`;
}

function inlineCss(): string {
  return `
:root{--bg:#0D0D0D;--card:#1a1a1a;--border:#333;--text:#f5f1e6;--dim:#a8a39a;--muted:#6f6a61;--orange:#E2741B;--orange-soft:rgba(226,116,27,0.12);--orange-line:rgba(226,116,27,0.30)}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
a{color:var(--orange);text-decoration:none}a:hover{text-decoration:underline}
h1,h2,h3{font-family:'Crimson Pro',Georgia,serif}
.site-header{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;border-bottom:1px solid var(--border);background:rgba(13,13,13,0.92);backdrop-filter:blur(8px);position:sticky;top:0;z-index:50;flex-wrap:wrap;gap:12px}
.logo{display:flex;align-items:center;gap:10px;color:var(--text);font-weight:700;font-size:17px}
.logo:hover{text-decoration:none}
.logo-mark{width:26px;height:26px;border-radius:5px;background:var(--orange);display:inline-block}
.site-nav{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
.site-nav a{color:var(--dim);font-size:14px;font-weight:500}.site-nav a:hover{color:var(--text)}
.nav-cta{background:var(--orange)!important;color:#000!important;padding:8px 16px;border-radius:6px;font-weight:700}
.nav-cta:hover{text-decoration:none!important;opacity:.92}
.wrap{max-width:1180px;margin:0 auto;padding:24px 20px 80px}
.crumbs{font-size:13px;color:var(--dim);margin-bottom:20px}.crumbs a{color:var(--dim)}.crumbs .sep{margin:0 8px;color:var(--muted)}
.hero{text-align:center;padding:40px 16px 44px;background:radial-gradient(120% 120% at 50% 0%,rgba(226,116,27,0.10),transparent 60%);border-bottom:1px solid var(--border);margin-bottom:40px;border-radius:14px}
.eyebrow{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:16px;padding:6px 14px;border:1px solid var(--orange-line);border-radius:999px;background:var(--orange-soft)}
.hero h1{font-size:clamp(38px,6vw,60px);font-weight:700;line-height:1.08;margin:0 0 16px;color:var(--text)}
.hero p{font-size:18px;color:var(--dim);max-width:760px;margin:0 auto 24px}
.trust{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:22px}
.trust-item{font-size:13px;color:var(--text);background:var(--card);border:1px solid var(--border);border-radius:999px;padding:6px 14px}
.trust-item::before{content:'\u2713';color:var(--orange);font-weight:700;margin-right:7px}
.cat-nav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.cat-nav a{font-size:13px;font-weight:600;color:var(--dim);border:1px solid var(--border);border-radius:8px;padding:8px 14px}
.cat-nav a:hover{color:var(--text);border-color:var(--orange-line);text-decoration:none}
.picks{margin:0 0 48px;padding:22px;background:var(--card);border:1px solid var(--border);border-radius:14px}
.picks-head h2{margin:0 0 4px;font-size:24px}.picks-head p{margin:0 0 18px;color:var(--dim);font-size:14px}
.picks-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.pick-chip{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:14px 8px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--dim);font-size:12px;font-weight:500}
.pick-chip:hover{border-color:var(--orange-line);color:var(--text);text-decoration:none}
.pick-chip img{width:64px;height:64px;object-fit:contain}
.cat{margin:0 0 52px;scroll-margin-top:90px}
.cat-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.cat-head h2{margin:0;font-size:28px}
.cat-count{font-size:13px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;scroll-margin-top:90px;transition:border-color .18s,transform .18s}
.card:hover{border-color:var(--orange-line);transform:translateY(-2px)}
.card-media{position:relative;aspect-ratio:1/1;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:18px}
.card-media img{max-width:100%;max-height:100%;object-fit:contain}
.badges{position:absolute;top:10px;left:10px;display:flex;flex-direction:column;gap:6px;z-index:2}
.badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:6px}
.badge.pick{background:var(--orange);color:#000}
.badge.best{background:var(--orange-soft);color:var(--orange);border:1px solid var(--orange-line)}
.card-body{display:flex;flex-direction:column;gap:10px;padding:16px}
.brand{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--orange)}
.card-title{margin:0;font-family:'Inter',sans-serif;font-size:16px;font-weight:700;line-height:1.3;color:#fff}
.rating{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dim)}
.stars{letter-spacing:1px}.star{color:#4a453d}.star.full{color:var(--orange)}.star.half{background:linear-gradient(90deg,var(--orange) 50%,#4a453d 50%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.desc{margin:0;font-size:14px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{font-size:11px;color:var(--dim);border:1px solid var(--border);border-radius:999px;padding:3px 9px}
.nick{margin:0;padding:12px 14px;background:var(--orange-soft);border-left:3px solid var(--orange);border-radius:8px;font-size:13px;font-style:italic;color:#e8e2d5;position:relative}
.nick .nick-mark{color:var(--orange);font-size:20px;font-weight:700;margin-right:4px}
.nick cite{display:block;margin-top:8px;font-style:normal;font-weight:700;font-size:12px;color:var(--orange)}
.price-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:auto;padding-top:6px}
.price{display:flex;align-items:baseline;gap:8px}
.price .now{font-size:22px;font-weight:800;color:var(--orange)}
.price .orig{font-size:14px;color:var(--muted);text-decoration:line-through}
.buy{background:var(--orange);color:#000!important;font-weight:700;font-size:14px;padding:10px 18px;border-radius:8px}
.buy:hover{text-decoration:none;opacity:.92}
.benefits{border-top:1px solid var(--border);padding-top:10px}
.benefits-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block;margin-bottom:7px}
.benefits ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.benefits li{font-size:11px;color:var(--orange);background:var(--orange-soft);border-radius:999px;padding:3px 9px}
.benefits li::before{content:'\u2713 ';font-weight:700}
.faq{margin:56px 0 32px;padding:28px;background:var(--card);border:1px solid var(--border);border-radius:14px}
.faq h2{margin:0 0 16px;font-size:26px}
.faq-item{border-top:1px solid var(--border);padding:14px 0}.faq-item:first-of-type{border-top:0;padding-top:2px}
.faq-item summary{cursor:pointer;font-weight:600;color:var(--text);list-style:none;padding:4px 0;font-size:16px}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::after{content:'+';color:var(--orange);float:right;font-size:20px;line-height:1}
.faq-item[open] summary::after{content:'\u2013'}
.faq-item p{margin:8px 0 4px;color:var(--dim)}
.disclosure{margin-top:40px;padding:20px 22px;background:var(--card);border:1px solid var(--border);border-radius:12px;font-size:13px;color:var(--dim)}
.disclosure p{margin:0 0 10px}.disclosure p:last-child{margin-bottom:0}
.disclosure .non-clinical{color:var(--muted)}
.site-footer{border-top:1px solid var(--border);padding:28px 20px;text-align:center}
.footer-inner{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:center;font-size:13px;color:var(--muted)}
.footer-tag{color:var(--orange);font-weight:800;letter-spacing:.1em;font-size:12px}
@media(max-width:640px){.wrap{padding:16px 14px 60px}.hero{padding:28px 10px 32px}.grid{grid-template-columns:1fr}}
`;
}

export function registerStoreRoutes(app: Express): void {
  const paths = ['/recovery/store', '/store'];
  for (const p of paths) {
    app.get(p, (_req, res) => {
      const html = renderPage();
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
      res.set('X-SRA-SSR', '1');
      res.set('X-SRA-Store', '1');
      res.send(html);
    });
  }
}

// Advertise the store URL to sitemaps.
export function getStorePageUrls(): { url: string; title: string; lastmod: string; priority: string; changefreq: string }[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    { url: STORE_PATH, title: 'Recovery Store', lastmod: today, priority: '0.90', changefreq: 'weekly' },
  ];
}
