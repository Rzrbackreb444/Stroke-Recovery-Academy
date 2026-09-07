import type Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient";

export type CanonicalBillingInterval = "month" | "year";

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