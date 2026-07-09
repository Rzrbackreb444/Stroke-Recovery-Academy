// SSR for DB-backed recovery blog posts — /recovery/blog/:slug.
// These posts live in the `recovery_blog_posts` table and were previously
// rendered client-side only (RecoveryBlogPost.tsx), so crawlers saw a generic
// SPA shell with NO body prose, static meta, and non-per-post JSON-LD.
//
// This route fetches the post per request, splits its Markdown body by H2 into
// ContentSection[] (each section's body rendered to trusted, pre-escaped HTML via
// the local renderMarkdownToHtml), extracts a "Frequently Asked Questions" section
// into FAQPage schema, and ships a full SsrPageConfig through the shared SSR shell
// so it pixel-matches the brand and emits valid Article/MedicalWebPage + FAQ +
// Breadcrumb JSON-LD with real wordCount + reading time.
//
// Registered before the Vite/SPA catch-all (see routes.ts), so the SSR HTML wins
// on cold loads + crawls. In-app wouter navigation still renders the interactive
// SPA page (server route is never hit on client-side nav).

import type { Express, Request, Response, NextFunction } from "express";
import {
  renderSsrPage,
  type SsrPageConfig,
  type ContentSection,
  type FAQItem,
  type InternalLink,
} from "./ssrShell";
import { db } from "../db";
import { recoveryBlogPosts, type RecoveryBlogPost } from "@shared/schema";
import { eq, and, ne, desc, asc } from "drizzle-orm";

// ── Markdown → trusted HTML (no Tailwind; SSR CSS is .sra-* + base elements) ──
// Ported from the client renderMarkdown (RecoveryBlogPost.tsx) but strips all
// Tailwind classes and emits semantic HTML. ssrShell renders rawHtml UNESCAPED,
// so every text value here is HTML-escaped at the source.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c]!,
  );
}

function safeUrl(s: string): string {
  const t = s.trim();
  if (/^(https?:|mailto:|\/(?!\/)|#)/i.test(t)) return escapeHtml(t);
  return "#";
}

// Image src allowlist: only https or vetted local asset paths. Blocks data:/javascript:.
// Returns the RAW validated URL (no HTML-entity escaping) — callers escape per
// context: escapeHtml() for rawHtml <img>, escAttr()/JSON.stringify() in ssrShell
// for the hero image + JSON-LD. Escaping here would corrupt query strings
// (`&q=80` -> `&amp;q=80`) inside JSON-LD, which is never HTML-decoded.
function safeImageUrl(s: string): string {
  const t = s.trim();
  if (/^https:\/\//i.test(t) || /^\/(images|book|assets)\//i.test(t)) return t;
  return "";
}

function processInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      // href was HTML-escaped by escapeHtml() above; decode before re-validating
      // so safeUrl() escapes exactly once (avoids `&amp;amp;` in the rendered href).
      const rawHref = String(href)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<a href="${safeUrl(rawHref)}">${label}</a>`;
    });
}

function renderMarkdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length > 0) {
      out.push(`<p>${processInline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara();
      closeList();
      out.push(`<h3>${processInline(line.slice(4))}</h3>`);
    } else if (line.startsWith("#### ")) {
      flushPara();
      closeList();
      out.push(`<h4>${processInline(line.slice(5))}</h4>`);
    } else if (line.startsWith("## ")) {
      // Sections are split on H2 upstream; a stray H2 in a body demotes to H3.
      flushPara();
      closeList();
      out.push(`<h3>${processInline(line.slice(3))}</h3>`);
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${processInline(line.replace(/^[-*]\s/, ""))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      flushPara();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${processInline(line.replace(/^\d+\.\s/, ""))}</li>`);
    } else if (line.startsWith("> ")) {
      flushPara();
      closeList();
      out.push(`<blockquote>${processInline(line.slice(2))}</blockquote>`);
    } else if (/^!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
      flushPara();
      closeList();
      const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      const alt = m ? escapeHtml(m[1]) : "";
      const src = m ? safeImageUrl(m[2]) : "";
      if (src) {
        out.push(
          `<figure class="sra-blog-fig"><img src="${escapeHtml(src)}" alt="${alt}" class="sra-blog-img" loading="lazy" width="680" />${alt ? `<figcaption class="sra-blog-caption">${alt}</figcaption>` : ""}</figure>`,
        );
      }
    } else {
      if (inUl || inOl) closeList();
      para.push(line);
    }
  }
  flushPara();
  closeList();
  return out.join("\n");
}

// ── Section splitting ────────────────────────────────────────────────────────

interface RawSection {
  heading?: string;
  lines: string[];
}

function splitIntoSections(content: string): RawSection[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  // Drop a single leading H1 (# ...) — it duplicates the page <h1>.
  let start = 0;
  while (start < lines.length && !lines[start].trim()) start++;
  if (start < lines.length && /^#\s+/.test(lines[start].trim())) {
    lines.splice(start, 1);
  }

  const sections: RawSection[] = [];
  let current: RawSection = { lines: [] };
  const hasContent = (s: RawSection) => s.heading !== undefined || s.lines.some((l) => l.trim());

  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line.trimEnd());
    if (h2) {
      if (hasContent(current)) sections.push(current);
      current = { heading: h2[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (hasContent(current)) sections.push(current);
  return sections;
}

// ── FAQ extraction ───────────────────────────────────────────────────────────

function toPlainText(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/, "")
    .trim();
}

function parseFaqs(lines: string[]): FAQItem[] {
  const faqs: FAQItem[] = [];
  let q: string | null = null;
  let a: string[] = [];
  const flush = () => {
    if (q) faqs.push({ q, a: toPlainText(a.join(" ")) });
    q = null;
    a = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const h = line.match(/^#{3,4}\s+(.*)$/);
    if (h) {
      flush();
      q = toPlainText(h[1]);
      continue;
    }
    if (!line) continue;
    if (q) a.push(line);
  }
  flush();
  return faqs.filter((f) => f.q && f.a);
}

function isFaqHeading(h: string | undefined): boolean {
  if (!h) return false;
  return /frequently asked questions|^faqs?$|common questions/i.test(h.trim());
}

// ── Plain-text summary fallback (when meta_description/excerpt are empty) ──────

function plainSummary(content: string, max = 155): string {
  const text = content
    .replace(/\r\n?/g, "\n")
    .replace(/^#.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

// ── Config assembly ──────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  philosophy: "Mindset",
  therapy: "Therapy",
  science: "Science",
  exercises: "Exercises",
  caregivers: "Caregivers",
  income: "Recovery Income",
};

// Health-content categories get MedicalWebPage schema (richer eligibility + trust).
const CLINICAL_CATEGORIES = new Set(["therapy", "science", "exercises"]);

function toIsoDate(d: Date | string | null | undefined): string {
  const fallback = new Date().toISOString().split("T")[0];
  if (!d) return fallback;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().split("T")[0];
}

async function buildRelated(post: RecoveryBlogPost): Promise<InternalLink[]> {
  const others = await db
    .select()
    .from(recoveryBlogPosts)
    .where(and(eq(recoveryBlogPosts.status, "published"), ne(recoveryBlogPosts.id, post.id)))
    .orderBy(desc(recoveryBlogPosts.createdAt))
    .limit(30);
  const sameCat = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  // Guarantee at least 3 when the corpus allows; prefer same-category first.
  const chosen = [...sameCat, ...rest].slice(0, 3);
  return chosen.map((p) => ({
    href: `/recovery/blog/${p.slug}`,
    label: p.title,
    blurb: p.excerpt ? plainSummary(p.excerpt, 90) : undefined,
  }));
}

// ── Pillar / content-cluster definitions ─────────────────────────────────────

interface PillarDef {
  title: string;
  description: string;
  intro: string;
  keywords: string[];
  faqs: FAQItem[];
}

const PILLARS: Record<string, PillarDef> = {
  "exercises-at-home": {
    title: "Stroke Recovery Exercises at Home",
    description: "A complete guide to the exercises that drive real recovery — motor rehab, speech therapy, and cognitive training — all without leaving your house.",
    intro: "Most recovery happens between therapy sessions. This series covers every category of home exercise that moves the needle after stroke — written by a seven-year survivor who spent years figuring out what actually works.",
    keywords: ["stroke recovery exercises at home", "stroke home rehabilitation", "stroke exercises", "aphasia exercises home", "stroke recovery routine"],
    faqs: [
      { q: "What exercises help stroke recovery at home?", a: "Task-specific repetition of affected-side movements is the core mechanism. For motor rehab: constraint-induced movement, resistance training, and fine motor drills. For speech: reading aloud, naming practice, and category fluency. For cognition: dual-task training that combines movement with mental challenges." },
      { q: "How often should I exercise after stroke?", a: "Daily. Even 30 minutes of deliberate practice is more effective than 2 hours twice a week. Frequency builds neural pathways faster than duration. Build a routine and protect it." },
      { q: "When can I start exercising after stroke?", a: "In most cases, some form of exercise begins within 24–48 hours in the hospital under supervision. At home, the timeline depends on stroke severity and discharge instructions — but the goal is to start as soon as safely possible and maintain it indefinitely." },
    ],
  },
  "life-after-stroke": {
    title: "Life After Stroke: Rebuilding Who You Are",
    description: "The identity, purpose, and meaning questions that no one prepares you for — and the path through them.",
    intro: "Stroke doesn't just change your body. It changes who you think you are. This series is about the harder work of rebuilding identity, purpose, and a life worth living — from someone who spent seven years doing it.",
    keywords: ["life after stroke", "stroke survivor identity", "rebuilding after stroke", "post stroke recovery", "stroke and mental health"],
    faqs: [
      { q: "How do you rebuild your life after a stroke?", a: "Rebuilding after stroke is a dual process: physical rehabilitation and identity reconstruction. The physical work gets most attention, but survivors who do well long-term also do the identity work — grieving who they were, making meaning from what happened, and building a deliberate vision of who they're becoming." },
      { q: "How long does it take to feel normal after stroke?", a: "Most survivors report feeling closer to themselves somewhere between 12 and 36 months post-stroke, but this varies enormously by severity and by how intentionally they've engaged with the emotional recovery process." },
      { q: "Can you have a good life after a stroke?", a: "Yes — and many survivors report that post-stroke life has more clarity, deeper relationships, and stronger priorities than their pre-stroke life. It requires deliberate work and a willingness to define a new version of thriving." },
    ],
  },
  "stroke-recovery-timeline": {
    title: "Stroke Recovery Timeline: What to Expect",
    description: "An honest, month-by-month look at what actually happens during recovery — without the false optimism or unnecessary pessimism.",
    intro: "The timelines in brochures are averages. Your recovery will be faster in some areas, slower in others, and entirely different in ways no chart predicted. This series covers the real shape of long-term recovery from someone who's seven years in.",
    keywords: ["stroke recovery timeline", "how long does stroke recovery take", "stroke recovery stages", "stroke recovery milestones", "long term stroke recovery"],
    faqs: [
      { q: "How long does stroke recovery take?", a: "Recovery is lifelong, but the most rapid improvement typically happens in the first 3–6 months. Meaningful gains continue for years afterward for survivors who maintain consistent practice. Recovery doesn't end — it just changes character over time." },
      { q: "What is the hardest part of stroke recovery?", a: "Most survivors identify year 2 as the hardest — when discharge support ends, visible gains slow, and the full weight of what happened sets in. This is also when most survivors stop their active rehabilitation. Don't stop." },
      { q: "Is there a stroke recovery plateau?", a: "The plateau is largely a medical system artifact — a description of when formal therapy ends, not when recovery ends. Survivors who continue deliberate, task-specific practice well past 6 months consistently show continued improvement." },
    ],
  },
  "journaling-after-stroke": {
    title: "Journaling After Stroke",
    description: "How writing and voice-journaling accelerate stroke recovery — the neuroscience, the daily practice, and what to do with what you write.",
    intro: "Journaling after stroke isn't soft. It's neurologically active recovery work — and it documents a story worth telling. This series covers the science, the daily practice, and what to do with what you write.",
    keywords: ["journaling after stroke", "stroke recovery journal", "voice journaling stroke", "expressive writing stroke recovery", "stroke survivor journal"],
    faqs: [
      { q: "Why should stroke survivors journal?", a: "Journaling after stroke has documented benefits for cognitive recovery (engages language and memory networks), emotional regulation (externalizes the psychological burden), and progress tracking (provides objective evidence of gains over time)." },
      { q: "How do you journal after a stroke with one hand?", a: "Voice journaling is the most accessible adaptation — record audio using your phone, then use transcription tools to convert to text. One-handed keyboards, stylus tablets, and dictation software also work. The goal is to get thoughts out, not to win a penmanship award." },
      { q: "Can a stroke survivor write a book?", a: "Yes. Many stroke survivors have published memoirs, guides, and workbooks. The Book Studio on this platform helps survivors turn their recovery journals into publishable content, with AI assistance for editing and structure." },
    ],
  },
  "caregivers": {
    title: "The Caregiver's Guide to Stroke Recovery",
    description: "What caregivers actually need to know — how to help without burning out, what to say, and how to advocate for the survivor you love.",
    intro: "Caregivers are the invisible backbone of stroke recovery. This series is for the people who show up every day — spouses, kids, siblings, friends — who need practical guidance that isn't just 'take care of yourself.'",
    keywords: ["stroke caregiver guide", "caring for stroke survivor", "caregiver burnout stroke", "how to help stroke survivor", "stroke family guide"],
    faqs: [
      { q: "What do caregivers of stroke survivors need to know?", a: "Stroke recovery is a long process — months to years — and caregiver burnout is a real risk. Build a rotation so one person isn't absorbing everything, learn the specific deficits your survivor has, and treat the survivor as capable whenever possible." },
      { q: "How can a caregiver help with stroke recovery?", a: "Practical support (transport, meals, medication management), emotional support (listening without fixing), and advocacy support (navigating the healthcare system) are the three pillars of caregiver impact." },
      { q: "How long do stroke survivors need caregivers?", a: "Highly variable. Some survivors return to full independence within months; others need indefinite support. Plan for the long haul while working toward increasing independence over time." },
    ],
  },
  "survivor-income": {
    title: "How Stroke Survivors Build Income From Home",
    description: "Real income strategies for survivors who can't return to their old career — from passive income streams to building a digital presence around your recovery story.",
    intro: "Stroke changes your earning capacity. For many survivors, the old career isn't an option. This series is about building income that fits the life you actually have — not the one you had before.",
    keywords: ["stroke survivor income", "work from home stroke survivor", "passive income stroke", "disability income stroke", "stroke survivor business"],
    faqs: [
      { q: "Can stroke survivors work from home?", a: "Many stroke survivors successfully build remote income streams — freelance work in their field, affiliate programs, digital products, and content creation. The key is matching the work to your current capacity, not your pre-stroke capacity." },
      { q: "What income can a stroke survivor on SSDI generate?", a: "SSDI recipients can earn up to the Substantial Gainful Activity threshold without losing benefits (check SSA.gov for current amounts). Many survivors also qualify for the Trial Work Period, allowing 9 months of full earning. Consult a benefits counselor before significantly increasing income." },
      { q: "How do you make money after stroke?", a: "The fastest paths: affiliate referral programs (no upfront work), content creation around your recovery story, freelance work in your field at reduced hours, and digital products — journals, guides, courses — that generate passive income." },
    ],
  },
};

async function buildPillarSiblings(post: RecoveryBlogPost): Promise<InternalLink[]> {
  if (!post.pillarSlug) return [];
  const siblings = await db
    .select({
      slug: recoveryBlogPosts.slug,
      title: recoveryBlogPosts.title,
      excerpt: recoveryBlogPosts.excerpt,
      readTime: recoveryBlogPosts.readTime,
    })
    .from(recoveryBlogPosts)
    .where(
      and(
        eq(recoveryBlogPosts.status, "published"),
        eq(recoveryBlogPosts.pillarSlug, post.pillarSlug),
        ne(recoveryBlogPosts.id, post.id),
      ),
    )
    .orderBy(asc(recoveryBlogPosts.pillarOrder))
    .limit(6);
  return siblings.map((p) => ({
    href: `/recovery/blog/${p.slug}`,
    label: p.title,
    blurb: p.excerpt ? plainSummary(p.excerpt, 90) : undefined,
  }));
}

function buildConfig(post: RecoveryBlogPost, related: InternalLink[]): SsrPageConfig {
  const rawSections = splitIntoSections(post.content);
  const sections: ContentSection[] = [];
  let faqs: FAQItem[] = [];

  for (const rs of rawSections) {
    if (isFaqHeading(rs.heading)) {
      const parsed = parseFaqs(rs.lines);
      if (parsed.length > 0) {
        faqs = parsed;
        continue;
      }
    }
    const rawHtml = renderMarkdownToHtml(rs.lines.join("\n")).trim();
    if (!rawHtml && !rs.heading) continue;
    sections.push({ heading: rs.heading, rawHtml });
  }

  // Pillar series note — internal link to hub + reader orientation
  if (post.pillarSlug && post.pillarTitle) {
    sections.unshift({
      heading: undefined,
      rawHtml: `<div style="border-left:3px solid var(--sra-gold);padding:12px 16px;background:rgba(201,148,26,0.08);border-radius:0 6px 6px 0;margin-bottom:24px;font-size:15px;">Part of the series: <a href="/recovery/blog/topic/${escapeHtml(post.pillarSlug)}" style="color:var(--sra-gold);font-weight:600;">${escapeHtml(post.pillarTitle)}</a></div>`,
    });
  }

  const title = (post.seoTitle && post.seoTitle.trim()) || post.title;
  const description =
    (post.metaDescription && post.metaDescription.trim()) ||
    (post.excerpt && post.excerpt.trim()) ||
    plainSummary(post.content);
  const subhead = (post.excerpt && post.excerpt.trim()) || plainSummary(post.content, 180);
  const heroImg = post.heroImageUrl ? safeImageUrl(post.heroImageUrl) : "";
  const isClinical = CLINICAL_CATEGORIES.has(post.category);

  const breadcrumbs: { name: string; href: string }[] = [
    { name: "Home", href: "/" },
    { name: "Survivor Blog", href: "/recovery/blog" },
  ];
  if (post.pillarSlug && post.pillarTitle) {
    breadcrumbs.push({ name: post.pillarTitle, href: `/recovery/blog/topic/${post.pillarSlug}` });
  }
  breadcrumbs.push({ name: post.title, href: `/recovery/blog/${post.slug}` });

  return {
    url: `/recovery/blog/${post.slug}`,
    title,
    description,
    h1: post.title,
    hero: {
      eyebrow: post.pillarTitle
        ? `${CATEGORY_LABEL[post.category] || "Survivor Blog"} Series`
        : CATEGORY_LABEL[post.category] || "Survivor Blog",
      subhead,
      ctaPrimary: { href: "/recovery/sasquatch-coach", label: "Talk to Coach — free" },
      ctaSecondary: { href: "/recovery/premium", label: "Start your recovery" },
    },
    sections,
    faqs,
    related,
    publishedDate: toIsoDate(post.createdAt),
    modifiedDate: toIsoDate(post.updatedAt),
    keywords: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
    schemaType: isClinical ? "MedicalWebPage" : "Article",
    breadcrumbs,
    image: heroImg || undefined,
  };
}

// ── Route registration ───────────────────────────────────────────────────────

export function registerRecoveryBlogRoutes(app: Express): void {
  // ── Pillar hub pages (/recovery/blog/topic/:pillarSlug) ──────────────────
  app.get("/recovery/blog/topic/:pillarSlug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = String(req.params.pillarSlug || "").toLowerCase();
      const pillar = PILLARS[slug];
      if (!pillar) return next();

      const posts = await db
        .select()
        .from(recoveryBlogPosts)
        .where(and(eq(recoveryBlogPosts.status, "published"), eq(recoveryBlogPosts.pillarSlug, slug)))
        .orderBy(asc(recoveryBlogPosts.pillarOrder));

      if (!posts.length) return next();

      const sections: ContentSection[] = [
        {
          heading: undefined,
          rawHtml: `<p style="font-size:18px;color:var(--sra-text-dim);margin-bottom:32px;">${escapeHtml(pillar.intro)}</p>`,
        },
        {
          heading: `${posts.length} guide${posts.length === 1 ? "" : "s"} in this series`,
          rawHtml: posts
            .map(
              (p, i) =>
                `<div style="margin-bottom:20px;padding:20px;background:var(--sra-bg-card);border:1px solid var(--sra-border);border-radius:8px;">` +
                `<div style="color:var(--sra-text-dim);font-size:13px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Part ${i + 1} of ${posts.length}</div>` +
                `<a href="/recovery/blog/${escapeHtml(p.slug)}" style="font-size:18px;font-weight:600;color:var(--sra-gold);display:block;margin-bottom:8px;">${escapeHtml(p.title)}</a>` +
                (p.excerpt ? `<p style="margin:0 0 8px;color:var(--sra-text-dim);font-size:15px;">${escapeHtml(plainSummary(p.excerpt, 150))}</p>` : "") +
                `<span style="font-size:13px;color:var(--sra-text-dim);">${p.readTime || 5} min read</span>` +
                `</div>`,
            )
            .join(""),
        },
      ];

      const related: InternalLink[] = posts.slice(0, 4).map((p) => ({
        href: `/recovery/blog/${p.slug}`,
        label: p.title,
        blurb: p.excerpt ? plainSummary(p.excerpt, 90) : undefined,
      }));

      const cfg: SsrPageConfig = {
        url: `/recovery/blog/topic/${slug}`,
        title: `${pillar.title} | Stroke Recovery Academy`,
        description: pillar.description,
        h1: pillar.title,
        hero: {
          eyebrow: `Recovery Series · ${posts.length} guides`,
          subhead: pillar.description,
          ctaPrimary: { href: "/recovery/sasquatch-coach", label: "Talk to Coach — free" },
          ctaSecondary: { href: "/recovery/premium", label: "Start your recovery" },
        },
        sections,
        faqs: pillar.faqs,
        related,
        publishedDate: new Date().toISOString().split("T")[0],
        modifiedDate: new Date().toISOString().split("T")[0],
        keywords: pillar.keywords,
        schemaType: "Article",
        breadcrumbs: [
          { name: "Home", href: "/" },
          { name: "Survivor Blog", href: "/recovery/blog" },
          { name: pillar.title, href: `/recovery/blog/topic/${slug}` },
        ],
      };

      const html = renderSsrPage(cfg);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=1800, stale-while-revalidate=86400");
      res.set("X-SRA-SSR", "1");
      res.set("X-SRA-Blog", "pillar");
      res.send(html);
    } catch (err) {
      console.error("pillar hub SSR error:", err);
      return next();
    }
  });

  // ── Individual blog post pages (/recovery/blog/:slug) ───────────────────
  app.get("/recovery/blog/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase();
      if (!slug || slug.length > 120) return next();

      const [post] = await db
        .select()
        .from(recoveryBlogPosts)
        .where(eq(recoveryBlogPosts.slug, slug))
        .limit(1);

      if (!post || post.status !== "published") return next();

      // Pillar siblings first — stronger topical authority signal than category peers
      const pillarSiblings = await buildPillarSiblings(post);
      const related = pillarSiblings.length > 0 ? pillarSiblings : await buildRelated(post);
      const cfg = buildConfig(post, related);
      const html = renderSsrPage(cfg);

      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
      res.set("X-SRA-SSR", "1");
      res.set("X-SRA-Blog", "recovery");
      res.send(html);
    } catch (err) {
      console.error("recovery blog SSR error:", err);
      return next();
    }
  });
}
