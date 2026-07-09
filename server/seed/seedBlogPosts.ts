// Idempotent blog-post seeder — runs at startup so every deploy carries the
// full blog library. Content is authored in dev (DB) and exported to
// server/seed/blogPosts.json; this upserts by slug. Existing rows are updated
// only when the seed's updated_at is newer than the row's, so live edits made
// directly in prod after a newer export are never clobbered silently.
// Uses raw SQL (not the drizzle table object) because the drizzle schema
// carries columns that don't exist in all environments' physical tables.
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "../db";

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[] | null;
  hero_image_url: string | null;
  author_name: string;
  author_bio: string | null;
  status: string;
  featured: boolean;
  read_time: number;
  seo_title: string | null;
  meta_description: string | null;
  pillar_slug: string | null;
  pillar_title: string | null;
  pillar_order: number | null;
  created_at: string;
  updated_at: string;
};

const UPSERT_SQL = `
  INSERT INTO recovery_blog_posts
    (slug, title, excerpt, content, category, tags, hero_image_url,
     author_name, author_bio, status, featured, read_time, seo_title,
     meta_description, pillar_slug, pillar_title, pillar_order,
     created_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    hero_image_url = EXCLUDED.hero_image_url,
    author_name = EXCLUDED.author_name,
    author_bio = EXCLUDED.author_bio,
    status = EXCLUDED.status,
    featured = EXCLUDED.featured,
    read_time = EXCLUDED.read_time,
    seo_title = EXCLUDED.seo_title,
    meta_description = EXCLUDED.meta_description,
    pillar_slug = EXCLUDED.pillar_slug,
    pillar_title = EXCLUDED.pillar_title,
    pillar_order = EXCLUDED.pillar_order,
    updated_at = EXCLUDED.updated_at
  WHERE recovery_blog_posts.updated_at < EXCLUDED.updated_at
  RETURNING (xmax = 0) AS inserted
`;

export async function seedBlogPosts(): Promise<void> {
  let posts: SeedPost[];
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // In the esbuild prod bundle the JSON is not inlined — resolve from cwd.
    const candidates = [
      join(here, "blogPosts.json"),
      join(process.cwd(), "server", "seed", "blogPosts.json"),
    ];
    let raw: string | null = null;
    for (const p of candidates) {
      try { raw = readFileSync(p, "utf-8"); break; } catch { /* try next */ }
    }
    if (!raw) {
      console.warn("[blog-seed] blogPosts.json not found — skipping seed");
      return;
    }
    posts = JSON.parse(raw);
  } catch (err: any) {
    console.error("[blog-seed] failed to load seed file:", err?.message ?? err);
    return;
  }

  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  for (const p of posts) {
    try {
      const res = await pool.query(UPSERT_SQL, [
        p.slug, p.title, p.excerpt, p.content, p.category,
        p.tags ?? [], p.hero_image_url, p.author_name, p.author_bio,
        p.status, p.featured, p.read_time, p.seo_title, p.meta_description,
        p.pillar_slug, p.pillar_title, p.pillar_order ?? 0,
        p.created_at, p.updated_at,
      ]);
      if (res.rowCount === 0) skipped++;
      else if (res.rows[0]?.inserted) inserted++;
      else updated++;
    } catch (err: any) {
      failed++;
      console.error(`[blog-seed] upsert failed for ${p.slug}:`, err?.message ?? err);
    }
  }
  console.log(`[blog-seed] done — ${posts.length} in seed: ${inserted} inserted, ${updated} updated, ${skipped} up-to-date, ${failed} failed`);
}
