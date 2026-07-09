import type { Express } from 'express';
import { renderSsrPage, renderSsr404 } from './ssrShell';
import { ALL_TIER1_PAGES, ALL_HUB_PAGES } from './landingContent';

const ALL_SSR_PAGES = [...ALL_TIER1_PAGES, ...ALL_HUB_PAGES];

// Detect crawlers/bots so we can serve SSR HTML to them with priority,
// while humans still get the SSR shell (then SPA hydrates if they click into the app).
const BOT_UA_RE = /(bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|ia_archiver|gptbot|chatgpt|claude|anthropic|perplexity|google-extended)/i;

export function isBotRequest(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA_RE.test(userAgent);
}

export function registerLandingRoutes(app: Express): void {
  // Register a GET handler for each Tier-1 + Hub page.
  // These take precedence over the Vite/SPA catch-all because they are registered first.
  for (const page of ALL_SSR_PAGES) {
    app.get(page.url, (_req, res) => {
      const html = renderSsrPage(page);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
      res.set('X-SRA-SSR', '1');
      res.send(html);
    });
  }
}

// Returns the list of canonical URLs we just registered (used by sitemap).
export function getSsrPageUrls(): { url: string; lastmod: string; priority: string; changefreq: string }[] {
  const today = new Date().toISOString().split('T')[0];
  // Hubs slightly higher priority than leaves; leaves get high priority too.
  const hubUrls = ALL_HUB_PAGES.map(p => ({
    url: p.url,
    lastmod: today,
    priority: '0.85',
    changefreq: 'monthly',
  }));
  const leafUrls = ALL_TIER1_PAGES.map(p => ({
    url: p.url,
    lastmod: today,
    priority: '0.90',
    changefreq: 'monthly',
  }));
  return [...hubUrls, ...leafUrls];
}

// Real 404 handler (must be the LAST middleware before the SPA fallback).
// We only return a 404 for paths that look like real human navigation but didn't match
// anything — i.e. we don't 404 every random asset miss because Vite handles those.
export function register404Handler(app: Express): void {
  // No-op — actual 404 handling is wired in app.ts after Vite middleware so we can
  // intercept before the SPA fallback. Kept for symmetry / future expansion.
}
