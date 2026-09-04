---
name: Authenticated route integration fixtures
description: Constraints for exercising the full Express route registration with local authenticated sessions in disposable PostgreSQL tests
---

Whole-app route tests using local login must provide the session-store table and the complete user columns selected by the authentication query, not only the columns used by the feature under test. Route modules that start schedulers must be imported while test timer interception is active, and the HTTP server must close its connections during teardown.

**Why:** The application can otherwise fail before the target request with a missing `sessions` relation, or pass while leaving module-level scheduler timers and pooled HTTP connections alive.

**How to apply:** Shape disposable auth tables like production, apply any feature migrations the route depends on, authenticate through the real login route, intercept timers before dynamically importing route registration, and close tracked timers/connections in `finally`.

Route fixtures that exercise canonical survivor-profile writes must also pass `Date` instances to Drizzle timestamp columns; ISO strings are appropriate for provenance JSON, not timestamp driver values.

**Why:** A route can fail before its target assertion when a disposable database is one migration behind, and Drizzle's timestamp mapper rejects string values even when TypeScript casts them.

**How to apply:** Keep the fixture's required migrations idempotent and preserve native `Date` values at database boundaries.