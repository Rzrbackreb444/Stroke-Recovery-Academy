import { GoogleGenAI } from "@google/genai";
import { db } from "../../db";
import { recoveryAnthemAudit } from "@shared/schema";
import { detectCrisis, buildCrisisResponse } from "../crisisDetection";
import {
  anthemScriptSchema,
  passOneOutputSchema,
  safeParseJson,
  type AnthemScript,
  type ComposeInput,
  type PassOneOutput,
} from "./recoveryAnthemSchema";
import {
  buildAnthemPassOnePrompt,
  buildAnthemPassTwoPrompt,
  buildElevenLabsMusicPrompt,
} from "./recoveryAnthemPrompts";
import { getElevenLabsService } from "../../elevenlabs";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const MODEL = "gemini-2.5-flash";

export type EngineCrisisResult = {
  shape: "crisis";
  category: "suicide" | "self_harm" | "violence" | "abuse";
  message: string;
  resources: ReturnType<typeof buildCrisisResponse>["resources"];
};

export type EngineClarificationResult = {
  shape: "needs_clarification";
  question: string;
  reason: string;
};

export type EngineRefusedResult = {
  shape: "refused";
  reason: string;
};

export type EngineScriptResult = {
  shape: "script";
  script: AnthemScript;
  purposeAnthem: string;
};

export type EngineAnthemResult = {
  shape: "anthem";
  script: AnthemScript;
  purposeAnthem: string;
  audioBase64: string;
  audioMimeType: string;
  durationMs: number;
};

export type EngineResult =
  | EngineCrisisResult
  | EngineClarificationResult
  | EngineRefusedResult
  | EngineScriptResult
  | EngineAnthemResult;

interface EngineCallArgs {
  userId: string;
  input: ComposeInput;
}

/**
 * Free preview tier — runs crisis gates + Pass 1 + Pass 2 (script only).
 * Does NOT call ElevenLabs Music. Survivor sees the lyrics they'd render.
 */
export async function previewAnthem(args: EngineCallArgs): Promise<EngineResult> {
  return runEngine(args, /* fullRender */ false);
}

/**
 * Paid tier — runs the full pipeline through ElevenLabs Music.
 */
export async function renderAnthem(args: EngineCallArgs): Promise<EngineResult> {
  return runEngine(args, /* fullRender */ true);
}

async function runEngine(
  args: EngineCallArgs,
  fullRender: boolean,
): Promise<EngineResult> {
  const combinedText = [
    args.input.deficit,
    args.input.goal,
    args.input.fightFor || "",
    args.input.story || "",
  ].join(" \n ");

  // 1. Pre-LLM regex crisis gate (same engine as AI Coach + Anchor Studio).
  const regexCrisis = detectCrisis(combinedText);
  if (regexCrisis.detected && regexCrisis.category) {
    const cr = buildCrisisResponse(regexCrisis.category);
    await writeAudit(args, {
      disposition: "crisis_personal",
      category: regexCrisis.category,
      metadata: { gate: "regex", matchedPhrase: regexCrisis.matchedPhrase ?? null },
    });
    return {
      shape: "crisis",
      category: regexCrisis.category,
      message: cr.response,
      resources: cr.resources,
    };
  }

  // 2. Pass 1 — Gemini classifier.
  let passOne: PassOneOutput;
  try {
    passOne = await runPassOne(args.input);
  } catch (e: any) {
    await writeAudit(args, {
      disposition: "engine_error",
      metadata: { stage: "pass_one", error: String(e?.message ?? e) },
    });
    throw new Error("classifier_failed: " + (e?.message ?? "unknown"));
  }

  if (passOne.disposition === "personal_crisis" && passOne.crisisCategory) {
    const cr = buildCrisisResponse(passOne.crisisCategory);
    await writeAudit(args, {
      disposition: "crisis_personal",
      category: passOne.crisisCategory,
      metadata: { gate: "pass_one_llm" },
    });
    return {
      shape: "crisis",
      category: passOne.crisisCategory,
      message: cr.response,
      resources: cr.resources,
    };
  }

  if (passOne.disposition === "needs_clarification") {
    const question =
      passOne.clarificationQuestion?.trim() ||
      "Could you tell me one specific thing your stroke took, and one specific thing you want back?";
    const reason = passOne.clarificationReason?.trim() || "";
    await writeAudit(args, { disposition: "clarification", metadata: { question } });
    return { shape: "needs_clarification", question, reason };
  }

  if (passOne.disposition === "refused") {
    const reason = passOne.refusalReason?.trim() || "I can't write that one.";
    await writeAudit(args, { disposition: "refused", metadata: { reason } });
    return { shape: "refused", reason };
  }

  // disposition === "clear"
  const purpose = passOne.purposeAnthem?.trim();
  if (!purpose) {
    await writeAudit(args, {
      disposition: "clarification",
      metadata: { reason: "pass_one_clear_but_no_purpose" },
    });
    return {
      shape: "needs_clarification",
      question:
        "Tell me one specific moment, person, or word that this anthem has to honor.",
      reason: "",
    };
  }

  // 3. Pass 2 — full script generation (Gemini).
  let script: AnthemScript;
  try {
    script = await runPassTwo({ input: args.input, purposeAnthem: purpose });
  } catch (e: any) {
    await writeAudit(args, {
      disposition: "engine_error",
      metadata: { stage: "pass_two", error: String(e?.message ?? e) },
    });
    throw new Error("script_failed: " + (e?.message ?? "unknown"));
  }

  if (!fullRender) {
    await writeAudit(args, {
      disposition: "clear",
      metadata: { mode: "preview", purposeAnthem: purpose, title: script.title },
    });
    return { shape: "script", script, purposeAnthem: purpose };
  }

  // 4. ElevenLabs Music — synthesize the audio.
  const musicPrompt = buildElevenLabsMusicPrompt({ vibe: args.input.vibe, script });
  let audioBuf: Buffer;
  try {
    const eleven = getElevenLabsService();
    audioBuf = await eleven.composeMusic(musicPrompt, args.input.lengthSec * 1000);
  } catch (e: any) {
    await writeAudit(args, {
      disposition: "engine_error",
      metadata: { stage: "elevenlabs_music", error: String(e?.message ?? e) },
    });
    throw new Error("music_failed: " + (e?.message ?? "unknown"));
  }

  await writeAudit(args, {
    disposition: "clear",
    metadata: { mode: "render", purposeAnthem: purpose, title: script.title, bytes: audioBuf.length },
  });

  return {
    shape: "anthem",
    script,
    purposeAnthem: purpose,
    audioBase64: audioBuf.toString("base64"),
    audioMimeType: "audio/mpeg",
    durationMs: args.input.lengthSec * 1000,
  };
}

async function runPassOne(input: ComposeInput): Promise<PassOneOutput> {
  const prompt = buildAnthemPassOnePrompt({ input });
  const r = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.2 },
  });
  const raw = (r.text || "").trim();
  return passOneOutputSchema.parse(safeParseJson(raw));
}

async function runPassTwo(args: {
  input: ComposeInput;
  purposeAnthem: string;
}): Promise<AnthemScript> {
  const prompt = buildAnthemPassTwoPrompt({
    input: args.input,
    purposeAnthem: args.purposeAnthem,
  });
  const r = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.85 },
  });
  const raw = (r.text || "").trim();
  return anthemScriptSchema.parse(safeParseJson(raw));
}

interface AuditPayload {
  disposition: string;
  category?: string;
  metadata?: Record<string, unknown>;
  anthemId?: number;
}

async function writeAudit(args: EngineCallArgs, payload: AuditPayload): Promise<void> {
  try {
    await db.insert(recoveryAnthemAudit).values({
      userId: args.userId,
      anthemId: payload.anthemId ?? null,
      disposition: payload.disposition,
      category: payload.category ?? null,
      metadata: (payload.metadata ?? null) as any,
    });
  } catch (e: any) {
    console.error("[recoveryAnthem] audit write failed:", e?.message ?? e);
  }
}
