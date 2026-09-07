import assert from 'node:assert/strict';
import test from 'node:test';
import { db } from '../server/db';
import { RecoveryStripeService } from '../server/recoveryStripeService';
import { StripeService, stripeService } from '../server/stripeService';
import { registerVoiceCloneRoutes } from '../server/voiceCloneRoutes';

function missingCustomerError() {
  return Object.assign(new Error('No such customer'), {
    code: 'resource_missing',
    statusCode: 404,
  });
}

function captureVoiceCloneCheckoutHandler() {
  let checkoutHandlers: Array<(...args: any[]) => unknown> | undefined;
  const app = {
    post(path: string, ...handlers: Array<(...args: any[]) => unknown>) {
      if (path === '/api/voice-clones/checkout') {
        checkoutHandlers = handlers;
      }
    },
    get() {},
    delete() {},
  };

  registerVoiceCloneRoutes(app as any);
  assert.ok(checkoutHandlers, 'voice-clone checkout route must be registered');
  const handlers = checkoutHandlers;
  return (req: any, res: any) =>
    Promise.resolve(handlers[0](req, res, () => handlers.at(-1)!(req, res)));
}

function createResponse() {
  let statusCode = 200;
  let body: unknown;
  return {
    response: {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(value: unknown) {
        body = value;
        return this;
      },
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
}

function createAuthenticatedCheckoutRequest() {
  return {
    user: {
      claims: { sub: 'user-1', email: 'survivor@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 60,
    },
    body: { mode: 'subscription' },
    protocol: 'https',
    isAuthenticated: () => true,
    get(header: string) {
      assert.equal(header, 'host');
      return 'example.test';
    },
  };
}

function stubVoiceCloneCheckoutDatabase(t: any) {
  const user = {
    id: 'user-1',
    email: 'survivor@example.com',
    stripeCustomerId: 'cus_old',
  };
  const persistedCustomerIds: string[] = [];

  t.mock.method(db as any, 'execute', async () => ({
    rows: [
      { price_id: 'price_voice_sub', feature: 'voice_clone_subscription' },
      { price_id: 'price_voice_clone', feature: 'voice_clone_purchase' },
    ],
  }));
  t.mock.method(db as any, 'select', () => ({
    from: () => ({
      where: () => ({
        limit: async () => [user],
      }),
    }),
  }));
  t.mock.method(db as any, 'update', () => ({
    set: (values: { stripeCustomerId: string }) => ({
      where: () => ({
        returning: async () => {
          persistedCustomerIds.push(values.stripeCustomerId);
          user.stripeCustomerId = values.stripeCustomerId;
          return [{ stripeCustomerId: values.stripeCustomerId }];
        },
      }),
    }),
  }));

  return { user, persistedCustomerIds };
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

test('authenticated voice-clone checkout repairs and persists a customer missing during session creation', async (t) => {
  const { persistedCustomerIds } = stubVoiceCloneCheckoutDatabase(t);
  const service = stripeService;
  const calls: string[] = [];

  t.mock.method(service, 'getOrCreateCustomer', async (customerId: string | null | undefined, email: string, userId: string) => {
    assert.equal(customerId, 'cus_old');
    assert.equal(email, 'survivor@example.com');
    assert.equal(userId, 'user-1');
    persistedCustomerIds.push('cus_repaired');
    return { id: 'cus_repaired', created: true } as any;
  });
  t.mock.method(service, 'createCheckoutSession', async (customerId: string) => {
    calls.push(customerId);
    if (customerId === 'cus_old') throw missingCustomerError();
    return { url: 'https://checkout.test/repaired' } as any;
  });

  const routeHandler = captureVoiceCloneCheckoutHandler();
  const result = createResponse();
  await routeHandler(createAuthenticatedCheckoutRequest(), result.response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { url: 'https://checkout.test/repaired' });
  assert.deepEqual(calls, ['cus_old', 'cus_repaired']);
  assert.deepEqual(persistedCustomerIds, ['cus_repaired']);
});

for (const [label, error] of [
  [
    'permission',
    Object.assign(new Error('Permission denied'), {
      code: 'permission_denied',
      statusCode: 403,
    }),
  ],
  [
    'authentication',
    Object.assign(new Error('Invalid API key'), {
      code: 'authentication_error',
      statusCode: 401,
    }),
  ],
  [
    'transient',
    Object.assign(new Error('Stripe unavailable'), {
      code: 'api_connection_error',
      statusCode: 503,
    }),
  ],
] as const) {
  test(`authenticated voice-clone checkout does not repair or retry ${label} Stripe failures`, async (t) => {
    const { persistedCustomerIds } = stubVoiceCloneCheckoutDatabase(t);
    const service = stripeService;
    const calls: string[] = [];

    t.mock.method(service, 'createCustomer', async () => ({ id: 'cus_repaired' }));
    t.mock.method(service, 'createCheckoutSession', async (customerId: string) => {
      calls.push(customerId);
      throw error;
    });

    const routeHandler = captureVoiceCloneCheckoutHandler();
    const result = createResponse();
    await routeHandler(createAuthenticatedCheckoutRequest(), result.response);

    assert.equal(result.statusCode, 500);
    assert.deepEqual(result.body, { message: 'Checkout failed' });
    assert.deepEqual(calls, ['cus_old']);
    assert.deepEqual(persistedCustomerIds, []);
  });
}

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