# Memory Index

- [Blog Affiliate Infrastructure](blog-affiliate-infrastructure.md) — Product cards and book promos on SSR blog posts
- [Amazon Affiliate Tag](amazon-affiliate-tag.md) — How the associate tag is applied to every product link platform-wide
- [storage RETURNING * casing](storage-returning-star-casing.md) — some storage.ts methods return snake_case raw rows, not camelCase; read both
- [Object storage /objects ACL](object-storage-objects-acl.md) — GET /objects enforces owner ACL only on visibility:private; null-policy/public bypass; mount after setupAuth
- [Mockup Preview Verification](mockup-sandbox-preview-verification.md) — app_preview hits main app, not /__mockup/; use external_url on dev domain
- [Reflections Feature Direction](reflections-feature-direction.md) — Founder wants survivor monetization proud/first-class; gentle only for brand-new users
- [staleTime Infinity list-mutation trap](staleinfinity-list-mutations.md) — Studio editor add/delete needs optimistic setQueryData, not just invalidateQueries
- [Brand accent](brand-accent.md) — Canonical orange (`gold` token / #E2741B), retired amber #C9941A, and the rgba-spaces-break-className gotcha
- [Recovery blog content pipeline](blog-post-series.md) — recovery_blog_posts content is DB-backed (edit via psql, live no-restart); pure-Markdown subset only; FAQ/image/link rules
- [Replit OIDC e2e login](replit-oidc-e2e-login.md) — testReplitAuth + click in-app Sign In (never type creds); hard window.location redirects can hit the real login page
- [Image performance pass](image-perf-pass.md) — sharp→webp+sed-repoint pattern; React 18 needs lowercase `fetchpriority` spread; app_preview caches un-versioned Vite modules (stale console)
- [Daily Accountability Loop](daily-accountability-loop.md) — DailyLoopCard on dashboard: morning brief (Gemini, cached to never_zero_audits.morning_brief), inline log (exercises/habits/mood/win PATCH checkin), coach context injection
- [Brand taxonomy](brand-taxonomy.md) — Stroke Lyfe Inc (nonprofit, keep) vs Stroked-Out Sasquatch / Stroke Recovery Academy (consumer); do not blanket-replace
- [Sasquatch logo asset](logo-asset.md) — served logo is 512px webp/png; 2000px master preserved at attached_assets/sasquatch-logo-master-2000.png
