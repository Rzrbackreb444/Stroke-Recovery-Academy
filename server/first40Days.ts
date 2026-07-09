import PDFDocument from 'pdfkit';
import { sendEmail } from './emailService';

// New funnel palette (matches Landing / AboutNick)
const INK = '#1C1917';
const CREAM = '#FDFBF7';
const ORANGE = '#C06B3E';
const MUTED = '#78716C';
const CARD = '#F6EFEA';
const CARD_BORDER = '#E2C2A4';
const SITE_URL = 'https://strokerecoveryacademy.com';

// Grounded in the manuscript — Nick's real first-40-days arc.
// Day 41 toe flicker after 37 straight days of THINK work; the prognosis-as-data
// reframe from the hospital bed; the paved-road plasticity window; S.O.S.; Never Zero.
const PHASES: Array<{ range: string; title: string; items: string[] }> = [
  {
    range: 'DAYS 1–10',
    title: 'Survive. Reframe. Refuse the verdict.',
    items: [
      'Treat every prognosis as what it is: one person\'s best guess based on limited data on a survivor they\'ve known for forty-eight hours. It is a data point, not a verdict.',
      'Run S.O.S. every morning — Survive. Organize. Strive. Sixty seconds, out loud. It gives the worst days a name and a floor.',
      'Know the window: the brain\'s rewiring density is highest in the first 30–180 days post-stroke. The road is paved right now. Do not waste a single day of it.',
      'Rest is part of the work. A stroke brain heals during sleep. Protect it like a rep.',
    ],
  },
  {
    range: 'DAYS 11–25',
    title: 'Send the signal. Every day. Even when nothing moves.',
    items: [
      'Start THINK work: pick one muscle. Three blocks a day, ten minutes each. Stare at it. Send the signal — Lift. Lift. Lift. — whether it moves or not.',
      'Nick\'s left big toe did nothing for thirty-seven straight days. Nothing. He kept sending the signal anyway. If you\'re in week three and the muscle hasn\'t moved, you are not failing — you\'re on day three of forty-one.',
      'Adopt the Never Zero rule: at least one honest rep, every single day. Tired counts. Discouraged counts. Zero does not.',
      'Ask your care team real questions and write down the answers. You are becoming your own primary care advocate — nobody else can hold the whole picture.',
    ],
  },
  {
    range: 'DAYS 26–40',
    title: 'Build the system that outlasts motivation.',
    items: [
      'Start a flicker log. Write down every tiny sign of progress — a twitch, a millimeter, a word that came back. To anyone outside the work it\'s nothing. To you it\'s evidence.',
      'Log one swing (what you tried) and one flicker (what you noticed) every day. That\'s the whole daily report.',
      'Recruit your people. Nick\'s friend showed up with resistance bands and no pity. Find the one who says "try again" instead of "poor you."',
      'Motivation will run out before day 40. That\'s expected. The system — S.O.S. in the morning, signals during the day, the log at night — carries you when it does.',
    ],
  },
];

export function generateFirst40DaysPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
        info: {
          Title: 'The First 40 Days — A Stroke Survivor\'s Field Guide',
          Author: 'Nick Kremers — The Stroked Out Sasquatch',
          Subject: 'What to do in the first 40 days after a stroke',
          Keywords: 'stroke recovery, first 40 days, neuroplasticity, Nick Kremers',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageBg = () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(CREAM);
        doc.rect(0, 36, doc.page.width, 2).fill(ORANGE);
      };

      // ── PAGE 1 — Cover + Phase 1 ──────────────────────────────────────────
      pageBg();

      doc
        .fillColor(ORANGE)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('STROKE RECOVERY ACADEMY', 56, 50, { characterSpacing: 3 });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('strokerecoveryacademy.com   |   Nick Kremers — The Stroked Out Sasquatch', 56, 66);

      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(32)
        .text('THE FIRST 40 DAYS', 56, 100);
      doc
        .fillColor(ORANGE)
        .font('Helvetica-Oblique')
        .fontSize(13)
        .text('A stroke survivor\'s field guide to the window that matters most', 56, 140);

      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(11)
        .text(
          'A doctor looked at Nick\'s scans and said he\'d probably never walk normally again. Nick treated it as one person\'s best guess based on limited data — and chose possible. This guide is the first 40 days of that choice, broken into three phases you can actually run. Not medical advice. Lived experience, organized.',
          56,
          172,
          { width: 484, lineGap: 4 },
        );

      // Phase 1 card
      let y = 252;
      const drawPhase = (p: (typeof PHASES)[number], startY: number): number => {
        let yy = startY;
        doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10).text(p.range, 56, yy, { characterSpacing: 2 });
        yy += 16;
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(15).text(p.title, 56, yy, { width: 484 });
        yy = doc.y + 10;
        p.items.forEach((item) => {
          doc.circle(62, yy + 6, 2.5).fill(ORANGE);
          doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(item, 76, yy, { width: 464, lineGap: 2.5 });
          yy = doc.y + 10;
        });
        return yy;
      };

      y = drawPhase(PHASES[0], y);

      // ── PAGE 2 — Phases 2 & 3 ─────────────────────────────────────────────
      doc.addPage();
      pageBg();
      y = 60;
      y = drawPhase(PHASES[1], y);
      y += 14;
      y = drawPhase(PHASES[2], y);

      // ── PAGE 3 — Day 41 + daily card + CTA ────────────────────────────────
      doc.addPage();
      pageBg();

      const truthY = 60;
      doc.roundedRect(56, truthY, 484, 150, 4).fillAndStroke(CARD, CARD_BORDER);
      doc
        .fillColor(ORANGE)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('WHY 40 DAYS — THE DAY 41 STORY', 72, truthY + 14, { characterSpacing: 2 });
      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(10.5)
        .text(
          'On day forty-one after his stroke — after thirty-seven straight days of sending the signal to a toe that did nothing — Nick\'s left big toe lifted. Three millimeters. A quarter of a second. To anyone outside the work, nothing. To anyone inside it, the entire world. The first 40 days are how you earn day 41. Every other piece of his recovery — foot, calf, knee, hip, arm, hand — followed the same arc: THINK for weeks, twitch on a random Tuesday, then the work of moving.',
          72,
          truthY + 32,
          { width: 452, lineGap: 3 },
        );

      let cy = truthY + 176;
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(11).text('YOUR DAILY CARD', 56, cy, { characterSpacing: 3 });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Print this page. Run it every day. Forty times.', 56, cy + 18);

      cy += 44;
      const daily = [
        ['Morning', 'S.O.S. out loud — Survive. Organize. Strive. Sixty seconds.'],
        ['Signal', 'THINK blocks — 3 × 10 minutes on your chosen muscle.'],
        ['Rep', 'One honest rep of anything. Never Zero.'],
        ['Night', 'Log today\'s one swing and one flicker.'],
      ];
      daily.forEach(([w, line]) => {
        doc.lineWidth(1.5).strokeColor(ORANGE).rect(56, cy, 16, 16).stroke();
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(w + ':', 82, cy + 2);
        doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(line, 140, cy + 2, { width: 400 });
        cy += 28;
      });

      cy += 6;
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10).text("TODAY'S ONE SWING", 56, cy, { characterSpacing: 2 });
      doc.lineWidth(1).strokeColor(CARD_BORDER).moveTo(56, cy + 22).lineTo(540, cy + 22).stroke();
      cy += 42;
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10).text("TODAY'S FLICKER (TINY SIGN OF PROGRESS)", 56, cy, { characterSpacing: 2 });
      doc.lineWidth(1).strokeColor(CARD_BORDER).moveTo(56, cy + 22).lineTo(540, cy + 22).stroke();

      cy += 52;
      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(11)
        .text('Want the full system — daily reps, a squad of five, and Coach in your corner?', 56, cy, {
          width: 484,
          align: 'center',
        });
      doc
        .moveDown(0.5)
        .fillColor(ORANGE)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('strokerecoveryacademy.com  —  7-Day Free Trial', { align: 'center' });

      doc
        .fillColor(MUTED)
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .text(
          'Lived experience only. Not medical advice. Always consult your doctors and therapists before trying any techniques. Individual results vary.',
          56,
          doc.page.height - 80,
          { width: 484, align: 'center' },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Welcome email (delivers the First 40 Days guide PDF) ─────────────────────

export async function sendFirst40WelcomeEmail(toEmail: string, firstName?: string | null) {
  const greeting = firstName ? `Hey ${firstName.split(' ')[0]},` : 'Hey Warrior,';

  // nosemgrep: javascript.lang.security.html-in-template-string
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Your First 40 Days guide</title>
<style>
  body { margin:0; padding:0; background:${CREAM}; font-family: Georgia, 'Times New Roman', serif; color:${INK}; }
  a { color:${ORANGE}; text-decoration:none; }
  .wrapper { max-width:620px; margin:0 auto; background:${CREAM}; }
  .header { border-bottom:2px solid ${ORANGE}; padding:28px 36px 20px; }
  .logo-text { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${ORANGE}; font-family:Arial,sans-serif; font-weight:700; }
  .body { padding:36px 36px 24px; }
  .body p { font-size:16px; line-height:1.75; color:${INK}; margin:0 0 18px; }
  .quote { border-left:3px solid ${ORANGE}; padding:14px 20px; margin:24px 0; background:${CARD}; border-radius:0 4px 4px 0; font-style:italic; color:${INK}; font-size:18px; }
  .cta { text-align:center; margin:36px 0; }
  .cta a { display:inline-block; background:${ORANGE}; color:#FFF; font-weight:700; font-size:15px; padding:15px 36px; border-radius:999px; letter-spacing:0.5px; font-family:Arial,sans-serif; }
  .footer { background:${CARD}; border-top:1px solid ${CARD_BORDER}; padding:22px 36px; text-align:center; font-size:12px; color:${MUTED}; font-family:Arial,sans-serif; line-height:1.6; }
  .truth { background:${CARD}; border:1px solid ${CARD_BORDER}; border-radius:6px; padding:18px 22px; margin:24px 0; }
  .truth-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${ORANGE}; font-family:Arial,sans-serif; font-weight:700; margin-bottom:8px; }
  .truth p { font-size:14px; line-height:1.65; color:${INK}; margin:0; }
</style></head><body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">Stroke Recovery Academy</div>
    <div style="font-size:11px;color:${MUTED};letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:4px;">The First 40 Days</div>
  </div>
  <div class="body">
    <p>${greeting}</p>
    <p>Your free First 40 Days field guide is attached to this email as a PDF. Three phases, one daily card, and the reason it's 40 days and not 30 or 60.</p>
    <div class="quote">"You are not failing. You are on day three of forty-one. Keep sending the signal."</div>
    <p>My left big toe did nothing for thirty-seven straight days. On day forty-one it lifted — three millimeters, a quarter of a second. Every other piece of my recovery followed the same arc. The first 40 days are how you earn day 41.</p>
    <div class="truth">
      <div class="truth-label">The window is open</div>
      <p>The brain's rewiring density is highest in the first 30–180 days after a stroke. The road is paved right now. Every honest rep you bank in this window is wiring you can spend for the next forty years. Do not waste a single day of it.</p>
    </div>
    <p>Over the coming weeks I'll send you a handful more emails — real stuff, not fluff. Watch your inbox.</p>
    <div class="cta"><a href="${SITE_URL}/recovery/onboarding">Start your recovery — 7 days free</a></div>
    <p>Heart still thumpin'? Life still pumpin'.</p>
    <p style="margin-bottom:0;">Keep swinging,<br/><strong>Nick</strong><br/><em style="color:${MUTED};font-size:14px;">The Stroked Out Sasquatch</em></p>
  </div>
  <div class="footer">
    Stroke Recovery Academy &nbsp;|&nbsp; strokerecoveryacademy.com<br/>
    You received this because you requested The First 40 Days guide.<br/>
    <a href="${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
    <br/><br/>
    <span style="font-size:10px;color:${MUTED};line-height:1.6;">
      <strong>Not medical advice.</strong> Lived experience only. Always consult your physician, neurologist, or licensed therapist before trying any techniques. Individual results vary.
    </span>
  </div>
</div>
</body></html>`;

  const pdf = await generateFirst40DaysPdf();

  // Use Resend SDK directly so we can include attachments (sendEmail wrapper doesn't support them).
  try {
    const { Resend } = await import('resend');
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? 'repl ' + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;
    if (!xReplitToken || !hostname) throw new Error('Resend connection token not available');

    const data = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
      { headers: { Accept: 'application/json', X_REPLIT_TOKEN: xReplitToken } },
    )
      .then((r) => r.json())
      .then((d: any) => d.items?.[0]);

    if (!data?.settings?.api_key) throw new Error('Resend API key missing');

    const client = new Resend(data.settings.api_key);
    const fromEmail = data.settings.from_email || 'info@strokerecoveryacademy.com';

    const result = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Your First 40 Days guide (the window is open)',
      html,
      attachments: [
        {
          filename: 'The-First-40-Days.pdf',
          content: pdf,
        },
      ],
    });

    if (result.error) {
      console.error('[first40] welcome email error:', result.error);
      await sendEmail({
        to: toEmail,
        subject: 'Your First 40 Days guide (the window is open)',
        html: html.replace(
          '<p>Your free First 40 Days field guide is attached to this email as a PDF.',
          // nosemgrep: javascript.lang.security.html-in-template-string
          `<p>Your free First 40 Days field guide is ready: <a href="${SITE_URL}/api/first-40-days/guide.pdf">click here to download the PDF</a>.`,
        ),
      });
      return { success: false, error: result.error.message };
    }
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error('[first40] welcome email failed, falling back:', err?.message);
    await sendEmail({
      to: toEmail,
      subject: 'Your First 40 Days guide (the window is open)',
      html: html.replace(
        '<p>Your free First 40 Days field guide is attached to this email as a PDF.',
        // nosemgrep: javascript.lang.security.html-in-template-string
        `<p>Your free First 40 Days field guide is ready: <a href="${SITE_URL}/api/first-40-days/guide.pdf">click here to download the PDF</a>.`,
      ),
    });
    return { success: false, error: err?.message };
  }
}
