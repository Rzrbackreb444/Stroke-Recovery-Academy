// P3-03 Accountability Buddy auto-pairing.
// Survivors opt in with their routine level + interests. The matcher scores
// candidates by interest overlap + routine-level proximity and atomically
// pairs the top match. One active pair per user is enforced via partial
// unique indexes on buddy_pairs(user1_id|user2_id) WHERE status='active'.
import type { Express } from "express";
import { z } from "zod";
import { db } from "../db";
import { buddyProfiles, buddyPairs, users } from "@shared/schema";
import { and, eq, or, sql } from "drizzle-orm";

const profileSchema = z.object({
  optedIn: z.boolean(),
  routineLevel: z.number().int().min(0).max(4),
  interests: z.array(z.string().min(1).max(40)).max(12),
  bio: z.string().max(500).optional(),
});

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

export function registerBuddyRoutes(app: Express, isAuthenticated: any) {
  // Get my opt-in profile
  app.get("/api/buddy/profile", isAuthenticated, async (req: any, res) => {
    const uid = req.user.claims.sub;
    const [p] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
    res.json(p || null);
  });

  // Upsert my opt-in profile
  app.put("/api/buddy/profile", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
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
    const uid = req.user.claims.sub;
    const result = await withPartner(uid);
    res.json(result);
  });

  // Run the matcher and create a pair atomically
  app.post("/api/buddy/find", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
      const [me] = await db.select().from(buddyProfiles).where(eq(buddyProfiles.userId, uid)).limit(1);
      if (!me || !me.optedIn) {
        return res.status(400).json({ error: "Opt in to buddy matching first" });
      }
      if (await findActivePair(uid)) {
        return res.status(409).json({ error: "You already have an active buddy" });
      }

      // Score candidates: interest overlap + routine-level proximity.
      // Exclude users with an existing active pair via NOT EXISTS subqueries.
      const candidates = await db.execute(sql`
        SELECT bp.user_id, bp.routine_level, bp.interests,
          cardinality(ARRAY(
            SELECT UNNEST(bp.interests) INTERSECT SELECT UNNEST(${me.interests}::text[])
          ))::int AS overlap
        FROM buddy_profiles bp
        WHERE bp.user_id <> ${uid}
          AND bp.opted_in = TRUE
          AND bp.status = 'looking'
          AND NOT EXISTS (
            SELECT 1 FROM buddy_pairs p
            WHERE p.status='active' AND (p.user1_id=bp.user_id OR p.user2_id=bp.user_id)
          )
        ORDER BY overlap DESC, ABS(bp.routine_level - ${me.routineLevel}) ASC, RANDOM()
        LIMIT 5
      `);
      const rows = ((candidates as any).rows ?? candidates) as any[];
      if (!rows.length) return res.json({ matched: false });

      // Try each candidate in score order. Atomicity guaranteed by the
      // PRIMARY KEY on buddy_active_members(user_id): if either side is
      // already (or concurrently becomes) part of an active pair, the
      // INSERT into buddy_active_members will fail and we roll back +
      // try the next candidate.
      for (const c of rows) {
        const [u1, u2] = uid < c.user_id ? [uid, c.user_id] : [c.user_id, uid];
        try {
          const newPair = await db.transaction(async (tx) => {
            const inserted = await tx.execute(sql`
              INSERT INTO buddy_pairs (user1_id, user2_id, status)
              VALUES (${u1}, ${u2}, 'active')
              RETURNING id
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
            return pairId;
          });
          if (newPair) {
            const result = await withPartner(uid);
            return res.json({ matched: true, ...result });
          }
        } catch (err: any) {
          // 23505 = unique_violation (someone else paired this candidate first)
          if (err?.code === "23505" || err?.cause?.code === "23505") continue;
          throw err;
        }
      }
      res.json({ matched: false });
    } catch (e: any) {
      console.error("[buddy] find error", e);
      res.status(500).json({ error: e?.message || "Matching failed" });
    }
  });

  // End current pairing — clears active membership rows so both sides
  // can be matched again immediately.
  app.post("/api/buddy/end", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
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
