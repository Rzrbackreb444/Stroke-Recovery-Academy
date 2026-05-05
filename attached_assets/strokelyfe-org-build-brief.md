# strokelyfe.org — Comprehensive Build Brief

> Paste this entire document into a fresh Replit project as your first message
> to the Agent. It contains the brand, tech stack, sitemap, wireframes, copy
> direction, donate flow, data model, integrations, SEO, and launch checklist.
> Build the site exactly as specified unless I tell you otherwise.

---

## 1. Project Identity

| | |
|---|---|
| **Org legal name** | Stroke Lyfe Inc. |
| **Public name** | Stroke Lyfe |
| **Domain** | strokelyfe.org |
| **Status** | 501(c)(3) nonprofit |
| **Founder** | Nick Kremers (stroke survivor) |
| **Mission tagline** | REBUILD. REWIRE. RISE. |
| **Mission sentence** | Empowering stroke survivors through education, accountability, and community — regardless of income or insurance status. |
| **Sister site (commercial)** | strokerecoveryacademy.com — the for-profit recovery platform Nick runs. The nonprofit funnels survivors there for actual day-to-day recovery tools. |

### Audience (in order of priority)
1. **Stroke survivors and their families** looking for a trustworthy starting point. Many have aphasia, fatigue, vision deficits, or one usable hand — accessibility is non-negotiable.
2. **Donors** — individual recurring + one-time donors, and people gifting Academy scholarships to a survivor in their life.
3. **Foundation officers, journalists, partner orgs** — people googling the org to validate it's real.
4. **Healthcare workers** (SLPs, OTs, PTs, social workers) who want to refer patients somewhere reputable.

### What this site is NOT
- It is **not** the recovery platform. No login. No daily routines. No coach. No studios. Those all live at strokerecoveryacademy.com — link out, don't rebuild.
- It is **not** a content marketing blog farm. A small, curated story library is fine; an SEO churn pile is not.
- It is **not** a social network. No comments, no profiles, no DMs.

---

## 2. Tech Stack (match the academy so code can be ported either way)

- **Frontend**: React 18 + TypeScript + Vite + Wouter (routing) + TailwindCSS + Shadcn/ui + TanStack Query
- **Backend**: Express.js + TypeScript on the same port as Vite (use the standard Replit fullstack-js template)
- **Database**: Replit-managed PostgreSQL via Drizzle ORM. Define schema in `shared/schema.ts`.
- **Payments**: Stripe (Checkout for one-time + recurring donations)
- **Email**: Resend (donation receipts, scholarship gift notifications, mailing list confirmations)
- **Analytics**: Plausible or Google Analytics 4 (your call — Plausible is more nonprofit-appropriate)
- **Hosting**: Replit Deployments → custom domain `strokelyfe.org` + `www.strokelyfe.org` (301 to apex)

Use the standard fullstack-js project structure. Do **not** modify `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`, or `package.json` manually — use the package management tools instead.

---

## 3. Brand Kit

### Colors (use H S% L% in `index.css` so Tailwind works correctly)

```
--background:        38 50% 97%;   /* #FAF8F3 — warm cream */
--foreground:        20 14% 12%;   /* near-black, warm */
--primary:           41 78% 45%;   /* #C9941A — Stroke Lyfe gold */
--primary-foreground:0 0% 100%;
--accent:            165 35% 26%;  /* #2D5A4A — deep forest teal */
--accent-foreground: 0 0% 100%;
--muted:             38 30% 92%;
--muted-foreground:  20 10% 38%;
--card:              0 0% 100%;
--card-foreground:   20 14% 12%;
--border:            38 20% 86%;
--ring:              41 78% 45%;
--destructive:       0 70% 50%;
```

Dark mode is **not required** for v1. (Marketing site, donors browse in daylight, lean cream.)

### Typography
- **Headings**: a literary serif — `"Fraunces"`, `"Source Serif 4"`, or `Georgia` fallback. Weight 700 for big heads.
- **Body**: a humanist sans — `"Inter"` or `system-ui`.
- Use Shadcn defaults; override `font-serif` and `font-sans` in `tailwind.config.ts`.

### Voice (use this everywhere — copy, microcopy, error messages)
- **Direct. No fluff. No clinical jargon. No emojis.**
- Talk to survivors like adults who have been through hell and don't need to be coddled.
- Honor the work. Effort beats outcome on day one.
- "We" = the org. "You" = the survivor / donor / family member. Never "patients", "subjects", "clients".
- The tagline **REBUILD. REWIRE. RISE.** is sacred. Use it sparingly so it lands.

### Logo
The existing logo is at `attached_assets/Untitled_design_1776789083877.png` in the academy project. Ask the user to upload it to this project's `attached_assets/` and reference it as `import logo from "@assets/Untitled_design_1776789083877.png"`.

---

## 4. Information Architecture

```
/                          Home — mission, hero, donate CTA, scholarship CTA, story carousel, academy bridge
/about                     Who we are — Nick's story, mission, board, why this exists
/programs                  What we do — Scholarships, Survivor Connect, Resource Library, Family Support
/donate                    Donation page (one-time + monthly + employer match)
/gift                      Gift an Academy scholarship to a survivor (the trade signature program)
/stories                   Story library (10-30 vetted survivor stories — index)
/stories/:slug             Individual story page
/contact                   Contact form + email + mailing address
/transparency              501(c)(3) status, EIN, financials, board, annual report download
/legal/privacy             Privacy policy
/legal/terms               Terms of use
/legal/donor-rights        Donor Bill of Rights
/thank-you                 Post-donation success page
/404                       Custom not-found
```

**Do not build**: blog/CMS, admin dashboard (the founder can edit copy via small admin route or just code edits), member portal, comment system, search.

---

## 5. Page-by-Page Wireframes

Each wireframe uses a `~80-char` ASCII grid. The agent should treat these as **layout intent**, not pixel-perfect — implement responsively (mobile-first, breakpoints at sm/md/lg).

### 5.1 Global Header (sticky)

```
+----------------------------------------------------------------------------+
| [LOGO]  Stroke Lyfe              About  Programs  Stories  Transparency   |
|         501(c)(3) Nonprofit                                  [Donate Now] |
+----------------------------------------------------------------------------+
```

- Background: cream (`bg-background`), 1px bottom border in `--border`.
- Logo height: `h-12`. Donate button: gold (`bg-primary text-primary-foreground`), small.
- Mobile: hamburger → slide-out Sheet with full nav + Donate button at the top.
- Sticky with `z-50`.

### 5.2 Global Footer

```
+----------------------------------------------------------------------------+
| STROKE LYFE INC.       PROGRAMS         RESOURCES        ORGANIZATION     |
| 501(c)(3) Nonprofit    Scholarships    Story Library    About             |
| EIN: XX-XXXXXXX        Survivor Connect Family Support  Transparency      |
|                        Resource Library                  Annual Report     |
| [Email signup form]                                      Contact          |
|                                                                            |
| Mailing address line 1                                                     |
| City, State ZIP                                                            |
|                                                                            |
| [In] [FB] [IG] [YT]                                                        |
+----------------------------------------------------------------------------+
| © 2026 Stroke Lyfe Inc.  •  Privacy  •  Terms  •  Donor Bill of Rights    |
| Donations are tax-deductible to the fullest extent of the law.            |
+----------------------------------------------------------------------------+
```

### 5.3 `/` — Home

```
+----------------------------------------------------------------------------+
|                          [GLOBAL HEADER]                                  |
+----------------------------------------------------------------------------+
| HERO (full-width, cream bg with subtle gold accent shapes)                |
|                                                                            |
|        REBUILD. REWIRE. RISE.                                             |
|                                                                            |
|        Stroke Lyfe is a 501(c)(3) nonprofit founded by                    |
|        survivor Nick Kremers to give every stroke survivor                |
|        a real shot at recovery — regardless of income or                  |
|        insurance.                                                          |
|                                                                            |
|        [ Donate Now ]    [ Gift a Survivor's Recovery → ]                 |
|                                                                            |
|        — 1,247 survivors served • 312 scholarships funded —               |
+----------------------------------------------------------------------------+
| MISSION STRIP (3-column, --accent text on cream)                          |
|  [icon]              [icon]                  [icon]                       |
|  Education           Accountability          Community                    |
|  60s of copy each    60s of copy each        60s of copy each             |
+----------------------------------------------------------------------------+
| SECTION: "Why we exist" (2-column, image L / text R or alternating)      |
|  [Photo of Nick]   "I had my stroke at 33. Insurance covered six       |
|                     weeks of therapy and then sent me home with         |
|                     a binder. This is the org I wish had existed."     |
|                                                                            |
|                     — Nick Kremers, founder                              |
|                                                                            |
|                     [ Read Nick's story → ]                              |
+----------------------------------------------------------------------------+
| SECTION: "What your gift does" (3-column tier cards)                      |
|  $97 SCHOLARSHIP    $297 MENTORED           $997 ELITE                   |
|  Full Academy       Academy + 3mo group     Academy + 1:1 with Nick      |
|  access             coaching                Custom recovery plan         |
|  [ Gift one ]       [ Gift one ]            [ Gift one ]                 |
+----------------------------------------------------------------------------+
| SECTION: Story carousel — 3 visible cards w/ video poster + quote         |
|  [video card]       [video card]            [video card]                 |
|  "I got my voice    "Day 1 to day 200 —      "The people here saw       |
|   back."             same survivor, dif. life" me as me, not my MRI."   |
|  — Maria S.          — Devon T.              — Aisha R.                  |
|                                                                            |
|  [ Read all stories → ]                                                  |
+----------------------------------------------------------------------------+
| ACADEMY BRIDGE (full-width, --accent bg, white text)                      |
|        Looking for the daily recovery tools?                              |
|        Stroke Recovery Academy is our partner for-profit                  |
|        platform — daily routines, AI coach, exercises,                    |
|        community.                                                          |
|        [ Visit Stroke Recovery Academy → ]                                |
+----------------------------------------------------------------------------+
| TRUST STRIP (small, centered)                                             |
|  [GuideStar]   [Charity Navigator]   [Candid]   501(c)(3) EIN XX-XXXXXXX |
+----------------------------------------------------------------------------+
| EMAIL SIGNUP                                                              |
|  Get one update per month — survivor stories, what your dollars did.     |
|  [ email@you.com ] [ Subscribe ]                                         |
+----------------------------------------------------------------------------+
|                          [GLOBAL FOOTER]                                  |
+----------------------------------------------------------------------------+
```

### 5.4 `/about` — Who we are

```
+----------------------------------------------------------------------------+
| HERO: "Why Stroke Lyfe exists" + 1-paragraph mission                      |
+----------------------------------------------------------------------------+
| FOUNDER STORY (long-form, ~600 words)                                     |
|  [Big portrait of Nick L]   Heading + body                                |
|                              "On [date], I was [age]…"                   |
|                              4-6 paragraphs                                |
|                              Pull quote: "REBUILD. REWIRE. RISE was…"   |
+----------------------------------------------------------------------------+
| OUR APPROACH (3 pillars expanded — Education / Accountability / Community)|
+----------------------------------------------------------------------------+
| BOARD & TEAM (grid of cards)                                              |
|  [Avatar] Name        [Avatar] Name           [Avatar] Name              |
|  Title                 Title                    Title                     |
|  1-line bio            1-line bio               1-line bio                |
+----------------------------------------------------------------------------+
| ORG MILESTONES (timeline component)                                       |
|  2024 ─ founded                                                           |
|  2025 ─ first scholarship cohort (50 survivors)                           |
|  2026 ─ 1,000th survivor served                                           |
+----------------------------------------------------------------------------+
| CTA FOOTER: [ Donate ] [ Read our stories ]                               |
+----------------------------------------------------------------------------+
```

### 5.5 `/programs` — What we do

```
+----------------------------------------------------------------------------+
| HERO: "Four programs. One mission."                                       |
+----------------------------------------------------------------------------+
| PROGRAM CARDS (one per row, alternating image L/R)                        |
|                                                                            |
|  ┌──────────────────────────────────────────────────────────────────┐    |
|  │ [Icon] SURVIVOR SCHOLARSHIPS                                     │    |
|  │ Full Academy access for survivors who can't afford it.           │    |
|  │ • 312 scholarships funded since 2024                             │    |
|  │ • Average wait: 2 weeks                                          │    |
|  │ • Application takes 5 minutes                                    │    |
|  │ [ Apply for a scholarship ]    [ Fund a scholarship ]            │    |
|  └──────────────────────────────────────────────────────────────────┘    |
|                                                                            |
|  ┌──────────────────────────────────────────────────────────────────┐    |
|  │ [Icon] SURVIVOR CONNECT                                          │    |
|  │ Pair-matching with another survivor at a similar stage.          │    |
|  │ Free, monthly check-ins, no clinical jargon.                     │    |
|  │ [ Get matched ]                                                  │    |
|  └──────────────────────────────────────────────────────────────────┘    |
|                                                                            |
|  ┌──────────────────────────────────────────────────────────────────┐    |
|  │ [Icon] FAMILY SUPPORT                                            │    |
|  │ Free guides for spouses, parents, kids, caregivers.              │    |
|  │ "What I wish someone had told me on day one."                    │    |
|  │ [ Browse the library ]                                           │    |
|  └──────────────────────────────────────────────────────────────────┘    |
|                                                                            |
|  ┌──────────────────────────────────────────────────────────────────┐    |
|  │ [Icon] RESOURCE LIBRARY                                          │    |
|  │ Curated, vetted resources — therapists, financial aid,           │    |
|  │ legal help, support groups in every U.S. state.                  │    |
|  │ [ Open the library ]                                             │    |
|  └──────────────────────────────────────────────────────────────────┘    |
+----------------------------------------------------------------------------+
```

### 5.6 `/donate` — Donate

```
+----------------------------------------------------------------------------+
| HERO: "Your gift goes straight to a survivor."                            |
|       1-sentence breakdown of what % goes to programs vs overhead.        |
+----------------------------------------------------------------------------+
| TWO-COLUMN: form L / impact strip R                                        |
|                                                                            |
|  ┌──────────────────────────────────┐  ┌─────────────────────────────┐  |
|  │ DONATION FORM                    │  │ WHAT YOUR GIFT DOES         │  |
|  │                                  │  │                              │  |
|  │ [One-time] [Monthly]  ← toggle   │  │ $25  → 1 month of resource  │  |
|  │                                  │  │       library access for a  │  |
|  │ Amount:                          │  │       caregiver.            │  |
|  │ [ $25 ] [ $50 ] [ $100 ]         │  │                              │  |
|  │ [ $250 ][ $500 ][ $1000]         │  │ $97  → Full Academy month   │  |
|  │ [ Other: $___ ]                  │  │       for one survivor.     │  |
|  │                                  │  │                              │  |
|  │ ☐ Cover the 2.9% processing fee │  │ $297 → Scholarship +        │  |
|  │                                  │  │       3 months of group     │  |
|  │ ☐ Make this a tribute gift      │  │       coaching.             │  |
|  │ (optional) In honor of: [____]  │  │                              │  |
|  │                                  │  │ $1,000 → Funds 10 survivors │  |
|  │ [ Continue to payment ]          │  │         for a full month.   │  |
|  │                                  │  │                              │  |
|  │ Secure payment via Stripe.       │  │                              │  |
|  │ Donations are tax-deductible.    │  │                              │  |
|  └──────────────────────────────────┘  └─────────────────────────────┘  |
+----------------------------------------------------------------------------+
| OTHER WAYS TO GIVE                                                         |
|  • Donor-advised funds                                                    |
|  • Stock / crypto (contact us)                                            |
|  • Employer match (search box: "Will my employer match?")                 |
|  • Mail a check (address)                                                 |
+----------------------------------------------------------------------------+
```

### 5.7 `/gift` — Gift a Scholarship (the signature program)

```
+----------------------------------------------------------------------------+
| HERO: "Know a survivor who needs this? Gift them a recovery."             |
+----------------------------------------------------------------------------+
| THREE-TIER CARDS (price + features, "Most popular" badge on middle)       |
|                                                                            |
|  $97 Survivor       $297 Mentored ⭐POPULAR     $997 Elite                |
|  • Academy access   • Academy access            • Academy access         |
|  • 1 month          • 3 months group coaching   • 1:1 with Nick          |
|                     • Weekly accountability      • Custom plan            |
|                                                  • Lifetime access        |
|  [ Gift this ]      [ Gift this ]               [ Gift this ]            |
+----------------------------------------------------------------------------+
| CHECKOUT FORM (appears below selected card)                                |
|  Recipient name:        [_______________]                                 |
|  Recipient email:       [_______________]                                 |
|  When to deliver:       [○ Now] [○ Pick a date]                          |
|  Personal message:      [____________________________________]           |
|                         [____________________________________]           |
|  Your name (on gift):   [_______________]                                |
|  Your email:            [_______________]                                |
|                                                                            |
|  [ Continue to payment ]                                                  |
+----------------------------------------------------------------------------+
```

### 5.8 `/stories` — Story Library Index

```
+----------------------------------------------------------------------------+
| HERO: "Real survivors. Real recoveries."                                  |
+----------------------------------------------------------------------------+
| FILTER STRIP (chips):                                                     |
|  [ All ] [ Speech ] [ Mobility ] [ Cognition ] [ Caregiver stories ]     |
+----------------------------------------------------------------------------+
| GRID: 3 columns desktop, 1 column mobile                                  |
|  ┌────────────┐  ┌────────────┐  ┌────────────┐                          |
|  │[video pstr]│  │[video pstr]│  │[video pstr]│                          |
|  │ Quote…     │  │ Quote…     │  │ Quote…     │                          |
|  │ — Maria S. │  │ — Devon T. │  │ — Aisha R. │                          |
|  │ Speech •2y │  │ Mobility•6m│  │ Caregiver  │                          |
|  └────────────┘  └────────────┘  └────────────┘                          |
|                                                                            |
|  (12-30 cards, paginated or load-more)                                    |
+----------------------------------------------------------------------------+
```

### 5.9 `/stories/:slug` — Individual Story

```
+----------------------------------------------------------------------------+
| HERO: large story title + survivor handle + recovery stage badge          |
+----------------------------------------------------------------------------+
| VIDEO PLAYER (16:9, full-width within container)                          |
+----------------------------------------------------------------------------+
| LONG-FORM (max 700px column for readability)                              |
|  Pull quote                                                                |
|  3-6 paragraphs                                                            |
|  Mid-page CTA: [ Donate to fund another survivor ]                       |
|  More paragraphs                                                           |
+----------------------------------------------------------------------------+
| RELATED STORIES (3 cards)                                                 |
+----------------------------------------------------------------------------+
| BOTTOM CTA: "Want to share your story? [ Submit yours → ]"                |
+----------------------------------------------------------------------------+
```

### 5.10 `/transparency` — The trust page

```
+----------------------------------------------------------------------------+
| HERO: "Where the money goes."                                             |
+----------------------------------------------------------------------------+
| BIG NUMBERS (3-column)                                                    |
|  87%               9%                4%                                   |
|  Programs          Operations        Fundraising                          |
+----------------------------------------------------------------------------+
| LEGAL STATUS                                                              |
|  • Stroke Lyfe Inc., a 501(c)(3) public charity                          |
|  • EIN: XX-XXXXXXX                                                        |
|  • Incorporated in [State], [Date]                                        |
|  • IRS Determination Letter: [ Download PDF ]                             |
+----------------------------------------------------------------------------+
| BOARD OF DIRECTORS (cards)                                                |
+----------------------------------------------------------------------------+
| FINANCIALS                                                                |
|  • Form 990 (most recent): [ Download PDF ]                              |
|  • Annual Report 2025:     [ Download PDF ]                              |
|  • Audited financials:     [ Download PDF ]                              |
+----------------------------------------------------------------------------+
| THIRD-PARTY VERIFICATION                                                  |
|  [ GuideStar Profile ] [ Charity Navigator ] [ Candid ]                  |
+----------------------------------------------------------------------------+
```

### 5.11 `/contact`

```
+----------------------------------------------------------------------------+
| HERO: "Get in touch"                                                      |
+----------------------------------------------------------------------------+
| TWO-COLUMN                                                                 |
|  ┌──────────────────────────┐   ┌──────────────────────────────────┐   |
|  │ Contact form             │   │ Mailing address                   │   |
|  │ Name [_______________]   │   │ Stroke Lyfe Inc.                 │   |
|  │ Email [______________]   │   │ [Street]                          │   |
|  │ Topic [drop-down]        │   │ [City, State ZIP]                │   |
|  │   • General                  │   │                                   │   |
|  │   • Donations / receipts │   │ Direct lines                      │   |
|  │   • Press / media        │   │ Donations:  donate@strokelyfe.org│   |
|  │   • Partnerships         │   │ Press:      press@strokelyfe.org │   |
|  │   • Apply for help       │   │ General:    hello@strokelyfe.org │   |
|  │ Message [             ]  │   │                                   │   |
|  │         [             ]  │   │                                   │   |
|  │ [ Send ]                 │   │                                   │   |
|  └──────────────────────────┘   └──────────────────────────────────┘   |
+----------------------------------------------------------------------------+
```

---

## 6. Design System Rules

These follow the same conventions as Stroke Recovery Academy so the two sites feel like siblings.

- **Spacing**: three levels — `sm` (gap-2 / p-3), `md` (gap-4 / p-6), `lg` (gap-8 / p-10). Pick one for cards, one for sections. Don't free-style.
- **Border radii**: `rounded-md` everywhere except true circles/pills. Never one-sided borders on rounded elements.
- **Cards**: white background on cream page (Method B from the academy guidelines). Subtle elevation, no heavy shadows.
- **Hover/active**: use `hover-elevate` and `active-elevate-2` utility classes on interactive elements (Shadcn `Button`/`Badge` already include them).
- **Buttons**:
  - Primary CTA (Donate, Gift): `bg-primary text-primary-foreground` (gold)
  - Secondary CTA: `variant="outline"`
  - Tertiary / inline: `variant="ghost"` or `variant="link"`
- **Icons**: `lucide-react` only. No emoji. Ever.
- **Imagery**: real survivor photos (not stock) wherever possible. Stock allowed only for hero abstract textures.
- **Hero washes**: any hero with a background image gets a dark gradient overlay so light text always reads.
- **Test IDs**: every interactive element + every dynamic display element gets a `data-testid` (`button-donate-hero`, `card-story-${slug}`, `text-impact-stat-programs`, etc.)
- **Accessibility**:
  - All interactive controls keyboard-reachable
  - Color contrast: AA minimum (the gold-on-cream combo MUST be tested — gold buttons need white text)
  - All images: real `alt` text
  - Forms: every input has a `<Label>`
  - `aria-label` on icon-only buttons
  - Headings descend in order, no skipped levels
  - Honor `prefers-reduced-motion`

---

## 7. Donate Flow Specification

### 7.1 Frontend
- `/donate` page with toggle (one-time vs monthly), preset amounts ($25, $50, $100, $250, $500, $1000), custom amount input, optional "cover processing fee" checkbox, optional tribute gift fields.
- "Continue to payment" → POST `/api/donations/checkout` → server returns Stripe Checkout URL → redirect.
- After Stripe Checkout success → user lands on `/thank-you?session_id=...`. Server verifies session, displays personalized thanks + receipt info.
- Stripe webhook handles the durable side: writes donation row, fires receipt email via Resend.

### 7.2 Backend route surface
```
POST /api/donations/checkout         → creates Stripe Checkout session (one-time OR subscription mode)
GET  /api/donations/verify           → verifies a session_id and returns sanitized donation info
POST /api/gift-scholarships/checkout → creates Checkout session for a scholarship gift (passes recipient info as metadata)
POST /api/contact                    → sends a Resend email to the right inbox + stores a row
POST /api/email-signup               → adds to mailing list (or just stores; integrate Mailchimp/Buttondown later)
POST /api/stripe/webhook             → handles checkout.session.completed, invoice.paid, etc.
GET  /api/stories                    → public list (returns approved, sorted by featured + date)
GET  /api/stories/:slug              → single story
```

### 7.3 Stripe specifics
- Use Checkout (hosted) — do **not** build a custom card form. Saves PCI scope and donors trust the Stripe URL.
- One-time donations: `mode: 'payment'`, `submit_type: 'donate'` (Stripe shows "Donate" button).
- Monthly: `mode: 'subscription'` with a recurring price you create on the fly via `price_data`.
- Pass `metadata: { kind: 'donation' | 'scholarship_gift', tributeOf, recipientEmail, ... }`.
- Webhook handler must be idempotent (use `event.id` as a dedupe key in DB).

---

## 8. Data Model (`shared/schema.ts`)

Keep it tiny. Only what the public flows actually need.

```ts
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  kind: text("kind").notNull(),                    // "donation" | "scholarship_gift"
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  donorName: text("donor_name"),
  donorEmail: text("donor_email").notNull(),
  tributeOf: text("tribute_of"),
  // Scholarship-gift specific
  scholarshipTier: text("scholarship_tier"),       // "survivor" | "mentored" | "elite"
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  giftMessage: text("gift_message"),
  receiptSentAt: timestamp("receipt_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  handle: text("handle").notNull(),                // "Maria S." (already anonymized)
  recoveryStage: text("recovery_stage"),
  focusArea: text("focus_area"),
  pullQuote: text("pull_quote").notNull(),
  body: text("body").notNull(),                    // markdown
  videoUrl: text("video_url"),
  posterUrl: text("poster_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mailingList = pgTable("mailing_list", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),                          // "footer" | "home" | "story-page"
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(),                     // event.id from Stripe (dedupe)
  type: text("type").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});
```

For each table, also export the matching `createInsertSchema`, `Insert*`, and `Select*` types.

---

## 9. SEO + Structured Data

### Per page
- Unique `<title>` and `<meta name="description">` on every page.
- OpenGraph tags + Twitter card tags.
- Canonical URL.

### Sitewide
- `/sitemap.xml` (auto-generated from the route list + stories).
- `/robots.txt` (allow everything, point to sitemap).
- `<link rel="manifest">` (small PWA manifest — name, theme color #C9941A).

### JSON-LD (drop on the relevant pages)

**Home + every page:**
```json
{
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Stroke Lyfe Inc.",
  "alternateName": "Stroke Lyfe",
  "url": "https://strokelyfe.org",
  "logo": "https://strokelyfe.org/logo.png",
  "description": "501(c)(3) nonprofit empowering stroke survivors through education, accountability, and community.",
  "slogan": "REBUILD. REWIRE. RISE.",
  "founder": { "@type": "Person", "name": "Nick Kremers" },
  "areaServed": { "@type": "Country", "name": "Worldwide" },
  "nonprofitStatus": "Nonprofit501c3",
  "taxID": "XX-XXXXXXX",
  "sameAs": [
    "https://www.facebook.com/strokelyfe",
    "https://www.instagram.com/strokelyfe",
    "https://www.linkedin.com/company/strokelyfe"
  ]
}
```

**Each story page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "image": "<posterUrl>",
  "author": { "@type": "Person", "name": "<handle>" },
  "publisher": { "@type": "NGO", "name": "Stroke Lyfe Inc." },
  "datePublished": "<publishedAt>"
}
```

---

## 10. Cross-linking Strategy (the funnel)

Every page on strokelyfe.org should have **at least one** clear link to strokerecoveryacademy.com, framed as: "Looking for the actual day-to-day tools? Our partner platform Stroke Recovery Academy."

Specific placements:
1. **Home**: dedicated "Academy bridge" section before the trust strip.
2. **Programs**: every scholarship card "Apply" button can link to a scholarship application form on Academy.
3. **Story pages**: footer CTA "Want this? Try the Academy free for 7 days →".
4. **Footer**: small "Our partner platform: Stroke Recovery Academy" link.
5. **Donor flow**: thank-you page has a "Want to start your own recovery? Check out the Academy" CTA *below* the receipt info.

Use UTM params on every outbound link: `?utm_source=strokelyfe&utm_medium=site&utm_campaign=<page>`.

---

## 11. Trust + Compliance

- **501(c)(3) markers** in footer + transparency page + every donation form.
- **EIN displayed** in footer + transparency page + every donation receipt email.
- **Donor Bill of Rights** page — copy the standard AFP version verbatim.
- **Tax-deductibility statement** on receipts AND on the donate page: "Stroke Lyfe Inc. is a 501(c)(3) public charity (EIN XX-XXXXXXX). Your donation is tax-deductible to the fullest extent of the law. No goods or services were provided in exchange for this gift."
- **Privacy policy** must specifically address: donor data handling, Stripe, mailing list opt-out, no selling of donor data, retention periods.
- **Accessibility statement** in footer linking to a brief page describing your WCAG 2.2 AA commitment + how to report issues.
- **PCI scope**: by using Stripe Checkout you're SAQ-A. Don't accept card data anywhere on your domain.

---

## 12. Content Direction (so the agent can draft v0 copy)

The agent should generate first-draft copy in **Nick's voice** (direct, warm, no fluff, survivor-to-survivor). Examples:

- **Don't**: "Empowering individuals on their journey to overcome the challenges of cerebrovascular events through holistic wellness frameworks."
- **Do**: "I had my stroke at 33. Insurance covered six weeks of therapy and then sent me home with a binder. This is the org I wish had existed."

- **Don't**: "Make a difference today!"
- **Do**: "Your $97 gives a survivor a full month of the recovery platform their insurance won't cover."

- **Don't**: "Thank you for your generous contribution."
- **Do**: "Your gift is in. Here's what happens next: we match it to a survivor on the waitlist (currently 2 weeks). When they activate, we'll send you a one-line update — first name only, with their permission."

Generate 3 home-page hero variants and let me pick.

---

## 13. Launch Checklist

Before pushing to `strokelyfe.org`:

- [ ] All pages render at desktop, tablet, mobile
- [ ] All buttons + forms have `data-testid` attributes
- [ ] Lighthouse: ≥95 Performance, ≥95 Accessibility, ≥95 Best Practices, ≥95 SEO on `/`
- [ ] Color contrast: gold buttons read white (WCAG AA verified)
- [ ] Real Stripe **test-mode** donation completes end-to-end → receipt email arrives
- [ ] Real Stripe **test-mode** scholarship gift completes → both donor + recipient emails arrive
- [ ] Stripe webhook is registered and `checkout.session.completed` is idempotent
- [ ] Switch Stripe to **live mode** + verify with a $5 real donation refunded
- [ ] `robots.txt` + `sitemap.xml` live
- [ ] JSON-LD validates at https://validator.schema.org
- [ ] OpenGraph preview validates at https://www.opengraph.xyz
- [ ] All cross-links to strokerecoveryacademy.com carry UTM params
- [ ] Custom domain configured + HTTPS green padlock
- [ ] `www.strokelyfe.org` 301-redirects to `strokelyfe.org`
- [ ] 404 page tested
- [ ] EIN, mailing address, contact emails are **real** values (not placeholders)
- [ ] Privacy + Terms + Donor Bill of Rights pages are reviewed by Nick
- [ ] `replit.md` documents the architecture for future maintenance

---

## 14. Build Order (if you want a sequence)

1. Repo scaffold + Tailwind + Shadcn + brand colors in `index.css`
2. Global Header + Footer + base layout
3. Home page (no donate logic yet — buttons go to `/donate`)
4. About + Programs + Transparency pages (mostly content)
5. Donate page UI
6. Stripe + donation API + webhook + thank-you page
7. Gift-scholarship variant of the donate flow
8. Stories index + individual story page (seed with 3 placeholder stories)
9. Contact form + email signup → Resend
10. SEO polish: meta, JSON-LD, sitemap, robots
11. Accessibility pass + Lighthouse pass
12. Launch checklist

---

## 15. Open Questions for the Founder (don't guess — ask)

Before final launch, the agent should ask Nick (the user) for:

1. **EIN** (if they want it published — they had "Available upon request" on the academy page; nonprofits with nothing to hide just publish it)
2. **Mailing address** (required for legitimacy + check donations)
3. **Board of directors** (names, titles, 1-line bios, headshots)
4. **Final mission statement** (1 sentence) and **vision statement** (1 sentence)
5. **Founder story** for the About page (~600 words — agent can draft; Nick edits)
6. **Real impact numbers** (survivors served, scholarships funded — for the home stats strip)
7. **3-10 real survivor stories** (video URLs + quotes + permission)
8. **Real domain emails** (donate@, press@, hello@) — set these up via the registrar
9. **Social media handles** (FB, IG, LinkedIn, YouTube)
10. **Form 990 PDF** (if they have one yet — first-year orgs may not)

Until those are provided, use clearly-labeled placeholders (`EIN: XX-XXXXXXX`, `1,247 survivors served`) so it's obvious what needs replacing.

---

## END OF BRIEF

Build this. Ship it tight. Don't add features I didn't ask for.
