---
name: Blog SSR pipeline gotchas
description: Two non-obvious behaviors in the SSR affiliate-blog — the expansion integrator is not idempotent and the FTC disclosure is conditional
---

## integrateExpansions.ts is NOT idempotent — re-running silently doubles content

`scripts/integrateExpansions.ts` appends pillar sections + FAQ expansions into `server/seo/blogContent.ts`. Running it a second time appends every section/FAQ **again**, so each expanded post renders its sections and FAQs twice (visible on the page as duplicated back-to-back H2s and repeated FAQ questions).

**Why it bites:** `scripts/auditBlogs.ts` only checks word-count buckets + a few technical issues — it has **no duplicate-section/FAQ detector**, so a double-run passes the audit clean while the rendered page is visibly broken.

**How to apply:**
- Treat the integrated content as already-in-HEAD. Do not re-run `integrateExpansions.ts` to "make sure." If you must recover, restore the file from HEAD (`git show HEAD:server/seo/blogContent.ts > server/seo/blogContent.ts`) rather than re-integrating.
- After any change to the expansion pipeline, verify against the **rendered page**, not just the audit: e.g. `curl -s /blog/how-long-does-stroke-rehab-take | grep -o "<a repeated heading>" | wc -l` should be 2 (1 TOC + 1 body), not 4.
- A worthwhile hardening if revisited: add a duplicate-H2 / duplicate-FAQ check to `auditBlogs.ts`.

## The inline FTC affiliate disclosure is CONDITIONAL, not sitewide

The inline "affiliate links / earn a commission" disclosure rendered by `server/seo/ssrShell.ts` only appears on blog pages that actually contain affiliate product links (product cards / Amazon `nicholaskreme-20` links). Pillar/narrative guides with **no** product links (e.g. `/blog/first-90-days-after-stroke`) correctly render **no** inline disclosure.

**Why:** FTC disclosure is only required where affiliate links exist; showing it on pages with nothing to disclose would be noise.

**How to apply:** Do not flag a missing inline disclosure on a no-product page as a bug. To confirm a page needs one, check for `nicholaskreme-20` / `amazon.com` in the rendered HTML first. (Note: the word "affiliate" also appears in sitewide footer chrome on every page — that is not the article-body disclosure.)
