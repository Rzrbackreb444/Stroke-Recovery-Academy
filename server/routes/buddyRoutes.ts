// P3-03 Accountability Buddy — real peer matching + mutual-accept flow.
// Survivors opt in with routine level + interests. The matcher scores candidates
// by DEFICIT PROFILE similarity, RECOVERY STAGE proximity, shared GOALS, and
// interest overlap (data from user_profiles + buddy_profiles), then returns a
// ranked candidate list with human-readable reasons — it does NOT auto-pair.
// Pairing requires a request → mutual accept. One active pair per user is
// enforced by the PRIMARY KEY on buddy_active_members(user_id).
import type { Express } from "express";
import { z } from "zod";
import { db } from "../db";
import { buddyProfiles, buddyPairs, buddyRequests, userProfiles, users } from "@shared/schema";
import { and, eq, or, sql, inArray } from "drizzle-orm";
import { getUserId } from "../lib/authUtils";

const profileSchema = z.object({
  optedIn: z.boolean(),
  routineLevel: z.number().int().min(0).max(4),
  interests: z.array(z.string().min(1).max(40)).max(12),
  bio: z.string().max(500).optional(),
});

const DEFICIT_KEYS = [
  "motor", "speech", "cognitive", "fatigue", "vision", "swallowing", "emotional", "sensory",
] as const;
type Deficits = Partial<Record<(typeof DEFICIT_KEYS)[number], number>>;

const STAGE_LABELS = ["Survival", "Stabilizing", "Rebuilding", "Rising", "Full Power"];

let schemaReady: Promise<void> | null = null;
// db:push is blocked by the external stripe schema (see memory), so self-provision.
function ensureBuddySchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS buddy_requests (
          id SERIAL PRIMARY KEY,
          requester_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          note TEXT,
          score INTEGER,
          reasons TEXT[],
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          responded_at TIMESTAMP
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS buddy_requests_pending_unique
        ON buddy_requests (requester_id, recipient_id) WHERE status = 'pending'
      `);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

async function findActivePair(uid: string) {
  const [pair] = await db.select().from(buddyPairs)
    .where(and(
      eq(buddyPairs.status, "active"),
      or(eq(buddyPairs.user1Id, uid), eq(buddyPairs.user2Id, uid))
    ))
    .limit(1);
  return pair;
}

async function withPartner(uid: string) {
  const pair = await findActivePair(uid);
  if (!pair) return null;
  const partnerId = pair.user1Id === uid ? pair.user2Id : pair.user1Id;
  const [partner] = await db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    profileImageUrl: users.profileImageUrl,
  }).from(users).where(eq(users.id, partnerId)).limit(1);
  const [partnerProfile] = await db.select().from(buddyProfiles)
    .where(eq(buddyProfiles.userId, partnerId)).limit(1);
  return { pair, partner, partnerProfile };
}

// Composite match score + reasons. Higher = better fit.
function scoreCandidate(
  mine: { level: number; interests: string[]; deficits: Deficits; goals: string[]; side?: string | null; strokeType?: string | null },
  cand: { level: number; interests: string[]; deficits: Deficits; goals: string[]; side?: string | null; strokeType?: string | null },
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Recovery stage proximity (0-4 → weight up to 12)
  const stageGap = Math.abs(mine.level - cand.level);
  score += (4 - stageGap) * 3;
  if (stageGap === 0) reasons.push(`Both ${STAGE_LABELS[mine.level] ?? "same stage"}`);
  else if (stageGap === 1) reasons.push("Close recovery stage");

  // Shared recovery goals
  const goalOverlap = mine.goals.filter((g) => cand.goals.includes(g));
  score += goalOverlap.length * 4;
  if (goalOverlap.length) reasons.push(`${goalOverlap.length} shared goal${goalOverlap.length > 1 ? "s" : ""}`);

  // Deficit-profile similarity: closeness across shared deficit dimensions
  const sharedDeficits: string[] = [];
  let deficitCloseness = 0;
  let deficitDims = 0;
  for (const k of DEFICIT_KEYS) {
    const a = mine.deficits?.[k];
    const b = cand.deficits?.[k];
    if (typeof a === "number" && typeof b === "number") {
      deficitDims++;
      const close = 4 - Math.abs(a - b);
      deficitCloseness += close;
      if (a >= 2 && b >= 2 && Math.abs(a - b) <= 1) sharedDeficits.push(k);
    }
  }
  if (deficitDims > 0) score += Math.round((deficitCloseness / deficitDims) * 2);
  if (sharedDeficits.length) {
    reasons.push(`Similar ${sharedDeficits.slice(0, 2).join(" & ")} challenges`);
  }

  // Same affected side / stroke type — shared lived experience
  if (mine.side && cand.side && mine.side === cand.side && mine.side !== "none") {
    score += 2;
    reasons.push(`Both ${mine.side}-side affected`);
  }
  if (mine.strokeType && cand.strokeType && mine.strokeType === cand.strokeType) {
    score += 1;
  }

  // Interest overlap
  const interestOverlap = mine.interests.filter((i) => cand.interests.includes(i));
  score += interestOverlap.length * 2;
  if (interestOverlap.length) {
    reasons.push(`${interestOverlap.length} shared interest${interestOverlap.length > 1 ? "s" : ""}`);
  }

  if (!reasons.length) reasons.push("Available survivor at a similar point");
  return { score, reasons };
}

export function registerBuddyRoutes(app: Express, isAuthenticated: any) {
  void ensureBuddySchema();

  // Get my opt-in profile
  app.get("/api/buddy/profile", isAuthenticated, async (req: any, res) => {
    const uid = getUserId(req);
    const [p] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
    res.json(p || null);
  });

  // Upsert my opt-in profile
  app.put("/api/buddy/profile", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.format() });
      const interests = parsed.data.interests.map(s => s.trim().toLowerCase()).filter(Boolean);

      const [existing] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
      // If they un-opt-in while paired, leave pair intact but mark profile paused.
      const status = existing?.status === "paired" ? "paired" : (parsed.data.optedIn ? "looking" : "paused");
      if (existing) {
        await db.update(buddyProfiles).set({
          optedIn: parsed.data.optedIn,
          routineLevel: parsed.data.routineLevel,
          interests,
          bio: parsed.data.bio,
          status,
          updatedAt: new Date(),
        }).where(eq(buddyProfiles.userId, uid));
      } else {
        await db.insert(buddyProfiles).values({
          userId: uid,
          optedIn: parsed.data.optedIn,
          routineLevel: parsed.data.routineLevel,
          interests,
          bio: parsed.data.bio,
          status,
        });
      }
      const [p] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
      res.json(p);
    } catch (e: any) {
      console.error("[buddy] profile error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // My current buddy (or null)
  app.get("/api/buddy/me", isAuthenticated, async (req: any, res) => {
    const uid = getUserId(req);
    const result = await withPartner(uid);
    res.json(result);
  });

  // Ranked candidate suggestions — deficit profile + stage + goals + interests.
  // Returns candidates only; pairing happens through the request/accept flow.
  app.post("/api/buddy/find", isAuthenticated, async (req: any, res) => {
    try {
      await ensureBuddySchema();
      const uid = getUserId(req);
      const [me] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
      if (!me || !me.optedIn) {
        return res.status(400).json({ error: "Opt in to buddy matching first" });
      }
      if (await findActivePair(uid)) {
        return res.status(409).json({ error: "You already have an active buddy" });
      }

      const [myUp] = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid)).limit(1);
      const mine = {
        level: me.routineLevel,
        interests: me.interests ?? [],
        deficits: (myUp?.deficits ?? {}) as Deficits,
        goals: myUp?.recoveryGoals ?? [],
        side: myUp?.affectedSide,
        strokeType: myUp?.strokeType,
      };

      // Opted-in, looking, unpaired candidates joined with their recovery profile.
      const raw = await db.execute(sql`
        SELECT bp.user_id, bp.routine_level, bp.interests, bp.bio,
               u.first_name, u.last_name, u.profile_image_url,
               up.deficits, up.recovery_goals, up.affected_side, up.stroke_type
        FROM buddy_profiles bp
        JOIN users u ON u.id = bp.user_id
        LEFT JOIN user_profiles up ON up.user_id = bp.user_id
        WHERE bp.user_id <> ${uid}
          AND bp.opted_in = TRUE
          AND bp.status = 'looking'
          AND NOT EXISTS (
            SELECT 1 FROM buddy_active_members m WHERE m.user_id = bp.user_id
          )
      `);
      const rows = ((raw as any).rows ?? raw) as any[];
      if (!rows.length) return res.json({ matched: false, candidates: [] });

      // Pending requests involving me, to annotate candidates.
      const pending = await db.select().from(buddyRequests).where(and(
        eq(buddyRequests.status, "pending"),
        or(eq(buddyRequests.requesterId, uid), eq(buddyRequests.recipientId, uid)),
      ));
      const requestedByMe = new Set(pending.filter(p => p.requesterId === uid).map(p => p.recipientId));
      const requestedToMe = new Set(pending.filter(p => p.recipientId === uid).map(p => p.requesterId));

      const scored = rows.map((c) => {
        const { score, reasons } = scoreCandidate(mine, {
          level: c.routine_level,
          interests: c.interests ?? [],
          deficits: (c.deficits ?? {}) as Deficits,
          goals: c.recovery_goals ?? [],
          side: c.affected_side,
          strokeType: c.stroke_type,
        });
        return {
          userId: c.user_id,
          firstName: c.first_name,
          lastName: c.last_name,
          profileImageUrl: c.profile_image_url,
          routineLevel: c.routine_level,
          stageLabel: STAGE_LABELS[c.routine_level] ?? "",
          interests: c.interests ?? [],
          bio: c.bio,
          score,
          reasons,
          requested: requestedByMe.has(c.user_id),
          requestedYou: requestedToMe.has(c.user_id),
        };
      }).sort((a, b) => b.score - a.score).slice(0, 6);

      res.json({ matched: scored.length > 0, candidates: scored });
    } catch (e: any) {
      console.error("[buddy] find error", e);
      res.status(500).json({ error: e?.message || "Matching failed" });
    }
  });

  // Incoming + outgoing pending requests (enriched with the other survivor).
  app.get("/api/buddy/requests", isAuthenticated, async (req: any, res) => {
    try {
      await ensureBuddySchema();
      const uid = getUserId(req);
      const rows = await db.select().from(buddyRequests).where(and(
        eq(buddyRequests.status, "pending"),
        or(eq(buddyRequests.requesterId, uid), eq(buddyRequests.recipientId, uid)),
      ));
      const otherIds = Array.from(new Set(rows.map(r => r.requesterId === uid ? r.recipientId : r.requesterId)));
      const people = otherIds.length
        ? await db.select({
            id: users.id, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl,
          }).from(users).where(inArray(users.id, otherIds))
        : [];
      const pm = new Map(people.map(p => [p.id, p]));
      const enrich = (r: typeof rows[number], direction: "incoming" | "outgoing") => ({
        id: r.id,
        direction,
        note: r.note,
        reasons: r.reasons ?? [],
        createdAt: r.createdAt,
        person: pm.get(r.requesterId === uid ? r.recipientId : r.requesterId) ?? null,
      });
      res.json({
        incoming: rows.filter(r => r.recipientId === uid).map(r => enrich(r, "incoming")),
        outgoing: rows.filter(r => r.requesterId === uid).map(r => enrich(r, "outgoing")),
      });
    } catch (e: any) {
      console.error("[buddy] requests error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // Send a buddy request (opt-in + mutual-accept: this is the opt-in half).
  app.post("/api/buddy/request", isAuthenticated, async (req: any, res) => {
    try {
      await ensureBuddySchema();
      const uid = getUserId(req);
      const recipientId = typeof req.body?.recipientId === "string" ? req.body.recipientId : "";
      const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 300) : null;
      const reasons: string[] = Array.isArray(req.body?.reasons)
        ? req.body.reasons.filter((r: any) => typeof r === "string").slice(0, 6) : [];
      if (!recipientId || recipientId === uid) return res.status(400).json({ error: "Invalid recipient" });

      const [me] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
      if (!me || !me.optedIn) return res.status(400).json({ error: "Opt in to buddy matching first" });
      // Recipient must exist, be opted in, and still looking — enforced server-side,
      // not just via the candidate list the UI shows.
      const [them] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, recipientId)).limit(1);
      if (!them || !them.optedIn || them.status !== "looking") {
        return res.status(400).json({ error: "That survivor isn't open to buddy matching" });
      }
      if (await findActivePair(uid)) return res.status(409).json({ error: "You already have an active buddy" });
      if (await findActivePair(recipientId)) return res.status(409).json({ error: "That survivor is already paired" });

      // If they already requested me, accepting is the right move — surface that.
      const [reverse] = await db.select().from(buddyRequests).where(and(
        eq(buddyRequests.requesterId, recipientId),
        eq(buddyRequests.recipientId, uid),
        eq(buddyRequests.status, "pending"),
      )).limit(1);
      if (reverse) return res.status(409).json({ error: "They already asked you — accept their request instead", reverseRequestId: reverse.id });

      try {
        const [row] = await db.insert(buddyRequests).values({
          requesterId: uid, recipientId, note, reasons, score: typeof req.body?.score === "number" ? req.body.score : null,
        }).returning();
        res.json({ ok: true, request: row });
      } catch (err: any) {
        if (err?.code === "23505" || err?.cause?.code === "23505") {
          return res.status(409).json({ error: "You already asked this survivor" });
        }
        throw err;
      }
    } catch (e: any) {
      console.error("[buddy] request error", e);
      res.status(500).json({ error: e?.message || "Failed to send request" });
    }
  });

  // Accept an incoming request — creates the pair atomically (mutual accept).
  app.post("/api/buddy/request/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      await ensureBuddySchema();
      const uid = getUserId(req);
      const reqId = parseInt(req.params.id, 10);
      if (!Number.isFinite(reqId)) return res.status(400).json({ error: "Invalid request" });

      const [reqRow] = await db.select().from(buddyRequests).where(eq(buddyRequests.id, reqId)).limit(1);
      if (!reqRow || reqRow.status !== "pending") return res.status(404).json({ error: "Request not found" });
      if (reqRow.recipientId !== uid) return res.status(403).json({ error: "Not your request" });

      const requesterId = reqRow.requesterId;
      if (await findActivePair(uid)) return res.status(409).json({ error: "You already have an active buddy" });
      if (await findActivePair(requesterId)) return res.status(409).json({ error: "They already paired with someone else" });

      const [u1, u2] = uid < requesterId ? [uid, requesterId] : [requesterId, uid];
      try {
        await db.transaction(async (tx) => {
          const inserted = await tx.execute(sql`
            INSERT INTO buddy_pairs (user1_id, user2_id, status)
            VALUES (${u1}, ${u2}, 'active') RETURNING id
          `);
          const pairId = (((inserted as any).rows ?? inserted) as any[])[0].id as number;
          // PRIMARY KEY (user_id) on buddy_active_members blocks double-pairing.
          await tx.execute(sql`
            INSERT INTO buddy_active_members (user_id, pair_id)
            VALUES (${u1}, ${pairId}), (${u2}, ${pairId})
          `);
          await tx.update(buddyProfiles)
            .set({ status: "paired", pairedAt: new Date(), updatedAt: new Date() })
            .where(or(eq(buddyProfiles.userId, u1), eq(buddyProfiles.userId, u2)));
          // Accept this request; cancel any other pending requests touching either survivor.
          await tx.update(buddyRequests)
            .set({ status: "accepted", respondedAt: new Date() })
            .where(eq(buddyRequests.id, reqId));
          await tx.update(buddyRequests)
            .set({ status: "cancelled", respondedAt: new Date() })
            .where(and(
              eq(buddyRequests.status, "pending"),
              or(
                eq(buddyRequests.requesterId, u1), eq(buddyRequests.recipientId, u1),
                eq(buddyRequests.requesterId, u2), eq(buddyRequests.recipientId, u2),
              ),
            ));
        });
      } catch (err: any) {
        if (err?.code === "23505" || err?.cause?.code === "23505") {
          return res.status(409).json({ error: "One of you just paired with someone else" });
        }
        throw err;
      }
      const result = await withPartner(uid);
      res.json({ matched: true, ...result });
    } catch (e: any) {
      console.error("[buddy] accept error", e);
      res.status(500).json({ error: e?.message || "Failed to accept" });
    }
  });

  // Decline an incoming request, or cancel one I sent.
  app.post("/api/buddy/request/:id/decline", isAuthenticated, async (req: any, res) => {
    try {
      await ensureBuddySchema();
      const uid = getUserId(req);
      const reqId = parseInt(req.params.id, 10);
      if (!Number.isFinite(reqId)) return res.status(400).json({ error: "Invalid request" });
      const [reqRow] = await db.select().from(buddyRequests).where(eq(buddyRequests.id, reqId)).limit(1);
      if (!reqRow || reqRow.status !== "pending") return res.status(404).json({ error: "Request not found" });
      if (reqRow.recipientId !== uid && reqRow.requesterId !== uid) return res.status(403).json({ error: "Not your request" });
      const newStatus = reqRow.requesterId === uid ? "cancelled" : "declined";
      await db.update(buddyRequests).set({ status: newStatus, respondedAt: new Date() }).where(eq(buddyRequests.id, reqId));
      res.json({ ok: true });
    } catch (e: any) {
      console.error("[buddy] decline error", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // End current pairing — clears active membership rows so both sides
  // can be matched again immediately.
  app.post("/api/buddy/end", isAuthenticated, async (req: any, res) => {
    try {
      const uid = getUserId(req);
      const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 200) : null;
      const pair = await findActivePair(uid);
      if (!pair) return res.status(404).json({ error: "No active buddy" });
      const otherId = pair.user1Id === uid ? pair.user2Id : pair.user1Id;

      await db.transaction(async (tx) => {
        await tx.update(buddyPairs)
          .set({ status: "ended", endedAt: new Date(), endReason: reason })
          .where(eq(buddyPairs.id, pair.id));
        await tx.execute(sql`
          DELETE FROM buddy_active_members WHERE pair_id = ${pair.id}
        `);
        for (const id of [uid, otherId]) {
          const [p] = await tx.select().from(buddyProfiles).where(eq(buddyProfiles.userId, id)).limit(1);
          if (p) {
            await tx.update(buddyProfiles)
              .set({ status: p.optedIn ? "looking" : "paused", pairedAt: null, updatedAt: new Date() })
              .where(eq(buddyProfiles.userId, id));
          }
        }
      });
      res.json({ ok: true });
    } catch (e: any) {
      console.error("[buddy] end error", e);
      res.status(500).json({ error: e?.message || "Failed to end" });
    }
  });
}
