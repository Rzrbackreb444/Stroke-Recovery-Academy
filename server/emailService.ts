import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email || 'info@strokerecoveryacademy.com'
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPurchaseConfirmation(
  buyerEmail: string,
  buyerName: string,
  productTitle: string,
  productType: string,
  amount: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .product-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .product-title { color: #FF6B35; font-size: 18px; font-weight: bold; }
        .product-type { color: #888; font-size: 14px; text-transform: uppercase; }
        .amount { color: #fff; font-size: 24px; font-weight: bold; margin-top: 10px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Stroke Recovery Academy</div>
        <h1>Thank you for your purchase, ${buyerName}!</h1>
        <p>Your order has been confirmed and is being processed.</p>
        
        <div class="product-card">
          <div class="product-type">${productType}</div>
          <div class="product-title">${productTitle}</div>
          <div class="amount">${formattedAmount}</div>
        </div>
        
        <a href="https://strokerecoveryacademy.com/my-purchases" class="cta-button">View My Purchases</a>
        
        <div class="footer">
          <p>Stroke Recovery Academy - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: buyerEmail,
    subject: `Purchase Confirmed: ${productTitle}`,
    html,
    text: `Thank you for your purchase, ${buyerName}! Your order for ${productTitle} (${formattedAmount}) has been confirmed.`,
  });
}

export async function sendCreatorSaleNotification(
  creatorEmail: string,
  creatorName: string,
  productTitle: string,
  saleAmount: number,
  creatorShare: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(saleAmount / 100);
  
  const formattedShare = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(creatorShare / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .sale-card { background: linear-gradient(135deg, #FF6B35 0%, #ff8f4d 100%); border-radius: 8px; padding: 20px; margin: 20px 0; }
        .sale-label { color: rgba(0,0,0,0.7); font-size: 14px; text-transform: uppercase; }
        .sale-title { color: #000; font-size: 18px; font-weight: bold; margin: 5px 0; }
        .earnings { color: #000; font-size: 32px; font-weight: bold; }
        .earnings-label { color: rgba(0,0,0,0.7); font-size: 12px; }
        .stats { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.2); }
        .stat { text-align: center; }
        .stat-value { color: #000; font-weight: bold; }
        .stat-label { color: rgba(0,0,0,0.7); font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Stroke Recovery Academy</div>
        <h1>You made a sale.</h1>
        <p>Congratulations ${creatorName}, someone just purchased your content!</p>
        
        <div class="sale-card">
          <div class="sale-label">New Sale</div>
          <div class="sale-title">${productTitle}</div>
          <div class="earnings">${formattedShare}</div>
          <div class="earnings-label">Your Earnings (85%)</div>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${formattedTotal}</div>
              <div class="stat-label">Sale Price</div>
            </div>
            <div class="stat">
              <div class="stat-value">85%</div>
              <div class="stat-label">Your Share</div>
            </div>
          </div>
        </div>
        
        <a href="https://strokerecoveryacademy.com/author-dashboard" class="cta-button">View Dashboard</a>
        
        <div class="footer">
          <p>Stroke Recovery Academy - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `New Sale — ${productTitle}`,
    html,
    text: `Congratulations ${creatorName}! You made a sale of ${productTitle} for ${formattedTotal}. Your earnings: ${formattedShare} (85%).`,
  });
}

export async function sendNewFollowerNotification(
  creatorEmail: string,
  creatorName: string,
  followerName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .follower-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .follower-name { color: #FF6B35; font-size: 20px; font-weight: bold; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Stroke Recovery Academy</div>
        <h1>You have a new follower!</h1>
        <p>Hey ${creatorName}, your audience is growing!</p>
        
        <div class="follower-card">
          <div class="follower-name">${followerName}</div>
          <p style="color: #888;">is now following you</p>
        </div>
        
        <a href="https://strokerecoveryacademy.com/author-dashboard" class="cta-button">View Your Followers</a>
        
        <div class="footer">
          <p>Stroke Recovery Academy - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `${followerName} started following you on Stroke Recovery Academy`,
    html,
    text: `Hey ${creatorName}! ${followerName} is now following you on Stroke Recovery Academy.`,
  });
}

export async function sendPayoutNotification(
  creatorEmail: string,
  creatorName: string,
  amount: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .payout-card { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center; }
        .payout-label { color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; }
        .payout-amount { color: #fff; font-size: 40px; font-weight: bold; margin: 10px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Stroke Recovery Academy</div>
        <h1>Payout Sent.</h1>
        <p>Great news ${creatorName}! Your earnings are on the way.</p>
        
        <div class="payout-card">
          <div class="payout-label">Payout Amount</div>
          <div class="payout-amount">${formattedAmount}</div>
          <p style="color: rgba(255,255,255,0.8); margin: 0;">Sent to your connected bank account</p>
        </div>
        
        <p>Funds typically arrive within 2-5 business days depending on your bank.</p>
        
        <div class="footer">
          <p>Stroke Recovery Academy - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `Payout Sent — ${formattedAmount}`,
    html,
    text: `Great news ${creatorName}! Your payout of ${formattedAmount} has been sent to your connected bank account.`,
  });
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 28px; margin-bottom: 20px; }
        .tagline { color: #FF6B35; font-size: 16px; font-weight: bold; margin-bottom: 30px; }
        .studios { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
        .studio { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; }
        .studio-name { color: #FF6B35; font-weight: bold; }
        .studio-desc { color: #888; font-size: 12px; margin-top: 5px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Stroke Recovery Academy</div>
        <h1>Welcome to Stroke Recovery Academy, ${userName}!</h1>
        <div class="tagline">CREATE. PUBLISH. EARN.</div>
        
        <p>You now have access to 6 professional AI-powered studios:</p>
        
        <div class="studios">
          <div class="studio">
            <div class="studio-name">📚 Book Studio</div>
            <div class="studio-desc">Write & publish books with AI</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎵 Music Studio</div>
            <div class="studio-desc">Compose original music</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎬 Video Studio</div>
            <div class="studio-desc">Create & edit videos</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎓 Course Builder</div>
            <div class="studio-desc">Build online courses</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎨 Image Studio</div>
            <div class="studio-desc">Design stunning visuals</div>
          </div>
          <div class="studio">
            <div class="studio-name">📖 Doctrine Engine</div>
            <div class="studio-desc">Build knowledge bases</div>
          </div>
        </div>
        
        <p>Sell your creations on the Marketplace marketplace and keep <strong>85% of every sale</strong>!</p>
        
        <a href="https://strokerecoveryacademy.com/dashboard" class="cta-button">Start Creating</a>
        
        <div class="footer">
          <p>Stroke Recovery Academy - Powered by KremersX</p>
          <p>Questions? Contact us at info@strokerecoveryacademy.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Welcome to Stroke Recovery Academy - Start Creating Today!`,
    html,
    text: `Welcome to Stroke Recovery Academy, ${userName}! You now have access to 6 professional AI-powered studios. Start creating and earn 85% of every sale on the Marketplace marketplace.`,
  });
}

export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #f59e0b, #ea580c); border-radius: 16px; margin-bottom: 16px;">
            <span style="font-size: 32px;">✨</span>
          </div>
          <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Stroke Recovery Academy</h1>
          <p style="color: #9ca3af; margin: 8px 0 0;">Create. Publish. Earn.</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center;">
          <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">Sign in to your account</h2>
          <p style="color: #9ca3af; margin: 0 0 32px; line-height: 1.6;">
            Click the button below to securely sign in. This link expires in 15 minutes.
          </p>
          
          <a href="${magicLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #000000; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px;">
            Sign In Now
          </a>
          
          <p style="color: #6b7280; font-size: 12px; margin: 32px 0 0;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>

        <div style="margin-top: 32px; padding: 16px; background: rgba(220, 38, 38, 0.06); border: 1px solid rgba(220, 38, 38, 0.25); border-radius: 12px;">
          <p style="color: #fca5a5; font-size: 12px; margin: 0 0 6px; font-weight: 600;">
            In crisis? Real humans, 24/7.
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin: 0; line-height: 1.6;">
            Call or text <a href="tel:988" style="color: #fca5a5; font-weight: bold;">988</a> (U.S. Suicide &amp; Crisis Lifeline). Emergency: <a href="tel:911" style="color: #fca5a5; font-weight: bold;">911</a>.
            Stroke Recovery Academy is non-clinical &mdash; not a substitute for professional medical care.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #4b5563; font-size: 12px; margin: 0 0 8px;">
            © ${new Date().getFullYear()} Stroke Recovery Academy. All rights reserved.
          </p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">
            <a href="https://strokerecoveryacademy.com/legal/medical-disclaimer" style="color: #6b7280;">Medical Disclaimer</a> ·
            <a href="https://strokerecoveryacademy.com/privacy" style="color: #6b7280;">Privacy</a> ·
            <a href="https://strokerecoveryacademy.com/terms" style="color: #6b7280;">Terms</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = [
    `Sign in to Stroke Recovery Academy: ${magicLinkUrl}`,
    `This link expires in 15 minutes. If you didn't request it, ignore this email.`,
    ``,
    `—`,
    `NOT MEDICAL ADVICE. Stroke Recovery Academy is non-clinical and is not a substitute for professional medical care.`,
    `In crisis, call or text 988 (U.S. Suicide & Crisis Lifeline). Emergency: 911.`,
  ].join('\n');

  return sendEmail({
    to: email,
    subject: 'Sign in to Stroke Recovery Academy',
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #f59e0b, #ea580c); border-radius: 16px; margin-bottom: 16px;">
            <span style="font-size: 32px;">🔐</span>
          </div>
          <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Stroke Recovery Academy</h1>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center;">
          <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">Reset Your Password</h2>
          <p style="color: #9ca3af; margin: 0 0 32px; line-height: 1.6;">
            Click the button below to reset your password. This link expires in 1 hour.
          </p>
          
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #000000; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px;">
            Reset Password
          </a>
          
          <p style="color: #6b7280; font-size: 12px; margin: 32px 0 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Stroke Recovery Academy password',
    html,
    text: `Reset your Stroke Recovery Academy password using this link: ${resetUrl}. This link expires in 1 hour.`,
  });
}
