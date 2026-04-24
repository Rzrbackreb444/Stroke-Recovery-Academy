// Tier 1 SEO landing pages — 14 deep, unique pages drawn from Nick Kremers'
// Sasquatch Method, Recovery University curriculum, and survivor doctrine.
// Each page targets a specific keyword cluster and ships 1500-2500 unique words,
// FAQ schema, internal link clusters, and free-signup CTAs.

import type { SsrPageConfig } from './ssrShell';

const RELATED_LINKS = {
  survivors: { href: '/for/stroke-survivors', label: 'For stroke survivors', blurb: 'Where to start when you\'re the one in recovery.' },
  caregivers: { href: '/for/caregivers', label: 'For caregivers', blurb: 'How to help without burning out.' },
  young: { href: '/for/young-stroke-survivors', label: 'For young survivors', blurb: 'Stroke under 50 — career, kids, identity.' },
  spouses: { href: '/for/spouses', label: 'For spouses', blurb: 'Loving someone who had a stroke.' },
  therapists: { href: '/for/therapists', label: 'For therapists', blurb: 'Use Sasquatch with your patients.' },
  challenge: { href: '/programs/66-day-challenge', label: '66-Day Challenge', blurb: 'The transformation arc.' },
  method: { href: '/programs/sasquatch-method', label: 'The Sasquatch Method', blurb: 'The full doctrine.' },
  routine: { href: '/programs/daily-routine', label: 'Daily Routine', blurb: 'The 5-level system.' },
  neuro: { href: '/learn/neuroplasticity-after-stroke', label: 'Neuroplasticity', blurb: 'How the brain rewires.' },
  hemi: { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Get the weak side back.' },
  exercises: { href: '/learn/stroke-recovery-exercises-at-home', label: 'Home exercises', blurb: 'Real protocols, no equipment.' },
  aphasia: { href: '/learn/aphasia-recovery', label: 'Aphasia recovery', blurb: 'Get speech back.' },
  depression: { href: '/learn/depression-after-stroke', label: 'Depression after stroke', blurb: 'The other half of the recovery.' },
  timeline: { href: '/learn/stroke-recovery-timeline', label: 'Recovery timeline', blurb: 'What to expect, month by month.' },
  centers: { href: '/recovery/center-finder', label: 'Find a recovery center', blurb: 'Centers near you with real reviews.' },
  university: { href: '/recovery/university', label: 'Recovery University', blurb: '7 parts, 33 chapters.' },
  about: { href: '/recovery/about-nick', label: 'About Nick', blurb: 'The 0-to-90% story.' },
};

// ──────────────────────────────────────────────────────────────────────────────
// AUDIENCE PAGES
// ──────────────────────────────────────────────────────────────────────────────

export const PAGE_FOR_SURVIVORS: SsrPageConfig = {
  url: '/for/stroke-survivors',
  title: 'For Stroke Survivors | Sasquatch Method by Nick Kremers',
  description: 'Built by a stroke survivor for stroke survivors. Daily routines, exercises, AI coach, and the 66-day challenge. Start free — no insurance, no waiting list.',
  h1: 'For stroke survivors who are done waiting on someone else to save them.',
  hero: {
    eyebrow: 'For survivors',
    subhead: 'You had the stroke. You woke up. The hospital sent you home with a binder. Now what? Here is the playbook nobody hands out.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
    ctaSecondary: { href: '/recovery/university', label: 'Browse Recovery University' },
  },
  keywords: ['stroke survivor resources', 'stroke recovery program', 'sasquatch method', 'stroke recovery at home'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'For survivors', href: '/for/stroke-survivors' },
  ],
  sections: [
    {
      h2: 'You are not broken. You are early.',
      paragraphs: [
        'Most stroke survivors get told the same lie in slightly different words: "this is your new normal." It is not your new normal. It is your worst day. There is a giant difference between those two sentences.',
        'You had a brain attack. Cells in one zone died. The hospital saved your life — they are good at that. What they are bad at is the next 5 years. Insurance pays for somewhere around 30 days of inpatient rehab and then the door closes. After that, you are the head of your own recovery program. Whether you knew you signed up for that job or not.',
        'Stroke Recovery Academy exists because Nick Kremers had the same stroke you had and refused to accept the binder. Seven years and three thousand hours of self-directed training later, he is at 90% recovery on what doctors thought would be a wheelchair-permanent left side. Same brain attack. Different decision.',
      ],
    },
    {
      h2: 'What you actually get when you sign up',
      paragraphs: [
        'This is not a content library. It is an operating system. The second you create an account you get a personalized daily routine, an AI recovery coach trained on Nick\'s playbook, and a streak tracker that does not care what your therapist said in 2023. It cares what you did today.',
      ],
      bullets: [
        'Recovery University — 7 parts, 33 chapters. The doctrine.',
        'Daily Routine system — 5 levels, automatically calibrated to where you are.',
        '66-Day Challenge — the transformation arc that turns a survivor into a Sasquatch.',
        'Sasquatch Coach — a 24/7 AI companion built on Nick\'s voice.',
        'Survivor community — real survivors. Not a Facebook group full of well-meaning relatives.',
        'Recovery Center Finder — to bridge the gap when you need real human help.',
      ],
    },
    {
      h2: 'Who this is for, and who it is not for',
      paragraphs: [
        'This works for ischemic survivors, hemorrhagic survivors, TIA survivors, brainstem stroke survivors, and post-CABG stroke survivors. It works at month 1 and at year 30. The decision is whether you are willing to put in 30-90 minutes a day on average.',
        'This is not for people who want pity. There are entire forums for that and they are free. This is for people who want their life back and are willing to do the boring, repetitive, sometimes humiliating work it takes to rewire a brain. If that is you, the door is open.',
      ],
    },
    {
      h2: 'What "doing the work" actually looks like',
      paragraphs: [
        'The work is not heroic. It is small, daily, and embarrassing. It is the same finger-curl 80 times in a row while you watch the news. It is saying the same word out loud 100 times because the speech pathologist said so. It is putting weight on a leg that does not want it. It is the third walk of the day when you would rather sit down forever.',
        'Neuroplasticity is the science behind why this works. Repetition + intensity + specificity creates new neural pathways around the dead zone. The brain does not need the dead tissue back. It needs new wiring through the live tissue you still have. The Sasquatch Method gives you the protocol; you supply the reps.',
      ],
    },
    {
      h2: 'Cost, time, and what makes this different',
      paragraphs: [
        'The free tier gets you the daily routine, the streak tracker, the first week of the 66-day challenge, and the AI coach with daily limits. That is enough to know whether this is for you. The Champion tier unlocks the full curriculum, unlimited AI, and the survivor community. There are also caregiver seats, scholarship seats for survivors who cannot pay, and a translation system covering 19 languages.',
        'What makes this different from every other stroke resource on the internet is that it was built by someone who actually had the stroke. Not a doctor with a content team. Not a hospital marketing department. A guy who spent two years thinking he was going to die in a wheelchair and then decided he was not.',
      ],
    },
  ],
  faqs: [
    { q: 'Is this safe if I just had a stroke?', a: 'Talk to your medical team before adding any program. Stroke Recovery Academy is an educational and motivational platform, not medical care. The exercises and protocols are widely recognized but should be cleared by your physiatrist or therapist first.' },
    { q: 'How long until I see progress?', a: 'Most survivors who follow the daily routine 5+ days a week report measurable improvement in 4-8 weeks — usually in grip strength, gait, or speech endurance. Major motor gains often take 3-6 months. Recovery is non-linear; expect setbacks.' },
    { q: 'I am 5+ years post-stroke. Is it too late?', a: 'No. Neuroplasticity works at any age and any time post-stroke. The plateau most survivors hit is a stimulus plateau, not a brain plateau. Change the stimulus, the brain responds.' },
    { q: 'Do I need any equipment?', a: 'No. The base routine uses only your body, a chair, and a wall. Optional add-ons (resistance bands, a small ball, a TENS unit) help but are not required.' },
    { q: 'I cannot afford it. Can I still join?', a: 'Yes. The free tier covers the essentials. We also run a Survivor Scholarship program funded by donors so any survivor who needs full access can request it.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.challenge, RELATED_LINKS.neuro, RELATED_LINKS.timeline, RELATED_LINKS.about],
};

export const PAGE_FOR_CAREGIVERS: SsrPageConfig = {
  url: '/for/caregivers',
  title: 'For Caregivers of Stroke Survivors | Stroke Recovery Academy',
  description: 'A practical playbook for stroke caregivers. How to help without enabling, how to avoid burnout, and the daily routine that actually moves recovery forward.',
  h1: 'You are not the patient. But you are in the war.',
  hero: {
    eyebrow: 'For caregivers',
    subhead: 'Stroke caregivers are the second casualty nobody counts. You sleep less, eat worse, lose friends, and watch the person you love fight a brain that betrayed them. Here is what actually helps.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
    ctaSecondary: { href: '/programs/daily-routine', label: 'See the daily routine' },
  },
  keywords: ['stroke caregiver resources', 'caregiver burnout stroke', 'how to help a stroke survivor', 'caregiver support'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'For caregivers', href: '/for/caregivers' }],
  sections: [
    {
      h2: 'The two mistakes every new caregiver makes',
      paragraphs: [
        'Mistake one: doing too much. You see your survivor struggle to button a shirt and you button it for them. You do this for two months. Their hand never gets the reps it needed. They lose function permanently because love did the work the brain was supposed to do.',
        'Mistake two: doing too little. The opposite ditch. You read a blog post about "tough love" and you stop helping with anything. They fall in the bathroom. Now they are scared and you have a bigger problem than dexterity.',
        'The Sasquatch Method has a phrase for the middle path: scaffolded independence. You do the part of the task they cannot yet do, you keep your hands close, and you let them do the part they can. Every week the part you do shrinks.',
      ],
    },
    {
      h2: 'Burnout is the real enemy',
      paragraphs: [
        'Caregiver burnout has its own symptoms: exhaustion that sleep does not fix, resentment you do not want to admit you feel, weight gain or loss, withdrawal from friends, and a constant low-grade dread. If you are reading that list and nodding, this is normal and it is also dangerous. A caregiver in burnout cannot keep a survivor moving.',
        'The single biggest leverage move is putting the survivor on a self-driven daily routine that does not require you to push every single rep. That is what this platform does. You stop being the alarm clock, the cheerleader, and the timekeeper. The system does that. You get to be a spouse, a parent, a friend again.',
      ],
    },
    {
      h2: 'What to do in the first 30 days at home',
      paragraphs: [
        'Day one home from inpatient is the hardest day of your life. Here is the order of operations:',
      ],
      bullets: [
        'Set up a fall-safe path between bed, bathroom, kitchen, and chair. Remove rugs. Add grab bars.',
        'Get the medication list pinned to the fridge with a checkbox per dose.',
        'Get a primary care follow-up scheduled within 14 days. Do not skip this.',
        'Find an outpatient PT/OT/SLP — even one session a week. Insurance usually covers more than they tell you.',
        'Start a daily routine — even at 10% intensity. Routine first, intensity later.',
        'Tell your circle: "I will accept help in the form of meals on Mondays and Thursdays." Specific asks beat "let me know if you need anything."',
      ],
    },
    {
      h2: 'The hardest conversation: when they want to quit',
      paragraphs: [
        'Sometime around month 3 or month 6, your survivor will say "I am done." They will mean it. Their brain will tell them recovery is not coming. This is not depression in the diagnostic sense — although that is also common — it is the brain doing math with bad numbers.',
        'Your job in that moment is not to argue. Your job is to say "I hear you, today we just do the routine, tomorrow we figure out the bigger question." Then you sit next to them and you do one rep. One. Then another. The Sasquatch Coach inside the platform is built to help with exactly this moment, in their voice when you cannot find your own.',
      ],
    },
    {
      h2: 'The caregiver seat that mirrors their unlocks',
      paragraphs: [
        'Stroke Recovery Academy includes a caregiver seat that mirrors the survivor\'s course unlocks. You see what they see. You can walk through the same lessons, the same exercises, the same protocols. This is not a spying tool. It is so the two of you are in the same playbook instead of you guessing what the therapist said.',
      ],
    },
  ],
  faqs: [
    { q: 'How much should I push my survivor?', a: 'Push the routine, not the outcome. Hold the line on showing up daily. Do not hold the line on hitting specific numbers. The brain rewires from consistency, not from heroism.' },
    { q: 'I am exhausted. How do I keep going?', a: 'Schedule respite before you need it, not after. Even four hours a week with someone else covering lets your nervous system reset. Burnout cannot be fought; it has to be prevented.' },
    { q: 'My survivor refuses to do anything. What do I do?', a: 'Reduce the ask to something so small it is embarrassing to say no. One rep. One word. One step. Compliance compounds. Heroism does not.' },
    { q: 'How do I know if they are depressed vs. just tired?', a: 'Two weeks of hopelessness, loss of interest in formerly-loved things, sleep disruption, or any mention of self-harm needs a doctor immediately. Post-stroke depression is medically treatable and is not a character flaw.' },
    { q: 'Can I get my own account or is it shared?', a: 'You get your own caregiver seat that mirrors their unlocks but tracks your own progress, notes, and daily routine. Two accounts, one playbook.' },
  ],
  related: [RELATED_LINKS.spouses, RELATED_LINKS.depression, RELATED_LINKS.routine, RELATED_LINKS.method, RELATED_LINKS.timeline, RELATED_LINKS.centers],
};

export const PAGE_FOR_YOUNG: SsrPageConfig = {
  url: '/for/young-stroke-survivors',
  title: 'Young Stroke Survivors (Under 50) | Stroke Recovery Academy',
  description: 'Stroke before 50 is different. Career, kids, identity, and a 40-year recovery runway. Built by Nick Kremers, who had his stroke at 35.',
  h1: 'You had a stroke and you are not even 50. Welcome to a fight nobody warned you about.',
  hero: {
    eyebrow: 'For young survivors',
    subhead: 'Doctors will tell you "you\'re young, you\'ll bounce back." That is half-true and entirely unhelpful. Here is the rest.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['young stroke survivor', 'stroke under 50', 'stroke under 40', 'returning to work after stroke', 'stroke and parenting'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'For young survivors', href: '/for/young-stroke-survivors' }],
  sections: [
    {
      h2: 'Why "you\'re young, you\'ll bounce back" is dangerous',
      paragraphs: [
        'Young brains plasticize faster. That is true. But it sets up an expectation that recovery will be easy or quick — and when it is not, young survivors blame themselves. Plenty of young survivors quit at month 9 because they assumed they would be running by month 6.',
        'Recovery for a 35-year-old looks the same as recovery for a 70-year-old in the early months. The advantage shows up in years 2-10, when the young brain is still rewiring while the older brain has slowed. You have a 40-year runway. Use it. Do not blow it on a 12-month sprint.',
      ],
    },
    {
      h2: 'The career question',
      paragraphs: [
        'You will be asked when you are coming back to work. The honest answer is: when your brain can hold a conversation, manage email, and last 6 hours without collapsing. For most cognitive jobs that is month 4-9. For physical jobs it can be year 1-2.',
        'Phased return-to-work is your friend. Two days a week at half-day. Then three days. Then full days. Most employers will work with this if you ask early and put it in writing. Disability law in most countries protects this. Start the FMLA / disability paperwork early — backdating is a nightmare.',
        'And do not be afraid to pivot. A lot of young survivors discover that the job they had was eating them alive even before the stroke, and the stroke is permission to build something different. Stroke Recovery Academy has a Survivor Income module specifically for this.',
      ],
    },
    {
      h2: 'Parenting through a stroke',
      paragraphs: [
        'If you have small kids, the stroke is not just yours — it lives in their childhood. Talk to them at their level. Five-year-olds can understand "Dad\'s brain got hurt and he is doing exercises to help it." Hiding the work is worse than showing it. Kids who watch a parent rebuild themselves learn something irreplaceable.',
        'Teenagers will react differently. Anger is common. Distance is common. Get a family therapist for 4-6 sessions specifically about this — most stroke survivor families wait too long.',
      ],
    },
    {
      h2: 'Dating, marriage, and intimacy',
      paragraphs: [
        'These topics get dodged in every other stroke resource. Stroke survivors have sex lives. Some functions change. Sensation can shift. Erectile dysfunction is common in male survivors. Vaginal dryness and decreased libido is common in female survivors. Most of this is treatable. None of it is shameful. Talk to a stroke-aware urologist or gynecologist; do not just wait for it to fix itself.',
        'If you are single after the stroke, dating gets harder and weirder. Disclose early. Anyone who treats your stroke as a deal-breaker did you a favor.',
      ],
    },
    {
      h2: 'The 40-year game plan',
      paragraphs: [
        'A young survivor who follows a real protocol for 5 years tends to land in a different place than one who hits it hard for 1 year and then drifts. The Sasquatch Method bakes in long-game habits — daily routine, weekly community check-in, monthly skill review, annual retest. The 66-Day Challenge is the entry ramp; the daily routine is the runway.',
      ],
    },
  ],
  faqs: [
    { q: 'Will I be able to drive again?', a: 'Most young survivors get back to driving within 6-12 months after passing a driving evaluation, often with hand controls or other adaptations. Get the eval — do not just self-clear.' },
    { q: 'Can I have kids after a stroke?', a: 'Yes, in most cases. Pregnancy after stroke needs careful planning with a high-risk OB and a stroke neurologist, especially if your stroke had a clotting cause.' },
    { q: 'I had my stroke during pregnancy. Is that common?', a: 'About 30 per 100,000 pregnancies involve some form of stroke or related event. Rare, but enough that there are specialists. Find one.' },
    { q: 'Will my career be over?', a: 'In most cases, no — but it may look different. Cognitive recovery often outpaces physical recovery, which is good news for knowledge workers and bad news for trades. Reskilling is real and viable.' },
    { q: 'Should I tell employers about my stroke?', a: 'You are not legally required to disclose in most jurisdictions, but if you need accommodations, disclosure is what unlocks them. Talk to an employment lawyer if you are unsure.' },
  ],
  related: [RELATED_LINKS.survivors, RELATED_LINKS.spouses, RELATED_LINKS.depression, RELATED_LINKS.method, RELATED_LINKS.timeline, RELATED_LINKS.about],
};

export const PAGE_FOR_SPOUSES: SsrPageConfig = {
  url: '/for/spouses',
  title: 'For Spouses of Stroke Survivors | Stroke Recovery Academy',
  description: 'You did not have the stroke but it changed your life. A guide for spouses navigating identity, intimacy, and the long arc of recovery together.',
  h1: 'You did not have the stroke. It still happened to you.',
  hero: {
    eyebrow: 'For spouses',
    subhead: 'Marriages survive stroke. Most do. But not by accident. Here is what the research, the survivors, and the spouses themselves say works.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['spouse of stroke survivor', 'stroke marriage', 'stroke and relationships', 'caregiver spouse'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'For spouses', href: '/for/spouses' }],
  sections: [
    {
      h2: 'The relationship had a stroke too',
      paragraphs: [
        'You are not the patient and you are not "just" a caregiver. You are the person who slept in the chair next to the hospital bed, who learned to give injections, who relearned what their voice sounds like at 3am. Your nervous system took a hit. Your identity inside the marriage took a hit. None of that gets a billing code.',
        'The single most useful frame: your marriage had a stroke. The relationship needs its own rehab program — separate from theirs.',
      ],
    },
    {
      h2: 'Roles will scramble. That is normal.',
      paragraphs: [
        'If they handled the finances, you handle the finances now. If you cooked and they cleaned, that may swap. If they were the planner and you were the doer, you are about to be both. The temptation is to grit your teeth and absorb everything. Do not. The roles you absorb in months 1-6 are the roles you will be stuck with at year 5 unless you actively redistribute.',
        'Schedule a weekly 30-minute "ops meeting" specifically about who does what. Treat it like a startup meeting. Unsentimental. Two people running a household.',
      ],
    },
    {
      h2: 'Intimacy after stroke',
      paragraphs: [
        'Sex changes after stroke. Sometimes a lot, sometimes a little. Hemiplegia changes positioning. Erectile dysfunction is common in male survivors. Vaginal sensation can shift. Libido often drops because of medication, depression, or fatigue. None of this is the end of the relationship; all of it is medical and most of it is treatable.',
        'The deeper intimacy question is psychological. The survivor often feels less attractive, less competent, less themselves. The spouse often feels guilty for wanting normal physical intimacy with someone who is in pain. Both are normal. Talking about it directly — out loud, in words — is what gets you through. A sex-positive therapist who has worked with disability is worth their weight.',
      ],
    },
    {
      h2: 'When you grieve the person they were',
      paragraphs: [
        'Some traits will come back. Some will not. The patient who was the life of every party may now be quiet and tired. The athlete may not run again. The chef may not cook the way they used to. You grieve those things even though they are still alive. That is called ambiguous loss and it is one of the hardest griefs there is.',
        'You are allowed to mourn the previous version of your spouse. You are also obligated to fall in love with the version sitting next to you. Both of those things are true at the same time.',
      ],
    },
    {
      h2: 'Two accounts, one playbook',
      paragraphs: [
        'Stroke Recovery Academy includes a caregiver seat that mirrors your spouse\'s course unlocks. You walk through the same lessons. You see what they see. You discuss the chapters together. This is not optional reading. This is the marriage rehab program.',
      ],
    },
  ],
  faqs: [
    { q: 'How long until things feel normal again?', a: 'A new normal usually takes 18-36 months. The marriages that do best are the ones that stop chasing the old normal and intentionally build the new one.' },
    { q: 'My spouse is angry all the time. What do I do?', a: 'Post-stroke emotional dysregulation is real and is often medical, not character. A neuropsych evaluation can identify treatable causes. Do not assume anger is "who they are now."' },
    { q: 'Should we go to therapy?', a: 'Yes. Look for a therapist with experience in chronic illness or disability. Eight sessions is usually enough to install the basics; many couples come back periodically.' },
    { q: 'I am thinking about leaving. Is that wrong?', a: 'No, it is human. Talk to a therapist before making the decision. Many spouses who consider leaving in year 1 are glad they stayed by year 3 — but staying out of guilt alone is a slow disaster.' },
    { q: 'How do I take care of myself without feeling selfish?', a: 'You cannot pour from an empty cup. Pick three non-negotiable self-care anchors per week and defend them. Your spouse needs you sustainable, not heroic.' },
  ],
  related: [RELATED_LINKS.caregivers, RELATED_LINKS.survivors, RELATED_LINKS.depression, RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.about],
};

export const PAGE_FOR_THERAPISTS: SsrPageConfig = {
  url: '/for/therapists',
  title: 'For PT, OT, and SLP Working With Stroke Survivors',
  description: 'Use the Sasquatch Method with your patients. A between-session protocol designed by a survivor that increases compliance and home-program follow-through.',
  h1: 'A between-session program your stroke patients will actually do.',
  hero: {
    eyebrow: 'For clinicians',
    subhead: 'You write the home exercise plan. They go home and do 14% of it. Stroke Recovery Academy is the operating system that closes the gap.',
    ctaPrimary: { href: '/api/login', label: 'Get a free clinician account' },
  },
  keywords: ['stroke rehabilitation therapist', 'home exercise program stroke', 'stroke patient compliance', 'PT OT SLP stroke'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'For therapists', href: '/for/therapists' }],
  sections: [
    {
      h2: 'The compliance gap',
      paragraphs: [
        'The literature on home exercise program adherence in stroke is brutal. Various studies put compliance at 12-35% by week 8. Without compliance, the gains you build in your hour-a-week clinic visit evaporate by Friday. You already know this.',
        'Stroke Recovery Academy is not a clinical replacement and does not pretend to be. It is the connective tissue between sessions: a survivor-voiced daily routine, a streak tracker, an AI coach that nudges, and a curriculum that explains the "why" so patients buy in instead of going through the motions.',
      ],
    },
    {
      h2: 'How the platform maps to your protocols',
      paragraphs: [
        'The Sasquatch Method is built around four pillars that align with established stroke rehabilitation practice: high-repetition task-specific training, intensity progression, bilateral integration, and constraint-induced movement principles. The Daily Routine engine assigns levels (1-5) that you can map to your patient\'s functional stage.',
        'The exercise library covers gait, fine motor, gross motor, balance, vision, swallowing, and speech endurance. Each exercise has a written cue, a video, a target rep range, and a survivor-tested "why this matters" framing. Patients can log completion; you can request access to their summary in the consent flow.',
      ],
    },
    {
      h2: 'The behavioral architecture',
      paragraphs: [
        'Compliance is a behavior problem, not an information problem. Most home programs fail because they are a printed PDF with no feedback loop. The platform installs three behavioral hooks proven to increase adherence: a daily streak (loss aversion), a community check-in (accountability), and a coach voice that survivors recognize as one of their own (peer authority).',
      ],
    },
    {
      h2: 'How to recommend it to a patient',
      paragraphs: [
        'Most clinicians give the URL at discharge or at the third visit. The most effective frame is "this is the system I want you using on the days I do not see you." Pair it with one specific exercise from the library that maps to a goal on their plan of care. That single hand-off doubles uptake compared to a generic "check this out."',
      ],
    },
    {
      h2: 'Cost, privacy, and clinician accounts',
      paragraphs: [
        'A clinician account is free. Patients sign up under their own free account; you do not see their data unless they share it. Survivor Scholarship covers patients who cannot afford the paid tier. The platform is HIPAA-aware: it does not store PHI, does not function as a medical record, and is positioned as patient education and motivation, not care.',
      ],
    },
  ],
  faqs: [
    { q: 'Is this a CPT-billable resource?', a: 'No. It is a between-session education and adherence platform, not a billable service. It supports your billable services.' },
    { q: 'Can I customize the routine for my patient?', a: 'Patients can customize. Direct clinician overrides are on the roadmap. For now, you can recommend specific exercises by linking to them.' },
    { q: 'Does it replace therapy?', a: 'No. It is built to extend therapy, not replace it. Every page surfaces the Center Finder so patients can locate clinical care.' },
    { q: 'Who built it?', a: 'Nick Kremers, a 7-year stroke survivor at 90% recovery. The Sasquatch Method draws on his lived experience plus the established rehabilitation literature. It is not a substitute for clinical judgment.' },
    { q: 'How do I sign up?', a: 'Create a free account at the link above and email support to request the clinician flag. We are still building out clinic dashboards; reach out if you want early access.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.exercises, RELATED_LINKS.hemi, RELATED_LINKS.aphasia, RELATED_LINKS.timeline, RELATED_LINKS.centers],
};

// ──────────────────────────────────────────────────────────────────────────────
// PROGRAM PAGES
// ──────────────────────────────────────────────────────────────────────────────

export const PAGE_66_DAY: SsrPageConfig = {
  url: '/programs/66-day-challenge',
  title: '66-Day Sasquatch Challenge | Stroke Recovery Transformation',
  description: '66 days is what it takes to install a habit and rewire a routine. The Sasquatch Challenge is the transformation arc for stroke survivors. Free to start.',
  h1: 'The 66-Day Sasquatch Challenge.',
  hero: {
    eyebrow: 'Programs',
    subhead: 'Sixty-six days is the median time it takes a behavior to become automatic. This is the program that turns "I should be doing my exercises" into "I am the kind of survivor who does this."',
    ctaPrimary: { href: '/api/login', label: 'Join the challenge' },
    ctaSecondary: { href: '/programs/sasquatch-method', label: 'Read the Method' },
  },
  keywords: ['66 day stroke challenge', 'stroke recovery challenge', 'stroke habit transformation', 'sasquatch challenge'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Programs', href: '/programs/sasquatch-method' }, { name: '66-Day Challenge', href: '/programs/66-day-challenge' }],
  sections: [
    {
      h2: 'Why 66 days, specifically',
      paragraphs: [
        'A 2009 study by Phillippa Lally at University College London tracked 96 people forming new habits and found the average automaticity threshold landed at 66 days. Some habits installed faster (20-30 days). Some took longer (up to 254 days). 66 is the median, and it is the right rallying number for a recovery program.',
        'For stroke survivors, the math is different than for the general population. The brain is not just installing a habit. It is laying neural cabling around dead tissue. Every consistent rep is a deposit in a savings account that pays interest in motor function. By day 66 you have made roughly 200 deposits. That is the threshold where most survivors report a step-change.',
      ],
    },
    {
      h2: 'What the 66 days look like',
      paragraphs: [
        'The challenge is structured into three arcs: Foundation (days 1-22), Build (days 23-44), and Forge (days 45-66). Each arc has a specific focus, escalating intensity, and a checkpoint at the end. The platform automatically progresses you; you do not have to think about which day you are on.',
      ],
      bullets: [
        'Days 1-22 (Foundation): Daily routine, basic mobility, gentle cardio, the doctrine in Recovery University Part 1-2.',
        'Days 23-44 (Build): Compound movements, dual-task drills, speech endurance, doctrine Part 3-4, first community share.',
        'Days 45-66 (Forge): Loaded movement, complex motor patterns, mental gymnastics, doctrine Part 5-7, the final ritual.',
      ],
    },
    {
      h2: 'The streak, the rules, and the comeback rule',
      paragraphs: [
        'You log one check-in per day to keep your streak. Miss a day, the streak resets — but the comeback rule says any survivor who missed for medical reasons (illness, hospital, mental health) can request a one-time pardon and keep their streak. We are not interested in punishing humans for being human.',
        'The check-in is not "did you crush it." It is "did you show up." Showing up looks different on bad days than good days, and the platform does not care which it was. Show up, log the check, keep the chain.',
      ],
    },
    {
      h2: 'What survivors report after finishing',
      paragraphs: [
        'The most common reports at day 66 are: measurable gain in either grip, gait, or speech endurance; a daily routine that runs on autopilot; a community of people who text each other on hard days; and the deep, slightly-cocky confidence that comes from finishing something hard. The cocky part is on purpose. Earned.',
      ],
    },
    {
      h2: 'How to start (and what it costs)',
      paragraphs: [
        'The challenge is free to begin. The first arc (days 1-22) is fully unlocked at the free tier. Days 23-66 unlock when you upgrade to the Warrior or Champion tier. If you cannot afford the upgrade, request a Survivor Scholarship — there is no shame in it. We have donors who specifically fund those.',
      ],
    },
  ],
  faqs: [
    { q: 'Can I start the challenge mid-recovery?', a: 'Yes. The challenge calibrates to your starting level. Day 1 for someone six months post-stroke looks different than day 1 for a five-year survivor.' },
    { q: 'What if I miss a day?', a: 'Your streak resets. You restart the day you missed and keep going. The comeback rule covers medical absences.' },
    { q: 'How much time per day?', a: '30-90 minutes depending on your level. Level 1 is 30 minutes; Level 5 is closer to 90 spread across the day.' },
    { q: 'Do I need a coach or therapist?', a: 'Strongly recommended but not required. The challenge is built to be runnable by a motivated survivor with internet access.' },
    { q: 'What happens after day 66?', a: 'You graduate to the Sasquatch Method daily routine — the long-game protocol. Many survivors run another 66-day cycle with a new focus (e.g., a Speech 66 or a Walking 66).' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.neuro, RELATED_LINKS.exercises, RELATED_LINKS.timeline, RELATED_LINKS.university],
};

export const PAGE_METHOD: SsrPageConfig = {
  url: '/programs/sasquatch-method',
  title: 'The Sasquatch Method | Stroke Recovery Doctrine by Nick Kremers',
  description: 'The full doctrine of the Sasquatch Method — the four pillars Nick Kremers used to go from complete paralysis to 90% recovery in seven years.',
  h1: 'The Sasquatch Method.',
  hero: {
    eyebrow: 'Doctrine',
    subhead: 'The four pillars Nick used to recover 90% from a stroke that left him paralyzed on his left side. Built in the trenches. No fluff.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
    ctaSecondary: { href: '/recovery/university', label: 'Open Recovery University' },
  },
  keywords: ['sasquatch method', 'stroke recovery method', 'nick kremers stroke', 'stroke recovery doctrine'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Programs', href: '/programs/sasquatch-method' }],
  sections: [
    {
      h2: 'Pillar 1 — Never Zero',
      paragraphs: [
        'Never Zero means you never log a day with zero reps. Bad day? One rep. Sick? One rep. Brain fog? One rep. The point is not the rep, it is the chain. The chain is what builds the identity. The identity is what builds the recovery.',
        'Most stroke survivors quit because they think missing a day is failure. Missing a day is normal. Missing seven in a row is the start of the slide. Never Zero blocks day two of any slide before it gets traction.',
      ],
    },
    {
      h2: 'Pillar 2 — Specificity Over Volume',
      paragraphs: [
        'Doing 500 random exercises is a worse use of your time than doing 50 of the right exercise. Specificity is the principle that the brain rewires for the specific task you practice. You want to walk? Practice walking. You want to grip? Practice gripping the actual object you want to grip — the toothbrush, the steering wheel, the hand of your spouse.',
        'The Sasquatch Method assigns task-specific drills tied to functional goals. You do not "exercise the arm." You practice the thing you want the arm to do.',
      ],
    },
    {
      h2: 'Pillar 3 — Intensity Progression',
      paragraphs: [
        'The brain rewires from challenge, not from comfort. Once a movement becomes easy, it stops driving plasticity. The Sasquatch Method progresses intensity in three ways: more reps, more resistance, and more complexity. The platform engine handles this automatically based on your check-ins.',
        'Most home programs plateau because they never progress. They give you the same 10 exercises forever. The Method assumes you are getting stronger and asks for more, every two weeks.',
      ],
    },
    {
      h2: 'Pillar 4 — Identity Before Outcome',
      paragraphs: [
        'You do not chase the goal of "walking again." You become the kind of person who does the work that walking again requires. Identity-based change is the difference between motivation that lasts six weeks and identity that lasts six years.',
        'The 66-Day Challenge is the entry ramp into this identity. The Daily Routine is the runway. The community is the air traffic control. The Sasquatch is the destination — slow, patient, deliberate, hard to kill.',
      ],
    },
    {
      h2: 'How the four pillars get installed',
      paragraphs: [
        'You do not have to memorize the four pillars. You install them by following the system. Sign up. Open the dashboard. Do the daily routine. Log the check-in. Read one chapter of Recovery University per week. Show up in the community once a week. The pillars get installed by the structure of the program.',
      ],
    },
  ],
  faqs: [
    { q: 'Is the Sasquatch Method evidence-based?', a: 'It draws heavily on established stroke rehabilitation principles — task-specific training, neuroplasticity, constraint-induced therapy, intensity progression. The framing and voice are Nick\'s. The principles are well-supported in the literature.' },
    { q: 'Why "Sasquatch"?', a: 'Slow, patient, deliberate, hard to kill, leaves a footprint. That is what surviving and recovering from a stroke takes.' },
    { q: 'Can I do it without the platform?', a: 'You could in theory, but the daily structure, AI coach, and community are what make it stick. Most survivors who tried to "just read the doctrine" never installed the habits.' },
    { q: 'What makes it different from PT?', a: 'PT is a clinical service for one hour a week. The Sasquatch Method is a 24/7 operating system for the other 167 hours.' },
    { q: 'How long until I see results?', a: 'Most survivors who run the Method 5+ days a week report measurable gains by week 6-8 and identity-level change by month 4-6.' },
  ],
  related: [RELATED_LINKS.challenge, RELATED_LINKS.routine, RELATED_LINKS.university, RELATED_LINKS.neuro, RELATED_LINKS.about, RELATED_LINKS.survivors],
};

export const PAGE_DAILY_ROUTINE: SsrPageConfig = {
  url: '/programs/daily-routine',
  title: 'The Daily Routine for Stroke Recovery | 5-Level System',
  description: 'A 5-level daily routine system for stroke survivors. Calibrated to your stage, escalates automatically, and runs on a streak engine that keeps you honest.',
  h1: 'The Daily Routine. Five levels. Built to scale with you.',
  hero: {
    eyebrow: 'Programs',
    subhead: 'The single biggest predictor of recovery is whether you do something every day. The Daily Routine is the system that makes "every day" actually happen.',
    ctaPrimary: { href: '/api/login', label: 'Start your routine' },
  },
  keywords: ['stroke daily routine', 'daily exercise stroke', 'stroke recovery schedule', 'home program stroke'],
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Programs', href: '/programs/sasquatch-method' }, { name: 'Daily Routine', href: '/programs/daily-routine' }],
  sections: [
    {
      h2: 'The five levels at a glance',
      paragraphs: [
        'Level 1 is for survivors in early recovery, in a wheelchair, or with severe fatigue. 30 minutes total spread across the day. Level 5 is for survivors deep into recovery who are training to push the ceiling. 90+ minutes with compound, complex, dual-task work.',
      ],
      bullets: [
        'Level 1 (Foundation): 30 min/day. Range of motion, breathwork, seated balance, vision drills.',
        'Level 2 (Standing): 45 min/day. Standing transfers, single-leg balance, light grip work, reading aloud.',
        'Level 3 (Walking): 60 min/day. Gait drills, stair work, fine motor sequences, dual-task cognitive load.',
        'Level 4 (Loaded): 75 min/day. Resistance training, complex motor patterns, endurance walks, sustained speech.',
        'Level 5 (Push): 90+ min/day. Athletic drills, problem-solving under fatigue, advanced motor planning.',
      ],
    },
    {
      h2: 'How calibration works',
      paragraphs: [
        'You do not pick your level. The intake quiz assigns one based on your post-stroke time, current functional level, and energy budget. Every two weeks the platform asks if the current level feels too easy, just right, or punishing — and adjusts.',
        'You can also manually change. Some days you will need a level down because you barely slept. The platform respects that. The streak survives the regression.',
      ],
    },
    {
      h2: 'The shape of a typical day',
      paragraphs: [
        'A Level 3 day looks roughly like this: morning 20-minute mobility block while coffee brews, midday 15-minute walking and stair drill, afternoon 15-minute fine-motor work (buttoning shirts, picking up coins, threading), evening 10-minute breath and stretch. None of it requires you to leave the house. None of it requires equipment.',
        'The point is not to do it all in one block. The point is to spread the stimulus across the day so the brain stays in a "we are training" mode for hours instead of just one window.',
      ],
    },
    {
      h2: 'The streak engine, the comeback rule, and pardons',
      paragraphs: [
        'Every day you log a check-in, the streak ticks up. The longest current streak is displayed on your dashboard so you cannot pretend it is not happening. Miss a day, the streak resets to zero. The comeback rule covers medical absences (illness, hospital, mental health crisis) — request a pardon and you keep your streak.',
        'Pardons are not unlimited and they are not for "I did not feel like it." They are for "my body would not let me." The community polices this honestly because everyone has been in both situations.',
      ],
    },
    {
      h2: 'Why this beats a printed PDF',
      paragraphs: [
        'Most home exercise programs from outpatient clinics are printed PDFs. Compliance with printed PDFs in stroke is roughly 12-30% by week 8. The Daily Routine engine inverts this through three mechanisms: the streak (loss aversion), the AI coach (real-time nudge), and the community (accountability). Survivors who run it report adherence in the 70-85% range at month 6.',
      ],
    },
  ],
  faqs: [
    { q: 'How long until the routine becomes automatic?', a: 'For most survivors, around day 30-45. For some it is faster, for some slower. The Lally study median is 66 days, which is also the length of the 66-Day Challenge.' },
    { q: 'Can I skip days for travel?', a: 'Yes. Use a pardon for genuine travel days that disrupt your schedule. Most survivors find that Level 1 of the routine is doable in a hotel room with no equipment.' },
    { q: 'Does the routine include speech and cognitive work?', a: 'Yes. Levels 2-5 include speech endurance and cognitive dual-task drills. The Aphasia track is a deeper specialization for survivors who need it.' },
    { q: 'What if I am still in inpatient rehab?', a: 'Talk to your team. The platform is designed for post-discharge but many survivors begin the doctrine reading and the AI coach while still inpatient.' },
    { q: 'Will my therapist endorse this?', a: 'Most do. The protocols are conventional. The behavioral architecture is the differentiator. Send your therapist the For Therapists page if they want details.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.challenge, RELATED_LINKS.exercises, RELATED_LINKS.hemi, RELATED_LINKS.timeline, RELATED_LINKS.therapists],
};

// ──────────────────────────────────────────────────────────────────────────────
// LEARN PAGES (HEAD KEYWORD TARGETS)
// ──────────────────────────────────────────────────────────────────────────────

export const PAGE_NEUROPLASTICITY: SsrPageConfig = {
  url: '/learn/neuroplasticity-after-stroke',
  title: 'Neuroplasticity After Stroke | How the Brain Rewires Itself',
  description: 'How neuroplasticity actually works after a stroke, what science says about recovery windows, and the protocols that drive measurable rewiring.',
  h1: 'Neuroplasticity after stroke: how the brain actually rewires.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'The single most important word in stroke recovery — and the one most survivors hear without ever being told what it actually means.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['neuroplasticity after stroke', 'brain rewiring stroke', 'neuroplasticity exercises', 'stroke recovery brain'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/neuroplasticity-after-stroke' }, { name: 'Neuroplasticity', href: '/learn/neuroplasticity-after-stroke' }],
  sections: [
    {
      h2: 'What neuroplasticity actually is',
      paragraphs: [
        'Neuroplasticity is the brain\'s ability to change its structure and function in response to experience. After a stroke, this is the entire ballgame. The dead tissue in the infarct is gone — it does not regenerate. But the surrounding tissue (the penumbra) and the rest of the brain can rewire to take over the jobs the dead zone used to do.',
        'Three things drive plasticity: repetition, intensity, and specificity. Without all three, no rewiring. With all three, rewiring is more or less inevitable. Time and age modulate the rate, not the existence.',
      ],
    },
    {
      h2: 'The myth of the 6-month window',
      paragraphs: [
        'You may have been told most recovery happens in the first 6 months. The data is more nuanced than that. Spontaneous recovery — the rebound that happens with no intervention — does cluster in the first 90-180 days. Driven recovery, the kind that comes from disciplined rehabilitation, has no such window. Studies show measurable gains years and even decades after stroke when survivors hit the right protocol.',
        'Telling a survivor "you have plateaued" at 8 months is not a clinical observation. It is a description of the resources insurance is willing to pay for. The brain did not plateau. The funding plateaued.',
      ],
    },
    {
      h2: 'Three mechanisms that drive rewiring',
      paragraphs: [
        'Mechanism one: dendritic sprouting. Neurons grow new connections to neighboring cells. Mechanism two: synaptic strengthening. Existing connections become more efficient through repeated firing. Mechanism three: cortical remapping. Whole regions of the brain shift their function — somatosensory cortex can take over for damaged motor cortex, for example.',
        'All three mechanisms respond to the same input: doing the thing you want to get better at, with high reps, at a level of challenge that requires effort.',
      ],
    },
    {
      h2: 'Why "use it or lose it" is literal',
      paragraphs: [
        'The brain is brutally efficient. Pathways that are not used get pruned. This is why the affected side of a stroke survivor often gets weaker over time even without further injury — a phenomenon called learned non-use. The good side compensates so well that the bad side stops getting any reps, and the brain assumes those circuits are no longer needed.',
        'Constraint-induced movement therapy attacks this directly: temporarily restrain the strong side and force the weak side to work. The Sasquatch Method bakes constraint principles into the daily routine without requiring full restraint.',
      ],
    },
    {
      h2: 'Protocols that actually drive plasticity',
      paragraphs: [
        'The protocols with the strongest evidence base are constraint-induced movement therapy, task-specific repetitive training, mirror therapy, mental practice, and bilateral arm training. The Sasquatch Method daily routine integrates all five at appropriate levels.',
        'Aerobic exercise is also a plasticity driver — it increases brain-derived neurotrophic factor (BDNF), the molecule that fertilizes new connections. Walking 20-30 minutes a day at a moderate pace is one of the most underrated stroke recovery interventions.',
      ],
    },
    {
      h2: 'How to know your brain is rewiring',
      paragraphs: [
        'You will not feel the rewiring directly. You will feel the result: a movement that took five seconds now takes three; a word you could not find yesterday surfaces today; an exercise that exhausted you last month is your warm-up this month. Plasticity is invisible while it happens and obvious when you look back.',
        'Track progress monthly, not daily. Daily readings are too noisy. Monthly snapshots show the curve.',
      ],
    },
  ],
  faqs: [
    { q: 'Can neuroplasticity work years after a stroke?', a: 'Yes. The literature now contains many examples of meaningful gains 5, 10, even 20 years post-stroke when the right stimulus is applied with sufficient intensity and duration.' },
    { q: 'Does my age matter?', a: 'Younger brains plasticize faster, but older brains plasticize. Older survivors should not be talked out of trying. The Sasquatch Method is used by survivors in their 70s and 80s with measurable results.' },
    { q: 'Are there drugs that boost neuroplasticity?', a: 'Some research is promising — selective serotonin reuptake inhibitors (SSRIs), modafinil, and amphetamines have been studied for adjunct use. Talk to your stroke neurologist; do not self-prescribe.' },
    { q: 'Will my brain ever be the same?', a: 'No, and that is not the goal. The goal is a brain that does the things you need it to do. Different wiring, same outcome.' },
    { q: 'How does sleep affect neuroplasticity?', a: 'Sleep is when most consolidation happens. A survivor who skips sleep is a survivor who undoes the day\'s gains. Protect 7-9 hours like it is part of the routine — because it is.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.exercises, RELATED_LINKS.hemi, RELATED_LINKS.timeline, RELATED_LINKS.routine, RELATED_LINKS.aphasia],
};

export const PAGE_HEMIPARESIS: SsrPageConfig = {
  url: '/learn/hemiparesis-recovery',
  title: 'Hemiparesis Recovery After Stroke | Get the Weak Side Back',
  description: 'How to recover hemiparesis after stroke. Daily protocols, constraint-induced principles, and the long-game strategy that gets the weak side functional.',
  h1: 'Hemiparesis recovery: getting the weak side back.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'Half your body works. The other half is on strike. Here is how to get it back to work.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['hemiparesis recovery', 'stroke weak side', 'hemiplegia stroke', 'left side weakness stroke'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/hemiparesis-recovery' }],
  sections: [
    {
      h2: 'Hemiparesis vs hemiplegia: what you actually have',
      paragraphs: [
        'Hemiparesis is partial weakness on one side of the body. Hemiplegia is complete paralysis on one side. Most stroke survivors who hear "hemiplegia" early actually end up with hemiparesis as the dead zone settles and the surrounding tissue takes over. Either way, the rehab path is the same in shape.',
        'The affected side is on the opposite side of the brain that had the stroke. Right-brain stroke = left-side weakness. Left-brain stroke = right-side weakness. Left-brain strokes also often hit the speech centers, so they come bundled with aphasia in many cases.',
      ],
    },
    {
      h2: 'Why the weak side gets weaker over time (learned non-use)',
      paragraphs: [
        'Your brain is efficient. If the strong side can do a task, the brain stops sending signals to the weak side. Within months, the weak side gets even weaker because it is essentially being told to retire. This is called learned non-use, and it is the single biggest reversible problem in hemiparesis recovery.',
        'The fix is to deliberately make the strong side do less and force the weak side into action. Constraint-induced movement therapy is the formal protocol; the Sasquatch Method has a less-rigid version that works in daily life.',
      ],
    },
    {
      h2: 'The four-phase recovery arc',
      paragraphs: [
        'Phase one (flaccid): the limb has no tone. Weeks 1-4 typically. Goal: maintain joint integrity and prevent shortening through passive range of motion.',
        'Phase two (spasticity emerging): tone returns, often unhelpfully. Weeks 4-12. Goal: manage tone, begin gentle active movement, manage stretch.',
        'Phase three (volitional movement): coarse purposeful movement returns. Months 3-12. Goal: high-rep task-specific training, build coordination.',
        'Phase four (refinement): fine motor and integration. Year 1+. Goal: complex tasks, dual-task drills, real-world function.',
      ],
    },
    {
      h2: 'Daily protocols that actually move the needle',
      paragraphs: [
        'Mirror therapy — watching the strong side move in a mirror placed in front of the affected side — has surprisingly strong evidence for upper-limb hemiparesis. 20 minutes a day, daily.',
        'Mental practice — visualizing the affected limb performing a task in detail — also drives plasticity, especially when paired with attempted movement. 10 minutes before any active session.',
        'Bilateral training — both arms doing the same task simultaneously — uses inter-hemispheric coupling to recruit the affected side. Sword-stroking with both hands, drumming with both hands, scrubbing a counter with both hands.',
        'Task-specific repetition — 80-300 reps of the actual task you want to recover. Buttoning shirts. Cutting food. Picking up coins. Brushing teeth.',
      ],
    },
    {
      h2: 'Walking and gait specifically',
      paragraphs: [
        'Most hemiparesis survivors get walking back. Speed and quality vary. The single biggest predictor is whether you walked daily for the first year, ugly or pretty. Survivors who waited for "good walking" never got it; survivors who walked badly six times a day became fluent walkers by year two.',
        'Gait drills, stair work, uneven-surface practice, and treadmill walking with a partial body-weight harness if available are all in the playbook. Get a physical therapist to set the foundation; the daily routine maintains and progresses it.',
      ],
    },
    {
      h2: 'Spasticity, not the boss of you',
      paragraphs: [
        'Spasticity makes muscles tight, often painfully. It is the brain over-firing because it lost the inhibitory pathway. Botulinum toxin injections in spastic muscles, paired with intensive stretching, can buy a window of months where the limb is more usable. Use the window for high-rep training; do not just enjoy the relief and stop training.',
      ],
    },
  ],
  faqs: [
    { q: 'How long until my arm comes back?', a: 'Most upper-limb gains happen between months 3 and 18 with consistent training. Some survivors see meaningful arm recovery years out when they finally apply the right protocol.' },
    { q: 'Should I ignore the affected side and use my strong side?', a: 'No. That is the path to learned non-use. Force the affected side into use, even badly, even slowly. The Sasquatch Method routine is built around this.' },
    { q: 'Will electrical stimulation help?', a: 'Functional electrical stimulation (FES) and TENS units can help during the rehab phase. They are adjuncts, not substitutes for active practice.' },
    { q: 'My hand is still in a fist. Can it open?', a: 'Often, yes — with a combination of botulinum toxin to release the spasticity and intensive practice to recapture function. Talk to a physiatrist about the combined approach.' },
    { q: 'I am 5 years out. Is recovery still possible?', a: 'Yes. The literature contains many cases of meaningful gain 5-15 years post-stroke when the right protocol is applied with intensity. Plateau is a stimulus problem, not a brain problem.' },
  ],
  related: [RELATED_LINKS.neuro, RELATED_LINKS.exercises, RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.timeline, RELATED_LINKS.aphasia],
};

export const PAGE_HOME_EXERCISES: SsrPageConfig = {
  url: '/learn/stroke-recovery-exercises-at-home',
  title: 'Stroke Recovery Exercises at Home | No Equipment Needed',
  description: 'Real stroke recovery exercises you can do at home, no equipment. Upper limb, lower limb, balance, and speech protocols built by a survivor.',
  h1: 'Stroke recovery exercises you can do at home, today.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'No equipment, no insurance pre-auth, no waiting list. Just protocols you can run from your living room starting in the next 10 minutes.',
    ctaPrimary: { href: '/api/login', label: 'Get the full exercise library' },
  },
  keywords: ['stroke exercises at home', 'home stroke recovery', 'stroke exercises no equipment', 'stroke rehabilitation exercises'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/stroke-recovery-exercises-at-home' }],
  sections: [
    {
      h2: 'Before you start: the rules',
      paragraphs: [
        'Talk to your therapist or physiatrist before adding any program. The exercises below are conventional and widely used but the order, dose, and intensity should be cleared by someone who can see you in person.',
        'Three universal rules: stop if anything sharp hurts, build slowly (10% increase in any variable per week), and prioritize quality over speed. Sloppy reps install sloppy patterns.',
      ],
    },
    {
      h2: 'Upper limb: arm, hand, fingers',
      paragraphs: [
        'Shoulder shrugs and rolls — 2 sets of 15. Wakes up the trap and shoulder girdle.',
        'Bicep curls with no weight — 3 sets of 12. Build to a 1-2 lb hand weight or soup can.',
        'Towel slide on a table — slide a folded towel across a slick table with the affected hand. 50 slides, 3 times.',
        'Finger taps — touch each fingertip to thumb in sequence. 30 sequences per hand.',
        'Coin pickups — 10 coins on a table, pick up one at a time and drop in a cup. 3 rounds.',
      ],
    },
    {
      h2: 'Lower limb: leg, foot, gait',
      paragraphs: [
        'Sit-to-stand from a chair — 3 sets of 8-12. The single most useful exercise for early gait recovery.',
        'Heel raises holding a counter — 3 sets of 15.',
        'Marching in place — knees as high as comfortable, 60 seconds, 3 rounds.',
        'Single-leg stand holding a counter — 30 seconds per leg, 3 rounds.',
        'Stair work — go up and down 5 stairs, 5 times. Use a railing. This is intentionally hard.',
      ],
    },
    {
      h2: 'Balance and core',
      paragraphs: [
        'Wall sit — 30 seconds, 3 rounds.',
        'Standing weight shifts — 30 reps side-to-side, then 30 forward-back.',
        'Tandem stance (heel-to-toe) — hold a counter, 30 seconds per side.',
        'Bird-dog on hands and knees — 8 reps per side, 2 rounds.',
        'Bridge — lying on back, lift hips. 12 reps, 3 rounds.',
      ],
    },
    {
      h2: 'Speech and swallowing endurance',
      paragraphs: [
        'Read aloud — 5 minutes from a book or article, focus on clarity not speed.',
        'Tongue extension — stick tongue out as far as possible, hold 5 seconds, 10 reps.',
        'Effortful swallow — swallow with deliberate force as if swallowing a large pill, 10 reps, 3 times a day.',
        'Counting on one breath — count out loud as far as you can on a single breath. Note the number daily.',
        'Word retrieval drills — name 10 items in a category (animals, fruits, tools) as fast as you can.',
      ],
    },
    {
      h2: 'How to put it together into a routine',
      paragraphs: [
        'Start with two blocks per day, 15-20 minutes each. Block one is upper or lower limb. Block two is balance plus speech. Rotate which limb gets focus across the week.',
        'After two weeks, add a third short block. After four weeks, escalate intensity (more reps, light resistance). The Sasquatch Method daily routine on the platform handles all of this calibration automatically — but you can run it manually with the lists above.',
      ],
    },
  ],
  faqs: [
    { q: 'How many days a week should I exercise?', a: 'Aim for 5-6 days a week. One full rest day is fine. Two or more in a row is the start of a slide.' },
    { q: 'I cannot stand yet. Can I still do these?', a: 'Yes. The seated versions are in the platform exercise library. Sit-to-stand becomes weight-shift while seated. Single-leg balance becomes seated marching.' },
    { q: 'How long until I see results?', a: 'Most survivors notice changes in 4-8 weeks of consistent training. Track monthly, not daily.' },
    { q: 'Should I push through pain?', a: 'No. Sharp pain stops the session. Dull muscle fatigue is fine and expected.' },
    { q: 'What about cardio?', a: 'Walking 20-30 minutes a day at a moderate pace is one of the most underrated stroke recovery interventions. It boosts BDNF, the molecule that fuels neuroplasticity.' },
  ],
  related: [RELATED_LINKS.hemi, RELATED_LINKS.routine, RELATED_LINKS.method, RELATED_LINKS.neuro, RELATED_LINKS.aphasia, RELATED_LINKS.timeline],
};

export const PAGE_APHASIA: SsrPageConfig = {
  url: '/learn/aphasia-recovery',
  title: 'Aphasia Recovery After Stroke | Get Your Words Back',
  description: 'How aphasia recovery actually works. The types, the treatments, the daily speech drills, and the long-game strategy for getting your words back.',
  h1: 'Aphasia recovery: getting your words back.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'Aphasia is not a thinking problem. It is a wiring problem between thought and speech. The wiring can be rebuilt.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['aphasia recovery', 'aphasia after stroke', 'speech therapy stroke', 'aphasia exercises'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/aphasia-recovery' }],
  sections: [
    {
      h2: 'What aphasia actually is — and is not',
      paragraphs: [
        'Aphasia is a language disorder caused by damage to the language centers of the brain — most often Broca\'s area or Wernicke\'s area in the left hemisphere. It can affect speaking, understanding, reading, and writing in any combination.',
        'Aphasia is not a loss of intelligence. The person with aphasia is the same person they were before. They still know what they want to say. The pipe between intent and output is what got hit.',
      ],
    },
    {
      h2: 'The major types',
      paragraphs: [
        'Broca\'s aphasia (non-fluent): the survivor knows the words, struggles to get them out. Speech is effortful and short.',
        'Wernicke\'s aphasia (fluent): speech flows but words are wrong, swapped, or invented. Comprehension is also affected.',
        'Global aphasia: severe damage to both areas. Both speaking and comprehension hit hard. Often improves significantly in the first 12 months.',
        'Anomic aphasia: word-finding specifically. Conversation feels normal until the word for "key" simply will not come.',
        'Conduction aphasia: trouble repeating phrases despite intact comprehension and speech.',
      ],
    },
    {
      h2: 'The first six months',
      paragraphs: [
        'The first six months see the most rapid spontaneous recovery in aphasia. Get into speech-language pathology (SLP) early — three sessions a week if insurance covers it. Use those sessions and double-dose with home practice between them.',
        'Constraint-induced aphasia therapy (CIAT) is a structured program that bans gestures and writing, forcing the survivor to use spoken words. It is intense and effective for many survivors with mild-to-moderate aphasia.',
      ],
    },
    {
      h2: 'Daily aphasia drills',
      paragraphs: [
        'Read aloud — 10 minutes a day from a book or article you enjoy. Comprehension and motor planning together.',
        'Naming drills — point at common objects in the house and name them out loud. Slow it down. Wrong answers are part of the data.',
        'Category fluency — set a 60-second timer and name as many animals, foods, or tools as you can. Track the count daily.',
        'Sentence completion — partner reads "I went to the ___" and you supply an ending. Build to longer fill-ins.',
        'Singing — many survivors with severe aphasia can sing words they cannot speak. Melodic intonation therapy (MIT) leverages this.',
      ],
    },
    {
      h2: 'How communication partners can help',
      paragraphs: [
        'The single biggest mistake spouses and friends make is finishing the survivor\'s sentences. It feels kind. It is the speech equivalent of buttoning their shirt for them — short-term comfort, long-term harm.',
        'Wait. Use eye contact. Give 8-10 seconds of silence. Many survivors will get the word out if you just hold the space. When they cannot, ask yes/no questions to narrow down. Treat the conversation as a partnership, not a guess-the-word game.',
      ],
    },
    {
      h2: 'The long game',
      paragraphs: [
        'Aphasia recovery does not stop at six months. Many survivors make meaningful gains years post-stroke when they get back into structured practice. The Sasquatch Method includes a Speech track that progressively challenges word-finding, sentence construction, and conversational endurance.',
      ],
    },
  ],
  faqs: [
    { q: 'Will I ever speak normally again?', a: 'Many survivors with mild-to-moderate aphasia get to functional fluency. Severe aphasia usually leaves some residual issues but most people communicate effectively with mixed strategies.' },
    { q: 'Should I use a communication app?', a: 'In early recovery, yes — apps like Lingraphica can bridge the gap. As speech returns, lean less on the app and more on direct speech.' },
    { q: 'Why can I sing but not talk?', a: 'Singing uses different brain pathways, often in the right hemisphere. Melodic intonation therapy explicitly trains the bridge between singing and speech.' },
    { q: 'My loved one finishes my sentences. How do I tell them to stop?', a: 'Send them this article. Ask them for 8-10 seconds of silence. Frame it as part of your therapy, not a personal complaint.' },
    { q: 'How much speech therapy do I need?', a: 'Three sessions a week in the first 6 months if available. After that, twice weekly clinical work plus daily home practice. The platform supports the home practice piece.' },
  ],
  related: [RELATED_LINKS.neuro, RELATED_LINKS.method, RELATED_LINKS.exercises, RELATED_LINKS.routine, RELATED_LINKS.timeline, RELATED_LINKS.depression],
};

export const PAGE_DEPRESSION: SsrPageConfig = {
  url: '/learn/depression-after-stroke',
  title: 'Depression After Stroke | The Other Half of Recovery',
  description: 'Post-stroke depression hits one in three survivors. Why it happens, what to do, and how to keep moving when the brain is fighting you on it.',
  h1: 'Depression after stroke. The half nobody fights with you on.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'About 30-35% of stroke survivors develop clinical depression. It is the most under-treated complication of stroke. Here is what to do about it.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['depression after stroke', 'post-stroke depression', 'stroke mental health', 'PSD treatment'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/depression-after-stroke' }],
  sections: [
    {
      h2: 'Why this happens to so many survivors',
      paragraphs: [
        'Post-stroke depression (PSD) is partly biological and partly situational. Biologically, the stroke can disrupt the neurochemical systems that regulate mood — serotonin, dopamine, and norepinephrine pathways are often hit. Strokes in certain locations (left frontal, basal ganglia) carry higher PSD risk.',
        'Situationally, you just had your life upended. You may have lost your job, your independence, your identity, your hobbies, or your sense of safety. That alone would depress most healthy people. Stack it on a brain that is also struggling chemically and the result is predictable.',
      ],
    },
    {
      h2: 'How to tell depression from "just hard times"',
      paragraphs: [
        'Two weeks or more of: persistent low mood, loss of interest in activities you used to love, sleep changes (too much or too little), appetite changes, fatigue beyond what physical recovery explains, feelings of worthlessness or guilt, difficulty concentrating beyond your post-stroke baseline, recurrent thoughts of death or self-harm.',
        'If any of those last items are present — especially thoughts of self-harm — call your doctor today, not next week. The 988 Suicide and Crisis Lifeline is free in the US.',
      ],
    },
    {
      h2: 'The treatment landscape',
      paragraphs: [
        'SSRIs (sertraline, citalopram, escitalopram) are the most common pharmacologic treatment and have decent evidence for PSD specifically. Some studies even show motor recovery benefits independent of mood effects.',
        'Cognitive behavioral therapy (CBT) is the most studied talk therapy for PSD. Look for a therapist with chronic illness or rehabilitation experience.',
        'Aerobic exercise has antidepressant effects in stroke survivors at doses around 150 minutes a week of moderate intensity.',
        'Light therapy and rTMS (repetitive transcranial magnetic stimulation) are emerging options for survivors who do not respond to first-line treatment.',
      ],
    },
    {
      h2: 'The behavioral move when you cannot get out of bed',
      paragraphs: [
        'PSD often shows up as inability to start. The Sasquatch Method has a single phrase for this: shrink the ask. The day you cannot do your routine is the day you do one rep. The day you cannot do one rep is the day you sit on the edge of the bed for 60 seconds. The chain does not break.',
        'This is not optimism. This is engineering. Compliance compounds. Heroism does not.',
      ],
    },
    {
      h2: 'How to talk to your medical team about it',
      paragraphs: [
        'Many survivors do not bring up mood because they do not want to be "complaining." Stop doing that. Bring a printed PHQ-9 questionnaire to your next appointment with the answers filled in. It is the standard depression screen and gives the doctor an objective starting point.',
        'If your primary care will not address it, ask for a referral to a psychiatrist. Stroke survivors are often under-referred. Push for the referral.',
      ],
    },
    {
      h2: 'The community piece',
      paragraphs: [
        'Isolation is the multiplier on depression. Survivors who connect with other survivors regularly report lower depression scores and higher recovery momentum. The community on this platform exists for that reason — not as a feel-good extra, but as the most cost-effective intervention available for PSD.',
      ],
    },
  ],
  faqs: [
    { q: 'How common is post-stroke depression?', a: 'About 30-35% of survivors develop clinical depression in the first year. That number climbs if you include subclinical mood disturbance.' },
    { q: 'Can SSRIs help my motor recovery too?', a: 'Some studies (notably the FLAME trial) suggest yes, though results have been mixed. Talk to your stroke neurologist about whether they apply to you.' },
    { q: 'Is it normal to cry without warning?', a: 'You may have pseudobulbar affect (PBA) — uncontrolled laughing or crying triggered by stroke damage to motor pathways. It is treatable. Mention it specifically to your doctor.' },
    { q: 'Will I ever feel like myself again?', a: 'For most survivors, yes — though "myself" may evolve. Treated depression has high response rates. Untreated depression rarely gets better on its own in stroke survivors.' },
    { q: 'I am having thoughts of suicide. What do I do?', a: 'Call or text 988 in the US (or your local equivalent) right now, or go to an emergency room. PSD with suicidal ideation is a medical emergency, full stop.' },
  ],
  related: [RELATED_LINKS.spouses, RELATED_LINKS.caregivers, RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.timeline, RELATED_LINKS.about],
};

export const PAGE_TIMELINE: SsrPageConfig = {
  url: '/learn/stroke-recovery-timeline',
  title: 'Stroke Recovery Timeline | Month-by-Month, Year-by-Year',
  description: 'A realistic stroke recovery timeline. What to expect at week 1, month 1, 3, 6, 12, and beyond. The science of windows, plateaus, and the long game.',
  h1: 'The stroke recovery timeline, month by month, year by year.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'Recovery is not linear and the books that pretend it is will mislead you. Here is the honest map.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  keywords: ['stroke recovery timeline', 'stroke recovery stages', 'how long does stroke recovery take', 'stroke recovery year by year'],
  schemaType: 'MedicalWebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn/stroke-recovery-timeline' }],
  sections: [
    {
      h2: 'Week 1: stabilization',
      paragraphs: [
        'You are in the hospital. The job is keeping you alive and preventing a second stroke. Imaging happens, blood thinners get adjusted, the immediate cause gets investigated. You are not "doing rehab" yet, though early mobilization (sitting up, transferring) starts within 24-72 hours if safe.',
        'This is also when your family is the most overwhelmed. Designate one person as the medical point of contact. Get a notebook. Write everything down.',
      ],
    },
    {
      h2: 'Weeks 2-4: inpatient rehab',
      paragraphs: [
        'If you qualify, you transfer to inpatient rehabilitation. 3 hours a day of PT, OT, and SLP, 5-6 days a week. This is the most intensive rehab period of your life and you should treat every minute as sacred.',
        'Goals: discharge home safely, basic self-care, swallowing safety, simple mobility. Major motor recovery does not happen here — that is the marathon that starts at discharge.',
      ],
    },
    {
      h2: 'Month 1-3: the 90-day window',
      paragraphs: [
        'This is the period of fastest spontaneous recovery — the brain\'s own rebound. Combined with daily home program work and outpatient therapy, this window often produces dramatic visible gains. Walking returns for many. Speech improves for many. Hand function lags but starts to wake up.',
        'Mistake to avoid: assuming the speed of this window will continue. It will not. The first 3 months feel fast because of spontaneous recovery. Month 4 onward depends entirely on your effort.',
      ],
    },
    {
      h2: 'Month 4-6: the cliff',
      paragraphs: [
        'Insurance starts cutting therapy. Spontaneous recovery slows. Many survivors hit a wall and assume they "plateaued." This is not a plateau. This is the point where most survivors quit working hard, and the curve flattens because the work flattened — not because the brain stopped responding.',
        'Survivors who stay disciplined here keep gaining. The Sasquatch Method daily routine is built specifically to bridge this period when the structured care goes away.',
      ],
    },
    {
      h2: 'Month 6-12: the build',
      paragraphs: [
        'For survivors who stayed in the work, this is when major functional gains compound. Walking gets faster. Speech gets cleaner. Hand function returns to useful tasks. Cognitive endurance grows.',
        'For survivors who stopped, this is when learned non-use sets in and the affected side starts losing what it had gained. The two trajectories diverge sharply in this window.',
      ],
    },
    {
      h2: 'Year 1-3: the long arc',
      paragraphs: [
        'Year 2 is when many survivors return to work, drive again, restart their hobbies. The body is no longer "recovering" in the dramatic sense; it is integrating. New baselines settle in. Identity rebuilds.',
        'Year 3 is when survivors often start coaching others. The pain becomes purpose. The Sasquatch Method has a Survivor Income module specifically for this transition.',
      ],
    },
    {
      h2: 'Year 5-10+: the late game',
      paragraphs: [
        'The myth that recovery stops at 6 months or 1 year is dangerous. Documented cases of meaningful improvement at year 5, 10, even 20 post-stroke exist when survivors apply the right protocol with intensity. Plateau is a stimulus problem, not a brain problem.',
        'Nick Kremers is at year 7, still gaining. Many survivors in the community are similarly making gains decades out. Do not let the timeline fool you into stopping.',
      ],
    },
  ],
  faqs: [
    { q: 'Is it true that most recovery happens in the first 6 months?', a: 'Most spontaneous recovery does. Most driven recovery does not — it depends on consistent effort and can continue for years.' },
    { q: 'I am at month 8 and stuck. What now?', a: 'You are at the cliff. Re-engage a therapist for a tune-up, restart structured daily work, change the stimulus. The wall is the stimulus, not the brain.' },
    { q: 'When can I go back to work?', a: 'Most cognitive jobs: month 4-9 with phased return. Most physical jobs: year 1-2. Both depend on your specific deficits and your employer\'s flexibility.' },
    { q: 'When can I drive?', a: 'After passing a driving evaluation, usually 6-12 months out. Do not self-clear. Insurance and liability concerns are real.' },
    { q: 'Will I have another stroke?', a: 'Recurrent stroke risk is roughly 5-15% per year depending on cause. Aggressive secondary prevention — meds, blood pressure control, cholesterol, lifestyle — is critical. Take it seriously.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.routine, RELATED_LINKS.neuro, RELATED_LINKS.depression, RELATED_LINKS.hemi, RELATED_LINKS.about],
};

export const ALL_TIER1_PAGES: SsrPageConfig[] = [
  PAGE_FOR_SURVIVORS,
  PAGE_FOR_CAREGIVERS,
  PAGE_FOR_YOUNG,
  PAGE_FOR_SPOUSES,
  PAGE_FOR_THERAPISTS,
  PAGE_66_DAY,
  PAGE_METHOD,
  PAGE_DAILY_ROUTINE,
  PAGE_NEUROPLASTICITY,
  PAGE_HEMIPARESIS,
  PAGE_HOME_EXERCISES,
  PAGE_APHASIA,
  PAGE_DEPRESSION,
  PAGE_TIMELINE,
];

// ──────────────────────────────────────────────────────────────────────────────
// HUB PAGES (for /for, /programs, /learn)
// ──────────────────────────────────────────────────────────────────────────────

export const HUB_FOR: SsrPageConfig = {
  url: '/for',
  title: 'Built For Stroke Survivors, Caregivers, and Therapists',
  description: 'Stroke Recovery Academy is built for everyone in the stroke recovery ecosystem. Pick your role and get the playbook designed for you.',
  h1: 'Built for everyone in the stroke recovery ecosystem.',
  hero: {
    eyebrow: 'Who it is for',
    subhead: 'A stroke does not just happen to one person. It happens to a whole circle of people. Each one needs a different playbook.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'For', href: '/for' }],
  sections: [
    {
      h2: 'Pick your door',
      paragraphs: ['Five distinct playbooks. Pick the one that fits you most and the others will still be there if you need them later.'],
    },
  ],
  faqs: [
    { q: 'I am all of these at once. Which page should I start with?', a: 'Start with the role that occupies the most hours of your day. You can always read the others next week.' },
  ],
  related: [
    RELATED_LINKS.survivors,
    RELATED_LINKS.caregivers,
    RELATED_LINKS.young,
    RELATED_LINKS.spouses,
    RELATED_LINKS.therapists,
  ],
};

export const HUB_PROGRAMS: SsrPageConfig = {
  url: '/programs',
  title: 'Stroke Recovery Programs | Sasquatch Method, Daily Routine, 66-Day Challenge',
  description: 'The three programs that power Stroke Recovery Academy: the doctrine (Sasquatch Method), the runway (Daily Routine), and the entry ramp (66-Day Challenge).',
  h1: 'Three programs. One operating system.',
  hero: {
    eyebrow: 'Programs',
    subhead: 'The doctrine, the runway, and the entry ramp. They work together.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Programs', href: '/programs' }],
  sections: [
    {
      h2: 'How the three fit together',
      paragraphs: [
        'The Sasquatch Method is the doctrine — the four pillars and the philosophy. Read this first.',
        'The 66-Day Challenge is the entry ramp — the structured 66-day arc that installs the habits.',
        'The Daily Routine is the long-term runway — the system you run for years after the challenge.',
      ],
    },
  ],
  faqs: [
    { q: 'Which one should I start with?', a: 'Read the Sasquatch Method first (5 minutes), then start the 66-Day Challenge. The Daily Routine takes over automatically when you graduate.' },
  ],
  related: [RELATED_LINKS.method, RELATED_LINKS.challenge, RELATED_LINKS.routine, RELATED_LINKS.university, RELATED_LINKS.exercises, RELATED_LINKS.about],
};

export const HUB_LEARN: SsrPageConfig = {
  url: '/learn',
  title: 'Stroke Recovery Learning Hub | Neuroplasticity, Hemiparesis, Aphasia',
  description: 'Deep guides on every aspect of stroke recovery. Neuroplasticity, hemiparesis, aphasia, depression, exercises at home, and the recovery timeline.',
  h1: 'Stroke recovery, from the ground up.',
  hero: {
    eyebrow: 'Learn',
    subhead: 'The science, the protocols, and the survival manual. Written by a survivor in survivor language.',
    ctaPrimary: { href: '/api/login', label: 'Start free' },
  },
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Learn', href: '/learn' }],
  sections: [
    {
      h2: 'Pick a topic',
      paragraphs: ['Six deep guides. Each one stands alone. Read them in any order.'],
    },
  ],
  faqs: [
    { q: 'Where should I start?', a: 'If you are new to stroke recovery, start with the Recovery Timeline and Neuroplasticity. Then go to the topic that hits closest to your situation.' },
  ],
  related: [
    RELATED_LINKS.neuro,
    RELATED_LINKS.hemi,
    RELATED_LINKS.exercises,
    RELATED_LINKS.aphasia,
    RELATED_LINKS.depression,
    RELATED_LINKS.timeline,
  ],
};

export const ALL_HUB_PAGES: SsrPageConfig[] = [HUB_FOR, HUB_PROGRAMS, HUB_LEARN];
