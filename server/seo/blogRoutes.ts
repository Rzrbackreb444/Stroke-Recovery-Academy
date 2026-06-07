// SSR blog routes — registers /blog/[slug] for each post in blogContent.ts
// and the /blog hub. Mirrors the landingRoutes pattern; must be registered
// before the Vite/SPA catch-all so the SSR HTML wins.

import type { Express } from 'express';
import { renderSsrPage } from './ssrShell';
import { ALL_BLOG_POSTS, BLOG_HUB } from './blogContent';

const ALL_BLOG_PAGES = [BLOG_HUB, ...ALL_BLOG_POSTS];

export function registerBlogRoutes(app: Express): void {
  for (const page of ALL_BLOG_PAGES) {
    app.get(page.url, (_req, res) => {
      const html = renderSsrPage(page);
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
  return ALL_BLOG_PAGES.map(p => {
    const firstImage = p.sections.find(s => s.image)?.image;
    const imageUrl = firstImage
      ? (typeof firstImage === 'string' ? firstImage : firstImage.src)
      : undefined;
    return {
      url: p.url,
      title: p.title,
      lastmod: p.modifiedDate || today,
      priority: p.url === '/blog' ? '0.85' : '0.80',
      changefreq: p.url === '/blog' ? 'weekly' : 'monthly',
      imageUrl,
    };
  });
}
