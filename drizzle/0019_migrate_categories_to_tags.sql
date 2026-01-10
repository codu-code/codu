-- Migration: Migrate RSS feed categories to unified tag system
-- This migration is idempotent and can be safely re-run

-- Step 1: Populate slugs for existing tags that don't have them
UPDATE "Tag"
SET "slug" = LOWER(REGEXP_REPLACE(TRIM("title"), '[^a-z0-9]+', '-', 'gi'))
WHERE "slug" IS NULL;
--> statement-breakpoint

-- Step 2: Handle any slug conflicts by appending the tag ID
UPDATE "Tag" t1
SET "slug" = t1."slug" || '-' || t1."id"
WHERE EXISTS (
  SELECT 1 FROM "Tag" t2
  WHERE t2."slug" = t1."slug"
  AND t2."id" < t1."id"
);
--> statement-breakpoint

-- Step 3: Insert tags for each unique category from feed_sources
-- Only inserts if no case-insensitive match exists
INSERT INTO "Tag" ("title", "slug", "description", "post_count")
SELECT DISTINCT
  LOWER(TRIM(fs."category")) as title,
  LOWER(REGEXP_REPLACE(TRIM(fs."category"), '[^a-z0-9]+', '-', 'gi')) as slug,
  'Content from ' || fs."category" || ' sources' as description,
  0 as post_count
FROM "feed_sources" fs
WHERE fs."category" IS NOT NULL
  AND TRIM(fs."category") != ''
  AND NOT EXISTS (
    SELECT 1 FROM "Tag" t
    WHERE LOWER(t."title") = LOWER(TRIM(fs."category"))
  )
ON CONFLICT ("title") DO NOTHING;
--> statement-breakpoint

-- Step 4: Link posts to their source's category tag via post_tags
INSERT INTO "post_tags" ("post_id", "tag_id")
SELECT DISTINCT
  p."id" as post_id,
  t."id" as tag_id
FROM "posts" p
INNER JOIN "feed_sources" fs ON p."source_id" = fs."id"
INNER JOIN "Tag" t ON LOWER(t."title") = LOWER(TRIM(fs."category"))
WHERE fs."category" IS NOT NULL
  AND TRIM(fs."category") != ''
ON CONFLICT ("post_id", "tag_id") DO NOTHING;
--> statement-breakpoint

-- Step 5: Recalculate post counts for all tags
UPDATE "Tag" t
SET "post_count" = COALESCE(
  (SELECT COUNT(*) FROM "post_tags" pt WHERE pt."tag_id" = t."id"),
  0
);
