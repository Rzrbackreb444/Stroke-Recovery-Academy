/**
 * Free Video Analysis Engine — stroke-recovery-specific multimodal analysis.
 *
 * Pipeline:
 *  1. Upload the local video file to the Gemini File API (no GCS bucket
 *     required — the file is hosted by Google for ~48h).
 *  2. Wait until the file enters the ACTIVE state (Gemini ingests video
 *     asynchronously; queries against a PROCESSING file return an error).
 *  3. Ask Gemini 2.5 Flash for a structured JSON analysis tailored to
 *     stroke recovery — speech, energy, mindset, momentum, plus concrete
 *     focus areas and recommended next-step exercises drawn from the
 *     platform's existing surface (Daily Circuit, Lyrics Studio, Brain Gym).
 *  4. Validate with Zod. On any model/JSON failure, surface a clean error
 *     so the route layer can mark the row as failed (the UI shows a
 *     graceful "we'll email you when it's ready" fallback).
 *
 * The analysis is *informational + motivational*, never diagnostic. The
 * prompt explicitly bans medical claims and instructs the model to flag
 * red-flag symptoms for human follow-up.
 */
import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { detectCrisis, buildCrisisResponse } from "../crisisDetection";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const MODEL = "gemini-2.5-flash";

// ───────────────────────────────────────────────────────────────────────
// Output contract — kept tight so the UI can render confidently.
// ───────────────────────────────────────────────────────────────────────
export const analysisOutputSchema = z.object({
  // 1-2 sentence headline framing the survivor's submission.
  headline: z.string().min(8).max(180),
  // 2-4 sentence warm summary of what we observed.
  summary: z.string().min(40).max(900),
  // Direct, hopeful note from "Coach Sasquatch" voice.
  encouragement: z.string().min(20).max(600),
  // Four 0-100 sub-scores. Honest, never inflated. Use whole numbers.
  scoreBreakdown: z.object({
    speech: z.number().int().min(0).max(100),
    energy: z.number().int().min(0).max(100),
    mindset: z.number().int().min(0).max(100),
    momentum: z.number().int().min(0).max(100),
  }),
  // 2-5 observed wins. Specific, evidence-grounded.
  progressSignals: z.array(z.object({
    label: z.string().min(2).max(80),
    evidence: z.string().min(8).max(280),
  })).min(2).max(5),
  // 2-4 strengths to lean on.
  strengthAreas: z.array(z.object({
    area: z.string().min(2).max(60),
    insight: z.string().min(8).max(280),
  })).min(2).max(4),
  // 2-4 focus areas with the *next concrete step* — never a diagnosis.
  focusAreas: z.array(z.object({
    area: z.string().min(2).max(60),
    nextStep: z.string().min(8).max(280),
  })).min(2).max(4),
  // 2-5 platform exercises to try. Use names the platform actually has:
  // Daily Circuit, Lyrics Studio, Motivation Studio, Brain Gym, Recovery
  // Anthem, Coach Sasquatch, Recovery Anchor.
  recommendedExercises: z.array(z.object({
    name: z.string().min(2).max(60),
    reason: z.string().min(8).max(280),
  })).min(2).max(5),
  // A 1-2 sentence quote suitable for use as a public testimonial. Quotes
  // the survivor's own words from the transcript when possible. Empty
  // string is allowed if nothing testimonial-worthy was said.
  publishableQuote: z.string().max(400).default(""),
  // Safety: list any red-flag observations that warrant human follow-up
  // (slurred speech worsening, facial droop, confusion, severe weakness).
  // Empty array if none.
  redFlags: z.array(z.string().min(4).max(200)).max(5).default([]),
});
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;

interface AnalyzeInput {
  filePath: string;
  mimeType: string;
  name: string;
  storyText?: string | null;
  recoveryStage?: string | null;
  focusArea?: string | null;
  transcript?: string | null;
}

export interface AnalyzeResult {
  shape: "analysis" | "crisis" | "failed";
  output?: AnalysisOutput;
  crisis?: { category: string; message: string; resources: string[] };
  errorMessage?: string;
}

// ───────────────────────────────────────────────────────────────────────
// Prompt — opinionated, voice-consistent with the rest of the platform.
// ───────────────────────────────────────────────────────────────────────
function buildPrompt(input: AnalyzeInput): string {
  const safeName = (input.name || "the survivor").trim().slice(0, 80);
  const story = (input.storyText || "").trim().slice(0, 2000);
  const stage = (input.recoveryStage || "unknown").trim().slice(0, 40);
  const focus = (input.focusArea || "overall").trim().slice(0, 40);
  const transcript = (input.transcript || "").trim().slice(0, 4000);

  return `You are the analysis engine behind Stroke Recovery Academy's
"Free Video Analysis" funnel. A survivor uploaded a short recovery video
and is asking you for an honest, motivating, non-medical reading of
where they're at and what to try next.

VOICE
- Warm, direct, no fluff. Coach-Sasquatch energy: respect the work,
  honor the fight, never patronize.
- Talk like a human, not a clinician. No "patient", no "subject",
  no "presents with". Use the survivor's name when natural.
- Honor the source material. If the survivor said something striking,
  echo it back in their language.

NEVER DO
- Never diagnose. Never prescribe. Never name medications, dosages,
  procedures, or therapy protocols by clinical name.
- Never claim certainty about cause or prognosis.
- Never grade lower than the evidence supports just to seem rigorous,
  and never inflate scores to be nice. Be honest. Be specific.

ALWAYS DO
- Treat showing up as the win. Effort beats outcome on day one.
- Ground every observation in something visible/audible in the video
  or stated in the transcript/story. If you can't ground it, drop it.
- If you spot anything that warrants human follow-up (worsening slurred
  speech, facial asymmetry, confusion, severe new weakness, signs of
  distress), put it in redFlags verbatim. This list is read by a human.

CONTEXT FROM THE SUBMITTER
- Name: ${safeName}
- Stated recovery stage: ${stage}
- Stated focus area: ${focus}
- Their story (their own words):
${story || "(none provided)"}
- Audio transcript (best-effort, may be partial):
${transcript || "(no transcript available)"}

TASK
Watch the video and read the context. Produce a single JSON object that
matches this exact shape. No prose outside JSON. No markdown. No code
fences.

{
  "headline": "1-2 sentences framing what you saw. Specific. Hopeful but honest.",
  "summary": "2-4 sentences. What is happening in this video, in plain English.",
  "encouragement": "2-4 sentences directly to ${safeName}. Use their name. Speak from the platform's coach voice.",
  "scoreBreakdown": {
    "speech":   <int 0-100, clarity + cadence + word-finding from the transcript/audio>,
    "energy":   <int 0-100, presence + animation + audible drive>,
    "mindset":  <int 0-100, framing + agency + tone toward the work>,
    "momentum": <int 0-100, evidence of repetition / consistency / forward motion>
  },
  "progressSignals": [ { "label": "...", "evidence": "..." }, ... 2-5 items ],
  "strengthAreas":   [ { "area":  "...", "insight":  "..." }, ... 2-4 items ],
  "focusAreas":      [ { "area":  "...", "nextStep": "..." }, ... 2-4 items ],
  "recommendedExercises": [
    { "name": "<one of: Daily Circuit | Lyrics Studio | Motivation Studio | Brain Gym | Recovery Anthem | Coach Sasquatch | Recovery Anchor>",
      "reason": "Why this fits *this* survivor's video." },
    ... 2-5 items
  ],
  "publishableQuote": "1-2 sentence quote we could feature as a public testimonial. Prefer the survivor's own words. Empty string if nothing testimonial-worthy was said.",
  "redFlags": [ "verbatim observation a human moderator should see" ]   // [] if none
}

LIMITS (hard)
- headline ≤ 180 chars. summary ≤ 900. encouragement ≤ 600.
- Each label/area ≤ 60-80 chars. Each evidence/insight/nextStep/reason ≤ 280.
- publishableQuote ≤ 400. Each redFlag ≤ 200, max 5 entries.
- All scores are whole integers in [0, 100].

Return ONLY the JSON object.`;
}

// ───────────────────────────────────────────────────────────────────────
// File API helpers
// ───────────────────────────────────────────────────────────────────────
//
// IMPORTANT: the upload helper writes the returned file name into the
// caller-provided `tracker` BEFORE we start polling for ACTIVE. That way
// if ingest polling times out (or the network blips mid-poll), the outer
// finally block still has a handle to delete and we don't leak files
// against our Gemini quota.
async function uploadAndWaitActive(
  filePath: string,
  mimeType: string,
  tracker: { name?: string },
) {
  const stat = await fs.promises.stat(filePath);
  if (stat.size === 0) throw new Error("Uploaded video file is empty.");

  const uploaded: any = await (ai as any).files.upload({
    file: filePath,
    config: { mimeType },
  });
  let file: any = uploaded;
  const fileName: string | undefined = file?.name;
  if (!fileName) throw new Error("Gemini File API did not return a file name.");
  tracker.name = fileName; // record IMMEDIATELY so cleanup always finds it

  // Poll until ACTIVE (or fail). Cap at 90s — short clips are usually
  // active in 5-15s; we don't want the BG worker to hang forever.
  const startedAt = Date.now();
  const maxWaitMs = 90_000;
  while (file?.state === "PROCESSING" || file?.state === undefined) {
    if (Date.now() - startedAt > maxWaitMs) {
      throw new Error("Gemini took too long to ingest the video. Try a shorter clip (≤60s).");
    }
    await new Promise((r) => setTimeout(r, 2_000));
    file = await (ai as any).files.get({ name: fileName });
    if (!file) throw new Error("Lost the uploaded file handle.");
  }
  if (file.state !== "ACTIVE") {
    throw new Error(`Gemini could not process the video (state=${file.state}).`);
  }
  return file;
}

async function deleteFileSilently(fileName: string | undefined) {
  if (!fileName) return;
  try {
    await (ai as any).files.delete({ name: fileName });
  } catch {
    // Best-effort cleanup; Google purges File API uploads after ~48h anyway.
  }
}

// ───────────────────────────────────────────────────────────────────────
// Public entry point
// ───────────────────────────────────────────────────────────────────────
export async function analyzeFreeVideo(input: AnalyzeInput): Promise<AnalyzeResult> {
  // 1. Pre-LLM crisis gate. The story text is the most likely place a
  //    survivor in crisis would type a plea — keep the same gate as the
  //    rest of the platform.
  if (input.storyText) {
    const c = detectCrisis(input.storyText);
    if (c.detected && c.category) {
      const cr = buildCrisisResponse(c.category);
      return { shape: "crisis", crisis: { category: c.category, message: cr.response, resources: cr.resources } };
    }
  }
  if (input.transcript) {
    const c = detectCrisis(input.transcript);
    if (c.detected && c.category) {
      const cr = buildCrisisResponse(c.category);
      return { shape: "crisis", crisis: { category: c.category, message: cr.response, resources: cr.resources } };
    }
  }

  // 2. Upload + wait until Gemini has ingested the video. The tracker
  //    captures the file name the moment upload returns, so the finally
  //    block can always reclaim it — even if ingest polling times out.
  const tracker: { name?: string } = {};
  try {
    const geminiFile = await uploadAndWaitActive(input.filePath, input.mimeType, tracker);

    // 3. Generate structured analysis. JSON mode + tight token budget.
    const prompt = buildPrompt(input);
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: "user",
        parts: [
          { fileData: { fileUri: geminiFile.uri, mimeType: input.mimeType } } as any,
          { text: prompt },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const raw = (r as any).text || "";
    if (!raw) throw new Error("Gemini returned an empty response.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Gemini returned malformed JSON.");
    }

    const result = analysisOutputSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Analysis JSON failed validation: ${issues}`);
    }

    return { shape: "analysis", output: result.data };
  } catch (err: any) {
    return { shape: "failed", errorMessage: err?.message || "Analysis failed." };
  } finally {
    await deleteFileSilently(tracker.name);
  }
}
