---
name: Stripe MCP versus application connector
description: Distinguishes agent-side Stripe MCP access from the Stripe credentials available to the deployed application.
---

An active Stripe MCP row in Replit Integrations does not make Stripe credentials available to application runtime code. The deployed app needs the Stripe application connector, or an explicitly configured server-side secret fallback already supported by the code.

**Why:** The MCP is an agent tool connection, while the application connector injects credentials into the running server. Treating an active MCP row as an app connection leaves checkout routes failing even though the Integrations screen says Stripe is active.

**How to apply:** When Stripe MCP is active but the app reports its connector is missing, verify the app endpoint and connector status separately. Prefer the application connector; if it is declined, use only existing configured secret names through server-side code and never expose their values.