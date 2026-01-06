-- Migration 0015: Migrate Legacy Post Data to New posts Table
-- Migrates user-created articles from "Post" to "posts" with full data migration
--
-- Key Mappings:
-- - Post.id (TEXT) -> posts.legacy_post_id (for tracking)
-- - Post.userId -> posts.author_id
-- - Post.published (timestamp|null) -> posts.status (enum) + published_at
-- - PostVote.voteType (UP/DOWN) -> post_votes.vote_type (up/down)

-- ============================================
-- PART 1: Add legacy_post_id column to posts table
-- ============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS legacy_post_id TEXT;

-- Create unique index for idempotency checks and lookups
CREATE UNIQUE INDEX IF NOT EXISTS posts_legacy_post_id_idx
    ON posts(legacy_post_id)
    WHERE legacy_post_id IS NOT NULL;

-- ============================================
-- PART 2: Helper function for unique slug generation
-- ============================================

CREATE OR REPLACE FUNCTION get_unique_post_slug(base_slug TEXT, legacy_id TEXT)
RETURNS TEXT AS $$
DECLARE
    result_slug TEXT;
    counter INTEGER := 0;
BEGIN
    result_slug := base_slug;

    -- Keep trying with incrementing suffix until we find a unique slug
    WHILE EXISTS (SELECT 1 FROM posts WHERE slug = result_slug) LOOP
        counter := counter + 1;
        IF counter = 1 THEN
            result_slug := base_slug || '-' || SUBSTRING(legacy_id, 1, 8);
        ELSE
            result_slug := base_slug || '-' || SUBSTRING(legacy_id, 1, 8) || '-' || counter;
        END IF;

        -- Safety exit after 100 attempts
        IF counter > 100 THEN
            result_slug := base_slug || '-' || gen_random_uuid()::TEXT;
            EXIT;
        END IF;
    END LOOP;

    RETURN result_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Migrate posts data
-- ============================================

-- Insert all legacy posts that haven't been migrated yet
INSERT INTO posts (
    id,
    type,
    author_id,
    title,
    slug,
    excerpt,
    body,
    canonical_url,
    cover_image,
    external_url,
    source_id,
    source_author,
    reading_time,
    upvotes_count,
    downvotes_count,
    comments_count,
    views_count,
    status,
    published_at,
    featured,
    pinned_until,
    show_comments,
    created_at,
    updated_at,
    legacy_post_id
)
SELECT
    gen_random_uuid() AS id,
    'article'::post_type AS type,
    p."userId" AS author_id,
    p.title,
    get_unique_post_slug(p.slug, p.id) AS slug,
    NULLIF(p.excerpt, '') AS excerpt,
    p.body,
    p."canonicalUrl" AS canonical_url,
    p."coverImage" AS cover_image,
    NULL AS external_url,      -- User posts don't have external URLs
    NULL AS source_id,         -- User posts aren't from RSS sources
    NULL AS source_author,     -- User posts don't have source authors
    p."readTimeMins" AS reading_time,
    -- Legacy Post table has 'likes', not 'upvotes'/'downvotes'
    COALESCE(p.likes, 0) AS upvotes_count,
    0 AS downvotes_count,  -- No downvotes in legacy system
    -- Count comments from legacy Comment table
    (SELECT COUNT(*)::INTEGER FROM "Comment" c WHERE c."postId" = p.id) AS comments_count,
    0 AS views_count,          -- No legacy view tracking
    -- Convert published timestamp to status enum
    CASE
        WHEN p.published IS NOT NULL THEN 'published'::post_status
        ELSE 'draft'::post_status
    END AS status,
    p.published AS published_at,
    FALSE AS featured,
    NULL AS pinned_until,
    COALESCE(p."showComments", TRUE) AS show_comments,
    COALESCE(p."createdAt", NOW()) AS created_at,
    COALESCE(p."updatedAt", NOW()) AS updated_at,
    p.id AS legacy_post_id
FROM "Post" p
WHERE NOT EXISTS (
    SELECT 1 FROM posts np WHERE np.legacy_post_id = p.id
);

-- ============================================
-- PART 4: Migrate post likes to votes
-- ============================================

-- Convert legacy Like records (for posts) to new post_votes table
-- Legacy system uses "Like" table for both posts and comments (via postId/commentId)
-- All post likes become 'up' votes (legacy had no downvotes)
INSERT INTO post_votes (post_id, user_id, vote_type, created_at)
SELECT
    np.id AS post_id,
    l."userId" AS user_id,
    'up'::vote_type AS vote_type,
    COALESCE(l."createdAt", NOW()) AS created_at
FROM "Like" l
JOIN posts np ON np.legacy_post_id = l."postId"
WHERE l."postId" IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM post_votes npv
    WHERE npv.post_id = np.id
    AND npv.user_id = l."userId"
)
ON CONFLICT (post_id, user_id) DO NOTHING;

-- ============================================
-- PART 5: Migrate bookmarks
-- ============================================

INSERT INTO bookmarks (post_id, user_id, created_at)
SELECT
    np.id AS post_id,
    b."userId" AS user_id,
    NOW() AS created_at  -- Legacy bookmarks don't have timestamps
FROM "Bookmark" b
JOIN posts np ON np.legacy_post_id = b."postId"
WHERE NOT EXISTS (
    SELECT 1 FROM bookmarks nb
    WHERE nb.post_id = np.id
    AND nb.user_id = b."userId"
)
ON CONFLICT (post_id, user_id) DO NOTHING;

-- ============================================
-- PART 6: Migrate post tags
-- ============================================

INSERT INTO post_tags (post_id, tag_id)
SELECT
    np.id AS post_id,
    pt."tagId" AS tag_id
FROM "PostTag" pt
JOIN posts np ON np.legacy_post_id = pt."postId"
WHERE NOT EXISTS (
    SELECT 1 FROM post_tags npt
    WHERE npt.post_id = np.id
    AND npt.tag_id = pt."tagId"
)
ON CONFLICT (post_id, tag_id) DO NOTHING;

-- ============================================
-- PART 7: Recalculate vote counts (ensure triggers are accurate)
-- ============================================

-- Update vote counts on posts to match actual vote records
-- This accounts for any votes that may have been imported
UPDATE posts p
SET
    upvotes_count = COALESCE((
        SELECT COUNT(*) FROM post_votes pv
        WHERE pv.post_id = p.id AND pv.vote_type = 'up'
    ), 0),
    downvotes_count = COALESCE((
        SELECT COUNT(*) FROM post_votes pv
        WHERE pv.post_id = p.id AND pv.vote_type = 'down'
    ), 0)
WHERE p.legacy_post_id IS NOT NULL;

-- ============================================
-- PART 8: Cleanup helper function
-- ============================================

DROP FUNCTION IF EXISTS get_unique_post_slug(TEXT, TEXT);

-- ============================================
-- PART 9: Summary logging
-- ============================================

DO $$
DECLARE
    legacy_count INTEGER;
    migrated_count INTEGER;
    votes_count INTEGER;
    bookmarks_count INTEGER;
    tags_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO legacy_count FROM "Post";
    SELECT COUNT(*) INTO migrated_count FROM posts WHERE legacy_post_id IS NOT NULL;
    SELECT COUNT(*) INTO votes_count FROM post_votes pv
        JOIN posts p ON p.id = pv.post_id WHERE p.legacy_post_id IS NOT NULL;
    SELECT COUNT(*) INTO bookmarks_count FROM bookmarks b
        JOIN posts p ON p.id = b.post_id WHERE p.legacy_post_id IS NOT NULL;
    SELECT COUNT(*) INTO tags_count FROM post_tags pt
        JOIN posts p ON p.id = pt.post_id WHERE p.legacy_post_id IS NOT NULL;

    RAISE NOTICE 'Migration 0015 complete:';
    RAISE NOTICE '  Posts: % legacy -> % migrated', legacy_count, migrated_count;
    RAISE NOTICE '  Votes migrated: %', votes_count;
    RAISE NOTICE '  Bookmarks migrated: %', bookmarks_count;
    RAISE NOTICE '  Tags migrated: %', tags_count;
END $$;
