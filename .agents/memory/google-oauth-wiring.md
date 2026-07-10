---
name: Google OAuth wiring
description: Three-part fix required to get Google OAuth working alongside Replit OIDC on this codebase.
---

# Google OAuth Wiring

## The Rule
Three things must all be true simultaneously for Google OAuth to work here:

1. `configurePassport()` (multiProviderAuth.ts) must be called from inside `setupAuth()` in replitAuth.ts — after `passport.initialize()` + `passport.session()` but before OIDC strategy setup.
2. A real `GET /api/auth/google/callback` route must exist, using `passport.authenticate('google', callback)` + `req.logIn()`.
3. `configurePassport()` must NOT call `passport.serializeUser/deserializeUser` — those belong to replitAuth.ts which stores the full user object (compatible with both Replit OIDC sessions and DB user rows).

**Why:** The manual redirect that existed in routes.ts bypassed Passport entirely (no state param, no code exchange). The callback URL it constructed used `req.protocol` which could return `http` behind the proxy. And the GoogleStrategy was registered in `configurePassport()` but `configurePassport()` was never called, so the strategy never existed. All three bugs combined to send users back to the sign-in screen.

**How to apply:** If Google OAuth is broken (loops back to sign-in), check these three conditions in order. Also verify `https://<domain>/api/auth/google/callback` is listed as an authorized redirect URI in Google Cloud Console.
