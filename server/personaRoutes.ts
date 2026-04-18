import type { Express } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { userPersonas, users, type UserPersona } from "@shared/schema";
import { PERSONA_ARCHETYPES, getArchetype } from "@shared/personaArchetypes";
import { isAuthenticated } from "./replitAuth";

const upsertSchema = z.object({
  archetypeKey: z.string().min(1),
  name: z.string().min(1).max(60),
  creed: z.string().min(1).max(280),
  why: z.string().max(800).optional().nullable(),
  triggerCue: z.string().max(160).optional().nullable(),
  voicePreset: z.string().max(60).optional().nullable(),
  accentColor: z.string().max(20).optional().nullable(),
});

export function registerPersonaRoutes(app: Express) {
  // Public: list of archetypes (no auth needed — used in onboarding teaser)
  app.get("/api/persona/archetypes", (_req, res) => {
    res.json({ archetypes: PERSONA_ARCHETYPES });
  });

  // Get current user's persona
  app.get("/api/persona/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [p] = await db.select().from(userPersonas).where(eq(userPersonas.userId, userId));
      res.json({ persona: p ?? null });
    } catch (e) {
      console.error("[persona/me]", e);
      res.status(500).json({ error: "Failed to load persona" });
    }
  });

  // Create or update persona (upsert)
  app.put("/api/persona", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = upsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid persona", details: parsed.error.flatten() });
      }
      const archetype = getArchetype(parsed.data.archetypeKey);
      if (!archetype) {
        return res.status(400).json({ error: "Unknown archetype" });
      }
      const accentColor = parsed.data.accentColor || archetype.accentColor;
      const voicePreset = parsed.data.voicePreset ?? archetype.voicePreset;

      const now = new Date();
      const values = {
        userId,
        archetypeKey: parsed.data.archetypeKey,
        name: parsed.data.name.trim(),
        creed: parsed.data.creed.trim(),
        why: parsed.data.why?.trim() || null,
        triggerCue: parsed.data.triggerCue?.trim() || null,
        voicePreset,
        accentColor,
        updatedAt: now,
      };

      // Race-safe upsert: primary key = userId, so onConflictDoUpdate is atomic
      const [persona] = await db
        .insert(userPersonas)
        .values({ ...values, createdAt: now })
        .onConflictDoUpdate({
          target: userPersonas.userId,
          set: values,
        })
        .returning();

      res.json({ persona });
    } catch (e) {
      console.error("[persona PUT]", e);
      res.status(500).json({ error: "Failed to save persona" });
    }
  });

  // Forge — AI-assisted creed suggestions. Input: { archetypeKey, name, why? }
  // Output: { suggestions: string[] } (3 creeds in persona voice).
  // Falls back to seed creeds from the archetype if AI is unavailable.
  app.post("/api/persona/forge", isAuthenticated, async (req: any, res) => {
    try {
      const { archetypeKey, name, why } = req.body ?? {};
      const archetype = getArchetype(archetypeKey);
      if (!archetype || !name) {
        return res.status(400).json({ error: "archetypeKey and name required" });
      }

      // Try Gemini for personalized suggestions, fall back to seeds.
      let suggestions: string[] = [];
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are coaching a stroke survivor who is forging an alter-ego persona to tap into during recovery work.
Persona archetype: ${archetype.name} — ${archetype.tagline}
Persona name they chose: ${name}
${why ? `Why this archetype matters to them: ${why}` : ""}

Write 3 distinct one-line creeds (under 160 chars each) in the voice of "${name} the ${archetype.name}".
Each creed should be:
- spoken in third person referring to the persona by name
- relentless, present-tense, no clichés, no emoji
- about doing the work even when the wounded self can't

Return ONLY the 3 creeds, one per line, no numbering, no quotes.`;
          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          const text = result.text || "";
          suggestions = text
            .split("\n")
            .map((l: string) => l.replace(/^[\d\.\-\*"'\s]+|["'\s]+$/g, "").trim())
            .filter((l: string) => l.length > 10 && l.length < 240)
            .slice(0, 3);
        }
      } catch (aiErr) {
        console.warn("[persona/forge] AI unavailable, using seeds:", aiErr);
      }

      if (suggestions.length === 0) {
        suggestions = archetype.creedSeeds.map((s) => s.replaceAll(archetype.name, name));
      }

      res.json({ suggestions, archetype });
    } catch (e) {
      console.error("[persona/forge]", e);
      res.status(500).json({ error: "Failed to forge creed" });
    }
  });
}

// Helper: load persona for a userId (used by other routes for personalization).
export async function loadPersonaFor(userId: string): Promise<UserPersona | null> {
  try {
    const [p] = await db.select().from(userPersonas).where(eq(userPersonas.userId, userId));
    return p ?? null;
  } catch {
    return null;
  }
}
