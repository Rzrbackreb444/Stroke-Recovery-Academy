import Stripe from 'stripe';

let connectionSettings: any;

function getConfiguredSecretCredentials() {
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_API_KEY ||
    process.env.VITE_STRIPEAPI_KEY;
  const secretKey =
    process.env.STRIPE_SECRET_API_KEY ||
    process.env.STRIPE_SECRET_KEY;

  if (!publishableKey || !secretKey) return null;
  return { publishableKey, secretKey };
}

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    const configuredCredentials = getConfiguredSecretCredentials();
    if (configuredCredentials) return configuredCredentials;
    throw new Error('Stripe credentials are not configured');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';
  const configuredCredentials = getConfiguredSecretCredentials();

  try {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', connectorName);
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    const data = await response.json();
    connectionSettings = data.items?.[0];

    const connectorCredentials = connectionSettings?.settings;
    if (connectorCredentials?.publishable && connectorCredentials?.secret) {
      return {
        publishableKey: connectorCredentials.publishable,
        secretKey: connectorCredentials.secret,
      };
    }
  } catch (error) {
    if (!configuredCredentials) throw error;
  }

  if (configuredCredentials) {
    console.warn(
      `[stripe] ${targetEnvironment} Replit connector unavailable; using configured Stripe secret fallback`
    );
    return configuredCredentials;
  }

  throw new Error(`Stripe ${targetEnvironment} connection not found`);
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
