// shared/seo/routeMeta.ts
//
// COMPAT SHIM. The single source of truth is now `routeRegistry.ts`. This file
// preserves the legacy `lookupRouteMeta` / `isPrivatePath` / `RouteMeta` exports
// so existing imports keep working unchanged.

import { lookupRoute, isPrivatePath as registryIsPrivate } from "./routeRegistry";

const BRAND = "Stroke Recovery Academy";

export interface RouteMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
  schemaType?: "WebPage" | "Article" | "MedicalWebPage" | "AboutPage" | "CollectionPage" | "FAQPage" | "Product" | "Course" | "Service" | "ContactPage";
}

export function lookupRouteMeta(pathname: string): RouteMeta | null {
  const entry = lookupRoute(pathname);
  if (entry) {
    return {
      title: entry.title,
      description: entry.description,
      keywords: entry.keywords,
      noindex: entry.noindex,
      schemaType: entry.schemaType,
    };
  }
  // Unknown path → fall through to a sensible default (NOT silent noindex).
  // The crawler still gets a usable WebPage; the registry catches anything
  // that should be private via explicit noindex patterns.
  return {
    title: BRAND,
    description: `Discover ${BRAND} — the AI creator platform powering Stroke Recovery Academy and the Marketplace marketplace.`,
    schemaType: "WebPage",
  };
}

export function isPrivatePath(pathname: string): boolean {
  return registryIsPrivate(pathname);
}

// Re-export the registry for callers who want richer typing.
export { lookupRoute, ROUTES, getStaticSitemapEntries, getRegistryStats } from "./routeRegistry";
export type { RouteEntry, RouteCategory, RouteIntent, SchemaType } from "./routeRegistry";
