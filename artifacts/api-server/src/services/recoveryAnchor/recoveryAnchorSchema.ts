import { z } from "zod/v4";

export const ANCHOR_TYPES = ["affirmation", "speech", "memory"] as const;
export type AnchorType = (typeof ANCHOR_TYPES)[number];

export const anchorTypeSchema = z.enum(ANCHOR_TYPES);

const callResponseSchema = z.object({
  sasquatch: z.array(z.string().min(1).max(80)).min(1).max(8),
  you: z.array(z.string().min(1).max(80)).min(1).max(8),
});

const mnemonicSchema = z.object({
  facts: z.array(z.string().min(1).max(140)).min(1).max(8),
  hookStamp: z.string().min(1).max(80),
});

export const anchorOutputSchema = z.object({
  shape: z.literal("anchor"),
  anchorType: anchorTypeSchema,
  title: z.string().min(1).max(80),
  lines: z.array(z.string().min(1).max(160)).min(1).max(12),
  callResponse: callResponseSchema.optional().nullable(),
  mnemonic: mnemonicSchema.optional().nullable(),
  producerNotes: z.string().min(1).max(800),
  realityFooter: z.string().min(1).max(400),
});
export type AnchorOutput = z.infer<typeof anchorOutputSchema>;

const crisisActionSchema = z.object({
  type: z.enum(["tel", "sms", "url"]),
  value: z.string().min(1),
});

const crisisResourceSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  action: crisisActionSchema,
});

export const crisisOutputSchema = z.object({
  shape: z.literal("crisis"),
  category: z.enum(["suicide", "self_harm", "violence", "abuse"]),
  message: z.string().min(1),
  resources: z.array(crisisResourceSchema).min(1),
});
export type CrisisOutput = z.infer<typeof crisisOutputSchema>;

export const clarificationOutputSchema = z.object({
  shape: z.literal("needs_clarification"),
  question: z.string().min(1).max(280),
  reason: z.string().max(400).optional().default(""),
});
export type ClarificationOutput = z.infer<typeof clarificationOutputSchema>;

export const refusalOutputSchema = z.object({
  shape: z.literal("refused"),
  reason: z.string().min(1).max(400),
});
export type RefusalOutput = z.infer<typeof refusalOutputSchema>;

// Pass-1 classifier output. Strictly internal — never returned raw to client.
export const passOneOutputSchema = z.object({
  disposition: z.enum(["clear", "personal_crisis", "needs_clarification", "refused"]),
  crisisCategory: z.enum(["suicide", "self_harm", "violence", "abuse"]).nullable().optional(),
  purposeAnchor: z.string().max(280).nullable().optional(),
  clarificationQuestion: z.string().max(280).nullable().optional(),
  clarificationReason: z.string().max(400).nullable().optional(),
  refusalReason: z.string().max(400).nullable().optional(),
  // The Audit (free preview) returns this skeleton without invoking Pass 2.
  previewLines: z.array(z.string().min(1).max(160)).max(8).nullable().optional(),
  previewProducerNotes: z.string().max(600).nullable().optional(),
});
export type PassOneOutput = z.infer<typeof passOneOutputSchema>;

/**
 * Defensive JSON parsing. LLMs occasionally wrap JSON in ```json fences or
 * leak prose around the payload. Strip fences, find the outermost {...},
 * then JSON.parse. Throws on unrecoverable payloads.
 */
export function safeParseJson(raw: string): unknown {
  if (!raw || typeof raw !== "string") throw new Error("empty model output");
  let s = raw.trim();
  // Strip ```json … ``` or ``` … ``` fences.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  // If there's prose, isolate the outermost JSON object.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("no JSON object in model output");
  }
  const candidate = s.slice(first, last + 1);
  return JSON.parse(candidate);
}
