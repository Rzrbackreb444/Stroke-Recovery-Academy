---
name: Recovery SEO surfaces
description: Public recovery metadata is emitted by both React and server-side SEO paths.
---

Public recovery SEO has two independent emission paths: the React RecoverySEO component and the server/shared SSR route metadata and schema generators. Safety-sensitive claims and schema classifications must be checked in both paths.

**Why:** A preview can look corrected while crawlers still receive stale server-rendered JSON-LD or metadata from the duplicate SEO path.

**How to apply:** When changing recovery public positioning, search and update both client/src/components/RecoverySEO.tsx and shared/seo plus server/seo emitters, then inspect the rendered preview and production bundle.