-- Blog content & SEO polish migration
-- Applied: 2026-07-08
-- Idempotent: safe to re-run

-- 1. Add estimated_read_minutes column (nullable integer)
ALTER TABLE recovery_blog_posts
  ADD COLUMN IF NOT EXISTS estimated_read_minutes integer;

-- 2. Rename "income" category → "work-career" for all existing rows
UPDATE recovery_blog_posts
  SET category = 'work-career'
  WHERE category = 'income';

-- 3. Backfill estimated_read_minutes from content word count (min 1 minute)
--    Counts whitespace-delimited tokens in the content column (200 wpm reading speed)
UPDATE recovery_blog_posts
  SET estimated_read_minutes = GREATEST(
    1,
    CEIL(
      array_length(regexp_split_to_array(trim(content), '\s+'), 1)::numeric / 200
    )::integer
  )
  WHERE estimated_read_minutes IS NULL
    AND content IS NOT NULL
    AND trim(content) <> '';
