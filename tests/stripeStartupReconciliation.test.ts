import assert from 'node:assert/strict';
import test from 'node:test';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  createStripeCustomerStore,
  ensureStripeCustomer,
  ensureStripeCustomerForUser,
  reconcileStripeStartupState,
  type StripeCustomerDatabase,
} from '../server/stripeClient';
import { StripeService } from '../server/stripeService';
import { createDisposablePostgres } from './disposablePostgres';

function missingStripeResourceError() {
  return Object.assign(new Error('No such resource'), {
    code: 'resource_missing',
    statusCode: 404,
  });
}

function buildSync(overrides: Record<string, unknown> = {}) {
  const deletedWebhooks: string[] = [];
  const deletedCustomers: string[] = [];
  const activeCustomers = new Set(['cus_active']);

  const sync = {
    stripe: {
      webhookEndpoints: {
        retrieve: async (id: string) => {
          if (id === 'we_deleted') throw missingStripeResourceError();
          return { id, status: 'enabled' };
        },
      },
      customers: {
        retrieve: async (id: string) => {
          if (id === 'cus_missing') throw missingStripeResourceError();
          if (id === 'cus_deleted') return { id, object: 'customer', deleted: true };
          return { id, object: 'customer', deleted: false };
        },
      },
    },
    listManagedWebhooks: async () => [{ id: 'we_deleted' }, { id: 'we_active' }],
    getAccountId: async () => 'acct_test',
    upsertCustomers: async (customers: Array<{ id: string; deleted: boolean }>) => {
      for (const customer of customers) {
        if (customer.deleted) deletedCustomers.push(customer.id);
      }
    },
    postgresClient: {
      delete: async (_table: string, id: string) => {
        deletedWebhooks.push(id);
        return true;
      },
      query: async () => ({
        rows: [{ id: 'cus_active' }, { id: 'cus_deleted' }, { id: 'cus_missing' }],
      }),
    },
    ...overrides,
  };

  return { sync, deletedWebhooks, deletedCustomers, activeCustomers };
}

test('reconciles deleted webhooks and customers without touching active records', async () => {
  const { sync, deletedWebhooks, deletedCustomers } = buildSync();

  const result = await reconcileStripeStartupState(sync);

  assert.deepEqual(result, {
    removedWebhookRecords: 1,
    markedDeletedCustomers: 2,
  });
  assert.deepEqual(deletedWebhooks, ['we_deleted']);
  assert.deepEqual(deletedCustomers, ['cus_deleted', 'cus_missing']);
});

test('keeps real Stripe failures actionable', async () => {
  const error = Object.assign(new Error('Invalid API key'), {
    code: 'authentication_error',
    statusCode: 401,
  });
  const { sync } = buildSync({
    stripe: {
      webhookEndpoints: {
        retrieve: async () => {
          throw error;
        },
      },
      customers: {
        retrieve: async (id: string) => ({ id, deleted: false }),
      },
    },
  });

  await assert.rejects(
    reconcileStripeStartupState(sync),
    /Stripe webhook reconciliation failed for we_deleted: Invalid API key/,
  );
});

test('concurrent checkout and billing-portal customer replacement attempts converge', async () => {
  let storedCustomerId: string | null = null;
  let createdCount = 0;
  let lockTail = Promise.resolve();

  const store = {
    withUserLock: async (
      _userId: string,
      operation: (store: {
        getCustomerId: () => Promise<string | null>;
        setCustomerId: (customerId: string) => Promise<void>;
      }) => Promise<{ id: string; created: boolean }>,
    ) => {
      const previous = lockTail;
      let release!: () => void;
      lockTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      try {
        return await operation({
          getCustomerId: async () => storedCustomerId,
          setCustomerId: async (customerId) => {
            storedCustomerId = customerId;
          },
        });
      } finally {
        release();
      }
    },
  };

  const stripe = {
    customers: {
      retrieve: async (id: string) => {
        if (id === 'cus_stale') throw missingStripeResourceError();
        return { id, deleted: false };
      },
      create: async () => {
        createdCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { id: 'cus_winner' };
      },
    },
  };

  const [checkoutCustomer, portalCustomer] = await Promise.all([
    ensureStripeCustomerForUser(
      stripe,
      store,
      'user-overlap',
      { email: 'survivor@example.com', metadata: { userId: 'user-overlap' } },
      'cus_stale',
    ),
    ensureStripeCustomerForUser(
      stripe,
      store,
      'user-overlap',
      { email: 'survivor@example.com', metadata: { userId: 'user-overlap' } },
      'cus_stale',
    ),
  ]);

  assert.equal(createdCount, 1);
  assert.equal(storedCustomerId, 'cus_winner');
  assert.deepEqual(checkoutCustomer, { id: 'cus_winner', created: true });
  assert.deepEqual(portalCustomer, { id: 'cus_winner', created: false });
});

test('serializes overlapping subscription and one-time checkout repairs', async () => {
  let storedCustomerId: string | null = 'cus_quarantined';
  let createdCount = 0;
  let lockTail = Promise.resolve();

  const store = {
    withUserLock: async (
      _userId: string,
      operation: (store: {
        getCustomerId: () => Promise<string | null>;
        setCustomerId: (customerId: string) => Promise<void>;
      }) => Promise<{ id: string; created: boolean }>,
    ) => {
      const previous = lockTail;
      let release!: () => void;
      lockTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      try {
        return await operation({
          getCustomerId: async () => storedCustomerId,
          setCustomerId: async (customerId) => {
            storedCustomerId = customerId;
          },
        });
      } finally {
        release();
      }
    },
  };

  const stripe = {
    customers: {
      retrieve: async (id: string) => {
        if (id === 'cus_quarantined') throw missingStripeResourceError();
        return { id, deleted: false };
      },
      create: async () => {
        createdCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { id: 'cus_replacement' };
      },
    },
  };

  const [subscriptionRepair, oneTimeRepair] = await Promise.all([
    ensureStripeCustomerForUser(
      stripe,
      store,
      'user-overlap',
      { email: 'survivor@example.com', metadata: { flow: 'subscription' } },
      'cus_quarantined',
    ),
    ensureStripeCustomerForUser(
      stripe,
      store,
      'user-overlap',
      { email: 'survivor@example.com', metadata: { flow: 'one_time' } },
      'cus_quarantined',
    ),
  ]);

  assert.equal(createdCount, 1);
  assert.equal(storedCustomerId, 'cus_replacement');
  assert.deepEqual(subscriptionRepair, { id: 'cus_replacement', created: true });
  assert.deepEqual(oneTimeRepair, { id: 'cus_replacement', created: false });
});

if (process.env.STRIPE_CUSTOMER_DB === '1') {
  test('serializes customer repairs on a real connection and releases rolled-back locks', { timeout: 120_000 }, async () => {
    const disposableDatabase = await createDisposablePostgres();
    const database = drizzle(disposableDatabase.pool) as unknown as StripeCustomerDatabase;
    const store = createStripeCustomerStore(database);
    const overlapUserId = `stripe-customer-db-${process.pid}-overlap`;
    const rollbackUserId = `stripe-customer-db-${process.pid}-rollback`;

    try {
      await disposableDatabase.pool.query(`
        CREATE TABLE users (
          id varchar PRIMARY KEY,
          stripe_customer_id text
        )
      `);
      await disposableDatabase.pool.query(
        'INSERT INTO users (id, stripe_customer_id) VALUES ($1, NULL), ($2, NULL)',
        [overlapUserId, rollbackUserId],
      );

      let createCalls = 0;
      let signalCreateStarted!: () => void;
      let releaseCreate!: () => void;
      const createStarted = new Promise<void>((resolve) => {
        signalCreateStarted = resolve;
      });
      const createMayFinish = new Promise<void>((resolve) => {
        releaseCreate = resolve;
      });
      const stripe = {
        customers: {
          retrieve: async (id: string) => {
            if (id === 'cus_stale') throw missingStripeResourceError();
            return { id, deleted: false };
          },
          create: async () => {
            createCalls++;
            signalCreateStarted();
            await createMayFinish;
            return { id: 'cus_db_winner' };
          },
        },
      };

      const concurrentRepairs = [
        ensureStripeCustomerForUser(
          stripe,
          store,
          overlapUserId,
          { email: 'survivor@example.com', metadata: { flow: 'subscription' } },
          'cus_stale',
        ),
        ensureStripeCustomerForUser(
          stripe,
          store,
          overlapUserId,
          { email: 'survivor@example.com', metadata: { flow: 'one_time' } },
          'cus_stale',
        ),
      ];
      await createStarted;
      releaseCreate();

      const [firstRepair, secondRepair] = await Promise.all(concurrentRepairs);
      assert.equal(createCalls, 1);
      assert.deepEqual(
        [firstRepair, secondRepair].map(({ id, created }) => ({ id, created })),
        [
          { id: 'cus_db_winner', created: true },
          { id: 'cus_db_winner', created: false },
        ],
      );

      const persistedWinner = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [overlapUserId],
      );
      assert.deepEqual(persistedWinner.rows, [{ stripe_customer_id: 'cus_db_winner' }]);

      const rollbackError = new Error('simulate failed persistence');
      await assert.rejects(
        store.withUserLock(rollbackUserId, async ({ setCustomerId }) => {
          await setCustomerId('cus_should_rollback');
          throw rollbackError;
        }),
        rollbackError,
      );

      const rolledBack = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [rollbackUserId],
      );
      assert.deepEqual(rolledBack.rows, [{ stripe_customer_id: null }]);

      const recoveryStripe = {
        customers: {
          retrieve: async (id: string) => ({ id, deleted: false }),
          create: async () => ({ id: 'cus_after_rollback' }),
        },
      };
      const afterRollback = await ensureStripeCustomerForUser(
        recoveryStripe,
        store,
        rollbackUserId,
        { email: 'survivor@example.com', metadata: { flow: 'retry' } },
      );
      assert.deepEqual(afterRollback, { id: 'cus_after_rollback', created: true });

      const persistedAfterRollback = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [rollbackUserId],
      );
      assert.deepEqual(
        persistedAfterRollback.rows,
        [{ stripe_customer_id: 'cus_after_rollback' }],
      );
    } finally {
      await disposableDatabase.stop();
    }
  });
}

if (process.env.STRIPE_CUSTOMER_DB === '1') {
  test('main billing customer repairs share the real customer lock and release it after failure', { timeout: 120_000 }, async () => {
    const disposableDatabase = await createDisposablePostgres();
    const database = drizzle(disposableDatabase.pool) as unknown as StripeCustomerDatabase;
    const overlapUserId = `stripe-service-db-${process.pid}-overlap`;
    const retryUserId = `stripe-service-db-${process.pid}-retry`;
    const staleSubscriptionUserId = `stripe-service-db-${process.pid}-stale-subscription`;

    try {
      await disposableDatabase.pool.query(`
        CREATE TABLE users (
          id varchar PRIMARY KEY,
          stripe_customer_id text,
          stripe_subscription_id text,
          subscription_status text
        )
      `);
      await disposableDatabase.pool.query(
        `INSERT INTO users (
          id,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status
        ) VALUES
          ($1, NULL, NULL, NULL),
          ($2, NULL, NULL, NULL),
          ($3, 'cus_missing', 'sub_stale', 'active')`,
        [overlapUserId, retryUserId, staleSubscriptionUserId],
      );

      let createCalls = 0;
      let signalCreateStarted!: () => void;
      let releaseCreate!: () => void;
      const createStarted = new Promise<void>((resolve) => {
        signalCreateStarted = resolve;
      });
      const createMayFinish = new Promise<void>((resolve) => {
        releaseCreate = resolve;
      });
      const stripe = {
        customers: {
          retrieve: async (id: string) => {
            if (id === 'cus_stale') throw missingStripeResourceError();
            return { id, deleted: false };
          },
          create: async () => {
            createCalls++;
            signalCreateStarted();
            await createMayFinish;
            return { id: 'cus_main_billing_winner' };
          },
        },
      };
      const service = new StripeService(database, async () => stripe as any);

      const concurrentRepairs = [
        service.getOrCreateCustomer('cus_stale', 'survivor@example.com', overlapUserId),
        service.getOrCreateCustomer('cus_stale', 'survivor@example.com', overlapUserId),
      ];
      await createStarted;
      releaseCreate();

      const [firstRepair, secondRepair] = await Promise.all(concurrentRepairs);
      assert.equal(createCalls, 1);
      assert.deepEqual(
        [firstRepair, secondRepair].map(({ id, created }) => ({ id, created })),
        [
          { id: 'cus_main_billing_winner', created: true },
          { id: 'cus_main_billing_winner', created: false },
        ],
      );

      const persistedWinner = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [overlapUserId],
      );
      assert.deepEqual(persistedWinner.rows, [{
        stripe_customer_id: 'cus_main_billing_winner',
      }]);

      const failedTransaction = new Error('simulate failed Stripe create');
      let retryCreateCalls = 0;
      const retryStripe = {
        customers: {
          retrieve: async (id: string) => ({ id, deleted: false }),
          create: async () => {
            retryCreateCalls++;
            if (retryCreateCalls === 1) throw failedTransaction;
            return { id: 'cus_after_main_billing_failure' };
          },
        },
      };
      const retryService = new StripeService(database, async () => retryStripe as any);

      await assert.rejects(
        retryService.getOrCreateCustomer(null, 'survivor@example.com', retryUserId),
        failedTransaction,
      );
      const afterFailure = await retryService.getOrCreateCustomer(
        null,
        'survivor@example.com',
        retryUserId,
      );

      assert.deepEqual(afterFailure, {
        id: 'cus_after_main_billing_failure',
        created: true,
      });
      assert.equal(retryCreateCalls, 2);
      const persistedAfterRetry = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [retryUserId],
      );
      assert.deepEqual(persistedAfterRetry.rows, [{
        stripe_customer_id: 'cus_after_main_billing_failure',
      }]);

      const repairCalls: string[] = [];
      const repairStripe = {
        customers: {
          retrieve: async (id: string) => {
            if (id === 'cus_missing') throw missingStripeResourceError();
            return { id, deleted: false };
          },
          create: async () => ({ id: 'cus_repaired' }),
        },
      };
      const repairService = new StripeService(database, async () => repairStripe as any);
      repairService.createCheckoutSession = async (customerId) => {
        repairCalls.push(customerId);
        if (repairCalls.length === 1) throw missingStripeResourceError();
        return { id: 'cs_repaired' } as any;
      };

      const repairedSession = await repairService.createCheckoutSessionWithCustomerRecovery(
        staleSubscriptionUserId,
        'survivor@example.com',
        'cus_missing',
        'price_1',
        '/success',
        '/cancel',
        'subscription',
      );

      assert.deepEqual(repairedSession, { id: 'cs_repaired' });
      assert.deepEqual(repairCalls, ['cus_missing', 'cus_repaired']);
      const repairedUser = await disposableDatabase.pool.query(
        `SELECT stripe_customer_id, stripe_subscription_id, subscription_status
         FROM users
         WHERE id = $1`,
        [staleSubscriptionUserId],
      );
      assert.deepEqual(repairedUser.rows, [{
        stripe_customer_id: 'cus_repaired',
        stripe_subscription_id: null,
        subscription_status: null,
      }]);
    } finally {
      await disposableDatabase.stop();
    }
  });
}

test('rejects disposable database URL aliases before opening a connection', async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalRecoveryTestDatabaseUrl = process.env.RECOVERY_TEST_DATABASE_URL;
  const developmentDatabaseUrl = 'postgresql://development:secret@dev.example.test:5432/recovery';
  const aliases = [
    'postgresql://test:other-secret@DEV.EXAMPLE.TEST/recovery',
    'postgres://test:other-secret@dev.example.test:5432/recovery',
  ];

  try {
    process.env.DATABASE_URL = developmentDatabaseUrl;

    for (const alias of aliases) {
      process.env.RECOVERY_TEST_DATABASE_URL = alias;
      await assert.rejects(
        createDisposablePostgres(),
        /RECOVERY_TEST_DATABASE_URL must not be the development DATABASE_URL/,
      );
    }
  } finally {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalRecoveryTestDatabaseUrl === undefined) {
      delete process.env.RECOVERY_TEST_DATABASE_URL;
    } else {
      process.env.RECOVERY_TEST_DATABASE_URL = originalRecoveryTestDatabaseUrl;
    }
  }
});

test('repairs a quarantined customer before subscription and recovery purchase checkout', async () => {
  const { sync, deletedCustomers } = buildSync();
  const createdCustomers: Array<{ email?: string; metadata?: Record<string, string> }> = [];
  const checkoutModes: string[] = [];
  const portalCustomers: string[] = [];

  await reconcileStripeStartupState(sync);
  assert.deepEqual(deletedCustomers, ['cus_deleted', 'cus_missing']);

  const stripe = {
    customers: {
      retrieve: async (id: string) => {
        if (id === 'cus_missing') throw missingStripeResourceError();
        return { id, deleted: false };
      },
      create: async (params: { email?: string; metadata?: Record<string, string> }) => {
        createdCustomers.push(params);
        return { id: 'cus_repaired' };
      },
    },
    checkout: {
      sessions: {
        create: async (params: { customer: string; mode: string }) => {
          checkoutModes.push(`${params.mode}:${params.customer}`);
          return { id: `cs_${params.mode}` };
        },
      },
    },
    billingPortal: {
      sessions: {
        create: async (params: { customer: string; return_url: string }) => {
          portalCustomers.push(`${params.customer}:${params.return_url}`);
          return { id: 'bps_repaired' };
        },
      },
    },
  };

  const repaired = await ensureStripeCustomer(
    stripe,
    'cus_missing',
    { email: 'survivor@example.com', metadata: { userId: 'user_1' } },
  );
  assert.deepEqual(repaired, { id: 'cus_repaired', created: true });
  assert.deepEqual(createdCustomers, [{
    email: 'survivor@example.com',
    metadata: { userId: 'user_1' },
  }]);

  // These represent the two application checkout modes that must continue
  // using the repaired customer after startup reconciliation.
  await stripe.checkout.sessions.create({
    customer: repaired.id,
    mode: 'subscription',
  });
  await stripe.checkout.sessions.create({
    customer: repaired.id,
    mode: 'payment',
  });
  assert.deepEqual(checkoutModes, [
    'subscription:cus_repaired',
    'payment:cus_repaired',
  ]);

  // Billing portal access must use the repaired customer too; otherwise a
  // customer quarantined during startup reconciliation remains unusable there.
  await stripe.billingPortal.sessions.create({
    customer: repaired.id,
    return_url: 'https://example.com/dashboard',
  });
  assert.deepEqual(portalCustomers, [
    'cus_repaired:https://example.com/dashboard',
  ]);
});

test('does not hide a real Stripe configuration failure while ensuring a customer', async () => {
  const configurationError = Object.assign(new Error('Invalid API key'), {
    code: 'authentication_error',
    statusCode: 401,
  });
  let created = false;
  const stripe = {
    customers: {
      retrieve: async () => {
        throw configurationError;
      },
      create: async () => {
        created = true;
        return { id: 'cus_should_not_exist' };
      },
    },
  };

  await assert.rejects(
    ensureStripeCustomer(stripe, 'cus_existing', { email: 'survivor@example.com' }),
    configurationError,
  );
  assert.equal(created, false);
});