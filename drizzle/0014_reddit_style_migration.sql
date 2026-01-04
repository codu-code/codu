-- Reddit-style feed migration
-- Adds slug/description to FeedSource, shortId to AggregatedArticle, and Discussion system

-- ============================================================================
-- Phase 1: Add new columns to FeedSource
-- ============================================================================

ALTER TABLE "FeedSource" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(100);
ALTER TABLE "FeedSource" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- ============================================================================
-- Phase 2: Add shortId to AggregatedArticle
-- ============================================================================

ALTER TABLE "AggregatedArticle" ADD COLUMN IF NOT EXISTS "shortId" VARCHAR(7);

-- ============================================================================
-- Phase 3: Create Discussion system
-- ============================================================================

-- Create the enum for discussion target type
DO $$ BEGIN
    CREATE TYPE "DiscussionTargetType" AS ENUM ('POST', 'ARTICLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Discussion table
CREATE TABLE IF NOT EXISTS "Discussion" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "targetType" "DiscussionTargetType" NOT NULL,
    "postId" TEXT REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "articleId" INTEGER REFERENCES "AggregatedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "parentId" INTEGER
);

-- Add self-referential foreign key for nested replies (if not exists)
DO $$ BEGIN
    ALTER TABLE "Discussion"
        ADD CONSTRAINT "Discussion_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "Discussion"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DiscussionLike table
CREATE TABLE IF NOT EXISTS "DiscussionLike" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "discussionId" INTEGER NOT NULL REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "DiscussionLike_userId_discussionId_key" UNIQUE ("userId", "discussionId")
);

-- ============================================================================
-- Phase 4: Create indexes
-- ============================================================================

-- FeedSource indexes
CREATE UNIQUE INDEX IF NOT EXISTS "FeedSource_slug_key" ON "FeedSource"("slug");

-- AggregatedArticle indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AggregatedArticle_shortId_key" ON "AggregatedArticle"("shortId");
CREATE INDEX IF NOT EXISTS "AggregatedArticle_sourceId_shortId_index" ON "AggregatedArticle"("sourceId", "shortId");

-- Discussion indexes
CREATE INDEX IF NOT EXISTS "Discussion_postId_index" ON "Discussion"("postId");
CREATE INDEX IF NOT EXISTS "Discussion_articleId_index" ON "Discussion"("articleId");
CREATE INDEX IF NOT EXISTS "Discussion_userId_index" ON "Discussion"("userId");

-- DiscussionLike indexes
CREATE INDEX IF NOT EXISTS "DiscussionLike_discussionId_index" ON "DiscussionLike"("discussionId");
