import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ensureCanonicalFixedPrice,
  FIXED_SRA_PRICE_CONFIGS,
} from "../server/stripeCatalog";

test("fixed Stripe catalog prices are reused instead of recreated", async () => {
  let productCreates = 0;
  let priceCreates = 0;
  const products: any[] = [];
  const prices: any[] = [];
  const stripe = {
    products: {
      list: async () => ({ data: products }),
      create: async (params: any) => {
        productCreates += 1;
        const product = {
          id: `prod_${productCreates}`,
          name: params.name,
          description: params.description,
          metadata: params.metadata,
        };
        products.push(product);
        return product;
      },
      update: async (id: string, params: any) => {
        const product = products.find((candidate) => candidate.id === id);
        Object.assign(product, params);
        return product;
      },
    },
    prices: {
      list: async ({ product }: { product: string }) => ({
        data: prices.filter((price) => price.product === product && price.active),
      }),
      create: async (params: any) => {
        priceCreates += 1;
        const price = {
          id: `price_${priceCreates}`,
          ...params,
          active: true,
          recurring: params.recurring,
        };
        prices.push(price);
        return price;
      },
      update: async (id: string, params: any) => {
        const price = prices.find((candidate) => candidate.id === id);
        Object.assign(price, params);
        return price;
      },
    },
  };

  const config = FIXED_SRA_PRICE_CONFIGS.creditCheer;
  const first = await ensureCanonicalFixedPrice(config, stripe as any);
  const second = await ensureCanonicalFixedPrice(config, stripe as any);

  assert.equal(first, second);
  assert.equal(productCreates, 1);
  assert.equal(priceCreates, 1);
});

test("fixed checkout services do not define inline Stripe prices", async () => {
  const files = [
    "../server/checkoutService.ts",
    "../server/powerPointsService.ts",
    "../server/marketplaceService.ts",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /price_data\s*:/, `${file} must use stored price IDs`);
  }

  const recovery = await readFile(
    new URL("../server/recoveryStripeService.ts", import.meta.url),
    "utf8",
  );
  const premium = recovery.slice(
    recovery.indexOf("async createPremiumPurchaseCheckout"),
    recovery.indexOf("async createSubscriptionCheckout"),
  );
  assert.doesNotMatch(premium, /price_data\s*:/);
  assert.match(recovery, /createTipCheckout[\s\S]*price_data\s*:/);
  assert.match(recovery, /createDonationCheckout[\s\S]*price_data\s*:/);
});