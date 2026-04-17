import { sendEmail } from './emailService';
import { renderEmail, EMAIL } from './emailTemplate';

const CHALLENGE_URL = `${EMAIL.site}/recovery/challenge`;
const BLOG_URL = `${EMAIL.site}/recovery/blog/never-zero-philosophy`;
const COMMUNITY_URL = `${EMAIL.site}/recovery/community`;
const DASHBOARD_URL = `${EMAIL.site}/recovery/dashboard`;

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
  const name = firstName ? firstName.split(' ')[0] : 'Friend';

  const bodyHtml = `
    <p class="body-text" style="font-size:18px;color:#FFFFFF;">Hey ${escapeHtml(name)},</p>

    <p class="body-text">I'm Nick Kremers — stroke survivor, father, and founder of Stroke Recovery Academy.
    On <strong>December 3, 2018</strong>, at 36 years old, I had a massive hemorrhagic stroke that left me with
    0% function on my left side. The doctors managed expectations.</p>

    <p class="body-text">Today I'm at 90%+ and still climbing. Not because I found a miracle. Because I refused
    to do zero. Every. Single. Day.</p>

    <div class="quote-block">
      <div class="quote-text">"Never Zero isn't just a workout principle. It's a statement about who you are.
      You are someone who does not quit. Not even on bad days."</div>
      <div class="quote-attr">— Nick Kremers</div>
    </div>

    <p class="body-text">You just joined a community of real survivors who are doing the work — checking in
    daily, tracking habits, and proving recovery doesn't have an expiration date.</p>

    <hr class="divider" />

    <div class="tip-box">
      <div class="tip-label">Your First 3 Steps</div>
      <p class="body-text" style="margin:0 0 14px;">
        <strong>1 — Set up your dashboard.</strong>
        <a href="${DASHBOARD_URL}">Track your check-ins, streaks, and daily habits.</a>
      </p>
      <p class="body-text" style="margin:0 0 14px;">
        <strong>2 — Read the Never Zero Philosophy.</strong>
        <a href="${BLOG_URL}">8 minutes. The single most important mindset shift in recovery.</a>
      </p>
      <p class="body-text" style="margin:0;">
        <strong>3 — Start the 66-Day Challenge (free for 7 days).</strong>
        Daily missions, accountability, and a community that holds you to your word.
      </p>
    </div>

    <div class="cta-block">
      <a class="cta-btn" href="${CHALLENGE_URL}">Start My Free 7-Day Trial</a>
      <div style="margin-top:14px;">
        <a class="cta-secondary" href="${BLOG_URL}">Read: Never Zero</a>
        <a class="cta-secondary" href="${COMMUNITY_URL}">Join the Community</a>
      </div>
    </div>

    <p class="body-text">This is your recovery. I'm here to help you run it.</p>

    <p class="body-text" style="margin-top:24px;">
      <strong style="color:#FFFFFF;">Nick Kremers</strong><br/>
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${EMAIL.muted};letter-spacing:1px;">
        STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY
      </span><br/>
      <span style="font-size:13px;color:${EMAIL.muted};">
        Author of <em>The Stroked Out Sasquatch</em> and <em>The Ultimate Stroke Recovery Revolution</em>
      </span>
    </p>
  `;

  const html = renderEmail({
    previewText: `Hey ${name} — welcome to the Sasquatch Recovery Family. Here's where to start.`,
    eyebrow: 'WELCOME',
    headline: `Welcome to the Sasquatch Recovery Family.`,
    subheadline: 'You just joined survivors and caregivers who refuse to settle for "good enough."',
    showBeforeAfter: true,
    bodyHtml,
    whyReceiving: "You're receiving this because you created an account at Stroke Recovery Academy.",
    unsubscribeUrl: `${EMAIL.site}/recovery/dashboard`,
  });

  const text = `
Welcome to Stroke Recovery Academy, ${name}!

I'm Nick Kremers — stroke survivor, founder of Stroke Recovery Academy.
On December 3, 2018 a massive hemorrhagic stroke left me with 0% function on my left side.
Today I'm at 90%+ — because I refused to do zero. Every day.

YOUR FIRST 3 STEPS:
1. Set up your dashboard: ${DASHBOARD_URL}
2. Read the Never Zero Philosophy: ${BLOG_URL}
3. Start the 66-Day Challenge (7-day free trial): ${CHALLENGE_URL}

— Nick Kremers
Founder, Stroke Recovery Academy

—
NOT MEDICAL ADVICE. Content is for informational and motivational purposes only.
Always consult your physician, neurologist, or licensed therapist before starting any rehabilitation program.
If you're in crisis, call or text 988 (U.S. Suicide & Crisis Lifeline). Emergency: 911.
  `.trim();

  try {
    await sendEmail({
      to: email,
      subject: `Welcome to Stroke Recovery Academy — Nick here, let's talk.`,
      html,
      text,
    });
    console.log(`[welcome email] sent to ${email}`);
  } catch (err) {
    console.error(`[welcome email] failed for ${email}:`, err);
  }
}

export async function sendOtpEmail(email: string, otp: string, firstName?: string): Promise<void> {
  const name = firstName ? firstName.split(' ')[0] : 'there';

  const bodyHtml = `
    <p class="body-text" style="text-align:center;">Hey ${escapeHtml(name)} — here's your one-time sign-in code.</p>
    <div style="background:#0D0D0D;border:2px solid ${EMAIL.gold};border-radius:8px;padding:28px;margin:28px 0;text-align:center;">
      <div style="font-size:48px;font-weight:bold;color:${EMAIL.gold};letter-spacing:12px;font-family:'Courier New',monospace;">${escapeHtml(otp)}</div>
      <p style="font-size:12px;color:${EMAIL.muted};margin-top:14px;margin-bottom:0;font-family:Arial,Helvetica,sans-serif;">Expires in 10 minutes. Do not share this code.</p>
    </div>
    <p class="body-text" style="text-align:center;font-size:13px;color:${EMAIL.muted};">
      If you didn't request this, ignore this email — your account is safe.
    </p>
  `;

  const html = renderEmail({
    previewText: `Your sign-in code: ${otp} (expires in 10 minutes)`,
    eyebrow: 'SIGN-IN CODE',
    headline: 'Your one-time code',
    bodyHtml,
    whyReceiving: 'You requested a sign-in code for Stroke Recovery Academy.',
    unsubscribeUrl: `${EMAIL.site}/recovery/dashboard`,
  });

  await sendEmail({
    to: email,
    subject: `${otp} — Your Stroke Recovery Academy Sign-In Code`,
    html,
    text: `Your sign-in code: ${otp}\n\nExpires in 10 minutes. Do not share this code.\n\n— Stroke Recovery Academy`,
  });
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
