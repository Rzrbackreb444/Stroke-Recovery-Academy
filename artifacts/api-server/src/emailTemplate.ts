// Single, beautiful, reusable email template for every Stroke Recovery Academy email.
// Goal: premium feel, consistent branding, hero-image driven, and a SAFETY-FIRST footer
// with a prominent medical disclaimer + crisis hotline that we can never forget to include.

const SITE = 'https://strokerecoveryacademy.com';

export const EMAIL = {
  bg: '#0D0D0D',
  card: '#1a1a1a',
  cardSoft: '#141414',
  gold: '#C9941A',
  goldSoft: '#D4A93B',
  text: '#E8E8E8',
  textSoft: '#B8B8B8',
  muted: '#888888',
  border: '#2a2a2a',
  borderStrong: '#3a3a3a',
  warning: '#3a1d1d',
  warningBorder: '#7a2a2a',
  warningText: '#ffd9d9',
  site: SITE,
  logo: `${SITE}/email-assets/sasquatch-logo.png`,
  beforeAfter: `${SITE}/email-assets/before-after-2018-2027.png`,
};

export interface EmailRenderOptions {
  /** Plain-language section before the body, used in inbox preview snippet. */
  previewText?: string;
  /** Optional eyebrow label above the H1, e.g. "EDITION 03 · DAY 14". */
  eyebrow?: string;
  /** Optional H1 displayed under the logo. */
  headline?: string;
  /** Optional sub-headline under the H1. */
  subheadline?: string;
  /** If true, embed the before/after hero image after the headline. */
  showBeforeAfter?: boolean;
  /** Custom hero image URL (overrides showBeforeAfter). */
  heroImage?: string;
  /** Custom hero alt text. */
  heroAlt?: string;
  /** Body HTML (already-styled .body-text / .quote-block / .tip-box / .cta-block etc). */
  bodyHtml: string;
  /** Show the "if you're in crisis, call 988" red callout above the disclaimer. Default: false. */
  showCrisisCallout?: boolean;
  /** Override the unsubscribe link target. */
  unsubscribeUrl?: string;
  /** Footer line that says why they're getting this email. */
  whyReceiving?: string;
}

/**
 * Renders a polished HTML email. All copy is wrapped in the same chrome:
 * - Sasquatch logo + brand wordmark header (gold underline)
 * - Optional eyebrow / headline / subhead
 * - Optional hero image
 * - Body (caller supplies HTML using the provided utility classes)
 * - Optional crisis hotline red callout
 * - LARGE, BOLD medical disclaimer (never tiny)
 * - Unsubscribe + brand footer
 */
export function renderEmail(opts: EmailRenderOptions): string {
  const {
    previewText = '',
    eyebrow,
    headline,
    subheadline,
    showBeforeAfter = false,
    heroImage,
    heroAlt = 'Nick Kremers stroke recovery — 2018 (early recovery, walker) to 2027 (90%+ recovered, founder of Stroke Recovery Academy).',
    bodyHtml,
    showCrisisCallout = false,
    unsubscribeUrl = `${SITE}/recovery/newsletter/unsubscribe`,
    whyReceiving = "You're receiving this because you signed up for The Sasquatch Dispatch from Stroke Recovery Academy.",
  } = opts;

  const hero = heroImage || (showBeforeAfter ? EMAIL.beforeAfter : null);

  // nosemgrep: javascript.lang.security.html-in-template-string
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>Stroke Recovery Academy</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin:0; padding:0; background:${EMAIL.bg}; font-family: Georgia, 'Times New Roman', serif; color:${EMAIL.text}; -webkit-font-smoothing:antialiased; }
  img { border:0; outline:none; text-decoration:none; display:block; max-width:100%; height:auto; }
  a { color:${EMAIL.gold}; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .wrapper { max-width:640px; margin:0 auto; background:${EMAIL.bg}; }
  .header { background:${EMAIL.bg}; border-bottom:2px solid ${EMAIL.gold}; padding:28px 36px 22px; text-align:center; }
  .logo-img { width:72px; height:72px; margin:0 auto 12px; border-radius:50%; }
  .brand-wordmark { font-family: Arial, Helvetica, sans-serif; font-size:13px; letter-spacing:4px; text-transform:uppercase; color:${EMAIL.gold}; font-weight:800; }
  .brand-sub { font-family: Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${EMAIL.muted}; margin-top:6px; }
  .body { padding:32px 36px 16px; }
  .eyebrow { font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:${EMAIL.gold}; font-weight:800; margin:0 0 12px; }
  .headline { font-family: Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.2; color:#FFFFFF; margin:0 0 12px; font-weight:normal; }
  .subhead { font-size:16px; line-height:1.6; color:${EMAIL.textSoft}; margin:0 0 24px; }
  .hero-wrap { margin:0 0 28px; border-radius:8px; overflow:hidden; border:1px solid ${EMAIL.border}; }
  .hero-img { width:100%; height:auto; display:block; }
  .quote-block { border-left:3px solid ${EMAIL.gold}; padding:16px 22px; margin:28px 0; background:${EMAIL.card}; border-radius:0 4px 4px 0; }
  .quote-text { font-size:22px; line-height:1.4; color:#FFFFFF; font-style:italic; margin:0 0 8px; }
  .quote-attr { font-family:Arial, Helvetica, sans-serif; font-size:11px; color:${EMAIL.muted}; letter-spacing:1.5px; text-transform:uppercase; }
  .body-text { font-size:16px; line-height:1.75; color:${EMAIL.text}; margin:0 0 18px; }
  .body-text strong { color:#FFFFFF; }
  .tip-box { background:${EMAIL.card}; border:1px solid ${EMAIL.border}; border-radius:8px; padding:22px 26px; margin:28px 0; }
  .tip-label { font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${EMAIL.gold}; font-weight:800; margin-bottom:10px; }
  .cta-block { text-align:center; margin:36px 0 28px; }
  .cta-btn { display:inline-block; background:${EMAIL.gold}; color:#000000 !important; font-weight:800; font-size:15px; padding:16px 38px; border-radius:6px; letter-spacing:0.5px; font-family:Arial, Helvetica, sans-serif; }
  .cta-secondary { display:inline-block; border:1px solid ${EMAIL.gold}; color:${EMAIL.gold} !important; font-weight:700; font-size:13px; padding:11px 22px; border-radius:6px; letter-spacing:0.5px; font-family:Arial, Helvetica, sans-serif; margin:6px 4px 0; }
  .divider { border:none; border-top:1px solid ${EMAIL.border}; margin:28px 0; }
  .crisis { background:${EMAIL.warning}; border:1px solid ${EMAIL.warningBorder}; border-radius:8px; padding:18px 22px; margin:28px 0; color:${EMAIL.warningText}; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; }
  .crisis strong { color:#FFFFFF; display:block; font-size:13px; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .disclaimer { background:#1a1a1a; border-top:2px solid ${EMAIL.gold}; padding:24px 36px; }
  .disclaimer-label { font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${EMAIL.gold}; font-weight:800; margin:0 0 10px; }
  .disclaimer-text { font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.65; color:${EMAIL.textSoft}; margin:0; }
  .disclaimer-text strong { color:#FFFFFF; }
  .footer { background:#0a0a0a; padding:22px 36px 28px; text-align:center; border-top:1px solid ${EMAIL.border}; }
  .footer-text { font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${EMAIL.muted}; }
  .footer-text a { color:${EMAIL.muted}; text-decoration:underline; }
  @media (max-width:600px) {
    .body, .header, .disclaimer, .footer { padding-left:20px !important; padding-right:20px !important; }
    .quote-text { font-size:18px; }
    .headline { font-size:24px; }
  }
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${EMAIL.bg};">${escapeText(previewText)}</div>
<div class="wrapper">

  <div class="header">
    <img src="${EMAIL.logo}" alt="Stroked Out Sasquatch — Stroke Recovery Academy" width="72" height="72" class="logo-img" />
    <div class="brand-wordmark">Stroke Recovery Academy</div>
    <div class="brand-sub">Nick Kremers · The Stroked Out Sasquatch</div>
  </div>

  <div class="body">
    ${eyebrow ? `<div class="eyebrow">${escapeText(eyebrow)}</div>` : ''}
    ${headline ? `<h1 class="headline">${escapeText(headline)}</h1>` : ''}
    ${subheadline ? `<p class="subhead">${escapeText(subheadline)}</p>` : ''}
    ${hero ? `<div class="hero-wrap"><img src="${escapeAttr(hero)}" alt="${escapeAttr(heroAlt)}" class="hero-img" /></div>` : ''}
    ${bodyHtml}
    ${showCrisisCallout ? renderCrisisCallout() : ''}
  </div>

  <div class="disclaimer">
    <div class="disclaimer-label">⚠ Important — Please Read</div>
    <p class="disclaimer-text">
      <strong>This is not medical advice.</strong> Nick Kremers is a stroke survivor sharing lived
      experience and motivational content — not a doctor, neurologist, or licensed therapist.
      Everything published by Stroke Recovery Academy is for informational and inspirational
      purposes only. It is <strong>not a substitute</strong> for professional medical advice,
      diagnosis, treatment, or supervised rehabilitation. Individual results vary dramatically
      based on stroke type, severity, age, and underlying conditions.
      <strong>Always talk to your physician, neurologist, or licensed therapist before starting,
      stopping, or modifying any exercise, supplement, medication, or rehabilitation program.</strong>
      If you experience new symptoms — sudden weakness, vision changes, severe headache, slurred
      speech, or chest pain — call 911 immediately.
    </p>
  </div>

  <div class="footer">
    <div class="footer-text">
      Stroke Recovery Academy · <a href="${SITE}">strokerecoveryacademy.com</a><br/>
      Powered by Stroke Lyfe Inc., a 501(c)(3) nonprofit · Rebuild. Rewire. Rise.<br/><br/>
      ${escapeText(whyReceiving)}<br/>
      <a href="${escapeAttr(unsubscribeUrl)}">Unsubscribe</a> · <a href="${SITE}/recovery/dashboard">Manage preferences</a>
    </div>
  </div>

</div>
</body>
</html>`;
}

function renderCrisisCallout(): string {
  return `
    <div class="crisis">
      <strong>If you are in crisis right now</strong>
      You are not alone. In the U.S., call or text <a href="tel:988" style="color:#fff;text-decoration:underline;">988</a>
      (Suicide &amp; Crisis Lifeline) any time, day or night. If you are in immediate danger,
      call <a href="tel:911" style="color:#fff;text-decoration:underline;">911</a>.
      Outside the U.S., contact your local emergency services or crisis line.
    </div>
  `;
}

function escapeText(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
function escapeAttr(s: string): string {
  return escapeText(s);
}

/** Helper to build a primary CTA button block. */
export function ctaButton(href: string, label: string): string {
  // nosemgrep: javascript.lang.security.html-in-template-string
  return `<div class="cta-block"><a class="cta-btn" href="${escapeAttr(href)}">${escapeText(label)}</a></div>`;
}
