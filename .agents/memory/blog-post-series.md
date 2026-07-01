---
name: Recovery blog content pipeline
description: How the DB-backed recovery_blog_posts blog is authored, edited, and rendered — the non-obvious operational rules.
---

# Recovery blog content pipeline (recovery_blog_posts)

**Post CONTENT lives in Postgres (`recovery_blog_posts.content`), NOT in git/files.**
You cannot grep the repo for post text. Edit content with `psql "$DATABASE_URL"` using dollar-quoting
(e.g. `$DELIM_MD$...markdown...$DELIM_MD$`) to survive quotes/backslashes. `read_time = round(words/225)`;
bump `updated_at = now()` on any content change. Columns: id, slug, title, excerpt, content, category,
tags[], hero_image_url, author_name, status, read_time, updated_at (no reviewed_at).

**Live vs. restart:** DB content edits are LIVE immediately (no restart). Changes to the renderer /
any client code require restarting the "Start application" workflow (Vite HMR WS 400s in this env).

**Content must be pure Markdown in the renderMarkdown subset** (`client/src/pages/RecoveryBlogPost.tsx`):
only `##`/`###`/`####`, `-`, `1.`, `>`, `**bold**`, `*italic*`, `[text](url)`, and standalone block
images `![alt](/path)`. Raw HTML, tables, and code fences do NOT render — they appear as escaped text.
**Why:** several posts once stored escaped-HTML and rendered as visible tags; all 17 are now clean Markdown.
**How to apply:** when drafting, validate against this subset before the DB write; never paste HTML.

**FAQ → JSON-LD FAQPage** is driven by shape: `### Question?` + blank line + ONE plain answer paragraph
(>30 chars, links/bold stripped for the schema). Keep that exact shape or the FAQ rich-result breaks.

**Images:** hero + inline image src must pass the `safeImageUrl` allowlist — `https://` or local
`/images|/book|/assets/...`. Real blog assets live in `client/public/images/blog/` (~100 files).
Internal links must resolve to a real route in `client/src/App.tsx` (blog slugs + a small platform-path
set); citation links are restricted to an approved authority-domain allowlist for EEAT.
