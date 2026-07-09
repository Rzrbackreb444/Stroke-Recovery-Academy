import { GoogleGenAI } from "@google/genai";
import { db } from "../../db";
import { recoveryAnchorAudit } from "@shared/schema";
import { detectCrisis, buildCrisisResponse } from "../crisisDetection";
import {
  anchorOutputSchema,
  passOneOutputSchema,
  safeParseJson,
  type AnchorOutput,
  type AnchorType,
  type CrisisOutput,
  type PassOneOutput,
} from "./recoveryAnchorSchema";
import { buildPassOnePrompt, buildPassTwoPrompt } from "./recoveryAnchorPrompts";

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
  category: CrisisOutput["category"];
  message: string;
  resources: CrisisOutput["resources"];
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

export type EngineAuditResult = {
  shape: "audit";
  anchorType: AnchorType;
  purposeAnchor: string;
  previewLines: string[];
  previewProducerNotes: string;
};

export type EngineAnchorResult = {
  shape: "anchor";
  output: AnchorOutput;
};

export type EngineResult =
  | EngineCrisisResult
  | EngineClarificationResult
  | EngineRefusedResult
  | EngineAuditResult
  | EngineAnchorResult;

interface EngineInput {
  userId: string;
  anchorType: AnchorType;
  text: string;
}

/**
 * Free preview tier. Runs the regex crisis pre-gate and Pass 1 only.
 * Returns the engine's distilled purpose + preview lines + producer notes
 * without invoking the more expensive Pass 2 generation.
 */
export async function auditAnchor(input: EngineInput): Promise<EngineResult> {
  return runEngine(input, /* fullRender */ false);
}

/**
 * Paid tier. Runs the full pipeline: regex crisis → Pass 1 classifier →
 * Pass 2 full anchor generation. Returns the polished Shape-A anchor.
 */
export async function renderAnchor(input: EngineInput): Promise<EngineResult> {
  return runEngine(input, /* fullRender */ true);
}

async function runEngine(input: EngineInput, fullRender: boolean): Promise<EngineResult> {
  // 1. Pre-LLM regex crisis gate. Same engine as the AI Coach.
  const regexCrisis = detectCrisis(input.text);
  if (regexCrisis.detected && regexCrisis.category) {
    const cr = buildCrisisResponse(regexCrisis.category);
    await writeAudit(input, {
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

  // 2. Pass 1 — cheap classifier. Catches paraphrased crisis language the
  //    regex misses, plus vague / refused / clear inputs.
  let passOne: PassOneOutput;
  try {
    passOne = await runPassOne(input);
  } catch (e: any) {
    await writeAudit(input, {
      disposition: "engine_error",
      metadata: { stage: "pass_one", error: String(e?.message ?? e) },
    });
    throw new Error("classifier_failed: " + (e?.message ?? "unknown"));
  }

  if (passOne.disposition === "personal_crisis" && passOne.crisisCategory) {
    const cr = buildCrisisResponse(passOne.crisisCategory);
    await writeAudit(input, {
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
    const question = passOne.clarificationQuestion?.trim() || "Could you tell me more about what you'd like to encode?";
    const reason = passOne.clarificationReason?.trim() || "";
    await writeAudit(input, { disposition: "clarification", metadata: { question } });
    return { shape: "needs_clarification", question, reason };
  }

  if (passOne.disposition === "refused") {
    const reason = passOne.refusalReason?.trim() || "I can't encode that one safely.";
    await writeAudit(input, { disposition: "refused", metadata: { reason } });
    return { shape: "refused", reason };
  }

  // disposition === "clear" — return the audit preview if we're not rendering.
  const purpose = passOne.purposeAnchor?.trim();
  if (!purpose) {
    // Defensive: model said clear but gave us nothing. Treat as clarification.
    await writeAudit(input, {
      disposition: "clarification",
      metadata: { reason: "pass_one_clear_but_no_purpose" },
    });
    return {
      shape: "needs_clarification",
      question: "Tell me a little more about what you'd like to anchor — one sentence is enough.",
      reason: "",
    };
  }

  if (!fullRender) {
    const previewLines = (passOne.previewLines ?? []).filter((l) => typeof l === "string" && l.trim().length > 0);
    const previewProducerNotes = passOne.previewProducerNotes?.trim() || "Outline only — render to compose the full anchor.";
    await writeAudit(input, {
      disposition: "clear",
      metadata: { mode: "audit", purposeAnchor: purpose, previewLineCount: previewLines.length },
    });
    return {
      shape: "audit",
      anchorType: input.anchorType,
      purposeAnchor: purpose,
      previewLines,
      previewProducerNotes,
    };
  }

  // 3. Pass 2 — full generation.
  let anchor: AnchorOutput;
  try {
    anchor = await runPassTwo({ ...input, purposeAnchor: purpose });
  } catch (e: any) {
    await writeAudit(input, {
      disposition: "engine_error",
      metadata: { stage: "pass_two", error: String(e?.message ?? e) },
    });
    throw new Error("generation_failed: " + (e?.message ?? "unknown"));
  }

  await writeAudit(input, {
    disposition: "clear",
    metadata: { mode: "render", purposeAnchor: purpose, title: anchor.title },
  });
  return { shape: "anchor", output: anchor };
}

async function runPassOne(input: EngineInput): Promise<PassOneOutput> {
  const prompt = buildPassOnePrompt({ anchorType: input.anchorType, text: input.text });
  const r = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const raw = (r.text || "").trim();
  const parsed = safeParseJson(raw);
  return passOneOutputSchema.parse(parsed);
}

async function runPassTwo(input: EngineInput & { purposeAnchor: string }): Promise<AnchorOutput> {
  const prompt = buildPassTwoPrompt({
    anchorType: input.anchorType,
    text: input.text,
    purposeAnchor: input.purposeAnchor,
  });
  const r = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
  const raw = (r.text || "").trim();
  const parsed = safeParseJson(raw);
  return anchorOutputSchema.parse(parsed);
}

interface AuditPayload {
  disposition: string;
  category?: string;
  metadata?: Record<string, unknown>;
  anchorId?: number;
}

async function writeAudit(input: EngineInput, payload: AuditPayload): Promise<void> {
  try {
    await db.insert(recoveryAnchorAudit).values({
      userId: input.userId,
      anchorId: payload.anchorId ?? null,
      anchorType: input.anchorType,
      disposition: payload.disposition,
      category: payload.category ?? null,
      metadata: (payload.metadata ?? null) as any,
    });
  } catch (e: any) {
    // Audit failures must not break user flow.
    console.error("[recoveryAnchor] audit write failed:", e?.message ?? e);
  }
}
