import { buildAmazonUrl } from "@/lib/amazonLink";

export type { Product } from "@shared/recoveryProducts";
export { RECOVERY_PRODUCTS } from "@shared/recoveryProducts";

import type { Product } from "@shared/recoveryProducts";

export function buildProductUrl(product: Product, tag: string | null | undefined): string {
  return buildAmazonUrl(product.amazonUrl, tag);
}
