import PDFDocument from 'pdfkit';
import { sendEmail } from './emailService';

const GOLD = '#C9941A';
const BLACK = '#0D0D0D';
const CARD = '#1a1a1a';
const TEXT = '#E5E5E5';
const MUTED = '#999999';
const SITE_URL = 'https://strokerecoveryacademy.com';

const STEPS: Array<{ letter: string; word: string; body: string }> = [
  {
    letter: 'S',
    word: 'Seize',
    body: 'Accept exactly where you are right now. No denial, no wishing it was different. This is your raw material. Be brutally honest about your starting point — your flickers, your limitations, your reality. You cannot build on fantasy.',
  },
  {
    letter: 'A',
    word: 'Absorb',
    body: 'Take in every useful piece of knowledge — from therapists, science, other survivors, videos, books, and especially your own body\'s feedback. Be a sponge. Even the therapist you don\'t like has one technique worth stealing.',
  },
  {
    letter: 'S',
    word: 'Swing',
    body: 'Experiment. Test. Take action. Try new angles, tools, or reps even if they feel awkward or useless at first. Swing the bat. Do the mirror work. Send the signal. Action beats perfection.',
  },
  {
    letter: 'C',
    word: 'Combine',
    body: 'Mix the best pieces together into your own custom system. Don\'t follow one method blindly. Take what worked from today\'s swing and blend it with your other tools. Build your personal recovery recipe.',
  },
  {
    letter: 'H',
    word: 'Hammer',
    body: 'Apply it relentlessly every single day. No zero days. Hammer when you\'re tired. Hammer when progress feels invisible. Hammer when motivation is gone. Consistency is the hammer that builds empires.',
  },
];

export function generateSaschCheatSheetPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
        info: {
          Title: 'The S.A.S.C.H. Formula — Stroke Recovery Cheat Sheet',
          Author: 'Nick Kremers — The Stroked Out Sasquatch',
          Subject: 'Daily recovery operating system for stroke survivors',
          Keywords: 'stroke recovery, S.A.S.C.H. Formula, neuroplasticity, Nick Kremers',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Background fill (dark)
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLACK);

      // Top gold rule
      doc.rect(0, 36, doc.page.width, 2).fill(GOLD);

      // Header
      doc
        .fillColor(GOLD)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('STROKE RECOVERY ACADEMY', 56, 50, { characterSpacing: 3 });

      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('strokerecoveryacademy.com   |   Nick Kremers — The Stroked Out Sasquatch', 56, 66);

      // Title
      doc
        .moveDown(2)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(30)
        .text('THE S.A.S.C.H. FORMULA', 56, 100, { align: 'left' });

      doc
        .fillColor(GOLD)
        .font('Helvetica-Oblique')
        .fontSize(13)
        .text('Sasquatch Action System — Construction Hammer', 56, 138);

      // Why it works intro
      doc
        .moveDown(2)
        .fillColor(TEXT)
        .font('Helvetica')
        .fontSize(11)
        .text(
          'This is the exact 5-step system Nick used to go from 0% function after a massive hemorrhagic stroke to 90%+ recovery and still rising. Run it daily. No zero days.',
          56,
          172,
          { width: 484, lineGap: 4 },
        );

      // Steps (5 × 84pt rows fit cleanly above page bottom @ y=792 with 56pt margins)
      let y = 224;
      STEPS.forEach((s) => {
        // letter badge
        doc.roundedRect(56, y, 44, 44, 4).fill(GOLD);
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(26).text(s.letter, 56, y + 8, {
          width: 44,
          align: 'center',
        });

        // word
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(15)
          .text(`${s.letter} — ${s.word}`, 116, y + 4);

        // body
        doc
          .fillColor(TEXT)
          .font('Helvetica')
          .fontSize(10)
          .text(s.body, 116, y + 22, { width: 424, lineGap: 2.5 });

        y += 84;
      });

      // ── PAGE 2 — Checklist + 66-Day Truth + Mantra ─────────────────────────
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLACK);
      doc.rect(0, 36, doc.page.width, 2).fill(GOLD);

      // 66-Day Truth at the top of page 2 — high prominence, plenty of room
      const truthY = 60;
      doc.roundedRect(56, truthY, 484, 130, 4).fillAndStroke(CARD, GOLD);
      doc
        .fillColor(GOLD)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('THE 66-DAY TRUTH', 72, truthY + 14, { characterSpacing: 2 });
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica')
        .fontSize(10.5)
        .text(
          '66 days is the average time it takes to turn deliberate effort into a habit. It is not a guarantee. Every stroke is different. Every brain is different. Every recovery is different. The S.A.S.C.H. Formula is a blueprint built from Nick\'s journey from 0% to 90%+. It works when you work it. He is living proof it is possible. The rest is up to you.',
          72,
          truthY + 32,
          { width: 452, lineGap: 3 },
        );

      doc
        .fillColor(GOLD)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('DAILY S.A.S.C.H. CHECKLIST', 56, truthY + 156, { characterSpacing: 3 });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Print this. Tape it to the mirror. Run through it every morning or every night.', 56, truthY + 174);

      let cy = truthY + 200;
      const checklist = [
        ['Seize', 'I accepted exactly where I am today.'],
        ['Absorb', 'I took in new knowledge or feedback.'],
        ['Swing', 'I experimented. I tried something. I took action.'],
        ['Combine', 'I mixed what worked into my own system.'],
        ['Hammer', 'I did at least one rep. No zero day.'],
      ];
      checklist.forEach(([w, line]) => {
        // checkbox
        doc.lineWidth(1.5).strokeColor(GOLD).rect(56, cy, 16, 16).stroke();
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(w + ':', 82, cy + 2);
        doc
          .fillColor(TEXT)
          .font('Helvetica')
          .fontSize(10.5)
          .text(line, 148, cy + 2, { width: 392 });
        cy += 28;
      });

      // Today's One Swing / Flicker
      cy += 6;
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10).text("TODAY'S ONE SWING", 56, cy, { characterSpacing: 2 });
      doc.lineWidth(1).strokeColor('#444').moveTo(56, cy + 22).lineTo(540, cy + 22).stroke();
      cy += 42;
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10).text("TODAY'S FLICKER (TINY SIGN OF PROGRESS)", 56, cy, { characterSpacing: 2 });
      doc.lineWidth(1).strokeColor('#444').moveTo(56, cy + 22).lineTo(540, cy + 22).stroke();

      cy += 48;
      // Mantra
      doc.roundedRect(56, cy, 484, 70, 4).fillAndStroke(CARD, '#333');
      doc
        .fillColor(GOLD)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('THE SASQUATCH MANTRA', 72, cy + 14, { characterSpacing: 2 });
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Oblique')
        .fontSize(13)
        .text(
          '"S.A.S.C.H. it every day. Heart still thumpin\'? Life still pumpin\'. Keep swinging."',
          72,
          cy + 32,
          { width: 452, lineGap: 3 },
        );

      cy += 92;
      // Soft CTA
      doc
        .fillColor(TEXT)
        .font('Helvetica')
        .fontSize(11)
        .text(
          'Ready for the full 66-Day blueprint, daily accountability, and the survivor community?',
          56,
          cy,
          { width: 484, align: 'center' },
        );
      doc
        .moveDown(0.5)
        .fillColor(GOLD)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('strokerecoveryacademy.com  —  7-Day Free Trial', { align: 'center' });

      // Disclaimer at footer
      doc
        .fillColor('#666666')
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

// ─── Welcome email (delivers the cheat sheet PDF) ─────────────────────────────

export async function sendSaschWelcomeEmail(toEmail: string, firstName?: string | null) {
  const greeting = firstName ? `Hey ${firstName.split(' ')[0]},` : 'Hey Warrior,';

  // nosemgrep: javascript.lang.security.html-in-template-string
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Your S.A.S.C.H. Cheat Sheet</title>
<style>
  body { margin:0; padding:0; background:${BLACK}; font-family: Georgia, 'Times New Roman', serif; color:${TEXT}; }
  a { color:${GOLD}; text-decoration:none; }
  .wrapper { max-width:620px; margin:0 auto; background:${BLACK}; }
  .header { border-bottom:2px solid ${GOLD}; padding:28px 36px 20px; }
  .logo-text { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${GOLD}; font-family:Arial,sans-serif; font-weight:700; }
  .body { padding:36px 36px 24px; }
  .body p { font-size:16px; line-height:1.75; color:${TEXT}; margin:0 0 18px; }
  .quote { border-left:3px solid ${GOLD}; padding:14px 20px; margin:24px 0; background:${CARD}; border-radius:0 4px 4px 0; font-style:italic; color:#FFF; font-size:18px; }
  .cta { text-align:center; margin:36px 0; }
  .cta a { display:inline-block; background:${GOLD}; color:#000; font-weight:700; font-size:15px; padding:15px 36px; border-radius:4px; letter-spacing:0.5px; font-family:Arial,sans-serif; }
  .footer { background:#111; border-top:1px solid #333; padding:22px 36px; text-align:center; font-size:12px; color:${MUTED}; font-family:Arial,sans-serif; line-height:1.6; }
  .truth { background:${CARD}; border:1px solid ${GOLD}; border-radius:6px; padding:18px 22px; margin:24px 0; }
  .truth-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${GOLD}; font-family:Arial,sans-serif; font-weight:700; margin-bottom:8px; }
  .truth p { font-size:14px; line-height:1.65; color:${TEXT}; margin:0; }
</style></head><body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">Stroke Recovery Academy</div>
    <div style="font-size:11px;color:${MUTED};letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:4px;">Your S.A.S.C.H. Cheat Sheet</div>
  </div>
  <div class="body">
    <p>${greeting}</p>
    <p>Your free S.A.S.C.H. Cheat Sheet is attached to this email as a PDF. Print it. Tape it to the mirror. Or keep it on your phone. However you'll actually use it.</p>
    <div class="quote">"S.A.S.C.H. it every day: Seize → Absorb → Swing → Combine → Hammer."</div>
    <p>Five steps. Run them daily. Log one swing and one flicker. That's the whole formula. The simplicity is what makes it sustainable when motivation runs out.</p>
    <p>One thing before you go:</p>
    <div class="truth">
      <div class="truth-label">The 66-Day Truth</div>
      <p>66 days is the average time it takes to turn effort into a habit. It is not a guarantee. Every stroke is different. Every recovery is different. The S.A.S.C.H. Formula is the blueprint I built from going 0% to 90%+. It works when you work it. I'm living proof it's possible. The rest is up to you.</p>
    </div>
    <p>Over the next 67 days I'm going to send you ten more emails — real stuff, not fluff. The first one shows up in 3 days. It starts with "I wanted to drive into traffic." Watch your inbox.</p>
    <div class="cta"><a href="${SITE_URL}/recovery/challenge">Start the 66-Day Challenge — 7 Days Free</a></div>
    <p>Heart still thumpin'? Life still pumpin'.</p>
    <p style="margin-bottom:0;">Keep swinging,<br/><strong>Nick</strong><br/><em style="color:${MUTED};font-size:14px;">The Stroked Out Sasquatch</em></p>
  </div>
  <div class="footer">
    Stroke Recovery Academy &nbsp;|&nbsp; strokerecoveryacademy.com<br/>
    You received this because you downloaded the S.A.S.C.H. Cheat Sheet.<br/>
    <a href="${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
    <br/><br/>
    <span style="font-size:10px;color:#555;line-height:1.6;">
      <strong style="color:#666;">Not medical advice.</strong> Lived experience only. Always consult your physician, neurologist, or licensed therapist before trying any techniques. Individual results vary.
    </span>
  </div>
</div>
</body></html>`;

  const pdf = await generateSaschCheatSheetPdf();

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
      subject: "Your S.A.S.C.H. Cheat Sheet (start here)",
      html,
      attachments: [
        {
          filename: 'SASCH-Formula-Cheat-Sheet.pdf',
          content: pdf,
        },
      ],
    });

    if (result.error) {
      console.error('[sasch] welcome email error:', result.error);
      // Fallback: send without attachment + link instead
      await sendEmail({
        to: toEmail,
        subject: "Your S.A.S.C.H. Cheat Sheet (start here)",
        html: html.replace(
          '<p>Your free S.A.S.C.H. Cheat Sheet is attached to this email as a PDF.',
          // nosemgrep: javascript.lang.security.html-in-template-string
          `<p>Your free S.A.S.C.H. Cheat Sheet is ready: <a href="${SITE_URL}/api/sasch/cheat-sheet.pdf">click here to download the PDF</a>.`,
        ),
      });
      return { success: false, error: result.error.message };
    }
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error('[sasch] welcome email failed, falling back:', err?.message);
    await sendEmail({
      to: toEmail,
      subject: "Your S.A.S.C.H. Cheat Sheet (start here)",
      html: html.replace(
        '<p>Your free S.A.S.C.H. Cheat Sheet is attached to this email as a PDF.',
        // nosemgrep: javascript.lang.security.html-in-template-string
        `<p>Your free S.A.S.C.H. Cheat Sheet is ready: <a href="${SITE_URL}/api/sasch/cheat-sheet.pdf">click here to download the PDF</a>.`,
      ),
    });
    return { success: false, error: err?.message };
  }
}
