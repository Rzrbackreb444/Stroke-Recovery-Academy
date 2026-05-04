// ============================================================================
// SASQUATCH STUDIO — TIER DEFINITIONS
// Single source of truth used by both server (gates, Stripe) and client (UI).
// ============================================================================

export type StudioTier = "creator" | "pro" | "label";
export type BillingPeriod = "monthly" | "annual";

export interface TierFeatures {
  monthlyCharacterCap: number;
  voicesAllowed: number;
  albumsAllowed: number;          // -1 = unlimited
  tracksPerAlbum: number;         // -1 = unlimited
  publicSharePages: boolean;      // /album/:slug public listen page
  customShareSlug: boolean;       // pick your own slug (Label only)
  collaboratorsPerAlbum: number;  // 0 = solo only
  aiCoverGenerator: boolean;      // generate album art in-app
  distributionMetadata: boolean;  // Spotify/Apple-ready JSON export
  pressKitExport: boolean;        // PDF cover + lyric booklet
  prioritySupport: boolean;
}

export interface TierDef {
  id: StudioTier;
  name: string;
  tagline: string;
  monthlyUsdCents: number;
  annualUsdCents: number;     // billed once for the year
  monthlyDisplay: string;
  annualDisplay: string;
  annualEffectivePerMonth: string;
  perks: string[];            // bullets shown on the pricing card
  features: TierFeatures;
  highlight?: boolean;        // "Most popular" flag
  cta: string;
}

export const STUDIO_TIERS: Record<StudioTier, TierDef> = {
  creator: {
    id: "creator",
    name: "Creator",
    tagline: "Clone your voice. Make tracks. Own them.",
    monthlyUsdCents: 999,
    annualUsdCents: 9900,         // $99/yr → $8.25/mo effective
    monthlyDisplay: "$9.99",
    annualDisplay: "$99",
    annualEffectivePerMonth: "$8.25",
    cta: "Start Creator",
    perks: [
      "Clone up to 3 voices",
      "50,000 characters of generation per month",
      "Build up to 3 albums",
      "Up to 20 tracks per album",
      "Download every album as MP3 ZIP + tracklist + .m3u playlist",
      "Cancel anytime",
    ],
    features: {
      monthlyCharacterCap: 50_000,
      voicesAllowed: 3,
      albumsAllowed: 3,
      tracksPerAlbum: 20,
      publicSharePages: false,
      customShareSlug: false,
      collaboratorsPerAlbum: 0,
      aiCoverGenerator: false,
      distributionMetadata: false,
      pressKitExport: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Release like a label. Share like an artist.",
    monthlyUsdCents: 1999,
    annualUsdCents: 19900,        // $199/yr → $16.58/mo effective
    monthlyDisplay: "$19.99",
    annualDisplay: "$199",
    annualEffectivePerMonth: "$16.58",
    cta: "Go Pro",
    highlight: true,
    perks: [
      "Everything in Creator",
      "Clone up to 5 voices",
      "200,000 characters per month",
      "Unlimited albums (up to 50 tracks each)",
      "Public share pages — sasquatchsound.com/album/your-album",
      "AI album cover generator",
      "Distribution metadata export (Spotify/Apple-ready)",
    ],
    features: {
      monthlyCharacterCap: 200_000,
      voicesAllowed: 5,
      albumsAllowed: -1,
      tracksPerAlbum: 50,
      publicSharePages: true,
      customShareSlug: false,
      collaboratorsPerAlbum: 1,
      aiCoverGenerator: true,
      distributionMetadata: true,
      pressKitExport: false,
      prioritySupport: false,
    },
  },
  label: {
    id: "label",
    name: "Label",
    tagline: "Run a survivor music label of your own.",
    monthlyUsdCents: 4999,
    annualUsdCents: 49900,        // $499/yr → $41.58/mo effective
    monthlyDisplay: "$49.99",
    annualDisplay: "$499",
    annualEffectivePerMonth: "$41.58",
    cta: "Become a Label",
    perks: [
      "Everything in Pro",
      "Clone up to 15 voices",
      "600,000 characters per month",
      "Unlimited albums and unlimited tracks",
      "Custom share slug — pick your own URL",
      "Up to 5 collaborators per album",
      "Press kit export (cover PDF + lyric booklet)",
      "Priority email support",
    ],
    features: {
      monthlyCharacterCap: 600_000,
      voicesAllowed: 15,
      albumsAllowed: -1,
      tracksPerAlbum: -1,
      publicSharePages: true,
      customShareSlug: true,
      collaboratorsPerAlbum: 5,
      aiCoverGenerator: true,
      distributionMetadata: true,
      pressKitExport: true,
      prioritySupport: true,
    },
  },
};

export const TIER_ORDER: StudioTier[] = ["creator", "pro", "label"];
export const TIER_RANK: Record<StudioTier, number> = {
  creator: 1,
  pro: 2,
  label: 3,
};

// Stripe lookup_keys — used so getOrCreatePrice() is idempotent across deploys.
export function lookupKeyFor(tier: StudioTier, period: BillingPeriod): string {
  return `sasq_studio_${tier}_${period}_v1`;
}

// Tier resolved from a stored row. Defaults to the cheapest paid tier if a
// legacy row exists without a tier column populated.
export function resolveTier(stored?: string | null): StudioTier {
  if (stored === "pro" || stored === "label") return stored;
  return "creator";
}

export function featuresFor(tier: StudioTier): TierFeatures {
  return STUDIO_TIERS[tier].features;
}
