// Shared store editorial copy — single source of truth for the buying guides,
// "How Nick picks products" trust criteria, and store FAQs shown on both the
// SSR store page (server/seo/storeRoutes.ts) and the SPA store
// (client/src/pages/RecoveryStore.tsx). Plain data only — no client/server
// imports. Editing here updates both renderers identically, so Google and
// visitors always see the same copy.

export interface StoreCategoryEditorial {
  id: string;
  name: string;
  guide: string;
}

export const STORE_CATEGORIES: StoreCategoryEditorial[] = [
  {
    id: 'strength',
    name: 'Strength Training',
    guide:
      'When you are rebuilding strength after a stroke, start lighter than you think and choose tools with graded, adjustable resistance so you can progress one small step at a time. Prioritize equipment you can use seated or with support — balance and one-sided weakness make free weights risky early on. The best strength tool is the one that is easy enough to reach for every single day.',
  },
  {
    id: 'mobility',
    name: 'Mobility & Drop Foot',
    guide:
      'For mobility and drop foot, stability on uneven ground matters far more than how a device looks — a wide or pivoting base, a locking brake, and the correct height for your wrist crease are what prevent falls. Drop-foot braces should lift your toe cleanly and fit inside your regular shoe; have a therapist or orthotist confirm the side and fit. Match the level of support to where you are today, and step down to a lighter aid only as confidence returns.',
  },
  {
    id: 'therapy',
    name: 'Therapy Tools',
    guide:
      'Good home therapy tools let you do high-frequency, repeatable reps — repetition is what drives neuroplasticity, so pick tools you will actually use daily. Look for graded resistance or adjustable difficulty so the tool grows with you, and choose items that isolate the weak part (a single finger, the wrist, the ankle) rather than letting stronger muscles take over. These support the work you do with your OT and PT; they do not replace it.',
  },
  {
    id: 'adaptive',
    name: 'Adaptive Aids',
    guide:
      'Adaptive aids buy back independence and dignity in daily life, so choose for the specific task that is hard right now — dressing, eating, reaching, or bathing — rather than a whole kit you may not need. Favor tools that work one-handed or with little grip, built-up or strapped handles, and no-bend reach. The right aid removes the exact barrier between you and doing it yourself.',
  },
  {
    id: 'brain',
    name: 'Brain Games & Books',
    guide:
      'For cognitive and language recovery, large print, short sessions, and graded difficulty keep you practicing instead of frustrated. Choose a mix — word puzzles for language and word-finding, number and logic puzzles for attention and working memory — to train both sides of recovery. Ten focused minutes a day beats one long, exhausting session once a week.',
  },
];

/** id → guide lookup for renderers that key by category id. */
export const STORE_CATEGORY_GUIDES: Record<string, string> = Object.fromEntries(
  STORE_CATEGORIES.map((c) => [c.id, c.guide]),
);

export const HOW_NICK_PICKS_HEADING = 'How Nick picks products';
export const HOW_NICK_PICKS_EYEBROW = 'Survivor-Tested Criteria';
export const HOW_NICK_PICKS_INTRO =
  'Nick Kremers recovered from near-total paralysis to roughly 90% function over seven years. Every item in this store has to clear the same bar he used on himself.';

export const HOW_NICK_PICKS: { title: string; body: string }[] = [
  {
    title: 'Survivor-tested first',
    body: 'Everything is either gear Nick uses in his own recovery or a tool proven by the survivors and therapists he trusts \u2014 not chosen from a spec sheet.',
  },
  {
    title: 'Real therapeutic value',
    body: 'Each product has to solve a specific recovery problem \u2014 grip, drop foot, balance, spasticity, fine motor, cognition, or daily living \u2014 not just look useful.',
  },
  {
    title: 'Start where you are',
    body: 'Adjustable resistance, graded difficulty, and one-handed or seated use win, so a tool meets you at week one and still fits months later.',
  },
  {
    title: 'No paid placements',
    body: 'Nobody pays to be listed. Rankings and picks are based on real-world usefulness and verified customer ratings \u2014 nothing else.',
  },
];

export const STORE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Are these products recommended by a real stroke survivor?',
    a: 'Yes. Every product is hand-picked or personally used by Nick Kremers, a 7-year stroke survivor who recovered from near-total paralysis to roughly 90% function. Items marked "Nick\u2019s Pick" are ones he uses in his own daily routine.',
  },
  {
    q: 'How are the products chosen?',
    a: 'Products are selected for genuine therapeutic value in stroke recovery \u2014 grip and strength rebuilding, drop-foot and mobility support, fine-motor therapy, adaptive daily-living aids, and cognitive training. There are no paid placements; selection is based on real-world usefulness and verified customer ratings.',
  },
  {
    q: 'Does buying through these links cost me more?',
    a: 'No. Prices are exactly the same as buying directly on Amazon. Stroke Recovery Academy earns a small affiliate commission at no extra cost to you, and that revenue funds free resources and scholarships for stroke survivors.',
  },
  {
    q: 'What if I have weakness or limited hand function?',
    a: 'Many items \u2014 adaptive utensils, dressing aids, transfer slings, and rotating-grip trainers \u2014 are chosen specifically for survivors with hemiparesis or limited grip. Each product lists its recovery benefits so you can match a tool to where you are today.',
  },
  {
    q: 'How do the affiliate links work?',
    a: 'Each \u201CCheck Current Price on Amazon\u201D button opens the product on Amazon.com with our Amazon Associates tag attached. You then check out on Amazon exactly as you normally would \u2014 we never see your payment details, and the tag simply lets Amazon credit the referral. Prices and Amazon Prime shipping are unchanged.',
  },
  {
    q: 'What is the return policy on these products?',
    a: 'All purchases are fulfilled and shipped by Amazon or its sellers, so Amazon\u2019s standard return policy applies \u2014 most items can be returned within 30 days directly through your Amazon account. Because you buy and check out on Amazon, returns, refunds, warranties, and customer service are handled entirely by Amazon, not by Stroke Recovery Academy.',
  },
  {
    q: 'Is this medical advice?',
    a: 'No. The Recovery Store is curated from lived experience and is non-clinical. Always check with your doctor or therapist before starting new exercises or equipment, especially early in recovery.',
  },
];
