import { lookupRouteMeta, type RouteMeta } from "../../shared/seo/routeMeta";
import { lookupRoute } from "../../shared/seo/routeRegistry";
import { generateRouteSchemas, renderJsonLdScripts } from "../../shared/seo/schemaGenerator";

const SITE_ORIGIN_DEFAULT = "https://strokerecoveryacademy.com";

/**
 * Allowlist of hosts whose canonical we are willing to honor. Anything else
 * (including unknown public preview domains and attacker-supplied Host headers)
 * collapses to the canonical production origin so we never emit a poisoned
 * canonical that could be cached by Google or AI crawlers.
 */
const CANONICAL_HOST_ALLOWLIST = new Set<string>([
  "strokerecoveryacademy.com",
  "www.strokerecoveryacademy.com",
]);

function resolveCanonicalOrigin(host: string | undefined): string {
  // Explicit env override wins (set CANONICAL_ORIGIN in deploys).
  const envOrigin = process.env.CANONICAL_ORIGIN?.trim();
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  if (!host) return SITE_ORIGIN_DEFAULT;
  // Strip port + lowercase for matching.
  const bareHost = host.split(":")[0].toLowerCase();
  if (CANONICAL_HOST_ALLOWLIST.has(bareHost)) {
    return `https://${bareHost}`;
  }
  return SITE_ORIGIN_DEFAULT;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHead(meta: RouteMeta, canonical: string): string {
  const title = meta.title;
  const desc = meta.description;
  const ogTitle = meta.ogTitle ?? title;
  const ogDesc = meta.ogDescription ?? desc;
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1";

  return [
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<title>${escapeAttr(title)}</title>`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta name="description" content="${escapeAttr(desc)}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta name="robots" content="${robots}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<link rel="canonical" href="${escapeAttr(canonical)}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta property="og:title" content="${escapeAttr(ogTitle)}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta property="og:description" content="${escapeAttr(ogDesc)}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Stroke Recovery Academy">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta name="twitter:title" content="${escapeAttr(ogTitle)}">`,
    // nosemgrep: javascript.lang.security.html-in-template-string
    `<meta name="twitter:description" content="${escapeAttr(ogDesc)}">`,
  ].join("\n    ");
}

/**
 * Rewrites the SPA index.html `<head>` so the served HTML carries route-specific
 * meta + JSON-LD BEFORE bytes leave the server. Critical for AI crawlers (GPTBot,
 * Claude-Web, PerplexityBot) and traditional search engines that don't execute
 * client JS.
 *
 * Routes with their own SSR handlers (programmatic, blog, landing, center finder)
 * never reach this code path — they short-circuit upstream.
 */
export function applyRouteMeta(html: string, url: string, host?: string): string {
  const path = url.split("?")[0].split("#")[0];
  const meta = lookupRouteMeta(path);
  if (!meta) return html; // unknown route — leave default homepage meta intact

  const origin = resolveCanonicalOrigin(host);
  const canonical = `${origin}${path}`;
  const newHead = buildHead(meta, canonical);

  // JSON-LD: emit Org + WebSite + Person + page schema for every indexable
  // route. Skip for noindex routes (don't pollute the knowledge graph with
  // private surfaces).
  let jsonLd = "";
  if (!meta.noindex) {
    const entry = lookupRoute(path);
    if (entry) {
      jsonLd = renderJsonLdScripts(generateRouteSchemas(entry, canonical));
    }
  }

  // Strip existing meta (keep <head> and the rest of the document intact).
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:title["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:url["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:type["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:site_name["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:card["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:title["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:description["'][^>]*>/gi, "");

  // Inject the new head block (and any JSON-LD) right after <head>.
  const inject = jsonLd ? `${newHead}\n    ${jsonLd}` : newHead;
  out = out.replace(/<head([^>]*)>/i, (m) => `${m}\n    ${inject}`);
  return out;
}
