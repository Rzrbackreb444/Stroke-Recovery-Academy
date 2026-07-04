---
name: Business Intelligence metrics
description: How the in-house admin BI dashboard is built — activation definition, compute-from-source approach, snapshot trends.
---

# Business Intelligence (admin Business dashboard)

Admin-only in-house analytics (no third-party vendor). Grep `biMetricsService`
for the engine, routes, and dashboard page.

## Activation definition (product decision)
A survivor is **activated** = intake complete (`user_profiles.intake_completed_at`
set) AND ≥1 `daily_checkins` row AND ≥1 `sasquatch_chat_messages` with `role='user'`.
The "aha" = profile set up + both core recovery loops touched.
**Why:** needed one defensible, computable activation metric; picking the two core
loops (check-in + coach) avoids gaming by a single trivial action.

## Compute-from-source-of-truth (architecture decision)
Top-of-funnel (signup/intake/activation/retained) is COMPUTED from source tables
(`users`, `user_profiles`, `daily_checkins`, `sasquatch_chat_messages`,
`user_streaks`) rather than raw event capture. The paid sub-funnel
(page_view→checkout→trial→paid) reuses the existing `subscription_funnel_events`
table (`sasquatchFunnelService`); revenue reads `sasquatch_premium_subscriptions`
state joined to Stripe price amounts.
**Why:** DB-computed numbers are always exact and self-heal — no fragile
cross-app client instrumentation to keep in sync. Only add GA `trackEvent`
milestones where surgical.
**How to apply:** when extending BI, prefer a new SQL aggregate in
`biMetricsService` over adding a new event type + client instrumentation.

## Trend history
Daily snapshot job `bi-daily-snapshot` (04:45 UTC) upserts one row/UTC-day into
runtime-provisioned `bi_daily_snapshots` (keyed on `snapshot_date`, idempotent).
`getTrends` must coerce `mrr_cents` (BIGINT → string from Neon) back to number.
Date filters use the `(now()::date - (${n} || ' days')::interval)` pattern —
`date - integer` param binding fails with "operator does not exist: date >= integer".
