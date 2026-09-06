import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ensureStripeCustomer,
  ensureStripeCustomerForUser,
  reconcileStripeStartupState,
} from '../server/stripeClient';

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