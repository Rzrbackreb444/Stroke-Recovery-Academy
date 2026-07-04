---
name: SSR shell image escaping contract
description: How image URLs must flow into server/seo/ssrShell.ts cfg.image, and the JSON-LD vs HTML escaping split
---

# ssrShell cfg.image escaping contract

Any image URL handed to `server/seo/ssrShell.ts` (`cfg.image`) must be a RAW, validated URL. Do NOT HTML-entity-escape it before assignment.

- ssrShell owns per-context escaping: `escAttr()` for the og:image / twitter:image / hero `<img src>` HTML attributes, and `JSON.stringify` (inside `buildArticleSchema`) for the JSON-LD `image` field.
- Pre-escaping (e.g. a `safeImageUrl` that returns `escapeHtml(url)`) turns `&` in a query string into `&amp;`, which then lands *literally* inside the JSON-LD `image` value. JSON is never HTML-decoded, so the rich-result image URL is broken and validators reject it.

**Why:** an SSR route fed HTML-escaped Unsplash hero URLs (`?w=1200&q=80`) into cfg.image; JSON-LD emitted `?w=1200&amp;q=80`.

**How to apply:**
- In SSR route helpers, validate the URL (protocol/path allowlist) and return it raw. Escape only where you write it into rawHtml yourself — e.g. a markdown renderer's body `<img>` should `escapeHtml(src)` at emit.
- Absolute (`http…`) image URLs must bypass the `${SITE_URL}${path}` prefix. `buildArticleSchema` historically lacked the `startsWith('http')` guard that og:image/twitter:image already had — check/add both when introducing image-bearing SSR pages, or absolute URLs get double-prefixed (`https://site.comhttps://…`).
- Markdown link hrefs: if you `escapeHtml()` the whole line before running the `[label](url)` regex, decode the captured href (`&amp;`→`&`, etc.) before re-validating, or `safeUrl()` double-escapes it to `&amp;amp;` and the browser renders a literal `&amp;` in the URL.
