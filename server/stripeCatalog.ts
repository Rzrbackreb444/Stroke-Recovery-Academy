import type Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient";

export type CanonicalBillingInterval = "month" | "year";

export type FixedStripePriceConfig = {
  key: string;
  name: string;
  description: string;
  unitAmount: number;
  currency?: string;
  legacyKeys?: string[];
  recurringInterval?: CanonicalBillingInterval;
};

type CatalogPriceConfig = {
  key: string;
  legacyKeys?: string[];
  billing: "monthly" | "annual";
  interval: CanonicalBillingInterval;
  unitAmount: number;
  nickname: string;
};

type CatalogProductConfig = {
  key: string;
  legacyKeys?: string[];
  name: string;
  description: string;
  platform: string;
  tier: string;
  prices: [CatalogPriceConfig, CatalogPriceConfig];
};

export type CanonicalStripeCatalog = {
  creator: { monthlyPriceId: string; annualPriceId: string };
  pro: { monthlyPriceId: string; annualPriceId: string };
  enterprise: { monthlyPriceId: string; annualPriceId: string };
  warrior: { monthlyPriceId: string; annualPriceId: string };
  sasquatchPremium: { monthlyPriceId: string; annualPriceId: string };
};

const CATALOG_PRODUCTS: CatalogProductConfig[] = [
  {
    key: "sra_creator",
    legacyKeys: ["kreaite_creator"],
    name: "Stroke Recovery Academy Creator",
    description:
      "For survivors, caregivers, and recovery creators: full Stroke Recovery Academy tools, 2,500 monthly credits, and commercial licensing.",
    platform: "stroke_recovery_academy",
    tier: "creator",
    prices: [
      {
        key: "sra_creator_monthly",
        legacyKeys: ["kreaite_creator_monthly"],
        billing: "monthly",
        interval: "month",
        unitAmount: 2900,
        nickname: "Creator Monthly",
      },
      {
        key: "sra_creator_annual",
        legacyKeys: ["kreaite_creator_annual"],
        billing: "annual",
        interval: "year",
        unitAmount: 24900,
        nickname: "Creator Annual",
      },
    ],
  },
  {
    key: "sra_pro",
    legacyKeys: ["kreaite_pro"],
    name: "Stroke Recovery Academy Pro",
    description:
      "Unlimited Stroke Recovery Academy access with priority generation, advanced tools, and commercial licensing.",
    platform: "stroke_recovery_academy",
    tier: "pro",
    prices: [
      {
        key: "sra_pro_monthly",
        legacyKeys: ["kreaite_pro_monthly"],
        billing: "monthly",
        interval: "month",
        unitAmount: 7900,
        nickname: "Pro Monthly",
      },
      {
        key: "sra_pro_annual",
        legacyKeys: ["kreaite_pro_annual"],
        billing: "annual",
        interval: "year",
        unitAmount: 69900,
        nickname: "Pro Annual",
      },
    ],
  },
  {
    key: "sra_enterprise",
    legacyKeys: ["kreaite_enterprise"],
    name: "Stroke Recovery Academy Enterprise",
    description:
      "Team access to Stroke Recovery Academy with seats, API access, white-label options, and dedicated support.",
    platform: "stroke_recovery_academy",
    tier: "enterprise",
    prices: [
      {
        key: "sra_enterprise_monthly",
        legacyKeys: ["kreaite_enterprise_monthly"],
        billing: "monthly",
        interval: "month",
        unitAmount: 29900,
        nickname: "Enterprise Monthly",
      },
      {
        key: "sra_enterprise_annual",
        legacyKeys: ["kreaite_enterprise_annual"],
        billing: "annual",
        interval: "year",
        unitAmount: 249900,
        nickname: "Enterprise Annual",
      },
    ],
  },
  {
    key: "stroke_recovery_academy_warrior",
    name: "Warrior Membership — Stroke Recovery Academy",
    description:
      "The full Warrior recovery membership, including the 66-Day system, AI Coach, protocols, and community.",
    platform: "stroke_recovery_academy",
    tier: "warrior",
    prices: [
      {
        key: "stroke_recovery_academy_warrior_monthly",
        billing: "monthly",
        interval: "month",
        unitAmount: 4700,
        nickname: "Warrior Monthly",
      },
      {
        key: "stroke_recovery_academy_warrior_annual",
        billing: "annual",
        interval: "year",
        unitAmount: 39700,
        nickname: "Warrior Annual",
      },
    ],
  },
  {
    key: "sasquatch_premium",
    name: "Sasquatch Premium — Unlimited Survivor Tools",
    description:
      "Unlimited AI Sasquatch Coach, Recovery Anchor renders, voice cloning, and premium Campfire circles.",
    platform: "stroke_recovery_academy",
    tier: "sasquatch_premium",
    prices: [
      {
        key: "sasquatch_premium_monthly",
        billing: "monthly",
        interval: "month",
        unitAmount: 1900,
        nickname: "Sasquatch Premium Monthly",
      },
      {
        key: "sasquatch_premium_annual",
        billing: "annual",
        interval: "year",
        unitAmount: 19000,
        nickname: "Sasquatch Premium Annual",
      },
    ],
  },
];

type ProductWithPrices = {
  product: Stripe.Product;
  monthlyPriceId: string;
  annualPriceId: string;
};

let catalogPromise: Promise<CanonicalStripeCatalog> | null = null;
const clientCatalogPromises = new WeakMap<
  object,
  Promise<CanonicalStripeCatalog>
>();

function metadataMatches(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): boolean {
  return metadata?.catalog_key === key;
}

function recurringInterval(
  price: Stripe.Price,
): CanonicalBillingInterval | undefined {
  const interval = price.recurring?.interval;
  return interval === "month" || interval === "year" ? interval : undefined;
}

async function findOrCreateProduct(
  stripe: Stripe,
  config: CatalogProductConfig,
): Promise<Stripe.Product> {
  const catalogKeys = [config.key, ...(config.legacyKeys ?? [])];
  const searchResults = await Promise.all(
    catalogKeys.map((key) =>
      stripe.products.search({
        query: `metadata['catalog_key']:'${key}'`,
        limit: 100,
      }),
    ),
  );
  const matching = searchResults
    .flatMap((result) => result.data)
    .filter((product, index, products) =>
      products.findIndex((candidate) => candidate.id === product.id) === index &&
      catalogKeys.some((key) => metadataMatches(product.metadata, key)),
    )
    .sort((a, b) => a.created - b.created);
  const existing = matching.find((product) => product.active) ?? matching[0];

  if (existing) {
    const metadata = {
      ...existing.metadata,
      catalog_key: config.key,
      platform: config.platform,
      tier: config.tier,
    };
    if (
      !existing.active ||
      existing.name !== config.name ||
      existing.description !== config.description ||
      existing.metadata?.catalog_key !== config.key ||
      existing.metadata?.platform !== config.platform ||
      existing.metadata?.tier !== config.tier
    ) {
      return stripe.products.update(existing.id, {
        active: true,
        name: config.name,
        description: config.description,
        metadata,
      });
    }
    return existing;
  }

  return stripe.products.create({
    name: config.name,
    description: config.description,
    metadata: {
      catalog_key: config.key,
      platform: config.platform,
      tier: config.tier,
      ...(config.key === "sasquatch_premium"
        ? { feature: "sasquatch_premium" }
        : {}),
    },
  });
}

async function findOrCreatePrice(
  stripe: Stripe,
  product: Stripe.Product,
  productConfig: CatalogProductConfig,
  config: CatalogPriceConfig,
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const priceKeys = [config.key, ...(config.legacyKeys ?? [])];
  const existing = prices.data.find(
    (price) =>
      priceKeys.includes(price.metadata?.catalog_key ?? "") &&
      price.unit_amount === config.unitAmount &&
      price.currency === "usd" &&
      recurringInterval(price) === config.interval,
  );
  if (existing) {
    const metadata = {
      ...existing.metadata,
      catalog_key: config.key,
      product_key: productConfig.key,
      platform: productConfig.platform,
      tier: productConfig.tier,
      billing: config.billing,
      ...(productConfig.key === "sasquatch_premium"
        ? { feature: "sasquatch_premium" }
        : {}),
    };
    if (
      existing.nickname !== config.nickname ||
      existing.metadata?.catalog_key !== config.key ||
      existing.metadata?.product_key !== productConfig.key ||
      existing.metadata?.platform !== productConfig.platform ||
      existing.metadata?.tier !== productConfig.tier ||
      existing.metadata?.billing !== config.billing
    ) {
      return stripe.prices.update(existing.id, { nickname: config.nickname, metadata });
    }
    return existing;
  }

  return stripe.prices.create({
    product: product.id,
    nickname: config.nickname,
    unit_amount: config.unitAmount,
    currency: "usd",
    recurring: { interval: config.interval },
    metadata: {
      catalog_key: config.key,
      product_key: productConfig.key,
      platform: productConfig.platform,
      tier: productConfig.tier,
      billing: config.billing,
      ...(productConfig.key === "sasquatch_premium"
        ? { feature: "sasquatch_premium" }
        : {}),
    },
  });
}

async function ensureProduct(
  stripe: Stripe,
  config: CatalogProductConfig,
): Promise<ProductWithPrices> {
  const product = await findOrCreateProduct(stripe, config);
  const [monthly, annual] = await Promise.all(
    config.prices.map((price) =>
      findOrCreatePrice(stripe, product, config, price),
    ),
  );

  return {
    product,
    monthlyPriceId: monthly.id,
    annualPriceId: annual.id,
  };
}

function toCatalog(
  products: Map<string, ProductWithPrices>,
): CanonicalStripeCatalog {
  const get = (key: string) => {
    const product = products.get(key);
    if (!product) throw new Error(`Canonical Stripe product missing: ${key}`);
    return {
      monthlyPriceId: product.monthlyPriceId,
      annualPriceId: product.annualPriceId,
    };
  };

  return {
    creator: get("sra_creator"),
    pro: get("sra_pro"),
    enterprise: get("sra_enterprise"),
    warrior: get("stroke_recovery_academy_warrior"),
    sasquatchPremium: get("sasquatch_premium"),
  };
}

async function reconcileCatalog(
  stripe: Stripe,
): Promise<CanonicalStripeCatalog> {
  const products = new Map<string, ProductWithPrices>();
  for (const config of CATALOG_PRODUCTS) {
    products.set(config.key, await ensureProduct(stripe, config));
  }
  return toCatalog(products);
}

export async function ensureCanonicalStripeCatalog(
  stripe?: Stripe,
): Promise<CanonicalStripeCatalog> {
  if (stripe) {
    const existing = clientCatalogPromises.get(stripe);
    if (existing) return existing;

    const promise = reconcileCatalog(stripe).catch((error) => {
      clientCatalogPromises.delete(stripe);
      throw error;
    });
    clientCatalogPromises.set(stripe, promise);
    return promise;
  }

  if (!catalogPromise) {
    catalogPromise = (async () => {
      return reconcileCatalog(await getUncachableStripeClient());
    })().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

export function clearCanonicalStripeCatalogCache(): void {
  catalogPromise = null;
}

const fixedPricePromises = new WeakMap<object, Map<string, Promise<string>>>();
const fixedPriceConfigs = new Map<string, FixedStripePriceConfig>();

function fixedPriceMetadata(config: FixedStripePriceConfig, productKey: string) {
  return {
    catalog_key: config.key,
    product_key: productKey,
    platform: "stroke_recovery_academy",
    billing: "one_time",
  };
}

/**
 * Resolve a stable one-time Stripe Price. Stripe Prices are immutable, so a
 * changed amount must use a new price under the same product; callers persist
 * the returned id on their own catalog row and checkout only references it.
 */
export async function ensureCanonicalFixedPrice(
  config: FixedStripePriceConfig,
  stripe?: Stripe,
): Promise<string> {
  const client = stripe ?? (await getUncachableStripeClient());
  let clientPrices = fixedPricePromises.get(client as object);
  if (!clientPrices) {
    clientPrices = new Map();
    fixedPricePromises.set(client as object, clientPrices);
  }
  const existingPromise = clientPrices.get(config.key);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
    fixedPriceConfigs.set(config.key, config);
    const currency = (config.currency ?? "usd").toLowerCase();
    const productKey = `sra_${config.key}`;
    const products = await client.products.list({ active: true, limit: 100 });
    let product = products.data.find(
      (candidate) =>
        candidate.metadata?.product_key === productKey ||
        candidate.metadata?.catalog_key === config.key ||
        [config.key, ...(config.legacyKeys ?? [])].includes(
          candidate.metadata?.catalog_key ?? "",
        ),
    );
    if (!product) {
      product = await client.products.create({
        name: config.name,
        description: config.description,
        metadata: fixedPriceMetadata(config, productKey),
      });
    } else if (
      product.name !== config.name ||
      product.description !== config.description ||
      product.metadata?.catalog_key !== config.key ||
      product.metadata?.product_key !== productKey
    ) {
      product = await client.products.update(product.id, {
        name: config.name,
        description: config.description,
        metadata: {
          ...product.metadata,
          ...fixedPriceMetadata(config, productKey),
        },
      });
    }

    const prices = await client.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });
    const keys = [config.key, ...(config.legacyKeys ?? [])];
    const price = prices.data.find(
      (candidate) =>
        keys.includes(candidate.metadata?.catalog_key ?? "") &&
        candidate.unit_amount === config.unitAmount &&
        candidate.currency === currency &&
        (config.recurringInterval
          ? candidate.recurring?.interval === config.recurringInterval
          : !candidate.recurring),
    );
    if (price) {
      if (
        price.metadata?.catalog_key !== config.key ||
        price.metadata?.product_key !== productKey
      ) {
        return (
          await client.prices.update(price.id, {
            nickname: config.name,
            metadata: {
              ...price.metadata,
              ...fixedPriceMetadata(config, productKey),
            },
          })
        ).id;
      }
      return price.id;
    }

    return (
      await client.prices.create({
        product: product.id,
        nickname: config.name,
        unit_amount: config.unitAmount,
        currency,
        ...(config.recurringInterval
          ? { recurring: { interval: config.recurringInterval } }
          : {}),
        metadata: fixedPriceMetadata(config, productKey),
      })
    ).id;
  })().catch((error) => {
    clientPrices!.delete(config.key);
    throw error;
  });
  clientPrices.set(config.key, promise);
  return promise;
}

export const FIXED_SRA_PRICE_CONFIGS = {
  creditCheer: {
    key: "sra_credit_cheer",
    name: "Cheer Pack",
    description: "25 AI Credits for content creation",
    unitAmount: 100,
  },
  creditSpark: {
    key: "sra_credit_spark",
    name: "Spark Pack",
    description: "100 AI Credits for content creation",
    unitAmount: 500,
  },
  creditBoost: {
    key: "sra_credit_boost",
    name: "Boost Pack",
    description: "250 AI Credits for content creation",
    unitAmount: 1000,
  },
  creditSurge: {
    key: "sra_credit_surge",
    name: "Surge Pack",
    description: "600 AI Credits for content creation",
    unitAmount: 2000,
  },
  creditBeast: {
    key: "sra_credit_beast",
    name: "Beast Pack",
    description: "1,500 AI Credits for content creation",
    unitAmount: 4000,
  },
  creditLegend: {
    key: "sra_credit_legend",
    name: "Legend Pack",
    description: "4,000 AI Credits for content creation",
    unitAmount: 10000,
  },
  powerPointsCheer: {
    key: "sra_power_points_cheer",
    name: "Power Points — Cheer",
    description: "25 Power Points",
    unitAmount: 100,
  },
  powerPointsSpark: {
    key: "sra_power_points_spark",
    name: "Power Points — Spark",
    description: "100 Power Points",
    unitAmount: 500,
  },
  powerPointsBoost: {
    key: "sra_power_points_boost",
    name: "Power Points — Boost",
    description: "250 Power Points",
    unitAmount: 1000,
  },
  powerPointsSurge: {
    key: "sra_power_points_surge",
    name: "Power Points — Surge",
    description: "600 Power Points",
    unitAmount: 2000,
  },
  powerPointsBeast: {
    key: "sra_power_points_beast",
    name: "Power Points — Beast Mode",
    description: "1,500 Power Points",
    unitAmount: 4000,
  },
  coachingSingle: {
    key: "sra_coaching_single",
    name: "Single Coaching Session (30 min)",
    description: "1-on-1 coaching with Nick",
    unitAmount: 9900,
  },
  coachingPackage: {
    key: "sra_coaching_package",
    name: "Coaching Package (4 sessions)",
    description: "1-on-1 coaching with Nick",
    unitAmount: 34900,
  },
  coachingBasic: {
    key: "sra_coaching_basic",
    name: "Gift: 1 Month Warrior Access",
    description: "One month of full Warrior membership",
    unitAmount: 4700,
  },
  coachingMentored: {
    key: "sra_coaching_mentored",
    name: "Gift: 3 Month Warrior Access",
    description: "3 months of Warrior membership",
    unitAmount: 14100,
  },
  coachingElite: {
    key: "sra_coaching_elite",
    name: "Gift: Full Year Warrior Access",
    description: "A full year of Warrior membership",
    unitAmount: 39700,
  },
  coachingAccountabilityMonthly: {
    key: "sra_coaching_accountability_monthly",
    name: "Monthly Accountability",
    description: "Weekly check-ins to keep you on track",
    unitAmount: 19700,
    recurringInterval: "month",
  },
  coachingRecoveryIntensive: {
    key: "sra_coaching_recovery_intensive",
    name: "Recovery Intensive",
    description: "Deep dive strategy session with Nick",
    unitAmount: 49700,
  },
  coachingTransformation: {
    key: "sra_coaching_transformation",
    name: "66-Day Transformation",
    description: "Complete guided transformation program",
    unitAmount: 199700,
  },
  coachingEliteAnnual: {
    key: "sra_coaching_elite_annual",
    name: "Elite Annual Coaching",
    description: "Year-long transformation with Nick",
    unitAmount: 499700,
    recurringInterval: "year",
  },
} satisfies Record<string, FixedStripePriceConfig>;