import type { Express, Request, Response } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import { getUserId } from "./lib/authUtils";
import { voiceClones } from "@shared/schema";
import { getElevenLabsService, isElevenLabsConfigured } from "./elevenlabs";

export const VOICE_CLONE_CONSENT_TEXT =
  "I hereby confirm that I am the sole owner of this voice and grant Stroke Recovery Academy and ElevenLabs permission to clone it for use within my account. I understand the cloned voice will only be used to generate audio I personally request.";

const previewSchema = z.object({
  text: z.string().min(1).max(500),
});

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(500).optional().default(""),
  consentAccepted: z.literal(true),
  audioBase64: z.string().min(1000),
  audioMimeType: z.string().max(80).default("audio/webm"),
  sampleDurationSec: z.number().int().min(10).max(300),
});

function base64ToBuffer(b64: string): Buffer {
  const stripped = b64.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(stripped, "base64");
}

export function registerVoiceCloneRoutes(app: Express) {
  // NOTE: the larger 15mb express.json body parser for /api/voice-clones is
  // mounted in server/app.ts BEFORE the global 5mb parser so the global cap
  // does not reject voice samples first.

  app.get("/api/voice-clones", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const rows = await db
        .select({
          id: voiceClones.id,
          name: voiceClones.name,
          description: voiceClones.description,
          status: voiceClones.status,
          voiceModelId: voiceClones.voiceModelId,
          sampleDurationSec: voiceClones.sampleDurationSec,
          consentSignedAt: voiceClones.consentSignedAt,
          usageCount: voiceClones.usageCount,
          createdAt: voiceClones.createdAt,
        })
        .from(voiceClones)
        .where(and(eq(voiceClones.ownerId, userId), isNull(voiceClones.deletedAt)))
        .orderBy(desc(voiceClones.createdAt));
      res.json({ voices: rows, consentText: VOICE_CLONE_CONSENT_TEXT });
    } catch (err: any) {
      console.error("[voice-clones] list failed", err?.message || err);
      res.status(500).json({ message: "Failed to list voices" });
    }
  });

  app.post(
    "/api/voice-clones",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        if (!(await isElevenLabsConfigured())) {
          return res.status(503).json({ message: "Voice cloning service unavailable" });
        }

        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ message: "Invalid input", issues: parsed.error.issues });
        }
        const { name, description, audioBase64, sampleDurationSec } = parsed.data;

        const sampleBuf = base64ToBuffer(audioBase64);
        if (sampleBuf.length < 10_000) {
          return res.status(400).json({ message: "Audio sample too small (need ~10s+)" });
        }
        if (sampleBuf.length > 12_000_000) {
          return res.status(413).json({ message: "Audio sample too large (max ~12MB)" });
        }

        const eleven = getElevenLabsService();
        let voiceId: string;
        try {
          voiceId = await eleven.cloneVoice(
            name.slice(0, 60),
            description || `Survivor voice clone for user ${userId}`,
            [sampleBuf],
          );
        } catch (e: any) {
          console.error("[voice-clones] ElevenLabs clone failed", e?.message || e);
          return res.status(502).json({ message: "Voice cloning service rejected the sample" });
        }

        const ip =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null;

        // Server-enforced consent text (single source of truth, not client-tampered).
        try {
          const [row] = await db
            .insert(voiceClones)
            .values({
              ownerId: userId,
              name,
              description: description || null,
              voiceType: "custom",
              voiceModelId: voiceId,
              status: "ready",
              consentText: VOICE_CLONE_CONSENT_TEXT,
              consentSignedAt: new Date(),
              consentIp: ip,
              sampleDurationSec,
            })
            .returning({
              id: voiceClones.id,
              name: voiceClones.name,
              status: voiceClones.status,
              voiceModelId: voiceClones.voiceModelId,
            });

          console.log(
            `[voice-clones] minted user=${userId} voiceId=${voiceId} duration=${sampleDurationSec}s`,
          );
          res.json({ voice: row });
        } catch (dbErr: any) {
          // Compensating delete: don't leak ElevenLabs voice slots if our DB insert fails.
          console.error(
            `[voice-clones] DB insert failed after EL clone (compensating) voiceId=${voiceId}`,
            dbErr?.message || dbErr,
          );
          try {
            await eleven.deleteVoice(voiceId);
          } catch (compErr: any) {
            console.error(
              `[voice-clones] compensating EL delete also failed voiceId=${voiceId}`,
              compErr?.message || compErr,
            );
          }
          throw dbErr;
        }
      } catch (err: any) {
        console.error("[voice-clones] create failed", err?.message || err);
        res.status(500).json({ message: "Failed to create voice clone" });
      }
    },
  );

  app.post(
    "/api/voice-clones/:id/preview",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });

        const parsed = previewSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid text" });
        }

        const [row] = await db
          .select({
            voiceModelId: voiceClones.voiceModelId,
            ownerId: voiceClones.ownerId,
            deletedAt: voiceClones.deletedAt,
            status: voiceClones.status,
          })
          .from(voiceClones)
          .where(eq(voiceClones.id, id))
          .limit(1);

        if (!row || row.ownerId !== userId || row.deletedAt) {
          return res.status(404).json({ message: "Voice not found" });
        }
        if (row.status !== "ready" || !row.voiceModelId) {
          return res.status(409).json({ message: "Voice not ready" });
        }

        const audio = await getElevenLabsService().textToSpeech(
          parsed.data.text,
          row.voiceModelId,
        );

        // Atomic increment — avoids the read-then-write race where concurrent
        // previews could lose increments.
        await db
          .update(voiceClones)
          .set({
            usageCount: sql`${voiceClones.usageCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(voiceClones.id, id));

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-store");
        res.send(audio);
      } catch (err: any) {
        console.error("[voice-clones] preview failed", err?.message || err);
        res.status(500).json({ message: "Preview failed" });
      }
    },
  );

  app.delete(
    "/api/voice-clones/:id",
    isAuthenticated,
    requireAdmin,
    async (req: any, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });

        const [row] = await db
          .select({
            voiceModelId: voiceClones.voiceModelId,
            ownerId: voiceClones.ownerId,
            deletedAt: voiceClones.deletedAt,
          })
          .from(voiceClones)
          .where(eq(voiceClones.id, id))
          .limit(1);

        if (!row || row.ownerId !== userId || row.deletedAt) {
          return res.status(404).json({ message: "Voice not found" });
        }

        if (row.voiceModelId) {
          try {
            await getElevenLabsService().deleteVoice(row.voiceModelId);
          } catch (e: any) {
            console.warn(
              `[voice-clones] EL delete failed (continuing soft-delete) id=${id}: ${e?.message}`,
            );
          }
        }

        await db
          .update(voiceClones)
          .set({ deletedAt: new Date(), status: "deleted", updatedAt: new Date() })
          .where(eq(voiceClones.id, id));

        res.json({ ok: true });
      } catch (err: any) {
        console.error("[voice-clones] delete failed", err?.message || err);
        res.status(500).json({ message: "Delete failed" });
      }
    },
  );

  console.log("[voice-clones] routes registered");
}
