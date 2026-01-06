-- Migration 0016: Migrate Legacy Comments to New comments Table
-- Migrates comments from "Comment" to "comments" with hierarchical ltree paths
--
-- Key Challenges:
-- - Comment.id is INTEGER, comments.id is UUID
-- - Comment.parentId references Comment.id (INTEGER)
-- - comments uses ltree paths for efficient hierarchical queries
-- - Must migrate parent comments before children

-- ============================================
-- PART 1: Add legacy_comment_id column to comments table
-- ============================================

ALTER TABLE comments ADD COLUMN IF NOT EXISTS legacy_comment_id INTEGER;

-- Create unique index for idempotency checks and lookups
CREATE UNIQUE INDEX IF NOT EXISTS comments_legacy_comment_id_idx
    ON comments(legacy_comment_id)
    WHERE legacy_comment_id IS NOT NULL;

-- ============================================
-- PART 2: Create temporary mapping table
-- ============================================

-- This table maps old Comment IDs to new comment UUIDs
-- Needed because we generate paths iteratively by depth level
CREATE TABLE IF NOT EXISTS _comment_migration_map (
    legacy_comment_id INTEGER PRIMARY KEY,
    new_comment_id UUID NOT NULL,
    legacy_post_id TEXT NOT NULL,
    legacy_parent_id INTEGER,
    depth INTEGER NOT NULL DEFAULT 0,
    migrated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PART 3: Migrate root-level comments (depth = 0)
-- ============================================

-- First, migrate all comments without parents
DO $$
DECLARE
    comment_record RECORD;
    new_post_id UUID;
    new_comment_id UUID;
    new_path LTREE;
    upvote_count INTEGER;
BEGIN
    -- Loop through root comments that haven't been migrated
    FOR comment_record IN
        SELECT
            c.id,
            c.body,
            c."postId",
            c."userId",
            c."createdAt",
            c."updatedAt"
        FROM "Comment" c
        WHERE c."parentId" IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM _comment_migration_map m WHERE m.legacy_comment_id = c.id
        )
    LOOP
        -- Find the new post ID
        SELECT id INTO new_post_id
        FROM posts
        WHERE legacy_post_id = comment_record."postId";

        -- Skip if post wasn't migrated
        IF new_post_id IS NULL THEN
            RAISE NOTICE 'Skipping comment % - post % not found in new posts table',
                comment_record.id, comment_record."postId";
            CONTINUE;
        END IF;

        -- Generate new UUID for comment
        new_comment_id := gen_random_uuid();

        -- Generate path (just the comment ID for root comments)
        -- Use underscore-separated hex format for ltree compatibility
        new_path := text2ltree(REPLACE(new_comment_id::TEXT, '-', '_'));

        -- Count likes for this comment
        SELECT COUNT(*)::INTEGER INTO upvote_count
        FROM "Like" l
        WHERE l."commentId" = comment_record.id;

        -- Insert the comment
        INSERT INTO comments (
            id,
            post_id,
            author_id,
            parent_id,
            path,
            depth,
            body,
            upvotes_count,
            downvotes_count,
            created_at,
            updated_at,
            deleted_at,
            legacy_comment_id
        ) VALUES (
            new_comment_id,
            new_post_id,
            comment_record."userId",
            NULL,  -- No parent for root comments
            new_path,
            0,  -- Root level
            comment_record.body,
            upvote_count,
            0,  -- No downvotes in legacy system
            COALESCE(comment_record."createdAt", NOW()),
            COALESCE(comment_record."updatedAt", NOW()),
            NULL,  -- Not deleted
            comment_record.id
        );

        -- Record the mapping
        INSERT INTO _comment_migration_map (
            legacy_comment_id,
            new_comment_id,
            legacy_post_id,
            legacy_parent_id,
            depth
        ) VALUES (
            comment_record.id,
            new_comment_id,
            comment_record."postId",
            NULL,
            0
        )
        ON CONFLICT (legacy_comment_id) DO NOTHING;

    END LOOP;
END $$;

-- ============================================
-- PART 4: Migrate nested comments (depth 1-10)
-- ============================================

-- Iteratively migrate child comments level by level
DO $$
DECLARE
    current_depth INTEGER := 1;
    max_depth INTEGER := 10;
    comments_migrated INTEGER;
    comment_record RECORD;
    new_post_id UUID;
    new_comment_id UUID;
    parent_comment_id UUID;
    parent_path LTREE;
    new_path LTREE;
    upvote_count INTEGER;
BEGIN
    LOOP
        EXIT WHEN current_depth > max_depth;

        comments_migrated := 0;

        -- Loop through comments at this depth level
        FOR comment_record IN
            SELECT
                c.id,
                c.body,
                c."postId",
                c."userId",
                c."parentId",
                c."createdAt",
                c."updatedAt"
            FROM "Comment" c
            WHERE c."parentId" IS NOT NULL
            -- Parent must already be migrated
            AND EXISTS (
                SELECT 1 FROM _comment_migration_map m
                WHERE m.legacy_comment_id = c."parentId"
            )
            -- This comment must not be migrated yet
            AND NOT EXISTS (
                SELECT 1 FROM _comment_migration_map m
                WHERE m.legacy_comment_id = c.id
            )
        LOOP
            -- Find the new post ID
            SELECT id INTO new_post_id
            FROM posts
            WHERE legacy_post_id = comment_record."postId";

            -- Skip if post wasn't migrated
            IF new_post_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Get parent's new ID and path
            SELECT new_comment_id, path INTO parent_comment_id, parent_path
            FROM _comment_migration_map m
            JOIN comments nc ON nc.id = m.new_comment_id
            WHERE m.legacy_comment_id = comment_record."parentId";

            -- Skip if parent not found
            IF parent_comment_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Generate new UUID for this comment
            new_comment_id := gen_random_uuid();

            -- Extend parent path with this comment's ID
            new_path := parent_path || text2ltree(REPLACE(new_comment_id::TEXT, '-', '_'));

            -- Count likes for this comment
            SELECT COUNT(*)::INTEGER INTO upvote_count
            FROM "Like" l
            WHERE l."commentId" = comment_record.id;

            -- Insert the comment
            INSERT INTO comments (
                id,
                post_id,
                author_id,
                parent_id,
                path,
                depth,
                body,
                upvotes_count,
                downvotes_count,
                created_at,
                updated_at,
                deleted_at,
                legacy_comment_id
            ) VALUES (
                new_comment_id,
                new_post_id,
                comment_record."userId",
                parent_comment_id,
                new_path,
                current_depth,
                comment_record.body,
                upvote_count,
                0,  -- No downvotes in legacy system
                COALESCE(comment_record."createdAt", NOW()),
                COALESCE(comment_record."updatedAt", NOW()),
                NULL,
                comment_record.id
            );

            -- Record the mapping
            INSERT INTO _comment_migration_map (
                legacy_comment_id,
                new_comment_id,
                legacy_post_id,
                legacy_parent_id,
                depth
            ) VALUES (
                comment_record.id,
                new_comment_id,
                comment_record."postId",
                comment_record."parentId",
                current_depth
            )
            ON CONFLICT (legacy_comment_id) DO NOTHING;

            comments_migrated := comments_migrated + 1;
        END LOOP;

        RAISE NOTICE 'Depth %: migrated % comments', current_depth, comments_migrated;

        -- Exit early if no more comments to migrate at this level
        EXIT WHEN comments_migrated = 0;

        current_depth := current_depth + 1;
    END LOOP;
END $$;

-- ============================================
-- PART 5: Update post comment counts
-- ============================================

-- Recalculate comment counts on posts based on migrated comments
UPDATE posts p
SET comments_count = COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM comments c
    WHERE c.post_id = p.id
), 0)
WHERE p.legacy_post_id IS NOT NULL;

-- ============================================
-- PART 6: Summary logging
-- ============================================

DO $$
DECLARE
    legacy_count INTEGER;
    migrated_count INTEGER;
    root_count INTEGER;
    nested_count INTEGER;
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO legacy_count FROM "Comment";
    SELECT COUNT(*) INTO migrated_count FROM _comment_migration_map;
    SELECT COUNT(*) INTO root_count FROM _comment_migration_map WHERE depth = 0;
    SELECT COUNT(*) INTO nested_count FROM _comment_migration_map WHERE depth > 0;

    -- Count orphaned comments (parent not migrated or post not migrated)
    SELECT COUNT(*) INTO orphan_count
    FROM "Comment" c
    WHERE NOT EXISTS (
        SELECT 1 FROM _comment_migration_map m WHERE m.legacy_comment_id = c.id
    );

    RAISE NOTICE 'Migration 0016 complete:';
    RAISE NOTICE '  Legacy comments: %', legacy_count;
    RAISE NOTICE '  Migrated comments: % (% root, % nested)', migrated_count, root_count, nested_count;
    IF orphan_count > 0 THEN
        RAISE NOTICE '  Orphaned comments (not migrated): %', orphan_count;
    END IF;
END $$;

-- ============================================
-- PART 7: Notes
-- ============================================

-- The _comment_migration_map table is kept for:
-- 1. Debugging and verification
-- 2. Potential future migrations (e.g., notifications referencing comments)
-- 3. Rollback capability
--
-- It can be dropped in a future migration after verification:
-- DROP TABLE IF EXISTS _comment_migration_map;
