import Stripe from 'stripe';

let recoveryStripe: Stripe | null = null;

export function getRecoveryStripeClient(): Stripe {
  if (!recoveryStripe) {
    const secretKey = process.env.RECOVERY_STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('RECOVERY_STRIPE_SECRET_KEY not configured. Please add your Stroke Recovery Academy Stripe secret key.');
    }

    recoveryStripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
  
  return recoveryStripe;
}

export function getRecoveryStripePublishableKey(): string {
  const key = process.env.RECOVERY_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('RECOVERY_STRIPE_PUBLISHABLE_KEY not configured');
  }
  return key;
}

export function isRecoveryStripeConfigured(): boolean {
  return !!(process.env.RECOVERY_STRIPE_SECRET_KEY && process.env.RECOVERY_STRIPE_PUBLISHABLE_KEY);
}
