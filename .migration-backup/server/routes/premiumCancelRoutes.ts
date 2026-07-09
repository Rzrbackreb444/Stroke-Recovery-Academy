// Cancel & retention flow for Sasquatch Premium.
// Four endpoints consumed by CancelFlowDialog in RecoveryPremium.tsx:
//   GET  /api/sasquatch-premium/cancel/context   — subscription state + save offers
//   POST /api/sasquatch-premium/cancel/reason    — telemetry (never blocks the path)
//   POST /api/sasquatch-premium/retention-offer  — apply pause or discount
//   POST /api/sasquatch-premium/cancel           — cancel at period end (not immediately)
import type { Express } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUserId } from '../lib/authUtils';

const SAVE_OFFERS = ['pause', 'discount'] as const;
type SaveOffer = typeof SAVE_OFFERS[number];

async function getStripe() {
  const { getUncachableStripeClient } = await import('../stripeClient');
  return getUncachableStripeClient();
}

// Get the user's active Stripe subscription, preferring the mirrored DB schema
// for speed. Falls back to Stripe API on any DB error.
async function getActiveSub(stripeCustomerId: string) {
  try {
    const r = await db.execute(sql`
      SELECT id, status, current_period_end, cancel_at_period_end,
             trial_end, metadata
        FROM stripe.subscriptions
       WHERE customer = ${stripeCustomerId}
         AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created DESC
       LIMIT 1
    `);
    const row = (r.rows as any[])[0];
    if (row) return row;
  } catch { /* stripe schema may not exist — fall through */ }

  // Stripe API fallback
  const stripe = await getStripe();
  for (const status of ['active', 'trialing', 'past_due'] as const) {
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status,
      limit: 5,
    });
    if (subs.data.length > 0) return subs.data[0];
  }
  return null;
}

export function registerPremiumCancelRoutes(app: Express, isAuthenticated: any) {
  // ── GET /api/sasquatch-premium/cancel/context ───────────────────────────────
  // Returns subscription state + personalized save offers.
  app.get('/api/sasquatch-premium/cancel/context', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Sign in required' });

      const [u] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!u?.stripeCustomerId) {
        return res.json({ eligible: false });
      }

      const sub = await getActiveSub(u.stripeCustomerId).catch(() => null);
      if (!sub) return res.json({ eligible: false });

      const currentPeriodEnd = sub.current_period_end
        ? new Date(
            typeof sub.current_period_end === 'number'
              ? sub.current_period_end * 1000
              : sub.current_period_end,
          ).toISOString()
        : null;

      const trialEnd = sub.trial_end
        ? new Date(
            typeof sub.trial_end === 'number'
              ? sub.trial_end * 1000
              : sub.trial_end,
          ).toISOString()
        : null;

      const cancelAtPeriodEnd =
        sub.cancel_at_period_end === true || sub.cancel_at_period_end === 'true';

      // Offers: always include pause; include discount only for non-trial subs
      const offers: Array<{ key: SaveOffer; headline: string; detail: string }> = [
        {
          key: 'pause',
          headline: 'Pause for 30 days',
          detail: 'Skip your next billing cycle. Premium stays active until your current period ends — then automatically resumes.',
        },
      ];
      if (!trialEnd) {
        offers.push({
          key: 'discount',
          headline: 'Get 30% off next month',
          detail: 'One-time discount applied immediately. No cancellation — just a lighter bill.',
        });
      }

      return res.json({
        eligible: true,
        status: sub.status,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd,
        offers,
      });
    } catch (err: any) {
      console.error('[cancel/context]', err?.message ?? err);
      res.status(500).json({ message: 'Failed to load subscription context' });
    }
  });

  // ── POST /api/sasquatch-premium/cancel/reason ───────────────────────────────
  // Telemetry only. Never blocks the cancel path — errors are silently ignored.
  app.post('/api/sasquatch-premium/cancel/reason', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        reason:   z.string().trim().max(200).optional(),
        feedback: z.string().trim().max(1000).optional(),
      });
      const { reason, feedback } = schema.parse(req.body);
      if (userId && (reason || feedback)) {
        console.log(JSON.stringify({
          level: 'info', ts: new Date().toISOString(),
          msg: 'premium_cancel_reason', userId, reason, feedback,
        }));
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true }); // never block on telemetry
    }
  });

  // ── POST /api/sasquatch-premium/retention-offer ─────────────────────────────
  // Apply the chosen save offer (pause or discount).
  app.post('/api/sasquatch-premium/retention-offer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Sign in required' });

      const schema = z.object({
        offer:    z.enum(SAVE_OFFERS),
        reason:   z.string().trim().max(200).optional(),
        feedback: z.string().trim().max(1000).optional(),
      });
      const { offer, reason, feedback } = schema.parse(req.body);

      const [u] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!u?.stripeCustomerId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }

      const sub = await getActiveSub(u.stripeCustomerId);
      if (!sub) return res.status(400).json({ message: 'No active subscription found' });

      const stripe = await getStripe();
      const subId: string = sub.id;

      if (offer === 'pause') {
        // pause_collection marks upcoming invoices uncollectable for the period.
        // Resumes automatically when resume_at passes (30 days from now).
        const resumeAt = Math.floor(Date.now() / 1000) + 30 * 86400;
        await stripe.subscriptions.update(subId, {
          pause_collection: { behavior: 'mark_uncollectable', resumes_at: resumeAt },
        });
        console.log(JSON.stringify({
          level: 'info', ts: new Date().toISOString(),
          msg: 'premium_save_pause', userId, reason,
        }));
        return res.json({ ok: true, offer: 'pause' });
      }

      if (offer === 'discount') {
        // Apply a one-time 30% coupon. Create on the fly (Stripe dedupes by name).
        let couponId: string;
        try {
          const existing = await stripe.coupons.retrieve('sra_save_30pct');
          couponId = existing.id;
        } catch {
          const created = await stripe.coupons.create({
            id: 'sra_save_30pct',
            percent_off: 30,
            duration: 'once',
            name: 'SRA Retention — 30% off',
          });
          couponId = created.id;
        }
        await stripe.subscriptions.update(subId, { coupon: couponId });
        console.log(JSON.stringify({
          level: 'info', ts: new Date().toISOString(),
          msg: 'premium_save_discount', userId, reason, feedback,
        }));
        return res.json({ ok: true, offer: 'discount' });
      }

      return res.status(400).json({ message: 'Unknown offer' });
    } catch (err: any) {
      console.error('[retention-offer]', err?.message ?? err);
      res.status(500).json({ message: err?.message ?? 'Failed to apply offer' });
    }
  });

  // ── POST /api/sasquatch-premium/cancel ─────────────────────────────────────
  // Cancel at period end — survivor retains access through the paid period.
  app.post('/api/sasquatch-premium/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Sign in required' });

      const schema = z.object({
        reason:   z.string().trim().max(200).optional(),
        feedback: z.string().trim().max(1000).optional(),
      });
      const { reason, feedback } = schema.parse(req.body);

      const [u] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!u?.stripeCustomerId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }

      const sub = await getActiveSub(u.stripeCustomerId);
      if (!sub) return res.status(400).json({ message: 'No active subscription found' });

      const stripe = await getStripe();
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

      console.log(JSON.stringify({
        level: 'info', ts: new Date().toISOString(),
        msg: 'premium_cancel_at_period_end', userId, reason, feedback,
      }));

      res.json({ ok: true });
    } catch (err: any) {
      console.error('[premium/cancel]', err?.message ?? err);
      res.status(500).json({ message: err?.message ?? 'Failed to cancel subscription' });
    }
  });
}
