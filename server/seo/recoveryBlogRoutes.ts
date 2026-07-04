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
import { eq, and, ne, desc } from "drizzle-orm";

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

function buildConfig(post: RecoveryBlogPost, related: InternalLink[]): SsrPageConfig {
  const rawSections = splitIntoSections(post.content);
  const sections: ContentSection[] = [];
  let faqs: FAQItem[] = [];

  for (const rs of rawSections) {
    if (isFaqHeading(rs.heading)) {
      const parsed = parseFaqs(rs.lines);
      if (parsed.length > 0) {
        faqs = parsed;
        continue; // drop from display list — rendered by renderFaqs instead
      }
    }
    const rawHtml = renderMarkdownToHtml(rs.lines.join("\n")).trim();
    if (!rawHtml && !rs.heading) continue;
    sections.push({ heading: rs.heading, rawHtml });
  }

  const title = (post.seoTitle && post.seoTitle.trim()) || post.title;
  const description =
    (post.metaDescription && post.metaDescription.trim()) ||
    (post.excerpt && post.excerpt.trim()) ||
    plainSummary(post.content);
  const subhead = (post.excerpt && post.excerpt.trim()) || plainSummary(post.content, 180);
  const heroImg = post.heroImageUrl ? safeImageUrl(post.heroImageUrl) : "";
  const isClinical = CLINICAL_CATEGORIES.has(post.category);

  return {
    url: `/recovery/blog/${post.slug}`,
    title,
    description,
    h1: post.title,
    hero: {
      eyebrow: CATEGORY_LABEL[post.category] || "Survivor Blog",
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
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Survivor Blog", href: "/recovery/blog" },
      { name: post.title, href: `/recovery/blog/${post.slug}` },
    ],
    image: heroImg || undefined,
  };
}

// ── Route registration ───────────────────────────────────────────────────────

export function registerRecoveryBlogRoutes(app: Express): void {
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

      const related = await buildRelated(post);
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
