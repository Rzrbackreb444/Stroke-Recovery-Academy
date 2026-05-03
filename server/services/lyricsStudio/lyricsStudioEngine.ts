import { GoogleGenAI } from "@google/genai";
import { detectCrisis, buildCrisisResponse } from "../crisisDetection";
import {
  lyricsOutputSchema,
  safeParseJson,
  type LyricsOutput,
  type CrisisResult,
  type Genre,
  type RefusalResult,
  type SingerType,
} from "./lyricsStudioSchema";
import { buildLyricsPrompt } from "./lyricsStudioPrompts";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const MODEL = "gemini-2.5-flash";

export type EngineLyricsResult = { shape: "lyrics"; output: LyricsOutput };
export type EngineResult = EngineLyricsResult | CrisisResult | RefusalResult;

interface EngineInput {
  userId: string;
  storyText: string;
  genre: Genre;
  singer: SingerType;
}

export async function generateLyrics(input: EngineInput): Promise<EngineResult> {
  // 1. Pre-LLM regex crisis gate. Same engine as Coach + Anchor Studio.
  const regex = detectCrisis(input.storyText);
  if (regex.detected && regex.category) {
    const cr = buildCrisisResponse(regex.category);
    return {
      shape: "crisis",
      category: regex.category,
      message: cr.response,
      resources: cr.resources,
    };
  }

  // 2. Single Gemini pass — JSON-mode + zod validation.
  const prompt = buildLyricsPrompt({
    storyText: input.storyText,
    genre: input.genre,
    singer: input.singer,
  });

  let raw: string;
  try {
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });
    raw = (r.text || "").trim();
  } catch (e: any) {
    throw new Error("gemini_failed: " + (e?.message ?? "unknown"));
  }

  let parsed: any;
  try {
    parsed = safeParseJson(raw);
  } catch (e: any) {
    throw new Error("parse_failed: " + (e?.message ?? "unknown"));
  }

  // 3. Branch on declared shape.
  const shape = parsed?.shape;

  if (shape === "crisis") {
    const cat = parsed?.category as CrisisResult["category"] | undefined;
    const valid = cat && ["suicide", "self_harm", "violence", "abuse"].includes(cat);
    const fallback: CrisisResult["category"] = valid ? cat! : "suicide";
    const cr = buildCrisisResponse(fallback);
    return {
      shape: "crisis",
      category: fallback,
      message: cr.response,
      resources: cr.resources,
    };
  }

  if (shape === "refused") {
    const reason = String(parsed?.refusalReason ?? "I can't write that one safely.").slice(0, 400);
    return { shape: "refused", reason };
  }

  // shape === "lyrics" — strict zod parse on the lyric body.
  const stripped = {
    shape: "lyrics" as const,
    title: parsed?.title,
    styleHeader: parsed?.styleHeader,
    sections: parsed?.sections,
    hashtags: parsed?.hashtags ?? [],
    producerNotes: parsed?.producerNotes ?? "",
  };
  const output = lyricsOutputSchema.parse(stripped);
  return { shape: "lyrics", output };
}
