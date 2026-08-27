import Stripe from 'stripe';

let recoveryStripe: Stripe | null = null;

function getRecoverySecretKey(): string | undefined {
  // Recovery checkout historically had its own variable names. Keep those
  // preferred, but use the project's configured Stripe account when the
  // dedicated recovery aliases have not been added yet.
  return process.env.RECOVERY_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_API_KEY;
}

function getRecoveryPublishableKey(): string | undefined {
  return (
    process.env.RECOVERY_STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_API_KEY ||
    process.env.VITE_STRIPEAPI_KEY
  );
}

export function getRecoveryStripeClient(): Stripe {
  if (!recoveryStripe) {
    const secretKey = getRecoverySecretKey();
    
    if (!secretKey) {
      throw new Error('Stripe payment processing is not configured.');
    }

    recoveryStripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
  
  return recoveryStripe;
}

export function getRecoveryStripePublishableKey(): string {
  const key = getRecoveryPublishableKey();
  if (!key) {
    throw new Error('Stripe payment processing is not configured.');
  }
  return key;
}

export function isRecoveryStripeConfigured(): boolean {
  return !!(getRecoverySecretKey() && getRecoveryPublishableKey());
}
