// P3-02 Live Circles — community video events on top of videoSessions.
// Auto-creates Daily.co rooms when DAILY_API_KEY is set; otherwise host
// supplies a meetingUrl (Zoom/Meet/Daily public link) when scheduling.
import type { Express } from "express";
import { z } from "zod";
import { db } from "../db";
import { videoSessions, videoSessionParticipants, users } from "@shared/schema";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { getUserId } from "../lib/authUtils";

const createSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(15).max(240).default(60),
  maxParticipants: z.number().int().min(2).max(500).default(50),
  meetingUrl: z.string().url().optional(),
  sessionType: z.enum(["group_class", "pod_meeting", "coaching"]).default("group_class"),
});

async function isHostOrAdmin(userId: string): Promise<boolean> {
  const [u] = await db.select({
    role: users.role,
    isVerifiedTherapist: users.isVerifiedTherapist,
  }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.role === "admin" || u?.role === "owner" || !!u?.isVerifiedTherapist;
}

async function createDailyRoom(name: string, scheduledAt: Date, durationMin: number) {
  const key = process.env.DAILY_API_KEY;
  if (!key) return null;
  const expSec = Math.floor(scheduledAt.getTime() / 1000) + durationMin * 60 + 30 * 60;
  try {
    const r = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        name: name.slice(0, 40),
        properties: { exp: expSec, enable_chat: true, enable_screenshare: true, max_participants: 50 },
      }),
    });
    if (!r.ok) {
      console.warn("[circles] Daily room create failed", r.status, await r.text());
      return null;
    }
    return (await r.json()) as { name: string; url: string };
  } catch (e) {
    console.warn("[circles] Daily fetch error", e);
    return null;
  }
}

export function registerLiveEventRoutes(app: Express, isAuthenticated: any) {
  // Whether the current user is eligible to host a circle
  app.get("/api/circles/can-host", isAuthenticated, async (req: any, res) => {
    try {
      const ok = await isHostOrAdmin(getUserId(req)!);
      res.json({ canHost: ok });
    } catch {
      res.json({ canHost: false });
    }
  });

  // Public list — upcoming circles with host + RSVP count
  app.get("/api/circles/upcoming", async (_req, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT
          vs.id, vs.title, vs.description, vs.host_id, vs.session_type,
          vs.scheduled_at, vs.duration, vs.max_participants,
          vs.meeting_url, vs.room_id, vs.status,
          u.first_name AS host_first_name, u.last_name AS host_last_name,
          u.profile_image_url AS host_avatar, u.is_verified_therapist AS host_is_therapist,
          (SELECT COUNT(*)::int FROM video_session_participants vp
             WHERE vp.session_id = vs.id) AS rsvp_count
        FROM video_sessions vs
        LEFT JOIN users u ON u.id = vs.host_id
        WHERE vs.session_type IN ('group_class','pod_meeting','coaching')
          AND (
            (vs.status IN ('scheduled','live')
              AND (vs.scheduled_at + (COALESCE(vs.duration, 60) * INTERVAL '1 minute')) > NOW())
            OR vs.status = 'live'
          )
        ORDER BY vs.scheduled_at ASC
        LIMIT 50
      `);
      res.json((rows as any).rows ?? rows);
    } catch (e: any) {
      console.error("[circles] upcoming error", e);
      res.status(500).json({ error: "Failed to load circles" });
    }
  });

  // Single event detail (auth so we can return user-specific isRsvped)
  app.get("/api/circles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = getUserId(req)!;
      const [event] = await db.select().from(videoSessions).where(eq(videoSessions.id, id)).limit(1);
      if (!event) return res.status(404).json({ error: "Not found" });
      const [host] = await db.select({
        id: users.id, firstName: users.firstName, lastName: users.lastName,
        profileImageUrl: users.profileImageUrl, isVerifiedTherapist: users.isVerifiedTherapist,
        therapistTitle: users.therapistTitle,
      }).from(users).where(eq(users.id, event.hostId)).limit(1);
      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
        .from(videoSessionParticipants)
        .where(eq(videoSessionParticipants.sessionId, id));
      const [mine] = await db.select().from(videoSessionParticipants)
        .where(and(eq(videoSessionParticipants.sessionId, id), eq(videoSessionParticipants.userId, uid)))
        .limit(1);
      res.json({ event, host, rsvpCount: count, isRsvped: !!mine });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // Create — therapists & admins only
  app.post("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req)!;
      if (!(await isHostOrAdmin(uid))) {
        return res.status(403).json({ error: "Only verified therapists or admins can host circles" });
      }
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.format() });

      const scheduledAt = new Date(parsed.data.scheduledAt);
      if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
        return res.status(400).json({ error: "scheduledAt must be in the future" });
      }

      let meetingUrl = parsed.data.meetingUrl || null;
      let roomId: string | null = null;
      const room = await createDailyRoom(`circle-${Date.now()}`, scheduledAt, parsed.data.durationMin);
      if (room) { meetingUrl = room.url; roomId = room.name; }

      if (!meetingUrl) {
        return res.status(400).json({
          error: "Provide a meeting URL (Daily.co API key not configured for auto-rooms)",
        });
      }

      const [created] = await db.insert(videoSessions).values({
        hostId: uid,
        sessionType: parsed.data.sessionType,
        title: parsed.data.title,
        description: parsed.data.description,
        scheduledAt,
        duration: parsed.data.durationMin,
        maxParticipants: parsed.data.maxParticipants,
        meetingUrl,
        roomId,
        status: "scheduled",
      }).returning();

      // Host auto-RSVPs as host
      await db.insert(videoSessionParticipants).values({
        sessionId: created.id, userId: uid, role: "host", status: "invited",
      });

      res.json({ event: created });
    } catch (e: any) {
      console.error("[circles] create error", e);
      res.status(500).json({ error: e?.message || "Failed to create circle" });
    }
  });

  // Toggle RSVP — atomic. Unique index on (session_id, user_id) blocks duplicates,
  // and capacity is checked inside the same SQL statement with row locks.
  app.post("/api/circles/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = getUserId(req)!;
      const [event] = await db.select().from(videoSessions).where(eq(videoSessions.id, id)).limit(1);
      if (!event) return res.status(404).json({ error: "Not found" });
      if (event.status === "ended" || event.status === "cancelled") {
        return res.status(409).json({ error: "Event already finished" });
      }

      const [existing] = await db.select().from(videoSessionParticipants)
        .where(and(
          eq(videoSessionParticipants.sessionId, id),
          eq(videoSessionParticipants.userId, uid)
        )).limit(1);

      if (existing) {
        if (existing.role === "host") {
          return res.status(400).json({ error: "Hosts cannot leave their own circle" });
        }
        await db.delete(videoSessionParticipants)
          .where(eq(videoSessionParticipants.id, existing.id));
        return res.json({ rsvped: false });
      }

      // Atomic capacity-checked insert: WHERE selects only when capacity remains
      // (using FOR UPDATE on the session row to serialize concurrent RSVPs);
      // ON CONFLICT swallows the duplicate-RSVP race via the unique index.
      const cap = event.maxParticipants ?? 999999;
      const inserted = await db.execute(sql`
        WITH locked AS (
          SELECT id FROM video_sessions WHERE id = ${id} FOR UPDATE
        ),
        cnt AS (
          SELECT COUNT(*)::int AS c FROM video_session_participants WHERE session_id = ${id}
        )
        INSERT INTO video_session_participants (session_id, user_id, role, status)
        SELECT ${id}, ${uid}, 'participant', 'invited'
        FROM cnt, locked
        WHERE cnt.c < ${cap}
        ON CONFLICT (session_id, user_id) DO NOTHING
        RETURNING id
      `);
      const rows = ((inserted as any).rows ?? inserted) as any[];
      if (!rows || rows.length === 0) {
        // Either capacity was hit, or the unique index caught a concurrent dup.
        const [dup] = await db.select().from(videoSessionParticipants)
          .where(and(eq(videoSessionParticipants.sessionId, id), eq(videoSessionParticipants.userId, uid)))
          .limit(1);
        if (dup) return res.json({ rsvped: true });
        return res.status(409).json({ error: "Circle is full" });
      }
      res.json({ rsvped: true });
    } catch (e: any) {
      console.error("[circles] rsvp error", e);
      res.status(500).json({ error: e?.message || "Failed to update RSVP" });
    }
  });

  // Cancel — host or admin
  app.post("/api/circles/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const uid = getUserId(req)!;
      const [event] = await db.select().from(videoSessions).where(eq(videoSessions.id, id)).limit(1);
      if (!event) return res.status(404).json({ error: "Not found" });
      const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, uid)).limit(1);
      const isAdmin = u?.role === "admin" || u?.role === "owner";
      if (event.hostId !== uid && !isAdmin) return res.status(403).json({ error: "Not allowed" });
      await db.update(videoSessions).set({ status: "cancelled" }).where(eq(videoSessions.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to cancel" });
    }
  });
}
