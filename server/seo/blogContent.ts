// SSR blog posts — high-intent "People Also Ask" content targeting long-tail
// stroke recovery queries. Each post is a full SsrPageConfig that renders through
// the same dark/gold ssrShell as the Tier-1 landing pages. URLs live at /blog/[slug]
// to keep them out of the existing /recovery/blog/[slug] (DB-backed) namespace.

import type { SsrPageConfig, ContentSection, FAQItem, InternalLink } from './ssrShell';

interface BlogPostInput {
  slug: string;
  title: string;          // ≤65 chars
  description: string;    // 140-160 chars
  h1: string;
  keyword: string;
  subhead: string;
  ctaPrimary: { href: string; label: string };
  ctaSecondary: { href: string; label: string };
  sections: ContentSection[];
  faqs: FAQItem[];
  related: InternalLink[];
  publishedDate?: string;
  productCard?: {
    title: string;
    description: string;
    link: string;
    label: string;
    note?: string;
  };
  bookPromo?: {
    title: string;
    description: string;
    link: string;
    label: string;
  };
}

function makeBlogPost(p: BlogPostInput): SsrPageConfig {
  return {
    url: `/blog/${p.slug}`,
    title: p.title,
    description: p.description,
    h1: p.h1,
    hero: {
      eyebrow: 'Stroke Recovery Blog',
      subhead: p.subhead,
      ctaPrimary: p.ctaPrimary,
      ctaSecondary: p.ctaSecondary,
    },
    sections: p.sections,
    faqs: p.faqs,
    related: p.related,
    keywords: [p.keyword, 'stroke recovery', 'sasquatch method'],
    schemaType: 'MedicalWebPage',
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: p.h1.length > 60 ? p.h1.slice(0, 57) + '…' : p.h1, href: `/blog/${p.slug}` },
    ],
    publishedDate: p.publishedDate || '2026-01-20',
    productCard: p.productCard,
    bookPromo: p.bookPromo,
  };
}

// =============================================================================
// 1. How long does stroke rehab take?
// =============================================================================
export const POST_REHAB_DURATION = makeBlogPost({
  slug: 'how-long-does-stroke-rehab-take',
  title: 'How Long Does Stroke Rehab Take? An Honest Survivor Answer',
  description: 'How long stroke rehab really takes — by phase, by severity, and by what actually drives recovery. Written by a 7-year survivor who recovered 90%.',
  h1: 'How long does stroke rehab take?',
  keyword: 'how long does stroke rehab take',
  subhead: 'The honest answer is "longer than they tell you and shorter than you fear." Here is the real timeline, broken down by phase.',
  ctaPrimary: { href: '/api/login', label: 'See my recovery timeline' },
  ctaSecondary: { href: '/blog/can-you-fully-recover-from-a-stroke', label: 'Can you fully recover?' },
  sections: [
    {
      h2: 'The short answer',
      paragraphs: [
        'Most stroke survivors see their fastest recovery in the first three to six months — what therapists call the "acute" and "subacute" windows. But meaningful gains continue for years, especially for survivors who keep training. Functional gains at year 3, year 5, and even year 7 are well documented.',
        'The sentence you may have heard from a doctor — "you have six months and then it stops" — is a half-truth that has done enormous damage. It is true that the rate of recovery slows. It is not true that recovery stops.',
      ],
    },
    {
      h2: 'Phase by phase',
      paragraphs: [
        'Acute phase (week 1–2): The hospital stabilizes you. Therapy is short, daily, and exhausting. The brain is in survival mode. Sleep is the single most important thing you can do.',
        'Subacute phase (week 2 to month 6): This is the steepest part of the recovery curve. Inpatient or outpatient therapy is daily or near-daily. The brain is rapidly forming new pathways. Doing your home exercises here is more valuable than any other 6-month period of your life.',
        'Chronic phase (month 6 onward): Insurance coverage drops. Most survivors lose access to therapy and assume recovery is over. It is not. Chronic-phase gains are real and well-documented in the neuroplasticity literature, but they require consistent, intentional daily practice.',
      ],
      bullets: [
        'Week 1–2: Hospital stabilization, gentle mobility, sleep',
        'Week 2 – Month 6: Maximum-intensity rehab window',
        'Month 6 – Year 2: Sub-acute decay if you stop, continued gains if you train',
        'Year 2+: Long-game neuroplasticity. The Sasquatch Method window.',
      ],
    },
    {
      h2: 'What actually drives the timeline',
      paragraphs: [
        'Three variables explain most of the variance in recovery time: severity of the initial stroke, age at the time of stroke, and total daily reps performed during the rehabilitation window. The third one is the only one you can control. It is also the largest in effect size for moderate strokes.',
        'Survivors who do the Sasquatch Method daily routine report functional improvements 12–24 months after the "official" rehab window closed. The brain rewires when you give it a reason to. Stop giving it a reason and the rewiring stops.',
      ],
    },
    {
      h2: 'Realistic expectations by severity',
      paragraphs: [
        'Mild stroke: Most function returns in 3–6 months. Residual symptoms (fatigue, slight word-finding issues, balance) can persist for years and respond to daily training.',
        'Moderate stroke: Significant function returns in 6–18 months. Independence in most daily activities is the typical 12-month outcome with consistent therapy and home practice.',
        'Severe stroke: Recovery is measured in years, not months. The 5-year outcome can be dramatically better than the 6-month outcome — but only if daily training continues. Nick\'s recovery from complete left-side paralysis to 90% function took 7 years of daily work.',
      ],
    },
    {
      h2: 'What to do today',
      paragraphs: [
        'The single highest-leverage thing you can do today is start a daily routine and do not miss a day. The Daily Routine in the Sasquatch Method is calibrated to your current ability and escalates as you improve. It is the operating system that closes the gap between "what therapy taught me" and "what I do every day."',
      ],
    },
  ],
  faqs: [
    { q: 'Is stroke recovery really lifelong?', a: 'Yes. Functional improvements are documented at 5+ years post-stroke in survivors who continue daily training. The brain retains plasticity for life — the rate slows but the capacity remains.' },
    { q: 'When do you plateau after a stroke?', a: 'Plateaus are usually a sign that the current training stimulus has stopped being challenging, not that recovery is over. Increasing complexity, novelty, or intensity typically restarts gains within 4–8 weeks.' },
    { q: 'How many hours of therapy do you need per day?', a: 'Research suggests 3+ hours of meaningful task practice per day during the subacute window produces the best outcomes. After insurance coverage ends, this means home practice — which is what the Daily Routine is built for.' },
    { q: 'Can stroke recovery happen after 5 years?', a: 'Yes. Constraint-induced movement therapy, intensive aphasia programs, and structured home routines have produced measurable gains in survivors 5, 10, and even 15 years post-stroke.' },
    { q: 'Why does my recovery feel slow?', a: 'The early gains are dramatic and visible. Later gains are smaller and require more reps for the same visible result. This is normal and not a sign that you are done. Track small metrics weekly and you will see the trajectory.' },
  ],
  related: [
    { href: '/learn/stroke-recovery-timeline', label: 'The stroke recovery timeline, month by month', blurb: 'A deeper dive into what to expect at week 1, month 1, year 1, and beyond.' },
    { href: '/learn/neuroplasticity-after-stroke', label: 'How the brain actually rewires after stroke', blurb: 'The science behind why daily training continues to work.' },
    { href: '/programs/daily-routine', label: 'The 5-level Daily Routine', blurb: 'The system that closes the home-training gap.' },
    { href: '/blog/can-you-fully-recover-from-a-stroke', label: 'Can you fully recover from a stroke?', blurb: 'The honest survivor answer.' },
  ],
});

// =============================================================================
// 2. Can you fully recover from a stroke?
// =============================================================================
export const POST_FULL_RECOVERY = makeBlogPost({
  slug: 'can-you-fully-recover-from-a-stroke',
  title: 'Can You Fully Recover From a Stroke? A Survivor\'s Honest Answer',
  description: 'Can you fully recover from a stroke? Here\'s the honest answer from a survivor who went from total paralysis to 90% function in 7 years.',
  h1: 'Can you fully recover from a stroke?',
  keyword: 'can you fully recover from a stroke',
  subhead: 'The hospital says one thing. The internet says another. Here is what 7 years of recovery actually looks like.',
  ctaPrimary: { href: '/api/login', label: 'Start the recovery plan' },
  ctaSecondary: { href: '/programs/sasquatch-method', label: 'See the four pillars' },
  sections: [
    {
      h2: 'The honest answer',
      paragraphs: [
        '"Fully" is a slippery word. If "fully" means "exactly the brain you had before the stroke," the answer is almost always no. Stroke kills brain tissue and that tissue does not grow back. If "fully" means "the function and the life you want," the answer is yes, far more often than the medical system tells you.',
        'Recovery is not the brain re-growing. It is the brain re-routing. Healthy regions take over the work the dead regions used to do. This is neuroplasticity, and it is real, well-documented, and trainable.',
      ],
    },
    {
      h2: 'What "full recovery" actually looks like',
      paragraphs: [
        'A "fully recovered" stroke survivor still typically has some residual symptoms — extra fatigue, occasional word-finding pauses, slight balance differences in the dark. From the outside, they look completely normal. From the inside, the recovery is something they actively maintain.',
        'Nick — the founder of Stroke Recovery Academy — had a complete left hemiparesis at 35. Today he runs, lifts, writes, and teaches. He calls himself 90% recovered. He is also 100% functional in his life. Both numbers are true.',
      ],
    },
    {
      h2: 'What the research actually says',
      paragraphs: [
        'About 10% of survivors have a complete recovery, 25% have minor impairments, 40% have moderate impairments requiring some special care, 10% require nursing home care, and 15% die soon after stroke. These numbers are population averages — they describe what the average survivor receiving average care experiences. They do not describe what is possible.',
        'Survivors who train daily, who address depression aggressively, who treat sleep as part of their recovery program, and who maintain practice for years tend to land in much better outcomes than the population averages predict.',
      ],
    },
    {
      h2: 'What you can control',
      paragraphs: [
        'You cannot control the size or location of your stroke. You also cannot control your age. But you can control: how many reps you do each day, how consistent your sleep is, whether you treat depression, what you eat, whether you do strength work alongside neuro work, and whether you keep training in year 2, 3, and 5.',
        'These controllable factors are not minor. In aggregate they are larger than most uncontrollable factors for moderate strokes. This is the entire reason the Sasquatch Method exists.',
      ],
    },
    {
      h2: 'The realistic plan',
      paragraphs: [
        'Stop asking "will I fully recover" and start asking "what is the next 1% of recovery I can earn this week." That is the question that produces results. Daily routine. Weekly progress check. Monthly stretch goal. Yearly milestone. That is how you stack 7 years of compounding gains.',
      ],
    },
  ],
  faqs: [
    { q: 'What percentage of stroke survivors fully recover?', a: 'Roughly 10% achieve a complete recovery as conventionally defined. Another 25% have only minor impairments and live functionally normal lives. With aggressive long-term training, many survivors exceed their initial population-average prognosis.' },
    { q: 'Can the brain heal itself after a stroke?', a: 'The dead tissue does not regenerate. But healthy brain regions can take over the work of damaged regions through neuroplasticity. This is the entire mechanism of stroke recovery.' },
    { q: 'How long until you know how much function will return?', a: 'The first 90 days predict a lot. The first year predicts more. But survivors continue to gain function for years with consistent training. Do not let a 6-month assessment define your 5-year outcome.' },
    { q: 'Do younger survivors recover more fully?', a: 'On average yes — younger brains have more plasticity and longer time horizons. But the single biggest predictor of outcome at 5 years is daily practice, not age.' },
    { q: 'Is recovery linear?', a: 'No. Recovery comes in waves with plateaus, setbacks, and breakthrough moments. Plateaus are not the end. They are the brain consolidating before the next jump.' },
  ],
  related: [
    { href: '/programs/sasquatch-method', label: 'The Sasquatch Method', blurb: 'The doctrine Nick used to recover 90% from complete paralysis.' },
    { href: '/learn/neuroplasticity-after-stroke', label: 'Neuroplasticity after stroke', blurb: 'The science of how the brain rewires.' },
    { href: '/blog/how-long-does-stroke-rehab-take', label: 'How long does stroke rehab take?', blurb: 'The honest timeline.' },
    { href: '/programs/66-day-challenge', label: 'The 66-Day Sasquatch Challenge', blurb: 'The transformation arc.' },
  ],
});

// =============================================================================
// 3. Signs of a second stroke
// =============================================================================
export const POST_SECOND_STROKE_SIGNS = makeBlogPost({
  slug: 'signs-of-a-second-stroke',
  title: 'Warning Signs of a Second Stroke: What Every Survivor Must Know',
  description: 'The warning signs of a second stroke every survivor and caregiver must memorize. BE-FAST, silent symptoms, and what to do in the first 5 minutes.',
  h1: 'Warning signs of a second stroke',
  keyword: 'signs of a second stroke',
  subhead: 'About 1 in 4 strokes are recurrent. The next 5 minutes after symptom onset matter more than anything you will do this year.',
  ctaPrimary: { href: '/api/login', label: 'Get the BE-FAST checklist' },
  ctaSecondary: { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke' },
  sections: [
    {
      h2: 'BE-FAST — the modern stroke checklist',
      paragraphs: [
        'BE-FAST is the upgraded version of FAST that includes balance and eye symptoms — two of the most commonly missed indicators of posterior-circulation strokes.',
      ],
      bullets: [
        'B — Balance: Sudden loss of balance or coordination',
        'E — Eyes: Sudden vision change in one or both eyes, double vision, or vision loss',
        'F — Face: One side of the face droops or feels numb',
        'A — Arms: One arm drifts down when both are raised',
        'S — Speech: Slurred, garbled, or unable to speak',
        'T — Time: Call 911 immediately. Note the time symptoms started.',
      ],
    },
    {
      h2: 'Silent and atypical signs survivors miss',
      paragraphs: [
        'Sudden severe headache — "the worst headache of my life" — is the classic warning of a hemorrhagic stroke. It is not subtle and it is not normal. Sudden confusion, sudden trouble understanding speech, or sudden inability to follow a simple instruction can be a stroke even without weakness or speech changes.',
        'In women, atypical symptoms are more common: sudden chest pain, hiccups, nausea, shortness of breath, or palpitations alongside any of the BE-FAST signs. Survivors and caregivers should know that "I just feel weird and something is wrong" is sometimes the only warning before a major event.',
      ],
    },
    {
      h2: 'The 5-minute response protocol',
      paragraphs: [
        'Call 911 first. Do not drive yourself. Do not wait to see if it gets better. The clock starts the moment symptoms begin and clot-busting medication tPA must be given within 4.5 hours. Mechanical thrombectomy windows can extend to 24 hours but earlier is dramatically better.',
        'Note the exact time symptoms started. If you woke up with symptoms, the time of onset is the last time you were known to be normal. This single piece of information determines what treatments you will be eligible for.',
      ],
      bullets: [
        'Call 911 (do not drive yourself)',
        'Note the exact time symptoms started',
        'Do not eat, drink, or take aspirin unless EMS tells you to',
        'Unlock the door for EMS and put the dog away',
        'Bring your medication list to the hospital',
      ],
    },
    {
      h2: 'TIA — the "warning shot"',
      paragraphs: [
        'A transient ischemic attack causes the same symptoms as a stroke but they resolve, usually within an hour. Roughly 1 in 3 people who have a TIA will have a full stroke within a year, and almost half of those happen within 48 hours. A TIA is a medical emergency. Treat it like a stroke.',
      ],
    },
    {
      h2: 'Why survivors are at higher risk',
      paragraphs: [
        'About 25% of all strokes are recurrent strokes. The 90 days after a first stroke are the highest-risk window. Compliance with antiplatelet therapy, blood pressure control, statins (when prescribed), and atrial fibrillation anticoagulation is the single biggest factor in preventing recurrence.',
        'Lifestyle factors stack on top: blood pressure under 130/80, no smoking, daily movement, Mediterranean-style eating, and treatment of sleep apnea cut recurrence risk substantially. The Sasquatch Method covers all of these in the daily routine.',
      ],
    },
  ],
  faqs: [
    { q: 'Can a stroke happen without warning?', a: 'Most strokes happen suddenly, but many survivors report subtle warning signs in the days before — brief numbness, vision changes, or confusion that they dismissed. Take any new neurological symptom seriously.' },
    { q: 'What is the most common second stroke warning sign?', a: 'Sudden one-sided weakness or facial drooping is the most common, but balance and vision changes are the most commonly missed. Use BE-FAST, not just FAST.' },
    { q: 'How likely is a second stroke?', a: 'About 1 in 4 stroke survivors will have a second stroke within 5 years. The risk is highest in the first 90 days and drops dramatically with proper medical management and lifestyle changes.' },
    { q: 'Should I take aspirin if I think I am having a stroke?', a: 'No — not on your own. Hemorrhagic strokes can be made dramatically worse by aspirin. Call 911 and let EMS and the hospital decide.' },
    { q: 'Can stress cause a second stroke?', a: 'Acute stress raises blood pressure and can trigger events in vulnerable survivors. Chronic stress contributes to atherosclerosis and cardiovascular risk. Stress management is part of the prevention plan.' },
  ],
  related: [
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'The survivor checklist.' },
    { href: '/blog/tia-vs-stroke', label: 'TIA vs stroke: what survivors need to know', blurb: 'The "warning shot" explained.' },
    { href: '/blog/ischemic-vs-hemorrhagic-stroke', label: 'Ischemic vs hemorrhagic stroke', blurb: 'The two types and why it matters.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Lifestyle prevention built into a daily system.' },
  ],
});

// =============================================================================
// 4. How to prevent a second stroke
// =============================================================================
export const POST_PREVENT_SECOND_STROKE = makeBlogPost({
  slug: 'how-to-prevent-a-second-stroke',
  title: 'How to Prevent a Second Stroke: A Survivor\'s Checklist',
  description: 'A survivor\'s checklist for preventing a second stroke. Medications, blood pressure, sleep apnea, diet, and the daily habits that cut recurrence risk.',
  h1: 'How to prevent a second stroke',
  keyword: 'how to prevent a second stroke',
  subhead: '1 in 4 strokes are recurrent. Almost all of them are preventable. Here is the checklist that actually works.',
  ctaPrimary: { href: '/api/login', label: 'Build my prevention plan' },
  ctaSecondary: { href: '/blog/signs-of-a-second-stroke', label: 'Know the warning signs' },
  sections: [
    {
      h2: 'The non-negotiables',
      paragraphs: [
        'These are the items where the evidence is overwhelming. Skipping any of them dramatically raises your recurrence risk. Talk to your stroke neurologist about each one.',
      ],
      bullets: [
        'Take antiplatelet medication exactly as prescribed (aspirin, clopidogrel, or both)',
        'Anticoagulation if you have atrial fibrillation (apixaban, rivaroxaban, etc.)',
        'Blood pressure under 130/80 — measured at home, twice daily',
        'Statin if prescribed, every single day',
        'Stop smoking. Stop vaping. Both.',
        'Treat sleep apnea if you have it (CPAP compliance is non-optional)',
        'A1C under 7.0 if you have diabetes',
      ],
    },
    {
      h2: 'The lifestyle stack',
      paragraphs: [
        'These factors compound. Each one cuts recurrence risk by a small amount; together they cut it dramatically.',
        'Mediterranean-style eating reduces stroke risk by roughly 20% in clinical trials. Daily movement (any movement) reduces it further. Limiting alcohol to 1 drink per day for women, 2 for men. Maintaining a healthy weight. Managing stress with daily practice (meditation, breathing, walking, prayer — pick one and do it).',
      ],
    },
    {
      h2: 'The home monitoring kit',
      paragraphs: [
        'Every stroke survivor should own and use these four items: a validated home blood pressure cuff, a pill organizer with reminders, a pulse oximeter, and a scale. Track BP twice daily. Track weight weekly. Bring the data to every appointment.',
        'If your BP is consistently above target despite medication, that is information your doctor needs. Most second-stroke prevention failures are quiet — uncontrolled hypertension that nobody is measuring at home.',
      ],
    },
    {
      h2: 'The hidden risk factors',
      paragraphs: [
        'Sleep apnea is present in roughly 60% of stroke survivors and is a massive recurrence risk factor. If you snore, wake up tired, or your partner reports gasping at night, ask for a sleep study. CPAP compliance directly lowers stroke risk.',
        'Atrial fibrillation can be intermittent and silent. Wearable rhythm monitors (Apple Watch, KardiaMobile) catch it in survivors who would otherwise miss it. If your stroke was cryptogenic, ask about an extended monitor.',
        'Depression after stroke is itself a stroke risk factor through inflammation, sleep disruption, and medication non-adherence. Treating it aggressively is part of secondary prevention, not separate from it.',
      ],
    },
    {
      h2: 'The 90-day window',
      paragraphs: [
        'The 90 days after a stroke are the highest-risk window for recurrence. Be religious about medication, BP measurement, and follow-ups during this period. After 90 days the risk drops substantially but never to zero. The habits you build in the first 90 days are the ones that will protect you for years.',
      ],
    },
  ],
  faqs: [
    { q: 'What is the single most important thing to prevent a second stroke?', a: 'Blood pressure control, full stop. Hypertension is the largest modifiable risk factor for both first and recurrent strokes. Get it under 130/80 and keep it there.' },
    { q: 'Do I need to take aspirin forever?', a: 'Most ischemic stroke survivors are on lifelong antiplatelet therapy. Never stop without explicit instruction from your stroke neurologist — even for a procedure, get clearance first.' },
    { q: 'Does exercise prevent a second stroke?', a: 'Yes. 150 minutes of moderate aerobic activity per week is the standard recommendation, but even daily walking has measurable cardiovascular benefits.' },
    { q: 'Can supplements prevent a second stroke?', a: 'No supplement has the evidence base of statins, antihypertensives, and antiplatelet therapy. Some (omega-3s, vitamin D if deficient) have modest support. Most are marketing.' },
    { q: 'Is the risk highest right after the first stroke?', a: 'Yes. The first 90 days carry the highest recurrence risk by a wide margin. This is when medication compliance and follow-up matter most.' },
  ],
  related: [
    { href: '/blog/signs-of-a-second-stroke', label: 'Warning signs of a second stroke', blurb: 'BE-FAST and the silent signs.' },
    { href: '/blog/best-foods-for-stroke-recovery', label: 'The best foods for stroke recovery', blurb: 'Mediterranean-style eating made practical.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Prevention built into a daily system.' },
    { href: '/learn/depression-after-stroke', label: 'Depression after stroke', blurb: 'The hidden recurrence risk factor.' },
  ],
});

// =============================================================================
// 5. TIA vs stroke
// =============================================================================
export const POST_TIA_VS_STROKE = makeBlogPost({
  slug: 'tia-vs-stroke',
  title: 'TIA vs Stroke: What Every Survivor Needs to Know',
  description: 'TIA vs stroke: the difference, the warning, and why a TIA is a medical emergency. Written by a survivor who didn\'t take his TIA seriously enough.',
  h1: 'TIA vs stroke: what survivors need to know',
  keyword: 'tia vs stroke',
  subhead: 'A TIA is not a "mini-stroke." It is a major warning. Almost half of post-TIA strokes happen within 48 hours.',
  ctaPrimary: { href: '/api/login', label: 'Build my emergency plan' },
  ctaSecondary: { href: '/blog/signs-of-a-second-stroke', label: 'See the warning signs' },
  sections: [
    {
      h2: 'The difference in one paragraph',
      paragraphs: [
        'A stroke is a brain injury caused by blocked or bleeding blood flow that lasts long enough to kill brain tissue. A TIA — transient ischemic attack — is the same blockage but the body clears it before tissue dies. The symptoms are identical. The only difference is duration. From the outside, in the first 10 minutes, you cannot tell them apart.',
      ],
    },
    {
      h2: 'Why "mini-stroke" is the wrong word',
      paragraphs: [
        'Calling a TIA a "mini-stroke" makes it sound minor. It is not minor. About 1 in 3 people who have a TIA will have a full stroke within one year. Almost half of those happen within 48 hours. The TIA is the loudest warning shot the cardiovascular system can fire.',
        'Modern stroke centers treat a TIA as a full medical emergency: rapid imaging, carotid ultrasound, EKG, often admission for monitoring, and immediate initiation of antiplatelet therapy. If a clinician downplays your TIA, get a second opinion.',
      ],
    },
    {
      h2: 'How TIAs present',
      paragraphs: [
        'Same symptoms as a full stroke: face drooping, arm weakness, slurred speech, vision changes, balance problems, sudden confusion. The difference is they typically resolve in under an hour, often in 5–10 minutes. Survivors describe a "weird episode" they dismissed and went on with their day. That dismissal can be fatal.',
      ],
    },
    {
      h2: 'What to do if you think you had a TIA',
      paragraphs: [
        'Call 911. Even if symptoms have already resolved. The window to prevent the next event is short and the workup needs to happen now, not at next week\'s primary care appointment.',
        'In the ER, expect: CT and/or MRI brain imaging, carotid Doppler ultrasound, EKG, possibly an echocardiogram, and blood work. Most centers will start antiplatelet therapy immediately. Some will admit you for 23-hour observation. This is appropriate, not excessive.',
      ],
      bullets: [
        'Call 911 even if symptoms are gone',
        'Note the exact time symptoms started and ended',
        'Bring your medication list',
        'Do not drive yourself',
        'Insist on full workup including carotid imaging',
      ],
    },
    {
      h2: 'After the TIA',
      paragraphs: [
        'TIA recovery is the prevention of the second event. The protocol is the same as post-stroke prevention: BP control, antiplatelet medication, statin if indicated, lifestyle changes, and aggressive treatment of any structural cause found in the workup (carotid stenosis, atrial fibrillation, PFO).',
        'Survivors of TIA who follow the protocol have outcomes nearly indistinguishable from people who never had one. Survivors who dismiss the warning have outcomes that are dramatically worse.',
      ],
    },
  ],
  faqs: [
    { q: 'Can a TIA cause permanent damage?', a: 'By definition no — if it caused permanent damage on imaging, it is reclassified as a stroke. But repeated TIAs can cause cumulative cognitive effects, and many "TIAs" turn out to be small strokes on MRI.' },
    { q: 'How long does a TIA last?', a: 'Most TIAs resolve within 5–60 minutes. Symptoms lasting longer than that are usually a stroke, not a TIA.' },
    { q: 'Do you need to be hospitalized for a TIA?', a: 'Many stroke centers will admit for 23-hour observation, especially if your ABCD2 score is moderate or high. Same-day rapid TIA clinics are also appropriate.' },
    { q: 'What is the ABCD2 score?', a: 'A risk-stratification tool: Age, Blood pressure, Clinical features, Duration of symptoms, Diabetes. Higher scores predict higher near-term stroke risk.' },
    { q: 'Can a TIA mimic something else?', a: 'Yes. Migraine with aura, seizures, low blood sugar, and inner-ear problems can mimic TIA. Imaging and clinical assessment in the ER differentiate them.' },
  ],
  related: [
    { href: '/blog/signs-of-a-second-stroke', label: 'Warning signs of a second stroke', blurb: 'The full BE-FAST checklist.' },
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'Same protocol applies after a TIA.' },
    { href: '/blog/ischemic-vs-hemorrhagic-stroke', label: 'Ischemic vs hemorrhagic stroke', blurb: 'The two types of stroke.' },
    { href: '/learn/stroke-recovery-timeline', label: 'The recovery timeline', blurb: 'What to expect.' },
  ],
});

// =============================================================================
// 6. Ischemic vs hemorrhagic stroke
// =============================================================================
export const POST_ISCHEMIC_VS_HEMORRHAGIC = makeBlogPost({
  slug: 'ischemic-vs-hemorrhagic-stroke',
  title: 'Ischemic vs Hemorrhagic Stroke: The Differences That Matter',
  description: 'Ischemic vs hemorrhagic stroke explained for survivors and caregivers. Causes, treatment, recovery, and why the type changes everything that follows.',
  h1: 'Ischemic vs hemorrhagic stroke',
  keyword: 'ischemic vs hemorrhagic stroke',
  subhead: 'Two very different brain emergencies that get the same name. The difference changes treatment, prevention, and recovery.',
  ctaPrimary: { href: '/api/login', label: 'Get my recovery plan' },
  ctaSecondary: { href: '/blog/signs-of-a-second-stroke', label: 'Warning signs of a second stroke' },
  sections: [
    {
      h2: 'The two types in one paragraph',
      paragraphs: [
        'Ischemic stroke (about 87% of strokes): a clot blocks blood flow to part of the brain. Tissue downstream dies from lack of oxygen. Hemorrhagic stroke (about 13%): a blood vessel ruptures. Blood floods brain tissue, killing it directly and creating dangerous pressure inside the skull. Both are emergencies. Both can look identical from the outside. Only imaging tells them apart.',
      ],
    },
    {
      h2: 'Ischemic stroke',
      paragraphs: [
        'Causes include atherosclerosis (plaque buildup), atrial fibrillation (clot from the heart), carotid artery disease, and rare vascular conditions. The most common subtypes are large-artery atherosclerotic, cardioembolic, and lacunar (small-vessel disease).',
        'Treatment in the acute window: tPA (clot-busting drug, within 4.5 hours), mechanical thrombectomy (catheter clot removal, up to 24 hours in select cases). Both are time-critical. Every minute saved equals tissue saved.',
        'Long-term management: antiplatelet therapy (aspirin, clopidogrel) or anticoagulation (apixaban etc. for AFib), statin, blood pressure control, treatment of underlying vascular risk factors.',
      ],
    },
    {
      h2: 'Hemorrhagic stroke',
      paragraphs: [
        'Subtypes: intracerebral hemorrhage (bleeding into the brain itself, usually from chronic hypertension) and subarachnoid hemorrhage (bleeding into the space around the brain, usually from a ruptured aneurysm).',
        'Treatment is dramatically different from ischemic. No tPA — it would make bleeding worse. Focus is on stopping the bleed, controlling blood pressure, and managing intracranial pressure. Surgery may be needed to evacuate large bleeds, repair aneurysms, or relieve pressure.',
        'Long-term management: aggressive blood pressure control (often a tighter target than after ischemic stroke), avoiding antiplatelet drugs unless absolutely necessary, and management of any underlying vascular abnormality.',
      ],
    },
    {
      h2: 'Recovery — same and different',
      paragraphs: [
        'The recovery process is similar: neuroplasticity-driven rewiring, intensive therapy, daily practice. Ischemic stroke recovery is more "predictable" because the injury pattern is more uniform. Hemorrhagic stroke recovery can be slower in the first few months due to the toxic effects of blood on tissue, but long-term outcomes can be excellent — survivors of large hemorrhages have made dramatic recoveries.',
        'The Sasquatch Method works for both. Daily routine, escalating challenge, and the four pillars (Movement, Mind, Mission, Maintenance) apply regardless of stroke type.',
      ],
    },
    {
      h2: 'Prevention — different priorities',
      paragraphs: [
        'Ischemic prevention: BP control, lipid management, antiplatelet therapy, anticoagulation if AFib, smoking cessation, diabetes control. Hemorrhagic prevention: aggressive BP control above all, avoiding heavy alcohol, treatment of any known vascular malformation, careful management of anticoagulation if absolutely required.',
        'Blood pressure control is the single most important factor for both. For hemorrhagic survivors, the BP target is often tighter (<130/80 or even lower).',
      ],
    },
  ],
  faqs: [
    { q: 'Which type of stroke is more deadly?', a: 'Hemorrhagic strokes have higher early mortality (about 30-day case fatality 30-40% vs 10-15% for ischemic). But survivors of either type can recover excellent function.' },
    { q: 'Can you have both types?', a: 'Yes. Survivors with significant vascular disease are at risk for both, and any treatment plan must balance both risks.' },
    { q: 'Why does ischemic happen more often?', a: 'Atherosclerosis is extremely common. Risk factors (hypertension, smoking, diabetes, high cholesterol) are widespread. Atrial fibrillation also becomes more common with age.' },
    { q: 'How is the type determined?', a: 'CT scan is the first test. It quickly identifies hemorrhage. MRI gives more detail on ischemic injury. The treatment path diverges immediately based on these results.' },
    { q: 'Do they require different rehab?', a: 'The rehab principles are the same: intensive task-specific practice, neuroplasticity-driven training. Some hemorrhagic survivors need more careful BP monitoring during exercise.' },
  ],
  related: [
    { href: '/blog/signs-of-a-second-stroke', label: 'Warning signs of a second stroke', blurb: 'BE-FAST applies to both types.' },
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'Prevention checklist.' },
    { href: '/learn/neuroplasticity-after-stroke', label: 'Neuroplasticity after stroke', blurb: 'How recovery works for both types.' },
    { href: '/blog/tia-vs-stroke', label: 'TIA vs stroke', blurb: 'The warning shot before the event.' },
  ],
});

// =============================================================================
// 7. Can you drive after a stroke?
// =============================================================================
export const POST_DRIVING_AFTER_STROKE = makeBlogPost({
  slug: 'can-you-drive-after-a-stroke',
  title: 'Can You Drive After a Stroke? The Honest Survivor Guide',
  description: 'When and how to return to driving after a stroke. The medical clearance process, driving evaluations, and the honest answer survivors need.',
  h1: 'Can you drive after a stroke?',
  keyword: 'can you drive after a stroke',
  subhead: 'Driving is independence, identity, and freedom. Returning to it safely is a milestone — and one of the most contested conversations in recovery.',
  ctaPrimary: { href: '/api/login', label: 'Get the driving readiness checklist' },
  ctaSecondary: { href: '/learn/stroke-recovery-timeline', label: 'See the recovery timeline' },
  sections: [
    {
      h2: 'The short answer',
      paragraphs: [
        'Many survivors do return to driving safely. But "safely" is the load-bearing word. Returning to driving requires medical clearance, often a formal driving evaluation, and an honest self-assessment of vision, reaction time, attention, and motor control. Returning too early is dangerous to you and to other people.',
      ],
    },
    {
      h2: 'The medical clearance process',
      paragraphs: [
        'Most jurisdictions require you to disclose your stroke to the licensing authority. Many require medical clearance from a physician before resuming driving. Some require a formal on-road driving assessment. Rules vary by state and country — check yours specifically.',
        'A stroke neurologist or rehabilitation physician can clear you, but they are typically conservative for good reason. The risk of post-stroke driving incidents is highest in the first 6–12 months and remains elevated in survivors with residual deficits.',
      ],
    },
    {
      h2: 'The driving evaluation',
      paragraphs: [
        'A formal driving evaluation, usually conducted by an occupational therapist with specialized training, is the gold standard. It typically includes vision testing, cognitive assessment (attention, reaction time, problem-solving), motor function testing, and an on-road evaluation in a dual-control vehicle.',
        'These evaluations cost $300–$700 and are sometimes covered by insurance. They are worth every dollar. They produce a written recommendation that protects you legally and tells you objectively whether you are ready.',
      ],
    },
    {
      h2: 'Adaptations that make it possible',
      paragraphs: [
        'Many survivors with persistent deficits can drive safely with adaptations: spinner knobs for steering with one hand, left-foot accelerators, hand controls, or extended mirrors. Adaptive driving programs evaluate which adaptations you need and train you to use them.',
        'Some survivors find that simply restricting their driving (no highways, no nighttime, only familiar routes) is enough to maintain independence safely. Honest self-restriction is a valid strategy.',
      ],
      bullets: [
        'Spinner knobs and one-hand steering aids',
        'Left-foot accelerator pedals',
        'Hand controls for accelerator and brake',
        'Extended or wide-angle mirrors',
        'Voice-controlled GPS and phone integration',
      ],
    },
    {
      h2: 'When not to drive',
      paragraphs: [
        'Do not drive if you have: visual field loss in one or both eyes (homonymous hemianopia), seizures within the past 6–12 months, significant cognitive impairment, severe spatial neglect, severe arm or leg weakness affecting control, or anti-seizure or sedating medications that warn against driving.',
        'When in doubt, get the formal evaluation. The hardest conversation in recovery is the one where a family member tells a survivor it is not safe yet. The formal evaluation moves it from a family argument to a professional recommendation.',
      ],
    },
  ],
  faqs: [
    { q: 'How long after a stroke can you drive?', a: 'There is no universal timeline. Some survivors return in weeks; some in months; some never. The threshold is medical clearance and (often) a formal driving evaluation, not the calendar.' },
    { q: 'Do I have to tell the DMV about my stroke?', a: 'In most jurisdictions yes. Failure to disclose can void insurance coverage in the event of an incident. Check your local rules specifically.' },
    { q: 'Will my insurance still cover me?', a: 'Generally yes if you have medical clearance. Some insurers require updated documentation. Always disclose — non-disclosure can void coverage retroactively.' },
    { q: 'Can hemianopia disqualify me from driving?', a: 'In most jurisdictions yes, because driving requires visual field coverage on both sides. Some areas allow driving with adaptations and supplementary mirrors after a formal evaluation.' },
    { q: 'What if I fail the driving evaluation?', a: 'You can usually re-evaluate after additional rehabilitation. Many survivors who fail at 3 months pass at 12 months. Use the result as a recovery target, not a verdict.' },
  ],
  related: [
    { href: '/learn/stroke-recovery-timeline', label: 'The stroke recovery timeline', blurb: 'When milestones typically happen.' },
    { href: '/for/spouses', label: 'For spouses of stroke survivors', blurb: 'How to have the hard conversation about driving.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Build the readiness for milestones like this.' },
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Why driving for 30 minutes can be exhausting.' },
  ],
});

// =============================================================================
// 8. Best foods for stroke recovery
// =============================================================================
export const POST_BEST_FOODS = makeBlogPost({
  slug: 'best-foods-for-stroke-recovery',
  title: 'The 12 Best Foods for Stroke Recovery (Backed by Research)',
  description: 'The 12 best foods for stroke recovery, backed by research. What to eat, what to skip, and how to build a Mediterranean-style plate that protects the brain.',
  h1: 'The 12 best foods for stroke recovery',
  keyword: 'best foods for stroke recovery',
  subhead: 'Food is medicine in the recovery phase. Here is what the evidence actually supports — not the supplement-aisle hype.',
  ctaPrimary: { href: '/api/login', label: 'Get the survivor meal plan' },
  ctaSecondary: { href: '/blog/how-to-prevent-a-second-stroke', label: 'Prevent a second stroke' },
  sections: [
    {
      h2: 'The 12-food short list',
      paragraphs: [
        'These foods have the strongest evidence for cardiovascular and cognitive benefit, and they form the foundation of the Mediterranean-style eating pattern that is consistently associated with reduced stroke recurrence.',
      ],
      bullets: [
        '1. Fatty fish (salmon, sardines, mackerel) — omega-3s for vascular health',
        '2. Leafy greens (spinach, kale, arugula) — folate and nitrates',
        '3. Berries (blueberries, strawberries) — flavonoids',
        '4. Nuts and seeds (walnuts, almonds, flaxseed) — healthy fats',
        '5. Extra-virgin olive oil — primary fat source',
        '6. Whole grains (oats, brown rice, quinoa) — fiber and B vitamins',
        '7. Legumes (lentils, chickpeas, black beans) — plant protein and fiber',
        '8. Avocado — monounsaturated fats and potassium',
        '9. Tomatoes — lycopene',
        '10. Citrus fruit — vitamin C and flavonoids',
        '11. Dark chocolate (70%+) — flavanols, in moderation',
        '12. Green tea — catechins',
      ],
    },
    {
      h2: 'What to skip or limit',
      paragraphs: [
        'The evidence is just as strong on what to avoid: ultra-processed foods, sugary drinks, excess sodium (under 1500–2300 mg/day), trans fats, high amounts of red and processed meat, and excess alcohol (more than 1 drink/day for women, 2 for men).',
        'Cutting ultra-processed foods alone moves nearly every cardiovascular risk marker in the right direction within weeks. It is the single highest-leverage dietary change a survivor can make.',
      ],
    },
    {
      h2: 'The Mediterranean plate',
      paragraphs: [
        'A practical Mediterranean plate: half vegetables and fruit, a quarter whole grains or legumes, a quarter fish or lean protein. Olive oil is the primary fat. Nuts and seeds for snacks. Water is the default beverage.',
        'The PREDIMED trial — a major Mediterranean diet study — showed roughly 30% fewer cardiovascular events in people who followed this pattern with extra-virgin olive oil or mixed nuts, compared to a low-fat control. For stroke survivors specifically, the relative risk reduction was even larger.',
      ],
    },
    {
      h2: 'Brain-specific considerations',
      paragraphs: [
        'For the recovering brain specifically, prioritize: omega-3s (fatty fish 2x/week minimum, or algae-based DHA supplement if vegetarian), antioxidant-rich produce (the more colors on your plate the better), and adequate protein (0.8–1.2 g per kg body weight per day to support muscle and tissue repair during therapy).',
        'Hydration matters more than people think. Mild dehydration measurably impairs cognition and reaction time. Aim for pale-yellow urine. Coffee and tea count toward daily fluid intake.',
      ],
    },
    {
      h2: 'Practical implementation',
      paragraphs: [
        'Do not try to overhaul everything in week one. Add before you subtract. Add fish twice a week. Add a salad with lunch. Add berries to breakfast. Subtract one sugary drink. Subtract one processed snack. The compounding is fast.',
        'Survivors who pair this with the Sasquatch Daily Routine (movement + mind + meals) see the steepest improvements in BP, cognitive scores, and energy levels in the first 90 days.',
      ],
    },
  ],
  faqs: [
    { q: 'What is the single best food for stroke recovery?', a: 'No single food does it. The pattern matters more than any one item. That said, fatty fish 2–3 times per week has the most consistent evidence for vascular and cognitive benefit.' },
    { q: 'Should I take supplements?', a: 'Most supplements have weak evidence. Vitamin D if you are deficient, omega-3 if you do not eat fish, B12 if you are vegetarian or on metformin. Discuss with your doctor before starting anything else.' },
    { q: 'Is the keto or carnivore diet good after a stroke?', a: 'No high-quality evidence supports keto or carnivore for stroke recovery, and both can raise LDL cholesterol significantly in some people. The Mediterranean pattern has the best evidence for survivors.' },
    { q: 'How much salt is too much?', a: 'Most stroke survivors should aim for under 2300 mg/day; under 1500 mg/day if you have hypertension. Most of the salt comes from processed foods and restaurant meals, not the salt shaker.' },
    { q: 'Can I drink alcohol after a stroke?', a: 'Light drinking (up to 1 drink/day for women, 2 for men) is generally tolerated, but heavy drinking raises stroke risk. After a hemorrhagic stroke, even modest drinking can be problematic — discuss with your neurologist.' },
  ],
  related: [
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'Diet is one pillar of prevention.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Movement, mind, and meals together.' },
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Diet and energy are tightly linked.' },
    { href: '/programs/sasquatch-method', label: 'The Sasquatch Method', blurb: 'The full operating system.' },
  ],
});

// =============================================================================
// 9. Fatigue after stroke
// =============================================================================
export const POST_FATIGUE = makeBlogPost({
  slug: 'fatigue-after-stroke',
  title: 'Fatigue After Stroke: Why It Hits So Hard and What Helps',
  description: 'Post-stroke fatigue is real, biological, and brutal. Why it happens, what makes it worse, and the routine that actually moves the needle for survivors.',
  h1: 'Fatigue after stroke: why it hits so hard',
  keyword: 'fatigue after stroke',
  subhead: 'Up to 70% of survivors experience post-stroke fatigue. It is not laziness, not depression, not weakness. It is biology — and it is treatable.',
  ctaPrimary: { href: '/api/login', label: 'Get the energy protocol' },
  ctaSecondary: { href: '/blog/sleep-problems-after-stroke', label: 'Sleep problems after stroke' },
  sections: [
    {
      h2: 'What post-stroke fatigue actually is',
      paragraphs: [
        'Post-stroke fatigue (PSF) is a distinct clinical syndrome — not the same as ordinary tiredness, not the same as depression-related fatigue. It is characterized by overwhelming exhaustion that is not relieved by rest, that is disproportionate to activity, and that interferes with rehabilitation.',
        'Up to 70% of survivors experience it, and for many it is the most disabling symptom of recovery — more disabling than the physical deficits themselves. It is also the symptom most often dismissed by clinicians who have not had a stroke themselves.',
      ],
    },
    {
      h2: 'Why it happens',
      paragraphs: [
        'Several mechanisms contribute. First, the brain is doing more work to do less — damaged regions are recruiting backup areas to perform tasks, which is metabolically expensive. Second, sleep is often disrupted (about 60% of survivors have sleep apnea, often undiagnosed). Third, neuroinflammation persists for months. Fourth, depression is common and amplifies fatigue.',
        'Add medication side effects (antihypertensives, statins, antidepressants), reduced cardiovascular fitness from inactivity, and the emotional weight of recovery itself, and PSF is often a multi-cause problem requiring a multi-front response.',
      ],
    },
    {
      h2: 'What makes it worse',
      paragraphs: [
        'Inactivity is the trap. Doing less feels protective in the short term but compounds the problem over weeks: muscle deconditioning, worse sleep, lower mood, more fatigue. Conversely, structured daily activity — even modest amounts — tends to improve fatigue over weeks.',
        'Other amplifiers: poor sleep hygiene, untreated sleep apnea, dehydration, blood-sugar spikes from processed carbs, alcohol, and skipping meals.',
      ],
    },
    {
      h2: 'What actually helps',
      paragraphs: [
        'Energy management strategies: pace yourself with the "spoon theory" — plan high-energy tasks for your peak hours, build rest into the day before you need it, and avoid the boom-bust cycle.',
        'Sleep optimization: rule out sleep apnea (insist on a sleep study if you snore or wake unrefreshed), maintain consistent bed and wake times, get morning sunlight, avoid screens 1 hour before bed, and treat any pain that wakes you up.',
        'Graded exercise: counter-intuitive but well-supported. Survivors who do daily moderate exercise report less fatigue at 3 months than survivors who rest. Start where you are and progress slowly.',
        'Treat depression aggressively. SSRIs improve PSF in many survivors even when depression is not the primary diagnosis.',
      ],
      bullets: [
        'Sleep study to rule out apnea',
        'Daily movement, even brief',
        'Pacing — plan rest before exhaustion',
        'Treat depression and pain',
        'Hydration and consistent meals',
        'Sunlight in the morning',
      ],
    },
    {
      h2: 'The Daily Routine approach',
      paragraphs: [
        'The Sasquatch Daily Routine is built around energy management. Each level is calibrated to the survivor\'s current capacity. The routine starts small, scales gradually, and explicitly includes rest. Survivors report better fatigue scores within 2–3 weeks of starting because the routine breaks the boom-bust cycle.',
      ],
    },
  ],
  faqs: [
    { q: 'How long does post-stroke fatigue last?', a: 'For many survivors it improves significantly over 3–12 months. For some it persists for years and requires ongoing management. Treatment usually helps even when it does not fully resolve.' },
    { q: 'Is post-stroke fatigue different from depression fatigue?', a: 'Yes. PSF can occur without depression and often does not respond to depression treatment alone. But the two often coexist and treating both gives the best results.' },
    { q: 'Will I always be this tired?', a: 'Most survivors see substantial improvement within the first year. Without treatment, the trajectory can be flat — but with proper sleep, movement, and depression treatment, most see meaningful improvement.' },
    { q: 'Are stimulants used for post-stroke fatigue?', a: 'Sometimes. Modafinil and methylphenidate have been studied with mixed results. Most stroke neurologists prefer to address sleep, depression, and exercise first before prescribing stimulants.' },
    { q: 'Why am I more tired in the afternoon?', a: 'Cognitive load accumulates. The brain compensating for stroke injury is metabolically expensive, and it shows up as afternoon crashes. Plan demanding tasks for the morning.' },
  ],
  related: [
    { href: '/learn/depression-after-stroke', label: 'Depression after stroke', blurb: 'The other half of recovery.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Built around energy management.' },
    { href: '/blog/best-foods-for-stroke-recovery', label: 'Best foods for stroke recovery', blurb: 'Energy and recovery are tightly linked.' },
    { href: '/blog/memory-problems-after-stroke', label: 'Memory problems after stroke', blurb: 'Often a symptom of fatigue, not pure cognitive injury.' },
  ],
});

// =============================================================================
// 10. Spasticity after stroke
// =============================================================================
export const POST_SPASTICITY = makeBlogPost({
  slug: 'spasticity-after-stroke',
  title: 'Spasticity After Stroke: What It Is and How to Treat It',
  description: 'Spasticity after stroke explained: why muscles tighten, why stretching alone doesn\'t fix it, and the protocols that actually loosen and strengthen.',
  h1: 'Spasticity after stroke',
  keyword: 'spasticity after stroke',
  subhead: 'Spasticity is not "tight muscles." It is a brain injury showing up in the limb. The treatment has to address both ends.',
  ctaPrimary: { href: '/api/login', label: 'Get the spasticity protocol' },
  ctaSecondary: { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery' },
  sections: [
    {
      h2: 'What spasticity actually is',
      paragraphs: [
        'Spasticity is increased muscle tone caused by loss of inhibitory signals from the brain. After stroke, the damaged motor pathways stop sending the "relax" signal, so muscles default to a contracted state. The arm curls in. The hand fists. The leg locks straight or scissors. The foot points down.',
        'It usually emerges weeks to months after the stroke, peaks in the first year, and can persist or worsen without treatment. Untreated spasticity leads to contractures (permanent shortening of muscle and joint capsule) that are dramatically harder to reverse.',
      ],
    },
    {
      h2: 'Why stretching alone fails',
      paragraphs: [
        'Stretching feels like the obvious treatment, but stretching alone rarely produces lasting change. The problem is upstream — in the brain — not in the muscle fiber. Stretch a spastic muscle, walk away, and within minutes the tone returns.',
        'Effective treatment combines: medical management (botulinum toxin injections, oral baclofen in some cases), positional management (splinting and orthotics to maintain length), active movement training (forcing the brain to send relax signals), and strengthening of the opposing muscles.',
      ],
    },
    {
      h2: 'Botulinum toxin (Botox) injections',
      paragraphs: [
        'For focal spasticity (one specific muscle group causing the problem), botulinum toxin injections are the gold standard. They temporarily weaken the spastic muscle, creating a 3–4 month window where rehabilitation can do its work.',
        'Botox without rehab is half the treatment. Botox plus daily stretching, splinting, and active movement can produce long-lasting functional gains. The injection is the door — the rehab is the room you walk into.',
      ],
    },
    {
      h2: 'Splinting and orthotics',
      paragraphs: [
        'Resting hand splints, ankle-foot orthoses (AFOs), and serial casting are tools to maintain muscle length and prevent contractures. They work best in combination with active treatment. A static splint without active practice is just slowing the deterioration; with active practice it is part of the treatment.',
      ],
    },
    {
      h2: 'Active movement and the Sasquatch protocol',
      paragraphs: [
        'The most underused treatment is active movement of the spastic limb. Constraint-induced movement therapy (CIMT), task-specific repetitive practice, and electrical stimulation paired with active effort all force the brain to recruit residual motor pathways and reduce spasticity over time.',
        'The Sasquatch Daily Routine includes spasticity-aware protocols: stretch, then activate, then strengthen the opposite (antagonist) muscles. Doing this daily for 12–16 weeks moves the needle in ways that no single intervention does in isolation.',
      ],
    },
  ],
  faqs: [
    { q: 'When does spasticity start after a stroke?', a: 'Typically 1–6 weeks after stroke, but it can emerge later. About one-third of survivors develop clinically significant spasticity within the first year.' },
    { q: 'Is spasticity permanent?', a: 'It can be reduced and managed but rarely fully cured. With consistent treatment, function improves and contractures are prevented. Without treatment, it usually worsens.' },
    { q: 'Does Botox cure spasticity?', a: 'No — it provides a 3–4 month window of reduced tone during which rehabilitation can build new motor patterns. Repeated injections plus active rehab produce the best long-term results.' },
    { q: 'Can spasticity be a good thing?', a: 'In some severe cases, low-grade spasticity in the leg can support standing and walking. This is why treatment is individualized — too much relaxation can compromise function.' },
    { q: 'Will my arm always be curled?', a: 'Not necessarily. Many survivors regain useful arm and hand function with combined botox + intensive rehab + daily home practice, even years after stroke.' },
  ],
  related: [
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak side back.' },
    { href: '/learn/stroke-recovery-exercises-at-home', label: 'Stroke recovery exercises at home', blurb: 'Daily protocols you can do today.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'Spasticity protocols built in.' },
    { href: '/blog/foot-drop-after-stroke', label: 'Foot drop after stroke', blurb: 'A specific spasticity problem.' },
  ],
});

// =============================================================================
// 11. Memory problems after stroke
// =============================================================================
export const POST_MEMORY = makeBlogPost({
  slug: 'memory-problems-after-stroke',
  title: 'Memory Problems After Stroke: Causes, Tests, and Recovery',
  description: 'Memory problems after stroke are common and often improvable. The types, the causes you can treat, and the protocols that rebuild cognitive function.',
  h1: 'Memory problems after stroke',
  keyword: 'memory problems after stroke',
  subhead: 'Memory issues after stroke are not all the same. Pinpointing the type is the first step toward fixing the right thing.',
  ctaPrimary: { href: '/api/login', label: 'Get the cognitive protocol' },
  ctaSecondary: { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke' },
  sections: [
    {
      h2: 'The four types of post-stroke memory problems',
      paragraphs: [
        'Lumping all "memory problems" together leads to bad treatment. The actual breakdown:',
      ],
      bullets: [
        'Working memory: Holding information in mind for seconds (a phone number, a verbal instruction). Often impaired after frontal-lobe injury.',
        'Episodic memory: Remembering events and experiences. Often impaired after temporal-lobe or hippocampal injury.',
        'Semantic memory: Remembering facts and meanings. Less commonly affected by stroke than by Alzheimer\'s.',
        'Procedural memory: Remembering how to do things (riding a bike, brushing teeth). Usually preserved after stroke.',
      ],
    },
    {
      h2: 'Causes you can treat',
      paragraphs: [
        'Many post-stroke "memory problems" are actually attention or fatigue problems in disguise. If you cannot pay attention to the information when it comes in, you cannot remember it later. Treating the upstream cause (fatigue, depression, sleep apnea, medication side effects, pain) often resolves the apparent memory issue.',
        'Other treatable contributors: B12 or vitamin D deficiency, thyroid dysfunction, depression, anxiety, alcohol use, polypharmacy (especially anticholinergic medications), and untreated sleep apnea.',
      ],
    },
    {
      h2: 'Get the right testing',
      paragraphs: [
        'A neuropsychological evaluation breaks down memory into its components and identifies which specific subsystems are affected. This is the gold standard for understanding your cognitive profile and guiding treatment. It typically takes 3–6 hours over one or two visits and produces a detailed written report.',
        'Brief screens like MoCA and MMSE catch obvious problems but miss subtle deficits. If something feels off and the brief screen says "normal," request a full neuropsychological evaluation.',
      ],
    },
    {
      h2: 'What works to rebuild memory',
      paragraphs: [
        'Cognitive rehabilitation has the best evidence for working memory and attention. Speech-language pathologists and occupational therapists deliver it. Computer-based training (CogMed, BrainHQ) can supplement but does not replace human-led therapy.',
        'Compensatory strategies: external memory aids (calendar, notebook, phone reminders), routines (same place for keys, same time for medications), the "tell-back" technique (repeat what someone just told you), and chunking (breaking long information into smaller pieces).',
        'Lifestyle factors with cognitive benefit: aerobic exercise (the strongest single intervention), Mediterranean diet, social engagement, learning new skills, and excellent sleep.',
      ],
    },
    {
      h2: 'When to worry',
      paragraphs: [
        'Memory should slowly improve or stabilize over the first 1–2 years, with continued slow gains possible after that. If memory is getting noticeably worse over months, that is not typical post-stroke recovery and warrants evaluation for other causes (vascular dementia, Alzheimer\'s comorbidity, depression, medication, sleep apnea).',
      ],
    },
  ],
  faqs: [
    { q: 'Will my memory ever come back after stroke?', a: 'Most survivors see substantial improvement in the first 6–12 months. Continued gains are possible with cognitive rehab, lifestyle factors, and compensatory strategies. Full pre-stroke baseline is uncommon but functional independence is achievable for most.' },
    { q: 'Are stroke memory problems the same as dementia?', a: 'No. Stroke causes focal injury to specific brain regions; dementia causes diffuse degeneration. They can coexist (vascular dementia is common after multiple strokes), but they are distinct.' },
    { q: 'Do brain games help?', a: 'Modestly. They improve performance on the games themselves but the transfer to real-world function is limited. Cognitive rehab with a therapist transfers better.' },
    { q: 'Why do I forget words mid-sentence?', a: 'Word-finding difficulty is more about language than memory and is often a symptom of mild aphasia. It often improves substantially with speech therapy and continued language use.' },
    { q: 'Should I be worried about Alzheimer\'s?', a: 'Stroke does increase the risk of later cognitive decline. Treating vascular risk factors aggressively, staying physically and cognitively active, and treating depression all reduce this risk.' },
  ],
  related: [
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Often the upstream cause of "memory" problems.' },
    { href: '/learn/aphasia-recovery', label: 'Aphasia recovery', blurb: 'Language vs memory — a different problem.' },
    { href: '/blog/best-foods-for-stroke-recovery', label: 'Best foods for stroke recovery', blurb: 'Diet and cognition.' },
    { href: '/programs/sasquatch-method', label: 'The Sasquatch Method', blurb: 'Mind is one of the four pillars.' },
  ],
});

// =============================================================================
// 12. Why do stroke survivors cry easily? (Pseudobulbar affect)
// =============================================================================
export const POST_PBA = makeBlogPost({
  slug: 'why-do-stroke-survivors-cry-easily',
  title: 'Why Do Stroke Survivors Cry So Easily? (Pseudobulbar Affect)',
  description: 'Sudden uncontrollable crying or laughing after stroke is pseudobulbar affect (PBA). What it is, why it happens, and the treatments that help.',
  h1: 'Why do stroke survivors cry so easily?',
  keyword: 'why do stroke survivors cry easily',
  subhead: 'Sudden tears that don\'t match how you feel inside? It has a name — pseudobulbar affect — and it is treatable.',
  ctaPrimary: { href: '/api/login', label: 'Find the right treatment' },
  ctaSecondary: { href: '/learn/depression-after-stroke', label: 'Depression after stroke' },
  sections: [
    {
      h2: 'What pseudobulbar affect is',
      paragraphs: [
        'Pseudobulbar affect (PBA) is sudden, involuntary episodes of crying or laughing that do not match the person\'s actual emotional state. The survivor knows the response is disproportionate. They cannot stop it. It is exhausting, embarrassing, and genuinely disabling.',
        'PBA happens because the stroke damaged the pathways that connect the cortex (thinking brain) to the brainstem (where the physical expression of emotion is generated). The brakes on emotional expression are gone. Small triggers produce huge responses.',
      ],
    },
    {
      h2: 'PBA vs depression',
      paragraphs: [
        'PBA is often misdiagnosed as depression because crying is the most visible symptom. But they are different conditions. Depression is a sustained mood state with cognitive and behavioral features. PBA is transient, episodic, and often inappropriate to the actual mood.',
        'A useful test: ask the survivor "how do you actually feel right now, separate from the tears?" In depression, the answer is sad. In PBA, the answer is often "fine — but I cannot stop crying." The two can coexist; treat both if both are present.',
      ],
    },
    {
      h2: 'How common it is',
      paragraphs: [
        'PBA affects an estimated 10–35% of stroke survivors, though many cases go undiagnosed because survivors and clinicians attribute it to depression. It is more common after brainstem and frontal-lobe strokes.',
        'It often improves slowly over the first year but can persist indefinitely without treatment. The good news: targeted treatment is highly effective.',
      ],
    },
    {
      h2: 'Treatment options',
      paragraphs: [
        'Medications: Dextromethorphan/quinidine (Nuedexta) is FDA-approved specifically for PBA and produces meaningful reduction in episodes for most patients. SSRIs (citalopram, sertraline) and SNRIs are also effective at lower doses than typically used for depression and often work within days to weeks.',
        'Behavioral strategies: Slowed breathing during the onset of an episode can shorten it. Distraction, position change, and warning others ("this is PBA, not how I feel") all reduce the social impact. Most survivors find that simply having a name for it reduces its emotional weight.',
      ],
      bullets: [
        'Dextromethorphan/quinidine (Nuedexta) — FDA-approved for PBA',
        'SSRIs (citalopram, sertraline) at lower doses',
        'Slowed breathing during onset',
        'Distraction techniques',
        'Educating family and coworkers',
      ],
    },
    {
      h2: 'What to tell people',
      paragraphs: [
        'The single hardest part of PBA is the social fallout. Coworkers, neighbors, and even family interpret the tears as something the survivor is doing on purpose or as a sign of severe depression. Naming it directly defuses most of this. "It is called pseudobulbar affect — my brain is misfiring after my stroke. Give me 30 seconds and it will pass."',
        'Survivors who name PBA out loud to the people in their lives report dramatically less embarrassment and isolation. Caregivers should understand that the survivor is often more upset by the episode than the people around them.',
      ],
    },
  ],
  faqs: [
    { q: 'Is pseudobulbar affect dangerous?', a: 'Not physically. But it is genuinely disabling socially and can lead to isolation, missed work, and avoidance of public places. Treatment is worth pursuing.' },
    { q: 'Does PBA go away?', a: 'It often improves over the first year but can persist for years. Treatment usually produces substantial relief regardless of how long it has been present.' },
    { q: 'Can PBA be triggered by anything?', a: 'Often by emotional content (sad movies, conversations about loss) but also by anything mildly emotional including humor, attention, or physical sensation. Triggers can become unpredictable over time.' },
    { q: 'Is there a test for PBA?', a: 'The CNS-LS (Center for Neurologic Study Lability Scale) is a brief validated questionnaire used by clinicians to identify PBA. Ask your neurologist or stroke clinic.' },
    { q: 'Can PBA happen after TIA?', a: 'Rarely. PBA usually requires structural injury to specific pathways. After TIA, ongoing emotional changes are more likely depression, anxiety, or post-traumatic stress related to the event.' },
  ],
  related: [
    { href: '/learn/depression-after-stroke', label: 'Depression after stroke', blurb: 'PBA and depression are different but often coexist.' },
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Another invisible recovery battle.' },
    { href: '/for/spouses', label: 'For spouses of stroke survivors', blurb: 'How to recognize and support PBA in a partner.' },
    { href: '/for/caregivers', label: 'For caregivers of stroke survivors', blurb: 'Naming PBA reduces caregiver burnout.' },
  ],
});

// =============================================================================
// 13. Foot Drop Rehab — Product Showcase (Amazon affiliate)
// =============================================================================
export const POST_FOOT_DROP_REHAB = makeBlogPost({
  slug: 'foot-drop-rehab-equipment-review',
  title: 'Foot Drop Rehab Equipment: How I Built My Ankle Back From Zero',
  description: 'The electric ankle rehabilitation trainer that helped me rebuild foot control after stroke. Real review, real results, and why it beat everything else I tried.',
  h1: 'Foot drop rehab equipment: what actually worked after stroke',
  keyword: 'foot drop rehab equipment',
  subhead: 'I went from drop foot so bad I tripped over flat ground to walking without an AFO. This electric ankle trainer was the bridge — here is the honest breakdown.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See the trainer on Amazon' },
  ctaSecondary: { href: '/blog/spasticity-after-stroke', label: 'Read the spasticity guide' },
  productCard: {
    title: 'Electric Ankle Rehabilitation Trainer',
    description: '3-speed motorized ankle rehab with -30\u00B0 to +40\u00B0 full arc. Active-assisted design forces the brain to rebuild the motor pathway.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'Check price on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you. I only recommend products I have used.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book — THE ULTIMATE STROKE RECOVERY REVOLUTION — covers the daily routine, the mindset, the gear, and the protocols that took me from 0% to 90%+.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'What foot drop actually cost me',
      paragraphs: [
        'Drop foot was one of the cruelest residuals of my stroke. My brain stopped sending the "lift" signal to my left ankle. The foot hung, the toe caught, and I fell. I fell in the kitchen. I fell in the driveway. I fell carrying my son and had to catch him on my bad shoulder while I went down hard. Each fall was a reset — the body tenses, the gait gets worse, the fear grows.',
        'I wore an AFO for two years. It kept me upright, but it also taught my brain that the ankle did not need to work. The AFO was a crutch that became a habit. Every therapist I trusted said the same thing: if you want the ankle back, you have to force the brain to recruit it. Passive stretching is not enough. The muscle has to fire under load, repeatedly, until the pathway reopens.',
      ],
    },
    {
      h2: 'What I tried before the electric trainer',
      paragraphs: [
        'I spent six months on manual resistance band work. It helped — slowly. The problem was consistency. Bands rely on your other hand to hold them, which means you need someone to set them up, or you need to contort your body into a position that is awkward enough to skip. I skipped more days than I completed.',
        'I tried passive range-of-motion machines at a clinic. They moved the ankle through a preset arc, but the ankle was not doing the work — the machine was. The brain learns what it is asked to do. Passive motion does not ask the motor cortex to participate. It is better than nothing, but it is not the same as active training.',
        'I tried electrical stimulation (NMES) paired with movement. This was closer — the stim forced the muscle to fire while I attempted the motion. The results were real but limited. The stim unit was expensive, the pads were finicky, and the setup time was long enough that I used it less over time.',
      ],
    },
    {
      h2: 'The electric ankle trainer — why it clicked',
      paragraphs: [
        'The Electric Ankle Rehabilitation Training device is a motorized brace that moves the ankle through a controlled range of motion while your muscle actively resists and assists. It has three speed settings and a full arc from -30 degrees (plantarflexion) to +40 degrees (dorsiflexion). The key difference: the machine provides the motion, but your muscle must engage to keep the foot aligned with the moving platform. It is active-assisted movement at a scale you cannot replicate with bands or a wall.',
        'The first week I used it, I set the speed to the lowest setting and the range to half the arc. The ankle felt stiff and the calf cramped. By week three, I had the full range at medium speed. By month two, I was walking around the house without the AFO for short distances. By month four, the AFO was in a drawer. I have not opened that drawer in over four years.',
      ],
      bullets: [
        '3-speed motor adjusts to your current strength level',
        'Full arc from -30 to +40 degrees — covers the full ankle range',
        'Active-assisted design forces the brain to recruit the motor pathway',
        'Compact enough to use while sitting at a desk or watching TV',
        'No setup time — strap in and start',
      ],
    },
    {
      h2: 'How I used it in the daily routine',
      paragraphs: [
        'I built it into the Sasquatch Daily Routine at the "Movement" pillar. Fifteen minutes in the morning before the walk, fifteen minutes in the evening before bed. The morning session warmed the ankle up for gait training. The evening session reinforced the motor pattern while the brain was still plastic from the day\'s activity.',
        'The consistency mattered more than the intensity. Low speed, daily use, for months. That is the neuroplasticity formula. The brain does not care about intensity on any single day — it cares about reliable signal, repeated, over time. This machine made that reliable signal possible without a therapist, without a clinic, without a gym membership.',
      ],
    },
    {
      h2: 'Who it is for — and who it is not',
      paragraphs: [
        'It is for: survivors with drop foot who have enough residual motor control to attempt dorsiflexion, even if the attempt is weak. It is for people who will use it daily. It is for survivors who want to work toward AFO independence. It is for anyone who needs structured, repeatable ankle motion at home.',
        'It is not for: acute post-stroke patients in the first few weeks (wait for medical clearance). It is not for survivors with severe contractures where the ankle cannot physically move through the arc. It is not for people who want a passive fix without daily effort. The machine does the motion — you still have to show up.',
      ],
    },
    {
      h2: 'The verdict',
      paragraphs: [
        'I own this device. I used it daily for months. It is the single piece of home equipment I recommend most often to survivors with foot drop. Not because it is magic — because it solves the consistency problem. It makes active ankle training possible at home, on your schedule, without a therapist holding the band.',
        'If you are building a home rehab kit, this is the first item I would add after the resistance bands. It is not cheap, but it is cheaper than months of clinic visits, and the results are yours to keep. The link below is an Amazon affiliate link — I earn a small commission if you buy through it, at no extra cost to you. I only recommend products I have used myself. This one is real.',
      ],
    },
  ],
  faqs: [
    { q: 'How long does foot drop take to improve after stroke?', a: 'With daily active training, many survivors see measurable improvement in 8–12 weeks. Full AFO independence can take 4–6 months or longer depending on severity and consistency.' },
    { q: 'Can foot drop be cured permanently?', a: 'Full recovery is possible for some survivors. The key is neuroplasticity — repeated, task-specific practice that forces the brain to rebuild the motor pathway. The electric trainer accelerates this by providing the repetition in a structured format.' },
    { q: 'Is an electric trainer better than resistance bands?', a: 'Bands are cheaper and effective for strong survivors. The electric trainer wins on consistency — it does not require setup, it provides the full arc of motion, and it is easier to use daily without a partner.' },
    { q: 'Do I need a prescription to use this?', a: 'No — it is an over-the-counter rehabilitation device. However, if you are early post-stroke, get clearance from your physician or physical therapist before starting any new training equipment.' },
    { q: 'How long should I use it each day?', a: 'I used 15 minutes, twice daily. That is 30 minutes total — enough to trigger neuroplasticity without overfatiguing the muscle. Start with 10 minutes once daily and build up.' },
  ],
  related: [
    { href: '/blog/spasticity-after-stroke', label: 'Spasticity after stroke', blurb: 'The other half of the ankle story.' },
    { href: '/blog/can-you-fully-recover-from-a-stroke', label: 'Can you fully recover from a stroke?', blurb: 'The honest answer from a survivor who went from paralysis to 90%.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How this fits into the full system.' },
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak side back, step by step.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 14. AFO vs Electric Trainer
// =============================================================================
export const POST_AFO_VS_ELECTRIC = makeBlogPost({
  slug: 'afo-vs-electric-ankle-trainer',
  title: 'AFO vs Electric Ankle Trainer: Which Should You Buy First?',
  description: 'AFO braces vs electric ankle rehabilitation trainers — the pros, cons, and the exact order I wish I had bought them in.',
  h1: 'AFO vs electric ankle trainer: which one first?',
  keyword: 'afo vs electric ankle trainer',
  subhead: 'I bought the AFO first and used it for two years. I bought the electric trainer second and left the AFO in a drawer four months later. Here is the order I wish I had used.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See the electric trainer on Amazon' },
  ctaSecondary: { href: '/blog/foot-drop-rehab-equipment-review', label: 'Full foot drop review' },
  productCard: {
    title: 'Electric Ankle Rehabilitation Trainer',
    description: '3-speed motorized ankle rehab with full arc. The active trainer I used to leave my AFO in a drawer for good.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'Check price on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book covers the daily routine, the mindset, the gear, and the protocols that took me from 0% to 90%+.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'What an AFO does',
      paragraphs: [
        'An ankle-foot orthosis (AFO) is a brace that holds your foot at ninety degrees, preventing the toe from catching the ground. It is the standard prescription for drop foot after stroke. It works immediately. It prevents falls. It is covered by most insurance. And it is the single biggest trap in early recovery.',
        'The AFO teaches the brain that the ankle does not need to work. The sensorimotor cortex stops trying to fire the dorsiflexor muscles because the brace is doing the job. The result: the ankle atrophies further, the pathway degrades faster, and the survivor becomes more dependent on the brace over time instead of less.',
      ],
      bullets: [
        'Prevents falls immediately',
        'Covered by insurance',
        'No training required — strap it on and walk',
        'Teaches the brain the ankle is not needed',
        'Atrophy accelerates while the brace is worn',
        'Dependency grows, not shrinks',
      ],
    },
    {
      h2: 'What an electric trainer does',
      paragraphs: [
        'The electric ankle rehabilitation trainer moves the ankle through a full range of motion while the muscle actively engages. It provides the repetition, the full arc, and the consistency that neuroplasticity requires. It does not prevent falls today — it rebuilds the ankle so you do not need prevention tomorrow.',
        'The key difference is active vs passive. The AFO is passive. The electric trainer is active-assisted. The brain only rewires when it is asked to participate. The electric trainer asks the motor cortex to participate hundreds of times per session.',
      ],
      bullets: [
        'Rebuilds motor pathway through active-assisted repetition',
        'Full arc motion from -30 to +40 degrees',
        'Three speeds for progressive overload',
        'No clinic required — use at home on your schedule',
        'Results in months, not years',
        'Does not prevent falls on day one',
      ],
    },
    {
      h2: 'The order I wish I had used',
      paragraphs: [
        'If I were rebuilding my recovery from scratch, I would buy the electric trainer in month two — as soon as I had medical clearance for active movement. I would use it daily for three months while still wearing the AFO for safety during walks outside. By month four, I would test walking indoors without the AFO. By month six, the AFO would be in the drawer.',
        'The mistake I made: I bought the AFO, used it exclusively, and did not start active training until year two. By then, the motor pathway had degraded significantly. I spent six months catching up to where I could have been at month six. The AFO is a safety tool. The electric trainer is a recovery tool. Use both — but use the recovery tool as early as possible.',
      ],
    },
    {
      h2: 'The cost comparison',
      paragraphs: [
        'AFOs range from $50 for off-the-shelf models to $800+ for custom carbon-fiber. They are usually covered by insurance. The electric ankle trainer is a one-time purchase at a higher price point. Over two years, the AFO costs less. Over five years, the trainer costs far less — because it eliminates the need for the AFO and reduces the risk of falls, sprains, and the secondary costs that come with them.',
      ],
    },
  ],
  faqs: [
    { q: 'Can I use both at the same time?', a: 'Yes. Many survivors use the AFO for safety during outdoor walks while training with the electric device at home. This is the safest hybrid approach. The AFO protects you from falls; the trainer rebuilds the muscle that will eventually make the AFO unnecessary.' },
    { q: 'How do I know when to stop using the AFO?', a: 'Test indoors first. Walk across a room without the AFO. If you can lift the toe on every step and the gait is stable, you are close. A formal gait analysis by a physical therapist is the safest way to confirm.' },
    { q: 'Will insurance cover the electric trainer?', a: 'Some insurers cover it as durable medical equipment with a prescription. Others classify it as a consumer fitness device. Call your insurer and ask about coverage for "ankle rehabilitation device" or "motorized ankle trainer." A letter from your physical therapist helps.' },
    { q: 'Is the AFO bad for recovery?', a: 'The AFO is not bad — it is incomplete. It prevents falls but does not rebuild the ankle. The danger is using it as the only solution. If you wear the AFO and do nothing else, the ankle will weaken. If you wear the AFO and train actively, the AFO becomes a temporary bridge, not a permanent fixture.' },
  ],
  related: [
    { href: '/blog/foot-drop-rehab-equipment-review', label: 'Full foot drop rehab review', blurb: 'The detailed breakdown of how I rebuilt my ankle.' },
    { href: '/blog/spasticity-after-stroke', label: 'Spasticity after stroke', blurb: 'The other side of the ankle story.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How this fits into the full system.' },
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak side back.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 15. Home Blood Pressure Monitor
// =============================================================================
export const POST_HOME_BP_MONITOR = makeBlogPost({
  slug: 'best-blood-pressure-monitor-stroke-survivor',
  title: 'The Best Blood Pressure Monitor for Stroke Survivors: Why I Track Twice Daily',
  description: 'The home blood pressure monitor I use after stroke. Why twice-daily tracking is non-negotiable for preventing a second stroke, and which features matter.',
  h1: 'The best blood pressure monitor for stroke survivors',
  keyword: 'best blood pressure monitor stroke survivor',
  subhead: 'Blood pressure control is the single most important thing you can do to prevent a second stroke. I have tracked mine twice daily for seven years. Here is the monitor I trust and why.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See recommended monitors on Amazon' },
  ctaSecondary: { href: '/blog/how-to-prevent-a-second-stroke', label: 'Full prevention checklist' },
  productCard: {
    title: 'Home Blood Pressure Monitor',
    description: 'Upper-arm cuff with validated accuracy (AAMI/ESH), irregular heartbeat detection, and memory for 60+ readings. The same type I have used twice daily for seven years.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See recommended monitors on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full prevention blueprint?',
    description: 'My book covers the prevention protocol, the daily routine, and the mindset that kept me stroke-free for seven years.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Why BP matters more than anything else',
      paragraphs: [
        'Hypertension is the single largest modifiable risk factor for both first and recurrent strokes. After my hemorrhagic stroke, my neurologist set a target of under 130/80. I have hit that target for six years straight. The only way I know I am hitting it is by measuring at home.',
        'Clinic measurements are snapshots. They are taken in a medical setting, often with white-coat anxiety, and they happen once every few months. Home measurements are a movie. They show trends, morning spikes, evening dips, and the effect of yesterday\'s salt. If you are serious about preventing a second stroke, you need the movie.',
      ],
    },
    {
      h2: 'What to look for in a monitor',
      paragraphs: [
        'Not all monitors are accurate enough for medical decision-making. Look for these four features: validated accuracy (validated against a clinical standard like AAMI/ESH), upper-arm cuff (wrist monitors are less accurate), memory storage (at least 60 readings), and an irregular heartbeat indicator (survivors with AFib need this).',
      ],
      bullets: [
        'Upper-arm cuff — wrist monitors are less accurate for most survivors',
        'Validated accuracy (AAMI/ESH or equivalent) — not all monitors are clinically accurate',
        'Memory for at least 60 readings — you need trend data for your doctor',
        'Irregular heartbeat detection — critical for AFib screening',
        'Large display — stroke survivors with visual or cognitive issues need clarity',
        'Multiple user profiles — if a caregiver also tracks BP',
      ],
    },
    {
      h2: 'How I measure — the protocol',
      paragraphs: [
        'Same time every day. I do morning (before breakfast, after bathroom) and evening (before bed). Same arm. Same posture. No caffeine or exercise for thirty minutes before. I sit with back supported, feet flat, arm at heart level. I take two readings one minute apart and record the average.',
        'I bring a month of readings to every appointment. My doctor uses the home data to adjust medication, not the single clinic reading. The home data has caught medication issues that the clinic missed. It is the most important tool in my prevention kit.',
      ],
    },
  ],
  faqs: [
    { q: 'What is the best BP target after stroke?', a: 'Most stroke survivors should aim for under 130/80. Hemorrhagic stroke survivors may need even tighter control. Your neurologist sets the target — track toward it, not a generic number.' },
    { q: 'How often should I check my BP at home?', a: 'Twice daily is the standard for the first year after stroke. Once daily is acceptable if your readings are stable for six months. Never less than three times per week.' },
    { q: 'Are wrist blood pressure monitors accurate?', a: 'Wrist monitors are less accurate than upper-arm cuffs because the wrist is farther from the heart and position changes affect the reading. Use an upper-arm cuff unless you have a medical reason not to.' },
    { q: 'Should I bring my monitor to the doctor?', a: 'Yes. Bring the monitor and a month of readings. Your doctor can compare your device against the clinic device to verify accuracy. This is called cross-validation and it is standard practice.' },
  ],
  related: [
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'The full prevention checklist.' },
    { href: '/blog/signs-of-a-second-stroke', label: 'Warning signs of a second stroke', blurb: 'Know the signs.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How BP tracking fits into the daily system.' },
    { href: '/learn/stroke-recovery-timeline', label: 'Recovery timeline', blurb: 'What to expect and when.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 16. Resistance Bands
// =============================================================================
export const POST_RESISTANCE_BANDS = makeBlogPost({
  slug: 'best-resistance-bands-stroke-recovery',
  title: 'The Best Resistance Bands for Stroke Recovery (That I Actually Used)',
  description: 'The resistance bands that helped me rebuild strength after stroke. How to use them safely, which types to buy, and why they beat weights in the first year.',
  h1: 'The best resistance bands for stroke recovery',
  keyword: 'best resistance bands stroke recovery',
  subhead: 'I rebuilt my left side with a $20 set of resistance bands before I ever touched a dumbbell. Here is the exact set I used and how to use them without hurting yourself.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See band sets on Amazon' },
  ctaSecondary: { href: '/programs/daily-routine', label: 'The Daily Routine' },
  productCard: {
    title: 'Resistance Band Set for Stroke Recovery',
    description: 'Light to heavy loop and tube bands with handles. The exact progression I used to rebuild strength before touching a dumbbell.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See band sets on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book covers the strength protocols, daily routine, and the progression from bands to full function.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Why bands beat weights early in recovery',
      paragraphs: [
        'Free weights are dangerous for stroke survivors in the first 6–12 months. The affected side has poor coordination, reduced grip strength, and altered proprioception. A dumbbell that slips is a fracture or a concussion. A resistance band that slips is a rubber band on the floor.',
        'Bands also provide variable resistance. The resistance is lowest at the start of the motion (where the muscle is weakest) and highest at the end (where the muscle is strongest). This matches the strength curve of a recovering muscle far better than a fixed-weight dumbbell.',
      ],
    },
    {
      h2: 'The types I used and the order I used them',
      paragraphs: [
        'I started with a light loop band (the flat circular kind) for lateral leg raises. Then I added a tube band with handles for seated rows, bicep curls, and shoulder presses. Then I added a heavier loop band for squats and standing abduction. The progression was gentle, measurable, and safe.',
      ],
      bullets: [
        'Light loop band (red or yellow) — hip abduction, lateral leg raises, ankle dorsiflexion',
        'Tube band with handles (light resistance) — seated rows, bicep curls, shoulder press',
        'Medium loop band (green or black) — squats, standing abduction, glute bridges',
        'Heavy tube band (medium resistance) — lat pulldowns, chest press, tricep extensions',
      ],
    },
    {
      h2: 'Safety rules for survivors',
      paragraphs: [
        'Never anchor a band to a door without a proper door anchor. Never stand on a band with bare feet — it will slip. Never use a band that is frayed or cracked. Start with 2–3 sets of 10–15 reps. Rest 60–90 seconds between sets. If you feel pain that is sharp or joint-level, stop. If you feel fatigue that is muscular, continue.',
      ],
    },
  ],
  faqs: [
    { q: 'Can resistance bands replace weights entirely?', a: 'For the first 12–18 months, yes. After that, most survivors benefit from adding light weights. Bands remain useful for warm-ups, mobility work, and travel. I still use bands daily for shoulder prehab and hip activation.' },
    { q: 'How do I know which resistance level to start with?', a: 'Start with the lightest band. You should be able to complete 15 reps with good form. If you can do more than 20, move to the next band. If you cannot do 8, drop to a lighter band.' },
    { q: 'Are bands safe for spastic muscles?', a: 'Yes, but with caution. Spastic muscles fatigue faster and can cramp. Use lighter resistance, fewer reps, and longer rest periods. Stretch after, not before. If the muscle cramps, stop and stretch gently.' },
    { q: 'What exercises should I avoid with bands?', a: 'Avoid high-risk positions: standing on a band while pulling upward (fall risk), banded neck exercises (cervical injury risk), and any exercise where the band is anchored at face level. Keep it simple: rows, curls, presses, raises, squats.' },
  ],
  related: [
    { href: '/blog/spasticity-after-stroke', label: 'Spasticity after stroke', blurb: 'How to train safely with spastic muscles.' },
    { href: '/blog/foot-drop-rehab-equipment-review', label: 'Foot drop rehab', blurb: 'The ankle-specific trainer that worked for me.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How bands fit into the full system.' },
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak side back.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 17. Shower Safety
// =============================================================================
export const POST_SHOWER_SAFETY = makeBlogPost({
  slug: 'shower-safety-stroke-survivor',
  title: 'Shower Safety for Stroke Survivors: The Gear That Kept Me Upright',
  description: 'The shower safety equipment I used after stroke. Grab bars, shower chairs, and non-slip mats — the honest review from someone who fell twice.',
  h1: 'Shower safety for stroke survivors',
  keyword: 'shower safety stroke survivor',
  subhead: 'I fell twice in the shower. The second fall was the last one because I finally installed the right gear. Here is the setup that kept me safe for six years.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See shower safety gear on Amazon' },
  ctaSecondary: { href: '/for/caregivers', label: 'For caregivers' },
  productCard: {
    title: 'Shower Safety Kit',
    description: 'Shower chair, professional grab bars, non-slip mat, and handheld showerhead. The exact setup I used for 6+ years without a single fall.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See shower safety gear on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book covers safety protocols, home setup, and the daily routine that kept me independent.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Why the shower is the most dangerous room',
      paragraphs: [
        'The shower combines every stroke risk factor: slippery surfaces, one-handed operation (holding a rail while washing with the other), balance challenges, fatigue, and hot water that can drop blood pressure and cause dizziness. I fell twice. The first time I bruised my ribs. The second time I hit my head on the tub. That was the last time.',
      ],
    },
    {
      h2: 'The three items that matter most',
      paragraphs: [
        'A shower chair is non-negotiable. I used one for the first year. It eliminates the balance risk entirely. You sit, you wash, you stand only when you are ready. A grab bar installed by a professional (not suction cups) is the second item. It gives you a stable handhold for getting in and out. A non-slip mat with suction cups is the third. It keeps your feet from sliding when you stand.',
      ],
      bullets: [
        'Shower chair — eliminates balance risk. Use it for the first 6–12 months minimum.',
        'Professional grab bars — installed into studs, not suction cups. Place one at entry and one at the showerhead wall.',
        'Non-slip mat with suction cups — covers the tub floor. Replace every 6 months as the suction degrades.',
        'Handheld showerhead — lets you wash while seated. Game-changer for the chair period.',
      ],
    },
    {
      h2: 'The setup I used',
      paragraphs: [
        'I installed a stainless steel grab bar at the tub entry and a second one on the wall opposite the showerhead. I used a height-adjustable shower chair with a back and armrests. I added a handheld showerhead on a 6-foot hose. I kept a non-slip mat with 100 suction cups covering the entire tub floor. The total cost was under $150. It was the best $150 I spent in recovery.',
      ],
    },
  ],
  faqs: [
    { q: 'How long should I use a shower chair?', a: 'Use it until you can stand in the shower for 10 minutes without holding the grab bar. For most survivors, that is 6–12 months. Some use it longer. There is no shame in using it as long as you need it.' },
    { q: 'Are suction cup grab bars safe?', a: 'No. Suction cups can fail without warning, especially on textured tile or when the surface is wet. Only use grab bars installed with screws into wall studs. If you rent, ask your landlord. Medical necessity is a valid reason for installation.' },
    { q: 'What about walk-in tubs?', a: 'Walk-in tubs are expensive and slow to fill and drain. Most survivors are better served by a shower chair + handheld showerhead combo. If you have the budget and the bathroom space, a walk-in shower with a zero-threshold entry is ideal.' },
    { q: 'Should I shower alone?', a: 'In the first 3–6 months, have someone nearby or within earshot. After that, if you have the right equipment and can stand steadily, showering alone is fine. A medical alert bracelet or watch is a good backup for the first year.' },
  ],
  related: [
    { href: '/for/caregivers', label: 'For caregivers', blurb: 'How to set up a safe home for a stroke survivor.' },
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'Fall prevention is stroke prevention.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How safety fits into the daily system.' },
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Why the shower is harder than it looks.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 18. Adaptive Eating
// =============================================================================
export const POST_ADAPTIVE_EATING = makeBlogPost({
  slug: 'adaptive-eating-utensils-stroke',
  title: 'Adaptive Eating Utensils for Stroke: What I Used When One Hand Did the Work of Two',
  description: 'The adaptive eating utensils that helped me feed myself with one functional hand after stroke. Real recommendations, real prices, and what to skip.',
  h1: 'Adaptive eating utensils for stroke survivors',
  keyword: 'adaptive eating utensils stroke',
  subhead: 'The first time I tried to eat with one hand after my stroke, I knocked a bowl of soup across the table. These utensils were the bridge between that moment and feeding myself with dignity.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See adaptive utensils on Amazon' },
  ctaSecondary: { href: '/blog/foot-drop-rehab-equipment-review', label: 'Read the foot drop guide' },
  productCard: {
    title: 'Adaptive Eating Utensil Set',
    description: 'Rocker knife, weighted spoon, plate guard, and non-slip mat. The bridge from "I cannot eat" to independent meals.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See adaptive utensils on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book covers adaptive living, daily routines, and the mindset that turns "I cannot" into "I will."',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'The first meal with one hand',
      paragraphs: [
        'I had left hemiparesis. My left hand could not hold a fork. My right hand had to do everything: cut, spear, lift, steady. The first meal was soup. I held the bowl with my left hand — barely — and tried to spoon with my right. The bowl slid. The soup went everywhere. I cried. I was 36 years old and I could not eat soup without help.',
        'Adaptive utensils were not a convenience. They were a bridge to dignity. Here is what I used and what I wish I had known sooner.',
      ],
    },
    {
      h2: 'The items that actually helped',
      paragraphs: [
        'The rocker knife was the single most useful tool. It cuts with a rocking motion using one hand — no fork needed to steady the food. The weighted spoon reduced tremor and gave me control. The plate guard (a plastic rim that clips onto a standard plate) pushed food onto the fork instead of chasing it off the edge. The non-slip mat under the plate kept everything stationary.',
      ],
      bullets: [
        'Rocker knife — one-handed cutting with a rocking motion. Essential.',
        'Weighted spoon/fork — reduces tremor and gives control. Good for early recovery.',
        'Plate guard — clips onto any plate, creates a wall to push food against.',
        'Non-slip mat — keeps the plate and bowl from sliding.',
        'Cup with a lid and straw — prevents spills and reduces the need to lift.',
      ],
    },
    {
      h2: 'What I skipped and why',
      paragraphs: [
        'I tried a universal cuff (a strap that holds the utensil to the hand). It worked but it was awkward and embarrassing. I used it for two weeks, then switched to the weighted spoon and never looked back. I also skipped the swivel spoon — the bowl stays level regardless of hand angle. It sounded smart but it was finicky and hard to clean.',
      ],
    },
  ],
  faqs: [
    { q: 'Where do I buy adaptive eating utensils?', a: 'Medical supply stores, Amazon, and adaptive equipment retailers all carry them. The rocker knife and plate guard are available on Amazon for under $20 each. Start with the basics and add as needed.' },
    { q: 'Will I always need adaptive utensils?', a: 'Most survivors do not. They are a bridge, not a permanent solution. I used mine for about 8 months. By month 6, I could use a standard fork most of the time. By month 10, I only used the rocker knife for tough foods. By year 2, I was back to standard utensils for everything.' },
    { q: 'Are weighted utensils just for tremor?', a: 'No. The weight also helps with proprioception — the brain\'s sense of where the hand is in space. After stroke, proprioception is often impaired. The weight gives the brain more feedback to work with.' },
    { q: 'What about eating out?', a: 'I carried a folding rocker knife and a small non-slip mat in my bag for the first year. Most restaurants were understanding. If you are self-conscious, call ahead and ask about accessibility. The alternative is skipping meals out, which is worse for your mental health than the brief moment of setup.' },
  ],
  related: [
    { href: '/blog/spasticity-after-stroke', label: 'Spasticity after stroke', blurb: 'Why the hand struggles early in recovery.' },
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak hand back.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How this fits into the daily system.' },
    { href: '/for/caregivers', label: 'For caregivers', blurb: 'How to help without taking over.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 19. CPAP and Stroke
// =============================================================================
export const POST_CPAP_STROKE = makeBlogPost({
  slug: 'cpap-machine-stroke-survivor',
  title: 'CPAP Machine After Stroke: Why I Wish I Had Started Sooner',
  description: 'Sleep apnea and stroke: why CPAP is one of the most important devices a survivor can use. My story, the research, and what to look for in a machine.',
  h1: 'CPAP machine after stroke: why I wish I had started sooner',
  keyword: 'cpap machine stroke survivor',
  subhead: 'I found out I had sleep apnea three years after my stroke. Three years of uncontrolled hypertension, three years of morning headaches, three years of fatigue I blamed on recovery. CPAP changed everything.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See CPAP machines on Amazon' },
  ctaSecondary: { href: '/blog/how-to-prevent-a-second-stroke', label: 'Full prevention checklist' },
  productCard: {
    title: 'CPAP Machine for Sleep Apnea',
    description: 'Auto-adjusting APAP with heated humidifier and quiet motor. The machine that ended my morning headaches and cut my fatigue in half.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See CPAP machines on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full prevention blueprint?',
    description: 'My book covers sleep apnea, prevention protocols, and the daily routine that kept me stroke-free for seven years.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Sleep apnea and stroke: the hidden link',
      paragraphs: [
        'Roughly 60% of stroke survivors have obstructive sleep apnea. Most do not know it. The apnea causes repeated drops in blood oxygen, surges in blood pressure, and fragmented sleep that never lets the brain enter deep restorative phases. All of these increase stroke recurrence risk.',
        'My apnea was diagnosed three years post-stroke. I had blamed every symptom on recovery. The morning headaches, the afternoon crashes, the blood pressure that would not budge — I thought they were just "how recovery is." They were not. They were sleep apnea.',
      ],
    },
    {
      h2: 'What CPAP did for me',
      paragraphs: [
        'Within two weeks of starting CPAP, my morning headaches were gone. Within a month, my afternoon fatigue was cut in half. Within three months, my blood pressure was easier to control and my medication dose was reduced. The effect was not subtle. It was the single biggest quality-of-life improvement in my recovery after the electric ankle trainer.',
      ],
    },
    {
      h2: 'What to look for in a CPAP machine',
      paragraphs: [
        'Modern CPAP machines are quiet, small, and data-connected. Look for auto-adjusting pressure (APAP), a heated humidifier (prevents dry mouth and nasal irritation), and a quiet motor (under 30 decibels). The mask matters more than the machine — nasal pillows, nasal mask, or full-face depending on how you breathe.',
      ],
      bullets: [
        'Auto-adjusting pressure (APAP) — adjusts to your needs throughout the night',
        'Heated humidifier — prevents the dry mouth and nasal irritation that make people quit',
        'Quiet motor — under 30 dB so you and your partner can sleep',
        'Data tracking — shows compliance, leak rates, and AHI reduction',
        'Mask fit — nasal pillows for minimal contact, nasal mask for mouth-breathers, full-face for high-pressure needs',
      ],
    },
  ],
  faqs: [
    { q: 'How do I know if I have sleep apnea after stroke?', a: 'Ask for a sleep study. If you snore, wake up tired, or your partner reports gasping or long pauses in breathing, get a sleep study. Most neurologists order one routinely after stroke, but if yours did not, ask for it.' },
    { q: 'Does CPAP prevent a second stroke?', a: 'CPAP significantly reduces blood pressure surges, improves oxygenation, and reduces cardiovascular strain. These are all stroke risk factors. The data is strongest for survivors with moderate-to-severe apnea. Even mild apnea benefits from treatment.' },
    { q: 'How long does it take to get used to CPAP?', a: 'Most people adapt within 2–4 weeks. The first week is the hardest. Start with short naps, use the ramp feature that starts at low pressure, and work with a respiratory therapist to adjust the mask fit. Do not give up in the first week.' },
    { q: 'Can I use CPAP with facial weakness after stroke?', a: 'Yes, but mask selection matters. Nasal pillows (minimal contact) or a nasal mask may seal better than a full-face mask if one side of the face has reduced muscle tone. Work with your DME provider to try multiple masks.' },
  ],
  related: [
    { href: '/blog/how-to-prevent-a-second-stroke', label: 'How to prevent a second stroke', blurb: 'Sleep apnea is a major risk factor.' },
    { href: '/blog/fatigue-after-stroke', label: 'Fatigue after stroke', blurb: 'Is it recovery fatigue or sleep apnea?' },
    { href: '/blog/best-blood-pressure-monitor-stroke-survivor', label: 'BP monitoring', blurb: 'Track the numbers CPAP helps control.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How sleep fits into the full system.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 20. Gait Training at Home
// =============================================================================
export const POST_GAIT_TRAINING_HOME = makeBlogPost({
  slug: 'gait-training-home-stroke-recovery',
  title: 'Gait Training at Home After Stroke: The Equipment I Used to Walk Again',
  description: 'The gait training equipment I used at home to rebuild my walking after stroke. Parallel bars, balance boards, and the exact setup that worked.',
  h1: 'Gait training at home after stroke',
  keyword: 'gait training home stroke recovery',
  subhead: 'I walked in parallel bars at a clinic, then in my hallway at home, then down the block, then up a trail. Here is the equipment that bridged the gap between clinic and real life.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See gait training equipment on Amazon' },
  ctaSecondary: { href: '/blog/foot-drop-rehab-equipment-review', label: 'Foot drop rehab guide' },
  productCard: {
    title: 'Gait Training Equipment Kit',
    description: 'Doorway pull-up bar, wobble board, gait belt, and balance training tools. The same setup I used to go from wheelchair to unassisted walking.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See gait training equipment on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the full recovery blueprint?',
    description: 'My book covers the daily routine, gait protocols, and the mindset that took me from wheelchair to walking.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Why gait training at home matters',
      paragraphs: [
        'Most stroke survivors get 6–12 weeks of inpatient or outpatient therapy. That is not enough. Gains continue for years, but only if you keep training. The problem is most survivors do not have a gait training setup at home. They walk around the house, but they do not practice the specific movements that rebuild gait quality.',
        'I built a home gait training station. It was not expensive. It was not large. It was the reason I went from a wheelchair to a walker to a cane to unassisted walking.',
      ],
    },
    {
      h2: 'The equipment I used',
      paragraphs: [
        'A doorway pull-up bar installed at chest height became my parallel bars. I stood in the doorway, held the bar, and practiced weight shifting, heel-to-toe walking, and single-leg stance. A wobble board (a small wooden disc with a half-sphere on the bottom) trained my ankle proprioception and single-leg balance. A gait belt (a simple canvas strap around the waist) let my partner spot me safely without grabbing my arm.',
      ],
      bullets: [
        'Doorway pull-up bar at chest height — parallel bars at home for weight shifting and heel-to-toe practice',
        'Wobble board — ankle proprioception and single-leg balance. Start with a large-diameter board for stability.',
        'Gait belt — lets a caregiver spot you without grabbing your arm or throwing off your balance.',
        'Tennis balls on the floor — practice stepping over obstacles. Critical for real-world gait.',
        'Yoga blocks — step-ups, step-overs, and balance targets.',
      ],
    },
    {
      h2: 'The daily protocol',
      paragraphs: [
        'I started with 10 minutes of doorway bar work: weight shifting side to side, then forward and back, then heel-to-toe steps while holding the bar. Then 5 minutes of wobble board: two feet, then one foot, then eyes closed. Then 10 minutes of walking with the gait belt and my partner spotting. Then 5 minutes of obstacle navigation: stepping over tennis balls, around yoga blocks, and through a narrow hallway.',
        'The total was 30 minutes. I did it twice daily. Within three months, the walker was gone. Within six months, the cane was gone. Within a year, I was walking on uneven ground.',
      ],
    },
  ],
  faqs: [
    { q: 'How long does gait training take after stroke?', a: 'With daily practice, most survivors see meaningful improvement in 3–6 months. Full independence from assistive devices can take 6–18 months depending on severity, age, and consistency.' },
    { q: 'Can I do gait training without a therapist?', a: 'Early gait training should be supervised. After you have learned the basic mechanics from a physical therapist, home practice is essential. The therapist gives you the form; the home practice gives you the volume.' },
    { q: 'Is a treadmill better than walking outside?', a: 'A treadmill is safer and lets you control speed and incline. Walking outside is more functional but riskier. I used a treadmill for the first 6 months, then transitioned to outdoor walking. Both have value.' },
    { q: 'When should I stop using a walker?', a: 'When you can walk 50 feet without it, maintain balance during turns, and recover from a mild stumble without it. A therapist\'s clearance is the safest way to decide. Do not rush it — falls set recovery back.' },
  ],
  related: [
    { href: '/blog/foot-drop-rehab-equipment-review', label: 'Foot drop rehab', blurb: 'The ankle is the foundation of gait.' },
    { href: '/blog/spasticity-after-stroke', label: 'Spasticity after stroke', blurb: 'How spasticity affects walking.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How gait training fits into the daily system.' },
    { href: '/learn/hemiparesis-recovery', label: 'Hemiparesis recovery', blurb: 'Getting the weak leg back.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 21. Stroke Gift Guide
// =============================================================================
export const POST_STROKE_GIFT_GUIDE = makeBlogPost({
  slug: 'stroke-recovery-gift-guide',
  title: 'Stroke Recovery Gift Guide: What Actually Helps (From Someone Who Got It Wrong)',
  description: 'The gifts that actually help stroke survivors — and the ones that do not. Written by a survivor who received both the helpful and the useless.',
  h1: 'Stroke recovery gift guide',
  keyword: 'stroke recovery gift guide',
  subhead: 'I got a lot of gifts after my stroke. Some of them sit in a closet. Some of them are still in use seven years later. Here is the honest list.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See gift ideas on Amazon' },
  ctaSecondary: { href: '/for/caregivers', label: 'For caregivers' },
  productCard: {
    title: 'Stroke Recovery Gift Bundle',
    description: 'Shower chair, grab bars, adaptive utensils, BP monitor, and resistance bands. The practical gifts that say "I see what you are going through."',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See gift ideas on Amazon',
    note: 'Affiliate link — I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the best gift of all?',
    description: 'My book is the gift that keeps giving — the full blueprint, the daily routine, and the mindset for long-term recovery.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'The gifts that actually help',
      paragraphs: [
        'The best gifts are the ones that solve a real daily problem. The shower chair I mentioned earlier. The grab bars. The adaptive utensils. The electric ankle trainer. The blood pressure monitor. These are not romantic gifts. They are practical. They say "I see what you are going through and I want to make it easier." That is the message a survivor needs.',
      ],
      bullets: [
        'Shower chair + handheld showerhead — the gift of safe bathing',
        'Professional grab bars (installed) — the gift of not falling',
        'Adaptive eating utensils — the gift of independent meals',
        'Electric ankle rehabilitation trainer — the gift of walking again',
        'Home blood pressure monitor — the gift of prevention',
        'Resistance band set — the gift of strength rebuilding',
      ],
    },
    {
      h2: 'The gifts that do not help',
      paragraphs: [
        'I got a lot of "inspirational" books. I got a lot of generic wellness items. I got a fruit basket that I could not open with one hand. The worst gifts are the ones that assume the survivor is the same person they were before the stroke. They are not. Their needs are different. Their capabilities are different. A gift that ignores that is not a gift — it is a reminder of what they have lost.',
      ],
      bullets: [
        'Inspirational books — most survivors are already drowning in information. Skip the books unless they specifically requested one.',
        'Generic wellness items — bath bombs, scented candles, spa kits. These are nice but they do not solve a real problem.',
        'Food items that require opening — jars, tight packaging, heavy bags. The survivor may not have the grip or coordination to use them.',
        'Exercise equipment that is too advanced — heavy dumbbells, complex machines. Start with bands and simple tools.',
      ],
    },
    {
      h2: 'The best gift of all',
      paragraphs: [
        'The best gift I received was time. My brother showed up and helped me build the shower chair. My cousin installed the grab bars. My mother sat with me while I did my first band workout. The physical presence of someone who is not afraid of your stroke is worth more than any object.',
        'If you want to give a gift, give your time. Install the equipment. Do the first workout together. Cook a meal using the adaptive utensils. The object is the excuse. The time is the gift.',
      ],
    },
  ],
  faqs: [
    { q: 'What is the best gift for a stroke survivor in the hospital?', a: 'Comfort items that do not require two hands: a soft blanket, a phone stand that props the phone at a readable angle, a water bottle with a straw, headphones, and a handwritten note. Avoid flowers — many hospitals do not allow them in ICU or neuro units.' },
    { q: 'Should I ask what they need?', a: 'Yes. Some survivors are uncomfortable asking. Others have a clear list. Ask directly: "What would make your day easier?" The answer is usually practical and affordable. A reacher tool. A jar opener. A shower chair. These cost less than a fruit basket and do more.' },
    { q: 'What about gift cards?', a: 'Gift cards are fine if they are for a specific need. Amazon gift cards work because the survivor can buy adaptive equipment. Grocery delivery gift cards work. Restaurant gift cards work if the survivor can get there safely. Generic gift cards feel impersonal.' },
    { q: 'Is money appropriate?', a: 'Yes. Medical bills, adaptive equipment, and lost income create real financial strain. A direct gift of money — or a fund for specific expenses — is more useful than almost any object. Frame it as "for the recovery fund" so it does not feel like charity.' },
  ],
  related: [
    { href: '/for/caregivers', label: 'For caregivers', blurb: 'How to help a stroke survivor.' },
    { href: '/blog/shower-safety-stroke-survivor', label: 'Shower safety', blurb: 'The most important gift for a survivor.' },
    { href: '/blog/adaptive-eating-utensils-stroke', label: 'Adaptive eating', blurb: 'The gift of independent meals.' },
    { href: '/blog/foot-drop-rehab-equipment-review', label: 'Foot drop rehab', blurb: 'The gift of walking again.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// 22. Complete Home Kit
// =============================================================================
export const POST_COMPLETE_HOME_KIT = makeBlogPost({
  slug: 'complete-stroke-recovery-home-kit',
  title: 'The Complete Stroke Recovery Home Kit: Every Item I Used in My First Year',
  description: 'The complete home kit for stroke recovery. Every item I used in my first year, from the first week to the first milestone, with links and honest reviews.',
  h1: 'The complete stroke recovery home kit',
  keyword: 'complete stroke recovery home kit',
  subhead: 'I built my recovery at home. Here is every item I used in the first year, from the week I got home to the month I walked unassisted. No fluff. No sponsorship. Just the gear that worked.',
  ctaPrimary: { href: 'https://a.co/d/0dvZe7BM', label: 'See the full kit on Amazon' },
  ctaSecondary: { href: '/blog/stroke-recovery-gift-guide', label: 'Gift guide version' },
  productCard: {
    title: 'Complete Stroke Recovery Home Kit',
    description: 'Every item I used in my first year: shower chair, grab bars, adaptive utensils, BP monitor, resistance bands, ankle trainer, and more. The full kit in one place.',
    link: 'https://a.co/d/0dvZe7BM',
    label: 'See the full kit on Amazon',
    note: 'Affiliate link \u2014 I earn a small commission at no extra cost to you.',
  },
  bookPromo: {
    title: 'Want the complete blueprint?',
    description: 'My book is the complete recovery system: the daily routine, the gear, the protocols, and the mindset that took me from 0% to 90%+.',
    link: '/book',
    label: 'Get the book',
  },
  sections: [
    {
      h2: 'Week 1: The basics',
      paragraphs: [
        'The first week home is about safety, not progress. You need to not fall. You need to not re-injure. You need to sleep. These items are the foundation.',
      ],
      bullets: [
        'Shower chair + handheld showerhead — the first purchase. Do not shower without it.',
        'Professional grab bars (installed in studs) — two in the bathroom, one at the bed.',
        'Non-slip mats — one in the tub, one at the bedside, one at the kitchen sink.',
        'Reacher tool (grabber stick) — for picking things up without bending.',
        'Pill organizer with alarm — medication errors are the leading cause of readmission.',
      ],
    },
    {
      h2: 'Month 1: The movement tools',
      paragraphs: [
        'Once you are medically cleared for active movement, start building strength. These tools are the first layer of home rehab.',
      ],
      bullets: [
        'Light resistance band set (loop + tube) — start with red and yellow.',
        'Doorway pull-up bar at chest height — gait training parallel bars at home.',
        'Wobble board (large diameter) — balance and ankle proprioception.',
        'Gait belt — for safe walking practice with a partner.',
        'Yoga blocks — step-ups, balance targets, and sitting support.',
      ],
    },
    {
      h2: 'Month 3: The precision tools',
      paragraphs: [
        'By month three, you are ready for more targeted rehab. These tools address specific deficits.',
      ],
      bullets: [
        'Electric ankle rehabilitation trainer — for foot drop and ankle control.',
        'Home blood pressure monitor — upper-arm, validated, twice daily.',
        'Adaptive eating utensils — rocker knife, weighted spoon, plate guard.',
        'Weighted blanket — for sleep quality and anxiety reduction.',
        'CPAP machine (if prescribed) — for sleep apnea and BP control.',
      ],
    },
    {
      h2: 'Month 6: The progression tools',
      paragraphs: [
        'By month six, you are building on a foundation. These tools add challenge and variety.',
      ],
      bullets: [
        'Heavier resistance bands (green, black) — progressive overload.',
        'Balance disc (air-filled) — harder than the wobble board.',
        'Ankle weights (light, 1–2 lb) — for leg raises and gait practice.',
        'Tennis balls and cones — obstacle navigation and agility.',
        'Smartwatch with fall detection — safety as you gain independence.',
      ],
    },
    {
      h2: 'The total cost',
      paragraphs: [
        'The full kit, bought over six months, costs roughly $300–500. That is less than two weeks of outpatient therapy. It is the best investment I made in my recovery. The link below is an Amazon affiliate link — I earn a small commission at no cost to you. Every item linked is one I used myself.',
      ],
    },
  ],
  faqs: [
    { q: 'Do I need all of these items?', a: 'No. Start with the week 1 basics. Add items as your recovery progresses and as your budget allows. The shower chair and grab bars are non-negotiable. Everything else is added based on your specific deficits and goals.' },
    { q: 'Can I use insurance or HSA/FSA funds?', a: 'Many of these items are eligible for HSA or FSA reimbursement if your doctor provides a letter of medical necessity. Shower chairs, grab bars, BP monitors, CPAP machines, and some adaptive equipment are often covered. Check with your insurer.' },
    { q: 'What if I live in a small apartment?', a: 'Most of these items are compact. The resistance bands, yoga blocks, and wobble board fit in a closet. The shower chair folds. The electric trainer sits under a desk. The only items that need installation are the grab bars, which are worth the effort regardless of space.' },
    { q: 'How do I know which items to prioritize?', a: 'Ask your physical therapist. They can assess your specific deficits and recommend the items that will give you the fastest return. In general: safety first, then mobility, then strength, then precision.' },
  ],
  related: [
    { href: '/blog/stroke-recovery-gift-guide', label: 'Gift guide', blurb: 'The same items, framed for gift-givers.' },
    { href: '/blog/foot-drop-rehab-equipment-review', label: 'Foot drop rehab', blurb: 'Deep dive on the ankle trainer.' },
    { href: '/blog/best-blood-pressure-monitor-stroke-survivor', label: 'BP monitoring', blurb: 'Why the monitor matters.' },
    { href: '/programs/daily-routine', label: 'The Daily Routine', blurb: 'How the kit fits into the daily system.' },
  ],
  publishedDate: '2026-06-05',
});

// =============================================================================
// Aggregator
// =============================================================================
export const ALL_BLOG_POSTS: SsrPageConfig[] = [
  POST_REHAB_DURATION,
  POST_FULL_RECOVERY,
  POST_SECOND_STROKE_SIGNS,
  POST_PREVENT_SECOND_STROKE,
  POST_TIA_VS_STROKE,
  POST_ISCHEMIC_VS_HEMORRHAGIC,
  POST_DRIVING_AFTER_STROKE,
  POST_BEST_FOODS,
  POST_FATIGUE,
  POST_SPASTICITY,
  POST_MEMORY,
  POST_PBA,
  POST_FOOT_DROP_REHAB,
  POST_AFO_VS_ELECTRIC,
  POST_HOME_BP_MONITOR,
  POST_RESISTANCE_BANDS,
  POST_SHOWER_SAFETY,
  POST_ADAPTIVE_EATING,
  POST_CPAP_STROKE,
  POST_GAIT_TRAINING_HOME,
  POST_STROKE_GIFT_GUIDE,
  POST_COMPLETE_HOME_KIT,
];

// /blog hub page — lists all posts as internal-link cluster
export const BLOG_HUB: SsrPageConfig = {
  url: '/blog',
  title: 'Stroke Recovery Blog | Survivor-Written Guides',
  description: 'Survivor-written, evidence-based guides on stroke recovery: timelines, prevention, fatigue, spasticity, memory, driving, nutrition, and the long-game playbook.',
  h1: 'The Stroke Recovery Blog',
  hero: {
    eyebrow: 'Blog',
    subhead: 'Honest, in-the-trenches answers to the questions stroke survivors actually ask. Written by Nick Kremers and the SRA team.',
    ctaPrimary: { href: '/api/login', label: 'Open the full library' },
    ctaSecondary: { href: '/recovery/university', label: 'Go to Recovery University' },
  },
  sections: [
    {
      h2: 'The questions every survivor asks',
      paragraphs: [
        'These are the questions that show up in every stroke survivor\'s search bar in the first week, the first month, the first year. We answer them with research and lived experience — no fluff, no marketing, no fake hope.',
      ],
    },
  ],
  faqs: [
    { q: 'Who writes these posts?', a: 'Nick Kremers (founder, 7-year stroke survivor) and the Stroke Recovery Academy clinical advisory team. All medical content is reviewed for accuracy.' },
    { q: 'How often are new posts added?', a: 'New posts are added regularly based on the questions survivors send us. If there is a topic you want covered, tell us.' },
    { q: 'Is the medical information reviewed?', a: 'Yes. All content is reviewed against current stroke recovery research and against clinical practice. We cite where the evidence comes from.' },
    { q: 'Can I share these posts?', a: 'Please do. Every share helps another survivor find the playbook nobody handed them in the hospital.' },
  ],
  related: ALL_BLOG_POSTS.map(p => ({
    href: p.url,
    label: p.h1,
    blurb: p.description.slice(0, 120),
  })),
  keywords: ['stroke recovery blog', 'stroke survivor guides', 'sasquatch method'],
  schemaType: 'WebPage',
  breadcrumbs: [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }],
  bookPromo: {
    title: 'Want the full playbook?',
    description: 'THE ULTIMATE STROKE RECOVERY REVOLUTION — 30 chapters, 50k+ words, the daily routine, the gear, the protocols, and the mindset. The book every survivor wishes they had in the hospital.',
    link: '/book',
    label: 'Get the book',
  },
};
