// SSR blog routes — registers /blog/[slug] for each post in blogContent.ts
// and the /blog hub. Mirrors the landingRoutes pattern; must be registered
// before the Vite/SPA catch-all so the SSR HTML wins.

import type { Express } from 'express';
import { renderSsrPage } from './ssrShell';
import { ALL_BLOG_POSTS, BLOG_HUB } from './blogContent';
import { getStaticSitemapEntries } from '@shared/seo/routeRegistry';

const ALL_BLOG_PAGES = [BLOG_HUB, ...ALL_BLOG_POSTS];
const SITEMAP_ORIGIN = 'https://strokerecoveryacademy.com';

export type SitemapEntry = {
  path: string;
  priority: string;
  changefreq: string;
};

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

/**
 * Register the crawler-facing sitemap. Dynamic entries are supplied by the
 * application route so this module stays independent of database-backed posts.
 */
export function registerCrawlerSitemapRoute(
  app: Express,
  getDynamicEntries: () => Promise<SitemapEntry[]> = async () => [],
): void {
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const staticRoutes = getStaticSitemapEntries().map((entry) => ({
        path: entry.loc,
        priority: entry.priority.toFixed(2),
        changefreq: entry.changefreq,
      }));
      const dynamicRoutes = await getDynamicEntries();
      const blogRoutes = getBlogPageUrls().map((page) => ({
        path: page.url,
        priority: page.priority,
        changefreq: page.changefreq,
      }));
      const today = new Date().toISOString().split('T')[0];
      const allRoutes = [...staticRoutes, ...blogRoutes, ...dynamicRoutes];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${allRoutes.map((route) => `  <url>
    <loc>${SITEMAP_ORIGIN}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
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
