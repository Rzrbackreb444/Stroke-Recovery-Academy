import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import { publicRateLimit } from "./middleware/publicRateLimit";
import { getUserId } from "./lib/authUtils";
import { radioDjIntros } from "@shared/schema";
import { getElevenLabsService, isElevenLabsConfigured } from "./elevenlabs";

// ──────────────────────────────────────────────────────────────────────
// Coach Sasquatch DJ — between-track intros for Sasquatch Radio.
//
// Voice strategy:
//   * Nick's SASQUATCH_VOICE_ID drives the AI Coach + anthem narration.
//   * The DJ uses a SEPARATE premade ElevenLabs voice (default: Brian).
//     If/when Nick wants the DJ to be his own voice he can override via
//     env var — but the default never co-mingles brand voices, so the
//     DJ filler can never accidentally become "Nick said this."
//
// Cost-control:
//   * Intros are static per-track and persisted to Postgres on first
//     mint. Public listeners get the cached audio_url; ElevenLabs is
//     only ever charged once per track regardless of listener count.
//   * Admin-only mint endpoint — survivors cannot trigger TTS calls.
// ──────────────────────────────────────────────────────────────────────

const DJ_VOICE_ID = process.env.SASQUATCH_DJ_VOICE_ID || "nPczCjzI2devNBz1zQrb"; // Brian — deep narrator
const MAX_SCRIPT_LEN = 600; // ~30s at conversational TTS pace

const djIntrosLimiter = publicRateLimit({
  windowMs: 60_000,
  max: 60,
  message: "Too many DJ intro requests, please slow down",
});

const mintSchema = z.object({
  trackId: z.string().min(1).max(120),
  trackTitle: z.string().min(1).max(160),
  trackArtist: z.string().max(160).optional().nullable(),
  trackKind: z.enum(["seed", "survivor"]).default("seed"),
  vibe: z.string().max(80).optional().nullable(),
  story: z.string().max(400).optional().nullable(),
  // Optional admin-supplied script override. If absent we generate a
  // safe default from track metadata so admins don't have to write copy.
  script: z.string().max(MAX_SCRIPT_LEN).optional().nullable(),
  voiceId: z.string().min(8).max(64).optional().nullable(),
});

function buildDefaultScript(input: {
  trackTitle: string;
  trackArtist?: string | null;
  vibe?: string | null;
}): string {
  const artist = input.trackArtist?.trim() || "Stroked-Out Sasquatch";
  const vibe = input.vibe?.trim();
  // Short, repeatable station-ID pattern. Kept deliberately plain — no
  // medical claims, no emotional inflation, just title + artist + vibe.
  if (vibe) {
    return `You're locked in to Sasquatch Radio — recovery anthems for survivors who refuse to be past tense. Up next, a ${vibe.toLowerCase()}: "${input.trackTitle}" by ${artist}.`;
  }
  return `You're locked in to Sasquatch Radio — recovery anthems for survivors who refuse to be past tense. Up next: "${input.trackTitle}" by ${artist}.`;
}

export function registerRecoveryDjRoutes(app: Express) {
  // ── Public: list all minted intros as a {trackId: audioUrl} map ──
  // Projects only the display columns (audio_url + script + voice_id).
  // Never exposes createdBy or kind-internal metadata that could be used
  // to enumerate survivor tracks vs founder tracks for scraping.
  app.get(
    "/api/recovery/radio/dj/intros",
    djIntrosLimiter,
    async (_req: Request, res: Response) => {
      try {
        const rows = await db
          .select({
            trackId: radioDjIntros.trackId,
            audioUrl: radioDjIntros.audioUrl,
          })
          .from(radioDjIntros)
          .orderBy(desc(radioDjIntros.createdAt));
        const intros: Record<string, string> = {};
        for (const r of rows) intros[r.trackId] = r.audioUrl;
        res.json({ intros });
      } catch (e: any) {
        res.status(500).json({ message: "Failed to load DJ intros" });
      }
    },
  );

  // ── Admin: list raw intros for the curation UI ──
  app.get(
    "/api/admin/radio/dj/intros",
    isAuthenticated,
    requireAdmin,
    async (_req: any, res: Response) => {
      try {
        const rows = await db
          .select({
            id: radioDjIntros.id,
            trackId: radioDjIntros.trackId,
            trackTitle: radioDjIntros.trackTitle,
            trackArtist: radioDjIntros.trackArtist,
            trackKind: radioDjIntros.trackKind,
            voiceId: radioDjIntros.voiceId,
            script: radioDjIntros.script,
            createdAt: radioDjIntros.createdAt,
          })
          .from(radioDjIntros)
          .orderBy(desc(radioDjIntros.createdAt));
        res.json({ intros: rows });
      } catch (e: any) {
        res.status(500).json({ message: "Failed to load admin DJ intros" });
      }
    },
  );

  // ── Admin: mint or re-mint an intro ──
  app.post(
    "/api/admin/radio/dj/intro",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      const parsed = mintSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid mint request",
          errors: parsed.error.flatten(),
        });
      }
      const input = parsed.data;

      if (!(await isElevenLabsConfigured())) {
        return res
          .status(503)
          .json({ message: "ElevenLabs not configured on this server" });
      }

      const script = (input.script?.trim() || buildDefaultScript(input)).slice(
        0,
        MAX_SCRIPT_LEN,
      );
      const voiceId = input.voiceId?.trim() || DJ_VOICE_ID;
      const userId = getUserId(req);

      try {
        const eleven = getElevenLabsService();
        const audioBuf = await eleven.textToSpeech(script, voiceId, {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        });
        const audioUrl = `data:audio/mpeg;base64,${audioBuf.toString("base64")}`;

        // Upsert by trackId — re-minting replaces the prior intro so
        // admins can iterate on script copy without DELETE+INSERT.
        const existing = await db
          .select({ id: radioDjIntros.id })
          .from(radioDjIntros)
          .where(eq(radioDjIntros.trackId, input.trackId))
          .limit(1);

        let row;
        if (existing.length > 0) {
          [row] = await db
            .update(radioDjIntros)
            .set({
              trackTitle: input.trackTitle,
              trackArtist: input.trackArtist ?? null,
              trackKind: input.trackKind,
              voiceId,
              script,
              audioUrl,
              createdBy: userId,
              createdAt: new Date(),
            })
            .where(eq(radioDjIntros.trackId, input.trackId))
            .returning({
              id: radioDjIntros.id,
              trackId: radioDjIntros.trackId,
              script: radioDjIntros.script,
            });
        } else {
          [row] = await db
            .insert(radioDjIntros)
            .values({
              trackId: input.trackId,
              trackTitle: input.trackTitle,
              trackArtist: input.trackArtist ?? null,
              trackKind: input.trackKind,
              voiceId,
              script,
              audioUrl,
              createdBy: userId,
            })
            .returning({
              id: radioDjIntros.id,
              trackId: radioDjIntros.trackId,
              script: radioDjIntros.script,
            });
        }

        res.json({ ok: true, intro: row, script, voiceId });
      } catch (e: any) {
        console.error("[radio-dj] mint failed", { trackId: input.trackId, msg: e?.message });
        res.status(502).json({ message: "TTS generation failed" });
      }
    },
  );

  // ── Admin: delete an intro ──
  app.delete(
    "/api/admin/radio/dj/intro/:trackId",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      const trackId = String(req.params.trackId || "").slice(0, 120);
      if (!trackId) return res.status(400).json({ message: "Missing trackId" });
      try {
        await db.delete(radioDjIntros).where(eq(radioDjIntros.trackId, trackId));
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ message: "Failed to delete intro" });
      }
    },
  );

  console.log("[recovery-dj] routes registered");
}
