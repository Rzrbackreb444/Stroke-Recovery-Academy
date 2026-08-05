import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { publicRateLimit } from "./middleware/publicRateLimit";
import { getUserId } from "./lib/authUtils";

type CampfireRoom = {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  schedule: string;
  isOpen: (now: Date) => boolean;
  nextOpen: (now: Date) => Date;
  isPremiumOnly?: boolean;
};

function nextDailyAt(now: Date, utcHour: number): Date {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(utcHour);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function nextWeeklyAt(now: Date, utcDays: number[], utcHour: number): Date {
  for (let offset = 0; offset < 8; offset++) {
    const cand = new Date(now);
    cand.setUTCDate(cand.getUTCDate() + offset);
    cand.setUTCHours(utcHour, 0, 0, 0);
    if (utcDays.includes(cand.getUTCDay()) && cand > now) return cand;
  }
  return new Date(now.getTime() + 7 * 86400000);
}

const ROOMS: CampfireRoom[] = [
  {
    id: "morning-circle",
    name: "Morning Circle",
    blurb: "Start your day with the tribe. Coffee, intentions, one-line check-in.",
    emoji: "🔥",
    schedule: "Daily · 8:00–9:00am ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      return h === 12 || h === 13;
    },
    nextOpen: (now) => nextDailyAt(now, 12),
  },
  {
    id: "aphasia-circle",
    name: "Aphasia Circle",
    blurb: "Slow pace, no shame. Type, voice-note, or just sit by the fire.",
    emoji: "🗣️",
    schedule: "Tue & Thu · 2:00–3:00pm ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      const d = now.getUTCDay();
      return (d === 2 || d === 4) && (h === 18 || h === 19);
    },
    nextOpen: (now) => nextWeeklyAt(now, [2, 4], 18),
  },
  {
    id: "caregiver-circle",
    name: "Caregiver Circle",
    blurb: "For the spouse, the kid, the parent. You're a survivor too.",
    emoji: "🤝",
    schedule: "Sun · 7:00–8:00pm ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      const d = now.getUTCDay();
      return d === 0 && (h === 23 || h === 0);
    },
    nextOpen: (now) => nextWeeklyAt(now, [0], 23),
  },
  {
    id: "late-night",
    name: "3am Anyone Else?",
    blurb: "Can't sleep. Brain won't quiet. You're not alone at this fire.",
    emoji: "🌙",
    schedule: "Daily · 11pm–2am ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      return h === 3 || h === 4 || h === 5 || h === 6;
    },
    nextOpen: (now) => nextDailyAt(now, 3),
  },
  {
    id: "coach-circle",
    name: "Coach Circle (Premium)",
    blurb: "Premium-only fire. Sasquatch coaches drop in. Deeper questions, longer answers.",
    emoji: "🛡️",
    schedule: "Mon, Wed, Fri · 12:00–1:00pm ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      const d = now.getUTCDay();
      return (d === 1 || d === 3 || d === 5) && (h === 16 || h === 17);
    },
    nextOpen: (now) => nextWeeklyAt(now, [1, 3, 5], 16),
    isPremiumOnly: true,
  },
  {
    id: "live-with-nick",
    name: "Live with Nick (Premium)",
    blurb: "Founder fireside. 7-year survivor Nick Kremers, live. Premium only.",
    emoji: "🪵",
    schedule: "Sat · 10:00–11:00am ET",
    isOpen: (now) => {
      const h = now.getUTCHours();
      const d = now.getUTCDay();
      return d === 6 && (h === 14 || h === 15);
    },
    nextOpen: (now) => nextWeeklyAt(now, [6], 14),
    isPremiumOnly: true,
  },
];

async function ensureSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS campfire_messages (
      id SERIAL PRIMARY KEY,
      room_id VARCHAR(64) NOT NULL,
      user_id VARCHAR NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_campfire_room_created
    ON campfire_messages (room_id, created_at)
  `);
}

export async function registerCampfireRoutes(app: Express) {
  await ensureSchema();

  const postLimiter = publicRateLimit({
    windowMs: 60_000,
    max: 10,
    bucketName: "campfire-post",
  });

  // GET /api/campfire/rooms — list rooms with computed open status
  app.get("/api/campfire/rooms", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const counts = await db.execute(sql`
        SELECT room_id, COUNT(*)::int AS recent_count
        FROM campfire_messages
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY room_id
      `);
      const countMap = new Map<string, number>();
      for (const row of counts.rows as any[]) {
        countMap.set(row.room_id, row.recent_count);
      }
      const rooms = ROOMS.map((r) => ({
        id: r.id,
        name: r.name,
        blurb: r.blurb,
        emoji: r.emoji,
        schedule: r.schedule,
        isOpen: r.isOpen(now),
        nextOpenAt: r.nextOpen(now).toISOString(),
        recent24h: countMap.get(r.id) ?? 0,
        isPremiumOnly: !!r.isPremiumOnly,
      }));
      res.json({ rooms, serverTime: now.toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to load rooms" });
    }
  });

  // GET /api/campfire/rooms/:roomId/messages?since=<iso>
  app.get(
    "/api/campfire/rooms/:roomId/messages",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { roomId } = req.params;
        const room = ROOMS.find((r) => r.id === roomId);
        if (!room) return res.status(404).json({ error: "Room not found" });

        if (room.isPremiumOnly) {
          const userId = getUserId(req);
          const { isSasquatchPremium } = await import("./services/sasquatchPremiumService");
          if (!userId || !(await isSasquatchPremium(userId))) {
            return res.status(402).json({
              error: "Sasquatch Premium required for this circle.",
              upgradeUrl: "/recovery/premium",
            });
          }
        }

        const sinceRaw = typeof req.query.since === "string" ? req.query.since : null;
        // Reject malformed timestamps before they reach the SQL layer — Postgres
        // would otherwise raise an "invalid input syntax for type timestamp"
        // and we'd surface a generic 500 to the survivor.
        const sinceParsed = sinceRaw ? new Date(sinceRaw) : null;
        const since =
          sinceParsed && !Number.isNaN(sinceParsed.getTime())
            ? sinceParsed.toISOString()
            : null;
        let result;
        if (since) {
          result = await db.execute(sql`
            SELECT m.id, m.room_id, m.user_id, m.body, m.created_at,
                   u.first_name, u.profile_image_url
            FROM campfire_messages m
            LEFT JOIN users u ON u.id = m.user_id
            WHERE m.room_id = ${roomId}
              AND m.created_at > ${since}
            ORDER BY m.created_at ASC
            LIMIT 200
          `);
        } else {
          result = await db.execute(sql`
            SELECT * FROM (
              SELECT m.id, m.room_id, m.user_id, m.body, m.created_at,
                     u.first_name, u.profile_image_url
              FROM campfire_messages m
              LEFT JOIN users u ON u.id = m.user_id
              WHERE m.room_id = ${roomId}
              ORDER BY m.created_at DESC
              LIMIT 100
            ) sub ORDER BY created_at ASC
          `);
        }

        const messages = (result.rows as any[]).map((m) => ({
          id: m.id,
          roomId: m.room_id,
          userId: m.user_id,
          body: m.body,
          createdAt: m.created_at,
          firstName: m.first_name ?? "Survivor",
          avatarUrl: m.profile_image_url ?? null,
        }));
        res.json({ messages, serverTime: new Date().toISOString() });
      } catch (err: any) {
        res.status(500).json({ error: err.message ?? "Failed to load messages" });
      }
    }
  );

  // POST /api/campfire/rooms/:roomId/messages
  app.post(
    "/api/campfire/rooms/:roomId/messages",
    isAuthenticated,
    postLimiter,
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const { roomId } = req.params;
        const room = ROOMS.find((r) => r.id === roomId);
        if (!room) return res.status(404).json({ error: "Room not found" });

        if (room.isPremiumOnly) {
          const { isSasquatchPremium } = await import("./services/sasquatchPremiumService");
          if (!(await isSasquatchPremium(userId))) {
            return res.status(402).json({
              error: "Sasquatch Premium required for this circle.",
              upgradeUrl: "/recovery/premium",
            });
          }
        }

        const now = new Date();
        if (!room.isOpen(now)) {
          return res.status(403).json({
            error: "This circle isn't open right now.",
            nextOpenAt: room.nextOpen(now).toISOString(),
          });
        }

        const bodyRaw = typeof req.body?.body === "string" ? req.body.body.trim() : "";
        if (!bodyRaw) return res.status(400).json({ error: "Message can't be empty" });
        if (bodyRaw.length > 1000) {
          return res.status(400).json({ error: "Message too long (max 1000 chars)" });
        }

        const inserted = await db.execute(sql`
          INSERT INTO campfire_messages (room_id, user_id, body)
          VALUES (${roomId}, ${userId}, ${bodyRaw})
          RETURNING id, room_id, user_id, body, created_at
        `);
        const row = (inserted.rows as any[])[0];
        res.json({
          message: {
            id: row.id,
            roomId: row.room_id,
            userId: row.user_id,
            body: row.body,
            createdAt: row.created_at,
          },
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message ?? "Failed to post message" });
      }
    }
  );
}
