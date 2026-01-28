-- Update Notification table to reference new unified schema
-- This migration is idempotent - safe to run multiple times
-- 1. Drop old FK constraints (if they exist)
-- 2. Convert column types (text/integer -> uuid) if needed
-- 3. Add new FK constraints (if they don't exist)

-- Drop old foreign key constraints (safe - uses IF EXISTS)
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_postId_Post_id_fk";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_commentId_Comment_id_fk";
--> statement-breakpoint

-- ============================================
-- MIGRATE postId: text -> uuid (if needed)
-- ============================================
DO $$
BEGIN
  -- Only migrate if postId is still text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Notification'
    AND column_name = 'postId'
    AND data_type = 'text'
  ) THEN
    -- Add new uuid column
    ALTER TABLE "Notification" ADD COLUMN "postId_new" uuid;

    -- Migrate data using legacy_post_id lookup
    UPDATE "Notification" n
    SET "postId_new" = p.id
    FROM posts p
    WHERE p.legacy_post_id = n."postId";

    -- Drop old column and rename new one
    ALTER TABLE "Notification" DROP COLUMN "postId";
    ALTER TABLE "Notification" RENAME COLUMN "postId_new" TO "postId";
  END IF;
END $$;
--> statement-breakpoint

-- ============================================
-- MIGRATE commentId: integer -> uuid (if needed)
-- ============================================
DO $$
BEGIN
  -- Only migrate if commentId is still integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Notification'
    AND column_name = 'commentId'
    AND data_type = 'integer'
  ) THEN
    -- Add new uuid column
    ALTER TABLE "Notification" ADD COLUMN "commentId_new" uuid;

    -- Migrate data using legacy_comment_id lookup
    UPDATE "Notification" n
    SET "commentId_new" = c.id
    FROM comments c
    WHERE c.legacy_comment_id = n."commentId";

    -- Drop old column and rename new one
    ALTER TABLE "Notification" DROP COLUMN "commentId";
    ALTER TABLE "Notification" RENAME COLUMN "commentId_new" TO "commentId";
  END IF;
END $$;
--> statement-breakpoint

-- ============================================
-- ADD NEW FOREIGN KEY CONSTRAINTS (if not exist)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_postId_posts_id_fk'
  ) THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_posts_id_fk"
    FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_commentId_comments_id_fk'
  ) THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_comments_id_fk"
    FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE cascade;
  END IF;
END $$;
