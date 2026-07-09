// Single source of truth for the survivor offer — prices, trial, coach caps,
// and the canonical marketing copy. Imported by the client (Landing, Premium,
// Coach) and the server (checkout, status) so a price or a word only ever
// changes in ONE place. Keep this framework-agnostic: plain constants + pure
// helpers only, no React / no Node-only imports.

// ── Prices (cents) ──────────────────────────────────────────────────────────
export const PREMIUM_MONTHLY_CENTS = 1900; // $19 / mo
export const PREMIUM_ANNUAL_CENTS = 19000; // $190 / yr (≈ 2 months free)
export const FOUNDER_MONTHLY_CENTS = 4900; // $49 / mo — high-touch Founder's Circle

export const TRIAL_DAYS = 7;

// ── Coach free access (two distinct gates — both true, worded precisely) ─────
// Anonymous visitors get a taste with no account; signed-in free survivors get
// a daily allowance. Premium/Founder = unlimited.
export const COACH_FREE_ANON_MESSAGES = 3; // no signup, no card
export const COACH_FREE_DAILY_MESSAGES = 5; // signed-in free tier, per day

// ── Derived money math (computed once, used everywhere) ─────────────────────
export const PREMIUM_MONTHLY_USD = PREMIUM_MONTHLY_CENTS / 100;
export const PREMIUM_ANNUAL_USD = PREMIUM_ANNUAL_CENTS / 100;
export const FOUNDER_MONTHLY_USD = FOUNDER_MONTHLY_CENTS / 100;

// $190 / 12 → $15.83/mo
export const PREMIUM_ANNUAL_PER_MONTH_USD =
  Math.round((PREMIUM_ANNUAL_CENTS / 12) / 100 * 100) / 100;

// $19×12 − $190 = $38 saved on annual
export const PREMIUM_ANNUAL_SAVINGS_USD =
  (PREMIUM_MONTHLY_CENTS * 12 - PREMIUM_ANNUAL_CENTS) / 100;

// Whole months "free" on annual vs monthly (rounded down): 38 / 19 = 2
export const PREMIUM_ANNUAL_MONTHS_FREE = Math.floor(
  PREMIUM_ANNUAL_SAVINGS_USD / PREMIUM_MONTHLY_USD,
);

export type OfferTier = "free" | "premium" | "founder";
export type BillingPlan = "monthly" | "annual";

// ── Canonical copy (used verbatim so wording never drifts across surfaces) ───
export const OFFER_COPY = {
  brandTagline: "Heart's still thumpin'.",
  premiumName: "Sasquatch Premium",
  founderName: "Founder's Circle",
  trialLabel: `${TRIAL_DAYS}-day free trial`,
  cancelAnytime: "Cancel anytime — one click, no phone calls.",
  primaryCta: `Start your ${TRIAL_DAYS}-day free trial`,
  coachCta: "Talk to Coach — free",
  // Precise, non-contradictory framing of the two free gates.
  coachFreeLine: `${COACH_FREE_ANON_MESSAGES} free messages, no signup. Free account after that (${COACH_FREE_DAILY_MESSAGES}/day). Premium is unlimited.`,
  annualHeadline: `$${PREMIUM_ANNUAL_USD}/yr (≈ $${PREMIUM_ANNUAL_PER_MONTH_USD}/mo) — ${PREMIUM_ANNUAL_MONTHS_FREE} months free`,
  monthlyHeadline: `$${PREMIUM_MONTHLY_USD}/mo`,
  founderHeadline: `$${FOUNDER_MONTHLY_USD}/mo`,
} as const;

// Human-readable price string for a plan (no trailing cents when whole).
export function priceLabel(plan: BillingPlan): string {
  return plan === "annual" ? OFFER_COPY.annualHeadline : OFFER_COPY.monthlyHeadline;
}
