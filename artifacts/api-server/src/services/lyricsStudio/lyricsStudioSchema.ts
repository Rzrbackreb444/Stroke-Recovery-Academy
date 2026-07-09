import { z } from "zod/v4";

export const SINGER_TYPES = ["male", "female", "duet", "auto"] as const;
export type SingerType = (typeof SINGER_TYPES)[number];

export const GENRES = [
  "hip-hop",
  "pop",
  "rock",
  "rnb",
  "country",
  "folk",
  "electronic",
  "indie",
  "soul",
  "gospel",
  "jazz",
  "industrial",
  "cinematic",
  "other",
] as const;
export type Genre = (typeof GENRES)[number];

export const singerSchema = z.enum(SINGER_TYPES);
export const genreSchema = z.enum(GENRES);

const lyricLineSchema = z.object({
  voice: z.string().max(120).nullable().optional(),
  direction: z.string().max(120).nullable().optional(),
  text: z.string().min(1).max(400),
});

const sectionSchema = z.object({
  label: z.string().min(1).max(40),
  sceneNote: z.string().max(800).nullable().optional(),
  lines: z.array(lyricLineSchema).min(1).max(40),
});

export const lyricsOutputSchema = z.object({
  shape: z.literal("lyrics"),
  title: z.string().min(1).max(120),
  styleHeader: z.object({
    style: z.string().min(1).max(160),
    tempo: z.string().min(1).max(120),
    vibe: z.string().min(1).max(240),
  }),
  sections: z.array(sectionSchema).min(2).max(16),
  hashtags: z.array(z.string().min(1).max(60)).max(20).optional().default([]),
  producerNotes: z.string().max(800).optional().default(""),
});
export type LyricsOutput = z.infer<typeof lyricsOutputSchema>;

const crisisActionSchema = z.object({
  type: z.enum(["tel", "sms", "url"]),
  value: z.string().min(1),
});
const crisisResourceSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  action: crisisActionSchema,
});

export const crisisResultSchema = z.object({
  shape: z.literal("crisis"),
  category: z.enum(["suicide", "self_harm", "violence", "abuse"]),
  message: z.string().min(1),
  resources: z.array(crisisResourceSchema).min(1),
});
export type CrisisResult = z.infer<typeof crisisResultSchema>;

export const refusalResultSchema = z.object({
  shape: z.literal("refused"),
  reason: z.string().min(1).max(400),
});
export type RefusalResult = z.infer<typeof refusalResultSchema>;

/**
 * Defensive JSON parsing. Mirrors recoveryAnchorSchema.safeParseJson —
 * strips ```json fences and isolates the outermost {...} so the model
 * cannot crash the engine by leaking prose around the payload.
 */
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
