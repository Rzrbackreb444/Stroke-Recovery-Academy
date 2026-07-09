// ============================================================================
// Daily Circuit — preset templates
// ============================================================================
// A "circuit" is a guided multi-station session that strings together the
// platform's existing recovery surface (brain games, exercises, hydration,
// reflection, community, coach) with paced timers and voice-cloned
// transitions in Nick's voice.
//
// Three tiers of session length so survivors with profound post-stroke
// fatigue can still meaningfully participate on bad days:
//   - quick    (~10 min) — bad days, late starts, "I just need to log
//                          something"
//   - standard (~20 min) — the daily default; the recommended ritual
//   - power    (~40 min) — high-energy days, weekend deeper sessions
//
// Stations are stored inline (not in a separate DB table) because presets
// are versioned with the code. User-authored circuits land later in their
// own table; that's a Pro+ feature for the composer.
//
// Each station carries `durationSeconds`, `voiceCue` (categories the bridge
// quote should pull from on the way INTO this station), and a free-form
// `config` object for station-specific tuning (target tap count, prompt
// text, etc).

import type { QuoteCategory } from "./nickQuotes";

export type StationType =
  | "open"
  | "check_in"
  | "breath"
  | "brain_quick"
  | "dexterity"
  | "word_quick"
  | "hydration"
  | "coach"
  | "community"
  | "reflection"
  | "close";

export interface CircuitStation {
  id: string; // unique within the circuit, used for completion logging
  type: StationType;
  title: string;
  /** One-line instruction shown above the timer. */
  instruction: string;
  durationSeconds: number;
  /** Categories the inbound bridge quote should prefer. */
  voiceCue: QuoteCategory[];
  /** Per-station tuning. */
  config?: Record<string, any>;
}

export interface CircuitPreset {
  slug: string;
  title: string;
  subtitle: string;
  /** How the picker should describe length, e.g. "~10 min". */
  lengthLabel: string;
  intensity: "gentle" | "standard" | "power";
  /** XP awarded on completion (per-station XP is tallied separately). */
  completionXp: number;
  stations: CircuitStation[];
}

// ──────────────────────────────────────────────────────────────────────
// Station factories — keep duration math + copy in one place.
// ──────────────────────────────────────────────────────────────────────

const open = (): CircuitStation => ({
  id: "open",
  type: "open",
  title: "Open the circuit",
  instruction: "Sit. Breathe in. Press start.",
  durationSeconds: 20,
  voiceCue: ["foundation", "identity"],
});

const checkIn = (sec = 60): CircuitStation => ({
  id: "check_in",
  type: "check_in",
  title: "Check in",
  instruction: "How does today feel? Tap one.",
  durationSeconds: sec,
  voiceCue: ["humanhood", "ownership"],
});

const breath = (sec = 60): CircuitStation => ({
  id: "breath",
  type: "breath",
  title: "Breath reset",
  instruction: "Follow the circle. In through the nose, out through the mouth.",
  durationSeconds: sec,
  voiceCue: ["practice", "reflection"],
  config: { pattern: "4-7-8" },
});

const brainQuick = (
  variantId: string,
  sec = 120,
  prompt = "Name three things you can see in this room.",
): CircuitStation => ({
  id: variantId,
  type: "brain_quick",
  title: "Quick brain",
  instruction: prompt,
  durationSeconds: sec,
  voiceCue: ["practice", "adaptation"],
  config: { prompt },
});

const dexterity = (sec = 60, target = 80): CircuitStation => ({
  id: "dexterity",
  type: "dexterity",
  title: "Tap the target",
  instruction: "Tap the button as fast and steady as you can.",
  durationSeconds: sec,
  voiceCue: ["movement", "repetition"],
  config: { targetTaps: target },
});

const wordQuick = (
  variantId: string,
  sec = 120,
  word = "RECOVERY",
): CircuitStation => ({
  id: variantId,
  type: "word_quick",
  title: "Word play",
  instruction: `How many real words can you find inside "${word}"?`,
  durationSeconds: sec,
  voiceCue: ["practice", "adaptation"],
  config: { sourceWord: word, targetCount: 8 },
});

const hydration = (sec = 45): CircuitStation => ({
  id: "hydration",
  type: "hydration",
  title: "Hydration break",
  instruction: "Take a slow sip. Then a full breath.",
  durationSeconds: sec,
  voiceCue: ["humanhood", "humor"],
});

const coach = (id = "coach", sec = 75): CircuitStation => ({
  id,
  type: "coach",
  title: "Coach moment",
  instruction: "Listen. This one's for today.",
  durationSeconds: sec,
  voiceCue: ["doctrine", "fuel", "identity"],
  config: { isCoachStation: true },
});

const community = (sec = 60): CircuitStation => ({
  id: "community",
  type: "community",
  title: "Survivor wall",
  instruction: "One survivor's post. Send a fire if it lands.",
  durationSeconds: sec,
  voiceCue: ["humanhood"],
});

const reflection = (sec = 75): CircuitStation => ({
  id: "reflection",
  type: "reflection",
  title: "One-line reflection",
  instruction: "One sentence. What did this circuit unlock?",
  durationSeconds: sec,
  voiceCue: ["reflection", "identity"],
});

const close = (): CircuitStation => ({
  id: "close",
  type: "close",
  title: "Close the circuit",
  instruction: "Done. Take the win.",
  durationSeconds: 30,
  voiceCue: ["humanhood", "doctrine", "night"],
});

// ──────────────────────────────────────────────────────────────────────
// Three presets — slugs are stable, used in URLs and analytics.
// ──────────────────────────────────────────────────────────────────────

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    slug: "quick",
    title: "Quick Circuit",
    subtitle: "Bad day? Just show up. ~10 minutes.",
    lengthLabel: "~10 min",
    intensity: "gentle",
    completionXp: 30,
    stations: [
      open(),
      checkIn(45),
      breath(60),
      brainQuick("brain_1", 120, "Name three foods you ate this week."),
      dexterity(60, 60),
      hydration(45),
      coach("coach_1", 60),
      reflection(60),
      close(),
    ],
  },
  {
    slug: "standard",
    title: "Standard Circuit",
    subtitle: "Today's recommended ritual. ~20 minutes.",
    lengthLabel: "~20 min",
    intensity: "standard",
    completionXp: 75,
    stations: [
      open(),
      checkIn(60),
      breath(60),
      brainQuick(
        "brain_1",
        150,
        "Count backward from 100 by 7s. Out loud is fine.",
      ),
      dexterity(75, 100),
      hydration(45),
      coach("coach_1", 90),
      wordQuick("word_1", 150, "RECOVERY"),
      community(60),
      brainQuick(
        "brain_2",
        120,
        "Name a city for every letter of your first name.",
      ),
      reflection(75),
      coach("coach_2", 45),
      close(),
    ],
  },
  {
    slug: "power",
    title: "Power Circuit",
    subtitle: "Good day? Push the build. ~40 minutes.",
    lengthLabel: "~40 min",
    intensity: "power",
    completionXp: 150,
    stations: [
      open(),
      checkIn(60),
      breath(75),
      brainQuick(
        "brain_1",
        180,
        "Spell five 5-letter words backward. Out loud or in your head.",
      ),
      dexterity(90, 140),
      hydration(45),
      coach("coach_1", 90),
      wordQuick("word_1", 180, "ARCHITECT"),
      brainQuick(
        "brain_2",
        180,
        "Name a song for every decade since you were born.",
      ),
      community(60),
      dexterity(90, 140),
      hydration(45),
      coach("coach_2", 90),
      wordQuick("word_2", 180, "SASQUATCH"),
      brainQuick(
        "brain_3",
        180,
        "Plan tomorrow's first hour out loud, step by step.",
      ),
      reflection(90),
      coach("coach_3", 60),
      close(),
    ],
  },
];

export function getCircuitBySlug(slug: string): CircuitPreset | null {
  return CIRCUIT_PRESETS.find((c) => c.slug === slug) ?? null;
}

export const CIRCUIT_SLUGS = CIRCUIT_PRESETS.map((c) => c.slug);
