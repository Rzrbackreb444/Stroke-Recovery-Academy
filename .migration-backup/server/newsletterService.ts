import { db } from './db';
import { sendEmail } from './emailService';
import { sendMessage } from './messaging';
import { redactEmail } from './lib/redact';
import { newsletterSubscribers, newsletterEditions } from '../shared/schema';
import { eq, and, lte, isNull, sql } from 'drizzle-orm';
import { renderEmail, EMAIL } from './emailTemplate';

// Backwards-compatible BRAND alias used in edition content strings below.
const BRAND = {
  siteUrl: EMAIL.site,
  muted: EMAIL.muted,
  bg: EMAIL.bg,
  card: EMAIL.card,
  gold: EMAIL.gold,
  text: EMAIL.text,
  border: EMAIL.border,
};

// Legacy wrapper retained for any external callers; new sends use renderEmail directly.
function emailWrapper(content: string, previewText = ''): string {
  // nosemgrep: javascript.lang.security.html-in-template-string
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>The Sasquatch Dispatch</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin:0; padding:0; background:${BRAND.bg}; font-family: Georgia, 'Times New Roman', serif; color:${BRAND.text}; }
  a { color:${BRAND.gold}; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .wrapper { max-width:620px; margin:0 auto; background:${BRAND.bg}; }
  .header { background:${BRAND.bg}; border-bottom:2px solid ${BRAND.gold}; padding:28px 36px 20px; }
  .logo-text { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${BRAND.gold}; font-family: Arial, sans-serif; font-weight:700; }
  .edition-label { font-size:11px; color:${BRAND.muted}; letter-spacing:2px; text-transform:uppercase; font-family:Arial,sans-serif; margin-top:4px; }
  .body { padding:36px 36px 24px; }
  .quote-block { border-left:3px solid ${BRAND.gold}; padding:14px 20px; margin:28px 0; background:${BRAND.card}; border-radius:0 4px 4px 0; }
  .quote-text { font-size:22px; line-height:1.4; color:#FFF; font-style:italic; margin:0 0 8px; }
  .quote-attr { font-size:12px; color:${BRAND.muted}; font-family:Arial,sans-serif; letter-spacing:1px; text-transform:uppercase; }
  .body-text { font-size:16px; line-height:1.75; color:${BRAND.text}; margin:0 0 18px; }
  .tip-box { background:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:6px; padding:20px 24px; margin:28px 0; }
  .tip-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${BRAND.gold}; font-family:Arial,sans-serif; font-weight:700; margin-bottom:10px; }
  .cta-block { text-align:center; margin:36px 0; }
  .cta-btn { display:inline-block; background:${BRAND.gold}; color:#000; font-weight:700; font-size:15px; padding:15px 36px; border-radius:4px; letter-spacing:0.5px; font-family:Arial,sans-serif; }
  .footer { background:#111; border-top:1px solid ${BRAND.border}; padding:24px 36px; text-align:center; }
  .footer-text { font-size:12px; color:${BRAND.muted}; font-family:Arial,sans-serif; line-height:1.6; }
  .divider { border:none; border-top:1px solid ${BRAND.border}; margin:28px 0; }
  @media (max-width:600px) {
    .body, .header, .footer { padding-left:20px !important; padding-right:20px !important; }
    .quote-text { font-size:18px; }
  }
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${BRAND.bg};">${previewText}</div>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">The Sasquatch Dispatch</div>
    <div class="edition-label">Stroke Recovery Academy &nbsp;|&nbsp; Nick Kremers</div>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <div class="footer-text">
      Stroke Recovery Academy &nbsp;|&nbsp; strokerecoveryacademy.com<br/>
      Nick Kremers — Stroke Survivor, Year 7<br/><br/>
      You're getting this because you signed up for The Sasquatch Dispatch.<br/>
      <a href="${BRAND.siteUrl}/recovery/newsletter/unsubscribe" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
      <br/><br/>
      <span style="font-size:10px;color:#555;line-height:1.6;">
        <strong style="color:#666;">Not medical advice.</strong> Content from Stroke Recovery Academy and Nick Kremers 
        is for motivational and informational purposes only. It is not a substitute for professional medical advice, 
        diagnosis, or treatment. Individual results vary. Always consult your physician, neurologist, or licensed therapist 
        before beginning any rehabilitation program.
      </span>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── 10 Pre-written editions ──────────────────────────────────────────────────

export const DRIP_EDITIONS: Array<{
  editionNumber: number;
  dayOffset: number;
  subject: string;
  previewText: string;
  content: string;
  /** Optional small label above the headline ("EDITION 03 · DAY 14"). */
  eyebrow?: string;
  /** Optional H1 shown right under the brand header. */
  headline?: string;
  /** Optional subheadline under the H1. */
  subheadline?: string;
  /** If true, embed the Stroke Lyfe before/after hero image. */
  showBeforeAfter?: boolean;
  /** If true, show the 988 Suicide & Crisis Lifeline callout above the disclaimer. */
  showCrisisCallout?: boolean;
}> = [
  // ── EDITION 1 — Day 3 ───────────────────────────────────────────────────────
  {
    editionNumber: 1,
    dayOffset: 3,
    subject: 'I wanted to drive into traffic.',
    previewText: "This is the email I wasn't going to send. But you need to hear it.",
    eyebrow: 'EDITION 01 · DAY 3',
    headline: 'The email I wasn\u2019t going to send.',
    subheadline: 'Year 2 after my stroke nearly took me out. Here\u2019s what stopped the spiral.',
    showCrisisCallout: true,
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <p class="body-text">Let me start with something I don't tell most people.</p>
      <div class="quote-block">
        <div class="quote-text">"I wanted to drive into traffic once. I did one rep instead."</div>
        <div class="quote-attr">— Nick Kremers, Year 2</div>
      </div>
      <p class="body-text">Year two after my stroke was the worst year of my life. Not because of the paralysis. Not because of the drop foot, or the spasticity, or the fact that I couldn't feel my left hand. It was because I thought I was done improving. I thought I'd already seen the best it was going to get.</p>
      <p class="body-text">I was parked on a plateau so long I thought the plateau was my life.</p>
      <p class="body-text">One afternoon I was driving and I thought about just... turning the wheel. I didn't. I went home. I got on the floor. I did one arm curl with the same arm they said would never work again. One ugly, shaky, barely-there rep. Then I did another one.</p>
      <p class="body-text">That moment didn't fix everything. But it stopped the spiral. And it started something that I'm still building seven years later.</p>
      <p class="body-text">I'm not telling you this to be dramatic. I'm telling you this because if you're reading this email right now, there's a decent chance you know exactly what I'm talking about — that silent, crushing kind of darkness that nobody talks about at your therapy appointments.</p>
      <p class="body-text">We talk about it here. That's the whole point.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">This Week's Sasquatch Assignment</div>
        <p class="body-text" style="margin:0;">When the dark thought shows up — and it will — do one physical thing. One rep. One step. One hand squeeze. Just one. Then tell me about it in the community. That's how we break isolation. That's how we save each other.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/community">Join the Community — It's Free</a>
      </div>
      <p class="body-text" style="font-size:14px;color:${BRAND.muted};">Next week I'm going to tell you why every doctor who told you to "manage expectations" was operating off a broken playbook. Stay with me.</p>
      <p class="body-text">Still swinging,<br/><strong>Nick</strong><br/><em>The Stroked Out Sasquatch</em></p>
    `,
  },

  // ── EDITION 2 — Day 7 ───────────────────────────────────────────────────────
  {
    editionNumber: 2,
    dayOffset: 7,
    subject: 'The doctor said I had a 0% chance. He was wrong.',
    previewText: 'The medical system isn\'t lying to you — it just doesn\'t account for what you\'re about to do.',
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"I refused their timeline. You should refuse it too."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">I'm not anti-doctor. I want to be clear about that. The medical team that kept me alive when I stroked out at 38 saved my life. I owe them everything.</p>
      <p class="body-text">But the same medical system that saved my life then tried to put a ceiling on it. "Maximum recovery window is 6 months." "You'll likely never regain full function." "You should focus on adapting, not recovering."</p>
      <p class="body-text">Here's what they weren't accounting for: neuroplasticity doesn't read discharge papers. Your brain doesn't stop rewiring because an insurance company said the session limit was hit.</p>
      <p class="body-text">At Year 7, I'm still getting better. Not metaphorically. Literally still recovering function in my left arm that the chart said was gone. Because I never stopped treating my body like a construction project.</p>
      <p class="body-text">The protocol isn't complicated — it's just hard to sustain:</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">The Sasquatch Protocol (Simplified)</div>
        <p class="body-text" style="margin:0 0 10px;"><strong>Think. Twitch. Move.</strong> Before every movement, visualize it. Then try to produce even the smallest twitch. Then complete the motion — assisted if needed. Repetition rewires. 300+ reps per session if you can get there.</p>
        <p class="body-text" style="margin:0;color:${BRAND.muted};font-size:14px;">The science behind this is called constraint-induced movement therapy and motor imagery. The research is real. The results are real. I'm proof.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/protocols">See the Full Recovery Protocols</a>
      </div>
      <p class="body-text">Your brain is listening to every effort. Make it loud.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 3 — Day 14 ──────────────────────────────────────────────────────
  {
    editionNumber: 3,
    dayOffset: 14,
    subject: 'What 66 days actually does to a recovering brain.',
    previewText: 'It\'s not about willpower. It\'s about what happens neurologically when you repeat something 66 days straight.',
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"66 days builds the habit. Consistency keeps it."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">You've probably heard that it takes 21 days to build a habit. That's a myth someone made up in the 1960s and nobody bothered to check.</p>
      <p class="body-text">The actual research — University College London, 2010 — found that on average it takes <strong>66 days</strong> for a behavior to become automatic. For complex physical behaviors in people rewiring post-stroke? Even longer.</p>
      <p class="body-text">But here's the thing about 66 days that nobody talks about: the first 10 days feel like progress. Days 11–40 feel like nothing is happening. That stretch — the dead middle — is where 90% of people quit. And it's also where the real neurological work is happening, invisible inside your brain.</p>
      <p class="body-text">I designed the 66-Day Sasquatch Transformation Challenge specifically around this window. Every day has a mission. Every week has a theme. And the community is there to pull you through days 11 through 40 when you feel like you're going nowhere.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">What the 66-Day Challenge Includes</div>
        <p class="body-text" style="margin:0 0 10px;"><strong>Phase 1 (Days 1–22): Survival.</strong> Build the daily movement habit. Daily check-ins. Accountability stack. Nick's voice in your ear every morning.</p>
        <p class="body-text" style="margin:0 0 10px;"><strong>Phase 2 (Days 23–44): Breakthrough.</strong> Intensify the protocol. Weekly habit stacking. Small wins tracked publicly so the community sees your progress.</p>
        <p class="body-text" style="margin:0;"><strong>Phase 3 (Days 45–66): Optimization.</strong> Personalize your protocol. Start building your testimony. You're now the proof someone else needs to see.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/challenge">Start the 66-Day Challenge — 7 Days Free</a>
      </div>
      <p class="body-text" style="font-size:14px;color:${BRAND.muted};text-align:center;">No credit card commitment required for your first 7 days. Just show up.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 4 — Day 21 ──────────────────────────────────────────────────────
  {
    editionNumber: 4,
    dayOffset: 21,
    subject: 'You\'re not stuck. You\'re in the plateau. Here\'s the difference.',
    previewText: 'The plateau looks like failure from the inside. But I can tell you exactly what\'s happening.',
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"Plateaus are launchpads, not parking lots."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Three weeks in. You've been reading these emails. Maybe you've started doing the reps. And right now there's a voice in your head saying: <em>nothing is changing.</em></p>
      <p class="body-text">I know that voice. It's a liar.</p>
      <p class="body-text">Here's what's actually happening in a plateau: your brain is consolidating. It's taking everything you've been practicing and quietly building the infrastructure for the next breakthrough. The problem is it's invisible. You can't feel it happening. You can't measure it. So you assume it's not.</p>
      <p class="body-text">I spent eight months on a plateau at Year 2. Eight months of doing the work and feeling like I was going nowhere. Then I woke up one morning and my hand closed. Not fully. But it closed. After eight months of silence, my brain just... delivered.</p>
      <p class="body-text">The people who quit in month 6 of 8 never know they were two months away.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">How to Work Through a Plateau</div>
        <p class="body-text" style="margin:0 0 10px;"><strong>1. Change the angle, not the effort.</strong> If you're stuck on hand grip, try mirror therapy. If you're stuck on walking, try aquatic therapy. Same target, different input for the brain.</p>
        <p class="body-text" style="margin:0 0 10px;"><strong>2. Document everything.</strong> Video yourself weekly. You will miss micro-improvements in real time that are obvious on video comparison.</p>
        <p class="body-text" style="margin:0;"><strong>3. Post in the community.</strong> Nothing breaks a mental plateau like being seen by people who understand what you're grinding through.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/community">Post Your Plateau in the Community</a>
      </div>
      <p class="body-text">Proof is built in the plateau. Keep going.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 5 — Day 30 ──────────────────────────────────────────────────────
  {
    editionNumber: 5,
    dayOffset: 30,
    subject: 'Build in public. It will feel terrifying. Do it anyway.',
    previewText: 'Isolation almost killed me after my stroke. Community is what I had to build to save myself.',
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"Build your tribe. Isolation almost killed me. Connection saved me."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Month two. You've been at this a while now. And if you're like most people in recovery — whether you're a survivor yourself or you're supporting one — you're doing a lot of this alone.</p>
      <p class="body-text">I get it. There's a certain kind of pride that comes with suffering quietly. Especially for men. You don't want to post about your bad days. You don't want to show the ugly reps. You don't want someone who doesn't understand to say something hollow and chirpy at you.</p>
      <p class="body-text">But here's what I know from seven years of this: <strong>isolation compounds.</strong> Every day you grind alone, the weight gets heavier. And every day you share — even one ugly rep, even one honest post — the weight gets lighter. Not because it fixed anything. Because someone else said "me too."</p>
      <p class="body-text">The Survivor Community is built for exactly that. No inspirational clichés. No "you got this!" from people who've never had a stroke. Just real survivors, real caregivers, real progress — and real dark days — shared with people who actually understand.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">This Month's Challenge</div>
        <p class="body-text" style="margin:0;">Post one honest thing in the community. Not your highlight. Your reality right now. What's actually hard. What you're actually working on. Watch what happens.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/community">Go to the Survivor Community</a>
      </div>
      <p class="body-text">Your recovery is someone else's hope. Don't keep it to yourself.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 6 — Day 37 ──────────────────────────────────────────────────────
  {
    editionNumber: 6,
    dayOffset: 37,
    subject: 'This one\'s for the caregivers.',
    previewText: "If you're doing this for someone you love — this email is specifically for you.",
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"The tribe pulls you when your own rope feels too short."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Most of the content I put out is aimed at survivors. But I know a significant chunk of the people on this list are caregivers — spouses, adult children, siblings — who are carrying someone they love through a recovery that was never in the plan.</p>
      <p class="body-text">This one's for you.</p>
      <p class="body-text">The caregiver burnout nobody talks about is the guilt that comes with your own exhaustion. You're not allowed to be tired, because they're the one who had the stroke. You're not allowed to grieve, because they're still here. You put yourself last every single day and you call it love — and it is love — but it's also slowly emptying you out.</p>
      <p class="body-text">My family carried me through years of this. I watched what it did to them. And the hardest thing to watch wasn't their exhaustion. It was watching them pretend they weren't exhausted so they didn't add to my guilt.</p>
      <p class="body-text">Don't do that. Your needs matter too. The plane is going down and you have to put your oxygen mask on first — not because you matter more, but because you can't help anyone from the floor.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">For Caregivers This Week</div>
        <p class="body-text" style="margin:0 0 10px;"><strong>Do one thing that is only for you.</strong> A walk. A nap. One hour of something you used to love. Not because you've "earned" it. Because you're a human being and you matter.</p>
        <p class="body-text" style="margin:0;">And then tell someone in the community how you're actually doing. There are other caregivers there who understand in a way that nobody outside this world really can.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/community">Find Your People in the Community</a>
      </div>
      <p class="body-text">Watching you fight for them. Rooting for you too.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 7 — Day 45 ──────────────────────────────────────────────────────
  {
    editionNumber: 7,
    dayOffset: 45,
    subject: 'Depression showed up at Year 2. Here\'s what I did.',
    previewText: "Mental health after stroke is the conversation nobody is having. Let's have it.",
    eyebrow: 'EDITION 07 · DAY 45',
    headline: 'Post-stroke depression is real. Let\u2019s name it.',
    subheadline: '30\u201350% of survivors face it. Most never get told what\u2019s actually happening.',
    showCrisisCallout: true,
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"Depression wants you parked. Tell it to kick rocks."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Post-stroke depression affects somewhere between 30–50% of survivors. The medical community mostly hands you a prescription and moves on. I'm not anti-medication — sometimes it's exactly right. But nobody told me that the darkness that settled in at Year 2 was neurological, not character weakness. My brain had literally been rewired in ways that affected my mood regulation.</p>
      <p class="body-text">Knowing that didn't make it easier. But it made it less personal.</p>
      <p class="body-text">The thing that got me out of it wasn't just the reps — though they helped. It was <strong>purpose.</strong> The moment I started documenting my recovery for other people, the darkness had less room to grow. I was too busy being useful.</p>
      <p class="body-text">I'm not telling you that purpose cures depression. That would be irresponsible and wrong. But I am telling you that one of the most powerful anti-depression tools in recovery is contribution. Giving something — even a post, even a comment, even five minutes — to someone who's behind you on the road.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">If the Depression Has Been Loud Lately</div>
        <p class="body-text" style="margin:0 0 10px;"><strong>Step 1:</strong> Name it. "This is post-stroke depression. This is neurological. This is not who I am."</p>
        <p class="body-text" style="margin:0 0 10px;"><strong>Step 2:</strong> Do one physical rep. Any rep. It doesn't have to be pretty.</p>
        <p class="body-text" style="margin:0;"><strong>Step 3:</strong> Tell one person. Your spouse, a community member, your therapist, or reply to this email. I actually read these.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/blog/neuroplasticity-the-science-behind-recovery">Read: Neuroplasticity & Recovery</a>
      </div>
      <p class="body-text">Dark days don't get the final word. You do.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 8 — Day 52 ──────────────────────────────────────────────────────
  {
    editionNumber: 8,
    dayOffset: 52,
    subject: 'Year 7: what actually changed (and what didn\'t)',
    previewText: "Seven years after my stroke, here's the honest inventory — the wins and the losses.",
    eyebrow: 'EDITION 08 · DAY 52',
    headline: 'From walker to 90%. Here\u2019s the honest receipt.',
    subheadline: 'The before/after, the wins, the things that are still hard.',
    showBeforeAfter: true,
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"Still rising at Year 7. Your story isn't over either."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Seven years is long enough to give you an honest answer to the question everyone really wants to ask: <em>Does it actually get better?</em></p>
      <p class="body-text">Honest answer: yes. And it's complicated. Let me give you the real inventory.</p>
      <p class="body-text"><strong>What's genuinely better:</strong> My left arm function is at about 65–70% of what it was before. Seven years ago it was at 0%. I walk without a brace most days. I built a business from a hospital bed. My relationships are deeper than they were before the stroke — not in spite of the experience, because of it.</p>
      <p class="body-text"><strong>What's still hard:</strong> Fatigue. Post-stroke fatigue is real and I have to manage it daily. Spasticity in my left hand on bad days. The emotional weight of being the "recovery guy" when sometimes I just want to be Nick.</p>
      <p class="body-text"><strong>What I know for certain:</strong> The people who are still improving at Year 7 are the people who never decided they were done. Not the ones with the most severe injuries. Not the ones with the best doctors. The ones who kept showing up.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">Year 7 Protocol</div>
        <p class="body-text" style="margin:0;">Daily movement. Weekly strength. Monthly video comparison. Community check-in at least twice a week. These are non-negotiables — not because someone told me to, but because this is what keeps the trajectory going up instead of flattening.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/protocols">See the Full Protocol Library</a>
      </div>
      <p class="body-text">You're not behind. You're becoming.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 9 — Day 60 ──────────────────────────────────────────────────────
  {
    editionNumber: 9,
    dayOffset: 60,
    subject: 'Your recovery is someone else\'s only hope.',
    previewText: "Two months in. You're now the proof that wasn't available when you started.",
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"Your recovery is someone else's hope. Don't keep it to yourself."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">Two months ago you signed up for this newsletter. I don't know where you are in your recovery, but I know two months of showing up — even imperfectly — changes something. In your brain, in your habits, or at minimum in how you think about what's possible.</p>
      <p class="body-text">Here's what I want you to sit with today: somewhere right now there's a person who had their stroke three weeks ago. They're lying in a hospital bed or a rehab facility being told a version of what you were told. And they're terrified. And they have no idea that people like you exist.</p>
      <p class="body-text">People who came back. People who kept working. People who built a life that was worth showing up for after a brain injury.</p>
      <p class="body-text">Your story — wherever it is right now — is proof. Not finished proof. Not perfect proof. But real proof. And real proof is the only thing that actually changes someone else's belief about what's possible for them.</p>
      <hr class="divider" />
      <div class="tip-box">
        <div class="tip-label">The Legacy Assignment</div>
        <p class="body-text" style="margin:0;">This week: document something. One video. One post. One honest paragraph about where you started versus where you are now. Post it in the community. Tag it #stillrising. Someone who needs it will find it.</p>
      </div>
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/my-book">Start Writing Your Story</a>
      </div>
      <p class="body-text">The ripple effect of your comeback starts today.</p>
      <p class="body-text">— Nick</p>
    `,
  },

  // ── EDITION 10 — Day 67 ─────────────────────────────────────────────────────
  {
    editionNumber: 10,
    dayOffset: 67,
    subject: 'This is the invitation.',
    previewText: "You've been reading for 67 days. Now I'm asking you to take the next step.",
    // nosemgrep: javascript.lang.security.html-in-template-string
    content: `
      <div class="quote-block">
        <div class="quote-text">"From patient to architect. That's the real recovery."</div>
        <div class="quote-attr">— Nick Kremers</div>
      </div>
      <p class="body-text">You've been on this list for 67 days. In that time I've told you about driving into traffic and choosing one rep instead. I've told you about plateaus that lasted eight months. About caregiver burnout, post-stroke depression, and what Year 7 actually feels like.</p>
      <p class="body-text">I didn't hold back. I don't know how to.</p>
      <p class="body-text">Now I want to ask you to do something.</p>
      <p class="body-text">The 66-Day Sasquatch Transformation Challenge is the structured version of everything I've shared in these emails — with daily missions, weekly check-ins, accountability built in, and a community of people who understand what you're building. It's the thing I wish had existed when I was on the floor at Year 2 not knowing if anything was ever going to change.</p>
      <p class="body-text">Your first 7 days are free. No commitment, no credit card required on day one. Just show up for 7 days and decide for yourself whether this is for you.</p>
      <p class="body-text">If after 7 days it's not for you, we part as friends. No hard feelings, no hard sell. But I think you'll stay. Because the people who've done this challenge don't describe it as an exercise program. They describe it as the first time recovery felt like something they were doing <em>on purpose.</em></p>
      <hr class="divider" />
      <div class="cta-block">
        <a class="cta-btn" href="${BRAND.siteUrl}/recovery/challenge">Start the 66-Day Challenge — 7 Days Free</a>
      </div>
      <p class="body-text" style="text-align:center;font-size:14px;color:${BRAND.muted};">7-day free trial. Built for stroke survivors, caregivers, and anyone who refuses to settle for "good enough."</p>
      <hr class="divider" />
      <p class="body-text">Whether you join the challenge or not — thank you for being on this list. Thank you for reading. Thank you for fighting. You've made it 67 days of showing up. That means something.</p>
      <p class="body-text">Keep swinging. The world is watching. I'm watching. You've got this.</p>
      <p class="body-text">— Nick<br/><em>The Stroked Out Sasquatch</em><br/>Year 7 and counting</p>
    `,
  },
];

// ─── Drip Queue Builder ───────────────────────────────────────────────────────
export async function enrollSubscriberInDrip(subscriberId: number, subscribedAt: Date) {
  const { newsletterDripQueue } = await import('../shared/schema');
  const rows = DRIP_EDITIONS.map((ed) => {
    const scheduledFor = new Date(subscribedAt.getTime() + ed.dayOffset * 24 * 60 * 60 * 1000);
    // Send at 9 AM EST (14:00 UTC)
    scheduledFor.setUTCHours(14, 0, 0, 0);
    return {
      subscriberId,
      editionNumber: ed.editionNumber,
      scheduledFor,
      status: 'pending' as const,
    };
  });
  await db.insert(newsletterDripQueue).values(rows);
}

// ─── Send one drip edition to a subscriber ───────────────────────────────────
async function sendDripEdition(queueId: number, editionNumber: number, email: string, firstName?: string | null) {
  const edition = DRIP_EDITIONS.find((e) => e.editionNumber === editionNumber);
  if (!edition) return;

  const escapedFirstName = firstName
    ? String(firstName).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
    : '';
  const personalizedContent = firstName
    // nosemgrep: javascript.lang.security.html-in-template-string
    ? edition.content.replace('<p class="body-text">Let me start', `<p class="body-text">Hey ${escapedFirstName} — let me start`)
    : edition.content;

  const html = renderEmail({
    previewText: edition.previewText,
    eyebrow: edition.eyebrow,
    headline: edition.headline,
    subheadline: edition.subheadline,
    showBeforeAfter: edition.showBeforeAfter,
    showCrisisCallout: edition.showCrisisCallout,
    bodyHtml: personalizedContent,
  });

  // Route through the unified messaging layer so the drip inherits delivery
  // logging (message_deliveries), the crisis gate, and channel handling. No
  // dedupeKey — the newsletterDripQueue.status transition below is the source of
  // idempotency, so a failed send stays 'pending' and retries next run.
  const dm = await sendMessage({
    userId: null,
    category: 'drip',
    channels: ['email'],
    email: {
      to: email,
      subject: edition.subject,
      html,
      text: `The Sasquatch Dispatch — Edition ${editionNumber}\n\n${edition.previewText}\n\nRead online: ${BRAND.siteUrl}`,
    },
  });
  if (!dm.sent.includes('email')) {
    throw new Error(`drip edition ${editionNumber} not delivered: ${dm.skipped.email || 'unknown'}`);
  }

  const { newsletterDripQueue } = await import('../shared/schema');
  await db.update(newsletterDripQueue).set({ sentAt: new Date(), status: 'sent' }).where(eq(newsletterDripQueue.id, queueId));

  console.log(`[newsletter] Sent drip edition ${editionNumber} to ${redactEmail(email)}`);
}

// ─── Broadcast send ───────────────────────────────────────────────────────────
export async function sendBroadcast(editionId: number): Promise<{ sent: number; failed: number }> {
  const [edition] = await db.select().from(newsletterEditions).where(eq(newsletterEditions.id, editionId));
  if (!edition) throw new Error('Edition not found');

  const subscribers = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, true));
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      // sendEmail resolves with { success:false } on a provider rejection
      // instead of throwing — treat that as a failed delivery, not a send.
      const result = await sendEmail({
        to: sub.email,
        subject: edition.subject,
        html: edition.htmlContent,
        text: edition.textContent || '',
      });
      if (result?.success) {
        sent++;
      } else {
        failed++;
        console.error(`[newsletter] broadcast failed for ${redactEmail(sub.email)}: ${result?.error || 'unknown error'}`);
      }
    } catch (e) {
      console.error(`[newsletter] broadcast threw for ${redactEmail(sub.email)}:`, e);
      failed++;
    }
    // 5 req/s safety throttle
    await new Promise((r) => setTimeout(r, 200));
  }

  await db.update(newsletterEditions)
    .set({ sentAt: new Date(), recipientCount: sent })
    .where(eq(newsletterEditions.id, editionId));

  return { sent, failed };
}

// ─── Recurring work (invoked by the durable scheduler) ───────────────────────
// Sends every drip-queue item that is due. Errors from the query bubble up so
// the scheduler records the failure; per-item send errors are swallowed so one
// bad address doesn't abort the batch.
export async function runNewsletterDrip() {
  const { newsletterDripQueue } = await import('../shared/schema');
  const due = await db
    .select({
      id: newsletterDripQueue.id,
      subscriberId: newsletterDripQueue.subscriberId,
      editionNumber: newsletterDripQueue.editionNumber,
      email: newsletterSubscribers.email,
      firstName: newsletterSubscribers.firstName,
    })
    .from(newsletterDripQueue)
    .innerJoin(newsletterSubscribers, eq(newsletterDripQueue.subscriberId, newsletterSubscribers.id))
    .where(
      and(
        eq(newsletterDripQueue.status, 'pending'),
        lte(newsletterDripQueue.scheduledFor, new Date()),
        eq(newsletterSubscribers.isActive, true)
      )
    );

  if (due.length > 0) {
    console.log(`[newsletter] Processing ${due.length} drip email(s)`);
  }

  for (const item of due) {
    try {
      await sendDripEdition(item.id, item.editionNumber, item.email, item.firstName);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`[newsletter] drip send failed for queue ${item.id}:`, e);
    }
  }
}

// ─── Subscribe helper (called from routes) ────────────────────────────────────
export async function subscribeToNewsletter(email: string, firstName?: string, source = 'website') {
  const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase())).limit(1);

  if (existing.length > 0) {
    if (!existing[0].isActive) {
      // Re-subscribe
      await db.update(newsletterSubscribers).set({ isActive: true, unsubscribedAt: null }).where(eq(newsletterSubscribers.id, existing[0].id));
    }
    return existing[0];
  }

  const [sub] = await db.insert(newsletterSubscribers).values({
    email: email.toLowerCase(),
    firstName: firstName || null,
    source,
    isActive: true,
  }).returning();

  // Enroll in drip sequence immediately
  await enrollSubscriberInDrip(sub.id, sub.subscribedAt);

  return sub;
}
