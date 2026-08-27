---
name: Recovery durability testing
description: Constraints for running recovery transaction tests against disposable PostgreSQL
---

The recovery durability suite can use a disposable local PostgreSQL cluster, but the
application's normal Neon WebSocket client cannot connect to that cluster. Test mode
must use the node-postgres driver and must pass connection URL credentials explicitly
because the workspace may export PGUSER/PGHOST values that otherwise override them.

**Why:** The Replit workspace provides PostgreSQL binaries, while local TCP servers do
not speak Neon's WebSocket protocol and the inherited PostgreSQL environment points at
an unrelated shared service.

**How to apply:** Run the dedicated recovery durability test command; it creates and
destroys an isolated cluster unless RECOVERY_TEST_DATABASE_URL is explicitly supplied.

Unexpected disconnects from an active node-postgres client must have a client-level
error listener; a pool-level listener alone cannot catch the error while the client
is checked out for a Drizzle transaction.

**Why:** Terminating a backend during transaction cleanup otherwise emits an uncaught
client error before pg-pool can reclaim the dead connection, even though the next
pool request can succeed.

**How to apply:** Keep the listener limited to the local node-postgres durability
configuration and verify a retry obtains a different backend PID after the failed
transaction.