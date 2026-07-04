---
name: Auth backend topology
description: Why two auth backends coexist and the invariants for keeping one canonical sign-in flow without regressing emailed links.
---

# Auth backend topology

Two auth backends coexist and both bridge into `isAuthenticated`. Do not collapse
them — each still owns flows the other doesn't. The passport family is canonical;
the older session family is kept only for the flows below.

- **Canonical = passport family** (login, register, magic-link send + verify).
  Establishes a passport session (`req.login`). The single sign-in page and modal
  use this.
- **Kept = session family** — retained for forgot/reset password and as the
  alias for magic-link links already emailed by the old backend.

## Invariants (why they exist)

- **One sign-in page; deprecated routes redirect, never 404.** Emailed and
  bookmarked auth links must survive consolidation, so old auth routes redirect
  to the canonical page *preserving the query string* (`next`, `tab`, `mode`).
- **One magic-link verifier code path.** There are two live token stores (a
  canonical one and a legacy one). The canonical verifier checks canonical first,
  then falls back to legacy, so previously-emailed links keep working. Both
  emailed link shapes must terminate in this same handler — never fork the
  verification logic again.
- **Centralized post-auth routing.** Every auth success (OTP/password/register/
  magic-link/alias) routes through one helper: honor `?next`, else send new users
  to onboarding and returning users to the dashboard. Never hardcode a
  destination in an individual handler.
- **Invalidate both auth caches on success**, since either backend may hold the
  session.
- Welcome / recovery-welcome screens are onboarding, **not** sign-in — leave them
  distinct.
