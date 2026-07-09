/**
 * Serialize an object as a JSON-LD script body that cannot be broken out of
 * with a `</script>` token in any string field. Mirrors the server-side
 * `jsonLd()` helper in `server/seo/ssrShell.ts` so the same guarantee
 * applies whether SEO/JSON-LD is rendered by SSR or React.
 *
 * Use as the child of a `<script type="application/ld+json">` tag, either
 * via `dangerouslySetInnerHTML={{ __html: safeJsonLd(obj) }}` or by passing
 * the returned string as the script's text child.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
