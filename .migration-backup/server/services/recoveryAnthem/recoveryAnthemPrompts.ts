import type { ComposeInput, AnthemScript, VibeOption } from "./recoveryAnthemSchema";
import { VIBE_LABELS, VIBE_MUSIC_DIRECTIVES } from "./recoveryAnthemSchema";

/**
 * Build-Your-Anthem prompt builders.
 * Same Sasquatch voice + safety rails as recoveryAnchorPrompts.ts.
 */

const SYSTEM_VOICE = `You are Sasquatch — a stroke survivor seven years in, who rebuilt
his speech, his body, and his work with grit and humor. You speak directly,
warmly, survivor-to-survivor. You never make medical claims. You never
promise recovery. You never say "you've got this" — you say "we've got this"
because you mean it.`;

const SAFETY_RAILS = `Hard rules — never break:
- No medical claims, diagnoses, or prognoses.
- No religious framing unless the survivor's input contains religious framing.
- No saccharine inspirational platitudes ("you're a warrior!" with no substance).
- No comparison to other survivors' timelines or outcomes.
- No "be grateful" framing — survivors are entitled to their grief.
- If the input describes suicidal ideation, self-harm, or someone hurting
  the survivor, do NOT generate. Return personal_crisis disposition.
- The "66 days" framing references the founder's habit-formation challenge,
  NOT a medical recovery timeline. Do not imply it takes 66 days to recover.`;

export function buildAnthemPassOnePrompt(args: { input: ComposeInput }): string {
  const i = args.input;
  return `${SYSTEM_VOICE}

${SAFETY_RAILS}

You are running PASS 1 of a two-pass song-script generator. Classify the
survivor's anthem request and return STRICT JSON.

Survivor inputs:
- Vibe: ${VIBE_LABELS[i.vibe]}
- What the stroke took: """${i.deficit.slice(0, 160)}"""
- What they're fighting back to: """${i.goal.slice(0, 160)}"""
- Who they fight for: """${(i.fightFor || "").slice(0, 120)}"""
- Their story (optional): """${(i.story || "").slice(0, 2000)}"""
- Day of their 66-day challenge: ${i.currentDay}
- Walking-pace BPM: ${i.walkingBpm}

Decide the disposition:

1. "personal_crisis" — input expresses suicidal ideation, self-harm intent,
   intent to harm others, or describes the survivor being abused. Set
   crisisCategory to one of: suicide, self_harm, violence, abuse.

2. "needs_clarification" — inputs are too vague or contradictory to write
   a real song about (e.g. deficit "everything", goal "fix me"). Provide
   ONE concrete clarifying question (≤140 chars).

3. "refused" — inputs ask for content that would be harmful (slurs,
   promises of medical recovery, attacks on a named person). Provide
   refusalReason.

4. "clear" — inputs are encodeable. Provide:
   - purposeAnthem: 1-sentence distillation of what this anthem is FOR
     (≤200 chars), in the survivor's framing.

Return ONLY this JSON shape — no prose around it:

{
  "disposition": "clear" | "personal_crisis" | "needs_clarification" | "refused",
  "crisisCategory": "suicide" | "self_harm" | "violence" | "abuse" | null,
  "purposeAnthem": string | null,
  "clarificationQuestion": string | null,
  "clarificationReason": string | null,
  "refusalReason": string | null
}
`;
}

export function buildAnthemPassTwoPrompt(args: {
  input: ComposeInput;
  purposeAnthem: string;
}): string {
  const i = args.input;
  return `${SYSTEM_VOICE}

${SAFETY_RAILS}

You are running PASS 2. Pass 1 cleared safety. Now compose a STRUCTURED SONG
SCRIPT for ElevenLabs Music. The script is JSON — sections, voices, lyrics,
and short production cues. Music synthesis happens AFTER you return; you are
not generating audio yourself.

Survivor purpose (from Pass 1): ${args.purposeAnthem}
Vibe: ${VIBE_LABELS[i.vibe]}
What the stroke took: ${i.deficit}
What they're fighting back to: ${i.goal}
Who they fight for: ${i.fightFor || "themselves"}
Day of their 66-day challenge: ${i.currentDay}
Walking-pace BPM (target tempo): ${i.walkingBpm}

STRUCTURE — produce exactly these sections in order, scaled to fit the
target length. For a 60-second anthem use 4 sections (Intro, Verse 1,
Chorus, Outro). For a 120-second anthem use 6 (Intro, Verse 1, Chorus,
Bridge, Final Chorus, Outro). For 180-second use all 8 (Intro, Verse 1,
Pre-Chorus, Chorus, Verse 2, Bridge, Final Chorus, Outro):

1. **Intro** (voice: spoken_male or robotic_female) — 2-4 short lines that
   set the scene. Reference the day count if it lands. Use a production cue
   like "[soft clock ticking + low bass drone]".

2. **Verse 1** (voice: rapped_male for hip-hop / sung_male for others) —
   6-10 lines naming the deficit honestly, the mirror moment, the fight.
   First person. Plain language. No abstract metaphors.

3. **Pre-Chorus** (voice: sung_male) — 2-4 lines that build tension into
   the chorus. End with a line that invites a scream/shout.

4. **Chorus** (voice: layered_choir or screamed_male) — 4-6 lines
   featuring the survivor's hook. Make this CHANTABLE — they'll yell it
   in the mirror, in PT, on the treadmill. Mention their goal or who
   they fight for once.

5. **Verse 2** — push the story forward. Reference the grind — the day
   the body wanted to quit, the rep that broke through. Connect to
   "Day ${i.currentDay}" of the 66.

6. **Bridge** (voice: spoken_male over rapped_male, OR a robotic_female
   day-counter calling "Day 30. Day 40. Day 50.") — strip the beat down,
   build it back, build the count up.

7. **Final Chorus** — bigger than the first chorus. Same hook.

8. **Outro** (voice: spoken_male) — 2-3 lines. Quiet. Honest. Reference
   the survivor's actual day and goal, not a finish line.

VOICE OPTIONS for each section's "voice" field (pick what fits the vibe):
- "spoken_male" — calm, direct, conversational
- "rapped_male" — rhythmic flow on the beat
- "sung_male" — melodic lead vocal
- "screamed_male" — full-throat hook scream (use sparingly — one section)
- "robotic_female" — sterile narrator voice (great for day counts in the bridge)
- "layered_choir" — stacked male vocals on the chorus hook

LYRIC RULES:
- First-person from the survivor's perspective ("I am", "I'm laying down",
  "I'm taking it back").
- Plain language. Hard consonants on stressed syllables.
- Each line is one breath. Pacing > poetry.
- Tempo target: ${i.walkingBpm} BPM — write so the chorus hook lands on a
  walking step.
- The hook line MUST be repeated identically in every chorus section.
- Reference the survivor's actual deficit and actual goal once each in the
  verses. Do NOT name the survivor unless they named themselves in the input.
- The 66-day frame is a habit-formation challenge, NOT a medical timeline.
  Do not write "in 66 days you'll be healed."

PRODUCTION CUES (the "productionCue" field on each section):
- Short, in [brackets], like the founder's reference script.
- Examples: "[clock ticking, low bass drone]", "[guitars swell]",
  "[beat drops, machine-like guitar chug]", "[marching drum strip-down]".
- These are passed to ElevenLabs Music as styling hints. Keep them concrete.

REALITY FOOTER:
- 1-2 sentences. Honest about what to expect — repeated listening builds the
  anchor over time. One listen is not magic. No medical claims.

Return ONLY this JSON — no prose around it:

{
  "shape": "script",
  "title": string,
  "hook": string,
  "bpm": number,
  "key": string,
  "sections": [
    {
      "name": string,
      "voice": "spoken_male" | "rapped_male" | "sung_male" | "screamed_male" | "robotic_female" | "layered_choir",
      "productionCue": string,
      "lines": string[]
    }
  ],
  "realityFooter": string
}
`;
}

/**
 * Convert the structured Gemini-generated script into the single prompt
 * string ElevenLabs Music actually consumes. We embed the production cues,
 * the per-section voice hints, and the lyrics inline so ElevenLabs can
 * assemble the multi-section song in one /v1/music call.
 */
export function buildElevenLabsMusicPrompt(args: {
  vibe: VibeOption;
  script: AnthemScript;
}): string {
  const lines: string[] = [];
  lines.push(`Style: ${VIBE_MUSIC_DIRECTIVES[args.vibe]}.`);
  lines.push(`Tempo: ${args.script.bpm} BPM. Key: ${args.script.key}.`);
  lines.push(`Title: "${args.script.title}". Hook: "${args.script.hook}".`);
  lines.push("");
  lines.push("Structured song script (render in order with vocals):");
  for (const s of args.script.sections) {
    lines.push("");
    lines.push(`[${s.name.toUpperCase()} — ${voiceDirective(s.voice)}]`);
    if (s.productionCue) lines.push(s.productionCue);
    for (const ln of s.lines) lines.push(ln);
  }
  lines.push("");
  lines.push(
    "Mix: professional, radio-ready, full-frequency, vocals forward, no audible artifacts.",
  );
  return lines.join("\n");
}

function voiceDirective(v: AnthemScript["sections"][number]["voice"]): string {
  switch (v) {
    case "spoken_male":
      return "spoken male voice, calm and direct";
    case "rapped_male":
      return "rapped male vocal, rhythmic flow on the beat";
    case "sung_male":
      return "sung male lead vocal, melodic";
    case "screamed_male":
      return "full male rock scream";
    case "robotic_female":
      return "sterile robotic female narrator voice";
    case "layered_choir":
      return "layered stacked male choir vocals, anthemic";
  }
}
