import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import express from 'express';
import { ALL_BLOG_POSTS } from '../server/seo/blogContent';
import { getBlogPageUrls, registerBlogRoutes, registerCrawlerSitemapRoute } from '../server/seo/blogRoutes';

const GUIDE_SLUGS = [
  '/blog/stroked-out-sasquatch-recovery-book-review',
  '/blog/stroke-recovery-cardio-and-mobility-gear-guide',
  '/blog/stroke-recovery-hand-and-brain-tools-guide',
  '/blog/stroke-recovery-home-safety-and-adaptive-gear',
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