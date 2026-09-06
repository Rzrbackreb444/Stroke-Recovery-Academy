import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ensureStripeCustomer,
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

test('repairs a quarantined customer before subscription and recovery purchase checkout', async () => {
  const { sync, deletedCustomers } = buildSync();
  const createdCustomers: Array<{ email?: string; metadata?: Record<string, string> }> = [];
  const checkoutModes: string[] = [];

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