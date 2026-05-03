import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import { publicRateLimit } from "./middleware/publicRateLimit";
import { getElevenLabsService, isElevenLabsConfigured, SASQUATCH_VOICE_ID, SASQUATCH_VOICE_SETTINGS } from "./elevenlabs";

const previewSchema = z.object({
  text: z.string().min(1).max(600),
  voiceId: z.string().min(8).max(64),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  useSpeakerBoost: z.boolean().optional(),
});

export const SASQUATCH_VOICE_CANDIDATES = [
  {
    id: "2EiwWnXFnvU5JabPnv8n",
    name: "Clyde",
    tagline: "Middle-aged raspy American",
    why: "Default. Warm-but-gravelly bear-uncle energy. Closest stock match to Sasquatch.",
    raspy: true,
  },
  {
    id: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    tagline: "Gravelly intense",
    why: "Battle-worn warrior gravel. Hits harder than Clyde, less warmth.",
    raspy: true,
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    tagline: "British raspy storyteller",
    why: "Old-soul rasp. British accent skews wise-elder over rugged-bear.",
    raspy: true,
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel",
    tagline: "Deep British authoritative",
    why: "Less rasp, more command. For when Sasquatch needs to lay down the law.",
    raspy: false,
  },
  {
    id: "pqHfZKP75CvOlQylNhV4",
    name: "Bill",
    tagline: "Warm older American",
    why: "Grandfatherly storyteller. Smooth, not raspy. Good contrast benchmark.",
    raspy: false,
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    tagline: "Generic deep narrator (prior default)",
    why: "What you've been hearing until now. Smooth, no character. Kept as A/B reference.",
    raspy: false,
  },
];

export function registerVoiceLabRoutes(app: Express) {
  // Admin-only burst limit: 30 previews/min/admin (LLM-adjacent cost control)
  const previewLimiter = publicRateLimit({ windowMs: 60_000, max: 30, name: "voice-lab-preview" });

  app.get("/api/admin/voice-lab/candidates", isAuthenticated, requireAdmin, (_req, res) => {
    res.json({
      activeVoiceId: SASQUATCH_VOICE_ID,
      defaultSettings: SASQUATCH_VOICE_SETTINGS,
      candidates: SASQUATCH_VOICE_CANDIDATES,
      configured: undefined,
    });
  });

  app.post("/api/admin/voice-lab/preview", previewLimiter, isAuthenticated, requireAdmin, async (req, res) => {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid preview request", errors: parsed.error.flatten() });
    }

    const { text, voiceId, stability, similarityBoost, style, useSpeakerBoost } = parsed.data;

    const configured = await isElevenLabsConfigured();
    if (!configured) {
      return res.status(503).json({ message: "ElevenLabs not configured. Set ELEVENLABS_API_KEY." });
    }

    try {
      const elevenlabs = getElevenLabsService();
      const audioBuffer = await elevenlabs.textToSpeech(text, voiceId, {
        stability: stability ?? SASQUATCH_VOICE_SETTINGS.stability,
        similarity_boost: similarityBoost ?? SASQUATCH_VOICE_SETTINGS.similarity_boost,
        style: style ?? SASQUATCH_VOICE_SETTINGS.style,
        use_speaker_boost: useSpeakerBoost ?? SASQUATCH_VOICE_SETTINGS.use_speaker_boost,
      });

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Cache-Control": "no-store",
      });
      res.send(audioBuffer);
    } catch (err: any) {
      console.error("[voice-lab] preview error:", err?.message || err);
      res.status(500).json({ message: "Voice preview failed", error: err?.message || "unknown" });
    }
  });
}
