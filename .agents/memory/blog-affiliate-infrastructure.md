---
name: Blog Affiliate Infrastructure
description: How product cards and book promos are rendered on SSR blog posts via ssrShell.ts
---

**Pattern:** Optional `productCard` and `bookPromo` fields on `SsrPageConfig` (in `server/seo/ssrShell.ts`). When present, `renderSsrPage()` emits an `.sra-affiliate` section after the FAQs and before the final CTA.

**Why:** Product showcase posts need a prominent product card with the Amazon affiliate link, plus a book promo to cross-sell the book. The book promo uses a gold border to distinguish it from the product card.

**How to apply:**
- Add `productCard?: { title, description, link, label, note? }` to the blog post input in `server/seo/blogContent.ts`
- Add `bookPromo?: { title, description, link, label }` similarly
- The `makeBlogPost()` helper passes these through to `SsrPageConfig`
- `renderSsrPage()` in `ssrShell.ts` renders both sections after the FAQ block
- The product card uses `target="_blank" rel="noopener noreferrer"` for external links
- The book promo uses a gold border (`style="border-color: var(--sra-gold);"`) for visual distinction
- All affiliate links must include the `note` field for FTC disclosure
