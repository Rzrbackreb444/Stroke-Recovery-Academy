---
name: Brand accent color + Tailwind arbitrary-value gotcha
description: The canonical brand orange, how it's tokenized, and the rgba-in-className pitfall that breaks glows
---

# Brand accent

The homepage ("money" reference look) accent is a vivid ORANGE, not the old amber.
- Token: `--gold: 27 78% 50%` in `client/src/index.css`; Tailwind `gold` → `text-gold`/`bg-gold`/`border-gold/40`. `bg-gold` pairs with `text-black` (no `gold-foreground` token exists). `.text-gold-ink` (hsl 24 88% 36%) is the darker variant for orange text on LIGHT backgrounds.
- Literal hex equivalent used in arbitrary-value classNames/inline styles: `#E2741B`. rgba glow form: `rgba(226,116,27,a)`.
- The old amber `#C9941A` / `rgba(201,148,26,a)` is RETIRED platform-wide. Don't reintroduce it.

**Why:** brand cohesion — every page should match the homepage orange so the platform "looks like money."
**How to apply:** prefer the `gold` token in new work; if you must use a literal, use `#E2741B` / `rgba(226,116,27,a)`.

## Gotcha: rgba with spaces breaks Tailwind arbitrary-value classes

Inside `className` arbitrary values like `shadow-[0_0_60px_rgba(226,116,27,0.15)]`, the rgba MUST have NO spaces. Tailwind/class tokenization splits on whitespace, so `rgba(226, 116, 27, 0.15)` silently produces invalid classes and the glow/shadow is dropped.
- CSS files and inline `style={{}}` objects tolerate spaces; className arbitrary values do NOT.
- A bulk `sed` that introduces spaces into an rgba triple will silently break every `shadow-[...]`/`bg-[...]` glow it touches. Always normalize to no-space form (`rgba(r,g,b,a)`) after such a sweep.

**Why:** a sweep that replaced `201, 148, 26` → `226, 116, 27` (keeping spaces) broke brand glows across ~6 high-traffic pages; caught only in architect review, not by HMR (no compile error).
