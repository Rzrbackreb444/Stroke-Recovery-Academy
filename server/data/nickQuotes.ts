// Curated quote library — Nick "Stroked-Out Sasquatch" Kremers, in his own
// voice. ~200 lines extracted from his manuscripts:
//   - The Stroked-Out Sasquatch: An Architect's Manifesto for Reconstruction
//   - The Sasquatch Doctrine + Creed
//   - The Ultimate Stroke Recovery Bible 2025
//   - ICU Hell chapter
// Plus a few survivor-supplied rallying cries the founder uses verbatim
// (e.g. "Heart still thumpin', life's still pumpin'").
//
// Used by:
//   - server/recoveryJourneyRoutes.ts → Gemini prompt receives 8 candidate
//     quotes per call so the model wires body copy to a real Nick quote
//     instead of inventing pseudo-Sasquatch lines.
//   - server/recoveryJourneyRoutes.ts → STATIC_FALLBACK quotes are sourced
//     from this library so the platform reads as on-brand even when Gemini
//     is degraded.
//   - client/src/components/TodaysSpark.tsx (rendered on Daily Journey) →
//     deterministic daily quote per (userId, day) so every survivor sees
//     the same line all day, but a fresh one tomorrow.
//
// Categories let the rec engine pick a quote that matches the moment
// (e.g. fuel/anchor for streak<3, dark for late-night sessions, doctrine
// for general slots).

export type QuoteCategory =
  | "foundation"
  | "ownership"
  | "movement"
  | "reflection"
  | "repetition"
  | "adaptation"
  | "humanhood"
  | "fuel"
  | "dark"
  | "identity"
  | "humor"
  | "doctrine"
  | "practice";

export interface NickQuote {
  text: string;
  category: QuoteCategory;
}

export const NICK_QUOTES: NickQuote[] = [
  // ─── FOUNDATION ────────────────────────────────────────────────────────
  { text: "You've already won. You survived.", category: "foundation" },
  { text: "Small wins are sacred. A flicker is a resurrection.", category: "foundation" },
  { text: "The lights might flicker, but they never go out if you keep swinging.", category: "foundation" },
  { text: "I am the builder of my own comeback.", category: "foundation" },
  { text: "I am not broken. I am rebuilt.", category: "foundation" },
  { text: "My scars are blueprints, not barriers.", category: "foundation" },
  { text: "Recovery isn't a finish line. It's a construction site.", category: "foundation" },
  { text: "The hammer's already in your hands.", category: "foundation" },
  { text: "There are two kinds of survivors: those who wait to be rescued, and those who learn to rebuild.", category: "foundation" },
  { text: "The stroke didn't end my story. It stripped it down to its foundation.", category: "foundation" },
  { text: "Recovery isn't healing. It's construction.", category: "foundation" },
  { text: "Heart still thumpin', life's still pumpin'.", category: "foundation" },
  { text: "Day one is not lost. Day one is the floor of the build.", category: "foundation" },
  { text: "You're still in there. The signal still goes.", category: "foundation" },
  { text: "From impossible to inevitable. That's the whole road.", category: "foundation" },

  // ─── OWNERSHIP ─────────────────────────────────────────────────────────
  { text: "Nobody's coming to save you. And that's the good news.", category: "ownership" },
  { text: "Nobody else can do the reps for you.", category: "ownership" },
  { text: "It's your brain, your body, your comeback.", category: "ownership" },
  { text: "Stop pointing at the cause. Start investing in the cure.", category: "ownership" },
  { text: "The cure is you.", category: "ownership" },
  { text: "Ownership is honesty on repeat.", category: "ownership" },
  { text: "This is your life. Nobody's fixing it but you.", category: "ownership" },
  { text: "Ownership doesn't mean guilt. It means freedom.", category: "ownership" },
  { text: "You're not responsible for what happened. You are responsible for what happens next.", category: "ownership" },
  { text: "If you helped cause it, you can help cure it.", category: "ownership" },
  { text: "Stop being a patient. Start being a project manager for your own rebirth.", category: "ownership" },
  { text: "Ownership doesn't need motivation. It demands execution.", category: "ownership" },
  { text: "When you say you're rebuilding, you're not waiting. You're working.", category: "ownership" },
  { text: "I stopped saying 'stroke survivor' and started saying 'I'm rebuilding'.", category: "ownership" },
  { text: "Effort equals connection. Repetition equals growth.", category: "ownership" },
  { text: "Excuses lose their power the second you take ownership.", category: "ownership" },
  { text: "Responsibility isn't a burden. It's the blueprint for power.", category: "ownership" },
  { text: "Stop asking 'I can't because…'. Start asking 'what can I do right now?'.", category: "ownership" },
  { text: "Recovery doesn't start in rehab. It starts when no one's watching.", category: "ownership" },
  { text: "Ownership is self-command, not self-blame.", category: "ownership" },
  { text: "Believing you're the builder makes your brain build faster.", category: "ownership" },

  // ─── MOVEMENT ──────────────────────────────────────────────────────────
  { text: "Motion is medicine. Stillness is rust.", category: "movement" },
  { text: "If you can move, you must. If you can't move, you visualize movement until you can.", category: "movement" },
  { text: "Every small motion tells your brain: this still works.", category: "movement" },
  { text: "Never zero. If you can't do the whole drill, do a fragment.", category: "movement" },
  { text: "Even on your worst day, do one rep, one stretch, one breath.", category: "movement" },
  { text: "Don't wait to feel ready. Move, and readiness will find you.", category: "movement" },
  { text: "Movement doesn't follow healing. It creates it.", category: "movement" },
  { text: "Movement doesn't ask for perfection. It just asks for effort.", category: "movement" },
  { text: "Effort, repeated long enough, becomes momentum.", category: "movement" },
  { text: "Motivation is a luxury. Momentum is what keeps you going when motivation dies.", category: "movement" },
  { text: "You don't need motivation to move. You need movement to get motivation.", category: "movement" },
  { text: "Don't chase strength yet. Chase signals.", category: "movement" },
  { text: "Every step was a victory. Every failure was data.", category: "movement" },
  { text: "The brain doesn't just rebuild what was. It builds what works.", category: "movement" },
  { text: "A toe twitch is resurrection.", category: "movement" },
  { text: "When you stop moving, the brain stops mapping.", category: "movement" },
  { text: "Wake up. Move something. No negotiation.", category: "movement" },
  { text: "Every flicker is proof the wiring's catching.", category: "movement" },
  { text: "When you see your body obey again, even for a heartbeat, it's resurrection.", category: "movement" },
  { text: "Sometimes the best tools aren't the ones insurance covers. They're the ones built from instinct and grit.", category: "movement" },
  { text: "A five-dollar bat doubled my standing time. Recovery doesn't have to be complicated.", category: "movement" },
  { text: "Discipline is stronger than emotion. Rhythm is recovery.", category: "movement" },
  { text: "Not leaps. Flickers. Not miracles. Messages.", category: "movement" },
  { text: "Even thought can train muscle.", category: "movement" },
  { text: "Visualize the rep. The brain can't tell the difference.", category: "movement" },

  // ─── REFLECTION ────────────────────────────────────────────────────────
  { text: "Honesty heals faster than denial.", category: "reflection" },
  { text: "Reflection isn't weakness. It's inspection.", category: "reflection" },
  { text: "Reflection turns effort into evolution.", category: "reflection" },
  { text: "Without reflection, you repeat without learning.", category: "reflection" },
  { text: "Without learning, you rebuild the same broken design.", category: "reflection" },
  { text: "Stop looking at the mirror. Start looking through it.", category: "reflection" },
  { text: "The mirror isn't judgment. It's feedback. And feedback is how you evolve.", category: "reflection" },
  { text: "Reflection without judgment builds direction. Judgment without reflection breeds destruction.", category: "reflection" },
  { text: "When you stop defending your weaknesses, you start fixing them.", category: "reflection" },
  { text: "Progress hides inside the data.", category: "reflection" },
  { text: "The Flicker Log isn't a journal. It's your build report.", category: "reflection" },
  { text: "When the dark hits, your log becomes your receipt.", category: "reflection" },
  { text: "What did I build today? What broke? What will I fix tomorrow?", category: "reflection" },
  { text: "You can't rebuild while you're busy criticizing the builder.", category: "reflection" },
  { text: "Stop comparing today's version of you to who you used to be. Ask: what's the next inch I can claim today?", category: "reflection" },
  { text: "Reflection is construction oversight for the soul.", category: "reflection" },
  { text: "Healing happens in silence — in the long pauses where you face truth without filters.", category: "reflection" },

  // ─── REPETITION ────────────────────────────────────────────────────────
  { text: "Chop wood.", category: "repetition" },
  { text: "Chopping wood isn't about speed. It's about consistency.", category: "repetition" },
  { text: "Small swings move mountains over time.", category: "repetition" },
  { text: "You don't rebuild a forest by swinging once. You rebuild it one log at a time.", category: "repetition" },
  { text: "Every swing is a deposit into the comeback account.", category: "repetition" },
  { text: "Stack failures until they form steps.", category: "repetition" },
  { text: "Stack failures into success. Every try is a deposit.", category: "repetition" },
  { text: "Patience is brutal. It's showing up a thousand times with nothing to show for it, believing the thousand-and-first will change everything.", category: "repetition" },
  { text: "Patience is a bitch. But it's a virtue.", category: "repetition" },
  { text: "Repetition equals rewiring.", category: "repetition" },
  { text: "Each rep is a message: hey brain, we're still doing this.", category: "repetition" },
  { text: "Show up when the lights aren't on you. That's where recovery lives.", category: "repetition" },
  { text: "Practice means repetition. Repetition means progress, even when you can't see it.", category: "repetition" },
  { text: "The thousand-and-first might change everything. So you do the thousandth.", category: "repetition" },

  // ─── ADAPTATION ────────────────────────────────────────────────────────
  { text: "Mutation beats stagnation.", category: "adaptation" },
  { text: "Change reps, angles, or intensity to break plateaus.", category: "adaptation" },
  { text: "You don't rebuild by routine. You rebuild by problem-solving under pressure — one flicker at a time.", category: "adaptation" },
  { text: "Push. Experiment. Improvise. Never zero. Stack the fails.", category: "adaptation" },
  { text: "Every creative challenge sends a new signal to your brain.", category: "adaptation" },
  { text: "The doctrine evolves. Just like the brains it repairs.", category: "adaptation" },
  { text: "If the textbook doesn't have it, build it yourself.", category: "adaptation" },
  { text: "Anger's a spark, not a wildfire. Burn clean.", category: "adaptation" },
  { text: "Anger is fuel. Channel it into reps, not explosions.", category: "adaptation" },
  { text: "Plateaus aren't walls. They're invitations to switch the drill.", category: "adaptation" },
  { text: "Medical timelines are insurance schedules, not biology.", category: "adaptation" },
  { text: "Every breakthrough I had came after their system gave up on me.", category: "adaptation" },

  // ─── HUMANHOOD ─────────────────────────────────────────────────────────
  { text: "Being human comes before being healed.", category: "humanhood" },
  { text: "Caregivers: you're the lifeline, not the jailer.", category: "humanhood" },
  { text: "Help can hurt. Every assisted moment is one less signal to your brain that you can do it on your own.", category: "humanhood" },
  { text: "Sometimes pride isn't pride. It's practice.", category: "humanhood" },
  { text: "Romance isn't always candles. Sometimes it's somebody holding your pee cup at 3am.", category: "humanhood" },
  { text: "The shadow doctrine for caregivers: patience, accountability, humor.", category: "humanhood" },
  { text: "Don't introduce yourself as your worst day.", category: "humanhood" },
  { text: "Personality refuses to die even when the body is trying its hardest to quit.", category: "humanhood" },
  { text: "Survivors remix the doctrine. Add your hacks. Share your logs.", category: "humanhood" },
  { text: "If you teach one law to someone still in the dark, you've paid the bill.", category: "humanhood" },
  { text: "You're not a stroke. You're a survivor with one hell of a chapter.", category: "humanhood" },
  { text: "Sometimes the people next to you are the most important equipment.", category: "humanhood" },

  // ─── FUEL / WHY / ANCHOR ──────────────────────────────────────────────
  { text: "Once you have a why, you can survive any how.", category: "fuel" },
  { text: "Find your why — son, partner, dog, yourself.", category: "fuel" },
  { text: "Purpose rewires pain into progress.", category: "fuel" },
  { text: "Anchor your why. Then act on it before you feel ready.", category: "fuel" },
  { text: "If I couldn't live for myself, I could live for him.", category: "fuel" },
  { text: "I couldn't stand for myself yet, but I'd damn sure stand for him.", category: "fuel" },
  { text: "Even before he took his first breath, he was saving mine.", category: "fuel" },
  { text: "If you've got one anchor, you've got enough.", category: "fuel" },
  { text: "Drag your feet toward your why and the legs will follow.", category: "fuel" },
  { text: "Your anchor doesn't have to be poetic. It just has to pull.", category: "fuel" },
  { text: "Purpose hits like a defibrillator.", category: "fuel" },
  { text: "Faith becomes fuel. Fuel becomes flickers. Flickers become movement.", category: "fuel" },

  // ─── DARK (handled honestly, never toxic-positive) ────────────────────
  { text: "Depression doesn't always look like sadness. Sometimes it looks like silence.", category: "dark" },
  { text: "Rock bottom has a funny way of giving you perspective. The deeper the hole, the clearer the light looks above it.", category: "dark" },
  { text: "The void survivors rarely talk about is real. So is the way out — one rep at a time.", category: "dark" },
  { text: "I wasn't lazy. I was lost.", category: "dark" },
  { text: "I wasn't living. I was existing. That's a kind of dark you don't have to stay in.", category: "dark" },
  { text: "Awakening isn't about finding the light. It's about learning to work in the dark until the switch flips.", category: "dark" },
  { text: "The darkest rooms are where the first flickers show up.", category: "dark" },
  { text: "When they tell you 'never,' that's the forge.", category: "dark" },
  { text: "Your job isn't to feel inspired. Your job is to keep swinging anyway.", category: "dark" },
  { text: "If today the only swing you've got is breath, take that swing.", category: "dark" },
  { text: "If you're still here reading this, the answer to 'is it worth it?' has already been written by you. Yes.", category: "dark" },
  { text: "Some pain you can't outwork. You can only outlast.", category: "dark" },
  { text: "How does a man built on strength function when strength is gone? You learn that strength was never the point.", category: "dark" },

  // ─── IDENTITY ──────────────────────────────────────────────────────────
  { text: "Architect. Builder. Finisher.", category: "identity" },
  { text: "I am the Stroked-Out Sasquatch.", category: "identity" },
  { text: "The new me — scarred, slower, intentional — is real.", category: "identity" },
  { text: "The comeback isn't about getting back to who you were. It's about becoming who you were meant to be.", category: "identity" },
  { text: "Before the stroke, I measured strength in pounds. After, I measured it in persistence.", category: "identity" },
  { text: "I wasn't a stroke victim. I was a builder under reconstruction.", category: "identity" },
  { text: "The chair didn't define me. The work did.", category: "identity" },
  { text: "Strength was rolling out of bed when I didn't want to.", category: "identity" },
  { text: "Strength was choosing broccoli over self-pity.", category: "identity" },
  { text: "Strength was lifting my son, even with one good arm.", category: "identity" },
  { text: "I wasn't broken. I was being rebuilt.", category: "identity" },
  { text: "From that point on, every rep was no longer punishment. It was a blueprint.", category: "identity" },

  // ─── HUMOR / DEFIANCE ─────────────────────────────────────────────────
  { text: "Singing Britney Spears while you shit in a hospital bed counts as a swing.", category: "humor" },
  { text: "The doctors said I'd never know music again. They were wrong on all of it.", category: "humor" },
  { text: "Find one ridiculous thing that still feels like you. Say it out loud.", category: "humor" },
  { text: "He pounded fifty staples into my head and joked I was so damn thick-headed he almost didn't get through. He wasn't wrong.", category: "humor" },
  { text: "Defiant. Broken. Still me. The personality refuses to die.", category: "humor" },
  { text: "If a guy with 50 staples in his skull can sing pop songs through pureed mush, you can do five reps.", category: "humor" },
  { text: "Recovery doesn't owe you dignity. It owes you a body. Take the body. The dignity comes back later.", category: "humor" },
  { text: "I was supposed to be numb from the meds. I felt every staple. Hell has a spec sheet — and you can survive it.", category: "humor" },
  { text: "I dreamed about winning Nathan's hot dog eating contest from a hospital bed on pureed mush. Keep your dumb dream alive.", category: "humor" },

  // ─── DOCTRINE (tattoo-grade laws + S.O.S + COMPASS) ──────────────────
  { text: "Control what you can. Rituals beat randomness.", category: "doctrine" },
  { text: "S.O.S — Survive. Organize. Strive.", category: "doctrine" },
  { text: "Survive: breathe, grieve, anchor your why.", category: "doctrine" },
  { text: "Organize: stack your wins, build rituals, control what you can.", category: "doctrine" },
  { text: "Strive: push, experiment, improvise, never zero.", category: "doctrine" },
  { text: "It doesn't point north. It points forward.", category: "doctrine" },
  { text: "Even if you move an inch a day, if you move with intent, you'll never be lost again.", category: "doctrine" },
  { text: "The Laws built the foundation. The Doctrine runs the engine. The Creed builds the man.", category: "doctrine" },
  { text: "When you can live the laws without reading them, you've crossed from recovery to rebirth.", category: "doctrine" },
  { text: "S.O.S isn't a cry for help. It's a battle signal.", category: "doctrine" },
  { text: "Survival is step one. Structure is step two. Striving never stops.", category: "doctrine" },
  { text: "Check your S each morning: Survive, Organize, or Strive?", category: "doctrine" },
  { text: "Tortoise wins every time. No 30-day sprints.", category: "doctrine" },
  { text: "Patience plus nutrition equals brain fuel. Heal first, rewire second.", category: "doctrine" },
  { text: "We're not here to survive. We're here to rebuild.", category: "doctrine" },

  // ─── PRACTICE / DAILY ─────────────────────────────────────────────────
  { text: "Today's drill is whatever you can do twice. Do it twice.", category: "practice" },
  { text: "Pick a ritual. Run it daily. Talk about it weekly. That's the engine.", category: "practice" },
  { text: "Pick rituals. Run the laws daily.", category: "practice" },
  { text: "Log wins. Share. Teach. Give back.", category: "practice" },
  { text: "Switch drills. Break plateaus.", category: "practice" },
  { text: "Audit Day 1: what moves, what doesn't, what hurts.", category: "practice" },
  { text: "If the only person who knows you showed up today is you, that still counts.", category: "practice" },
  { text: "A good day was not falling. A great day was controlling my breath while I didn't.", category: "practice" },
  { text: "There's no applause in rehab. The victories are invisible.", category: "practice" },
  { text: "You don't recover by accident. You recover by awareness.", category: "practice" },
  { text: "Eat. Move. Rest. Repeat. That's the whole job.", category: "practice" },
  { text: "Don't think of it as exercise. Think of it as practice.", category: "practice" },
  { text: "When you claim ownership, your identity shifts from reactive to architectural.", category: "practice" },
  { text: "If you don't move, your brain doesn't learn. If you don't believe, your body doesn't respond.", category: "practice" },
  { text: "I built a daily ritual: wake up, move something, no negotiation.", category: "practice" },
  { text: "Each small win releases the brain's progress chemical. That's how habit becomes hunger.", category: "practice" },
];

// ── Helpers ────────────────────────────────────────────────────────────

// Stable per-user, per-day quote selection so the survivor sees the same
// "Today's Spark" all day, but a fresh one tomorrow. Same algorithm runs
// on every request so we never need to persist anything.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function todayUtcKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyQuote(userId: string | null | undefined): NickQuote {
  const seed = `${userId ?? "anon"}::${todayUtcKey()}`;
  const idx = hashString(seed) % NICK_QUOTES.length;
  return NICK_QUOTES[idx];
}

export function getRandomQuote(): NickQuote {
  return NICK_QUOTES[Math.floor(Math.random() * NICK_QUOTES.length)];
}

// Tiny seeded PRNG (mulberry32). Lets us pick deterministic-looking
// "random" subsets per (userId, day) so the Gemini quote candidate pool
// is stable across cache misses for the same survivor on the same day —
// no flicker if the server restarts mid-day.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getQuotesByCategory(
  cat: QuoteCategory,
  n = 6,
  rand: () => number = Math.random,
): NickQuote[] {
  const pool = NICK_QUOTES.filter((q) => q.category === cat);
  const out: NickQuote[] = [];
  const used = new Set<number>();
  while (out.length < Math.min(n, pool.length)) {
    const i = Math.floor(rand() * pool.length);
    if (used.has(i)) continue;
    used.add(i);
    out.push(pool[i]);
  }
  return out;
}

// Sample N quotes across a weighted mix of categories, used to feed the
// Gemini recommendation prompt. The model receives real Nick lines and
// is told to wire its body copy to one of them — eliminating drift into
// generic motivational tone. Deterministic per (userId, day, surface)
// when a userId is supplied, so cache misses don't change the pool the
// survivor sees that day.
export function sampleQuotePool(opts: {
  surface: string;
  streak: number;
  isPremium: boolean;
  userId?: string | null;
}): string[] {
  // Surface-tuned weighting. Each entry: [category, weight].
  const weights: Record<string, Array<[QuoteCategory, number]>> = {
    journey: [
      ["doctrine", 3],
      ["movement", 3],
      ["practice", 2],
      ["fuel", 2],
      ["identity", 2],
      ["humor", 1],
    ],
    welcome: [
      ["foundation", 4],
      ["identity", 3],
      ["fuel", 2],
      ["doctrine", 2],
    ],
    dashboard: [
      ["practice", 3],
      ["movement", 2],
      ["doctrine", 2],
      ["repetition", 2],
      ["humor", 1],
    ],
    coach: [
      ["humanhood", 3],
      ["dark", 2],
      ["fuel", 2],
      ["humor", 2],
      ["identity", 2],
    ],
  };
  const mix = weights[opts.surface] ?? weights.journey;
  // Seed the PRNG per (userId, surface, UTC day) so the same survivor
  // sees the same candidate pool all day. Falls back to Math.random if
  // no userId — anonymous public surfaces don't need stability.
  const seedStr = `${opts.userId ?? ""}::${opts.surface}::${todayUtcKey()}`;
  const rand = opts.userId ? mulberry32(hashString(seedStr)) : Math.random;
  const pool: NickQuote[] = [];
  for (const [cat, n] of mix) {
    pool.push(...getQuotesByCategory(cat, n, rand));
  }
  // Streak < 3? Add a foundation/dark line so first-week survivors hear
  // "you're still here, it counts" before they hear "stack the failures."
  if (opts.streak < 3) {
    pool.push(...getQuotesByCategory("foundation", 2, rand));
    pool.push(...getQuotesByCategory("dark", 1, rand));
  }
  // Dedup by text.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const q of pool) {
    if (seen.has(q.text)) continue;
    seen.add(q.text);
    unique.push(q.text);
    if (unique.length >= 8) break;
  }
  return unique;
}
