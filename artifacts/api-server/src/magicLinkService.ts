import crypto from 'crypto';
import type { Request, Response } from 'express';
import { db } from './db';
import { magicLinkTokens, users } from '@workspace/db';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { sendEmail } from './emailService';
import { renderEmail, EMAIL } from './emailTemplate';

const TOKEN_EXPIRY_MINUTES = 15;

export async function generateMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(magicLinkTokens).values({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const magicLink = `${baseUrl}/magic-link/verify/${token}`;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Stroke Recovery Academy sign-in link',
      html: generateMagicLinkEmailHtml(magicLink),
      text: [
        `Sign in to Stroke Recovery Academy:`,
        magicLink,
        ``,
        `This link expires in ${TOKEN_EXPIRY_MINUTES} minutes. If you did not request it, ignore this email — your account is safe.`,
        ``,
        `—`,
        `NOT MEDICAL ADVICE. Content is for informational and motivational purposes only.`,
        `Always consult your physician, neurologist, or licensed therapist before starting any rehabilitation program.`,
        `If you are in crisis, call or text 988 (U.S. Suicide & Crisis Lifeline). Emergency: 911.`,
      ].join('\n'),
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Magic link generation error:', error);
    return { success: false, error: error.message || 'Failed to generate magic link' };
  }
}

export async function verifyMagicLink(token: string): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
  try {
    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.token, token),
          gt(magicLinkTokens.expiresAt, new Date()),
          isNull(magicLinkTokens.usedAt)
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, tokenRecord.id));

    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, tokenRecord.email))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: tokenRecord.email,
          role: 'member',
        })
        .returning();
      existingUser = newUser;
    }

    return {
      success: true,
      userId: existingUser.id,
      email: tokenRecord.email,
    };
  } catch (error: any) {
    console.error('Magic link verification error:', error);
    return { success: false, error: error.message || 'Failed to verify magic link' };
  }
}

// Canonical magic-link verification. Checks the canonical token store first
// (magicLinkTokens, minted by generateMagicLink above), then falls back to the
// legacy store (emailAuthService `magicLinks` table) so links already emailed by
// the old backend continue to work. This is the single source of truth both the
// canonical route and the alias route delegate to.
export async function verifyMagicLinkToken(
  token: string,
): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
  const canonical = await verifyMagicLink(token);
  if (canonical.success) return canonical;

  // Fall back to the legacy emailAuthService store for backward compatibility.
  const { verifyMagicLink: verifyLegacyMagicLink } = await import('./emailAuthService');
  const legacy = await verifyLegacyMagicLink(token);
  if (legacy.success && legacy.user) {
    return { success: true, userId: legacy.user.id, email: legacy.user.email };
  }

  return {
    success: false,
    error: canonical.error || legacy.error || 'Invalid or expired magic link',
  };
}

// Shared Express handler so /api/auth/magic-link/verify/:token (canonical) and
// /api/email-auth/verify-magic-link?token= (alias) terminate in the exact same
// verification + session-creation code path. Both establish a passport session
// via req.login so the resulting session is identical regardless of link shape.
export async function handleMagicLinkVerify(req: Request, res: Response) {
  try {
    const token = (req.params as any)?.token || (req.query?.token as string);
    if (!token) {
      return res.status(400).json({ message: 'Token is required', error: 'Token is required' });
    }

    const result = await verifyMagicLinkToken(token);
    if (!result.success) {
      const msg = result.error || 'Invalid or expired magic link';
      return res.status(400).json({ message: msg, error: msg });
    }

    const [user] = await db.select().from(users).where(eq(users.id, result.userId!)).limit(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found', error: 'User not found' });
    }

    (req as any).login(
      {
        claims: { sub: user.id, email: user.email },
        access_token: null,
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      (err: any) => {
        if (err) {
          console.error('Magic link login error:', err);
          return res
            .status(500)
            .json({ message: 'Failed to create session', error: 'Failed to create session' });
        }
        res.json({ success: true, user });
      },
    );
  } catch (error: any) {
    console.error('Magic link verification error:', error);
    const msg = error.message || 'Failed to verify magic link';
    res.status(500).json({ message: msg, error: msg });
  }
}

function generateMagicLinkEmailHtml(magicLink: string): string {
  const bodyHtml = `
    <p class="body-text" style="text-align:center;">
      Tap the button below to sign in. This link expires in <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong>.
    </p>
    <div class="cta-block">
      <a class="cta-btn" href="${magicLink}">Sign In Securely</a>
    </div>
    <p class="body-text" style="text-align:center;font-size:13px;color:${EMAIL.muted};">
      If the button doesn't work, copy &amp; paste this URL into your browser:<br/>
      <a href="${magicLink}" style="word-break:break-all;">${magicLink}</a>
    </p>
    <p class="body-text" style="text-align:center;font-size:13px;color:${EMAIL.muted};margin-top:18px;">
      If you didn't request this, ignore this email — your account is safe.
    </p>
  `;

  return renderEmail({
    previewText: `Your one-time sign-in link (expires in ${TOKEN_EXPIRY_MINUTES} minutes)`,
    eyebrow: 'SECURE SIGN-IN',
    headline: 'Sign in to Stroke Recovery Academy',
    bodyHtml,
    whyReceiving: 'You requested a sign-in link for Stroke Recovery Academy.',
    unsubscribeUrl: `${EMAIL.site}/recovery/dashboard`,
  });
}
