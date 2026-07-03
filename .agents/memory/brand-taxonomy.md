---
name: Brand taxonomy (Stroke Lyfe vs Stroked-Out Sasquatch)
description: Which "Stroke Lyfe" strings are intentional nonprofit/legal uses vs stray consumer chrome to clean up
---
# Brand taxonomy

Three distinct brands coexist on this platform. Do NOT blanket find/replace "Stroke Lyfe".

- **Stroked-Out Sasquatch** — primary consumer brand / voice (the character, the book, the coach persona).
- **Stroke Recovery Academy** — secondary consumer brand (the product/platform name, storefront, publishing imprint).
- **Stroke Lyfe Inc.** — separate 501(c)(3) NONPROFIT / legal entity. KEEP as-is.

**Why:** Founder confirmed (July 2026) the nonprofit is a real, separate legal structure — collapsing it into the consumer brand would misrepresent the 501(c)(3).

**How to apply — KEEP these "Stroke Lyfe" uses (intentional):**
- "Stroke Lyfe Inc.", "Stroke Lyfe Survivor Fund", "Stroke Lyfe Ambassador", "Stroke Lyfe nonprofit team", "Stroke Lyfe operates as a dual structure"
- `alternateName: "Stroke Lyfe"` in schema, NonprofitHeader spans, StrokeLyfeOrg page, GiftSurvivor, donation/501c3/disclaimer copy
- Stripe metadata `platform: 'stroke_lyfe_publishing'` — internal identifier, never change
- `server/emailTemplate.ts` logo path `/email-assets/sasquatch-logo.png` — separate asset location, keep PNG

**CLEAN UP (consumer chrome that leaked the nonprofit name):**
- "Stroke Lyfe Publishing" → "Stroke Recovery Academy Publishing"
- "Stroke Lyfe Studio" → "Stroke Recovery Academy Studio"
- Store/product page titles, OG, schema name → "Stroke Recovery Academy"; brand/voice → "Stroked-Out Sasquatch"
