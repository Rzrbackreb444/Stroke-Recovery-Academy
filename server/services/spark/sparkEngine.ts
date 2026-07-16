import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SASQUATCH_VOICE = `You are the Stroked-Out Sasquatch — the voice of Nick Kremers, a hemorrhagic-stroke survivor who went from 0% function to ~90% recovery. Write in HIS voice:
- Terse, punchy, decisive. Short sentences. Em-dashes for punch.
- Straight quotes only (' and "), never curly.
- Fellow-survivor tone: lived-in, blunt, warm underneath the grit. No corporate polish.
- Never diagnose or give medical instructions. This is accountability and mindset — new symptoms go to a doctor.
- No emojis, ever.
- Reference the recovery frameworks only when they fit naturally (Think-Twitch-Move, Never Zero, small victories compound).`;

export const sparkDraftSchema = z.object({
  title: z.string().min(4).max(120),
  subject: z.string().min(4).max(120),
  category: z.enum(["motivation", "exercise", "mindset", "science"]),
  teaser: z.string().min(40).max(1200),
  body: z.string().min(200).max(12000),
  tags: z.array(z.string().max(40)).max(8).default([]),
});
export type SparkDraft = z.infer<typeof sparkDraftSchema>;

function safeParseJson(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s);
}

export async function generateSparkDraft(opts: {
  atoms: string[];
  category?: string;
  angle?: string;
}): Promise<SparkDraft> {
  const { atoms, category, angle } = opts;
  const source = atoms.map((a, i) => `[${i + 1}] ${a}`).join("\n\n");

  const prompt = [
    SASQUATCH_VOICE,
    "",
    "TASK: Compose one weekly 'Spark' — a self-contained piece of recovery fuel drawn from the source excerpts below. It ships two ways, so produce BOTH:",
    "- teaser: a public preview (2-4 short paragraphs) that hooks a stroke survivor and stops COLD right before the payoff. It must make them want the rest. Do NOT resolve the main insight.",
    "- body: the full subscriber edition (600-1000 words) — the complete Spark with the payoff, the how, and a closing gut-punch line. Markdown allowed (## headings, **bold**, - lists).",
    "",
    category ? `Preferred category: ${category}` : "Pick the best category.",
    angle ? `Angle/theme to lean into: ${angle}` : "",
    "",
    "SOURCE EXCERPTS (Nick's manuscript — draw from these, do not invent medical claims):",
    source,
    "",
    "Return STRICT JSON only, no prose, no code fences, matching:",
    `{"title": string, "subject": string (email subject line, punchy), "category": "motivation"|"exercise"|"mindset"|"science", "teaser": string, "body": string, "tags": string[]}`,
  ].join("\n");

  const r = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.85 },
  });

  const raw = (r.text || "").trim();
  return sparkDraftSchema.parse(safeParseJson(raw));
}
