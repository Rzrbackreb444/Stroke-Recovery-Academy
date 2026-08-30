import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import express from 'express';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { ALL_BLOG_POSTS } from '../server/seo/blogContent';
import { getBlogPageUrls, registerBlogRoutes, registerCrawlerSitemapRoute } from '../server/seo/blogRoutes';

const GUIDE_SLUGS = [
  '/blog/stroked-out-sasquatch-recovery-book-review',
  '/blog/stroke-recovery-cardio-and-mobility-gear-guide',
  '/blog/stroke-recovery-hand-and-brain-tools-guide',
  '/blog/stroke-recovery-home-safety-and-adaptive-gear',
] as const;

const PURCHASE_INTENT_SLUGS = [
  '/blog/best-stroke-recovery-equipment-for-home',
  '/blog/stroke-transfer-equipment-caregiver-guide',
  '/blog/adaptive-utensils-after-stroke-buying-guide',
  '/blog/tub-transfer-bench-after-stroke-buying-guide',
  '/blog/seated-cardio-equipment-after-stroke',
] as const;

type RouteHandler = (_req: unknown, res: {
  set: (name: string, value: string) => void;
  send: (html: string) => void;
}) => void;

function registeredBlogRoutes(): Map<string, RouteHandler> {
  const routes = new Map<string, RouteHandler>();
  const app = {
    get(path: string, handler: RouteHandler) {
      routes.set(path, handler);
    },
  };
  registerBlogRoutes(app as never);
  return routes;
}

function renderRoute(path: string): string {
  const handler = registeredBlogRoutes().get(path);
  assert.ok(handler, `expected SSR route to be registered for ${path}`);

  let html = '';
  handler({}, {
    set() {},
    send(value) {
      html = value;
    },
  });
  assert.ok(html, `expected SSR route ${path} to render HTML`);
  return html;
}

test('the four new guides stay registered, render through SSR, and remain in the sitemap', () => {
  const registrySlugs = new Set(ALL_BLOG_POSTS.map(post => post.url));
  const sitemapSlugs = new Set(getBlogPageUrls().map(page => page.url));

  for (const slug of GUIDE_SLUGS) {
    assert.ok(registrySlugs.has(slug), `${slug} is missing from the blog registry`);
    assert.ok(sitemapSlugs.has(slug), `${slug} is missing from the blog sitemap data`);

    const html = renderRoute(slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://strokerecoveryacademy\\.com${slug.replaceAll('/', '\\/')}"`));
    assert.match(html, /"@type":"(?:Article|MedicalWebPage)"/);
    assert.match(html, /"@type":"FAQPage"/);
    assert.match(html, /class="sra-related"/);
    assert.match(html, /Also check out/);
  }
});


test('the crawler-facing sitemap endpoint publishes all four recovery guides', async () => {
  const app = express();
  registerCrawlerSitemapRoute(app);
  const server: Server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/sitemap.xml`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/xml/);
    const xml = await response.text();
    assert.equal(XMLValidator.validate(xml), true, 'sitemap response should be valid XML');
    const sitemap = new XMLParser().parse(xml);
    assert.ok(sitemap.urlset, 'sitemap response should parse as a urlset document');

    for (const slug of GUIDE_SLUGS) {
      assert.match(xml, new RegExp(`<loc>https://strokerecoveryacademy\\.com${slug.replaceAll('/', '\\/')}</loc>`));
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('affiliate CTAs preserve supplied short links and safely tag full Amazon links', () => {
  const previousTag = process.env.AMAZON_AFFILIATE_TAG;
  process.env.AMAZON_AFFILIATE_TAG = 'sra-test-20';

  try {
    let renderedFullAmazonLink = false;
    let renderedSuppliedShortLink = false;
    for (const slug of GUIDE_SLUGS) {
      const html = renderRoute(slug);
      const amazonLinks = [...html.matchAll(/<a href="([^"]+)"[^>]*>/g)]
        .map(match => match[0])
        .filter(anchor => /(?:amazon\.com|amzn\.to)/i.test(anchor));

      assert.ok(amazonLinks.length > 0, `${slug} should render an Amazon CTA`);
      for (const anchor of amazonLinks) {
        assert.match(anchor, /target="_blank"/);
        assert.match(anchor, /rel="[^"]*noopener[^"]*noreferrer[^"]*"/);
      }

      if (/https:\/\/amzn\.to\/4ikLfGH/.test(html)) {
        renderedSuppliedShortLink = true;
        assert.doesNotMatch(html, /https:\/\/amzn\.to\/4ikLfGH\?tag=/);
      }
      if (/https:\/\/www\.amazon\.com\/dp\/[^"]+\?tag=sra-test-20/.test(html)) {
        renderedFullAmazonLink = true;
      }
    }
    assert.ok(renderedSuppliedShortLink, 'the supplied amzn.to destination should remain available');
    assert.ok(renderedFullAmazonLink, 'at least one full Amazon destination should receive the affiliate tag');
  } finally {
    if (previousTag === undefined) delete process.env.AMAZON_AFFILIATE_TAG;
    else process.env.AMAZON_AFFILIATE_TAG = previousTag;
  }
});

test('purchase-intent guides have buyer-useful structure and product-specific Amazon CTAs', () => {
  const registrySlugs = new Set(ALL_BLOG_POSTS.map(post => post.url));

  for (const slug of PURCHASE_INTENT_SLUGS) {
    assert.ok(registrySlugs.has(slug), `${slug} is missing from the blog registry`);

    const html = renderRoute(slug);
    assert.match(html, /"@type":"FAQPage"/, `${slug} should include FAQ schema`);
    assert.match(html, /Before you buy|What to verify|What .* verify|Questions to ask/i, `${slug} should include buying checks`);
    assert.match(html, /<table[^>]*>/, `${slug} should include a comparison table`);
    assert.match(html, /See .* on Amazon|Review .* on Amazon/i, `${slug} should use a product-specific Amazon CTA`);
    assert.doesNotMatch(html, />Check Current Price(?:\s|<)/, `${slug} should not use the generic price CTA`);

    const amazonAnchors = [...html.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .filter(([, href]) => /(?:amazon\.com|amzn\.to)/i.test(href));
    assert.ok(amazonAnchors.length > 0, `${slug} should render direct Amazon links`);
    for (const [anchor] of amazonAnchors) {
      assert.match(anchor, /target="_blank"/);
      assert.match(anchor, /rel="[^"]*noopener[^"]*noreferrer[^"]*sponsored[^"]*nofollow[^"]*"/);
    }
  }
});

test('purchase-intent recommendations stay matched to their supplied destinations', () => {
  const expectedProducts = new Map([
    ['/blog/best-stroke-recovery-equipment-for-home', ['Drive Medical Tub Transfer Bench', 'https://amzn.to/4ydBDT9']],
    ['/blog/stroke-transfer-equipment-caregiver-guide', ['Joerns Hoyer Advance Electric Portable Patient Lift', 'https://amzn.to/4cgQm7b']],
    ['/blog/adaptive-utensils-after-stroke-buying-guide', ['Cozentra Adjustable Adaptive Utensils 4-Piece Set', 'https://amzn.to/4hWFuPw']],
    ['/blog/tub-transfer-bench-after-stroke-buying-guide', ['Drive Medical Tub Transfer Bench for Bathtub', 'https://amzn.to/4ydBDT9']],
    ['/blog/seated-cardio-equipment-after-stroke', ['MERACH Recumbent Exercise Bike', 'https://www.amazon.com/dp/B0CR7JDT9G']],
  ]);

  for (const [slug, [product, destination]] of expectedProducts) {
    const html = renderRoute(slug);
    assert.match(html, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('buying-guide retailer links carry anonymous click dimensions and a fire-and-forget tracker', () => {
  for (const slug of PURCHASE_INTENT_SLUGS) {
    const html = renderRoute(slug);
    assert.match(html, /\/api\/analytics\/blog-view/);
    assert.match(html, /articleSlug: "[a-z0-9-]+"/);
    assert.match(html, /\/api\/analytics\/blog-outbound-click/);

    const retailerAnchors = [...html.matchAll(/<a href="([^"]+)"[^>]*>/g)]
      .map((match) => match[0])
      .filter((anchor) => /(?:amazon\.com|amzn\.to)/i.test(anchor));
    assert.ok(retailerAnchors.length > 0, `${slug} should render retailer links`);

    for (const anchor of retailerAnchors) {
      assert.match(anchor, /data-sra-outbound-click="true"/);
      assert.match(anchor, /data-article-slug="[^"]+"/);
      assert.match(anchor, /data-product-category="[^"]+"/);
      assert.match(anchor, /data-recommendation="[^"]+"/);
      assert.match(anchor, /rel="[^"]*sponsored[^"]*nofollow[^"]*"/);
    }
  }
});