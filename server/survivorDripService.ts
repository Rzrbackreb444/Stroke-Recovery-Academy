// Onboarding email drip — Days 1, 3, 5, 7, 10, 14 post-signup.
// Self-provisions survivor_drip_sends table.
// Idempotent via UNIQUE (user_id, drip_day). Skips opted-out users.
// Day-14 conversion email skipped for users already on a paid plan.
import { db } from './db';
import { sql } from 'drizzle-orm';
import { sendEmail } from './emailService';
import { renderEmail, EMAIL } from './emailTemplate';
import { redactEmail } from './lib/redact';

// ─── Schema provision ─────────────────────────────────────────────────────────

let ready: Promise<void> | null = null;

export async function ensureDripSchema(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survivor_drip_sends (
        id         SERIAL PRIMARY KEY,
        user_id    VARCHAR NOT NULL,
        drip_day   INTEGER NOT NULL,
        sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, drip_day)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_survivor_drip_user
        ON survivor_drip_sends (user_id)
    `);
  })();
  return ready;
}

// ─── Drip schedule ────────────────────────────────────────────────────────────

const DRIP_DAYS = [1, 3, 5, 7, 10, 14];

// ─── Email templates ──────────────────────────────────────────────────────────

const DASHBOARD_URL  = `${EMAIL.site}/recovery/dashboard`;
const PROFILE_URL    = `${EMAIL.site}/recovery/profile`;
const COACH_URL      = `${EMAIL.site}/recovery/sasquatch-coach`;
const PREMIUM_URL    = `${EMAIL.site}/recovery/premium`;
const CHALLENGE_URL  = `${EMAIL.site}/recovery/challenge`;

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function buildDripEmail(day: number, name: string, userId: string, opts?: { isTrial?: boolean }): {
  subject: string;
  html: string;
  text: string;
} | null {
  const n = escapeHtml(name);
  const unsubUrl = `${EMAIL.site}/api/survivor/drip/unsubscribe?uid=${encodeURIComponent(userId)}`;

  if (day === 1) {
    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">Yesterday you showed up. The brain noticed.</p>
      <p class="body-text">Neuroplasticity isn't motivational-poster science — it's documented, peer-reviewed, and it is happening inside your skull right now. Every rep you did rewired a small chain of neurons. That chain is now slightly easier to fire next time.</p>
      <div class="quote-block">
        <div class="quote-text">"The brain that broke is the brain that rebuilds. Same hardware. New wiring. Your job is repetition."</div>
        <div class="quote-attr">— Nick Kremers, 7-year survivor</div>
      </div>
      <p class="body-text">You don't need a perfect day. You need to not do zero. That's the whole game.</p>
      <div class="tip-box">
        <div class="tip-label">Your Only Job Today</div>
        <p class="body-text" style="margin:0;">Log one rep. Any rep — hand exercise, mirror therapy, breathing, a walk to the kitchen. One thing that you showed up for. That's neuroplasticity in action.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${DASHBOARD_URL}">Open My Dashboard</a>
      </div>
      <p class="body-text">Day 1 done. I'm watching.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Yesterday you showed up. The brain noticed.',
      eyebrow: 'DAY 1',
      headline: 'The brain already changed.',
      subheadline: 'One rep. That\'s what started it.',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\nYesterday you showed up. The brain noticed.\n\nNeuroplasticity is real — every rep rewires a small chain of neurons. That chain is now slightly easier to fire next time.\n\nLog one rep today. That's the whole job.\n\nDashboard: ${DASHBOARD_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: 'The brain already changed.', html, text };
  }

  if (day === 3) {
    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">Three days in. You're past the "maybe I'll try this" phase — you're in it now.</p>
      <p class="body-text">Here's what I want you to do today: tell the platform what you're actually dealing with.</p>
      <p class="body-text">Not vague stuff — your actual deficits. Left side weakness. Aphasia. Fatigue. Foot drop. Whatever is in your way. When you fill in your deficit profile, the platform generates a <strong style="color:#FFFFFF;">prescription</strong> — specific exercises, specific reps, for your specific situation.</p>
      <div class="tip-box">
        <div class="tip-label">Two Minutes. Permanent Payoff.</div>
        <p class="body-text" style="margin:0 0 12px;">Your deficit profile unlocks a personalized daily plan — no generic "do these 5 exercises." Your actual next moves, matched to what your brain and body are dealing with right now.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${PROFILE_URL}">Complete My Profile</a>
      </div>
      <p class="body-text">Your prescription is waiting. Two minutes. Go.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Your personalized recovery prescription is waiting.',
      eyebrow: 'DAY 3',
      headline: 'Your prescription is waiting.',
      subheadline: 'Two minutes of profile data unlocks your exact daily plan.',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\nThree days in. Time to tell the platform what you're actually dealing with.\n\nYour deficit profile unlocks a personalized daily plan — specific exercises for your specific deficits.\n\nComplete your profile: ${PROFILE_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: '3 days in — your recovery plan is waiting for you.', html, text };
  }

  if (day === 5) {
    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">Five days. I'm impressed — most people don't make it this far.</p>
      <p class="body-text">I want to introduce you to someone: the Sasquatch Coach. That's me — or a version of me that's available 24/7, knows your deficit profile, and won't sugarcoat the hard days.</p>
      <div class="quote-block">
        <div class="quote-text">"Year one, I had no one who'd been where I was. The Coach exists so you don't have to figure this out alone."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">The Coach knows your stroke type, your deficits, your streak, your energy pattern. Ask it anything — what exercise to do when your left arm is dead-tired, how to explain your recovery to your spouse, what to do on a zero-motivation morning.</p>
      <div class="tip-box">
        <div class="tip-label">Free. Right Now. No Card.</div>
        <p class="body-text" style="margin:0;">Start with 3 free messages — no credit card, no commitment. Just open the chat and say what's on your mind.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${COACH_URL}">Talk to the Coach</a>
      </div>
      <p class="body-text">One conversation. See what it's like to have a training partner who's been there.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Five days in. Someone here has been through exactly what you\'re facing.',
      eyebrow: 'DAY 5',
      headline: 'Your Coach has been waiting.',
      subheadline: 'Someone who\'s been exactly where you are. 24/7. No card.',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\nFive days. Time to meet the Sasquatch Coach — available 24/7, knows your deficits, won't sugarcoat it.\n\nStart with 3 free messages: ${COACH_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: 'There\'s someone here who\'s been through this.', html, text };
  }

  if (day === 7) {
    // trial-specific variant — fired when the runner detects the user is trialing
    if (opts?.isTrial) {
      const PREMIUM_URL = `${BASE_URL}/recovery/premium`;
      const bodyHtml = `
        <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
        <p class="body-text">Your free trial ends today.</p>
        <p class="body-text">You've had 7 days of unlimited Coach, unlimited Recovery Anchors, voice cloning, and the premium Campfire. After midnight, that goes back to the free tier unless you keep it.</p>
        <div class="quote-block">
          <div class="quote-text">"I built Solo because I needed it at year one. Not therapy. Not medical advice. A system that wouldn't let me quit on a bad day."</div>
          <div class="quote-attr">— Nick Kremers</div>
        </div>
        <p class="body-text">Solo is $19/month. That's less than one co-pay, less than one missed PT session. If the last 7 days moved anything — a little function, a little hope, a clearer protocol — keep going.</p>
        <div class="tip-box">
          <div class="tip-label">What you keep with Solo</div>
          <p class="body-text" style="margin:0;">Unlimited Sasquatch Coach · Unlimited Recovery Anchors · Voice Cloning · Never Zero daily report · Premium Campfire + Live sessions with Nick</p>
        </div>
        <div class="cta-block">
          <a class="cta-btn" href="${PREMIUM_URL}">Keep my access — $19/mo</a>
        </div>
        <p class="body-text">If you're not ready — no call, no form. Cancel takes one click and keeps you on free. The reps still count.</p>
        <p class="body-text" style="margin-top:24px;">
          <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
        </p>
      `;
      const html = renderEmail({
        previewText: 'Your free trial ends today. Here\'s what you keep — or don\'t.',
        eyebrow: 'TRIAL ENDS TODAY',
        headline: 'Keep it — or step back to free.',
        subheadline: 'Your call. No calls, no forms. One click either way.',
        bodyHtml,
        showCrisisCallout: true,
        whyReceiving: 'You\'re receiving this because you started a Sasquatch Premium trial.',
        unsubscribeUrl: unsubUrl,
      });
      const text = `Hey ${name},\n\nYour free trial ends today.\n\nSolo is $19/month — unlimited Coach, Anchors, Voice Cloning, premium Campfire.\n\nKeep it: ${PREMIUM_URL}\n\nCancel anytime. No forms. One click.\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
      return { subject: 'Your free trial ends today.', html, text };
    }

    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">Seven days.</p>
      <p class="body-text">In my first year of recovery, the seven-day mark felt like a test I didn't know I was taking. Your nervous system has been working overtime all week — building new pathways, recalibrating, rebuilding systems that used to run on autopilot.</p>
      <div class="quote-block">
        <div class="quote-text">"Day 7 isn't about how far you've come. It's about proving you're the kind of person who shows up when it's hard. That's the whole test."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">The data says: survivors who hit one consistent week are 3x more likely to still be in the game at 90 days. You just hit that threshold.</p>
      <div class="tip-box">
        <div class="tip-label">Next Milestone: 30 Days</div>
        <p class="body-text" style="margin:0;">Your dashboard tracks every rep, streak, and check-in. Look at your arc — where you are and where 30 days of consistency takes you.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${DASHBOARD_URL}">See My Progress</a>
      </div>
      <p class="body-text">Week one. Behind you. Keep going.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Seven days. Here\'s what that means for what comes next.',
      eyebrow: 'DAY 7',
      headline: 'One week. Here\'s what that means.',
      subheadline: 'You just crossed the threshold. The data says what happens next.',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\nSeven days. You crossed the threshold.\n\nSurvivors who hit one consistent week are 3x more likely to still be in the game at 90 days. That's you now.\n\nSee your progress: ${DASHBOARD_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: 'One week. Here\'s the data on what happens next.', html, text };
  }

  if (day === 10) {
    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">There's a question that hits almost every survivor around Day 10. I know it because it hit me.</p>
      <p class="body-text"><em>Is this actually working?</em></p>
      <p class="body-text">Here's the honest answer: you can't feel neuroplasticity happening. The brain doesn't send a status update. You won't feel the new pathways forming. What you feel is fatigue, frustration, and the slow grind of showing up when the results aren't obvious yet.</p>
      <div class="quote-block">
        <div class="quote-text">"The plateau isn't a sign you've stopped improving. It's a sign the work has gotten deep enough to be invisible."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Day 10 is when most people quit. Not because it isn't working. Because they can't see it working yet. Don't be most people.</p>
      <div class="tip-box">
        <div class="tip-label">One Test</div>
        <p class="body-text" style="margin:0;">Go back to the first exercise you logged. Try it again today. Not for performance — just to feel where you are versus where you started. The difference may surprise you.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${DASHBOARD_URL}">Keep Going</a>
      </div>
      <p class="body-text">You're not plateauing. You're building. Don't quit on Day 10.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Day 10. The question every survivor asks — and the honest answer.',
      eyebrow: 'DAY 10',
      headline: 'The question survivors ask at Day 10.',
      subheadline: 'And the honest answer.',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\n"Is this actually working?"\n\nThat's the Day 10 question. The honest answer: you can't feel neuroplasticity happening. But it is. Don't quit on Day 10.\n\n${DASHBOARD_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: 'The question every survivor asks at Day 10.', html, text };
  }

  if (day === 14) {
    const bodyHtml = `
      <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${n},</p>
      <p class="body-text">Two weeks. That's real. That's earned.</p>
      <p class="body-text">Your free access includes the core dashboard, 3 Coach messages per day, and your deficit prescription. You've been using this as a starting point.</p>
      <p class="body-text">Here's what premium unlocks — and why it matters for your recovery:</p>
      <div class="tip-box">
        <div class="tip-label">Sasquatch Premium — $19/mo</div>
        <p class="body-text" style="margin:0 0 10px;"><strong style="color:#FFFFFF;">Unlimited Coach.</strong> No daily cap. Talk to the Coach every time you need it — before a hard PT session, after a bad day, at 2am when the frustration spikes.</p>
        <p class="body-text" style="margin:0 0 10px;"><strong style="color:#FFFFFF;">Voice responses.</strong> The Coach responds in audio — Nick's voice, not text. Harder to ignore when it's talking to you.</p>
        <p class="body-text" style="margin:0 0 10px;"><strong style="color:#FFFFFF;">Recovery Anchors.</strong> AI-generated affirmations built from your deficits, your wins, your language. Specific to you. Not generic.</p>
        <p class="body-text" style="margin:0;"><strong style="color:#FFFFFF;">Accountability pods.</strong> A small group of survivors at your same recovery stage. The community that holds you to your word.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${PREMIUM_URL}">Unlock Premium — $19/mo</a>
        <div style="margin-top:14px;">
          <a class="cta-secondary" href="${CHALLENGE_URL}">Start the 66-Day Challenge</a>
        </div>
      </div>
      <p class="body-text">Cancel any time. No calls, no forms. If Day 14 is where your recovery gets serious, this is how you run it.</p>
      <p class="body-text" style="margin-top:24px;">
        <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</span>
      </p>
    `;
    const html = renderEmail({
      previewText: 'Two weeks earned. Here\'s what\'s waiting on the other side of free.',
      eyebrow: 'DAY 14',
      headline: '14 days. One question.',
      subheadline: 'Is this the week your recovery gets serious?',
      bodyHtml,
      showCrisisCallout: true,
      whyReceiving: 'You\'re receiving this because you signed up at Stroke Recovery Academy.',
      unsubscribeUrl: unsubUrl,
    });
    const text = `Hey ${name},\n\nTwo weeks. Earned.\n\nHere's what premium unlocks: unlimited Coach, voice responses, Recovery Anchors, accountability pods.\n\n$19/mo. Cancel any time.\n\n${PREMIUM_URL}\n\n— Nick Kremers\nFounder, Stroke Recovery Academy\n\nNOT MEDICAL ADVICE. If you're in crisis, call or text 988.`;
    return { subject: '14 days. One question.', html, text };
  }

  return null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runSurvivorDrip(): Promise<void> {
  await ensureDripSchema();

  for (const day of DRIP_DAYS) {
    try {
      // Find all users whose account is exactly ≥ N days old and haven't received this drip.
      // LEFT JOIN notificationPreferences to skip global opt-outs.
      // LEFT JOIN stripe.subscriptions to skip Day 14 for active paying subs.
      const ageQuery = sql`
        SELECT u.id, u.email, u.first_name,
               COALESCE(np.unsubscribed_all, false) AS opted_out
          FROM users u
          LEFT JOIN notification_preferences np ON np.user_id = u.id
         WHERE u.email IS NOT NULL
           AND u.email != ''
           AND u.created_at <= NOW() - (${day} || ' days')::interval
           AND NOT EXISTS (
             SELECT 1 FROM survivor_drip_sends s
              WHERE s.user_id = u.id AND s.drip_day = ${day}
           )
           AND COALESCE(np.unsubscribed_all, false) = false
         LIMIT 100
      `;

      const rows = await db.execute(ageQuery);
      const users = (rows.rows ?? rows) as Array<{
        id: string;
        email: string;
        first_name: string | null;
        opted_out: boolean;
      }>;

      for (const user of users) {
        // Day 14 — skip if already on a paid plan
        if (day === 14) {
          try {
            const subCheck = await db.execute(sql`
              SELECT 1 FROM stripe.subscriptions
               WHERE customer IN (
                 SELECT stripe_customer_id FROM users WHERE id = ${user.id} LIMIT 1
               )
                 AND status IN ('active', 'trialing')
               LIMIT 1
            `);
            if ((subCheck.rows?.length ?? 0) > 0) {
              // Already paid — record send as skipped so we don't retry
              await db.execute(sql`
                INSERT INTO survivor_drip_sends (user_id, drip_day)
                VALUES (${user.id}, ${day})
                ON CONFLICT DO NOTHING
              `);
              continue;
            }
          } catch { /* stripe schema not available — send anyway */ }
        }

        const name = user.first_name ? user.first_name.split(' ')[0] : 'Warrior';

        // For Day 7: detect if user is trialing so we send the conversion variant
        let isTrial = false;
        if (day === 7) {
          try {
            const trialCheck = await db.execute(sql`
              SELECT 1 FROM sasquatch_premium_subscriptions
               WHERE user_id = ${user.id}
                 AND status = 'trialing'
                 AND cancel_at_period_end = false
               LIMIT 1
            `);
            isTrial = (trialCheck.rows?.length ?? 0) > 0;
          } catch { /* table may not exist yet */ }
        }

        const email = buildDripEmail(day, name, user.id, { isTrial });
        if (!email) continue;

        try {
          // Claim the send slot atomically before sending to prevent double-send
          const claim = await db.execute(sql`
            INSERT INTO survivor_drip_sends (user_id, drip_day)
            VALUES (${user.id}, ${day})
            ON CONFLICT DO NOTHING
            RETURNING id
          `);
          const claimRows = claim.rows ?? (claim as any);
          if (!claimRows || claimRows.length === 0) continue; // already sent by a concurrent run

          await sendEmail({ to: user.email, subject: email.subject, html: email.html, text: email.text });
          console.log(`[survivor-drip] day=${day} sent to ${redactEmail(user.email)}`);
        } catch (err: any) {
          // Remove the claimed row so the next run can retry
          await db.execute(sql`
            DELETE FROM survivor_drip_sends WHERE user_id = ${user.id} AND drip_day = ${day}
          `).catch(() => null);
          console.error(`[survivor-drip] day=${day} failed for ${redactEmail(user.email)}:`, err?.message ?? err);
        }
      }
    } catch (err: any) {
      console.error(`[survivor-drip] day=${day} run error:`, err?.message ?? err);
    }
  }
}
