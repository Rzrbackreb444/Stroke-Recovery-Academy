---
name: Blog Affiliate Infrastructure
description: How product cards and book promos are rendered on SSR blog posts via ssrShell.ts
---

**Pattern:** Optional `productCard` and `bookPromo` fields on `SsrPageConfig` (in `server/seo/ssrShell.ts`). When present, `renderSsrPage()` emits an `.sra-affiliate` section after the FAQs and before the final CTA.

**Rule:** Product-intent blog content should link directly to the relevant Amazon listing; do not route article readers through the Academy recovery store.

**Why:** The article is the high-intent recommendation surface, and an intermediary store adds friction while weakening the intended affiliate funnel.

**How to apply:** Use the specific ASIN/product URL for hero CTAs and product cards, keep the affiliate tag and `sponsored nofollow` attributes, and remove generic store links from article related-content lists.

**Why:** Product showcase posts need a prominent product card with the Amazon affiliate link, plus a book promo to cross-sell the book. The book promo uses a gold border to distinguish it from the product card.

**How to apply:**
- Add `productCard?: { title, description, link, label, note? }` to the blog post input in `server/seo/blogContent.ts`
- Add `bookPromo?: { title, description, link, label }` similarly
- The `makeBlogPost()` helper passes these through to `SsrPageConfig`
- `renderSsrPage()` in `ssrShell.ts` renders both sections after the FAQ block
- External affiliate links use `target="_blank" rel="sponsored nofollow noopener noreferrer"`; retain a visible FTC note on the corresponding product card
- The book promo uses a gold border (`style="border-color: var(--sra-gold);"`) for visual distinction
- Use an internal book/companion destination for Academy-owned editions; do not present it as the same product or format as a separately linked Amazon edition
