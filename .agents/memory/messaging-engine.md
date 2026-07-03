---
name: Unified lifecycle messaging engine
description: How platform-wide non-transactional messaging routes across email/push/sms with consent, quiet hours, and dedupe.
---

# Unified messaging engine

`server/messaging/index.ts::sendMessage()` is the ONE entry point for
non-request-scoped messages (lifecycle journeys, drip, batch nudges). It routes to
Resend email, web push, and SMS (`./smsProvider`).

**Self-provisioning:** `ensureMessagingSchema()` (in `index.ts`) runs raw `db.execute`
DDL on boot to create `message_deliveries` + the notification-preference columns.
**Why:** `db:push` is blocked (see db-push-stripe-schema.md), so this feature
provisions its own tables idempotently instead of relying on migrations. There is no
`migrations/*_messaging*.sql` — do not add one.

**Ordering inside sendMessage:**
1. `unsubscribedAll` short-circuit → skipped.
2. Dedupe claim (if `dedupeKey`) — atomic INSERT into `message_deliveries` with a
   UNIQUE `dedupe_key`; `ON CONFLICT DO NOTHING` (0 rows) means the step already fired.
   Lifecycle steps pass deterministic keys so each fires exactly once. A transient
   send failure DELETES the claim row so the next run retries (claim-release).
3. Per-channel gating: email/push/sms enable switches; SMS requires `smsPhone` present
   and is inert until `SMS_ENABLED=true` + provider creds; quiet hours apply to
   push+sms only (email is non-interruptive), gated by `timezone` (`isValidTimezone`).

**Consent/opt-out state** lives on `notification_preferences`: `sms_phone`,
`sms_consent_at`, `unsubscribed_all`, `quiet_hours_start/end`, `timezone`. Legacy
per-type prefs (e.g. journalNudges) are merged in from the users jsonb. Public
unsubscribe + inbound SMS webhook are in `server/messaging/routes.ts` (registered in
`server/routes.ts` after `setupAuth`); HMAC unsubscribe tokens in `unsubscribe.ts`.

**Lifecycle journeys** run via a scheduler job (`server/scheduler/registerJobs.ts`)
calling `server/lifecycleService.ts`: onboarding, win-back, trial-ending. Trial
detection keys off `stripe.subscriptions.current_period_end` (integer epoch) for
`status='trialing'` — NOT `trial_end` (jsonb in the stripe-replit-sync mirror).

**No crisis gate here.** This engine sends only static lifecycle/drip copy — no
AI-authored bodies flow through it, so there is no crisis pre-gate (unlike the AI
Coach / Recovery Anchor, which gate their own AI output). If AI-generated bodies are
ever routed through `sendMessage`, a crisis gate MUST be added in front of them.
