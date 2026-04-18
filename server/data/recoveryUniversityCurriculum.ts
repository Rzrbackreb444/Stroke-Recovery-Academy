// Recovery University curriculum — 7 parts, 33 chapters.
// Voice: Nick Kremers. Direct. Gritty. No fluff. Built for survivors at 3am
// when nobody else is awake and the only company they have is a screen.

export interface SeedQuestion {
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  hint: string;
  explanation: string;
}

export interface SeedLesson {
  chapter: number;
  partNumber: number;
  title: string;
  subtitle: string;
  requiredTier: "explorer" | "warrior" | "champion" | "platinum";
  estimatedMinutes: number;
  body: string;
  keyTakeaways: string[];
  passingScore: number;
  questions: SeedQuestion[];
}

const Q = (
  prompt: string,
  options: [string, string, string, string],
  correctIndex: number,
  hint: string,
  explanation: string,
): SeedQuestion => ({
  prompt,
  options: options.map((text, i) => ({ id: String.fromCharCode(97 + i), text })),
  correctOptionId: String.fromCharCode(97 + correctIndex),
  hint,
  explanation,
});

export const RECOVERY_UNIVERSITY_CURRICULUM: SeedLesson[] = [
  // ─── PART 1: FOUNDATION ─────────────────────────────────────────────────────
  {
    chapter: 1,
    partNumber: 1,
    title: "The Day Everything Changed",
    subtitle: "Understanding what happened and why you're still here",
    requiredTier: "explorer",
    estimatedMinutes: 25,
    body: `## You're alive. Start there.

A stroke is a brain attack. Blood stops getting to part of your brain — either because something clogged the pipe (ischemic) or the pipe burst (hemorrhagic). Cells starve. In four minutes, the cells in that zone start dying.

That's the science. Here's the part nobody tells you: the fact that you're reading this means you're already winning. Most stroke survivors never get up off the couch. You did. So congratulations — you are officially in the top 10% before we even start.

### What actually died, and what's just stunned

The dead zone is called the **infarct**. That tissue is gone. It's not coming back. Stop hoping it will. The good news: around the infarct sits the **penumbra** — tissue that's hurt but still alive. With the right work, that tissue wakes up. And beyond the penumbra, your entire brain can rewire to take over jobs the dead zone used to do. That's neuroplasticity. We'll cover it in Chapter 2.

### Why you're still here

You survived a brain attack. The hospital saved your life — but the hospital can't make you recover. They patch you up, hand you a binder, and send you home. From the second the discharge papers hit your hand, **you are the head of your own rehab program**. Nobody is coming to save you. That sounds harsh because it is. It's also liberating, because if nobody is coming, then nobody can stop you either.

### The first decision

Right now, in this lesson, you make a decision: am I a victim, or am I the comeback? You don't get to be both. Pick one. The Sasquatch Method only works for one of those two answers.

If you picked comeback, welcome. The next 32 chapters are the playbook.`,
    keyTakeaways: [
      "Ischemic = clog. Hemorrhagic = bleed. Either way, brain cells died.",
      "The infarct is gone. The penumbra and the rest of your brain can rewire.",
      "Hospital saves your life. You save your recovery.",
      "Pick one: victim or comeback. Both is not on the menu.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Which type of stroke is caused by a blocked blood vessel?",
        ["Hemorrhagic", "Ischemic", "Mini-stroke", "Aneurysm"],
        1,
        "Think of plumbing — one type bursts the pipe, the other clogs it.",
        "Ischemic strokes are caused by a clot blocking blood flow. They make up about 87% of all strokes. Hemorrhagic strokes are caused by a bleed.",
      ),
      Q(
        "What is the penumbra?",
        ["Dead brain tissue", "Tissue that's injured but still alive", "The blood vessel that ruptured", "The recovery timeline"],
        1,
        "It's the gray zone — not dead, not healthy.",
        "The penumbra is the rim of brain tissue around the dead zone (infarct). It's stunned but alive — and the right rehab work can wake it up.",
      ),
      Q(
        "Roughly how many minutes can a brain cell survive without blood?",
        ["30 seconds", "About 4 minutes", "30 minutes", "An hour"],
        1,
        "Less than a coffee break.",
        "Brain cells start dying within about 4 minutes of losing blood flow. That's why 'time is brain' — every minute matters during a stroke.",
      ),
      Q(
        "Who is ultimately responsible for your recovery?",
        ["Your neurologist", "Your physical therapist", "You", "The insurance company"],
        2,
        "It's not the people in the white coats.",
        "Doctors save your life. Therapists give you the tools. But you are the head of your own rehab program — nobody else can do the reps for you.",
      ),
      Q(
        "Per Chapter 1, the first decision a survivor must make is:",
        ["Which therapist to hire", "Whether to take medication", "Victim or comeback", "Whether to go home or stay in rehab"],
        2,
        "It's a mindset choice, not a logistics one.",
        "You don't get to be both. Pick comeback, and the rest of the curriculum has something to teach you. Pick victim, and no method on Earth will help.",
      ),
    ],
  },
  {
    chapter: 2,
    partNumber: 1,
    title: "Neuroplasticity 101",
    subtitle: "Your brain's incredible ability to rewire and rebuild",
    requiredTier: "explorer",
    estimatedMinutes: 30,
    body: `## Your brain is a muscle. Train it like one.

Neuroplasticity is the single most important word in your vocabulary now. It means your brain physically changes when you challenge it. New connections form. Old ones strengthen. Other parts of the brain learn to take over jobs the damaged part used to do.

This isn't woo. This is settled neuroscience. The brain you had at 8am the day of your stroke is not the brain you have now, and the brain you have now is not the brain you'll have in 90 days — if you put in the work.

### The two laws

**Law 1: Neurons that fire together, wire together.** Repeat a movement, a thought, a word — the connection strengthens. Skip it, and the connection weakens.

**Law 2: Use it or lose it.** This applies to your good side too. If you favor your strong arm and never use the affected one, your brain will quietly delete the affected one's wiring. That's why CIMT (Constraint-Induced Movement Therapy) works — it forces the brain to wake up the affected side.

### What kills neuroplasticity

- Doing nothing
- Doing the same thing forever (your brain stops paying attention)
- Doing it for ten minutes once a week
- Telling yourself "I can't"

### What feeds it

- Repetition. Hundreds of reps a day, not ten.
- Difficulty. The movement should be hard, not impossible.
- Novelty. Mix it up so the brain stays engaged.
- Sleep. The wiring happens overnight. Bad sleep, no wiring.
- Mood. A brain in fear mode rewires badly. A brain in challenge mode rewires fast.

### The 90-day window myth

You've probably heard "most recovery happens in the first 90 days." That's not a deadline. It's an average — and averages include people who quit. The brain rewires for life. People recover function 5, 10, 20 years out. The window doesn't close. It just gets smaller for people who stop trying.`,
    keyTakeaways: [
      "Neuroplasticity = your brain physically rewires when challenged.",
      "Reps and difficulty are the two ingredients. Hundreds, not tens.",
      "Sleep is when the rewiring locks in.",
      "The 90-day window is a statistic, not a deadline.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What does 'neurons that fire together, wire together' mean?",
        ["Brain cells communicate by sound", "Repeating an action strengthens the brain connection that performs it", "Stroke survivors should avoid mental effort", "All neurons connect to all other neurons"],
        1,
        "Think about what 'fire together' refers to in practice.",
        "Hebb's Law: every time you repeat a movement or thought, the neural pathway running it gets stronger. Skip the rep, lose the wiring.",
      ),
      Q(
        "Why does Constraint-Induced Movement Therapy (CIMT) work?",
        ["It rests the affected limb", "It forces the brain to wake up the affected side by restricting the strong one", "It uses electricity", "It is a medication"],
        1,
        "It removes the easy option.",
        "CIMT restrains your strong arm so your brain can't cheat. The only way to function is to use the affected side, which forces neuroplastic rewiring.",
      ),
      Q(
        "Which of these BLOCKS neuroplasticity?",
        ["Sleeping 7-8 hours", "Telling yourself 'I can't' before trying", "Repeating exercises hundreds of times a day", "Mixing up your routine"],
        1,
        "The brain listens to your self-talk literally.",
        "The brain rewires around your beliefs as much as around your movements. A 'can't' belief shuts down the rewiring before the rep even starts.",
      ),
      Q(
        "When does most of the brain's rewiring physically happen?",
        ["During the exercise itself", "Overnight during sleep", "While eating", "Only during therapy sessions"],
        1,
        "It's not when you think.",
        "The brain consolidates and locks in new wiring during sleep. That's why poor sleep tanks recovery — you can do all the reps you want, but the brain never saves the file.",
      ),
      Q(
        "True or false: recovery is impossible after the first 90 days.",
        ["True — the window closes", "True for ischemic, false for hemorrhagic", "False — neuroplasticity continues for life with consistent work", "True for adults, false for children"],
        2,
        "Re-read the section about the '90-day window myth.'",
        "The 90-day window is an average that includes people who quit. The brain can rewire for life. People recover new function years and decades out — when they keep working.",
      ),
    ],
  },
  {
    chapter: 3,
    partNumber: 1,
    title: "The Recovery Timeline",
    subtitle: "What to expect in days, weeks, months, and years",
    requiredTier: "explorer",
    estimatedMinutes: 20,
    body: `## Reset your expectations now.

Recovery isn't linear. It's not a staircase. It's a mountain trail with switchbacks, false summits, and the occasional cliff. Anyone who tells you "you'll be back to normal in X months" is selling you something.

Here's the honest version.

### Week 1-2: The Fog
You may not remember most of it. The brain is in shock. Sleeping 16 hours a day is normal. Don't measure progress here.

### Week 2-6: Spontaneous recovery
Your brain is still calming down from the swelling. Some function comes back on its own — limbs you couldn't move start twitching, words you couldn't find arrive. **Don't take credit for this. Don't blame yourself either.** This is biology, not effort.

### Month 2-6: The honeymoon
Therapy gains feel fast. Every week you can do something new. This is the most rewarding window. Bank the wins, but don't believe the highs are forever.

### Month 6-18: The plateau
This is where most survivors quit. Gains slow down. Insurance stops. Therapists discharge you. **The plateau is not a ceiling.** It's the moment your brain says "show me you're serious." If you keep working through it, you crack through to the next level. If you stop, this becomes your forever.

### Year 2 and beyond: The long climb
Recovery never stops. Pick a function — walking, talking, fine motor — and you can keep improving for the rest of your life. Slower than year 1. But real.

### How to read your timeline

- Compare yourself to **you-yesterday**, not to other survivors.
- Track in months, not days.
- A bad week is data, not a verdict.
- One single rep on a bad day still rewires the brain.`,
    keyTakeaways: [
      "First 6 weeks: don't grade yourself. The brain is still in chaos.",
      "Months 2-6 are fast. Months 6-18 are where most quit.",
      "The plateau is not a ceiling. It's a test.",
      "Compare yourself to you-yesterday, not to other survivors.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is it unhelpful to measure progress in the first 1-2 weeks?",
        ["The brain is healing too fast to track", "The brain is in shock from swelling and trauma", "Insurance won't pay for measurement", "It's against medical advice"],
        1,
        "Think about what's happening to brain tissue right after the event.",
        "The first two weeks are dominated by swelling, shock, and exhaustion. Sleeping 16+ hours is normal. Measuring 'progress' against this baseline will only frustrate you.",
      ),
      Q(
        "What is the 'plateau' between months 6-18?",
        ["The point recovery permanently stops", "A slowdown in visible gains where most survivors quit", "When insurance starts paying again", "A medication side effect"],
        1,
        "It's a slowdown, not a stop.",
        "The plateau is when gains stop being weekly and become monthly. Most survivors mistake it for a ceiling and stop. Survivors who push through find that gains continue — just slower.",
      ),
      Q(
        "Per Nick, who should you compare yourself to?",
        ["Pre-stroke you", "Other survivors at your stage", "You-yesterday", "The textbook recovery curve"],
        2,
        "It's the version of you closest in time.",
        "Comparison to other survivors is poison — every brain is different. Comparison to pre-stroke you is depressing. Comparison to you-yesterday is the only one that motivates without lying.",
      ),
      Q(
        "What does 'spontaneous recovery' refer to?",
        ["Function that returns from the brain calming down, not from your effort", "Magic", "A rare drug effect", "Function you earn from intense therapy"],
        0,
        "It happens whether you work or not.",
        "Some early function returns simply because the swelling subsides and stunned tissue reactivates. It happens with or without effort. Don't take credit, don't take blame.",
      ),
      Q(
        "What is the right way to interpret a 'bad week' in recovery?",
        ["A verdict on your future", "A reason to quit", "Data, not a verdict", "Proof that recovery has stopped"],
        2,
        "It's information, not a sentence.",
        "Bad weeks happen. Sleep, weather, mood, infection, hormones — all of it affects the brain. A bad week is information about what your body needs, not a permanent ranking.",
      ),
    ],
  },
  {
    chapter: 4,
    partNumber: 1,
    title: "Building Your Recovery Team",
    subtitle: "Doctors, therapists, caregivers, and your role",
    requiredTier: "explorer",
    estimatedMinutes: 25,
    body: `## You are the general contractor.

Your team is not your boss. You are. They are subcontractors with specialized skills. You hire, fire, coordinate, and fight for what you need. If that sounds aggressive, good. The survivors who do best treat their care like running a small business — with themselves as CEO.

### The core team

**Neurologist** — owns your meds and monitors stroke risk. See them quarterly at minimum. Bring a written list of questions to every visit. They have 11 minutes for you.

**Primary Care Doctor** — your generalist. They coordinate everything. If yours isn't returning calls or doesn't take stroke seriously, fire them.

**Physical Therapist (PT)** — gross motor: walking, balance, strength.

**Occupational Therapist (OT)** — fine motor and life skills: dressing, eating, writing, cooking.

**Speech-Language Pathologist (SLP)** — speech, swallowing, cognition. Every survivor needs an SLP eval, even if you 'sound fine.'

**Caregiver(s)** — spouse, parent, friend, paid aide. Hardest job in your life, by a mile. Treat them like the heroes they are.

### Who else you'll need

- A mental health professional (stroke depression hits 1 in 3 — get ahead of it)
- A nutritionist if your stroke was lifestyle-driven
- A neuro-optometrist if you have visual field cuts
- A peer mentor — another survivor 1-2 years ahead of you. This is the most underrated hire on the list.

### How to fight for what you need

Insurance cuts therapy short. Doctors stop listening. Hospitals discharge you when they need the bed. **You will be told 'no' a lot.** The Sasquatch response: "Show me where it says no in writing." Most denials evaporate when you push.

### What you owe your team

Show up. Do the homework. Tell them what's actually happening, not the polite version. Fire the ones who don't believe in your recovery. Keep the ones who push you.`,
    keyTakeaways: [
      "You're the CEO of your recovery. The team works for you.",
      "PT/OT/SLP are non-negotiable for the first year minimum.",
      "1 in 3 survivors get post-stroke depression — get a mental health pro early.",
      "A peer mentor 1-2 years ahead of you is the most underrated hire.",
      "When you hear 'no,' ask for it in writing. Most denials cave.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Which therapist focuses on fine motor skills like dressing and eating?",
        ["Physical Therapist", "Occupational Therapist", "Speech-Language Pathologist", "Neurologist"],
        1,
        "Think about which one focuses on 'occupations' of daily life.",
        "Occupational Therapists own fine motor and ADLs (activities of daily living) — anything from buttoning a shirt to chopping vegetables.",
      ),
      Q(
        "What rough percentage of stroke survivors experience post-stroke depression?",
        ["1 in 100", "1 in 10", "1 in 3", "Nobody — depression is unrelated"],
        2,
        "Roughly a third.",
        "About 1 in 3 stroke survivors will experience post-stroke depression. It's neurological, not a character flaw. Get a mental-health pro on your team early — don't wait until you're drowning.",
      ),
      Q(
        "Per Nick, what is the most underrated hire on your recovery team?",
        ["A second neurologist", "A peer mentor 1-2 years ahead of you", "An expensive private trainer", "An attorney"],
        1,
        "It's another survivor.",
        "A peer mentor who's 1-2 years ahead of you can compress your learning curve by months. They've already lived your next chapter and can tell you what's worth your effort.",
      ),
      Q(
        "What's the recommended response when insurance or a provider says 'no'?",
        ["Accept it and move on", "Ask for the denial in writing — most cave", "Switch insurance immediately", "Pay out of pocket"],
        1,
        "Make them put it on paper.",
        "Most verbal denials don't survive being put in writing. Asking 'show me where this is denied in writing' triggers an internal review and frequently overturns the no.",
      ),
      Q(
        "What is your role in this 'team' framing?",
        ["Patient who follows orders", "Passive recipient of care", "CEO / general contractor", "Insurance representative"],
        2,
        "Top of the org chart.",
        "You hire, you fire, you coordinate. The team are subcontractors with specialty skills. They work for you, not the other way around.",
      ),
    ],
  },

  // ─── PART 2: MINDSET MASTERY ───────────────────────────────────────────────
  {
    chapter: 5,
    partNumber: 2,
    title: "Destroying the Victim Mentality",
    subtitle: "From 'why me' to 'watch me'",
    requiredTier: "warrior",
    estimatedMinutes: 35,
    body: `## The most dangerous thing in your hospital room is your own self-pity.

The stroke happened. It's not fair. You didn't deserve it. All true. None of it matters now. The only question that matters is: what are you going to do with the next 24 hours?

### How victim mentality kills recovery

It hijacks your reps. Every time your brain runs the loop of "this shouldn't have happened to me," it's not running the loop of "let me try that movement one more time." Your reps are finite per day — sleep, fatigue, meds — so every minute spent in victimhood is a minute stolen from rewiring.

Victim mentality also rewires the brain — in the wrong direction. Remember Hebb's Law: fire together, wire together. Run the victim loop a thousand times and you carve a deep groove that gets harder to escape.

### The three escape hatches

1. **Replace 'why me' with 'what now.'** Same syllables. Different brain.

2. **Refuse to weaponize your stroke against people who love you.** The second you start using "I had a stroke" to win arguments, dodge work, or guilt-trip caregivers, you've signed a long-term lease in victim country. Don't.

3. **Find someone worse off and help them.** Sounds counterintuitive — but service to another survivor is the fastest known way out of self-pity. Your problems shrink the moment you carry someone else's.

### The one exception

You're allowed to mourn. You lost something real. Set a timer — fifteen minutes a day, in private — and let it out. Then close it. The timer is not a suggestion. Without it, mourning becomes the whole life.`,
    keyTakeaways: [
      "Self-pity steals reps you don't have to spare.",
      "Replace 'why me' with 'what now' — same syllables, different brain.",
      "Don't weaponize your stroke against people who love you.",
      "Helping another survivor is the fastest exit from self-pity.",
      "Mourn for 15 minutes a day, on a timer. Then close it.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Per the chapter, what does victim mentality steal from a survivor's recovery?",
        ["Money", "Sleep quality only", "Reps and brain rewiring time", "Insurance coverage"],
        2,
        "Think about what neuroplasticity needs.",
        "Recovery runs on finite daily reps. Time spent looping 'why me' is time not spent rewiring. Worse, the victim loop itself wires in via Hebb's Law.",
      ),
      Q(
        "What's the recommended substitute for 'why me?'",
        ["'It's not fair'", "'Why now'", "'What now'", "'When me'"],
        2,
        "Same syllables, different direction.",
        "'What now' redirects the brain from blame to action with almost no friction. It's the cheapest, fastest mental swap in the curriculum.",
      ),
      Q(
        "What is the 'mourning timer' rule?",
        ["Mourn for 8 hours a day", "Never mourn", "15 minutes a day, then close it", "Only mourn at night"],
        2,
        "It's a contained ritual.",
        "Mourning is real and necessary. Uncontained, it eats the day. A short, daily, private ritual lets you process the loss without letting it run your life.",
      ),
      Q(
        "Per the chapter, what is the fastest way out of self-pity?",
        ["Therapy alone", "Medication", "Helping another survivor", "Reading more about stroke"],
        2,
        "Service.",
        "Service to someone worse off shrinks your own problems immediately and rewires your identity from 'patient' to 'helper.'",
      ),
      Q(
        "What does 'weaponizing your stroke' look like?",
        ["Wearing a medical alert bracelet", "Using your stroke to win arguments or guilt-trip loved ones", "Talking about your stroke in therapy", "Asking for help moving heavy objects"],
        1,
        "It's about manipulation, not legitimate accommodation.",
        "Asking for legitimate help is fine. Using your stroke as leverage in arguments or as a guilt-trip lever signs a long-term lease in victim country and damages every relationship you have.",
      ),
    ],
  },
  {
    chapter: 6,
    partNumber: 2,
    title: "The Power of Relentless Optimism",
    subtitle: "Training your brain for success",
    requiredTier: "warrior",
    estimatedMinutes: 25,
    body: `## Optimism is not a personality. It's a practice.

People look at someone optimistic and think they were born that way. Wrong. Optimism is reps, same as a pinch grip. You train it daily until your brain defaults to it without you having to push.

### Why a pessimistic brain rewires worse

A brain in fear or despair runs in survival mode. It dumps cortisol, narrows attention, and shuts down the executive functions that drive learning. You can do a thousand reps in this state and rewire less than a survivor doing 200 in a calm, hopeful state. The body is the same — the brain is what's different.

### The five-minute training

Every morning, before you check your phone:

1. Name three things in your body that work today.
2. Name one thing you're going to attempt today that scares you a little.
3. Name one person you're grateful for, and why.
4. Say out loud: "Today I get to recover." Not "have to." **Get to.**
5. Stand up.

That's it. Five minutes. Do this for 60 days and your default mood changes.

### Beware toxic positivity

Relentless optimism is not "everything is fine." Everything is not fine. Your arm doesn't work. You can't drive. You miss who you used to be. Optimism that pretends those things aren't true is fake and your brain knows it. Real optimism says: "This is hard, AND I am still going to make progress today."`,
    keyTakeaways: [
      "Optimism is a daily practice, not a personality trait.",
      "Cortisol from despair physically slows neuroplastic rewiring.",
      "The 5-minute morning training, done for 60 days, resets your default mood.",
      "Real optimism includes 'this is hard.' Toxic positivity skips that part.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why does a fearful or despairing brain rewire less efficiently?",
        ["It produces cortisol and narrows attention", "It uses too much glucose", "It produces too much serotonin", "It can't form new neurons"],
        0,
        "Stress hormones do something specific to brain function.",
        "Cortisol from chronic stress narrows attention and shuts down executive functions needed for learning. The same reps in a calm state rewire faster.",
      ),
      Q(
        "What's the first step in the 5-minute morning training?",
        ["Check your phone", "Name three things in your body that work", "Stand up immediately", "Say a prayer"],
        1,
        "It comes before standing.",
        "Naming three things in your body that work flips the brain from deficit-focus to asset-focus before any other input arrives.",
      ),
      Q(
        "What's the difference between relentless optimism and toxic positivity?",
        ["No difference", "Toxic positivity ignores reality; real optimism acknowledges it", "Toxic positivity uses meditation; real optimism doesn't", "Toxic positivity is for caregivers, optimism is for survivors"],
        1,
        "One pretends, the other acknowledges.",
        "Toxic positivity says 'everything is fine.' Real optimism says 'this is hard, AND I'll make progress today.' The brain can tell the difference.",
      ),
      Q(
        "Per the chapter, swap 'have to recover' with:",
        ["'Need to recover'", "'Get to recover'", "'Should recover'", "'Will recover'"],
        1,
        "It's a verb of opportunity.",
        "'Get to' frames recovery as a privilege you're alive to pursue. The same task feels lighter when it's an opportunity instead of an obligation.",
      ),
      Q(
        "How long does the morning training take to reset your default mood?",
        ["7 days", "60 days", "1 year", "It doesn't work"],
        1,
        "About two months.",
        "60 days of consistent practice is enough to rewire the default mood pathway. That's why the 66-Day Sasquatch Challenge runs for that length.",
      ),
    ],
  },
  {
    chapter: 7,
    partNumber: 2,
    title: "Embracing the Suck",
    subtitle: "Finding strength in struggle",
    requiredTier: "warrior",
    estimatedMinutes: 30,
    body: `## The military has a phrase. Steal it.

"Embrace the suck" means: stop wishing the hard thing weren't hard, and start using the hard thing as fuel. Your stroke is the suck. So is the third hour of PT when your shoulder won't lift. So is the speech app on day 41 when you still can't say your daughter's name without it sounding wrong.

### Why suck-resistance is the killer

Most survivors don't quit because the work is too hard. They quit because they spent all their energy *resisting* how hard it is. Resistance is the leak. The actual work, even when brutal, is bearable. The story you tell yourself about how unfair it is — that's what drains the battery.

### The reframe

The reps you do on the bad days are worth ten of the reps on the good ones. Not because they're harder physically, but because of what they wire into your identity. Every rep on a bad day tells your brain: **"I am the kind of person who shows up when it sucks."** That belief becomes a vehicle that carries you through the next 30 years.

### The Sasquatch test

When something feels impossible, ask: is it actually impossible, or is it just hard and unfamiliar? 95% of the time it's the second one. The Sasquatch test is to do one more rep than you wanted to. Just one. That single rep — done specifically because you didn't want to — is the rep that builds the muscle.

### What to actually do when you hit the wall

1. Name what hurts, out loud.
2. Set a 90-second timer. Sit with it. Don't fight it.
3. When the timer ends, do one rep.
4. Then one more.
5. If you got two reps in, today was a win.`,
    keyTakeaways: [
      "Resistance to the suck drains more energy than the suck itself.",
      "Bad-day reps are worth 10x — they wire identity, not just movement.",
      "When stuck, ask: impossible, or just hard and unfamiliar? Usually the second.",
      "On wall-hit days, the rule is two reps. Two reps = win.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is resistance to difficulty more draining than the difficulty itself?",
        ["It uses more calories", "It leaks energy that could have gone to actual work", "It causes inflammation", "It slows breathing"],
        1,
        "It's an energy leak, not the work itself.",
        "Resistance is psychological friction running constantly in the background. The actual rep takes seconds. The story about how unfair it is runs all day.",
      ),
      Q(
        "Per the chapter, why are 'bad day reps' worth more?",
        ["They burn more calories", "They wire identity, not just movement", "They trigger more endorphins", "They count double for insurance"],
        1,
        "Identity is the reason.",
        "A rep on a bad day teaches your brain: 'I'm the kind of person who shows up when it sucks.' That belief carries you for decades.",
      ),
      Q(
        "What is the 'Sasquatch test' when something feels impossible?",
        ["Sleep on it", "Do one more rep than you wanted to", "Skip it", "Switch to a different exercise"],
        1,
        "Just one more.",
        "Doing one extra rep — specifically because you didn't want to — is the rep that builds the comeback muscle. Anyone can do the easy ones.",
      ),
      Q(
        "When you hit the wall, what's the recommended timer length to sit with the discomfort?",
        ["10 seconds", "90 seconds", "10 minutes", "1 hour"],
        1,
        "Just over a minute.",
        "Ninety seconds is enough to fully feel the emotion without letting it become the whole day. Most physiological emotional spikes peak and pass in about 90 seconds.",
      ),
      Q(
        "What counts as 'a win' on a wall-hit day?",
        ["Hitting your normal rep count", "Two reps", "Skipping the workout entirely", "Crying it out"],
        1,
        "A small but specific number.",
        "Two reps. Period. The bar on a wall-hit day is two — and clearing that bar is a win, not a participation trophy.",
      ),
    ],
  },
  {
    chapter: 8,
    partNumber: 2,
    title: "Setting Impossible Goals",
    subtitle: "Why thinking small is your enemy",
    requiredTier: "warrior",
    estimatedMinutes: 25,
    body: `## "Realistic" is a trap word.

Every well-meaning person on your team will tell you to set "realistic" goals. They mean well. They're also wrong. Realistic goals are calibrated to the average survivor, and the average survivor quits. The average is a graveyard. You don't want to be the average.

### Why impossible goals work

The brain doesn't aim for what it thinks it can do. It aims for what it's been told to aim for. Set the goal at "walk to the mailbox by Christmas" and you might walk to the mailbox by Christmas. Set it at "hike a 14er by my second strokeversary" and you'll be on a treadmill in March instead of a recliner.

The goal pulls the work. The work changes the brain. The brain catches up to the goal — or gets close enough that the gap doesn't matter.

### The Sasquatch goal stack

- **The 30-year goal:** what you want to be doing in 2055.
- **The 5-year goal:** the milestone that makes the 30-year possible.
- **The 1-year goal:** the milestone that makes the 5-year possible.
- **The 90-day goal:** the bite-sized version you can actually grip.
- **Today's rep:** the only thing you control.

If you can't connect today's rep to the 30-year vision in one breath, the goal stack is broken. Fix it before you train another minute.

### What to do when people mock your goals

Don't argue. Don't explain. Don't lower the goal. Smile, write the goal down again, and put your head back into the work. Six months from now they'll be quiet. Twelve months from now they'll be asking how you did it.`,
    keyTakeaways: [
      "'Realistic' is calibrated to people who quit. Don't let it cap you.",
      "The goal pulls the work. The brain catches up to the goal.",
      "Stack it: 30-year → 5-year → 1-year → 90-day → today's rep.",
      "When mocked, don't explain. Just keep working.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is 'realistic' called a trap word?",
        ["It's too hard to spell", "It's calibrated to the average survivor, who quits", "It's only used by lawyers", "It triggers cortisol"],
        1,
        "Think about whose recovery 'realistic' is based on.",
        "'Realistic' is statistical — anchored to averages. The averages include people who quit. Aiming there means aiming low.",
      ),
      Q(
        "How does an 'impossible' goal work mechanically?",
        ["It guarantees you hit it", "It pulls the work, and the brain catches up", "It triggers a placebo response", "It makes therapists work harder"],
        1,
        "It's about pull, not magic.",
        "The brain reorganizes around the goal it's been given. A bigger goal pulls bigger work, and the work — not the goal itself — produces the change.",
      ),
      Q(
        "How many tiers are in the Sasquatch goal stack?",
        ["3", "5", "7", "10"],
        1,
        "Count them: 30-year, 5-year, 1-year, 90-day, today.",
        "Five: 30-year vision, 5-year milestone, 1-year milestone, 90-day target, and today's rep. Each tier must connect to the one above.",
      ),
      Q(
        "If you can't connect today's rep to the 30-year vision in one breath, what should you do?",
        ["Train harder anyway", "Fix the goal stack before training again", "Quit", "Lower the 30-year vision"],
        1,
        "There's a structural problem to fix first.",
        "If today's rep doesn't ladder up cleanly, you're either training the wrong thing or the goal stack is broken. Fix the structure before adding more work to a bad foundation.",
      ),
      Q(
        "What's the recommended response when people mock your goals?",
        ["Argue and convince them", "Lower the goal so they're comfortable", "Smile, write the goal down again, and keep working", "Cut them out of your life"],
        2,
        "Action over argument.",
        "Don't waste reps on convincing. The work itself becomes the answer over time. Six months in they'll be quiet; twelve months in they'll be asking how.",
      ),
    ],
  },
  {
    chapter: 9,
    partNumber: 2,
    title: "Daily Mental Warfare",
    subtitle: "Winning the battle in your mind every day",
    requiredTier: "warrior",
    estimatedMinutes: 30,
    body: `## The fight isn't the workout. The fight is between your ears.

Every day you wake up, the negative loop is already running. *You're not as good as you were. You'll never be normal. Why bother.* That's not weakness. That's the default brain. Your job is to shut down the loop and replace it with one that serves you, every single day, for the rest of your life.

### The three battles

**Morning battle:** the first 60 seconds after waking. The loop will hand you a list of everything you can't do. Counter with the morning training from Chapter 6 before you check your phone.

**Mid-day battle:** the energy crash. Your affected side is screaming. You skip a rep. Then another. Then the day is gone. Counter: the **micro-rep rule.** When you don't want to do anything, do one rep of one exercise. Just one. Almost always you'll do five.

**Night battle:** the reckoning. You're in bed. You list what you didn't do today. The loop tells you tomorrow won't be different. Counter: write down one thing you DID do today. Even putting on socks counts. Then sleep.

### The non-negotiables

- No "I can't" out loud. Ever. Replace with "I can't yet."
- No comparing your day 90 to someone else's day 900.
- No social media first thing in the morning.
- No skipping the morning training, even if you do it in bed.

### What to do when you lose the day

You will. Some days the loop wins. Don't make it two days. The streak is broken at two — never at one. Get back to the rep tomorrow morning and don't say a word about yesterday.`,
    keyTakeaways: [
      "The loop is the default brain. Shutting it down is daily work, not a one-time fix.",
      "Morning, mid-day, night — three predictable battles.",
      "Micro-rep rule: when you don't want to, do one. You'll usually do five.",
      "Replace 'I can't' with 'I can't yet.'",
      "The streak breaks at two days off, never one. One day is a blip.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What's the 'micro-rep rule' for the mid-day battle?",
        ["Do half your normal workout", "Do one rep of one exercise — you'll usually do five", "Skip the workout if you're tired", "Take a 4-hour nap"],
        1,
        "Lower the activation energy.",
        "Lowering the activation cost to one rep beats the part of the brain that argues against starting. Once you've started, momentum carries you to four or five.",
      ),
      Q(
        "What's the recommended replacement for 'I can't'?",
        ["'I won't'", "'I can't yet'", "'It's impossible'", "'Maybe later'"],
        1,
        "Add a single word.",
        "'Yet' converts a verdict into a stage. The brain treats them completely differently.",
      ),
      Q(
        "When does a recovery streak actually break?",
        ["After one missed day", "After two missed days in a row", "After three missed days", "After a week"],
        1,
        "Two, not one.",
        "One missed day is a blip. Two becomes a pattern. Hold the line at two and you can recover from any single bad day.",
      ),
      Q(
        "What's the night battle counter?",
        ["List what you didn't do", "List one thing you DID do, even if small", "Stay up later to make up for it", "Take sleep medication"],
        1,
        "Asset-focus, not deficit-focus.",
        "The night loop runs on what you didn't do. Naming one thing you DID do — even putting on socks — gives the brain a different file to save during sleep.",
      ),
      Q(
        "Why does morning training need to happen BEFORE checking your phone?",
        ["The phone screen damages the brain", "Notifications hijack attention before you can set the day's mental tone", "Phones drain battery", "It's a hospital rule"],
        1,
        "It's about who gets the first input.",
        "The first inputs of the day set the brain's default mood. If a doom-scroll gets there before your training does, you've already lost the morning battle.",
      ),
    ],
  },

  // ─── PART 3: PHYSICAL RECLAMATION ──────────────────────────────────────────
  {
    chapter: 10,
    partNumber: 3,
    title: "Upper Extremity Awakening",
    subtitle: "Arm, hand, and fine motor recovery",
    requiredTier: "warrior",
    estimatedMinutes: 45,
    body: `## The arm is the toughest job. Start anyway.

Roughly 80% of stroke survivors have arm weakness. Of those, only about a third regain useful hand function. Why? Because the arm and especially the hand have the densest neural representation in the brain — and that means the most wiring to rebuild. It also means the highest reward when you do.

### The map

- **Shoulder:** the foundation. No shoulder, no useful arm.
- **Elbow:** the lever.
- **Wrist:** the steering wheel.
- **Fingers:** the manipulator.
- **Thumb:** opposable, irreplaceable, hardest of all.

You don't get to skip levels. The shoulder has to wake up before the hand does anything useful in space.

### The protocol

Three blocks per day, 20 minutes each.

**Block A — Wake-up (passive + active-assistive):** With your good hand, walk the affected arm through full range. Shoulder flexion to ear, abduction to ear, internal/external rotation. Then try the same movement actively. Even a millimeter counts.

**Block B — Loaded function (CIMT-style):** Tie your good hand down. Pick a real-world task: pick up a sock, push a book, turn a doorknob. 30 minutes. The frustration is the medicine.

**Block C — Fine motor (hand and thumb):** Therapy putty, marble pickup, button practice, coin transfer. 20 minutes. Music helps.

### The rules

- Shoulder before hand.
- Slow before fast.
- Range before strength.
- Quality of one rep beats quantity of ten sloppy ones.
- Mirror therapy works — use it.

### Spasticity is not the enemy

Tight muscles are a sign your brain is sending signals — they're just too loud. Botox, baclofen, and stretching reduce volume so the signal can be heard. We cover this in Chapter 13.`,
    keyTakeaways: [
      "Hand recovery is the hardest job in the body. Worth the work.",
      "Shoulder before hand. Range before strength.",
      "Three daily blocks: wake-up, CIMT-style function, fine motor.",
      "Spasticity is signal, not noise. Quiet it without silencing it.",
      "Mirror therapy is real and free — use it.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is the hand the hardest body part to recover?",
        ["It has the smallest muscles", "It has the densest neural representation in the brain", "It heals slowest physically", "It is too small to train"],
        1,
        "Think about the brain's wiring map.",
        "The hand has disproportionately massive cortical real estate (look up the 'cortical homunculus'). That density means more wiring to rebuild — and more reward when you do.",
      ),
      Q(
        "Per the chapter, which body part must wake up FIRST?",
        ["Fingers", "Thumb", "Shoulder", "Wrist"],
        2,
        "Foundation before the levers.",
        "No shoulder, no useful arm. The shoulder is the platform that lets the hand operate in space. Skipping it produces frustration and no function.",
      ),
      Q(
        "What is the purpose of CIMT-style training?",
        ["To rest the affected limb", "To force the brain to engage the affected side by restricting the strong one", "To strengthen the strong arm", "To prevent contractures"],
        1,
        "It removes the easy option.",
        "Constraint-Induced Movement Therapy ties down the strong limb so the brain has no choice but to wake up the affected one. The frustration IS the rewiring.",
      ),
      Q(
        "Per the chapter, what is spasticity actually a sign of?",
        ["Permanent paralysis", "The brain sending signals — too loudly", "Lack of effort", "An infection"],
        1,
        "It's a signal problem, not silence.",
        "Spasticity means signals are getting through, just dysregulated. That's GOOD news compared to flaccidity. Treatment quiets the volume so coordinated movement is possible.",
      ),
      Q(
        "What's the right priority order for arm training?",
        ["Strength → range → speed", "Speed → range → strength", "Range → strength → speed (slow before fast, range before strength)", "Random order is fine"],
        2,
        "You can't strengthen what doesn't move.",
        "Range before strength: you can't load a joint that doesn't have range. Slow before fast: control before speed. Speed without control is reinforcing bad wiring.",
      ),
    ],
  },
  {
    chapter: 11,
    partNumber: 3,
    title: "Lower Body Liberation",
    subtitle: "Leg strength, balance, and walking",
    requiredTier: "warrior",
    estimatedMinutes: 40,
    body: `## Walking is freedom. Get it back.

About 65% of stroke survivors will walk again to some degree. Whether you end up in the upper or lower half of that range is mostly about how aggressive you're willing to be in months 2-12.

### The components of walking

Walking is not "moving your legs." It's a stack:

1. **Sit-to-stand** — get up off the chair without using your hands.
2. **Static balance** — stand still without falling.
3. **Weight shift** — load one leg, then the other.
4. **Single-leg stance** — stand on one leg for 5+ seconds.
5. **Step initiation** — break the stick-to-the-floor reflex.
6. **Gait pattern** — heel-strike, push-off, swing-through.
7. **Speed and endurance** — walk far enough and fast enough to be useful.

You have to own each step before stacking the next one. Trying to "just walk" before you have weight shift is how you fall and break a hip.

### Daily protocol

- Sit-to-stands: 30 reps, slow, no hands. Three times a day.
- Weight shifts: 5 minutes, side to side, holding a counter.
- Single-leg stance: 30 seconds per side, twice a day.
- Treadmill (with harness if available): 20 minutes, slow but consistent. Work up to 30.

### Falls are the enemy

A bad fall ends recovery for months. Prevent them: clear floors, grab bars, no socks on tile, AFO if your foot drops. There is no medal for refusing the brace. There IS a medal for being alive at year 5.

### The plateau-buster

When walking gets stuck, the answer is almost never "walk more." It's strength. Squats, deadlifts (light, machine), step-ups. Stronger glutes solve more gait problems than gait drills do.`,
    keyTakeaways: [
      "Walking is a 7-step stack. Don't skip levels.",
      "Sit-to-stands are the most underrated exercise in stroke recovery.",
      "Falls end recoveries. Use the brace, clear the floor, hold the rail.",
      "When walking plateaus, build strength — usually glutes.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What's the FIRST level in the walking stack?",
        ["Treadmill walking", "Sit-to-stand", "Running", "Single-leg stance"],
        1,
        "Before you walk, you have to stand up.",
        "Sit-to-stand is the foundational power move. If you can't get out of a chair without using hands, no walking program will produce useful results.",
      ),
      Q(
        "Roughly what percentage of stroke survivors walk again to some degree?",
        ["About 25%", "About 65%", "About 90%", "Nearly 100%"],
        1,
        "Roughly two-thirds.",
        "About 65% of stroke survivors recover some walking ability. Where you land in that distribution depends mostly on aggression in months 2-12.",
      ),
      Q(
        "Why is refusing a foot brace (AFO) a bad idea when you have foot drop?",
        ["It looks bad", "Falls end recoveries for months — pride is not worth a broken hip", "Insurance won't cover it", "It's against medical advice"],
        1,
        "Risk-management.",
        "There is no medal for refusing the brace. There IS a medal for being alive and uninjured at year 5. A bad fall can erase a year of progress overnight.",
      ),
      Q(
        "When walking plateaus, what's usually the answer?",
        ["More walking", "Strength training, especially glutes", "Stretching", "Different shoes"],
        1,
        "It's not more of the same.",
        "When gait stops improving, the bottleneck is almost always weakness. Stronger glutes and quads fix more gait problems than gait drills.",
      ),
      Q(
        "What is 'weight shift' in the walking stack?",
        ["Losing weight", "Loading one leg then the other while standing", "Moving body weight from arms to legs", "A type of squat"],
        1,
        "It's a balance prerequisite.",
        "Weight shift is the ability to load and unload each leg in standing. Without it, you can't initiate a step — and pretending you can leads to falls.",
      ),
    ],
  },
  {
    chapter: 12,
    partNumber: 3,
    title: "Core Power Restoration",
    subtitle: "Rebuilding your foundation",
    requiredTier: "warrior",
    estimatedMinutes: 35,
    body: `## The core is not your six-pack. It's your nervous system in a girdle.

When the stroke hit, your core wiring took a hit alongside everything else. Sitting up straight got harder. Twisting hurt. Your trunk leans. That's not laziness — it's neurology. And until you fix it, every other exercise you do is built on sand.

### What the core actually is

- Diaphragm (top)
- Pelvic floor (bottom)
- Transverse abdominis (front and sides)
- Multifidus (deep spine)
- Obliques and glutes (rotation and stability)

These muscles co-contract every time you breathe, sit, stand, reach, or speak. Speaking. That's why aphasia rehab includes core work.

### Daily core protocol

- **Diaphragmatic breathing:** 5 minutes, twice a day. Hand on belly, hand on chest. Belly hand moves, chest hand stays still. Reset the breath pattern.
- **Seated marches:** 2 sets of 20. Sit tall, lift one knee, then the other.
- **Bird-dog (or modified):** 2 sets of 10 per side. On hands and knees, opposite arm and leg.
- **Glute bridges:** 2 sets of 15. Lie on back, feet flat, lift hips.
- **Side planks (modified, knees down):** 20 seconds per side, building to 60.

### Sitting posture is core training

Every minute you're slumped in a chair is a minute reinforcing weak core wiring. Sit at the front edge of the seat. Both feet flat. Spine tall. Boring? Yes. Effective? Also yes.

### When the core wakes up

You'll notice it before your therapist does. Standing feels easier. Reaching no longer makes you tip. Talking is louder because the diaphragm is finally helping. Spasticity in the affected arm often quiets, because the brain finally has a stable platform to send signals from.`,
    keyTakeaways: [
      "Core = diaphragm + pelvic floor + deep abs + spine + glutes.",
      "Without core, every other exercise is built on sand.",
      "Diaphragmatic breathing is core training and the foundation.",
      "Sitting posture is a 16-hour workout you're either passing or failing.",
      "Stable core often quiets arm spasticity by giving the brain a platform.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Per the chapter, which of these is part of the 'core'?",
        ["Only the rectus abdominis (six-pack)", "Diaphragm + pelvic floor + deep abs + spine muscles + glutes", "Just the lower back", "Only the obliques"],
        1,
        "It's a girdle, not a panel.",
        "The core is a 360-degree cylinder. The six-pack is one wall of it. Most stroke survivors who think they're 'doing core' are missing 4 of the 5 components.",
      ),
      Q(
        "Why does diaphragmatic breathing belong in core training?",
        ["It calms anxiety", "The diaphragm IS a core muscle, top of the cylinder", "It helps with cardio", "It's a warm-up only"],
        1,
        "It's anatomy, not just relaxation.",
        "The diaphragm is the literal top of the core cylinder. Reset the breath pattern and you reset the core's foundation.",
      ),
      Q(
        "Why does the chapter say sitting posture is a workout?",
        ["You burn calories sitting", "You spend ~16 hours a day sitting/leaning — the wiring you reinforce there compounds", "Sitting is dangerous", "Therapists charge for it"],
        1,
        "Volume matters.",
        "You spend more time sitting than doing any prescribed exercise. The posture you hold during those hours is either reinforcing good wiring or reinforcing slump.",
      ),
      Q(
        "What often happens to arm spasticity when the core finally wakes up?",
        ["It gets worse", "It often quiets, because the brain has a stable platform to send signals from", "It stays the same", "It moves to the leg"],
        1,
        "Stable platform = clearer signals.",
        "A weak core forces the brain to dump effort into trunk stability before reaching. When the core is solid, signals to the arm are cleaner and spasticity often quiets on its own.",
      ),
      Q(
        "Why does aphasia (speech) rehab include core work?",
        ["Speech therapists are also PTs", "The diaphragm and core power voice volume and breath support", "It's filler in long sessions", "It doesn't, the chapter is wrong"],
        1,
        "Voice runs on breath.",
        "Speech is shaped breath. A weak diaphragm and core produces a weak, breathy voice no matter how good the articulation work is. Core work is speech work.",
      ),
    ],
  },
  {
    chapter: 13,
    partNumber: 3,
    title: "Spasticity Management",
    subtitle: "Taming the muscle beast",
    requiredTier: "warrior",
    estimatedMinutes: 30,
    body: `## Spasticity is the loud signal. Don't silence it — tune it.

After stroke, the brain's signal to your muscles can become dysregulated. Muscles fire when they shouldn't. They stay tight. The arm curls. The fingers fist. The leg stiffens at the hip and knee. That's spasticity, and it's both a curse and a clue.

### Why it happens

The damaged brain loses some of the inhibitory signals that normally tell muscles "you're done, relax." Without that off-switch, muscles default to ON. It's not your fault and it's not laziness.

### The four-tool kit

1. **Daily stretch.** Long-hold stretches (60+ seconds), every joint affected. Twice a day, minimum. This is non-negotiable.

2. **Heat before, ice after.** Heat the muscle to make it more pliable, work it, then ice to calm it down.

3. **Botox** is not vanity. Targeted Botox into spastic muscles quiets them for 3-4 months and creates a window where therapy actually sticks. Ask for it.

4. **Baclofen, tizanidine, and other oral meds** can help globally — but they make you sleepy, which kills reps. Use surgically, not as a default.

### The contracture warning

If you don't stretch, the spastic muscle eventually shortens permanently. That's a contracture. Once it's locked in, only surgery fixes it. Don't earn that surgery.

### What to actually do today

- 10 minutes of stretching, morning and night.
- Splint the hand at night (resting hand splint).
- AFO during the day if foot drop or ankle clonus.
- Talk to a physiatrist about Botox if spasticity is blocking function.
- Move the joint through full range every hour you're awake. Even passively. Every hour.`,
    keyTakeaways: [
      "Spasticity = lost inhibitory signal. Not laziness.",
      "Stretch twice a day, 60+ second holds. Non-negotiable.",
      "Botox is a window-opener for therapy, not vanity.",
      "Untreated spasticity becomes contracture. Contracture needs surgery.",
      "Splints at night, AFO by day, full range every waking hour.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What causes post-stroke spasticity?",
        ["Lazy muscles", "Loss of inhibitory signals from the damaged brain", "Too much exercise", "Vitamin deficiency"],
        1,
        "It's a missing OFF switch.",
        "The damaged brain loses some of the signals that normally tell muscles to relax. Without that 'off' command, muscles default to ON.",
      ),
      Q(
        "What happens if spasticity is left unstretched for too long?",
        ["The muscle shortens into a contracture, often requiring surgery", "It cures itself", "The muscle gets stronger", "Nothing"],
        0,
        "There's a permanent endpoint.",
        "Untreated spasticity becomes a contracture — a permanently shortened muscle that often requires surgical release. Daily stretching prevents the surgery.",
      ),
      Q(
        "Per the chapter, what is the role of Botox in spasticity?",
        ["Cosmetic only", "Targeted muscle relaxation that creates a 3-4 month window where therapy actually sticks", "Full-body sedation", "Pain relief only"],
        1,
        "It's a window-opener.",
        "Botox in targeted spastic muscles quiets them for 3-4 months. Use that window for aggressive therapy — that's when the wiring gains lock in.",
      ),
      Q(
        "Why should oral antispasticity meds be used 'surgically, not as default'?",
        ["They're expensive", "They cause sleepiness which kills reps and rewiring", "They damage the liver", "They cause spasticity to return harder"],
        1,
        "There's a recovery cost.",
        "Sedating meds cut spasticity but also cut the energy and alertness you need for reps. Less sedating options or targeted Botox usually beat oral meds for survivors actively in rehab.",
      ),
      Q(
        "How often should affected joints be moved through full range?",
        ["Once a week in therapy", "Every hour you're awake (even passively)", "Only when a therapist is present", "Only when not painful"],
        1,
        "Hourly, all day.",
        "Every hour, even passively with the good hand. This prevents joint stiffness, maintains range, and keeps the brain mapping the limb. Hourly beats one big stretching session.",
      ),
    ],
  },
  {
    chapter: 14,
    partNumber: 3,
    title: "Pain as a Teacher",
    subtitle: "Understanding and managing post-stroke pain",
    requiredTier: "warrior",
    estimatedMinutes: 25,
    body: `## Pain is information. Read the message, don't just silence the messenger.

Roughly half of stroke survivors deal with chronic post-stroke pain. It comes in flavors: shoulder pain (mechanical, from spasticity or subluxation), central post-stroke pain (CPSP — burning or icy, from the damaged brain itself), and headaches (especially after hemorrhagic events). They each need a different answer.

### The three categories

1. **Mechanical pain.** Shoulder, hip, foot. Caused by bad mechanics — spastic muscles pulling joints out of alignment, subluxation (shoulder hanging out of socket), poor positioning. Fixed by mechanics: PT, splints, support slings, posture work. Painkillers mask it.

2. **Neuropathic pain (CPSP).** The damaged brain miswires sensation. Touch feels burning. Cold feels electric. There's nothing wrong with the limb — the wiring is reading wrong. Anti-seizure meds (gabapentin, pregabalin) and tricyclic antidepressants help here. Regular painkillers do not.

3. **Headache.** Common after hemorrhagic stroke. Often pressure-related. Track when, what you ate, how you slept. Patterns reveal triggers.

### The Sasquatch pain protocol

- Track pain daily on a 1-10 scale, with location and trigger.
- 1-3: work through it, that's a normal training day.
- 4-6: modify the exercise, don't skip it. Find a version that's a 3.
- 7-10: stop, identify cause, fix it. Pushing through this range injures.

### When to call the doctor

- Sudden new pain unlike anything before.
- Pain plus new weakness.
- Pain plus fever.
- Pain that wakes you from sleep every night.
- Headache that ramps over hours, not minutes.

### What pain is NOT

It is not weakness. It is not a sign you should quit. It is not punishment. It's data — and survivors who learn to read it recover faster than those who either ignore it or surrender to it.`,
    keyTakeaways: [
      "About half of survivors get chronic pain. Three flavors, three answers.",
      "Mechanical pain = mechanics fix. Neuropathic = brain meds. Headache = pattern hunt.",
      "Pain scale rule: 1-3 train, 4-6 modify, 7-10 stop and diagnose.",
      "Track daily with location and trigger.",
      "Sudden new pain plus other symptoms = call the doctor immediately.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What kind of pain is Central Post-Stroke Pain (CPSP)?",
        ["Mechanical, from joint misalignment", "Neuropathic — the damaged brain miswires sensation", "Muscular, from overtraining", "Psychological"],
        1,
        "It comes from the brain, not the limb.",
        "CPSP is the brain misreading sensation — touch may burn, cold may feel electric. There's nothing wrong with the limb itself, so massaging it won't help. It needs neuropathic-pain medication.",
      ),
      Q(
        "What kind of medications help CPSP?",
        ["Standard painkillers like ibuprofen", "Anti-seizure meds (gabapentin, pregabalin) and tricyclic antidepressants", "Opioids only", "No medications help"],
        1,
        "It's wired like nerve pain.",
        "Anti-seizure meds and tricyclics modulate the miswired signal. Regular painkillers don't reach the mechanism.",
      ),
      Q(
        "What's the right response to pain at 4-6 on the 1-10 scale?",
        ["Skip the workout entirely", "Push through anyway", "Modify the exercise to find a version that's a 3", "Take opioids"],
        2,
        "Modify, don't skip and don't push.",
        "4-6 means the exercise needs adjustment, not abandonment. Find a version of the same movement that drops to a 3 — that's where the rewiring happens without injury.",
      ),
      Q(
        "Per the chapter, what is the right way to think of pain?",
        ["A weakness to overcome", "A punishment", "Information to read", "Always a reason to stop"],
        2,
        "It's a signal, not a verdict.",
        "Pain is data. Survivors who track it, decode it, and respond appropriately recover faster than those who either ignore it (injury) or surrender to it (atrophy).",
      ),
      Q(
        "Which symptom combination requires an immediate call to the doctor?",
        ["Mild stiffness in the morning", "Sudden new pain plus new weakness or fever", "Sore muscles after exercise", "A 2/10 pain that comes and goes"],
        1,
        "Pain alone vs. pain plus.",
        "Sudden new pain combined with new weakness, fever, or other neurological symptoms can signal a new event. Don't wait. Call.",
      ),
    ],
  },

  // ─── PART 4: COGNITIVE COMEBACK ────────────────────────────────────────────
  {
    chapter: 15,
    partNumber: 4,
    title: "Memory Reconstruction",
    subtitle: "Techniques to rebuild and strengthen memory",
    requiredTier: "champion",
    estimatedMinutes: 35,
    body: `## Memory is not one thing. It's three.

When survivors say "my memory is shot," they usually mean one of three different systems took the hit. Knowing which one is broken changes everything about how you fix it.

### The three systems

1. **Working memory** — the scratchpad. Holds 5-9 items for ~30 seconds. Stroke often shrinks it to 2-3 items. Fix: chunking, repetition, write everything down.

2. **Short-term to long-term encoding** — moves new info into permanent storage. Fix: spaced repetition, multi-modal encoding (say it AND write it AND picture it), sleep.

3. **Retrieval** — finding what's already stored. Often the info IS there, you just can't grab it. Fix: cue practice, association, patience. Don't panic when you blank.

### Daily protocol

- **Morning:** Read yesterday's journal entry out loud. Reactivates the storage path.
- **Afternoon:** 15 minutes of memory drills — name 10 things in a category, recite a phone number, recall what you ate yesterday.
- **Evening:** Journal three things from today. Specific. Where, who, what.
- **Sleep:** 7-8 hours. Memory consolidation runs almost entirely during sleep.

### The external brain

Use it without shame. A small notebook, your phone calendar, sticky notes on the fridge. Survivors who refuse to use external memory aids out of pride retrain slower than survivors who offload everything.

### The aphasia overlap

If retrieval feels broken specifically for words and names, you may be dealing with anomic aphasia, not a memory problem. Different fix. We cover speech in Chapter 17.`,
    keyTakeaways: [
      "Memory is three systems. Identify which one is hit before treating.",
      "Working memory shrinks to 2-3 items after stroke. Chunk and write down.",
      "Encoding requires multi-modal input AND sleep.",
      "Retrieval blanks pass faster if you don't panic.",
      "Use external memory tools without shame.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "How many items can a healthy working memory hold for ~30 seconds?",
        ["1-2", "5-9", "20", "Unlimited"],
        1,
        "Often called 'the magic number 7 plus or minus 2.'",
        "5-9 items is the normal capacity. After stroke it often shrinks to 2-3, which is why phone numbers and grocery lists become impossible without writing them down.",
      ),
      Q(
        "What activity primarily consolidates memory?",
        ["Eating breakfast", "Sleep", "Exercise", "Watching TV"],
        1,
        "It happens at night.",
        "Memory consolidation — the move from temporary to permanent storage — happens almost entirely during sleep. Bad sleep, no memory.",
      ),
      Q(
        "Per the chapter, what should you do when you blank on a name or word?",
        ["Panic and force it", "Get angry", "Stay calm — retrieval blanks pass faster without panic", "Give up trying to remember"],
        2,
        "Stress narrows the search.",
        "Stress narrows attention and shuts down retrieval circuits. Survivors who stay calm during a blank recover the word faster than those who panic.",
      ),
      Q(
        "What's the right attitude toward external memory aids (notebooks, phone calendar)?",
        ["Avoid them — they make memory worse", "Use them without shame; they free up cognitive bandwidth", "Use them only at first", "They're cheating"],
        1,
        "Pride is the enemy here.",
        "Offloading routine memory tasks to external tools frees cognitive bandwidth for the harder work of rewiring. Pride about not using a notebook costs more than it saves.",
      ),
      Q(
        "If retrieval breaks specifically for words and names, what might it actually be?",
        ["Working memory failure", "Anomic aphasia (a speech problem, not a memory one)", "Normal aging", "Dehydration"],
        1,
        "It might be a speech issue.",
        "Anomic aphasia presents as 'word-finding difficulty' and is often misread as memory loss. The fix is speech therapy, not memory drills. We cover it in Chapter 17.",
      ),
    ],
  },
  {
    chapter: 16,
    partNumber: 4,
    title: "Attention and Focus Training",
    subtitle: "Cutting through the brain fog",
    requiredTier: "champion",
    estimatedMinutes: 30,
    body: `## Brain fog isn't laziness. It's the brain working at 200% to do what used to take 20%.

Post-stroke fatigue and attention problems are not character flaws. The damaged brain is doing the same job with fewer cells, plus burning extra fuel rerouting signals. Of course you're tired. Of course you can't focus. Now let's fix it.

### The four kinds of attention

1. **Sustained attention** — staying on one task for 20+ minutes.
2. **Selective attention** — filtering out a distracting environment.
3. **Divided attention** — doing two things at once (this is gone for a while; let it be).
4. **Alternating attention** — switching between tasks cleanly.

Most survivors lose all four to some degree. Sustained and selective come back fastest with training.

### The training protocol

- **One task at a time.** Period. Multitasking IS the deficit. Don't practice it.
- **20-minute blocks.** Set a timer. Work on one thing. When it dings, stop, walk for 2 minutes, come back.
- **Reduce environmental load.** Turn off the TV, close other tabs, put the phone face down across the room.
- **N-back drills.** There are free apps. 10 minutes a day improves working memory and attention together.
- **Reading out loud.** 15 minutes a day. Forces sustained, selective, AND speech-motor engagement at once.

### The fatigue rule

Brain fatigue is real and physical. When the tank is empty, ten more minutes of effort earn you almost nothing AND damage tomorrow's training. The discipline is knowing when to stop.

### Caffeine and meds

Caffeine helps short-term but builds tolerance fast. Modafinil and stimulants are sometimes prescribed for post-stroke fatigue — talk to a neurologist if fog is dominating your life. There's no medal for refusing the help.`,
    keyTakeaways: [
      "Attention has 4 kinds. Most survivors lose all four to some degree.",
      "Don't practice multitasking — it's the deficit, not the skill.",
      "20-minute focused blocks beat 2-hour grinds.",
      "Reading out loud 15 min/day trains attention, speech, and breath at once.",
      "Brain fatigue is physical. Stop before the tank empties.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is multitasking a bad training target for stroke survivors?",
        ["It is the actual deficit — practicing it reinforces the problem", "It uses too many calories", "Only doctors are allowed to multitask", "It's bad for everyone, not just survivors"],
        0,
        "You'd be practicing the broken thing.",
        "Divided attention is one of the abilities most damaged by stroke. Practicing multitasking trains the broken pattern. One task at a time is the actual treatment.",
      ),
      Q(
        "Which two types of attention come back fastest with training?",
        ["Divided and alternating", "Sustained and selective", "Only divided", "None of them recover"],
        1,
        "The simpler ones.",
        "Sustained (staying on one task) and selective (filtering noise) come back faster than divided or alternating attention.",
      ),
      Q(
        "What's the recommended block length for focused work?",
        ["5 minutes", "20 minutes", "2 hours", "All day with no breaks"],
        1,
        "Just under half an hour.",
        "20-minute focused blocks match the brain's natural attention cycle. Longer blocks degrade quality and burn the tank faster.",
      ),
      Q(
        "Why does reading out loud appear in the training protocol?",
        ["It's relaxing", "It trains sustained attention, selective attention, and speech-motor work simultaneously", "It improves vocabulary", "It substitutes for therapy"],
        1,
        "It's a multi-system trainer.",
        "Reading out loud trains attention, breath support, articulation, and word retrieval all at once. 15 minutes of it is one of the most efficient drills in the curriculum.",
      ),
      Q(
        "What's the discipline when the brain-fatigue tank is empty?",
        ["Push through for 30 more minutes", "Drink coffee and continue", "Stop — extra effort earns nothing and damages tomorrow", "Switch to a harder exercise"],
        2,
        "Knowing when to stop is the skill.",
        "Past the empty point, additional effort produces no rewiring AND raises fatigue debt that costs you tomorrow. Stopping is the discipline.",
      ),
    ],
  },
  {
    chapter: 17,
    partNumber: 4,
    title: "Speech and Language Recovery",
    subtitle: "Finding your voice again",
    requiredTier: "champion",
    estimatedMinutes: 40,
    body: `## Aphasia is not a thinking problem. It's a wiring problem.

If your stroke hit the language areas, your thoughts are intact. The wires from thought to mouth are damaged. Big difference. Anyone who treats you like you've lost your intelligence is wrong, and you're allowed to correct them.

### The flavors of aphasia

- **Broca's (expressive):** you understand fine, but words come out broken. Slow, effortful, telegraphic.
- **Wernicke's (receptive):** you produce words easily, but they don't make sense, and you don't understand others well.
- **Anomic:** you mostly speak normally but can't find specific words.
- **Global:** the worst combination — both expression and comprehension hit hard.
- **Apraxia of speech (AOS):** different mechanism. Your brain knows the word; it just can't program your mouth to say it.

### What works

- **High-intensity, daily speech therapy.** Twice a week is not enough for the first six months. Daily — even 30 minutes from an app — beats 60-minute sessions twice a week.
- **Constraint-induced language therapy (CILT).** Like CIMT for the arm — forces verbal output by removing nonverbal options.
- **Melodic intonation therapy.** Singing the words. Music routes around damaged language centers. If you can sing it, you can eventually say it.
- **Apps:** Constant Therapy, Tactus Therapy, Lingraphica. Real tools, not toys.
- **Reading out loud.** Daily. (See Chapter 16.)
- **Talking to other humans.** Don't hide. Withdrawal is the fastest way to lose what speech you have.

### What doesn't work

- Waiting it out.
- Letting other people finish your sentences.
- Avoiding hard words.
- Being polite about being interrupted.

### The window myth, again

You can recover speech years after stroke. The intensity of therapy matters more than how long ago the stroke was.`,
    keyTakeaways: [
      "Aphasia is a wiring problem, not a thinking problem.",
      "Daily 30-minute work beats twice-a-week 60-minute sessions.",
      "Singing routes around damaged language centers.",
      "Talk to humans daily. Withdrawal kills recovery.",
      "Don't let people finish your sentences.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Which type of aphasia produces fluent but nonsensical speech?",
        ["Broca's (expressive)", "Wernicke's (receptive)", "Anomic", "None — aphasia is always silent"],
        1,
        "Fluent but doesn't make sense.",
        "Wernicke's aphasia produces grammatically smooth speech that doesn't carry meaning, plus poor comprehension. Survivors often don't realize their output isn't making sense — that's part of the deficit.",
      ),
      Q(
        "Why does melodic intonation therapy (singing) help with aphasia?",
        ["It's relaxing", "Music routes around damaged language centers via different neural pathways", "It improves breathing only", "It's a placebo"],
        1,
        "Music uses different brain real-estate.",
        "Singing engages right-hemisphere pathways that often survive a left-hemisphere stroke. If you can sing a phrase, the brain can eventually map it back to spoken speech.",
      ),
      Q(
        "What's wrong with letting people finish your sentences?",
        ["Nothing — it's helpful", "It removes reps your brain needs to recover speech", "It's rude", "It causes apraxia"],
        1,
        "Reps lost.",
        "Every time someone finishes your sentence, you lose the rep your brain needed to rewire that retrieval. Politely tell people to wait. The 5-second pause is medicine.",
      ),
      Q(
        "Per the chapter, what beats twice-a-week 60-minute therapy sessions?",
        ["Once a month with a specialist", "Daily 30-minute focused work, including app-based", "Group therapy only", "Watching TV in a foreign language"],
        1,
        "Frequency wins.",
        "The brain rewires through frequency more than session length. Daily 30-minute focused practice beats two long sessions a week, because daily reinforcement compounds.",
      ),
      Q(
        "What does aphasia NOT mean?",
        ["The thoughts are gone", "The wiring from thought to mouth is damaged", "Intelligence is intact", "The person can still understand they have a problem (varies by type)"],
        0,
        "It's a wiring issue, not a thinking one.",
        "Aphasia damages the connection between thought and language production/reception. Thoughts and intelligence are intact. Anyone who treats an aphasic survivor as cognitively impaired is wrong.",
      ),
    ],
  },
  {
    chapter: 18,
    partNumber: 4,
    title: "Executive Function Restoration",
    subtitle: "Planning, organizing, and decision making",
    requiredTier: "champion",
    estimatedMinutes: 30,
    body: `## Executive function is the CEO of your brain. Get yours back.

Executive function is the bundle of skills that lets you plan, prioritize, sequence steps, hold a goal in mind, and shift strategies when the first one fails. Frontal-lobe strokes hit it hardest, but almost any stroke degrades it some.

### The deficits look like

- Starting tasks but not finishing them.
- Forgetting what you were doing mid-sentence.
- Difficulty deciding between two options.
- Skipping steps in a multi-step task (especially cooking).
- Trouble shifting gears when plans change.
- "I know what I want to do, I just can't get started."

### The training tools

1. **The 3-list system.** Today's three priorities, this week's three projects, this month's three outcomes. No more than three at any tier. Three is the post-stroke ceiling for a while.

2. **Step-by-step lists for everything.** Cooking? Write the recipe broken into single steps. Showering? Write the order of operations. Yes, even if you "know" how. The list offloads the planning so the brain can focus on execution.

3. **Time blocking.** Specific tasks at specific hours. Don't decide on the fly — the deciding IS the deficit.

4. **The 5-minute rule.** When you can't start a task, commit to 5 minutes. Almost always you finish.

5. **One decision at a time.** Stack big decisions, don't run them in parallel. Buy the car this week. Pick the contractor next week. Don't try to do both.

### What kills exec function

- Overwhelm. Too many open loops crash the system.
- Poor sleep. Exec function is the first thing to disappear when sleep-deprived.
- Decision fatigue. Save the big decisions for morning when the tank is full.
- Endless scrolling. Trains the OPPOSITE of executive function.

### When to ask for help

Cognitive rehab specialists exist. Ask your SLP — they often handle exec function too. Don't try to fix this alone if it's blocking work or driving.`,
    keyTakeaways: [
      "Exec function = plan, prioritize, sequence, shift. Almost every stroke hits it.",
      "Three priorities. That's the cap. More breaks the system.",
      "Write step-by-step lists for everything you 'should' know how to do.",
      "Decide once, in advance — don't decide in the moment.",
      "Sleep is the floor. Without sleep, no exec function recovery.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "How many priorities should a recovering survivor hold at any tier of the 3-list system?",
        ["10", "Unlimited", "3", "1"],
        2,
        "It's in the name.",
        "Three is the cap. Three for today, three for the week, three for the month. More than three breaks the system because executive function is reduced post-stroke.",
      ),
      Q(
        "Why are step-by-step lists recommended even for tasks you 'know how' to do?",
        ["Pride preservation", "They offload planning so the damaged brain can focus on execution", "Insurance requires them", "They're optional"],
        1,
        "Offloading.",
        "The planning component is what's damaged. Writing the steps externalizes that load so the brain can spend its limited bandwidth on doing the steps.",
      ),
      Q(
        "What's the 5-minute rule?",
        ["Limit all tasks to 5 minutes", "Commit to 5 minutes when you can't start — you'll usually finish", "Wait 5 minutes before any decision", "Sleep 5 extra minutes"],
        1,
        "It's about activation, not duration.",
        "Lowering the activation cost from 'finish the task' to 'just 5 minutes' beats the start-resistance. Once you're moving, momentum carries you to done.",
      ),
      Q(
        "Which of these KILLS executive function recovery?",
        ["Sleep", "Endless scrolling — trains the opposite skill", "Lists", "Time blocking"],
        1,
        "Scrolling rewires for distraction, not focus.",
        "Endless scrolling reinforces context-switching and reactive attention — the opposite of executive function. The wiring you train is the wiring you get.",
      ),
      Q(
        "When should big decisions be made?",
        ["Late at night", "On the fly, in the moment", "Morning when the tank is full", "Only with caffeine"],
        2,
        "Tank-full timing.",
        "Decision fatigue is real and post-stroke brains burn through bandwidth fast. Morning, before the day's smaller decisions drain the tank, is when big decisions get made well.",
      ),
    ],
  },
  {
    chapter: 19,
    partNumber: 4,
    title: "Emotional Regulation",
    subtitle: "Managing the rollercoaster",
    requiredTier: "champion",
    estimatedMinutes: 25,
    body: `## You're not crazy. The brain is.

Post-stroke emotional changes are real, common, and not a moral failing. Sudden tears for no reason. Inappropriate laughter. Rage that comes out of nowhere. Apathy that flattens you for days. This is **pseudobulbar affect (PBA)** in some cases, post-stroke depression and anxiety in others, and emotional dysregulation in most.

### The four common patterns

1. **PBA:** crying or laughing that doesn't match how you feel. Treatable with medication (Nuedexta).
2. **Depression:** flat mood, no motivation, sleep changes, hopelessness. Hits 1 in 3 survivors. Treatable.
3. **Anxiety:** especially around medical settings, falling, having another stroke. Hits 1 in 4. Treatable.
4. **Anger and irritability:** the brain's filters are damaged. Reactions come out before the brake hits. Manageable.

### The stigma is the killer

Most survivors don't get treated for these because they think it's weakness. Wrong frame. If your blood sugar is off, you take insulin. If your brain chemistry is off after a brain attack, you take what works. The two are the same problem.

### Daily regulation tools

- **The 90-second rule.** Almost any emotional spike — anger, sadness, panic — physiologically peaks and clears in 90 seconds IF you don't feed it with thought. Just feel it. Don't narrate it. It passes.
- **Movement.** A 10-minute walk shifts mood faster than any pep talk.
- **Naming.** Out loud: "I'm angry. I'm scared. I'm sad." Naming activates the prefrontal cortex and tones down the amygdala.
- **Sleep, food, water.** Almost every emotional crisis is amplified by being tired, hungry, or dehydrated. Check those three before you trust the feeling.

### When to call a professional

- Suicidal thoughts (call 988 immediately).
- Mood that's blocking therapy attendance.
- Rage that's damaging relationships.
- Anxiety preventing leaving the house.

There is zero shame in psych meds for stroke survivors. They make recovery faster, not slower.`,
    keyTakeaways: [
      "PBA, depression, anxiety, irritability — all common and all treatable.",
      "If you'd take insulin for diabetes, take what works for brain chemistry.",
      "The 90-second rule: feel it without narrating, and most spikes pass.",
      "Always check sleep, food, water before trusting a feeling.",
      "988 for suicidal thoughts. Immediately. No exceptions.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What is PBA (pseudobulbar affect)?",
        ["Always permanent", "Crying or laughing that doesn't match how you actually feel — treatable", "A type of seizure", "A speech disorder"],
        1,
        "Mismatched emotional expression.",
        "PBA is uncontrolled emotional outbursts (often crying or laughter) that don't reflect actual mood. It's neurological and medication (Nuedexta) treats it effectively.",
      ),
      Q(
        "Per the chapter, how long does an emotional spike physiologically last if not fed by thought?",
        ["10 seconds", "About 90 seconds", "1 hour", "All day"],
        1,
        "Just over a minute.",
        "Pure physiological emotion peaks and clears in about 90 seconds. What makes it last longer is the story we narrate over it. Feeling without narrating lets it pass.",
      ),
      Q(
        "What three things should you check before trusting an emotional crisis?",
        ["Weather, news, social media", "Sleep, food, water", "Heart rate, blood pressure, temperature", "Calendar, email, voicemail"],
        1,
        "Basic biology first.",
        "Most 'emergencies' are amplified by being tired, hungry, or dehydrated. Check those three. Often the crisis evaporates after a snack and a glass of water.",
      ),
      Q(
        "What's the framing the chapter offers for psych meds after stroke?",
        ["Weakness", "If you'd take insulin for diabetes, take what works for brain chemistry — same problem", "Last resort only", "Always avoid them"],
        1,
        "Same logic as any other organ.",
        "The brain is an organ. Stroke damages its chemistry as readily as it damages its wiring. Treating the chemistry is no different than treating any other organ that's been hurt.",
      ),
      Q(
        "What number should be called for suicidal thoughts in the US?",
        ["911", "988", "411", "211"],
        1,
        "Suicide and Crisis Lifeline.",
        "988 is the Suicide and Crisis Lifeline in the US. Call or text. Don't wait, don't sleep on it, don't try to reason yourself out of it. Call.",
      ),
    ],
  },

  // ─── PART 5: LIFE INTEGRATION ──────────────────────────────────────────────
  {
    chapter: 20,
    partNumber: 5,
    title: "Returning to Work",
    subtitle: "Navigating career after stroke",
    requiredTier: "champion",
    estimatedMinutes: 35,
    body: `## Work is recovery medicine. Get back to it on YOUR terms.

For most survivors, returning to some form of work — paid, volunteer, or entrepreneurial — accelerates recovery. The structure, the social engagement, the cognitive demand all push the brain to keep rewiring. The key word is "some form." The job you had before may not be the job that's right for now.

### Three return paths

1. **Same job, same employer, with accommodations.** ADA-protected if you have a stroke. Reasonable accommodations include flexible hours, modified duties, ergonomic equipment, reduced load. Your employer is required to engage in good-faith dialogue.

2. **Same job, different employer.** Sometimes the old environment is too tied to old expectations. Fresh start, fresh accommodations.

3. **Different job entirely.** Many survivors discover the stroke clarified what they actually want to do. Coaching, writing, consulting, advocacy — these are legitimate next chapters, not consolation prizes.

### When to return

The honest answer: when you can sustain four hours of focused effort without crashing for two days afterward. Not when you "feel" ready — that lies. Test it in low-stakes environments first.

### The disability question

If you can't return, disability (SSDI in the US) exists for a reason. Applying is brutal — most claims are denied first round. Get a disability attorney; they only get paid if you win. There's no shame in the safety net.

### The hidden costs of returning too fast

- Setback in physical recovery.
- Burnout that takes 6 months to undo.
- Damaged reputation if you can't deliver what you promise.
- Loss of the gains you've already made.

### The gain when you do it right

- Identity restored.
- Income restored.
- Cognitive load that drives further recovery.
- Self-respect that nothing else replaces.`,
    keyTakeaways: [
      "ADA protects you. Reasonable accommodations are your right.",
      "Return when you can do 4 focused hours without a 2-day crash.",
      "Same job, different job, or new path are all legitimate.",
      "SSDI is a safety net. No shame. Get an attorney — they're free if you lose.",
      "Returning too early burns the gains you've made.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What's the readiness test for returning to work?",
        ["Feeling ready emotionally", "Sustaining 4 focused hours without a 2-day crash afterward", "Doctor's note alone", "30 days off work"],
        1,
        "It's behavioral, not feeling-based.",
        "Feelings lie about readiness. The objective test is whether you can sustain four hours of focused effort and recover normally — not be wiped out for two days afterward.",
      ),
      Q(
        "What law typically protects stroke survivors returning to work in the US?",
        ["FMLA only", "ADA (Americans with Disabilities Act)", "OSHA", "There is no protection"],
        1,
        "Disability rights law.",
        "Stroke is covered under the ADA, which requires employers to engage in good-faith dialogue about reasonable accommodations.",
      ),
      Q(
        "Per the chapter, how do disability attorneys typically get paid?",
        ["Up-front retainer", "They only get paid if you win the claim", "Hourly billing", "Government-funded"],
        1,
        "Contingency.",
        "Disability attorneys work on contingency for SSDI cases — they get paid only if they win. Survivors who try to go it alone are often denied unnecessarily.",
      ),
      Q(
        "What's the risk of returning to work too early?",
        ["No risk — just go for it", "Setback in recovery, burnout, lost gains, damaged reputation", "Higher pay", "Faster recovery"],
        1,
        "Multiple downsides stack.",
        "Premature return often produces a worse outcome than waiting another 90 days: physical setback, burnout that takes 6 months to undo, and reputational damage if you can't deliver.",
      ),
      Q(
        "Per the chapter, is changing careers after stroke a 'consolation prize'?",
        ["Yes, always", "No — many survivors discover the stroke clarified what they actually want to do", "Only for survivors over 50", "Only if forced by disability"],
        1,
        "Career change can be a chosen pivot.",
        "Many survivors discover the stroke gave them clarity about what they actually want to do. Coaching, writing, consulting, advocacy — these are legitimate next chapters, not consolation prizes.",
      ),
    ],
  },
  {
    chapter: 21,
    partNumber: 5,
    title: "Relationship Reconstruction",
    subtitle: "Rebuilding connections with loved ones",
    requiredTier: "champion",
    estimatedMinutes: 30,
    body: `## The stroke happened to your relationships too.

Your spouse, kids, parents, friends — they all got hit. They watched you nearly die. They've been carrying load you don't see. Some will rise. Some won't. Some are doing their best AND it's not enough. All of that is true at the same time, and how you handle it determines whether your relationships survive the recovery years.

### What changed

- Your role in the household.
- Your contribution to income.
- Your physical capacity for affection.
- Your mood baseline.
- Your tolerance for noise, kids, social events.
- How others see you (whether you like it or not).

### The caregiver burnout window

Caregivers hit a wall around month 6-12. Watch for it: short tempers, withdrawal, weight changes, them crying in the car. They need their own therapist, their own support group, their own time off. **You giving them permission to take care of themselves is the most important thing you can do for the relationship.**

### Hard conversations to have

- "I know I'm not the same. Here's what I'm working on. Here's what I need from you."
- "I'm sorry for the days I take this out on you."
- "Tell me what you need that you haven't been asking for."
- "What do you miss about how things were?"

### What kills relationships in recovery

- Pretending nothing has changed.
- Using the stroke as a hall pass for bad behavior.
- Not asking how the caregiver is doing.
- Refusing intimacy because it's awkward now.
- Hiding the dark days.

### What rebuilds them

- Showing the work — let them see you trying.
- Saying thank you, specifically, daily.
- Couples therapy, even if only you go.
- Date nights, modified for your reality.
- Letting them see the wins.

### The friends test

Some friends will disappear. Some will surprise you. The ones who show up at month 9, when the casseroles stopped at month 2, are your real ones. Build the rest of your life around them.`,
    keyTakeaways: [
      "Your stroke happened to your relationships too.",
      "Caregiver burnout window: months 6-12. Watch for it.",
      "Permission for the caregiver to take care of themselves is the highest-leverage gift you can give.",
      "Don't use the stroke as a hall pass for bad behavior.",
      "Friends who show up at month 9 are the real ones. Invest there.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "When does caregiver burnout typically peak?",
        ["First week", "Months 6-12", "After 5 years", "Never — caregivers don't burn out"],
        1,
        "Mid-year, not early.",
        "Month 6-12 is when adrenaline runs out, casseroles stopped, friends moved on, and the long slog becomes visible. Watch for the signs and get help in early.",
      ),
      Q(
        "What's the highest-leverage gift you can give your caregiver?",
        ["A weekend trip", "Permission and encouragement to take care of themselves", "Buying them a gift", "Hiding your bad days"],
        1,
        "Permission.",
        "Caregivers often won't take care of themselves until the survivor explicitly tells them to. Permission to rest, exercise, see friends, and have their own therapist is the most valuable gift.",
      ),
      Q(
        "What's wrong with using the stroke as a 'hall pass' for bad behavior?",
        ["Nothing — it's earned", "It damages every relationship and signs a long-term lease in victim country", "It's only allowed for hemorrhagic strokes", "The DMV requires a real hall pass"],
        1,
        "Same thread as Chapter 5.",
        "Just like weaponizing the stroke against people who love you, using it as a permanent excuse for bad behavior damages relationships and entrenches victim identity.",
      ),
      Q(
        "Per the chapter, who are your 'real' friends?",
        ["The ones who sent the most flowers in week 1", "The ones who show up at month 9, when the casseroles stopped at month 2", "The most successful ones", "The ones who never call"],
        1,
        "Late-stage attendance, not early-stage gestures.",
        "Anyone can show up in week 1 when there's drama. The friends still calling at month 9, when the situation is just slow and lonely, are the real ones.",
      ),
      Q(
        "What's a recommended first hard conversation to have?",
        ["'I'm divorcing you'", "'I know I'm not the same. Here's what I'm working on. Here's what I need from you.'", "'You owe me'", "Avoid hard conversations entirely"],
        1,
        "Acknowledge, work, ask.",
        "This formula — acknowledge the change, name the work, ask for what you need — opens the door without leading with blame. It restores agency on both sides.",
      ),
    ],
  },
  {
    chapter: 22,
    partNumber: 5,
    title: "Adaptive Independence",
    subtitle: "Tools and techniques for daily living",
    requiredTier: "champion",
    estimatedMinutes: 35,
    body: `## Independence is engineered, not waited for.

Survivors get hung up on doing things "the normal way" and then either struggle for years or give up. The smart move: engineer your environment so the harder versions of life become easier, then keep working on the underlying skills in parallel.

### The categories

**Dressing:** elastic waistbands, button hooks, slip-on shoes, dressing sticks, sock aids. None of this is "giving up." It's getting dressed in 5 minutes instead of 45.

**Bathing:** grab bars, shower bench, handheld shower head, no-rinse soap, long-handled sponge. Falls in showers end recoveries.

**Eating:** weighted utensils, plate guards, non-slip mats, two-handled cups. If your affected hand can't help, the equipment can.

**Cooking:** rocker knives, jar openers, one-handed cutting boards. Sharp knives + one working hand + tile floor = ER.

**Driving:** spinner knobs, left-foot accelerators, hand controls. A driving rehab specialist can evaluate and certify you. Don't drive without that eval.

**Phone and computer:** speech-to-text, one-handed keyboards, big-button phones, voice control on everything.

**Home:** stair lifts, bedroom on the main floor, ramps. Modify before the next fall, not after.

### The mindset

Adaptive equipment is leverage. Refusing it doesn't make you stronger; it just makes the same task take ten times the energy. Use the leverage. Save the energy for the rep.

### Ask the OT

Occupational therapists exist specifically for this. Ask for a home eval. Most insurance covers at least one. They will identify gear and modifications you didn't know existed.`,
    keyTakeaways: [
      "Engineer the environment. Don't wait for the body to do everything.",
      "Adaptive equipment is leverage, not surrender.",
      "Bathroom and kitchen are the two highest-injury rooms. Prioritize them.",
      "Driving requires a certified rehab specialist evaluation. Don't skip it.",
      "Ask the OT for a home eval. Insurance usually covers it.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What does the chapter call adaptive equipment?",
        ["Surrender", "Cheating", "Leverage", "A phase to outgrow"],
        2,
        "It saves energy for the work that matters.",
        "Adaptive equipment buys time and energy. Refusing it doesn't make you stronger — it just makes simple tasks consume disproportionate effort that should go into rehab reps.",
      ),
      Q(
        "What two rooms are highlighted as highest-injury?",
        ["Bedroom and office", "Bathroom and kitchen", "Living room and garage", "Hallway and basement"],
        1,
        "Wet floors and sharp objects.",
        "Bathrooms (wet floors, transfers) and kitchens (sharp tools, hot surfaces, one-handed work) are the highest-injury rooms. Engineer them first.",
      ),
      Q(
        "Who should evaluate driving readiness?",
        ["Yourself", "A friend", "A certified driving rehabilitation specialist", "The DMV alone"],
        2,
        "There's a specific certification.",
        "Driving rehab specialists are trained to evaluate post-stroke driving readiness, recommend adaptive controls, and certify you safe (or not). Don't get behind the wheel without their eval.",
      ),
      Q(
        "What is a 'sock aid'?",
        ["A type of medication", "A device that helps you put socks on with one hand or limited bending", "A nurse who specializes in feet", "A YouTube channel"],
        1,
        "It's a tool for dressing.",
        "A sock aid is a plastic shell you slip a sock onto, then use straps to pull the sock onto your foot without bending or using both hands. Saves enormous energy daily.",
      ),
      Q(
        "Who specializes in identifying adaptive equipment for daily living?",
        ["Neurologist", "Physical therapist", "Occupational therapist", "Speech therapist"],
        2,
        "OT is the specialty.",
        "Occupational therapists specialize in activities of daily living (ADLs) and adaptive equipment. Ask for a home eval — most insurance covers at least one.",
      ),
    ],
  },
  {
    chapter: 23,
    partNumber: 5,
    title: "Financial Navigation",
    subtitle: "Managing money and disability resources",
    requiredTier: "champion",
    estimatedMinutes: 25,
    body: `## Stroke is expensive. Get organized fast.

The financial side of stroke can sink a household faster than the medical side. Hospital bills, lost income, modifications, ongoing therapy, medications. The survivors who navigate this well do three things in the first 90 days: organize, apply for everything, and get help.

### The first-90-days checklist

1. **One folder for everything.** Bills, EOBs, denials, receipts. Physical or digital — pick one.
2. **Apply for SSDI.** Even if you think you'll be back at work — get the application started, you can withdraw it later. The clock matters.
3. **Apply for state disability** (if applicable in your state).
4. **FMLA** to protect your job.
5. **Long-term disability insurance** through your employer if you have it.
6. **Medicaid** if income drops enough to qualify.
7. **Talk to a hospital financial counselor.** Most hospitals have charity care programs. Most patients never ask.
8. **Negotiate every bill.** Hospital bills are negotiable. Often 30-50% off if you ask and pay quickly.
9. **HSA/FSA.** Use it for everything eligible — therapy, equipment, mileage to appointments.

### The big mistakes

- Not applying for disability because "I'm going back to work soon." Apply anyway. The clock is brutal.
- Paying full hospital bills without negotiating.
- Buying expensive equipment before checking if insurance or Medicare will cover it.
- Letting bills go to collections — once they hit credit, fighting them is harder.
- Hiding the financial situation from your spouse.

### Get a professional

A nonprofit financial counselor (look for NFCC.org) can help organize the mess. So can a financial planner who specializes in disability. The fee saves multiples of what it costs.

### The long game

Many survivors qualify for ABLE accounts (tax-advantaged savings without losing benefits), Medicare after 24 months on SSDI, and state-specific programs. These compound. Set them up early.`,
    keyTakeaways: [
      "Apply for SSDI in the first 90 days. The clock matters even if you go back to work.",
      "Negotiate every hospital bill. Most cave 30-50%.",
      "Hospital charity care programs exist. Ask the financial counselor.",
      "Don't let bills go to collections. Negotiate before they do.",
      "ABLE accounts and other long-game programs compound. Set up early.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "When should you apply for SSDI?",
        ["Only if you're sure you can't work", "In the first 90 days, even if you think you'll go back to work", "After 1 year of being unable to work", "Never if you have insurance"],
        1,
        "Start the clock early.",
        "The application takes months and most claims are denied the first round. Apply early — you can always withdraw or stop the claim if you return to work.",
      ),
      Q(
        "Are hospital bills negotiable?",
        ["No, they're fixed", "Yes — often 30-50% off if you ask and pay quickly", "Only if you have insurance", "Only after collections"],
        1,
        "Negotiation is normal in healthcare.",
        "Hospital bills are highly negotiable, especially if you can pay quickly. Most hospitals also have charity care programs that wipe out bills entirely for households below certain income thresholds.",
      ),
      Q(
        "What's the risk of letting bills go to collections?",
        ["No risk", "Once they hit credit, fighting them is harder", "Collections are easier to negotiate", "It increases the chance of charity care"],
        1,
        "Damage compounds.",
        "Once bills hit collections and report to credit, undoing the damage takes years even after they're paid. Negotiate before that line is crossed.",
      ),
      Q(
        "What is an ABLE account?",
        ["A type of disability insurance", "Tax-advantaged savings for people with disabilities, without losing benefits", "A federal grant", "A bank account for medical professionals"],
        1,
        "Tax-advantaged disability savings.",
        "ABLE accounts let people with disabilities save money in a tax-advantaged account without those savings disqualifying them from means-tested benefits like SSI or Medicaid.",
      ),
      Q(
        "After how many months on SSDI does a survivor typically qualify for Medicare?",
        ["6 months", "12 months", "24 months", "Never — SSDI doesn't lead to Medicare"],
        2,
        "Two-year waiting period.",
        "After 24 months on SSDI, you become eligible for Medicare regardless of age. Knowing this is a gateway helps with planning the medical-financial sequence.",
      ),
    ],
  },
  {
    chapter: 24,
    partNumber: 5,
    title: "Driving Again",
    subtitle: "Safely returning behind the wheel",
    requiredTier: "champion",
    estimatedMinutes: 20,
    body: `## Driving is identity. Get it back the right way.

For most adults, driving represents independence more than any other skill. Losing it after stroke is brutal — not just functionally but emotionally. Getting it back is possible for many survivors, but the path matters: rushing it gets people killed.

### The hard requirements

Before any test, you need:

- **Vision intact.** Field cuts (hemianopia) can be partially compensated with prism lenses or scanning training. Get a neuro-ophthalmologist eval.
- **Reaction time sufficient.** Often slower post-stroke. Adaptive controls can help.
- **Cognition sufficient.** Especially divided attention — driving is intense multitasking.
- **Physical capacity.** Pedals, wheel, mirror checks, head turns.
- **Emotional readiness.** Panic in traffic ends in collisions.

### The right path

1. **Get cleared by your neurologist** for cognitive and physical safety.
2. **Driving rehab evaluation.** A certified specialist (CDRS) does a clinical assessment and an in-car eval. Yes, it costs money. Yes, it's worth it.
3. **Adaptive equipment** if needed: hand controls, left-foot accelerator, spinner knob, mirror systems.
4. **Re-licensing** through the state DMV. Many states require a fresh road test after stroke.
5. **Start small.** Empty parking lot. Quiet streets. Daytime only. Familiar routes. Build up.

### The honest stuff

Some survivors will not drive again. That's a hard truth. But Uber, Lyft, paratransit, and family rides are not lesser lives — they're tools. Don't let pride about driving wreck the rest of your recovery.

### Insurance after stroke

Notify your auto insurer. Some will require proof of medical clearance to renew. Others won't change anything. Don't hide the stroke — if you have a wreck and they discover it later, claims get denied.`,
    keyTakeaways: [
      "Get a CDRS (Certified Driving Rehab Specialist) eval before any road test.",
      "Vision, reaction time, cognition, physical, and emotional — all five must clear.",
      "Many states require a fresh road test post-stroke. Don't skip the legal step.",
      "Notify your insurer. Hiding it voids claims later.",
      "Not driving is not a failure. Pride about driving has wrecked many lives.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Who should evaluate driving readiness post-stroke?",
        ["A friend or family member", "A Certified Driving Rehab Specialist (CDRS)", "Yourself, after a few short drives", "The auto insurance company"],
        1,
        "Specialty certification matters.",
        "CDRSs are specifically trained to evaluate post-stroke drivers — clinical and in-car. They identify deficits and recommend adaptive equipment that a regular driving instructor would miss.",
      ),
      Q(
        "What is hemianopia?",
        ["A type of stroke", "A visual field cut where part of the field of view is missing", "Difficulty hearing", "A driving test"],
        1,
        "Vision deficit.",
        "Hemianopia is loss of half the visual field. It can be partially compensated with scanning training and prism lenses, but until it's addressed, it's a serious driving hazard.",
      ),
      Q(
        "Should you tell your auto insurance about your stroke?",
        ["No — it raises rates", "Yes — hiding it can void future claims", "Only if you have an accident", "Only if asked"],
        1,
        "Disclosure protects you.",
        "Hiding a stroke from your insurer is fraud and lets them deny claims later. Disclose, get any required medical clearance documented, and drive legally insured.",
      ),
      Q(
        "When restarting driving, where should you begin?",
        ["Highway during rush hour", "Empty parking lot, then quiet streets, daytime only, familiar routes", "Long road trip", "Anywhere — driving is like riding a bike"],
        1,
        "Easy environments first.",
        "Start with the easiest possible environment and build up. Empty lot → quiet streets → familiar routes → short errands → busier roads. Skipping levels causes accidents.",
      ),
      Q(
        "What's the chapter's framing on rideshare/paratransit if you can't drive?",
        ["A failure", "A lesser life", "Tools, not lesser lives — pride about driving has wrecked many recoveries", "Only for old people"],
        2,
        "It's tooling, not status.",
        "Driving is a tool, not a virtue. Uber, Lyft, paratransit, and family rides accomplish the same goal — getting where you need to go safely. Pride about being the one behind the wheel has ended too many recoveries.",
      ),
    ],
  },

  // ─── PART 6: PREVENTION & OPTIMIZATION ─────────────────────────────────────
  {
    chapter: 25,
    partNumber: 6,
    title: "Understanding Your Risk",
    subtitle: "Stroke prevention fundamentals",
    requiredTier: "champion",
    estimatedMinutes: 30,
    body: `## You had one. Don't have another.

Roughly 1 in 4 stroke survivors will have a second stroke within 5 years. The recurrence is often worse than the first. That's the bad news. The good news: most second strokes are preventable with discipline around a small number of factors.

### The big modifiable risks

1. **Blood pressure.** The single biggest factor. Target under 130/80 for most survivors. Daily monitoring, daily compliance with meds, no exceptions.
2. **Atrial fibrillation (AFib).** If you have it, anticoagulation is non-negotiable. AFib-related strokes are the worst kind.
3. **Cholesterol.** LDL target under 70 for most stroke survivors. Statins for almost everyone.
4. **Diabetes / blood sugar.** A1C under 7. Tight glucose control matters more after stroke than before.
5. **Smoking.** Quit. Period. This is the highest-leverage single change.
6. **Sleep apnea.** Massively underdiagnosed in stroke survivors. Get a sleep study. CPAP if needed.
7. **Alcohol.** Two drinks a day max. Honestly, less.
8. **Weight.** BMI matters less than visceral fat. Waist size matters more than scale weight.
9. **Activity.** 150 minutes a week of moderate cardio cuts second-stroke risk significantly.

### What you cannot change

Age, family history, prior stroke. These exist. They don't get a vote in your daily choices. They just shift the threshold for everything above.

### The check-up cadence

- Neurologist: every 3-6 months for the first year, then annually.
- Primary care: every 3 months for BP, sugar, cholesterol panel.
- Cardiologist: at least once a year, more if you have AFib.
- Sleep study: once. If positive, stay on CPAP.

### The mindset

Prevention is the most boring, least Instagrammable part of recovery. It's also what keeps you out of the hospital. Make it automatic — alarms for meds, scheduled BP checks, weekly weigh-in — so it doesn't depend on willpower.`,
    keyTakeaways: [
      "1 in 4 survivors get a second stroke within 5 years. Most are preventable.",
      "BP under 130/80, LDL under 70, A1C under 7. Memorize these.",
      "AFib means anticoagulation, no exceptions.",
      "Sleep apnea is hugely underdiagnosed in survivors. Get tested.",
      "Make prevention automatic. Don't leave it to willpower.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What single factor is the biggest modifiable risk for a second stroke?",
        ["Cholesterol", "Blood pressure", "Body weight", "Caffeine intake"],
        1,
        "It's the one you measure with a cuff.",
        "Blood pressure is the single highest-leverage modifiable risk factor. Sustained BP under 130/80 dramatically reduces second-stroke risk.",
      ),
      Q(
        "What's the typical LDL cholesterol target for stroke survivors?",
        ["Under 200", "Under 130", "Under 70", "There is no target"],
        2,
        "It's lower than the general population.",
        "Stroke survivors are typically targeted at LDL under 70, which usually requires statins. Aggressive lipid management cuts recurrence significantly.",
      ),
      Q(
        "Why does atrial fibrillation (AFib) require anticoagulation?",
        ["AFib doesn't really need treatment", "AFib creates clots in the heart that travel to the brain — and AFib-related strokes are the worst kind", "Anticoagulation cures AFib", "It's purely preventive"],
        1,
        "Clots love to form in fibrillating atria.",
        "The disorganized contractions in AFib create stagnant blood pools where clots form. Those clots travel to the brain and cause large, devastating strokes. Anticoagulation prevents the clot from forming.",
      ),
      Q(
        "What sleep condition is massively underdiagnosed in stroke survivors?",
        ["Insomnia", "Sleep apnea", "Restless legs", "Narcolepsy"],
        1,
        "Snoring + stroke = test.",
        "Sleep apnea is wildly underdiagnosed in stroke survivors and significantly raises recurrence risk. A one-time sleep study costs little and can change the trajectory.",
      ),
      Q(
        "Per the chapter, why should prevention be 'automatic'?",
        ["It's required by law", "Willpower is finite — alarms, schedules, and routines remove the daily decision", "Doctors prefer it", "Insurance discounts"],
        1,
        "Don't leave it to motivation.",
        "Prevention done daily for 30 years has to be automatic. Med alarms, scheduled BP checks, weekly weigh-ins — systems beat willpower over the long horizon.",
      ),
    ],
  },
  {
    chapter: 26,
    partNumber: 6,
    title: "Nutrition for Brain Health",
    subtitle: "Eating for recovery and prevention",
    requiredTier: "champion",
    estimatedMinutes: 35,
    body: `## You can out-train a bad diet for about 6 weeks. Then it catches you.

The brain is a metabolic organ. Recovery happens or doesn't depending on what you feed it. The good news is the right diet for stroke recovery is the same one that's right for prevention, heart health, and most other chronic diseases. Learn it once.

### The core eating pattern

Mediterranean. It's been studied to death. It works.

- **Lots of:** vegetables, fruits, whole grains, beans, nuts, olive oil, fish (especially fatty fish 2-3x/week).
- **Some:** poultry, eggs, fermented dairy.
- **Little:** red meat, processed meat, sugar, ultra-processed food.
- **Almost none:** sugary drinks, fried food, trans fats.

### The three numbers

- **Sodium:** under 2,300 mg/day. Most people eat 2-3x that. Read labels.
- **Sugar:** under 25g added sugar/day for women, 36g for men.
- **Fiber:** 25-35g/day. Most people get half that.

### Hydration

Half your body weight in pounds = ounces of water per day. Dehydration thickens blood and raises stroke risk. Plain water. Coffee is fine in moderation. Energy drinks are poison.

### Brain-specific add-ons

- **Omega-3s:** fatty fish 2x/week or 1g EPA/DHA supplement.
- **B vitamins:** especially B12 if you take metformin or PPIs.
- **Vitamin D:** test it. Most adults are low.
- **Magnesium:** linked to lower BP and better sleep.
- **Creatine:** emerging evidence for cognitive benefit, especially in stroke recovery.

### What about supplements

Most are overhyped. The basics — omega-3, D, magnesium — are worth it. Save your money on the rest. If you're spending more than $50/month on supplements, you're being marketed to.

### Dysphagia rule

If swallowing is impaired, an SLP must clear your diet texture. Aspiration pneumonia kills more stroke survivors than the stroke does. Don't sneak the wrong texture.`,
    keyTakeaways: [
      "Mediterranean diet beats every other intervention. Learn it once.",
      "Three numbers: sodium under 2300, added sugar under 25-36g, fiber 25-35g.",
      "Hydration: half your weight in pounds = ounces of water.",
      "Omega-3, D, magnesium are worth it. Most other supplements are marketing.",
      "If you have dysphagia, the SLP-cleared texture is the law.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Which dietary pattern is most evidence-based for stroke recovery and prevention?",
        ["Keto", "Mediterranean", "Paleo", "Carnivore"],
        1,
        "Olive oil, fish, vegetables.",
        "The Mediterranean diet has decades of evidence for stroke prevention and recovery, plus heart health and most chronic diseases. It's the highest-evidence pattern by a wide margin.",
      ),
      Q(
        "What's the daily sodium target for most stroke survivors?",
        ["No limit", "Under 2,300 mg/day", "Under 5,000 mg/day", "Under 500 mg/day"],
        1,
        "About a teaspoon.",
        "Under 2,300 mg sodium per day. Most Americans eat 2-3x that, mostly from processed foods rather than the salt shaker. Read labels.",
      ),
      Q(
        "Why does dehydration matter for stroke risk?",
        ["It causes headaches", "It thickens blood, raising clot risk", "It depletes vitamins", "It's only a comfort issue"],
        1,
        "Thicker blood = more clots.",
        "Dehydration thickens blood and raises clot formation risk. Adequate hydration (about half your body weight in pounds = ounces of water) is a free, easy stroke-risk reduction tool.",
      ),
      Q(
        "Which supplement category is generally NOT worth the money for stroke survivors?",
        ["Omega-3 fish oil", "Vitamin D if you're low", "Magnesium", "Most expensive 'brain boost' multivitamin stacks"],
        3,
        "Most are marketing.",
        "Omega-3, D, magnesium have evidence. Most $50+/month 'brain boost' stacks are marketing with little outcome data. Save your money.",
      ),
      Q(
        "What kills more stroke survivors than the stroke itself if dysphagia is mismanaged?",
        ["Heart attack", "Aspiration pneumonia", "Diabetes", "Falls"],
        1,
        "Wrong texture, lung infection.",
        "Aspiration pneumonia from swallowing wrong-texture food into the lungs is a leading cause of death in stroke survivors with dysphagia. The SLP-cleared diet texture is non-negotiable.",
      ),
    ],
  },
  {
    chapter: 27,
    partNumber: 6,
    title: "Medication Management",
    subtitle: "Your pharmaceutical toolkit",
    requiredTier: "champion",
    estimatedMinutes: 25,
    body: `## Your meds are not optional. Treat them like the job they are.

Most stroke survivors leave the hospital on 5-12 daily medications. Skipping them isn't toughness — it's the fastest way back to the ER. Building a system for medication management is worth more than any single therapy session.

### The typical post-stroke stack

- **Antiplatelet** (aspirin, clopidogrel) — prevents clots.
- **Anticoagulant** (warfarin, apixaban, rivaroxaban) — for AFib survivors.
- **Statin** — lowers LDL cholesterol.
- **BP meds** — usually 1-3 different mechanisms.
- **Diabetes meds** if applicable.
- **Antidepressant or anxiety med** if needed.
- **Spasticity med** (baclofen, tizanidine) if needed.
- **Pain med** if needed.
- **Vitamin D, B12, others** as labs indicate.

### The system

1. **Pill organizer.** Weekly, with AM/PM compartments. Fill on Sunday.
2. **Phone alarms.** Every dose. Don't trust your memory.
3. **One pharmacy.** Lets the pharmacist catch interactions across providers.
4. **A current med list** in your wallet AND on your phone, with doses and times.
5. **A backup of every med** for travel or emergencies.

### Side effects

Every med has them. Track new symptoms in a notes app. When you see your doctor, you'll have data instead of vague impressions. Patterns emerge fast when you write things down.

### When to call

- New side effect that interferes with daily life.
- Bleeding from anywhere if you're on anticoagulants.
- Dizziness when standing (BP meds may need adjustment).
- Mood changes within 2-4 weeks of starting a new med.

### What NOT to do

- Stop a med because you "feel fine." That feeling is the med working.
- Adjust your own doses. Call the doctor.
- Mix supplements without telling the pharmacist.
- Run out. Refill when you have 7 days left.`,
    keyTakeaways: [
      "5-12 meds is normal. Build a system, not willpower.",
      "Pill organizer + phone alarms + one pharmacy = the stack.",
      "Carry a current med list, paper and digital.",
      "'I feel fine' is the med working — don't stop on your own.",
      "Refill when you have 7 days left, not 0.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Why is using ONE pharmacy recommended?",
        ["Convenience only", "The pharmacist can catch interactions across providers", "Cheaper", "Required by Medicare"],
        1,
        "Catching interactions.",
        "When all your meds run through one pharmacy, the pharmacist can spot dangerous interactions that no single prescriber would catch. This is a free safety net you should not skip.",
      ),
      Q(
        "What's wrong with stopping a med because you 'feel fine'?",
        ["Nothing — that's the right move", "That feeling is the med working — stopping ends the protection", "It saves money", "Doctors prefer when patients self-manage"],
        1,
        "It's a logical trap.",
        "BP meds, statins, antiplatelets — most stroke meds work invisibly. Feeling fine IS the medication doing its job. Stopping ends the protection and brings the risk back full force.",
      ),
      Q(
        "When should you refill prescriptions?",
        ["When the bottle is empty", "When you have 7 days left", "Every time you remember", "Every 6 months regardless"],
        1,
        "Don't run out.",
        "Refilling at 7 days left builds in a buffer for delays, lost mail, insurance disputes, and pharmacy stock-outs. Running out — even for a day on some meds — increases stroke risk.",
      ),
      Q(
        "If you're on anticoagulants and you notice bleeding, what should you do?",
        ["Ignore it", "Call your doctor", "Stop the medication immediately", "Take more"],
        1,
        "Call before changing anything.",
        "Anticoagulant bleeding ranges from minor to serious. Don't stop the med on your own (that risks a stroke); don't ignore it (could be serious). Call the doctor immediately and let them direct.",
      ),
      Q(
        "What should be in your wallet alongside the digital list?",
        ["Cash for copays only", "A current paper medication list with doses and times", "A photo of your hospital", "Nothing"],
        1,
        "Backup access.",
        "If you're unconscious or your phone is dead in an ER, the paper list in your wallet tells responders what you take. This has saved lives.",
      ),
    ],
  },
  {
    chapter: 28,
    partNumber: 6,
    title: "Sleep Optimization",
    subtitle: "The healing power of rest",
    requiredTier: "champion",
    estimatedMinutes: 25,
    body: `## Sleep is when recovery happens. Stop sabotaging it.

The brain consolidates memory, repairs cells, and locks in neural rewiring during sleep. Bad sleep means bad recovery, no matter how hard you train during the day. For stroke survivors, sleep is medicine — and it's the medicine most often skipped.

### The post-stroke sleep landscape

- **Sleep apnea** — affects up to 70% of stroke survivors. Underdiagnosed. Untreated apnea raises stroke risk and tanks daytime function.
- **Insomnia** — common. Mood, pain, meds, and napping all contribute.
- **Hypersomnia** — sleeping 12+ hours and still tired. Often early-recovery, often improves.
- **Restless legs / periodic limb movement** — fragments sleep without you knowing.
- **Sundowning** — agitation in the evening, more common with cognitive deficits.

### The non-negotiables

1. **Get a sleep study.** One time. If positive for apnea, CPAP — and use it. Compliance matters.
2. **Same bedtime and wake time, every day.** Including weekends.
3. **Bedroom is for sleep only.** No TV, no phone, no work.
4. **Cool, dark, quiet.** 65-68°F, blackout curtains, white noise if needed.
5. **No screens 60 minutes before bed.** Real rule. Not optional.
6. **No caffeine after noon.** None.
7. **Dim lights after sunset.** Your circadian rhythm reads light.

### Naps

A 20-30 minute nap before 3pm is rehab fuel. A 2-hour nap at 5pm wrecks tonight's sleep. Time-limit and time-cap.

### What if you can't sleep

Don't lie there for hours. Get up, dim light, read something boring, return when sleepy. Lying awake trains the brain to associate bed with insomnia.

### When to ask for help

Persistent insomnia despite the basics — sleep medicine specialist. Don't normalize bad sleep. It's a recovery emergency, not a quality-of-life issue.`,
    keyTakeaways: [
      "Sleep is when neural rewiring locks in. Bad sleep = no recovery.",
      "Up to 70% of survivors have sleep apnea. Get a sleep study once.",
      "Same bedtime, same wake time, every day. Cool/dark/quiet room.",
      "20-30 min nap before 3pm is fuel. Long evening naps wreck tonight.",
      "No screens 60 min before bed. No caffeine after noon. Real rules.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Roughly what percentage of stroke survivors have sleep apnea?",
        ["Under 5%", "About 20%", "Up to 70%", "100%"],
        2,
        "Much higher than the general population.",
        "Up to 70% of stroke survivors have sleep apnea — far higher than the general population. Most are undiagnosed. A one-time sleep study is one of the highest-leverage tests in recovery.",
      ),
      Q(
        "What is the maximum healthy nap length and timing?",
        ["2 hours, anytime", "20-30 minutes, before 3pm", "1 hour, after dinner", "No naps allowed"],
        1,
        "Short and early.",
        "Short naps (20-30 min) before 3pm boost recovery without sabotaging night sleep. Long or late naps wreck tonight and entrench a bad cycle.",
      ),
      Q(
        "What should you do if you can't sleep after lying in bed for a while?",
        ["Lie there until you fall asleep", "Take sleeping pills", "Get up, dim light, read something boring, return when sleepy", "Watch TV in bed"],
        2,
        "Don't train your brain to associate bed with insomnia.",
        "Lying awake in bed trains the brain to associate bed with insomnia. Get up, do something boring with dim light, and return when actually sleepy. This breaks the loop.",
      ),
      Q(
        "How long before bed should screens be off?",
        ["10 minutes", "30 minutes", "60 minutes", "Doesn't matter"],
        2,
        "An hour.",
        "60 minutes minimum. Blue light suppresses melatonin and the content keeps the brain spinning. This is one of the highest-impact, lowest-cost sleep interventions.",
      ),
      Q(
        "What should you do if persistent insomnia continues despite the basics?",
        ["Accept it", "See a sleep medicine specialist — don't normalize bad sleep", "Drink alcohol to fall asleep", "Take more naps"],
        1,
        "Specialist referral.",
        "Persistent insomnia after addressing the basics is a recovery emergency for stroke survivors. A sleep medicine specialist can identify and treat what general medicine often misses.",
      ),
    ],
  },
  {
    chapter: 29,
    partNumber: 6,
    title: "Stress Mastery",
    subtitle: "Controlling cortisol for recovery",
    requiredTier: "champion",
    estimatedMinutes: 30,
    body: `## Stress is a slow stroke. Fight it like one.

Chronic stress raises blood pressure, dumps cortisol that suppresses neuroplasticity, fragments sleep, and over years measurably increases stroke recurrence. You don't have the luxury of "just dealing with it." Stress management for survivors isn't self-care — it's medicine.

### What stress does to a recovering brain

- Raises BP, the #1 stroke risk factor.
- Suppresses BDNF (brain-derived neurotrophic factor) — the molecule that builds new neural connections.
- Activates the amygdala, suppresses the prefrontal cortex.
- Disrupts sleep, which disrupts memory consolidation.
- Triggers emotional dysregulation that damages relationships.

### The five-tool kit

1. **Breath work.** Box breathing (4 in, 4 hold, 4 out, 4 hold) for 2-3 minutes. Free, immediate, drops cortisol measurably.
2. **Daily movement.** Even 20 minutes of walking moves the cortisol curve more than meditation does for some people.
3. **Journaling.** 10 minutes a night, brain dump on paper. Pulls the loop out of your head and stops it from running while you sleep.
4. **Sunlight.** 20 minutes of morning light sets the cortisol curve for the day. Free.
5. **Connection.** Even one daily 5-minute meaningful conversation lowers stress markers more than most apps.

### The stress audit

Once a month, list everything currently consuming bandwidth. For each: can I drop it, delegate it, defer it, or accept it? Do this with a pen, not in your head. Most survivors are carrying 3-5 things they could safely drop.

### What doesn't work

- Pretending you're fine.
- "I'll deal with it later."
- Alcohol as a stress tool.
- Endless scrolling as decompression.
- Working harder to outrun the feeling.

### When to escalate

Therapy. Specifically CBT (cognitive behavioral therapy) and ACT (acceptance and commitment therapy) have the best evidence for stress and chronic illness. Don't wait until it's a crisis.`,
    keyTakeaways: [
      "Stress is a stroke-recurrence risk. Treat it like medicine.",
      "Cortisol suppresses BDNF, the molecule that builds neural connections.",
      "Breath, movement, journaling, sunlight, connection — five free tools.",
      "Monthly stress audit on paper, not in your head.",
      "CBT and ACT are the highest-evidence therapies for chronic illness stress.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What molecule does cortisol suppress that's critical for neuroplasticity?",
        ["Dopamine", "BDNF (brain-derived neurotrophic factor)", "Insulin", "Adrenaline"],
        1,
        "Brain-derived growth factor.",
        "BDNF is the molecule the brain uses to build new neural connections. Chronic cortisol from stress suppresses it directly, slowing every other piece of recovery work.",
      ),
      Q(
        "What is box breathing?",
        ["Breathing into a paper bag", "4 in, 4 hold, 4 out, 4 hold — repeat for 2-3 minutes", "Holding breath as long as possible", "Breathing into a box"],
        1,
        "Equal counts on all four phases.",
        "Box breathing is a Navy SEAL technique: inhale 4, hold 4, exhale 4, hold 4. Two to three minutes drops cortisol measurably. Free, anywhere, immediate effect.",
      ),
      Q(
        "What's the recommended evening journaling practice?",
        ["Write a perfect essay", "10-minute brain dump on paper to pull loops out of your head before sleep", "Write goals for tomorrow only", "Skip journaling at night"],
        1,
        "Empty the head onto the page.",
        "A 10-minute unfiltered brain dump pulls anxious loops out of the head and onto paper, freeing the brain to actually sleep instead of running them all night.",
      ),
      Q(
        "What two psychotherapies have the best evidence for chronic-illness stress?",
        ["Freudian psychoanalysis and hypnotherapy", "CBT (cognitive behavioral therapy) and ACT (acceptance and commitment therapy)", "EMDR only", "Group therapy only"],
        1,
        "Behavioral and acceptance-based.",
        "CBT and ACT are the two highest-evidence approaches for stress and chronic illness. Look for therapists trained in one or both.",
      ),
      Q(
        "What does the monthly stress audit look like?",
        ["A doctor's appointment", "Write everything consuming bandwidth, then categorize each as drop/delegate/defer/accept", "A blood test", "Skip it"],
        1,
        "List, then categorize.",
        "On paper. List every open loop. Each gets one of four labels: drop, delegate, defer, accept. Most survivors find 3-5 things they could safely drop and never realized.",
      ),
    ],
  },

  // ─── PART 7: LEGACY BUILDING ───────────────────────────────────────────────
  {
    chapter: 30,
    partNumber: 7,
    title: "Finding Your Purpose",
    subtitle: "Why you survived and what to do with it",
    requiredTier: "platinum",
    estimatedMinutes: 35,
    body: `## You didn't survive for nothing.

At some point in recovery — usually somewhere around year one — every survivor has the same question. *Why am I still here? What's it for?* You don't have to answer it forever, but you do have to start asking. Survivors who find a "why" recover further than survivors who don't, by every measurable outcome.

### The question, sharper

Not "what's the meaning of life?" That's too big. Try these:

- What did this experience teach me that I can give to someone else?
- If I had two more years to live, what would I want to do with them?
- Who do I want to have helped by the time I'm done?
- What would the version of me that's grateful to be alive do today?

### The three doors

Most survivor purpose paths fall through one of three doors:

1. **Service.** Helping other survivors directly — peer mentoring, support groups, advocacy, working in stroke care.
2. **Voice.** Telling your story — writing, speaking, content. Other survivors need to know they're not alone.
3. **Mastery.** Pursuing something you couldn't or wouldn't have before — art, athletics, business, learning. The pursuit itself is the purpose.

You don't have to pick one forever. You do have to pick one for now and start.

### The trap

Don't wait until you're "ready." Don't wait until you're "fully recovered." Both are excuses. The purpose pulls the recovery, just like the goal in Chapter 8 pulls the work.

### What if I don't feel a calling

Most don't. Calling is a romantic word. The real method: pick something that doesn't bore you, do it for 90 days, see if it grows on you. Most purposes are built, not found.`,
    keyTakeaways: [
      "Survivors who find a 'why' recover further than those who don't.",
      "Three doors: service, voice, mastery.",
      "Pick something for now, not forever.",
      "Don't wait to be 'ready.' Purpose pulls recovery.",
      "Most purposes are built over 90 days, not 'found.'",
    ],
    passingScore: 70,
    questions: [
      Q(
        "What are the three common 'doors' to survivor purpose?",
        ["Money, fame, power", "Service, voice, mastery", "Family, work, faith", "Past, present, future"],
        1,
        "Service, voice, mastery.",
        "Most survivor purpose paths fall through service (helping others), voice (telling your story), or mastery (pursuing something deeply). All three are legitimate.",
      ),
      Q(
        "Per the chapter, what's the right time to start pursuing purpose?",
        ["When you're fully recovered", "When you feel ready", "Now — purpose pulls recovery, not the other way around", "After 5 years"],
        2,
        "Don't wait.",
        "Waiting for 'ready' or 'fully recovered' is an excuse. The purpose itself pulls the recovery forward, exactly the way the goals in Chapter 8 pull the work.",
      ),
      Q(
        "What's the chapter's view of 'calling'?",
        ["Always immediate and clear", "A romantic word — most purposes are built over 90 days, not found", "Only religious people have one", "Predetermined at birth"],
        1,
        "Built, not found.",
        "Most survivors don't get a clear calling. The real method is to pick something that doesn't bore you, work it for 90 days, and see if it grows. Built purpose is more durable than found purpose.",
      ),
      Q(
        "Around what point in recovery does the 'why am I still here' question typically arise?",
        ["Day 1", "Around year one", "Year ten", "It never arises"],
        1,
        "About a year out.",
        "Around year one is when most survivors confront the meaning question. The acute crisis is past, the early gains are slowing, and the brain has space to ask.",
      ),
      Q(
        "Per the chapter, do survivors with a defined 'why' recover further than those without?",
        ["No difference", "Yes — by every measurable outcome", "Only those with religious purposes", "Only younger survivors"],
        1,
        "Measurably further.",
        "Survivors with a defined sense of purpose recover further across nearly every measured outcome — physical, cognitive, emotional, longevity. Purpose is a recovery technology, not just a feel-good idea.",
      ),
    ],
  },
  {
    chapter: 31,
    partNumber: 7,
    title: "Becoming an Advocate",
    subtitle: "Using your story to help others",
    requiredTier: "platinum",
    estimatedMinutes: 30,
    body: `## Your story is the most powerful recovery tool nobody else can give.

A survivor 1-2 years ahead has more authority with a fresh survivor than the most credentialed neurologist in the country. You've lived it. That gives you something the textbook can't provide. Use it.

### The three levels of advocacy

**Personal.** One-on-one with another survivor. Coffee, phone call, hospital visit. Smallest scale, often biggest impact.

**Community.** Local support group, church, civic group, workplace wellness program. Hundreds of people over years.

**Public.** Writing, speaking, podcast, social media, books. Thousands or millions over a career. Slowest to build, biggest reach.

You don't have to start at the public level. Almost everyone starts at personal.

### The story rules

1. **Tell the truth.** Including the dark parts. Sanitized stories don't help anyone.
2. **Name what worked AND what didn't.** Honest failure is more useful than scripted success.
3. **Don't sell anything in your origin story.** The story is the gift. Monetization comes later, separately, and ethically.
4. **Don't speak for survivors you haven't lived with.** Your story is yours. Other people have their own.
5. **Watch for inspiration porn.** If your story is being used to make able-bodied people feel grateful, you're being used.

### What advocacy looks like in practice

- Visit one new survivor a month at the rehab hospital.
- Run or co-run a monthly support group.
- Write or share weekly on a platform you care about.
- Become a peer-mentor through your local stroke association.
- Speak at conferences when invited (and turn down the unpaid ones once you can).

### The risk

Advocacy can become its own treadmill. Burnout is real. Build it as a chapter of your life, not the whole life. Recovery first, advocacy second. If advocacy starts costing recovery, scale it back.`,
    keyTakeaways: [
      "Your lived story has more authority with a fresh survivor than any credential.",
      "Three levels: personal, community, public. Most start at personal.",
      "Truth — including the dark parts. Sanitized doesn't help.",
      "Don't sell anything in the origin story. Monetize separately, ethically.",
      "Recovery first, advocacy second. Don't let advocacy cost recovery.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Per the chapter, who has more authority with a brand-new survivor?",
        ["The most credentialed neurologist", "A survivor 1-2 years ahead who's lived it", "A general physician", "Hospital administration"],
        1,
        "Lived experience trumps credentials.",
        "A survivor who's walked the path 1-2 years ahead carries authority no credential can replicate. That's why peer mentoring is so high-leverage.",
      ),
      Q(
        "What is 'inspiration porn'?",
        ["A motivational genre", "When a disabled person's story is used primarily to make able-bodied people feel grateful or motivated, treating the person as a prop", "A type of memoir", "A church program"],
        1,
        "It uses you as a prop.",
        "Inspiration porn frames disability stories to make able-bodied people feel something, treating the disabled person as inspiration material rather than a full person. Watch for it; refuse it.",
      ),
      Q(
        "Where do most survivor advocates start?",
        ["Public platform with a million followers", "Personal level — one-on-one with another survivor", "Federal legislation", "TV interviews"],
        1,
        "One-on-one.",
        "Almost everyone starts at the personal level — coffee with one survivor at a time. The community and public levels build from years of personal-level work, not the other way around.",
      ),
      Q(
        "Per the chapter, what's the right priority order?",
        ["Advocacy first, recovery second", "Recovery first, advocacy second — and scale advocacy back if it costs recovery", "Advocacy only, abandon recovery", "Recovery only, never advocate"],
        1,
        "Recovery is the foundation.",
        "Recovery first, advocacy second. If advocacy starts costing recovery — sleep, training, mental health — scale it back. The mission needs you healthy.",
      ),
      Q(
        "What's the chapter's rule about selling things in your origin story?",
        ["Always sell in the story", "Don't sell anything in the origin story — monetization comes later, separately, and ethically", "Only sell if you have to", "Selling is never allowed"],
        1,
        "Story is the gift.",
        "The origin story is the gift. Selling embedded in it cheapens both the story and trust. Monetization is fine — separately, transparently, after the relationship is built.",
      ),
    ],
  },
  {
    chapter: 32,
    partNumber: 7,
    title: "Paying It Forward",
    subtitle: "Building community and mentoring",
    requiredTier: "platinum",
    estimatedMinutes: 25,
    body: `## The community is the asset. Build it.

Survivor recovery is faster, deeper, and more durable inside a community than alone. That's not opinion — it's data. Survivors with strong support networks have lower recurrence rates, better mood, and higher functional outcomes over 5+ years.

You can join one. You can build one. The second is more work and produces more leverage.

### Why community works

- **Identity reinforcement.** "I'm a survivor in a community of survivors" beats "I'm the only one."
- **Pattern recognition.** Hearing someone else describe your symptoms validates them faster than any doctor visit.
- **Practical knowledge.** What worked, what didn't, what to ask the doctor, what gear to buy. Real intel.
- **Accountability.** Showing up because someone is expecting you is more powerful than personal discipline alone.
- **Service opportunities.** Helping someone else accelerates your own recovery.

### How to build one

Start tiny. Three survivors meeting once a month for coffee is a community. Don't try to build a 500-person organization — that's a different job. The right shape:

- 5-15 people in the inner circle.
- One regular meeting (monthly minimum, weekly ideal).
- One private channel (text group, Discord, Signal, whatever works).
- One stated norm: confidentiality.
- One stated purpose: get each other to year five and beyond.

### What kills survivor communities

- One person dominating.
- Toxic positivity (no dark stuff allowed).
- Endless complaining (no growth allowed).
- No structure (everyone shows up but nothing happens).
- No new members (community ages out and dies).

### The mentor relationship

Specifically structured: one survivor 1-2 years ahead pairs with one survivor in early recovery. Monthly check-in minimum. Don't try to be the therapist. Just be the road-tested example. Tell them what you wish someone had told you.`,
    keyTakeaways: [
      "Community lowers recurrence and improves long-term outcomes. Data, not opinion.",
      "Start tiny: 5-15 people, monthly meeting, private channel, one purpose.",
      "Beware: one-person dominance, toxic positivity, endless complaining, no structure.",
      "Mentor relationships: 1-2 years ahead pairs with 1 in early recovery.",
      "Don't try to be the therapist. Be the road-tested example.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "Per the chapter, what's the right starting size for a survivor community?",
        ["100 people", "5-15 in the inner circle", "Just yourself", "500+ for impact"],
        1,
        "Small and tight.",
        "5-15 people in an inner circle is the size that produces real intimacy and accountability. Larger groups become events, not communities.",
      ),
      Q(
        "How does a mentor relationship work?",
        ["One credentialed expert, many survivors", "One survivor 1-2 years ahead pairs with one in early recovery", "Group of equals", "Therapist with patient"],
        1,
        "Pair structure.",
        "Mentor and mentee, one ahead, one behind. Monthly check-ins minimum. Not therapy — just the road-tested example showing the path.",
      ),
      Q(
        "What kills survivor communities?",
        ["Strict confidentiality", "Monthly meetings", "One person dominating, toxic positivity, no growth, no structure, no new members", "Having a stated purpose"],
        2,
        "Imbalances and stagnation.",
        "Communities die from any of these: one dominating voice, no dark stuff allowed (toxic positivity), no growth allowed (endless complaining), no structure, or no new blood.",
      ),
      Q(
        "Per the chapter, what's the survivor community's core stated norm?",
        ["Public sharing", "Confidentiality", "No politics", "Mandatory attendance"],
        1,
        "What's said in the room stays.",
        "Without confidentiality, survivors don't share the truth. Without truth, the community is useless. Confidentiality is the foundation.",
      ),
      Q(
        "Why does helping another survivor benefit YOUR own recovery?",
        ["It doesn't — only the person being helped benefits", "Service shifts identity and accelerates recovery (also covered in Chapter 5)", "It generates income", "It's required for certification"],
        1,
        "Service is medicine for both sides.",
        "Helping another survivor shifts your own identity from patient to helper, gives you purpose, and (per Chapter 5) is the fastest known exit from self-pity. The helper grows alongside the helped.",
      ),
    ],
  },
  {
    chapter: 33,
    partNumber: 7,
    title: "The Sasquatch Manifesto",
    subtitle: "Your declaration of extraordinary recovery",
    requiredTier: "platinum",
    estimatedMinutes: 20,
    body: `## This is who we are.

You've done 32 chapters. The work has changed you. Now we put it on paper. The Sasquatch Manifesto is your personal declaration — written in your own words — of who you are now and who you intend to be. It is not optional. Survivors who write it last decades. Survivors who skip it drift.

### The frame

A manifesto is short. One page, max. Read out loud in 60-90 seconds. You should be able to recite the spine of it from memory.

### The required elements

1. **Who you are.** Name, age, the day you survived. ("My name is _____. I'm _____ years old. On _______, I had a stroke and survived.")
2. **What you reject.** The specific limits other people put on you. The story you refuse to live. ("I reject ______. I refuse to be ______.")
3. **What you commit to.** The non-negotiable practices. Sleep. Movement. Reps. Service. Truth. ("Every day I will ______.")
4. **The 30-year vision.** Where you intend to be when this is done. ("By _____ I will be ______.")
5. **Your why.** The reason it matters. ("I am doing this for _____.")
6. **The signature line.** "This is who I am. This is the comeback."

### The ritual

Read it out loud:

- Every morning, before phone or coffee.
- Every time you hit a wall.
- Once a year on the anniversary, then refine and rewrite.

### What the manifesto does

It hard-codes identity into language, and language into the brain. Every reading reinforces wiring. After 60 days the manifesto is who you are, not just what you wrote.

### A note on tone

Don't make it inspirational. Don't make it pretty. Make it true. Use your own words, not motivational poster words. The manifesto only works if it sounds like the realest version of your voice.

### Welcome

You finished 33 chapters. You're now part of a small, growing group of survivors who completed the work. The certificate is real. The change is realer.

Now go help the next one. Course on you. Mountain ahead.`,
    keyTakeaways: [
      "Write your manifesto. Survivors who write it last decades.",
      "Six required elements: who you are, what you reject, what you commit to, the 30-year vision, your why, signature line.",
      "Read out loud daily, before phone or coffee.",
      "Use your real voice, not motivational poster words.",
      "Refine annually. The manifesto evolves as you do.",
    ],
    passingScore: 70,
    questions: [
      Q(
        "How long should the Sasquatch Manifesto be?",
        ["10 pages", "One page max — readable out loud in 60-90 seconds", "A single sentence", "A full book"],
        1,
        "One page.",
        "A manifesto is a spine, not a memoir. One page, readable in 60-90 seconds, recitable from memory in essence.",
      ),
      Q(
        "When should the manifesto be read out loud?",
        ["Once, when first written", "Every morning before phone or coffee, every time you hit a wall, and once a year on anniversary", "Only in therapy sessions", "Never out loud"],
        1,
        "Daily and at choke points.",
        "Daily morning recitation hard-codes identity. Wall-moment rereading interrupts the spiral. Annual rewrite keeps it current with who you've become.",
      ),
      Q(
        "How many required elements are in the manifesto structure?",
        ["3", "5", "6", "10"],
        2,
        "Six pieces.",
        "Six: identity statement, what you reject, what you commit to, 30-year vision, your why, and the signature line. Each does specific psychological work.",
      ),
      Q(
        "What's the right tone for the manifesto?",
        ["Inspirational and pretty", "Motivational poster words", "True — use your real voice, not inspirational language", "Formal and academic"],
        2,
        "Real beats pretty.",
        "Inspirational language gets old fast and stops working. The manifesto must sound like the realest version of your voice — that's what makes it a daily reset instead of a tired ritual.",
      ),
      Q(
        "What does the manifesto actually do mechanically?",
        ["Magic", "Hard-codes identity into language and language into brain wiring through daily repetition", "Replaces therapy", "Makes the stroke go away"],
        1,
        "Repetition rewires identity.",
        "Daily recitation uses the same Hebbian wiring law from Chapter 2 to encode identity statements deep into the brain. After 60 days the manifesto becomes who you are, not just what you wrote.",
      ),
    ],
  },
];
