/**
 * Stroke Recovery Academy Stripe catalog seed entry point.
 *
 * The catalog reconciler is idempotent and migrates the former KreAIte
 * metadata keys in place, so this script is safe to run after deployment.
 */

import { ensureCanonicalStripeCatalog } from './stripeCatalog';

async function createProducts() {
  const catalog = await ensureCanonicalStripeCatalog();
  console.log('Stroke Recovery Academy Stripe catalog ready:', catalog);
  return catalog;
}

export { createProducts };

if (require.main === module) {
  createProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to seed Stroke Recovery Academy products:', error);
      process.exit(1);
    });
}