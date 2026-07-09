// SSR blog routes — registers /blog/[slug] for each post in blogContent.ts
// and the /blog hub. Mirrors the landingRoutes pattern; must be registered
// before the Vite/SPA catch-all so the SSR HTML wins.

import type { Express } from 'express';
import { renderSsrPage } from './ssrShell';
import { ALL_BLOG_POSTS, BLOG_HUB } from './blogContent';

const ALL_BLOG_PAGES = [BLOG_HUB, ...ALL_BLOG_POSTS];

export function registerBlogRoutes(app: Express): void {
  for (const page of ALL_BLOG_PAGES) {
    // Show the free "First 40 Days" lead-magnet CTA on individual blog posts —
    // the main organic-search entry point for brand-new survivors — but not on
    // the /blog hub itself.
    const pageToRender = page.url === BLOG_HUB.url ? page : { ...page, leadMagnet: true };
    app.get(page.url, (_req, res) => {
      const html = renderSsrPage(pageToRender);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
      res.set('X-SRA-SSR', '1');
      res.set('X-SRA-Blog', '1');
      res.send(html);
    });
  }
}

// Used by sitemap-recovery to advertise these URLs to search engines.
export function getBlogPageUrls(): { url: string; title: string; lastmod: string; priority: string; changefreq: string; imageUrl?: string }[] {
  const today = new Date().toISOString().split('T')[0];
  // Compute the true freshest blog date from publishedDate (set on new posts)
  const blogDates = ALL_BLOG_PAGES.map(p => p.publishedDate).filter(Boolean) as string[];
  const freshestBlogDate = blogDates.length > 0
    ? blogDates.sort((a, b) => b.localeCompare(a))[0]
    : today;

  return ALL_BLOG_PAGES.map(p => {
    const firstImage = p.sections.find(s => s.image)?.image;
    const imageUrl = firstImage
      ? (typeof firstImage === 'string' ? firstImage : firstImage.src)
      : undefined;
    // Use publishedDate (set on every post) for lastmod so Google sees freshness
    const lastmod = p.publishedDate || p.modifiedDate || today;
    return {
      url: p.url,
      title: p.title,
      lastmod,
      priority: p.url === '/blog' ? '0.85' : '0.80',
      changefreq: p.url === '/blog' ? 'weekly' : 'monthly',
      imageUrl,
    };
  });
}

// The freshest date across all blog posts — used by sitemap-index.xml
export function getBlogFreshestDate(): string {
  const today = new Date().toISOString().split('T')[0];
  const blogDates = ALL_BLOG_PAGES.map(p => p.publishedDate).filter(Boolean) as string[];
  return blogDates.length > 0
    ? blogDates.sort((a, b) => b.localeCompare(a))[0]
    : today;
}
