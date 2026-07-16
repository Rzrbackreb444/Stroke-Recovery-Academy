import type { Express } from "express";
import { db } from "./db";
import { sparks, sparkSourceAtoms, users } from "@shared/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import { getUserId } from "./lib/authUtils";
import { z } from "zod";
import { generateSparkDraft } from "./services/spark/sparkEngine";
import { uploadSparkMedia } from "./lib/sparkMedia";
import { generateImageWithImagen } from "./imagenService";
import { textToSpeech } from "./elevenlabs";
import { sendEmail } from "./emailService";
import { renderEmail } from "./emailTemplate";
import { renderSsrPage } from "./seo/ssrShell";

const SITE_URL = "https://strokerecoveryacademy.com";
const TIER_ORDER = ["explorer", "warrior", "champion", "platinum"] as const;
type Tier = (typeof TIER_ORDER)[number];

function getRecoveryTier(subscriptionTier?: string | null): Tier {
  switch (subscriptionTier) {
    case "enterprise": return "platinum";
    case "pro": return "champion";
    case "creator":
    case "survivor": return "warrior";
    default: return "explorer";
  }
}
function canAccessTier(userTier: Tier, requiredTier: string): boolean {
  const ui = TIER_ORDER.indexOf(userTier);
  const ri = TIER_ORDER.indexOf(requiredTier as Tier);
  return ri >= 0 && ui >= ri;
}
// Billing tiers that satisfy a given recovery tier (for subscriber email targeting).
function billingTiersFor(requiredTier: string): string[] {
  const ri = TIER_ORDER.indexOf(requiredTier as Tier);
  const map: Record<Tier, string[]> = {
    explorer: ["free", "survivor", "creator", "pro", "enterprise"],
    warrior: ["survivor", "creator", "pro", "enterprise"],
    champion: ["pro", "enterprise"],
    platinum: ["enterprise"],
  };
  return ri >= 0 ? map[TIER_ORDER[ri]] : map.warrior;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || `spark-${Date.now()}`;
  let n = 1;
  while (true) {
    const [hit] = await db.select({ id: sparks.id }).from(sparks).where(eq(sparks.slug, slug));
    if (!hit) return slug;
    slug = `${base}-${++n}`;
  }
}

// Minimal, safe Markdown → HTML for email/reader body (server-controlled AI text).
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdToEmailHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const flush = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const inline = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (/^##\s+/.test(line)) { flush(); out.push(`<p class="tip-label">${inline(line.replace(/^##\s+/, ""))}</p>`); }
    else if (/^#\s+/.test(line)) { flush(); out.push(`<p class="tip-label">${inline(line.replace(/^#\s+/, ""))}</p>`); }
    else if (/^[-*]\s+/.test(line)) { if (!inList) { out.push('<ul style="margin:0 0 18px;padding-left:22px;">'); inList = true; } out.push(`<li class="body-text" style="margin:0 0 8px;">${inline(line.replace(/^[-*]\s+/, ""))}</li>`); }
    else { flush(); out.push(`<p class="body-text">${inline(line)}</p>`); }
  }
  flush();
  return out.join("\n");
}

export function registerSparkRoutes(app: Express): void {
  // ── Admin: source atoms ────────────────────────────────────────────────
  app.get("/api/admin/spark/atoms", isAuthenticated, requireAdmin, async (_req, res) => {
    const rows = await db.select().from(sparkSourceAtoms).orderBy(desc(sparkSourceAtoms.createdAt));
    res.json(rows);
  });

  app.post("/api/admin/spark/atoms", isAuthenticated, requireAdmin, async (req, res) => {
    const schema = z.object({
      content: z.string().min(10).max(4000),
      kind: z.enum(["insight", "quote", "exercise", "mindset", "story"]).default("insight"),
      tags: z.array(z.string().max(40)).max(8).default([]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid", details: parsed.error.flatten() });
    const [row] = await db.insert(sparkSourceAtoms).values(parsed.data).returning();
    res.json(row);
  });

  // ── Admin: generate a draft Spark from source atoms ─────────────────────
  app.post("/api/admin/spark/generate", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        category: z.enum(["motivation", "exercise", "mindset", "science"]).optional(),
        angle: z.string().max(300).optional(),
        requiredTier: z.enum(TIER_ORDER).default("warrior"),
        atomCount: z.number().int().min(1).max(8).default(4),
      });
      const parsed = schema.safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "invalid", details: parsed.error.flatten() });
      const { category, angle, requiredTier, atomCount } = parsed.data;

      const atoms = await db.select().from(sparkSourceAtoms)
        .orderBy(sql`used_count asc, random()`).limit(atomCount);
      if (atoms.length === 0) {
        return res.status(400).json({ error: "no_atoms", message: "Add source atoms from the manuscript first." });
      }

      const draft = await generateSparkDraft({
        atoms: atoms.map((a) => a.content),
        category,
        angle,
      });

      const slug = await uniqueSlug(slugify(draft.title));
      const [row] = await db.insert(sparks).values({
        slug,
        title: draft.title,
        subject: draft.subject,
        teaser: draft.teaser,
        body: draft.body,
        category: draft.category,
        tags: draft.tags,
        requiredTier,
        status: "draft",
      }).returning();

      // Track atom usage.
      await db.update(sparkSourceAtoms)
        .set({ usedCount: sql`used_count + 1` })
        .where(inArray(sparkSourceAtoms.id, atoms.map((a) => a.id)));

      res.json(row);
    } catch (err: any) {
      console.error("[spark] generate failed:", err?.message || err);
      res.status(500).json({ error: "generation_failed", message: err?.message || "Gemini draft failed" });
    }
  });

  // ── Admin: review queue list + single ───────────────────────────────────
  app.get("/api/admin/spark", isAuthenticated, requireAdmin, async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const rows = status
      ? await db.select().from(sparks).where(eq(sparks.status, status)).orderBy(desc(sparks.createdAt))
      : await db.select().from(sparks).orderBy(desc(sparks.createdAt));
    res.json(rows);
  });

  app.get("/api/admin/spark/:id", isAuthenticated, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.select().from(sparks).where(eq(sparks.id, id));
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });

  // ── Admin: edit draft ───────────────────────────────────────────────────
  app.patch("/api/admin/spark/:id", isAuthenticated, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      title: z.string().min(4).max(160).optional(),
      subject: z.string().min(4).max(160).optional(),
      teaser: z.string().min(20).max(4000).optional(),
      body: z.string().min(50).max(30000).optional(),
      category: z.enum(["motivation", "exercise", "mindset", "science"]).optional(),
      tags: z.array(z.string().max(40)).max(8).optional(),
      requiredTier: z.enum(TIER_ORDER).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid", details: parsed.error.flatten() });
    const [row] = await db.update(sparks)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(sparks.id, id)).returning();
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });

  // ── Admin: approve ──────────────────────────────────────────────────────
  app.post("/api/admin/spark/:id/approve", isAuthenticated, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.update(sparks)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(sparks.id, id)).returning();
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });

  // ── Admin: optional media (Imagen hero + ElevenLabs audio) ──────────────
  app.post("/api/admin/spark/:id/media", isAuthenticated, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const ownerId = getUserId(req)!;
    const schema = z.object({
      image: z.boolean().default(false),
      audio: z.boolean().default(false),
      imagePrompt: z.string().max(600).optional(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid" });
    const [spark] = await db.select().from(sparks).where(eq(sparks.id, id));
    if (!spark) return res.status(404).json({ error: "not_found" });

    const patch: Partial<typeof sparks.$inferInsert> = {};
    try {
      if (parsed.data.image) {
        const prompt = parsed.data.imagePrompt ||
          `Bold woodcut/linocut metal-poster illustration for a stroke-recovery article titled "${spark.title}". Deep ink black, bone white, blood-red accents. Raw, gritty, hopeful. No text.`;
        const img = await generateImageWithImagen(prompt, "16:9");
        if (img.success && img.imageBase64) {
          const buf = Buffer.from(img.imageBase64, "base64");
          patch.heroImageUrl = await uploadSparkMedia(buf, img.mimeType || "image/png", ownerId);
        }
      }
      if (parsed.data.audio) {
        const voiceId = process.env.SASQUATCH_VOICE_ID || "onwK4e9ZLuTAKqWW03F";
        const narration = `${spark.title}. ${spark.body}`.slice(0, 4800);
        const audioBuf = await textToSpeech(narration, voiceId);
        patch.audioUrl = await uploadSparkMedia(audioBuf, "audio/mpeg", ownerId);
      }
    } catch (err: any) {
      console.error("[spark] media failed:", err?.message || err);
      return res.status(500).json({ error: "media_failed", message: err?.message });
    }
    if (Object.keys(patch).length === 0) return res.json(spark);
    const [row] = await db.update(sparks).set({ ...patch, updatedAt: new Date() }).where(eq(sparks.id, id)).returning();
    res.json(row);
  });

  // ── Admin: publish (in-platform + subscriber email) ─────────────────────
  app.post("/api/admin/spark/:id/publish", isAuthenticated, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const schema = z.object({ sendEmail: z.boolean().default(true) });
    const parsed = schema.safeParse(req.body ?? {});
    const sendMail = parsed.success ? parsed.data.sendEmail : true;

    const [spark] = await db.select().from(sparks).where(eq(sparks.id, id));
    if (!spark) return res.status(404).json({ error: "not_found" });
    if (spark.status === "draft") {
      return res.status(400).json({ error: "not_approved", message: "Approve the Spark before publishing." });
    }

    const now = new Date();
    const [row] = await db.update(sparks)
      .set({ status: "published", publishedAt: spark.publishedAt ?? now, updatedAt: now })
      .where(eq(sparks.id, id)).returning();

    let emailResult = { sent: 0, failed: 0 };
    if (sendMail) {
      emailResult = await emailSubscribers(row);
      await db.update(sparks).set({ emailSentAt: new Date() }).where(eq(sparks.id, id));
    }
    res.json({ spark: row, email: emailResult });
  });

  // ── Public: list published teasers ──────────────────────────────────────
  app.get("/api/spark", async (_req, res) => {
    const rows = await db.select({
      id: sparks.id, slug: sparks.slug, title: sparks.title, teaser: sparks.teaser,
      category: sparks.category, tags: sparks.tags, heroImageUrl: sparks.heroImageUrl,
      requiredTier: sparks.requiredTier, publishedAt: sparks.publishedAt,
    }).from(sparks).where(eq(sparks.status, "published")).orderBy(desc(sparks.publishedAt));
    res.json(rows);
  });

  // ── Public/gated: single Spark (teaser always; body only if tier grants) ─
  app.get("/api/spark/:slug", async (req, res) => {
    const [spark] = await db.select().from(sparks)
      .where(and(eq(sparks.slug, req.params.slug), eq(sparks.status, "published")));
    if (!spark) return res.status(404).json({ error: "not_found" });

    const userId = getUserId(req);
    let hasAccess = false;
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      hasAccess = canAccessTier(getRecoveryTier((user as any)?.subscriptionTier), spark.requiredTier);
    }

    // Count a teaser view (non-owners).
    await db.update(sparks).set({ teaserViews: sql`teaser_views + 1` }).where(eq(sparks.id, spark.id));

    res.json({
      id: spark.id, slug: spark.slug, title: spark.title, teaser: spark.teaser,
      category: spark.category, tags: spark.tags, heroImageUrl: spark.heroImageUrl,
      audioUrl: hasAccess ? spark.audioUrl : null,
      requiredTier: spark.requiredTier, publishedAt: spark.publishedAt,
      locked: !hasAccess,
      body: hasAccess ? spark.body : null,
    });
  });

  // ── Public: subscribe CTA click tracking ────────────────────────────────
  app.post("/api/spark/:slug/cta-click", async (req, res) => {
    await db.update(sparks).set({ ctaClicks: sql`cta_clicks + 1` }).where(eq(sparks.slug, req.params.slug));
    res.json({ ok: true });
  });

  // ── SSR: public teaser page (SEO-indexed, ends in subscribe CTA) ─────────
  app.get("/recovery/spark/:slug", async (req, res, next) => {
    try {
      const [spark] = await db.select().from(sparks)
        .where(and(eq(sparks.slug, req.params.slug), eq(sparks.status, "published")));
      if (!spark) return next(); // fall through to SPA / 404

      const teaserParas = spark.teaser.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const html = renderSsrPage({
        url: `/recovery/spark/${spark.slug}`,
        title: `${spark.title} | Sasquatch Spark`.slice(0, 65),
        description: teaserParas[0]?.slice(0, 155) || spark.title,
        h1: spark.title,
        hero: {
          eyebrow: "Sasquatch Spark",
          subhead: "Weekly recovery fuel from Nick Kremers — straight from the manuscript.",
          ctaPrimary: { href: "/pricing", label: "Unlock the full Spark" },
        },
        sections: [
          { paragraphs: teaserParas },
          {
            h2: "Want the rest?",
            paragraphs: [
              "This is the teaser. The full Spark — the payoff, the how, and the gut-punch — ships to subscribers in-platform and by email every week.",
              "Join the Academy to read the complete edition and every Spark in the archive.",
            ],
          },
        ],
        faqs: [],
        related: [],
        image: spark.heroImageUrl && spark.heroImageUrl.startsWith("http")
          ? spark.heroImageUrl
          : spark.heroImageUrl ? `${SITE_URL}${spark.heroImageUrl}` : undefined,
        schemaType: "Article",
        breadcrumbs: [
          { name: "Home", href: "/" },
          { name: "Sparks", href: "/recovery/sparks" },
          { name: spark.title, href: `/recovery/spark/${spark.slug}` },
        ],
      });
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("X-SRA-SSR", "1");
      res.send(html);
    } catch (err) {
      console.error("[spark] SSR failed:", err);
      next();
    }
  });
}

// Sends the full subscriber edition to every user whose tier grants access.
async function emailSubscribers(spark: typeof sparks.$inferSelect): Promise<{ sent: number; failed: number }> {
  const allowedBilling = billingTiersFor(spark.requiredTier);
  const recipients = await db.select({ email: users.email })
    .from(users)
    .where(inArray(users.subscriptionTier, allowedBilling));

  const ctaHref = `${SITE_URL}/recovery/spark/${spark.slug}`;
  const heroImage = spark.heroImageUrl
    ? (spark.heroImageUrl.startsWith("http") ? spark.heroImageUrl : `${SITE_URL}${spark.heroImageUrl}`)
    : undefined;

  const bodyHtml = `${mdToEmailHtml(spark.body)}
    <div class="cta-block"><a class="cta-btn" href="${ctaHref}">Read on the platform</a></div>`;

  const html = renderEmail({
    previewText: spark.subject,
    eyebrow: "Sasquatch Spark",
    headline: spark.title,
    heroImage,
    bodyHtml,
    showCrisisCallout: true,
    whyReceiving: "You're receiving this because your Stroke Recovery Academy subscription includes the weekly Sasquatch Spark.",
  });

  let sent = 0, failed = 0;
  for (const r of recipients) {
    if (!r.email) continue;
    const result = await sendEmail({ to: r.email, subject: spark.subject || spark.title, html });
    if (result.success) sent++; else failed++;
  }
  return { sent, failed };
}
