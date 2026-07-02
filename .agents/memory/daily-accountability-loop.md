---
name: Daily Accountability Loop
description: Architecture of the DailyLoopCard, its routes, storage layer, and coach context injection
---

## What was built

A full daily accountability loop wired into the recovery dashboard:

1. **Morning brief** — `POST /api/recovery/daily-loop/brief` calls Gemini to synthesize a terse survivor-voice brief from streak + recent reps + mood trend. Result cached to `never_zero_audits.morning_brief` + `morning_focus_items` (upserted by dateKey). Returns 200 with fallback on any Gemini error — card never breaks.

2. **Inline log** — `PATCH /api/recovery/checkin` updates `daily_checkins` with `exercises_logged` (text[]), `habits_completed` (text[]), `mood_score`, `energy_score`, `days_since_stroke`, `todays_win`. Creates a row if none exists for today.

3. **DailyLoopCard** (`client/src/pages/RecoveryDashboard.tsx`) — self-contained state machine placed above `<NeverZeroAuditHero />`:
   - `briefLoading` → loading skeleton
   - no checkin → brief text + 3 focus chips + log CTA
   - `logOpen` → inline form (8 exercise chips, 6 habit chips, mood/energy sliders, win field)
   - `hasCheckin + no audit` → compact "day logged" with Never Zero CTA
   - `hasCheckin + has audit` → green completion card with verdict + tomorrow suggestion

4. **Coach context injection** — `geminiService.ts` `userContext` type extended with `morningBrief` + `morningFocusItems`. Coach route fetches `getMorningBrief` in its parallel Promise.all. Coach knows what brief was sent without re-reading it aloud.

5. **NeverZero brief carry-over** — `NeverZero.tsx` re-fires the same `POST /api/recovery/daily-loop/brief` query (TanStack shared cache, staleTime 1hr, `retry: false`) and renders a banner above the tier hero so context is consistent whether the survivor opens the dashboard or jumps straight to Never Zero.

## Key schema columns

- `daily_checkins.exercises_logged` — text[] (nullable)
- `daily_checkins.habits_completed` — text[] (nullable)
- `never_zero_audits.morning_brief` — text (nullable)
- `never_zero_audits.morning_focus_items` — text[] (nullable)

## Storage methods

- `updateDailyCheckin(userId, dateKey, patch)` — dynamic SET via `sql.join(parts, sql\`, \`)`; creates row if missing with `ON CONFLICT DO UPDATE`
- `saveMorningBrief(userId, dateKey, brief, focusItems)` — upserts into `never_zero_audits`
- `getMorningBrief(userId, dateKey)` — returns `{ morning_brief, morning_focus_items }` or null

## Why dynamic SET for updateDailyCheckin

`sql.raw(str, params)` doesn't exist in drizzle-orm; the correct pattern for a partial update where only the caller-provided fields should be SET is `sql.join([...fieldParts], sql\`, \`)` then `sql\`UPDATE ... SET ${setParts} WHERE ...\``.
