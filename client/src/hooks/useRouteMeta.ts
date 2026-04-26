import { useEffect } from "react";
import { useLocation } from "wouter";
import { lookupRouteMeta } from "@shared/seo/routeMeta";

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [_, name, propValue] = selector.match(/\[(name|property)="([^"]+)"\]/) ?? [];
    if (name && propValue) {
      el.setAttribute(name, propValue);
      document.head.appendChild(el);
    } else {
      return;
    }
  }
  el.setAttribute(attr, value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Updates document.title and head meta tags on client-side navigation so the
 * browser tab and social-share previews stay accurate as the user moves around
 * the SPA. The server-side injector handles the initial paint for crawlers;
 * this handles the in-app navigation experience.
 */
export function useRouteMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const meta = lookupRouteMeta(location);
    if (!meta) return; // unknown route — leave whatever was injected at load

    const ogTitle = meta.ogTitle ?? meta.title;
    const ogDesc = meta.ogDescription ?? meta.description;
    const robots = meta.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1";
    const canonical = `${window.location.origin}${location}`;

    document.title = meta.title;
    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[name="robots"]', "content", robots);
    setMeta('meta[property="og:title"]', "content", ogTitle);
    setMeta('meta[property="og:description"]', "content", ogDesc);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[name="twitter:title"]', "content", ogTitle);
    setMeta('meta[name="twitter:description"]', "content", ogDesc);
    setLink("canonical", canonical);
  }, [location]);
}
