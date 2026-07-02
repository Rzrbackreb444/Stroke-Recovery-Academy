---
name: Replit OIDC e2e login
description: How to make the testing skill authenticate through Replit OIDC without hitting the real login page
---

When running `runTest` against Replit OIDC-protected flows, pass `testReplitAuth: true`, set claims with an `[OIDC]` step, and trigger login by clicking the app's own "Sign In" entry (which navigates to `/api/login`). Never let the test agent type a username/email/password — with the override, claims auto-apply and the app returns logged-in.

**Why:** Direct-navigating to a page that does a hard `window.location.href = "/api/login?returnTo=..."` redirect can land the test agent on the real replit.com login/signup page ("Invalid username or password"), where credential entry fails. Starting from the homepage and clicking Sign In routed cleanly through the test-auth override.

**How to apply:** For any authed intake/dashboard e2e test — configure `[OIDC]` claims first, click the in-app Sign In button, verify the header shows the authed state, then navigate to the target page. Instruct the agent explicitly: if a real Replit password page appears, report it as an override failure rather than entering credentials.
