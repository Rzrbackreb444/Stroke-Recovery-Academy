# Project: Stroked-Out Sasquatch Book Polish

## Goal
Polish Nick Kremers' stroke recovery book "THE ULTIMATE STROKE RECOVERY REVOLUTION" to 95+/100 awards-grade quality, expanded from 23k to 50–75k words. Memoir-driven manual structure. Voice: Stroked-Out Sasquatch (terse, decisive, no emojis, no fluff). Single markdown manuscript file. Book and platform (strokerecoveryacademy.com) feed each other — appendices and chapters integrate platform cross-references throughout.

## Locked Style Rules
- Spelling: **Sasquatch** canonical. Never "Saschquatch."
- Voice: terse, em-dashes, straight quotes, age=36 at stroke (Dec 3, 2018, now 7 years out).
- "Heart's still thumpin'" tagline — used sparingly.
- No emojis ever.

## Current State
- **Manuscript:** `attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md`
- **Word count:** ~78.8k words (~6,650 lines)
- **30 chapters + Ch 20½ / 22½ / 29½ mindset capstones** in 6 narrative parts + Part VII Stories from the Tribe (9 cases) + 17 appendices (A–N + U/V/W) + Soundtrack + Acknowledgments + About + Seal
- **Front matter** now includes Author's Note, three-sentence thesis paragraph in Introduction, and outside Foreword placeholder slot with target candidates list (Foreword to be solicited from Norman Doidge / Jill Bolte Taylor / Andrew Huberman / Wendy Suzuki / Michael Merzenich)
- **Cold-open epigraphs** added to all 7 Parts (I–VII)
- **Cinematic openers** added to Ch 11 (Day My Toe Twitched), 12 (First Swing), 13 (Day I Stood Up Alone), 14 (Mirror in Bathroom Doorway), 15 (Driveway and the Crack), 16 (First Coffee Cup), 17 (Drive-Thru That Nearly Killed Me), 18 (Cuff That Walked Me Around the Block), 19 (Morning the Hand Would Not Let Go), 20 (Tuesday Motivation Did Not Show Up), and Ch 24 (both-arm hold + walking son to school)
- **Part VII (Stories from the Tribe):** 9 case studies (~12k words) — Marcus, Janelle, Robert, Aisha/Imani, David, Cathy, Tyler, Mr. Chen/Mei, **Jordan (NEW — 22yo AVM survivor, college soccer player, fills under-25 demographic gap)** + closing pattern analysis updated to "Nine Stories"
- **Caregiver chapter (Ch 28):** ~3500 words, full field manual
- **Acknowledgments:** structured TBD slots filled in for beta readers, editor, copy editor, fact-checkers, Hostile Construction collaborators, cover/typography/photo, legal counsel, academy team
- **Appendix H (Science References):** added explicit APA 7 citation-style + verification note with corrections inbox + fact-checker placeholders
- **Voice trim:** "thumpin'" usage trimmed 28 → 21 in densest clusters (closing letter cap-tags + book-end + chapter-end duplicates + Appendix Q/O)
- **TOC:** updated to include Part VII, appendices A–N + U/V/W, and Index stub note
- **Dedup fixes:** removed duplicate `# THE SOUNDTRACK: HOSTILE CONSTRUCTION` header

## Appendices — All Built Out
- **A:** Emergency Stroke Recognition + First 60 Minutes (FAST/BE-FAST + risk factors + 911 script)
- **B:** Recovery Exercise Protocols — Full Library (prose for every drill + platform video links)
- **C:** Technology and Equipment Guide (gear table)
- **D:** Nutrition for Brain Recovery (MIND diet, supplements, sample day)
- **E:** Sasquatch Field Notes (categorized quote library)
- **F:** Support Resources and Communities
- **G:** Full daily 90-Day Breakthrough Program (~5k words, three phases, daily template)
- **H:** Science References (organized by topic, ~25 citations)
- **I:** Sasquatch Doctrine OS + Daily Operating Card
- **J:** Sasquatch Creed
- **K (NEW):** Companion Workbook & Platform Resources — chapter-by-chapter book↔academy bridge
- **L (NEW):** For Clinicians, Therapists, and Stroke Care Teams + CEU course
- **M (NEW):** Stroke Recovery Glossary
- **N (NEW):** Recommended Reading (books, podcasts, film, album)

## Platform Integration
Every appendix and many chapters cross-reference `strokerecoveryacademy.com/<resource>`:
- /book (master index), /workbook, /tracker, /90day, /tribe, /soundtrack, /officehours
- /protocols/* (one URL per drill, with video)
- /resources/* (one URL per chapter)
- /science, /glossary, /reading, /posters, /walletcard, /risk, /nutrition, /gear
- /clinicians, /ceu, /quicksheet
- Donation: strokelyfe.org/donate

## Still To Do (if user wants further work)
- Push toward 60-75k+ via: Ch 22 plateau wars expansion, Ch 19 open hand sidebar, Ch 18 (Tech) + Ch 20 (Motivation Engine) cinematic scenes.
- Done this session: Builder's Science sidebars across Ch 11/12/13/14/15/16/17, "Day My Toe Twitched" cinematic, two Ch 24 cinematic scenes (first both-arm hold + walking son to school), April 24 2019 birth date locked in, raw pre-stroke marriage truth (Eric/cheating/honest split) added to Lisa section, "Chopping Wood" Builder's Science sidebar added before Appendix I, **Appendix I now restructured as the four-layer doctrine: Tattoo-Grade Laws + S.O.S. (crisis) + S.A.S.C.H. (daily construction rhythm — Seize/Absorb/Swing/Combine/Hammer) + C.O.M.P.A.S.S. (advanced navigation), with morning/midday/evening day-shape and clinical/caregiver/AI/community usage matrix.**
- Final voice/spelling sweep.
- Beta reader / editor / collaborator names in Acknowledgments (currently TBD).
- Cover art credit, typography credits in colophon (TBD).

## Platform ↔ Book Wiring (Shipped May 2026)
- **`/book` companion page** (`client/src/pages/BookCompanion.tsx`) — single canonical index with hero + 8 quick-action cards + 9 themed resource sections (protocols / mindset / tribe / fuel / structure / clinicians / science / caregivers / soundtrack), all sections anchor-targeted, all links data-testid'd.
- **Slug aliases** (`client/src/pages/BookSlugRedirect.tsx`) — every bare-path URL printed in the manuscript (`/protocols/*`, `/tribe`, `/soundtrack`, `/workbook`, `/tracker`, `/90day`, `/officehours`, `/persona`, `/clinicians`, `/ceu`, `/letters`, `/math`, `/desert`, `/bereaved`, `/glossary`, `/reading`, `/science`, `/walletcard`, `/risk`, `/nutrition`, `/gear`, `/posters`, `/100lines`, `/podcast`, `/youngsurvivor`, `/plateau`, `/doctrine`, `/quicksheet`, `/app`, `/combos`, `/questions`, `/rights`) resolves via SLUG_MAP/PROTOCOL_MAP either to existing `/recovery/*` pages or to `/book#anchor`. ~33 routes registered before NotFound catch-all.
- **Result:** every URL the book prints now lands on a real page in the academy. No 404s for book readers.

## Book Polish Adjustments (Shipped May 2026, post-87/100-review)
- **Appendix H renamed** "The Science That Proves I'm Right" → "The Science Behind These Methods" (TOC + header). Closes the defensiveness flag in the citations section without softening the chapter prose voice.
- **"For the Quiet Sasquatch" sidebar** added inside Ch 20½ (Persona Forge) — ~280 words affirming the doctrine works for introverts, women, older survivors, soft-spoken survivors. Voice preserved (still ends "Heart's still thumpin'. The whisper counts too."). Opens the door without diluting the brand.
- **Repetition trim** (post-91/100-review, reviewer flagged "chop wood, never zero" repeats): chop wood 11→10 (removed redundant "chop-wood hour" callout in App I S.A.S.C.H. midday — already covered by canonical sidebar at 5354); never zero 9→8 (removed duplicate Tattoo-Grade Law bullet — already echoed at S.O.S. Strive + S.A.S.C.H. test); thumpin' 26→23 (replaced 3 cap-tag duplicates with fresher mantras: "I am here. The bleed lost. Today I build." in App G wake-up; "Tuesday came back. So will you." at Ch 29½ close; trimmed redundant "Heart's still thumpin'? Life's still pumpin'." at App G close). Voice preserved everywhere; brand-tagline still earned where it remains. Final word count: ~78,750.
- **Still pending:** plug-density demotion (move inline mid-chapter platform callouts to end-of-chapter Resources boxes in Ch 1, 2, 11, 14, 16, 24); "Pocket Sasquatch" 12k-word condensed cut as separate funnel asset; visuals (out of scope for AI text editing — production task for publisher).

## Important Files
- `attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md` — main deliverable
- `attached_assets/Pasted-THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-FROM-0-TO-90-AN_1778002753962.txt` — original 23k source
- `attached_assets/Pasted-INSTRUCTIONS-FOR-AUTHOR-Paste-each-of-these-TRACK-SYNC-_1778003050187.txt` — track sync templates
- `attached_assets/Pasted-Here-is-the-complete-fully-assembled-100-100-Masterclas_1778007141035.txt` — Masterclass v with Builder's Science sidebars
- `attached_assets/strokelyfe-org-build-brief.md` — prior platform brief

## Editing Notes
- File is large (~4,500 lines) — always use surgical `edit` with unique anchors, not full rewrites.
- Track URLs already wired in soundtrack section: 7 song.link, 5 direct youtu.be, all with strokerecoveryacademy.com/soundtrack backup.
- Stroke Lyfe Inc. = the 501(c)(3); Stroke Recovery Academy = the platform.
