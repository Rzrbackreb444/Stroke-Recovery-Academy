import { sendEmail } from './emailService';

const CHALLENGE_URL = 'https://strokerecoveryacademy.com/recovery/challenge';
const BLOG_URL = 'https://strokerecoveryacademy.com/recovery/blog/never-zero-philosophy';
const COMMUNITY_URL = 'https://strokerecoveryacademy.com/recovery/community';
const DASHBOARD_URL = 'https://strokerecoveryacademy.com/recovery/dashboard';

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
  const name = firstName ? firstName.split(' ')[0] : 'Friend';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Stroke Recovery Academy</title>
  <style>
    body { margin: 0; padding: 0; background: #0D0D0D; font-family: 'Georgia', serif; color: #E5E5E5; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #0D0D0D 100%); padding: 40px 40px 32px; border-bottom: 2px solid #C9941A; text-align: center; }
    .logo-text { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #C9941A; margin-bottom: 12px; }
    .header h1 { font-size: 28px; color: #FFFFFF; margin: 0; font-weight: normal; line-height: 1.3; }
    .header h1 span { color: #C9941A; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; color: #FFFFFF; margin-bottom: 20px; }
    p { font-size: 15px; line-height: 1.8; color: #CCCCCC; margin: 0 0 16px; }
    .quote-block { border-left: 3px solid #C9941A; padding: 16px 20px; background: #1a1a1a; margin: 28px 0; border-radius: 0 6px 6px 0; }
    .quote-block p { color: #E5E5E5; font-style: italic; font-size: 16px; margin: 0; }
    .section-title { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #C9941A; margin: 32px 0 12px; }
    .cta-primary { display: block; background: #C9941A; color: #000000 !important; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; letter-spacing: 1px; margin: 24px 0 12px; }
    .cta-secondary { display: block; border: 1px solid #C9941A; color: #C9941A !important; text-decoration: none; text-align: center; padding: 14px 32px; border-radius: 6px; font-size: 14px; margin: 0 0 12px; }
    .highlight-box { background: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 24px; margin: 24px 0; }
    .highlight-box .item { display: flex; align-items: flex-start; margin-bottom: 14px; }
    .highlight-box .bullet { color: #C9941A; font-size: 18px; margin-right: 12px; margin-top: 2px; flex-shrink: 0; }
    .highlight-box .item:last-child { margin-bottom: 0; }
    .sig { margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; }
    .sig p { color: #CCCCCC; font-size: 15px; }
    .sig .name { font-size: 18px; color: #FFFFFF; font-weight: bold; }
    .sig .title { font-size: 12px; color: #888; letter-spacing: 1px; }
    .footer { background: #0D0D0D; padding: 24px 40px; border-top: 1px solid #222; text-align: center; }
    .footer p { font-size: 11px; color: #555; margin: 4px 0; }
    .footer a { color: #777; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">Stroke Recovery Academy</div>
    <h1>Welcome to the<br /><span>Sasquatch Recovery Family</span></h1>
  </div>

  <div class="body">
    <p class="greeting">Hey ${name},</p>

    <p>I'm Nick Kremers — stroke survivor, father, and founder of Stroke Recovery Academy. On December 3, 2018, at 36 years old, I had a massive hemorrhagic stroke that left me with 0% function on my left side.</p>

    <p>Two years later, I was at 90% and coaching youth football again. Not because I found some miracle treatment — but because I refused to do zero. Every single day.</p>

    <div class="quote-block">
      <p>"Never Zero isn't just a workout principle. It's a statement about who you are. You are someone who does not quit. Not even on bad days."</p>
    </div>

    <p>You just joined a community of real stroke survivors who are doing the work — checking in daily, tracking their habits, and proving that recovery doesn't have an expiration date.</p>

    <div class="section-title">Your First 3 Steps</div>
    <div class="highlight-box">
      <div class="item">
        <span class="bullet">1</span>
        <div>
          <strong style="color:#fff;">Set up your dashboard</strong><br />
          <span style="font-size:13px;color:#999;">Track your check-ins, streaks, and daily habits — all in one place.</span>
        </div>
      </div>
      <div class="item">
        <span class="bullet">2</span>
        <div>
          <strong style="color:#fff;">Read the Never Zero Philosophy</strong><br />
          <span style="font-size:13px;color:#999;">The single most important mindset shift in recovery. 8 minutes. Life-changing.</span>
        </div>
      </div>
      <div class="item">
        <span class="bullet">3</span>
        <div>
          <strong style="color:#fff;">Consider the 66-Day Challenge</strong><br />
          <span style="font-size:13px;color:#999;">My structured accountability program — daily missions, coaching, and a community that holds you to your word.</span>
        </div>
      </div>
    </div>

    <div class="section-title">The 66-Day Sasquatch Challenge</div>
    <p>This is the flagship program — built on the science of habit formation and neuroplasticity. 66 days of daily check-ins, habit stacks, and accountability that most stroke survivors never get.</p>
    <p>Starts with a <strong style="color:#fff;">7-day free trial</strong>. No commitment. Cancel anytime. But I think you'll stay — because the streak becomes addictive.</p>

    <a href="${CHALLENGE_URL}" class="cta-primary">START MY FREE 7-DAY TRIAL →</a>
    <a href="${BLOG_URL}" class="cta-secondary">Read: The Never Zero Philosophy</a>
    <a href="${COMMUNITY_URL}" class="cta-secondary">Join the Survivor Community</a>

    <div class="sig">
      <p>This is your recovery. I'm here to help you run it.</p>
      <p class="name">Nick Kremers</p>
      <p class="title">STROKE SURVIVOR · FOUNDER, STROKE RECOVERY ACADEMY</p>
      <p style="font-size:12px;color:#666;margin-top:8px;">Author of <em>The Stroked Out Sasquatch</em> and <em>The Ultimate Stroke Recovery Revolution</em></p>
    </div>
  </div>

  <div class="footer">
    <p>Stroke Recovery Academy · strokerecoveryacademy.com</p>
    <p>You're receiving this because you created an account. <a href="${DASHBOARD_URL}">Manage preferences</a></p>
    <p style="font-size:10px;color:#555;line-height:1.6;margin-top:8px;">
      <strong style="color:#666;">Not medical advice.</strong> Content from Stroke Recovery Academy and Nick Kremers 
      is for motivational and informational purposes only. It is not a substitute for professional medical advice, 
      diagnosis, or treatment. Individual results vary. Always consult your physician, neurologist, or licensed therapist 
      before beginning any rehabilitation program.
    </p>
  </div>
</div>
</body>
</html>
  `.trim();

  const text = `
Welcome to Stroke Recovery Academy, ${name}!

I'm Nick Kremers — stroke survivor, founder of Stroke Recovery Academy. I went from 0% function to 90% through the Never Zero method.

YOUR FIRST 3 STEPS:
1. Set up your dashboard: ${DASHBOARD_URL}
2. Read the Never Zero Philosophy: ${BLOG_URL}
3. Try the 66-Day Challenge (7-day free trial): ${CHALLENGE_URL}

The 66-Day Sasquatch Challenge is my structured accountability program — daily missions, habit tracking, and a community that shows up every day.

Start your free trial: ${CHALLENGE_URL}

— Nick Kremers
Founder, Stroke Recovery Academy
Author of The Stroked Out Sasquatch
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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Sign-In Code</title>
  <style>
    body { margin: 0; padding: 0; background: #0D0D0D; font-family: 'Georgia', serif; color: #E5E5E5; }
    .wrapper { max-width: 480px; margin: 0 auto; background: #111111; }
    .header { background: #1a1a1a; padding: 32px 40px 24px; border-bottom: 2px solid #C9941A; text-align: center; }
    .logo-text { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #C9941A; margin-bottom: 8px; }
    .header h1 { font-size: 22px; color: #FFFFFF; margin: 0; font-weight: normal; }
    .body { padding: 40px; text-align: center; }
    p { font-size: 15px; line-height: 1.7; color: #CCCCCC; margin: 0 0 16px; }
    .otp-box { background: #0D0D0D; border: 2px solid #C9941A; border-radius: 8px; padding: 28px; margin: 28px 0; }
    .otp-code { font-size: 48px; font-weight: bold; color: #C9941A; letter-spacing: 12px; font-family: monospace; }
    .otp-note { font-size: 12px; color: #666; margin-top: 12px; margin-bottom: 0; }
    .footer { background: #0D0D0D; padding: 20px 40px; border-top: 1px solid #222; text-align: center; }
    .footer p { font-size: 11px; color: #555; margin: 4px 0; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">Stroke Recovery Academy</div>
    <h1>Your Sign-In Code</h1>
  </div>
  <div class="body">
    <p>Hey ${name} — here's your one-time code to sign in.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <p class="otp-note">Expires in 10 minutes. Do not share this code.</p>
    </div>
    <p style="font-size:13px;color:#666;">If you didn't request this, ignore this email — your account is safe.</p>
  </div>
  <div class="footer">
    <p>Stroke Recovery Academy · strokerecoveryacademy.com</p>
  </div>
</div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: email,
    subject: `${otp} — Your Stroke Recovery Academy Sign-In Code`,
    html,
    text: `Your sign-in code: ${otp}\n\nExpires in 10 minutes. Do not share this code.\n\n— Stroke Recovery Academy`,
  });
}
