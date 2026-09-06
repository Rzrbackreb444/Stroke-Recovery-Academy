import { db, pool } from '../server/db';
import {
  createStripeCustomerStore,
  ensureStripeCustomerForUser,
} from '../server/stripeClient';

const userId = process.env.STRIPE_CUSTOMER_WORKER_USER_ID;
if (!userId) {
  throw new Error('STRIPE_CUSTOMER_WORKER_USER_ID must be set');
}

function missingStripeResourceError() {
  return Object.assign(new Error('No such Stripe customer'), {
    code: 'resource_missing',
    statusCode: 404,
  });
}

let closeDatabase: (() => Promise<void>) | undefined;

try {
  closeDatabase = () => pool.end();
  const store = createStripeCustomerStore(db);
  const result = await ensureStripeCustomerForUser(
    {
      customers: {
        retrieve: async (id: string) => {
          if (id.startsWith('cus_cross_process_')) {
            return { id, deleted: false };
          }
          throw missingStripeResourceError();
        },
        create: async () => {
          // Keep the critical section open long enough for the other process
          // to contend for the same PostgreSQL advisory lock.
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { id: `cus_cross_process_${process.pid}` };
        },
      },
    },
    store,
    userId,
    {
      email: 'survivor@example.com',
      metadata: { userId },
    },
    'cus_stale',
  );

  process.stdout.write(`STRIPE_CUSTOMER_WORKER_RESULT ${JSON.stringify(result)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Stripe customer worker failed for ${userId}: ${message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase?.();
}