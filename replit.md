# Stroked-Out Sasquatch Book Polish

## Run & Operate
_Populate as you build_

## Stack
_Populate as you build_

## Where things live
- **Manuscript source:** `attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md`
- **Typesetting script:** `scripts/typeset.mjs`
- **Book companion page:** `client/src/pages/BookCompanion.tsx`
- **Book buy page:** `client/src/pages/BookBuy.tsx`
- **Book in-platform reader:** `client/src/pages/BookRead.tsx`
- **Slug aliases/redirects:** `client/src/pages/BookSlugRedirect.tsx`
- **Stripe webhook handler:** `server/webhookHandlers.ts`
- **Book storefront API:** `server/routes.ts` (search for `/api/book/storefront`)
- **Book seed script:** `scripts/seedBookStorefront.ts`
- **Generated PDF:** `attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION.pdf`
- **Puzzle Studio (Brain Games):** schema `puzzleBooks`/`puzzles` in `shared/schema.ts`; generators + `renderPuzzleHtml` in `shared/puzzleEngine.ts`; API `server/puzzleRoutes.ts` (`/api/puzzle`, mounted after `setupAuth`); client `client/src/pages/PuzzleStudioHub.tsx` + `PuzzleBookEditor.tsx` at `/puzzle-studio`
- **Sasquatch character art:** `attached_assets/book_v2/images/sasquatch-*.png` — 11 woodcut/linocut metal-poster illustrations (axe-bearing, left-side asymmetry, deep ink + bone white + blood-red palette). Cover wired in `scripts/typeset.mjs`; 10 inline placements wired in the manuscript at iconic moments (bat Ch.12, mirror Ch.14, forge Ch.20½, intersection Ch.21, tribe Ch.26, year-seven + handoff Ch.30, doctrine App. I, creed App. J, seal final page). Aesthetic locked — any future regen must match the canonical brief documented in this skill's session.

## Recent platform work (July 2026)
- **Survivor refocus (all-in on survivors):** Top nav collapsed to survivor essentials; generic creator studios hidden behind redirects to `/recovery`; pricing collapsed to ONE survivor plan ($19/mo, $190/yr, 7-day trial) at `/recovery/premium`.
- **Coach as top-of-funnel:** `Landing.tsx` hero now leads with "Talk to Coach — free" → `/recovery/sasquatch-coach` (3 free anon messages → sign-in → premium); "Start your recovery" is the secondary CTA. A Coach CTA was also added to the Features block. The Coach page already had the full free→paid gate — no Coach-page edits needed.
- **Survivor Intake trimmed 11→4 screens** (`SurvivorIntake.tsx`): welcome, stroke, deficits, daily-life. daily-life is now the data-collecting final step ("Finish profile") and flushes the debounced save before `complete()`. Equipment/mobility-aids/current-challenges are no longer collected in the client (remain nullable in schema); identity/story/caregiver/accessibility stay editable in Survivor Profile settings; recovery goals are still collected by `/recovery/onboarding`.
- **Gift a Survivor** section added to `Landing.tsx` → `/recovery/gift`; FinalCTA reframed around the single price + squad/community language with a "See Premium" secondary CTA (`/recovery/premium`). "Cohort" wording maps to the real accountability-pod/premium community, not a separate cohort product.

## Recent platform work (May 2026)
- **Zen Mode** on `RecoveryDashboard.tsx` — neuro-fatigue accommodation. Toggle button (persisted to `localStorage` as `sra:zen-mode`) collapses dashboard to TodaysSpark + NeverZeroAuditHero only. Two `{!zenMode && (<>...</>)}` wrappers bracket the always-visible audit card.
- **Squad hero CTA** — Accountability Pod elevated from buried section to hero card after `<BonfireHeroCard />`. Uses existing `userPod` query; "Open squad →" anchors to `#pod-section` (id added to existing pod management Card at line ~1058).
- **Coach diagnosis boundary** — `WELCOME_FRESH` / `WELCOME_RETURNING` in `SasquatchCoach.tsx` + `buildWelcome` in `pages/SasquatchCoach.tsx` now state "accountability and reps, not diagnosis. New symptoms go to your doctor." Backstop to the existing crisis gate.
- **Caregiver CTA** on `Landing.tsx` — new section between `WhatYouGet` and `FeedbackSurvey` linking to existing `/for/caregivers` SSR page.

## Architecture decisions
- **Single Markdown Manuscript:** The entire book content is maintained in one large Markdown file for simplicity and ease of content management.
- **Platform Integration via Slugs:** All URLs mentioned in the book are aliased and handled by the `strokerecoveryacademy.com` platform to prevent 404s and provide a seamless reader experience.
- **Dynamic PDF Generation:** The production PDF is generated programmatically from the Markdown source without mutation, allowing for clean separation of content and presentation.
- **Secure Content Delivery:** Book downloads and in-platform reading are auth-gated and ownership-checked, with a "404 not found" response for unauthorized access to prevent information leakage about order existence.
- **Voice and Style Consistency:** Strict adherence to the "Stroked-Out Sasquatch" voice, spelling, and stylistic rules is enforced throughout the manuscript.

## Product
The application provides a polished, memoir-driven manual for stroke recovery, expanded to 50–75k words, and integrated with the `strokerecoveryacademy.com` platform. It features 30 chapters, mindset capstones, narrative parts, 9 case studies, 17 appendices, and a soundtrack. The platform offers a companion page, redirects for all in-book URLs, and a storefront for purchasing digital and print editions, including an in-platform reader for owners.

## User preferences
- **Communication Style:** Terse, decisive, no emojis, no fluff.
- **Coding Style:** Prefer surgical `edit` with unique anchors over full rewrites for large files.
- **Voice:** Voice should remain "Stroked-Out Sasquatch" (terse, em-dashes, straight quotes, age=36 at stroke).
- **Branding:** "Heart's still thumpin'" tagline used sparingly. "Sasquatch" is the canonical spelling.

## Gotchas
- The manuscript file is large; always use surgical edits.
- Ensure platform cross-references (URLs) are correctly mapped to prevent broken links.
- Maintain strict adherence to the defined voice and style guidelines.
- Remember to run `scripts/seedBookStorefront.ts` for local development of the book storefront features.

## Pointers
- **Relevant Skills:** Markdown formatting, TypeScript, React, Node.js, Puppeteer, PDF manipulation, Stripe API integration.
- **External Docs:** APA 7 citation style for scientific references.