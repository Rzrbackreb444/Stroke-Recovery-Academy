import { z } from "zod/v4";

/**
 * Build-Your-Anthem — schemas + safe JSON parser.
 *
 * Mirrors the recoveryAnchorSchema patterns: strict zod everywhere, defensive
 * JSON parsing for LLM output (fence-stripping + outermost-{} extraction),
 * audit-then-render disposition shapes.
 */

export const VIBE_OPTIONS = [
  "rock_anthem",
  "hip_hop_fight",
  "country_grit",
  "gospel_rise",
  "lofi_recovery",
  "ambient_meditation",
] as const;
export type VibeOption = (typeof VIBE_OPTIONS)[number];

export const VIBE_LABELS: Record<VibeOption, string> = {
  rock_anthem: "Rock Anthem",
  hip_hop_fight: "Hip-Hop Fight Song",
  country_grit: "Country Grit",
  gospel_rise: "Gospel Rise",
  lofi_recovery: "Lo-Fi Recovery",
  ambient_meditation: "Ambient Meditation",
};

// What we send to ElevenLabs Music as part of the prompt.
export const VIBE_MUSIC_DIRECTIVES: Record<VibeOption, string> = {
  rock_anthem:
    "hard rock anthem, driving electric guitars with overdrive, thundering kit drums, anthemic male lead vocals, layered chorus shouts, scream-able hook, professionally mixed and mastered",
  hip_hop_fight:
    "hard-hitting hip hop fight song, punchy 808 bass, crisp snares, trap hi-hats, confident male rap vocal with conviction, anthemic chant chorus, professionally mixed",
  country_grit:
    "modern country grit, twangy telecaster guitars, driving acoustic strum, pedal steel, weathered male lead vocal, heartland chorus harmonies, professionally produced",
  gospel_rise:
    "uplifting gospel rise, hammond organ, piano, choir backing vocals on choruses, soulful male lead vocal building to triumph, hand-claps, full live band, professionally produced",
  lofi_recovery:
    "warm lo-fi recovery beat, dusty boom-bap drums, mellow chords, vinyl crackle, calm spoken-sung male vocal, jazz-inflected, professionally mixed at conversational volume",
  ambient_meditation:
    "peaceful ambient meditation, soft warm pads, gentle piano, breath-paced rhythm, calm spoken male vocal in measured tempo, no aggressive percussion, suitable for healing breath work",
};

export const composeInputSchema = z.object({
  vibe: z.enum(VIBE_OPTIONS),
  // What the survivor wants to fight back to (e.g. "hold my grandson").
  goal: z.string().min(2).max(160),
  // What the stroke took (e.g. "left arm, my voice").
  deficit: z.string().min(2).max(160),
  // Who they fight for (name, "myself", "my kids" — optional).
  fightFor: z.string().max(120).optional().default(""),
  // Optional richer story (their own words). Capped to keep the LLM focused.
  story: z.string().max(2000).optional().default(""),
  // 0-66 — auto-pulled from challenge progress when caller has it; defaults
  // to 1 ("Day one starts now") when omitted. We do not promise the medical
  // 66-day claim — the number drives lyric phrasing only.
  currentDay: z.number().int().min(1).max(66).optional().default(1),
  // Walking-pace BPM. 60-140 covers nearly all post-stroke gait targets.
  // Used both as a Lyric-tempo cue and as input to the music prompt.
  walkingBpm: z.number().int().min(50).max(180).optional().default(90),
  // Length in seconds. Free tier locked to 60s, premium up to 180s.
  lengthSec: z.number().int().min(20).max(180).optional().default(60),
});
export type ComposeInput = z.infer<typeof composeInputSchema>;

// One section of the structured song script. Maps roughly 1:1 to the
// example the founder pasted (Intro / Verse / Pre-Chorus / Chorus / Bridge /
// Final Chorus / Outro). The "voice" hint informs ElevenLabs Music vocal
// rendering (rap vs sung vs scream vs spoken vs robotic-female narrator).
const sectionSchema = z.object({
  name: z.string().min(1).max(40),
  voice: z.enum([
    "spoken_male",
    "rapped_male",
    "sung_male",
    "screamed_male",
    "robotic_female",
    "layered_choir",
  ]),
  // Sound-design / production cue for ElevenLabs Music ("[clock ticking]" etc).
  productionCue: z.string().max(200).optional().default(""),
  lines: z.array(z.string().min(1).max(200)).min(1).max(20),
});

export const anthemScriptSchema = z.object({
  shape: z.literal("script"),
  title: z.string().min(2).max(80),
  hook: z.string().min(2).max(200), // The chant line — what they'll yell in the mirror
  bpm: z.number().int().min(50).max(200),
  key: z.string().min(1).max(20).optional().default("E minor"),
  sections: z.array(sectionSchema).min(3).max(12),
  realityFooter: z.string().min(1).max(400),
});
export type AnthemScript = z.infer<typeof anthemScriptSchema>;

// Pass-1 disposition. Same shape family as the Anchor engine for consistency.
export const passOneOutputSchema = z.object({
  disposition: z.enum(["clear", "personal_crisis", "needs_clarification", "refused"]),
  crisisCategory: z.enum(["suicide", "self_harm", "violence", "abuse"]).nullable().optional(),
  // Distilled 1-sentence version of what the survivor wants encoded in the song.
  purposeAnthem: z.string().max(280).nullable().optional(),
  clarificationQuestion: z.string().max(280).nullable().optional(),
  clarificationReason: z.string().max(400).nullable().optional(),
  refusalReason: z.string().max(400).nullable().optional(),
});
export type PassOneOutput = z.infer<typeof passOneOutputSchema>;

export function safeParseJson(raw: string): unknown {
  if (!raw || typeof raw !== "string") throw new Error("empty model output");
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("no JSON object in model output");
  }
  return JSON.parse(s.slice(first, last + 1));
}
