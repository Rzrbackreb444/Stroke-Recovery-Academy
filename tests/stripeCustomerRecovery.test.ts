import assert from 'node:assert/strict';
import test from 'node:test';
import { RecoveryStripeService } from '../server/recoveryStripeService';
import { StripeService } from '../server/stripeService';

function missingCustomerError() {
  return Object.assign(new Error('No such customer'), {
    code: 'resource_missing',
    statusCode: 404,
  });
}

test('main Stripe checkout retries with the repaired customer after a confirmed missing ID', async () => {
  const service = new StripeService();
  const calls: string[] = [];
  service.ensureCustomer = async () => 'cus_old';
  service.repairCustomer = async (_userId, _email, staleCustomerId) => {
    assert.equal(staleCustomerId, 'cus_old');
    return 'cus_repaired';
  };
  service.createCheckoutSession = async (customerId) => {
    calls.push(customerId);
    if (customerId === 'cus_old') throw missingCustomerError();
    return { url: 'https://checkout.test/repaired' } as any;
  };

  const session = await service.createCheckoutSessionWithCustomerRecovery(
    'user-1',
    'survivor@example.com',
    'cus_old',
    'price_1',
    '/success',
    '/cancel',
  );

  assert.deepEqual(calls, ['cus_old', 'cus_repaired']);
  assert.equal(session.url, 'https://checkout.test/repaired');
});

test('main Stripe customer recovery does not retry actionable non-missing failures', async () => {
  const service = new StripeService();
  let repairs = 0;
  service.ensureCustomer = async () => 'cus_old';
  service.repairCustomer = async () => {
    repairs++;
    return 'cus_repaired';
  };
  const permissionError = Object.assign(new Error('Permission denied'), {
    code: 'permission_denied',
    statusCode: 403,
  });
  service.createCheckoutSession = async () => {
    throw permissionError;
  };

  await assert.rejects(
    service.createCheckoutSessionWithCustomerRecovery(
      'user-1',
      'survivor@example.com',
      'cus_old',
      'price_1',
      '/success',
      '/cancel',
    ),
    permissionError,
  );
  assert.equal(repairs, 0);
});

test('recovery Stripe checkout retries with the repaired customer after a confirmed missing ID', async () => {
  const service = new RecoveryStripeService();
  const calls: string[] = [];
  service.ensureCustomer = async () => 'cus_old';
  service.repairCustomer = async (_userId, _email, staleCustomerId) => {
    assert.equal(staleCustomerId, 'cus_old');
    return 'cus_repaired';
  };

  const session = await service.createCheckoutWithCustomerRecovery(
    'user-1',
    'survivor@example.com',
    'cus_old',
    async (customerId) => {
      calls.push(customerId);
      if (customerId === 'cus_old') throw missingCustomerError();
      return { id: 'cs_repaired' };
    },
  );

  assert.deepEqual(calls, ['cus_old', 'cus_repaired']);
  assert.equal(session.id, 'cs_repaired');
});

test('recovery Stripe checkout leaves transient failures actionable', async () => {
  const service = new RecoveryStripeService();
  let repairs = 0;
  service.ensureCustomer = async () => 'cus_old';
  service.repairCustomer = async () => {
    repairs++;
    return 'cus_repaired';
  };
  const transientError = Object.assign(new Error('Stripe unavailable'), {
    code: 'api_connection_error',
    statusCode: 503,
  });

  await assert.rejects(
    service.createCheckoutWithCustomerRecovery(
      'user-1',
      'survivor@example.com',
      'cus_old',
      async () => {
        throw transientError;
      },
    ),
    transientError,
  );
  assert.equal(repairs, 0);
});

test('recovery customer lookup uses the shared locked customer path', async () => {
  const service = new RecoveryStripeService();
  const calls: Array<{ customerId: string | undefined; email: string; userId: string }> = [];
  service.getOrCreateCustomer = async (customerId, email, userId) => {
    calls.push({ customerId: customerId ?? undefined, email, userId });
    return { id: 'cus_recovery', created: false } as any;
  };

  const customerId = await service.ensureCustomer(
    'user-1',
    'survivor@example.com',
    'cus_existing',
  );

  assert.equal(customerId, 'cus_recovery');
  assert.deepEqual(calls, [{
    customerId: 'cus_existing',
    email: 'survivor@example.com',
    userId: 'user-1',
  }]);
});