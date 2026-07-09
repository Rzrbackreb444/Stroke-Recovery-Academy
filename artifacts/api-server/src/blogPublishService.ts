// ============================================================================
// SCHEDULED BLOG AUTO-PUBLISH → NEWSLETTER BROADCAST
// ============================================================================
// A recovery-blog post can be queued with status='scheduled' + a scheduled_for
// timestamp. This service (invoked hourly by the durable scheduler) atomically
// claims every due scheduled post, flips it live, then broadcasts it to the
// newsletter list exactly once.
//
// Idempotency is layered so double-runs / restarts never double-send:
//   1. The publish step is an atomic UPDATE ... WHERE status='scheduled' ...
//      RETURNING — only one worker can claim a given row (the flip to
//      'published' removes it from the candidate set for every later tick).
//   2. The broadcast step is guarded by newsletter_broadcast_at: we only build
//      + send an edition when that column is still NULL, and stamp it on
//      success. A crash between publish and broadcast is recovered on the next
//      tick by the separate "already published but never broadcast" sweep.
//
// All copy is derived from the post itself (no AI) and wrapped in renderEmail,
// which keeps the medical-disclaimer footer on every send. No crisis gate is
// needed — this is editorial content the author scheduled, not survivor-state
// outreach.

import { db } from "./db";
import { sql } from "drizzle-orm";
import { renderEmail } from "./emailTemplate";
import { sendBroadcast } from "./newsletterService";
import { newsletterEditions } from "@workspace/db";

const SITE = process.env.PUBLIC_SITE_URL || "https://strokerecoveryacademy.com";

interface DuePost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  hero_image_url: string | null;
}

// Self-provision the additive scheduling columns so a fresh DB (or one where
// db:push never ran — it's blocked on this repl by the external stripe schema)
// still works. Idempotent; safe on an already-migrated DB.
let schemaReady: Promise<void> | null = null;
export async function ensureBlogScheduleSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.execute(sql`ALTER TABLE recovery_blog_posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP`);
    await db.execute(sql`ALTER TABLE recovery_blog_posts ADD COLUMN IF NOT EXISTS newsletter_broadcast_at TIMESTAMP`);
  })().catch((err) => {
    schemaReady = null; // let a transient hiccup retry
    throw err;
  });
  return schemaReady;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build the broadcast email for a freshly-published post. Content is the post's
// own excerpt + a CTA to read it — we deliberately do NOT inline the full body
// (keeps the email light and drives clicks back to the site).
function buildEditionHtml(post: DuePost): string {
  const url = `${SITE}/recovery/blog/${post.slug}`;
  const excerpt = post.excerpt?.trim() || "New from the Stroke Recovery Academy journal.";
  const body =
    `<p class="body-text">${esc(excerpt)}</p>` +
    `<p class="body-text" style="text-align:center;margin-top:28px;">` +
    `<a href="${url}" style="display:inline-block;background:#E2741B;color:#0E0D0C;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;">Read the full post</a>` +
    `</p>`;

  return renderEmail({
    previewText: excerpt.slice(0, 140),
    eyebrow: "New post",
    headline: post.title,
    subheadline: "Fresh from the journal",
    heroImage: post.hero_image_url || undefined,
    showCrisisCallout: true,
    bodyHtml: body,
    whyReceiving:
      "You're receiving this because you subscribed to The Sasquatch Dispatch from Stroke Recovery Academy.",
  });
}

function buildEditionText(post: DuePost): string {
  const url = `${SITE}/recovery/blog/${post.slug}`;
  const excerpt = post.excerpt?.trim() || "New from the Stroke Recovery Academy journal.";
  return `${post.title}\n\n${excerpt}\n\nRead the full post: ${url}`;
}

// Broadcast a freshly-published post to the newsletter list exactly once.
//
// Idempotency: we CLAIM the broadcast by stamping newsletter_broadcast_at
// atomically BEFORE building/sending the edition. The claim UPDATE only
// succeeds while the column is still NULL, so a concurrent tick — or a re-run
// after a crash that happened *after* recipients were emailed but before we got
// to stamp — can never double-blast the list (the row is already claimed and
// the UPDATE affects 0 rows).
//
// Reliability: sendBroadcast contains every per-recipient error internally
// (returns { sent, failed } and only throws on a systemic pre-send failure like
// a missing edition), so if the whole send delivered nothing we RELEASE the
// claim (set the column back to NULL) and let the next tick's recovery sweep
// retry — no silent delivery loss. This is safe because a released post had
// zero successful deliveries, so retrying cannot duplicate anything.
async function broadcastPost(post: DuePost): Promise<void> {
  const claim = await db.execute(sql`
    UPDATE recovery_blog_posts
       SET newsletter_broadcast_at = now()
     WHERE id = ${post.id} AND newsletter_broadcast_at IS NULL
    RETURNING id
  `);
  if (!claim.rows || claim.rows.length === 0) {
    // Already broadcast (or claimed by a concurrent worker) — nothing to do.
    return;
  }

  const release = async () => {
    await db.execute(sql`
      UPDATE recovery_blog_posts SET newsletter_broadcast_at = NULL WHERE id = ${post.id}
    `);
  };

  let edition: typeof newsletterEditions.$inferSelect;
  try {
    const nextEdition = await db.execute(sql`
      SELECT COALESCE(MAX(edition), 0) + 1 AS n FROM newsletter_editions
    `);
    const editionNum = Number((nextEdition.rows as any[])[0]?.n ?? 1);

    [edition] = await db
      .insert(newsletterEditions)
      .values({
        subject: post.title,
        preview: (post.excerpt || "").slice(0, 140),
        htmlContent: buildEditionHtml(post),
        textContent: buildEditionText(post),
        edition: editionNum,
      })
      .returning();
  } catch (e) {
    // Nothing was sent yet — release so the next tick retries.
    await release();
    throw e;
  }

  const res = await sendBroadcast(edition.id);

  // Total delivery failure with no successes → release for retry. (A partial
  // success keeps the claim; we don't re-send to the whole list to reach the
  // stragglers, which would double-mail everyone who already received it.)
  if (res.sent === 0 && res.failed > 0) {
    await release();
    console.error(`[blog-publish] broadcast "${post.slug}" delivered 0/${res.failed} — released for retry`);
    return;
  }

  console.log(`[blog-publish] broadcast "${post.slug}" → sent ${res.sent}, failed ${res.failed}`);
}

// ─── Entry point (invoked by the durable scheduler) ──────────────────────────
export async function runScheduledBlogPublish(): Promise<void> {
  await ensureBlogScheduleSchema();

  // 1. Atomically claim + publish every due scheduled post. Setting created_at
  //    to now() makes the freshly-published post sort to the top and reflect a
  //    real publish date in sitemaps/feeds.
  const claimed = await db.execute(sql`
    UPDATE recovery_blog_posts
       SET status = 'published', created_at = now(), updated_at = now()
     WHERE status = 'scheduled'
       AND scheduled_for IS NOT NULL
       AND scheduled_for <= now()
    RETURNING id, slug, title, excerpt, category, hero_image_url
  `);
  const posts = (claimed.rows || []) as DuePost[];

  // 2. Recovery sweep: posts that got published (by this run or a prior crashed
  //    one) but never broadcast. Bounded so a backlog can't fan out unbounded
  //    sends in a single tick.
  const orphans = await db.execute(sql`
    SELECT id, slug, title, excerpt, category, hero_image_url
      FROM recovery_blog_posts
     WHERE status = 'published'
       AND scheduled_for IS NOT NULL
       AND newsletter_broadcast_at IS NULL
     ORDER BY scheduled_for ASC
     LIMIT 5
  `);

  // Merge (claimed posts + orphans), de-duped by id — claimed posts are also
  // orphans until broadcast succeeds, so the LIMIT sweep may overlap.
  const byId = new Map<number, DuePost>();
  for (const p of posts) byId.set(p.id, p);
  for (const p of (orphans.rows || []) as DuePost[]) byId.set(p.id, p);

  for (const post of byId.values()) {
    try {
      await broadcastPost(post);
    } catch (e) {
      console.error(`[blog-publish] broadcast failed for "${post.slug}":`, e);
    }
  }
}
