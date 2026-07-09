// P2-01 Forum routes — boards (forum_categories), threads, posts with threaded
// replies + voice replies + upvote/downvote + reputation + crisis detection.
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from '../db';
import {
  forumCategories, forumThreads, forumPosts, forumVotes, users,
  type ForumPost,
} from '@workspace/db';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { transcribeVideo } from '../videoTranscription';
import { getUserId } from "../lib/authUtils";

// ── Crisis detection: returns true if any phrase matches (case-insensitive) ──
const CRISIS_PATTERNS = [
  /\bkill (my|her|his|them)self\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend (it|my life|it all)\b/i,
  /\b(i (want|am going) to die)\b/i,
  /\b(no reason to (live|go on))\b/i,
  /\bself[- ]harm\b/i,
  /\bhurt(ing)? myself\b/i,
];
function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((rx) => rx.test(text));
}

// ── Slugify helper ──
function slugify(s: string): string {
  return (s || 'thread').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'thread';
}

const MAX_TITLE = 200;
const MAX_BODY = 10_000;

export function registerForumRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  // Audio uploads for voice replies (Whisper accepts up to 25MB)
  const audioStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniq = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'forum-voice-' + uniq + (path.extname(file.originalname) || '.webm'));
    },
  });
  const audioUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = /audio|video\/webm/.test(file.mimetype) ||
        /\.(webm|m4a|mp3|wav|ogg|mp4)$/i.test(file.originalname);
      cb(ok ? null : (new Error('Only audio files allowed') as any), ok);
    },
  });

  // GET /api/forum/boards — list all active forum categories
  app.get('/api/forum/boards', async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(forumCategories)
        .where(eq(forumCategories.isActive, true))
        .orderBy(asc(forumCategories.order));
      // Attach thread counts
      const counts = await db.select({
        categoryId: forumThreads.categoryId,
        count: sql<number>`count(*)::int`,
      }).from(forumThreads).groupBy(forumThreads.categoryId);
      const countMap = new Map(counts.map(c => [c.categoryId, c.count]));
      res.json(rows.map(r => ({ ...r, threadCount: countMap.get(r.id) ?? 0 })));
    } catch (e: any) {
      console.error('[forum] boards error', e);
      res.status(500).json({ error: e?.message || 'Failed to load boards' });
    }
  });

  // GET /api/forum/boards/:slug/threads?limit=50
  app.get('/api/forum/boards/:slug/threads', async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || '');
      const limit = Math.min(100, parseInt(String(req.query.limit || '50'), 10) || 50);
      const board = (await db.select().from(forumCategories).where(eq(forumCategories.slug, slug)).limit(1))[0];
      if (!board) return res.status(404).json({ error: 'Board not found' });

      const threads = await db.select({
        id: forumThreads.id,
        title: forumThreads.title,
        slug: forumThreads.slug,
        isPinned: forumThreads.isPinned,
        isLocked: forumThreads.isLocked,
        replyCount: forumThreads.replyCount,
        viewCount: forumThreads.viewCount,
        answerPostId: forumThreads.answerPostId,
        lastActivityAt: forumThreads.lastActivityAt,
        createdAt: forumThreads.createdAt,
        authorId: forumThreads.authorId,
        authorName: users.firstName,
        authorAvatar: users.avatarUrl,
      }).from(forumThreads)
        .leftJoin(users, eq(users.id, forumThreads.authorId))
        .where(eq(forumThreads.categoryId, board.id))
        .orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastActivityAt))
        .limit(limit);
      res.json({ board, threads });
    } catch (e: any) {
      console.error('[forum] board threads error', e);
      res.status(500).json({ error: e?.message || 'Failed to load threads' });
    }
  });

  // GET /api/forum/threads/:id/full — enriched thread + posts list + user vote map.
  // (The bare /api/forum/threads/:id is served by pre-existing code in server/routes.ts.)
  app.get('/api/forum/threads/:id/full', async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
      const thread = (await db.select().from(forumThreads).where(eq(forumThreads.id, id)).limit(1))[0];
      if (!thread) return res.status(404).json({ error: 'Not found' });

      // Bump view count (fire-and-forget)
      db.update(forumThreads).set({ viewCount: sql`${forumThreads.viewCount} + 1` })
        .where(eq(forumThreads.id, id)).catch(() => {});

      const posts = await db.select({
        id: forumPosts.id,
        threadId: forumPosts.threadId,
        authorId: forumPosts.authorId,
        parentId: forumPosts.parentId,
        content: forumPosts.content,
        audioUrl: forumPosts.audioUrl,
        isOriginal: forumPosts.isOriginal,
        isEdited: forumPosts.isEdited,
        score: forumPosts.score,
        crisisFlag: forumPosts.crisisFlag,
        isDeleted: forumPosts.isDeleted,
        createdAt: forumPosts.createdAt,
        authorName: users.firstName,
        authorAvatar: users.avatarUrl,
      }).from(forumPosts)
        .leftJoin(users, eq(users.id, forumPosts.authorId))
        .where(eq(forumPosts.threadId, id))
        .orderBy(asc(forumPosts.createdAt));

      // User's own votes on these posts
      let myVotes: Record<number, number> = {};
      const uid = getUserId(req);
      if (uid && posts.length) {
        const ids = posts.map(p => p.id);
        const v = await db.select().from(forumVotes)
          .where(and(eq(forumVotes.userId, uid), inArray(forumVotes.postId, ids)));
        myVotes = Object.fromEntries(v.map(x => [x.postId, x.value]));
      }

      res.json({ thread, posts, myVotes });
    } catch (e: any) {
      console.error('[forum] thread detail error', e);
      res.status(500).json({ error: e?.message || 'Failed to load thread' });
    }
  });

  // NOTE: POST /api/forum/threads and GET /api/forum/threads/:id are already
  // registered in server/routes.ts (pre-existing). We augment with crisis-flag
  // enrichment via separate endpoints (/api/forum/threads/:id/posts etc).
  // Legacy creator kept below for reference but Express first-match means the
  // existing handler wins; this is a no-op in practice.
  app.post('/api/forum/threads/new', isAuthenticated, async (req: any, res: Response) => {
    try {
      const uid = getUserId(req);
      if (!uid) return res.status(401).json({ error: 'Auth required' });
      const boardId = parseInt(req.body?.boardId, 10);
      const title = String(req.body?.title || '').trim().slice(0, MAX_TITLE);
      const content = String(req.body?.content || '').trim().slice(0, MAX_BODY);
      if (!Number.isFinite(boardId) || !title || !content) {
        return res.status(400).json({ error: 'boardId, title, and content required' });
      }
      const board = (await db.select().from(forumCategories).where(eq(forumCategories.id, boardId)).limit(1))[0];
      if (!board) return res.status(404).json({ error: 'Board not found' });

      const crisisFlag = detectCrisis(title + '\n' + content);

      const threadRow = (await db.insert(forumThreads).values({
        categoryId: boardId,
        authorId: uid,
        title,
        slug: slugify(title),
        lastActivityAt: new Date(),
      }).returning())[0];

      const postRow = (await db.insert(forumPosts).values({
        threadId: threadRow.id,
        authorId: uid,
        content,
        isOriginal: true,
        crisisFlag,
      }).returning())[0];

      res.json({ thread: threadRow, post: postRow, crisis: crisisFlag });
    } catch (e: any) {
      console.error('[forum] create thread error', e);
      res.status(500).json({ error: e?.message || 'Failed to create thread' });
    }
  });

  // POST /api/forum/threads/:id/posts — reply (text)
  app.post('/api/forum/threads/:id/posts', isAuthenticated, async (req: any, res: Response) => {
    try {
      const uid = getUserId(req);
      const threadId = parseInt(req.params.id, 10);
      if (!uid || !Number.isFinite(threadId)) return res.status(400).json({ error: 'Invalid request' });
      const content = String(req.body?.content || '').trim().slice(0, MAX_BODY);
      const parentId = req.body?.parentId ? parseInt(req.body.parentId, 10) : null;
      if (!content) return res.status(400).json({ error: 'content required' });

      const thread = (await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1))[0];
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (thread.isLocked) return res.status(403).json({ error: 'Thread is locked' });

      const crisisFlag = detectCrisis(content);
      const post = (await db.insert(forumPosts).values({
        threadId, authorId: uid, content, parentId: parentId || null, crisisFlag,
      }).returning())[0];

      await db.update(forumThreads).set({
        replyCount: sql`${forumThreads.replyCount} + 1`,
        lastActivityAt: new Date(),
      }).where(eq(forumThreads.id, threadId));

      res.json({ post, crisis: crisisFlag });
    } catch (e: any) {
      console.error('[forum] reply error', e);
      res.status(500).json({ error: e?.message || 'Failed to reply' });
    }
  });

  // POST /api/forum/threads/:id/voice — voice reply (multipart audio → Whisper → post)
  app.post('/api/forum/threads/:id/voice', isAuthenticated, audioUpload.single('file'),
    async (req: any, res: Response) => {
      try {
        const uid = getUserId(req);
        const threadId = parseInt(req.params.id, 10);
        if (!uid || !Number.isFinite(threadId)) return res.status(400).json({ error: 'Invalid request' });
        if (!req.file) return res.status(400).json({ error: 'No audio uploaded' });
        const parentId = req.body?.parentId ? parseInt(req.body.parentId, 10) : null;

        const thread = (await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1))[0];
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        if (thread.isLocked) return res.status(403).json({ error: 'Thread is locked' });

        const audioUrl = `/uploads/${req.file.filename}`;
        let transcript = '(voice reply — transcript unavailable)';
        try {
          const r = await transcribeVideo(req.file.path);
          transcript = (r.transcript || '').trim() || transcript;
        } catch (err) {
          console.warn('[forum] voice transcription failed', err);
        }

        const crisisFlag = detectCrisis(transcript);
        const post = (await db.insert(forumPosts).values({
          threadId, authorId: uid, content: transcript, audioUrl,
          parentId: parentId || null, crisisFlag,
        }).returning())[0];

        await db.update(forumThreads).set({
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastActivityAt: new Date(),
        }).where(eq(forumThreads.id, threadId));

        res.json({ post, crisis: crisisFlag });
      } catch (e: any) {
        console.error('[forum] voice reply error', e);
        res.status(500).json({ error: e?.message || 'Failed to save voice reply' });
      }
    }
  );

  // POST /api/forum/posts/:id/vote — body: { value: 1 | -1 | 0 }
  app.post('/api/forum/posts/:id/vote', isAuthenticated, async (req: any, res: Response) => {
    try {
      const uid = getUserId(req);
      const postId = parseInt(req.params.id, 10);
      const value = parseInt(req.body?.value, 10);
      if (!uid || !Number.isFinite(postId) || ![1, -1, 0].includes(value)) {
        return res.status(400).json({ error: 'Invalid vote' });
      }
      const post = (await db.select().from(forumPosts).where(eq(forumPosts.id, postId)).limit(1))[0];
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.authorId === uid) return res.status(400).json({ error: "Can't vote on your own post" });

      await db.transaction(async (tx) => {
        const existing = (await tx.select().from(forumVotes)
          .where(and(eq(forumVotes.userId, uid), eq(forumVotes.postId, postId))).limit(1))[0];
        const oldVal = existing?.value || 0;
        if (value === 0) {
          if (existing) await tx.delete(forumVotes)
            .where(and(eq(forumVotes.userId, uid), eq(forumVotes.postId, postId)));
        } else if (existing) {
          await tx.update(forumVotes).set({ value })
            .where(and(eq(forumVotes.userId, uid), eq(forumVotes.postId, postId)));
        } else {
          await tx.insert(forumVotes).values({ userId: uid, postId, value });
        }
        const delta = value - oldVal;
        if (delta !== 0) {
          await tx.update(forumPosts)
            .set({ score: sql`${forumPosts.score} + ${delta}` })
            .where(eq(forumPosts.id, postId));
        }
      });

      const updated = (await db.select({ score: forumPosts.score }).from(forumPosts)
        .where(eq(forumPosts.id, postId)).limit(1))[0];
      res.json({ ok: true, score: updated?.score ?? 0, myVote: value });
    } catch (e: any) {
      console.error('[forum] vote error', e);
      res.status(500).json({ error: e?.message || 'Vote failed' });
    }
  });

  // POST /api/forum/posts/:id/mark-answer — thread author only
  app.post('/api/forum/posts/:id/mark-answer', isAuthenticated, async (req: any, res: Response) => {
    try {
      const uid = getUserId(req);
      const postId = parseInt(req.params.id, 10);
      if (!uid || !Number.isFinite(postId)) return res.status(400).json({ error: 'Invalid request' });
      const post = (await db.select().from(forumPosts).where(eq(forumPosts.id, postId)).limit(1))[0];
      if (!post) return res.status(404).json({ error: 'Post not found' });
      const thread = (await db.select().from(forumThreads).where(eq(forumThreads.id, post.threadId)).limit(1))[0];
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (thread.authorId !== uid) return res.status(403).json({ error: 'Only thread author can mark answer' });
      const next = thread.answerPostId === postId ? null : postId;
      await db.update(forumThreads).set({ answerPostId: next }).where(eq(forumThreads.id, thread.id));
      res.json({ ok: true, answerPostId: next });
    } catch (e: any) {
      console.error('[forum] mark-answer error', e);
      res.status(500).json({ error: e?.message || 'Failed' });
    }
  });

  // GET /api/forum/users/:id/reputation — sum of scores on user's posts
  app.get('/api/forum/users/:id/reputation', async (req: Request, res: Response) => {
    try {
      const uid = String(req.params.id);
      const r = (await db.select({ rep: sql<number>`coalesce(sum(${forumPosts.score}),0)::int` })
        .from(forumPosts).where(eq(forumPosts.authorId, uid)))[0];
      res.json({ userId: uid, reputation: r?.rep ?? 0 });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed' });
    }
  });

  // DELETE handler is already registered in server/routes.ts — omitted here to avoid conflict.
  app.delete('/api/forum/posts/:id/soft', isAuthenticated, async (req: any, res: Response) => {
    try {
      const uid = getUserId(req);
      const id = parseInt(req.params.id, 10);
      if (!uid || !Number.isFinite(id)) return res.status(400).json({ error: 'Invalid' });
      const post = (await db.select().from(forumPosts).where(eq(forumPosts.id, id)).limit(1))[0];
      if (!post) return res.status(404).json({ error: 'Not found' });
      if (post.authorId !== uid) return res.status(403).json({ error: 'Not yours' });
      await db.update(forumPosts).set({ isDeleted: true, content: '[deleted]' }).where(eq(forumPosts.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed' });
    }
  });
}

// Seed default recovery-focused boards if none exist.
export async function seedForumBoardsIfEmpty() {
  const existing = await db.select().from(forumCategories).limit(1);
  if (existing.length > 0) {
    console.log('[forum] boards already present, skipping seed');
    return;
  }
  const seeds = [
    { name: 'Recovery Stories', slug: 'recovery-stories', description: 'Share your journey and read others.', icon: 'Heart', order: 10 },
    { name: 'Exercise & Therapy', slug: 'exercise-therapy', description: 'Movement, rehab, and physical therapy.', icon: 'Activity', order: 20 },
    { name: 'Mental Health', slug: 'mental-health', description: 'Emotional recovery and mindset.', icon: 'Brain', order: 30 },
    { name: 'Caregiver Support', slug: 'caregiver-support', description: 'For partners, family, and caregivers.', icon: 'Users', order: 40 },
    { name: 'Tips & Techniques', slug: 'tips-techniques', description: 'What worked, what didn\'t.', icon: 'Lightbulb', order: 50 },
    { name: 'Ask the Community', slug: 'ask-community', description: 'Questions — survivors answer.', icon: 'MessageCircle', order: 60 },
  ];
  await db.insert(forumCategories).values(seeds);
  console.log('[forum] seeded 6 boards');
}
