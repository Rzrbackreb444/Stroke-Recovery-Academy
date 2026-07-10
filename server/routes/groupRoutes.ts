// P2-02 Groups — survivor cohorts, caregiver circles, condition-specific
import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { db } from "../db";
import { groups, groupMembers, groupPosts, users, type Group } from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { transcribeVideo } from "../videoTranscription";

const CRISIS = [
  /\bkill (my|her|his|them)self\b/i, /\bsuicid(e|al)\b/i,
  /\bend (it|my life|it all)\b/i, /\b(i (want|am going) to die)\b/i,
  /\bno reason to (live|go on)\b/i, /\bself[- ]harm\b/i, /\bhurt(ing)? myself\b/i,
];
const detectCrisis = (t: string) => !!t && CRISIS.some((rx) => rx.test(t));

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

export function registerGroupRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const upload = multer({
    // Static literal subdir — no user input reaches the path.
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
    dest: path.join(uploadsDir, "group-voice"),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  // List groups, optional ?type= and ?search=
  app.get("/api/groups", async (req, res) => {
    try {
      const type = (req.query.type as string) || undefined;
      const search = ((req.query.search as string) || "").trim().toLowerCase();
      const uid = (req as any).user?.claims?.sub;

      const rows = await db.select().from(groups).orderBy(desc(groups.memberCount));
      let list = rows;
      if (type) list = list.filter((g) => g.type === type);
      if (search) {
        list = list.filter(
          (g) =>
            g.name.toLowerCase().includes(search) ||
            g.description.toLowerCase().includes(search) ||
            (g.conditionTag || "").toLowerCase().includes(search)
        );
      }

      // myMembership map
      let mine: Record<number, boolean> = {};
      if (uid && list.length) {
        const m = await db.select().from(groupMembers).where(eq(groupMembers.userId, uid));
        mine = Object.fromEntries(m.map((x) => [x.groupId, true]));
      }
      // Hide private-group descriptions from non-members; show name/type/memberCount
      // so they exist in directory but body is gated.
      const safe = list.map((g) => {
        const isMember = !!mine[g.id];
        if (g.isPrivate && !isMember) {
          return { ...g, description: "Private group — join to view details.", isMember };
        }
        return { ...g, isMember };
      });
      res.json(safe);
    } catch (e: any) {
      console.error("[groups] list error", e);
      res.status(500).json({ error: e?.message || "Failed to list groups" });
    }
  });

  // Group detail by slug
  app.get("/api/groups/:slug", async (req, res) => {
    try {
      const uid = (req as any).user?.claims?.sub;
      const slug = req.params.slug;
      const g = (await db.select().from(groups).where(eq(groups.slug, slug)).limit(1))[0];
      if (!g) return res.status(404).json({ error: "Group not found" });

      let isMember = false;
      if (uid) {
        const m = await db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, g.id), eq(groupMembers.userId, uid))).limit(1);
        isMember = m.length > 0;
      }

      // Private-group authz: non-members get a minimal stub (name + type only).
      if (g.isPrivate && !isMember) {
        return res.json({
          id: g.id, slug: g.slug, name: g.name,
          description: "Private group — request an invite from a member to view posts.",
          type: g.type, conditionTag: g.conditionTag, memberCount: g.memberCount,
          ownerId: g.ownerId, isPrivate: true, isMember: false, members: [],
        });
      }

      const members = await db.select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        firstName: users.firstName,
        avatarUrl: users.avatarUrl,
      }).from(groupMembers)
        .leftJoin(users, eq(users.id, groupMembers.userId))
        .where(eq(groupMembers.groupId, g.id))
        .orderBy(desc(groupMembers.joinedAt))
        .limit(50);

      res.json({ ...g, isMember, members });
    } catch (e: any) {
      console.error("[groups] detail error", e);
      res.status(500).json({ error: e?.message || "Failed to load group" });
    }
  });

  // Create a group
  app.post("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
      const name = String(req.body?.name || "").trim().slice(0, 120);
      const description = String(req.body?.description || "").trim().slice(0, 2000);
      const type = String(req.body?.type || "general").trim().slice(0, 20);
      const conditionTag = req.body?.conditionTag
        ? String(req.body.conditionTag).trim().slice(0, 60)
        : null;
      const isPrivate = !!req.body?.isPrivate;

      if (!name || !description) return res.status(400).json({ error: "name and description required" });
      if (!["survivor", "caregiver", "condition", "general"].includes(type)) {
        return res.status(400).json({ error: "invalid type" });
      }

      // unique slug
      let baseSlug = slugify(name) || `group-${Date.now()}`;
      let slug = baseSlug;
      for (let i = 2; i < 50; i++) {
        const existing = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
        if (!existing.length) break;
        slug = `${baseSlug}-${i}`;
      }

      const [g] = await db.insert(groups).values({
        slug, name, description, type, conditionTag, isPrivate,
        ownerId: uid,
      }).returning();

      // Owner auto-joins as owner role + memberCount = 1
      await db.insert(groupMembers).values({ groupId: g.id, userId: uid, role: "owner" });
      await db.update(groups).set({ memberCount: 1 }).where(eq(groups.id, g.id));

      res.json({ ...g, memberCount: 1, isMember: true });
    } catch (e: any) {
      console.error("[groups] create error", e);
      res.status(500).json({ error: e?.message || "Failed to create group" });
    }
  });

  // Join / Leave
  app.post("/api/groups/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
      const gid = parseInt(req.params.id, 10);
      if (!Number.isFinite(gid)) return res.status(400).json({ error: "Invalid id" });
      const g = (await db.select().from(groups).where(eq(groups.id, gid)).limit(1))[0];
      if (!g) return res.status(404).json({ error: "Group not found" });
      if (g.isPrivate) {
        return res.status(403).json({ error: "This group is invite-only. Ask a member for an invite." });
      }
      const existing = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, gid), eq(groupMembers.userId, uid))).limit(1);
      if (existing.length) return res.json({ ok: true, isMember: true });

      await db.insert(groupMembers).values({ groupId: gid, userId: uid, role: "member" });
      await db.update(groups).set({ memberCount: sql`${groups.memberCount} + 1` }).where(eq(groups.id, gid));
      res.json({ ok: true, isMember: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to join" });
    }
  });

  app.post("/api/groups/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
      const gid = parseInt(req.params.id, 10);
      if (!Number.isFinite(gid)) return res.status(400).json({ error: "Invalid id" });
      const g = (await db.select().from(groups).where(eq(groups.id, gid)).limit(1))[0];
      if (!g) return res.status(404).json({ error: "Not found" });
      if (g.ownerId === uid) return res.status(400).json({ error: "Owner cannot leave — delete or transfer first." });

      const del = await db.delete(groupMembers)
        .where(and(eq(groupMembers.groupId, gid), eq(groupMembers.userId, uid))).returning();
      if (del.length) {
        await db.update(groups).set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)` }).where(eq(groups.id, gid));
      }
      res.json({ ok: true, isMember: false });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to leave" });
    }
  });

  // Feed (private groups require membership to read posts)
  app.get("/api/groups/:id/posts", async (req: any, res) => {
    try {
      const uid = req.user?.claims?.sub;
      const gid = parseInt(req.params.id, 10);
      if (!Number.isFinite(gid)) return res.status(400).json({ error: "Invalid id" });
      const g = (await db.select().from(groups).where(eq(groups.id, gid)).limit(1))[0];
      if (!g) return res.status(404).json({ error: "Group not found" });
      if (g.isPrivate) {
        if (!uid) return res.status(403).json({ error: "Private group" });
        const m = await db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, gid), eq(groupMembers.userId, uid))).limit(1);
        if (!m.length) return res.status(403).json({ error: "Join to view posts" });
      }
      const posts = await db.select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        authorId: groupPosts.authorId,
        content: groupPosts.content,
        audioUrl: groupPosts.audioUrl,
        crisisFlag: groupPosts.crisisFlag,
        createdAt: groupPosts.createdAt,
        authorName: users.firstName,
        authorAvatar: users.avatarUrl,
      }).from(groupPosts)
        .leftJoin(users, eq(users.id, groupPosts.authorId))
        .where(eq(groupPosts.groupId, gid))
        .orderBy(desc(groupPosts.createdAt))
        .limit(100);
      res.json(posts);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to load posts" });
    }
  });

  app.post("/api/groups/:id/posts", isAuthenticated, async (req: any, res) => {
    try {
      const uid = req.user.claims.sub;
      const gid = parseInt(req.params.id, 10);
      if (!Number.isFinite(gid)) return res.status(400).json({ error: "Invalid id" });

      // Must be a member
      const m = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, gid), eq(groupMembers.userId, uid))).limit(1);
      if (!m.length) return res.status(403).json({ error: "Join the group to post" });

      const content = String(req.body?.content || "").trim();
      if (!content) return res.status(400).json({ error: "content required" });
      const crisisFlag = detectCrisis(content);

      const [post] = await db.insert(groupPosts).values({
        groupId: gid, authorId: uid, content, crisisFlag,
      }).returning();
      res.json({ ...post, crisis: crisisFlag });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to post" });
    }
  });

  // Voice post (audio → Whisper → text + audio_url)
  app.post(
    "/api/groups/:id/posts/voice",
    isAuthenticated,
    upload.single("audio"),
    async (req: any, res) => {
      try {
        const uid = req.user.claims.sub;
        const gid = parseInt(req.params.id, 10);
        if (!Number.isFinite(gid)) return res.status(400).json({ error: "Invalid id" });
        if (!req.file) return res.status(400).json({ error: "audio file required" });

        const m = await db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, gid), eq(groupMembers.userId, uid))).limit(1);
        if (!m.length) return res.status(403).json({ error: "Join the group to post" });

        const audioUrl = `/uploads/group-voice/${req.file.filename}`;
        let transcript = "";
        let transcriptionFailed = false;
        try {
          const r = await transcribeVideo(req.file.path);
          transcript = (r as any)?.text || (r as any)?.transcript || "";
        } catch (e) {
          transcriptionFailed = true;
          console.warn("[groups] transcription failed, flagging for review", e);
        }
        // If transcription failed OR came back empty, flag for moderator review
        // so voice-only crisis content can't slip by. True crisis keywords also flag.
        const crisisKeywordHit = detectCrisis(transcript);
        const needsReview = transcriptionFailed || !transcript.trim();
        const crisisFlag = crisisKeywordHit || needsReview;
        const content = transcript.trim()
          ? transcript
          : transcriptionFailed
            ? "(voice message — transcription unavailable, pending moderator review)"
            : "(voice message)";
        const [post] = await db.insert(groupPosts).values({
          groupId: gid,
          authorId: uid,
          content,
          audioUrl,
          crisisFlag,
        }).returning();
        res.json({ ...post, crisis: crisisKeywordHit, needsReview });
      } catch (e: any) {
        console.error("[groups] voice post error", e);
        res.status(500).json({ error: e?.message || "Failed to post voice" });
      }
    }
  );
}

// Idempotent starter-seed of a few evergreen groups
export async function seedGroupsIfEmpty(ownerId?: string) {
  const existing = await db.select().from(groups).limit(1);
  if (existing.length) return;
  if (!ownerId) {
    const anyUser = await db.select({ id: users.id }).from(users).limit(1);
    if (!anyUser.length) return;
    ownerId = anyUser[0].id;
  }

  const starter = [
    { slug: "new-survivors", name: "New Survivors Circle", description: "First 90 days after stroke — you are not alone. Share wins, fears, and first steps.", type: "survivor" as const, conditionTag: null },
    { slug: "caregivers-lounge", name: "Caregivers Lounge", description: "Family, partners, and friends holding the line. Trade tips, vent safely, find your people.", type: "caregiver" as const, conditionTag: null },
    { slug: "aphasia-warriors", name: "Aphasia Warriors", description: "Speech and language recovery — patience, drills, and small daily reps compound.", type: "condition" as const, conditionTag: "aphasia" },
    { slug: "left-side-rebuild", name: "Left-Side Rebuild", description: "Right-brain strokes, left-side hemiparesis. Mobility, proprioception, and life hacks.", type: "condition" as const, conditionTag: "left-hemiparesis" },
    { slug: "right-side-rebuild", name: "Right-Side Rebuild", description: "Left-brain strokes, right-side hemiparesis. Aphasia overlap welcome.", type: "condition" as const, conditionTag: "right-hemiparesis" },
    { slug: "returning-to-work", name: "Returning to Work", description: "Back-to-work playbooks — cognitive load, disclosures, accommodations, freelancing.", type: "general" as const, conditionTag: null },
  ];
  for (const s of starter) {
    const [g] = await db.insert(groups).values({
      ...s, ownerId, isPrivate: false,
    } as any).returning();
    await db.insert(groupMembers).values({ groupId: g.id, userId: ownerId, role: "owner" });
    await db.update(groups).set({ memberCount: 1 }).where(eq(groups.id, g.id));
  }
  console.log("[groups] seeded 6 starter groups");
}
