// ============================================================================
// Daily Circuit routes
// ============================================================================
// One unified guided-session feature that strings together the platform's
// existing recovery surface with voice-cloned transitions in Nick's voice.
// Presets are hardcoded in server/data/circuitPresets.ts; per-user runs are
// recorded in circuit_sessions; ElevenLabs audio for bridge quotes is
// lazily generated on first request and cached in nick_quote_audio.
//
// Endpoints (all under /api/circuit):
//   GET  /presets                              → list the 3 presets
//   GET  /preset/:slug                         → one preset detail
//   POST /session/start         {slug}         → begin a session, returns id
//   POST /session/:id/station   {stationId,    → log a station completion
//                                feeling?}        and award per-station XP
//   POST /session/:id/feeling   {feeling}      → record overall feeling
//   POST /session/:id/complete                 → finalize, award completion XP
//   GET  /session/recent                       → user's last N sessions
//   GET  /quote/bridge?fromStation=&toStation= → next transition quote
//                              &feeling=&excludeIds=&sessionId=
//   GET  /quote/coach?stationId=&sessionId=    → coach-station quote (longer)

import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { db } from "../db";
import { circuitSessions, nickQuoteAudio } from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  CIRCUIT_PRESETS,
  CIRCUIT_SLUGS,
  getCircuitBySlug,
  type CircuitPreset,
  type CircuitStation,
  type StationType,
} from "../data/circuitPresets";
import {
  pickCircuitQuote,
  getQuoteById,
  type NickQuoteWithId,
  type QuoteCategory,
} from "../data/nickQuotes";
import { getUserId } from "../lib/authUtils";
import {
  sasquatchSpeak,
  isElevenLabsConfigured,
  SASQUATCH_VOICE_ID,
} from "../elevenlabs";

// ──────────────────────────────────────────────────────────────────────
// Audio cache directory — served via the existing /uploads static mount.
// ──────────────────────────────────────────────────────────────────────

function ensureQuoteAudioDir(uploadsDir: string): string {
  const dir = path.join(uploadsDir, "quote-audio");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Returns a public /uploads/... URL for the quote's audio. If the audio
 * has not been generated yet, calls ElevenLabs once, writes the MP3 to
 * disk, and inserts a row in nick_quote_audio.
 *
 * Returns null when ElevenLabs is unconfigured or generation fails — the
 * client falls back to text-only display in that case.
 */
async function getOrGenerateQuoteAudio(
  q: NickQuoteWithId,
  uploadsDir: string,
): Promise<string | null> {
  // 1. Cache hit
  const [existing] = await db
    .select()
    .from(nickQuoteAudio)
    .where(eq(nickQuoteAudio.quoteId, q.id))
    .limit(1);
  if (existing) return existing.audioUrl;

  // 2. Generate
  try {
    if (!(await isElevenLabsConfigured())) return null;
    const buf = await sasquatchSpeak(q.text);
    const dir = ensureQuoteAudioDir(uploadsDir);
    const filename = `${q.id}.mp3`;
    fs.writeFileSync(path.join(dir, filename), buf);
    const url = `/uploads/quote-audio/${filename}`;
    await db
      .insert(nickQuoteAudio)
      .values({
        quoteId: q.id,
        text: q.text,
        audioUrl: url,
        voiceId: SASQUATCH_VOICE_ID,
      })
      .onConflictDoNothing();
    return url;
  } catch (e: any) {
    console.warn(`[circuit] quote audio generation failed for ${q.id}:`, e?.message || e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────
// XP per station (small) — completion bonus comes from the preset.
// ──────────────────────────────────────────────────────────────────────

function stationXp(type: StationType): number {
  switch (type) {
    case "open":
    case "close":
      return 0;
    case "check_in":
    case "hydration":
      return 2;
    case "breath":
    case "reflection":
    case "community":
      return 4;
    case "coach":
      return 5;
    case "brain_quick":
    case "word_quick":
    case "dexterity":
      return 8;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Bridge category mapper — picks a quote category that fits the moment
// the survivor is in. Honest defaults; no random thrash.
// ──────────────────────────────────────────────────────────────────────

function bridgeCategoriesFor(opts: {
  toStation?: CircuitStation;
  feeling?: "good" | "hard" | "too_hard";
  isFirst: boolean;
  isLast: boolean;
  isNight: boolean;
}): { categories: QuoteCategory[]; intensity?: "gentle" | "strong" | "dark" } {
  // "Too much today" branch — always gentle, comeback flavor.
  if (opts.feeling === "too_hard") {
    return { categories: ["comeback", "humanhood", "humor", "dark"], intensity: "gentle" };
  }
  // Closing — restorative, especially after dark.
  if (opts.isLast) {
    return {
      categories: opts.isNight
        ? ["night", "humanhood", "doctrine"]
        : ["doctrine", "humanhood", "identity"],
    };
  }
  // Opening — set the tone.
  if (opts.isFirst) {
    return { categories: ["foundation", "identity", "fuel"] };
  }
  // Hard but doable — strong fuel without toxic positivity.
  if (opts.feeling === "hard") {
    return { categories: ["fuel", "repetition", "ownership"], intensity: "strong" };
  }
  // Default: lean on the inbound station's voiceCue.
  if (opts.toStation?.voiceCue?.length) {
    return { categories: opts.toStation.voiceCue };
  }
  return { categories: ["practice", "doctrine", "movement"] };
}

// ──────────────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────────────

const slugSchema = z.string().refine((s) => CIRCUIT_SLUGS.includes(s), {
  message: "Unknown circuit slug",
});

const startSessionSchema = z.object({
  slug: slugSchema,
});

const stationCompleteSchema = z.object({
  stationId: z.string().min(1).max(60),
  feeling: z.enum(["good", "hard", "too_hard"]).optional(),
  skipped: z.boolean().optional(),
  // Optional per-station numeric (e.g. tap count, found-words count) we
  // log into meta for later analytics.
  metric: z.number().int().nonnegative().optional(),
});

const sessionFeelingSchema = z.object({
  feeling: z.enum(["good", "hard", "too_hard"]),
});

// ──────────────────────────────────────────────────────────────────────
// Public preset shape — only what the client needs.
// ──────────────────────────────────────────────────────────────────────

function publicPreset(p: CircuitPreset) {
  const totalSeconds = p.stations.reduce(
    (acc, s) => acc + s.durationSeconds,
    0,
  );
  return {
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    lengthLabel: p.lengthLabel,
    intensity: p.intensity,
    completionXp: p.completionXp,
    totalSeconds,
    stationCount: p.stations.length,
    stations: p.stations,
  };
}

// ──────────────────────────────────────────────────────────────────────

export function registerCircuitRoutes(
  app: Express,
  isAuthenticated: any,
  uploadsDir: string,
) {
  // ── List presets ────────────────────────────────────────────────────
  app.get("/api/circuit/presets", (_req: Request, res: Response) => {
    res.json({
      presets: CIRCUIT_PRESETS.map(publicPreset),
      // Today's recommended preset — for now the standard 20-min ritual.
      // Later this picks based on user fatigue/streak/time-of-day.
      recommendedSlug: "standard",
    });
  });

  // ── One preset ──────────────────────────────────────────────────────
  app.get("/api/circuit/preset/:slug", (req: Request, res: Response) => {
    const p = getCircuitBySlug(req.params.slug);
    if (!p) return res.status(404).json({ error: "Unknown circuit" });
    res.json({ preset: publicPreset(p) });
  });

  // ── Start a session ─────────────────────────────────────────────────
  app.post(
    "/api/circuit/session/start",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const parsed = startSessionSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid", details: parsed.error.format() });
      }
      const preset = getCircuitBySlug(parsed.data.slug)!;
      const [row] = await db
        .insert(circuitSessions)
        .values({
          userId,
          circuitSlug: preset.slug,
          totalStations: preset.stations.length,
          meta: { stationFeedback: {}, quotesPlayed: [], skipped: [] },
        })
        .returning();
      res.json({ session: row, preset: publicPreset(preset) });
    },
  );

  // ── Log a station completion ────────────────────────────────────────
  // Concurrency-safe: a single atomic UPDATE both gates duplicate credit
  // (via `NOT (meta->'stationFeedback' ? :stationId)`) and merges JSONB
  // fields in one shot, so two near-simultaneous posts cannot double-count.
  app.post(
    "/api/circuit/session/:id/station",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const parsed = stationCompleteSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid", details: parsed.error.format() });
      }
      // Resolve the preset/station up front so we know the XP delta.
      const [snap] = await db
        .select({
          completedAt: circuitSessions.completedAt,
          circuitSlug: circuitSessions.circuitSlug,
        })
        .from(circuitSessions)
        .where(
          and(eq(circuitSessions.id, id), eq(circuitSessions.userId, userId)),
        )
        .limit(1);
      if (!snap) return res.status(404).json({ error: "Session not found" });
      if (snap.completedAt) {
        return res.status(409).json({ error: "Session already completed" });
      }
      const preset = getCircuitBySlug(snap.circuitSlug);
      if (!preset) return res.status(500).json({ error: "Unknown preset" });
      const station = preset.stations.find((s) => s.id === parsed.data.stationId);
      if (!station) {
        return res.status(400).json({ error: "Unknown stationId for circuit" });
      }
      const stationLabel = parsed.data.skipped
        ? "skipped"
        : parsed.data.feeling || "good";
      const xpDelta = parsed.data.skipped ? 0 : stationXp(station.type);
      const liftFeelingTooHard = parsed.data.feeling === "too_hard";

      // Atomic check-and-set. One statement, one row, one decision.
      // - jsonb_set on stationFeedback only takes effect because the WHERE
      //   prevents the update when the key is already present.
      // - Optional metric is merged via ||, which preserves existing keys.
      // - skipped[] gets the station id appended once (gated by the same
      //   WHERE).
      const result: any = await db.execute(sql`
        UPDATE circuit_sessions
        SET
          meta = jsonb_set(
            jsonb_set(
              COALESCE(meta, '{}'::jsonb),
              ARRAY['stationFeedback'],
              COALESCE(meta -> 'stationFeedback', '{}'::jsonb)
                || jsonb_build_object(${station.id}::text, ${stationLabel}::text)
            ),
            ARRAY['skipped'],
            CASE WHEN ${parsed.data.skipped ?? false}::boolean
              THEN COALESCE(meta -> 'skipped', '[]'::jsonb)
                   || to_jsonb(ARRAY[${station.id}::text])
              ELSE COALESCE(meta -> 'skipped', '[]'::jsonb)
            END
          )
          ${parsed.data.metric != null
            ? sql`|| jsonb_build_object('metrics',
                COALESCE(meta -> 'metrics', '{}'::jsonb)
                  || jsonb_build_object(${station.id}::text, ${parsed.data.metric}::int))`
            : sql``},
          stations_completed = stations_completed + 1,
          xp_earned = xp_earned + ${xpDelta},
          feeling = CASE WHEN ${liftFeelingTooHard}::boolean
            THEN 'too_hard'
            ELSE feeling
          END
        WHERE id = ${id}
          AND user_id = ${userId}
          AND completed_at IS NULL
          AND NOT (COALESCE(meta -> 'stationFeedback', '{}'::jsonb) ? ${station.id}::text)
        RETURNING xp_earned
      `);
      const updatedRows = (result?.rows ?? result ?? []) as any[];
      if (updatedRows.length === 0) {
        // Either already-logged for this station, or the session got
        // completed/disappeared since we snapshotted. Either way, this
        // is a no-op as far as the client is concerned.
        return res.json({ ok: true, xpAwarded: 0, alreadyLogged: true });
      }
      res.json({ ok: true, xpAwarded: xpDelta });
    },
  );

  // ── Update overall feeling (hint to bridge mapper) ──────────────────
  app.post(
    "/api/circuit/session/:id/feeling",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const parsed = sessionFeelingSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid feeling" });
      }
      const [updated] = await db
        .update(circuitSessions)
        .set({ feeling: parsed.data.feeling })
        .where(
          and(eq(circuitSessions.id, id), eq(circuitSessions.userId, userId)),
        )
        .returning();
      if (!updated) return res.status(404).json({ error: "Session not found" });
      res.json({ ok: true });
    },
  );

  // ── Finalize a session ──────────────────────────────────────────────
  app.post(
    "/api/circuit/session/:id/complete",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
      const [session] = await db
        .select()
        .from(circuitSessions)
        .where(
          and(eq(circuitSessions.id, id), eq(circuitSessions.userId, userId)),
        )
        .limit(1);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.completedAt) {
        return res.json({
          ok: true,
          alreadyCompleted: true,
          xpEarned: session.xpEarned,
        });
      }
      const preset = getCircuitBySlug(session.circuitSlug);
      const completionXp = preset?.completionXp ?? 0;
      // Only award completion XP if at least half the stations were done.
      const halfDone =
        session.stationsCompleted >= Math.ceil(session.totalStations / 2);
      const finalXp = session.xpEarned + (halfDone ? completionXp : 0);
      await db
        .update(circuitSessions)
        .set({ completedAt: new Date(), xpEarned: finalXp })
        .where(eq(circuitSessions.id, id));
      res.json({
        ok: true,
        xpEarned: finalXp,
        completionBonusAwarded: halfDone ? completionXp : 0,
        stationsCompleted: session.stationsCompleted,
        totalStations: session.totalStations,
      });
    },
  );

  // ── Recent sessions for streak / history ────────────────────────────
  // Streak is computed from a separate query that scans the full 60-day
  // window — so a streak longer than `limit` items still counts correctly.
  app.get(
    "/api/circuit/session/recent",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const [rows, streakRows] = await Promise.all([
        db
          .select()
          .from(circuitSessions)
          .where(eq(circuitSessions.userId, userId))
          .orderBy(desc(circuitSessions.startedAt))
          .limit(limit),
        db.execute(sql`
          SELECT DISTINCT to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS d
          FROM circuit_sessions
          WHERE user_id = ${userId}
            AND completed_at IS NOT NULL
            AND completed_at > NOW() - INTERVAL '70 days'
          ORDER BY d DESC
        `),
      ]);
      const completedDates = new Set<string>();
      for (const r of (streakRows as any).rows ?? []) {
        if (r?.d) completedDates.add(String(r.d));
      }
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setUTCDate(today.getUTCDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (completedDates.has(key)) streak++;
        else if (i > 0) break; // missing today is ok; missing yesterday breaks
      }
      res.json({ items: rows, streak });
    },
  );

  // ── Bridge quote between two stations ───────────────────────────────
  // Auth required so we can pull session feeling + dedupe per-session.
  app.get(
    "/api/circuit/quote/bridge",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const sessionId = Number(req.query.sessionId);
      const fromStation = String(req.query.fromStation || "");
      const toStation = String(req.query.toStation || "");
      const explicitFeeling = req.query.feeling
        ? String(req.query.feeling)
        : undefined;
      const excludeFromQuery = String(req.query.excludeIds || "")
        .split(",")
        .filter(Boolean);

      let session: typeof circuitSessions.$inferSelect | null = null;
      if (Number.isFinite(sessionId)) {
        const [row] = await db
          .select()
          .from(circuitSessions)
          .where(
            and(
              eq(circuitSessions.id, sessionId),
              eq(circuitSessions.userId, userId),
            ),
          )
          .limit(1);
        session = row || null;
      }

      const preset = session ? getCircuitBySlug(session.circuitSlug) : null;
      const toIdx = preset?.stations.findIndex((s) => s.id === toStation) ?? -1;
      const fromIdx = preset?.stations.findIndex((s) => s.id === fromStation) ?? -1;
      const isFirst = fromStation === "" || fromIdx < 0;
      const isLast = preset ? toIdx === preset.stations.length - 1 : false;
      const meta = (session?.meta || {}) as any;
      const previouslyPlayed: string[] = Array.isArray(meta.quotesPlayed)
        ? meta.quotesPlayed
        : [];

      const feeling =
        (explicitFeeling as any) || (session?.feeling as any) || undefined;
      const hour = new Date().getHours();
      const isNight = hour >= 20 || hour < 5;
      const { categories, intensity } = bridgeCategoriesFor({
        toStation: preset?.stations[toIdx],
        feeling,
        isFirst,
        isLast,
        isNight,
      });

      const pick = pickCircuitQuote({
        preferCategories: categories,
        preferIntensity: intensity,
        excludeIds: [...previouslyPlayed, ...excludeFromQuery],
      });
      if (!pick) return res.status(404).json({ error: "No quote available" });

      const audioUrl = await getOrGenerateQuoteAudio(pick, uploadsDir);

      // Record this quote against the session so we don't repeat. Atomic
      // JSONB array append, gated on "quote not already in the list" so
      // concurrent bridge requests can't both append the same id.
      if (session) {
        await db.execute(sql`
          UPDATE circuit_sessions
          SET meta = jsonb_set(
            COALESCE(meta, '{}'::jsonb),
            ARRAY['quotesPlayed'],
            COALESCE(meta -> 'quotesPlayed', '[]'::jsonb)
              || to_jsonb(ARRAY[${pick.id}::text])
          )
          WHERE id = ${session.id}
            AND user_id = ${userId}
            AND NOT (COALESCE(meta -> 'quotesPlayed', '[]'::jsonb)
                     @> to_jsonb(ARRAY[${pick.id}::text]))
        `);
      }

      res.json({
        id: pick.id,
        text: pick.text,
        category: pick.category,
        intensity: pick.intensity,
        audioUrl,
      });
    },
  );

  // ── Coach-station quote (longer hold, more presence) ────────────────
  // Same picker, but biased toward doctrine/fuel/identity and never
  // pulls from "humor" so the coach moments hit.
  app.get(
    "/api/circuit/quote/coach",
    isAuthenticated,
    async (req: any, res: Response) => {
      const userId = getUserId(req);
      const sessionId = Number(req.query.sessionId);
      let previouslyPlayed: string[] = [];
      let session: typeof circuitSessions.$inferSelect | null = null;
      if (Number.isFinite(sessionId)) {
        const [row] = await db
          .select()
          .from(circuitSessions)
          .where(
            and(
              eq(circuitSessions.id, sessionId),
              eq(circuitSessions.userId, userId),
            ),
          )
          .limit(1);
        session = row || null;
        const meta = (session?.meta || {}) as any;
        if (Array.isArray(meta.quotesPlayed)) previouslyPlayed = meta.quotesPlayed;
      }
      const feeling = (session?.feeling as any) || undefined;
      const cats: QuoteCategory[] =
        feeling === "too_hard"
          ? ["comeback", "humanhood", "fuel"]
          : feeling === "hard"
            ? ["fuel", "ownership", "doctrine"]
            : ["doctrine", "fuel", "identity", "movement"];
      const pick = pickCircuitQuote({
        preferCategories: cats,
        preferIntensity: feeling === "too_hard" ? "gentle" : "strong",
        excludeIds: previouslyPlayed,
      });
      if (!pick) return res.status(404).json({ error: "No coach quote available" });
      const audioUrl = await getOrGenerateQuoteAudio(pick, uploadsDir);
      if (session) {
        // Atomic dedupe — same pattern as the bridge endpoint.
        await db.execute(sql`
          UPDATE circuit_sessions
          SET meta = jsonb_set(
            COALESCE(meta, '{}'::jsonb),
            ARRAY['quotesPlayed'],
            COALESCE(meta -> 'quotesPlayed', '[]'::jsonb)
              || to_jsonb(ARRAY[${pick.id}::text])
          )
          WHERE id = ${session.id}
            AND user_id = ${userId}
            AND NOT (COALESCE(meta -> 'quotesPlayed', '[]'::jsonb)
                     @> to_jsonb(ARRAY[${pick.id}::text]))
        `);
      }
      res.json({
        id: pick.id,
        text: pick.text,
        category: pick.category,
        intensity: pick.intensity,
        audioUrl,
      });
    },
  );
}
