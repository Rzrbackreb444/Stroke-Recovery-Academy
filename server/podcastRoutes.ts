// G7 — Podcast pipeline.
// 1) Admin action: turn a blog post into a podcast episode (Gemini script polish → ElevenLabs Nick voice → MP3 stored in DB as data URL).
// 2) Public RSS 2.0 feed at /podcast/feed.xml with iTunes namespace from published episodes.

import type { Express } from "express";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { podcasts, podcastEpisodes, blogPosts } from "@shared/schema";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { sasquatchSpeak } from "./elevenlabs";

const SITE_URL = "https://strokerecoveryacademy.com";
const SHOW_TITLE = "Stroke Recovery Academy with Nick Kremers";
const SHOW_DESC = "Survivor-led, lived-experience guidance for stroke recovery. Nick Kremers — 7-year survivor — narrates the practical playbook he wishes he'd had at week one. Non-clinical. Direct. No magic, just the work.";
const SHOW_AUTHOR = "Nick Kremers";
const SHOW_EMAIL = "nick@strokerecoveryacademy.com";
const SHOW_CATEGORY = "Health & Fitness";
const SHOW_LANGUAGE = "en-us";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Strip markdown / HTML to plain narration text.
function toNarrationText(markdown: string): string {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, "")           // code fences
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")       // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")    // links → text
    .replace(/[*_~`]/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/<[^>]+>/g, "")                    // any html tags
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

async function getOrCreateDefaultShow(userId: string) {
  const existing = await db.select().from(podcasts).where(eq(podcasts.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(podcasts).values({
    userId,
    title: SHOW_TITLE,
    description: SHOW_DESC,
    category: SHOW_CATEGORY,
    language: "en",
    isPublished: true,
    publishedAt: new Date(),
  }).returning();
  return row;
}

// ────────────────────────────── Routes ──────────────────────────────

export function registerPodcastPipelineRoutes(app: Express): void {
  // POST /api/admin/podcast/from-blog/:postId — generate an episode from a blog post.
  app.post("/api/admin/podcast/from-blog/:postId", isAuthenticated, async (req: any, res) => {
    try {
      const u = await storage.getUser(req.user.claims.sub);
      if (!u || u.role !== "admin") return res.status(403).json({ message: "Admin only" });

      const postId = parseInt(req.params.postId, 10);
      if (isNaN(postId)) return res.status(400).json({ message: "Invalid postId" });

      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
      if (!post) return res.status(404).json({ message: "Post not found" });

      // 1) Polish the script via Gemini (optional — falls back to plain narration if no API key).
      const apiKey = process.env.GEMINI_API_KEY;
      let script = "";
      const baseText = toNarrationText(post.content);

      if (apiKey) {
        const polishPrompt = `Rewrite the following blog post as a podcast script for Nick Kremers, a 7-year stroke survivor. Voice: warm, direct, conversational, never sycophantic, occasionally blunt. First person — Nick speaking. Open with a 2-3 sentence cold open hook (no music cue text). Read time 4–7 minutes. End with one concrete next-step listeners can take today. No section headings. No "in this episode" preamble. No "thanks for listening" outro padding — end on the call to action.

TITLE: ${post.title}
EXCERPT: ${post.excerpt || ""}
BLOG BODY:
${baseText.slice(0, 10000)}

Return ONLY the spoken script, nothing else.`;

        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: polishPrompt }] }],
                generationConfig: { temperature: 0.65, maxOutputTokens: 4096 },
              }),
            }
          );
          if (r.ok) {
            const j = await r.json();
            script = (j?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
          }
        } catch (e) {
          console.warn("[podcast] Gemini polish failed, falling back to raw text:", e);
        }
      }

      if (!script) script = baseText;
      if (!script || script.length < 60) return res.status(400).json({ message: "Script too short to narrate." });
      // ElevenLabs has practical limits; cap at ~5000 chars to keep one synthesis call manageable.
      const finalScript = script.slice(0, 5000);

      // 2) Narrate via ElevenLabs (Sasquatch voice).
      let audioBuffer: Buffer;
      try {
        audioBuffer = await sasquatchSpeak(finalScript);
      } catch (e: any) {
        console.error("[podcast] ElevenLabs error:", e?.message || e);
        return res.status(502).json({ message: "Voice synthesis failed", detail: String(e?.message || e) });
      }

      const dataUrl = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;
      // Estimate duration: rough wpm 165, then * 60 / 1000 → seconds.
      const wordCount = finalScript.split(/\s+/).length;
      const estimatedDuration = Math.max(60, Math.round((wordCount / 165) * 60));

      // 3) Persist episode under the admin's default show.
      const show = await getOrCreateDefaultShow(u.id);

      const existingEpisodes = await db.select({ episodeNumber: podcastEpisodes.episodeNumber })
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.podcastId, show.id))
        .orderBy(desc(podcastEpisodes.episodeNumber))
        .limit(1);
      const nextNumber = (existingEpisodes[0]?.episodeNumber || 0) + 1;

      const [ep] = await db.insert(podcastEpisodes).values({
        podcastId: show.id,
        title: post.title,
        description: (post.excerpt || post.metaDescription || "").slice(0, 500),
        showNotes: post.content,
        audioUrl: dataUrl,
        coverArtUrl: post.heroImageUrl || null,
        duration: estimatedDuration,
        transcript: finalScript,
        transcriptionStatus: "complete",
        episodeNumber: nextNumber,
        status: "published",
        isPublished: true,
        publishedAt: new Date(),
      }).returning();

      // Bump show counters.
      await db.update(podcasts).set({
        episodeCount: nextNumber,
        totalDuration: (show.totalDuration || 0) + estimatedDuration,
        updatedAt: new Date(),
      }).where(eq(podcasts.id, show.id));

      res.json({ success: true, episodeId: ep.id, episodeNumber: nextNumber, durationSec: estimatedDuration, sizeBytes: audioBuffer.length });
    } catch (error: any) {
      console.error("Podcast generation error:", error);
      res.status(500).json({ message: "Failed to generate podcast.", detail: String(error?.message || error) });
    }
  });

  // GET /podcast/episode/:id/audio.mp3 — stream the stored audio for a published episode.
  app.get("/podcast/episode/:id/audio.mp3", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).send("Invalid id");
      const [ep] = await db.select().from(podcastEpisodes).where(and(eq(podcastEpisodes.id, id), eq(podcastEpisodes.isPublished, true))).limit(1);
      if (!ep || !ep.audioUrl) return res.status(404).send("Not found");
      const m = ep.audioUrl.match(/^data:(audio\/[^;]+);base64,(.+)$/);
      if (!m) return res.status(500).send("Invalid stored audio");
      const buf = Buffer.from(m[2], "base64");
      res.set("Content-Type", m[1]);
      res.set("Accept-Ranges", "bytes");
      res.set("Cache-Control", "public, max-age=86400");
      res.set("Content-Length", String(buf.length));
      res.send(buf);
    } catch (e) {
      console.error("Episode audio error:", e);
      res.status(500).send("Internal error");
    }
  });

  // GET /podcast/feed.xml — RSS 2.0 with iTunes namespace.
  app.get("/podcast/feed.xml", async (req, res) => {
    try {
      // Use the first published podcast row as the canonical show; if none, render an empty-channel feed.
      const showRow = await db.select().from(podcasts).where(eq(podcasts.isPublished, true)).orderBy(desc(podcasts.createdAt)).limit(1);
      const show = showRow[0];

      // Project only the columns the feed needs; compute audio byte length in SQL
      // so we never load full base64 blobs into Node memory.
      const eps = show
        ? await db.select({
            id: podcastEpisodes.id,
            title: podcastEpisodes.title,
            description: podcastEpisodes.description,
            duration: podcastEpisodes.duration,
            episodeNumber: podcastEpisodes.episodeNumber,
            publishedAt: podcastEpisodes.publishedAt,
            // Approx MP3 byte length: base64 payload = 4/3 of raw bytes; we strip the
            // "data:audio/mpeg;base64," prefix (~23 chars) before dividing.
            audioBytes: sql<number>`CASE WHEN ${podcastEpisodes.audioUrl} IS NULL THEN 0 ELSE FLOOR((OCTET_LENGTH(${podcastEpisodes.audioUrl}) - 23) * 3 / 4) END`,
          }).from(podcastEpisodes)
            .where(and(eq(podcastEpisodes.podcastId, show.id), eq(podcastEpisodes.isPublished, true)))
            .orderBy(desc(podcastEpisodes.publishedAt))
            .limit(100)
        : [];

      const buildDate = new Date().toUTCString();
      const channelTitle = show?.title || SHOW_TITLE;
      const channelDesc = show?.description || SHOW_DESC;
      const channelImage = show?.coverArtUrl || `${SITE_URL}/og-image.jpg`;

      const items = eps.map((e) => {
        const pub = e.publishedAt ? new Date(e.publishedAt).toUTCString() : buildDate;
        const audioPub = `${SITE_URL}/podcast/episode/${e.id}/audio.mp3`;
        const guid = `${SITE_URL}/podcast/episode/${e.id}`;
        const summary = (e.description || "").slice(0, 600);
        return `    <item>
      <title>${esc(e.title)}</title>
      <description>${esc(summary)}</description>
      <link>${esc(guid)}</link>
      <guid isPermaLink="true">${esc(guid)}</guid>
      <pubDate>${pub}</pubDate>
      <enclosure url="${esc(audioPub)}" type="audio/mpeg" length="${Math.max(0, Number(e.audioBytes) || 0)}"/>
      <itunes:title>${esc(e.title)}</itunes:title>
      <itunes:author>${esc(SHOW_AUTHOR)}</itunes:author>
      <itunes:summary>${esc(summary)}</itunes:summary>
      <itunes:duration>${e.duration || 0}</itunes:duration>
      <itunes:episode>${e.episodeNumber || 0}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
      }).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(channelTitle)}</title>
    <link>${SITE_URL}/recovery</link>
    <atom:link href="${SITE_URL}/podcast/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(channelDesc)}</description>
    <language>${SHOW_LANGUAGE}</language>
    <copyright>© ${new Date().getFullYear()} Stroke Recovery Academy</copyright>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <itunes:author>${esc(SHOW_AUTHOR)}</itunes:author>
    <itunes:summary>${esc(channelDesc)}</itunes:summary>
    <itunes:owner>
      <itunes:name>${esc(SHOW_AUTHOR)}</itunes:name>
      <itunes:email>${esc(SHOW_EMAIL)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${esc(channelImage)}" />
    <itunes:category text="${esc(SHOW_CATEGORY)}" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items}
  </channel>
</rss>`;

      res.set("Content-Type", "application/rss+xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=600");
      res.send(xml);
    } catch (e) {
      console.error("Podcast feed error:", e);
      res.status(500).send("Internal error");
    }
  });
}
