export function buildAmazonUrl(asinOrUrl: string, tag: string | null | undefined): string {
  const base = /^https?:\/\//i.test(asinOrUrl)
    ? asinOrUrl
    : `https://www.amazon.com/dp/${encodeURIComponent(asinOrUrl)}`;

  if (!tag) return base;

  try {
    const url = new URL(base);
    if (!/(^|\.)amazon\./i.test(url.hostname)) return base;
    url.searchParams.set("tag", tag);
    return url.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}tag=${encodeURIComponent(tag)}`;
  }
}

export function buildAmazonSearchUrl(query: string, tag: string | null | undefined): string {
  const url = new URL("https://www.amazon.com/s");
  url.searchParams.set("k", query);
  if (tag) url.searchParams.set("tag", tag);
  return url.toString();
}

export function asinFromUrl(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}
