import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileStripeStartupState } from '../server/stripeClient';

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