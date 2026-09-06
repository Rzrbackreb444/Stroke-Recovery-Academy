import Stripe from 'stripe';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

let connectionSettings: any;

type StripeStartupSync = {
  stripe: {
    webhookEndpoints: {
      retrieve(id: string): Promise<unknown>;
    };
    customers: {
      retrieve(id: string): Promise<{ id: string; object?: string; deleted?: boolean }>;
    };
  };
  listManagedWebhooks(): Promise<Array<{ id: string }>>;
  getAccountId(): Promise<string>;
  upsertCustomers(
    customers: Array<{ id: string; object: string; deleted: boolean }>,
    accountId: string,
  ): Promise<unknown>;
  postgresClient: {
    delete(table: string, id: string): Promise<boolean>;
    query(text: string, params?: unknown[]): Promise<{ rows: Array<{ id: string }> }>;
  };
};

/**
 * Stripe uses resource_missing for deleted objects. The status-code check
 * covers older stripe-node errors that omit the more specific error code.
 * Do not classify authentication, permission, or network errors as stale data.
 */
export function isStripeResourceMissingError(error: unknown): boolean {
  const stripeError = error as {
    code?: string;
    statusCode?: number;
    status?: number;
  } | null;

  return (
    stripeError?.code === 'resource_missing' ||
    stripeError?.statusCode === 404 ||
    stripeError?.status === 404
  );
}

function stripeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type StripeCustomerApi = {
  customers: {
    // Stripe's SDK response includes request metadata and uses `void` for
    // `deleted` on live customers, so keep this adapter boundary structural.
    retrieve(id: string): Promise<any>;
    create(params: {
      email?: string;
      metadata?: Record<string, string>;
    }): Promise<any>;
  };
};

export type StripeCustomerDatabase = Pick<typeof db, 'transaction'>;

export type StripeCustomerStore = {
  withUserLock<T>(
    userId: string,
    operation: (store: {
      getCustomerId: () => Promise<string | null | undefined>;
      setCustomerId: (customerId: string) => Promise<void>;
    }) => Promise<T>,
  ): Promise<T>;
};

/**
 * Run a customer operation under the same transaction-scoped per-user lock
 * used by the default users-table store. Callers with a different customer
 * pointer table can reuse the lock while keeping their persistence isolated.
 */
export function withStripeCustomerUserLock<T>(
  database: StripeCustomerDatabase,
  userId: string,
  operation: (tx: any) => Promise<T>,
): Promise<T> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(
      hashtextextended(${`stripe-customer:${userId}`}, 0)
    )`);

    return operation(tx);
  });
}

/**
 * Return a usable Stripe customer ID for checkout.
 *
 * Startup reconciliation intentionally keeps a missing customer in the sync
 * schema for historical references, so application user rows may still point
 * at that ID. Only a confirmed missing/deleted customer is replaced here.
 * Authentication, permission, network, and other Stripe failures remain
 * errors instead of being mistaken for stale data.
 */
export async function ensureStripeCustomer(
  stripe: StripeCustomerApi,
  customerId: string | null | undefined,
  createParams: { email?: string; metadata?: Record<string, string> },
): Promise<{ id: string; created: boolean }> {
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        return { id: customer.id, created: false };
      }
    } catch (error) {
      if (!isStripeResourceMissingError(error)) {
        throw error;
      }
    }
  }

  const customer = await stripe.customers.create(createParams);
  return { id: customer.id, created: true };
}

/**
 * Create the default PostgreSQL-backed customer store.
 *
 * The transaction-scoped advisory lock and the customer read/write share the
 * same connection, so overlapping requests converge even across app
 * processes. The store abstraction keeps the repair helper deterministic in
 * unit tests.
 */
export function createStripeCustomerStore(
  database: StripeCustomerDatabase = db,
): StripeCustomerStore {
  return {
    withUserLock: (userId, operation) =>
      withStripeCustomerUserLock(database, userId, async (tx) => {
        return operation({
          getCustomerId: async () => {
            const [user] = await tx
              .select({ stripeCustomerId: users.stripeCustomerId })
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);
            return user?.stripeCustomerId;
          },
          setCustomerId: async (customerId) => {
            await tx
              .update(users)
              .set({ stripeCustomerId: customerId })
              .where(eq(users.id, userId));
          },
        });
      }),
  };
}

/**
 * Ensure a user's Stripe customer and local pointer are created as one
 * serialized operation.
 */
export async function ensureStripeCustomerForUser(
  stripe: StripeCustomerApi,
  store: StripeCustomerStore,
  userId: string,
  createParams: { email?: string; metadata?: Record<string, string> },
  fallbackCustomerId?: string | null,
): Promise<{ id: string; created: boolean }> {
  return store.withUserLock(userId, async ({ getCustomerId, setCustomerId }) => {
    const storedCustomerId = await getCustomerId();
    const customer = await ensureStripeCustomer(
      stripe,
      storedCustomerId ?? fallbackCustomerId,
      createParams,
    );

    if (customer.created) {
      await setCustomerId(customer.id);
    }

    return customer;
  });
}

/**
 * Clean up local records that the Stripe sync package otherwise keeps
 * retrying on every startup.
 *
 * This deliberately runs before syncBackfill:
 * - findOrCreateManagedWebhook logs a warning for every deleted endpoint it
 *   finds in the local table before creating a replacement.
 * - syncPaymentMethods reads local non-deleted customers, so a deleted Stripe
 *   customer can abort the rest of the backfill.
 *
 * Only confirmed 404/resource_missing responses are repaired. Any other
 * Stripe error is thrown so a bad key, permission failure, or outage remains
 * visible in startup health signals.
 */
export async function reconcileStripeStartupState(
  stripeSync: StripeStartupSync,
): Promise<{ removedWebhookRecords: number; markedDeletedCustomers: number }> {
  let removedWebhookRecords = 0;
  for (const managedWebhook of await stripeSync.listManagedWebhooks()) {
    try {
      await stripeSync.stripe.webhookEndpoints.retrieve(managedWebhook.id);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) {
        throw new Error(
          `Stripe webhook reconciliation failed for ${managedWebhook.id}: ${stripeErrorMessage(error)}`,
          { cause: error },
        );
      }

      await stripeSync.postgresClient.delete('_managed_webhooks', managedWebhook.id);
      removedWebhookRecords++;
    }
  }

  const customerResult = await stripeSync.postgresClient.query(`
    SELECT id
    FROM "stripe"."customers"
    WHERE COALESCE(deleted, false) = false
  `);
  if (customerResult.rows.length === 0) {
    return { removedWebhookRecords, markedDeletedCustomers: 0 };
  }

  const accountId = await stripeSync.getAccountId();
  let markedDeletedCustomers = 0;
  for (const customer of customerResult.rows) {
    try {
      const stripeCustomer = await stripeSync.stripe.customers.retrieve(customer.id);
      if (!stripeCustomer.deleted) continue;

      await stripeSync.upsertCustomers(
        [{ id: customer.id, object: 'customer', deleted: true }],
        accountId,
      );
      markedDeletedCustomers++;
    } catch (error) {
      if (!isStripeResourceMissingError(error)) {
        throw new Error(
          `Stripe customer reconciliation failed for ${customer.id}: ${stripeErrorMessage(error)}`,
          { cause: error },
        );
      }

      // Keep the row for historical references, but exclude it from the
      // payment-method scan performed by stripe-replit-sync.
      await stripeSync.upsertCustomers(
        [{ id: customer.id, object: 'customer', deleted: true }],
        accountId,
      );
      markedDeletedCustomers++;
    }
  }

  return { removedWebhookRecords, markedDeletedCustomers };
}

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
