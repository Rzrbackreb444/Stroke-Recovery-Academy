import { getStripeSync } from './stripeClient';
import { pool as dbPool } from './db';
import { recordSasquatchSubscriptionTransition } from './services/sasquatchFunnelService';

export class WebhookHandlers {
  /**
   * Process an inbound Stripe webhook with idempotency protection.
   *
   * Flow:
   *   1. Sanity-check the raw body shape.
   *   2. Best-effort extract the Stripe event id from the JSON body so we can
   *      dedupe replays at the HTTP boundary. This does NOT replace signature
   *      verification — `stripe-replit-sync` re-verifies the signature against
   *      the raw buffer inside `processWebhook`.
   *   3. Insert a row into `webhook_events` (UNIQUE on event_id). On conflict,
   *      we treat the call as a duplicate replay and return without re-running
   *      sync / fulfillment.
   *   4. Hand the raw payload to `stripe-replit-sync` for signature
   *      verification + DB sync.
   *   5. Mark the event row as `processed` (or `failed` on exception).
   */
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // ── 1. Best-effort event-id extraction for dedupe ──────────────────────
    let eventId: string | null = null;
    let eventType: string | null = null;
    let parsedEvent: any = null;
    try {
      parsedEvent = JSON.parse(payload.toString('utf8'));
      if (parsedEvent && typeof parsedEvent.id === 'string') eventId = parsedEvent.id;
      if (parsedEvent && typeof parsedEvent.type === 'string') eventType = parsedEvent.type;
    } catch {
      // If we can't parse, we still hand off to sync — its signature check
      // will fail loudly for bad bodies. Skip the dedupe layer.
    }

    // ── 2. Reserve the event id (UNIQUE constraint enforces idempotency) ──
    //
    // We only treat an event as a "duplicate replay to skip" when we have
    // previously processed it SUCCESSFULLY. If a prior attempt failed (e.g.
    // Stripe is retrying after a transient error on our side), we want to
    // re-run sync — otherwise we'd silently swallow Stripe's retries and
    // never recover from the failure.
    //
    // Strategy: INSERT new row, OR re-arm a previously-failed row to
    // 'received'. If the existing row is already 'processed' or 'received'
    // (in flight from a concurrent worker), skip.
    //
    // Stale-recovery: a row stuck in 'received' for >5min (e.g., the worker
    // crashed between reserve and final status update) is also re-armed for
    // retry — otherwise such rows would be permanently un-retryable.
    let reserved = false;
    if (eventId) {
      try {
        const result = await dbPool.query(
          `INSERT INTO webhook_events (provider, event_id, event_type, status)
           VALUES ('stripe', $1, $2, 'received')
           ON CONFLICT (provider, event_id) DO UPDATE
             SET status = 'received', created_at = NOW()
             WHERE webhook_events.status = 'failed'
                OR (webhook_events.status = 'received'
                    AND webhook_events.created_at < NOW() - INTERVAL '5 minutes')
           RETURNING status, (xmax = 0) AS is_new`,
          [eventId, eventType]
        );
        if (result.rowCount === 0) {
          // Existing row was either 'processed' (real duplicate — skip) or
          // 'received' (a concurrent worker is handling it — skip).
          console.log(`[stripe-webhook] duplicate replay ignored: ${eventId} (${eventType})`);
          return;
        }
        reserved = true;
      } catch (err) {
        // If the dedupe table is unavailable, fall through to processing —
        // we don't want a logging table outage to block payments.
        console.warn('[stripe-webhook] dedupe insert failed, processing anyway:', err);
      }
    }

    // ── 3. Hand off to stripe-replit-sync (verifies signature + syncs DB) ──
    try {
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature, uuid);

      if (reserved && eventId) {
        await dbPool
          .query(
            `UPDATE webhook_events
                SET status = 'processed', processed_at = NOW()
              WHERE provider = 'stripe' AND event_id = $1`,
            [eventId]
          )
          .catch(() => {/* best-effort */});
      }

      // ── 4. Funnel telemetry — fire trial_converted / trial_canceled on
      //      Stripe subscription state transitions for the Sasquatch Premium
      //      product. Best-effort: never throws, never blocks webhook ack.
      //      Idempotency is already enforced by the webhook_events dedupe
      //      layer above (a Stripe replay won't reach this code a second time
      //      because step 2 returns early on a 'processed' row).
      if (eventType === 'customer.subscription.updated' && parsedEvent) {
        try {
          await recordSasquatchSubscriptionTransition(parsedEvent);
        } catch (e) {
          console.warn('[stripe-webhook] funnel transition record failed:', e);
        }
      }

      // ── 4b. MARKETPLACE BOOK ORDERS — when a checkout.session.completed fires
      //       for a bookOrders row (order created in /api/marketplace/checkout),
      //       look it up by sessionId, mark it paid, and call fulfillOrder so
      //       the digital download URL gets written + Lulu print job created.
      if (parsedEvent && eventType === 'checkout.session.completed') {
        try {
          const session: any = (parsedEvent as any).data?.object;
          if (session?.id) {
            const { storage } = await import('./storage');
            const existing = await storage.getBookOrderBySessionId(session.id);
            if (existing && existing.status === 'pending') {
              // Pull Stripe-collected shipping address into the order so Lulu
              // POD fulfillment has the fields it needs.
              const ship = session.shipping_details || session.customer_details || null;
              const addr = ship?.address || null;
              const updates: any = {
                status: 'paid',
                stripePaymentIntentId: session.payment_intent || null,
                paidAt: new Date(),
              };
              if (addr) {
                updates.shippingName = ship?.name || existing.shippingName;
                updates.shippingStreet1 = addr.line1 || existing.shippingStreet1;
                updates.shippingStreet2 = addr.line2 || existing.shippingStreet2;
                updates.shippingCity = addr.city || existing.shippingCity;
                updates.shippingState = addr.state || existing.shippingState;
                updates.shippingPostalCode = addr.postal_code || existing.shippingPostalCode;
                updates.shippingCountry = addr.country || existing.shippingCountry;
                if (session.customer_details?.phone) {
                  updates.shippingPhone = session.customer_details.phone;
                }
              }
              await storage.updateBookOrder(existing.id, updates);
              const { fulfillOrder } = await import('./fulfillmentService');
              const result = await fulfillOrder(existing.id);
              if (!result.success) {
                await storage.updateBookOrder(existing.id, { status: 'fulfillment_failed' });
                console.error('[stripe-webhook] book order fulfillment failed', existing.orderNumber, result.error);
              } else {
                console.log('[stripe-webhook] book order fulfilled', existing.orderNumber);
              }
            }
          }
        } catch (e) {
          console.warn('[stripe-webhook] book-order fulfillment failed:', e);
        }
      }

      // ── 5. Sasquatch Studio subscription state — keep our DB in sync with
      //      Stripe so renewals don't silently flip the user to "inactive"
      //      (and so cancels propagate immediately).
      if (
        parsedEvent &&
        (eventType === 'customer.subscription.created' ||
          eventType === 'customer.subscription.updated' ||
          eventType === 'customer.subscription.deleted' ||
          eventType === 'invoice.paid' ||
          eventType === 'invoice.payment_succeeded')
      ) {
        try {
          const { syncStudioSubscriptionFromStripe } = await import(
            './routes/sasquatchStudioRoutes'
          );
          const obj: any = (parsedEvent as any).data?.object;
          if (eventType.startsWith('invoice.')) {
            // For invoice events, fetch the linked subscription if present.
            const subId = obj?.subscription;
            if (subId) {
              const { getUncachableStripeClient } = await import('./stripeClient');
              const stripe = await getUncachableStripeClient();
              const sub = await stripe.subscriptions.retrieve(subId);
              await syncStudioSubscriptionFromStripe(sub);
            }
          } else {
            await syncStudioSubscriptionFromStripe(obj);
          }
        } catch (e) {
          console.warn('[stripe-webhook] sasq-studio sync failed:', e);
        }
      }
    } catch (err) {
      if (reserved && eventId) {
        await dbPool
          .query(
            `UPDATE webhook_events
                SET status = 'failed', error_message = $2, processed_at = NOW()
              WHERE provider = 'stripe' AND event_id = $1`,
            [eventId, String(err).slice(0, 500)]
          )
          .catch(() => {/* best-effort */});
      }
      throw err;
    }
  }
}
