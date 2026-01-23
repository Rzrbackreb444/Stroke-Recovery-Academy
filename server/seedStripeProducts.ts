/**
 * Stripe Products Seed Script
 * Creates products and prices for KreAIte.xyz and Stroke Recovery Academy
 * 
 * Usage: Run this script manually to create/update Stripe products
 * The stripe-replit-sync will automatically sync these to the database
 */

import { getUncachableStripeClient } from './stripeClient';

interface ProductConfig {
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: {
    nickname: string;
    unitAmount: number;
    currency: string;
    interval?: 'month' | 'year';
    metadata?: Record<string, string>;
  }[];
}

// KreAIte.xyz Subscription Products
const KREAITE_PRODUCTS: ProductConfig[] = [
  {
    name: 'KreAIte Free',
    description: 'Basic access to KreAIte.xyz creator platform with limited credits',
    metadata: {
      platform: 'kreaite',
      tier: 'free',
      monthlyCredits: '100',
      features: 'basic_studios,limited_exports,community_access',
    },
    prices: [
      {
        nickname: 'Free Plan',
        unitAmount: 0,
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'free' },
      },
    ],
  },
  {
    name: 'KreAIte Creator',
    description: 'Professional creator tools with 2,500 monthly credits',
    metadata: {
      platform: 'kreaite',
      tier: 'creator',
      monthlyCredits: '2500',
      features: 'all_studios,unlimited_exports,marketplace_access,priority_support',
    },
    prices: [
      {
        nickname: 'Creator Monthly',
        unitAmount: 2900, // $29.00
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'creator', billing: 'monthly' },
      },
      {
        nickname: 'Creator Annual',
        unitAmount: 29000, // $290.00 (2 months free)
        currency: 'usd',
        interval: 'year',
        metadata: { tier: 'creator', billing: 'annual' },
      },
    ],
  },
  {
    name: 'KreAIte Pro',
    description: 'Advanced studio access with 10,000 monthly credits and priority AI processing',
    metadata: {
      platform: 'kreaite',
      tier: 'pro',
      monthlyCredits: '10000',
      features: 'all_studios,premium_ai,advanced_analytics,api_access,white_label',
    },
    prices: [
      {
        nickname: 'Pro Monthly',
        unitAmount: 7900, // $79.00
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'pro', billing: 'monthly' },
      },
      {
        nickname: 'Pro Annual',
        unitAmount: 79000, // $790.00 (2 months free)
        currency: 'usd',
        interval: 'year',
        metadata: { tier: 'pro', billing: 'annual' },
      },
    ],
  },
  {
    name: 'KreAIte Enterprise',
    description: 'Unlimited access with custom integrations and dedicated support',
    metadata: {
      platform: 'kreaite',
      tier: 'enterprise',
      monthlyCredits: 'unlimited',
      features: 'all_studios,unlimited_ai,custom_integrations,dedicated_support,sla',
    },
    prices: [
      {
        nickname: 'Enterprise Monthly',
        unitAmount: 29900, // $299.00
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'enterprise', billing: 'monthly' },
      },
      {
        nickname: 'Enterprise Annual',
        unitAmount: 299000, // $2,990.00 (2 months free)
        currency: 'usd',
        interval: 'year',
        metadata: { tier: 'enterprise', billing: 'annual' },
      },
    ],
  },
];

// Stroke Recovery Academy Products
const RECOVERY_ACADEMY_PRODUCTS: ProductConfig[] = [
  {
    name: 'Recovery Academy Free',
    description: 'Basic access to Stroke Recovery Academy community and resources',
    metadata: {
      platform: 'stroke_recovery_academy',
      tier: 'free',
      features: 'community_access,basic_resources,public_stories',
    },
    prices: [
      {
        nickname: 'Free Access',
        unitAmount: 0,
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'free' },
      },
    ],
  },
  {
    name: 'Recovery Academy Survivor',
    description: 'Full access to recovery resources, exercises, and premium content',
    metadata: {
      platform: 'stroke_recovery_academy',
      tier: 'survivor',
      features: 'all_resources,premium_content,private_groups,creator_tools',
    },
    prices: [
      {
        nickname: 'Survivor Monthly',
        unitAmount: 1499, // $14.99
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'survivor', billing: 'monthly' },
      },
      {
        nickname: 'Survivor Annual',
        unitAmount: 14900, // $149.00 (2 months free)
        currency: 'usd',
        interval: 'year',
        metadata: { tier: 'survivor', billing: 'annual' },
      },
    ],
  },
  {
    name: 'Recovery Academy Creator',
    description: 'Full platform access plus monetization tools and publishing support',
    metadata: {
      platform: 'stroke_recovery_academy',
      tier: 'creator',
      features: 'all_resources,monetization,lulu_publishing,premium_support,analytics',
    },
    prices: [
      {
        nickname: 'Creator Monthly',
        unitAmount: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        metadata: { tier: 'creator', billing: 'monthly' },
      },
      {
        nickname: 'Creator Annual',
        unitAmount: 29900, // $299.00 (2 months free)
        currency: 'usd',
        interval: 'year',
        metadata: { tier: 'creator', billing: 'annual' },
      },
    ],
  },
];

// Credit Packs (One-time purchases)
const CREDIT_PACKS: ProductConfig[] = [
  {
    name: 'Credit Pack - Starter',
    description: '500 credits for KreAIte.xyz',
    metadata: {
      platform: 'kreaite',
      type: 'credit_pack',
      credits: '500',
    },
    prices: [
      {
        nickname: '500 Credits',
        unitAmount: 999, // $9.99
        currency: 'usd',
      },
    ],
  },
  {
    name: 'Credit Pack - Standard',
    description: '2,000 credits for KreAIte.xyz (Best Value)',
    metadata: {
      platform: 'kreaite',
      type: 'credit_pack',
      credits: '2000',
    },
    prices: [
      {
        nickname: '2,000 Credits',
        unitAmount: 2999, // $29.99
        currency: 'usd',
      },
    ],
  },
  {
    name: 'Credit Pack - Pro',
    description: '5,000 credits for KreAIte.xyz',
    metadata: {
      platform: 'kreaite',
      type: 'credit_pack',
      credits: '5000',
    },
    prices: [
      {
        nickname: '5,000 Credits',
        unitAmount: 5999, // $59.99
        currency: 'usd',
      },
    ],
  },
  {
    name: 'Credit Pack - Enterprise',
    description: '20,000 credits for KreAIte.xyz',
    metadata: {
      platform: 'kreaite',
      type: 'credit_pack',
      credits: '20000',
    },
    prices: [
      {
        nickname: '20,000 Credits',
        unitAmount: 19999, // $199.99
        currency: 'usd',
      },
    ],
  },
];

// Lulu Publishing Add-ons
const PUBLISHING_PRODUCTS: ProductConfig[] = [
  {
    name: 'Book Publishing - Basic Package',
    description: 'Professional book formatting and Lulu print setup',
    metadata: {
      platform: 'stroke_lyfe_publishing',
      type: 'publishing_service',
      includes: 'formatting,print_setup,proof_copy',
    },
    prices: [
      {
        nickname: 'Basic Publishing',
        unitAmount: 9900, // $99.00
        currency: 'usd',
      },
    ],
  },
  {
    name: 'Book Publishing - Premium Package',
    description: 'Complete publishing package with cover design and distribution',
    metadata: {
      platform: 'stroke_lyfe_publishing',
      type: 'publishing_service',
      includes: 'formatting,cover_design,print_setup,proof_copy,isbn,distribution',
    },
    prices: [
      {
        nickname: 'Premium Publishing',
        unitAmount: 29900, // $299.00
        currency: 'usd',
      },
    ],
  },
  {
    name: 'Cover Design Service',
    description: 'Professional AI-assisted book cover design',
    metadata: {
      platform: 'stroke_lyfe_publishing',
      type: 'design_service',
    },
    prices: [
      {
        nickname: 'Cover Design',
        unitAmount: 4900, // $49.00
        currency: 'usd',
      },
    ],
  },
  {
    name: 'ISBN Registration',
    description: 'ISBN registration and barcode generation for your book',
    metadata: {
      platform: 'stroke_lyfe_publishing',
      type: 'publishing_addon',
    },
    prices: [
      {
        nickname: 'ISBN Registration',
        unitAmount: 2500, // $25.00
        currency: 'usd',
      },
    ],
  },
];

async function createProducts() {
  const stripe = await getUncachableStripeClient();
  
  const allProducts = [
    ...KREAITE_PRODUCTS,
    ...RECOVERY_ACADEMY_PRODUCTS,
    ...CREDIT_PACKS,
    ...PUBLISHING_PRODUCTS,
  ];
  
  console.log(`Creating ${allProducts.length} products...`);
  
  for (const productConfig of allProducts) {
    try {
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${productConfig.name}'`,
      });
      
      if (existingProducts.data.length > 0) {
        console.log(`Product "${productConfig.name}" already exists, skipping...`);
        continue;
      }
      
      // Create product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: productConfig.metadata,
      });
      
      console.log(`Created product: ${product.name} (${product.id})`);
      
      // Create prices for the product
      for (const priceConfig of productConfig.prices) {
        const priceData: any = {
          product: product.id,
          nickname: priceConfig.nickname,
          unit_amount: priceConfig.unitAmount,
          currency: priceConfig.currency,
          metadata: priceConfig.metadata || {},
        };
        
        if (priceConfig.interval) {
          priceData.recurring = { interval: priceConfig.interval };
        }
        
        const price = await stripe.prices.create(priceData);
        console.log(`  Created price: ${price.nickname} - $${(price.unit_amount! / 100).toFixed(2)} (${price.id})`);
      }
    } catch (error: any) {
      console.error(`Error creating product "${productConfig.name}":`, error.message);
    }
  }
  
  console.log('\nProduct seeding complete!');
}

// Export for manual execution
export { createProducts };

// Run if called directly
if (require.main === module) {
  createProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to seed products:', error);
      process.exit(1);
    });
}
