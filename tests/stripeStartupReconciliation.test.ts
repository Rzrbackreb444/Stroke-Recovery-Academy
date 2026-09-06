import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
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

type StripeCustomerWorkerResult = {
  id: string;
  created: boolean;
};

function runStripeCustomerWorker(
  databaseUrl: string,
  userId: string,
): Promise<StripeCustomerWorkerResult> {
  const workerPath = fileURLToPath(new URL('./stripeCustomerWorker.ts', import.meta.url));
  return new Promise((resolve, reject) => {
    const worker = spawn(process.execPath, ['--import', 'tsx/esm', workerPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        RECOVERY_DURABILITY_DB: '1',
        STRIPE_CUSTOMER_WORKER_USER_ID: userId,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    worker.stdout.on('data', (chunk) => { stdout += String(chunk); });
    worker.stderr.on('data', (chunk) => { stderr += String(chunk); });
    worker.once('error', (error) => {
      reject(new Error(
        `Stripe customer worker could not start for ${userId}: ${error.message}`,
        { cause: error },
      ));
    });
    worker.once('exit', (code, signal) => {
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
      if (code !== 0) {
        reject(new Error(
          `Stripe customer worker for ${userId} exited with ${
            signal ? `signal ${signal}` : `code ${code}`
          }.\n${output || 'The worker produced no diagnostic output.'}`,
        ));
        return;
      }

      const resultLine = stdout
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('STRIPE_CUSTOMER_WORKER_RESULT '));
      if (!resultLine) {
        reject(new Error(
          `Stripe customer worker for ${userId} exited successfully without a result.\n${
            output || 'The worker produced no output.'
          }`,
        ));
        return;
      }

      try {
        resolve(JSON.parse(
          resultLine.slice('STRIPE_CUSTOMER_WORKER_RESULT '.length),
        ) as StripeCustomerWorkerResult);
      } catch (error) {
        reject(new Error(
          `Stripe customer worker for ${userId} returned invalid output: ${resultLine}`,
          { cause: error },
        ));
      }
    });
  });
}

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

  test('serializes customer repairs across independent application processes', { timeout: 120_000 }, async () => {
    const disposableDatabase = await createDisposablePostgres();
    const userId = `stripe-customer-db-${process.pid}-cross-process`;

    try {
      await disposableDatabase.pool.query(`
        CREATE TABLE users (
          id varchar PRIMARY KEY,
          stripe_customer_id text
        )
      `);
      await disposableDatabase.pool.query(
        'INSERT INTO users (id, stripe_customer_id) VALUES ($1, NULL)',
        [userId],
      );

      const workerResults = await Promise.all([
        runStripeCustomerWorker(disposableDatabase.url, userId),
        runStripeCustomerWorker(disposableDatabase.url, userId),
      ]);

      assert.equal(
        workerResults.filter(({ created }) => created).length,
        1,
        'exactly one process must create the Stripe customer',
      );
      assert.notEqual(
        workerResults[0].created,
        workerResults[1].created,
        'exactly one process must observe the persisted customer',
      );
      assert.equal(
        workerResults[0].id,
        workerResults[1].id,
        'both processes must converge on the same Stripe customer',
      );

      const persistedWinner = await disposableDatabase.pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [userId],
      );
      assert.deepEqual(persistedWinner.rows, [{
        stripe_customer_id: workerResults[0].id,
      }]);
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

    try {
      await disposableDatabase.pool.query(`
        CREATE TABLE users (
          id varchar PRIMARY KEY,
          stripe_customer_id text
        )
      `);
      await disposableDatabase.pool.query(
        'INSERT INTO users (id, stripe_customer_id) VALUES ($1, NULL), ($2, NULL)',
        [overlapUserId, retryUserId],
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
    } finally {
      await disposableDatabase.stop();
    }
  });
}

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