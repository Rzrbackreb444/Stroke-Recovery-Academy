---
name: Neon route-test teardown
description: Cleanup behavior for route-level integration tests that use the shared Neon database client
---

Neon-backed integration tests can finish their database work while idle socket
handles remain referenced by the Node process. Calling the pool's `end()` is
still required, but teardown may also need to unref leftover active handles so
the test runner exits.

**Why:** A route test can pass all assertions yet time out because the Neon
client keeps idle TLS sockets alive after its shutdown promise resolves.

**How to apply:** Capture and clear test-created timers, close the HTTP server,
end the pool, then unref remaining active handles in tests that use the shared
Neon client. Keep this local to test teardown rather than changing production
connection behavior.