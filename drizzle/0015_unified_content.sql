-- Unified Content System Migration
-- This migration creates the unified content tables and updates existing tables

-- Create ContentType enum
DO $$ BEGIN
    CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'LINK', 'QUESTION', 'VIDEO', 'DISCUSSION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ReportReason enum
DO $$ BEGIN
    CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'COPYRIGHT', 'NSFW', 'OFF_TOPIC', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ReportStatus enum
DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add CONTENT to DiscussionTargetType enum
ALTER TYPE "DiscussionTargetType" ADD VALUE IF NOT EXISTS 'CONTENT';

-- Create Content table
CREATE TABLE IF NOT EXISTS "Content" (
    "id" text PRIMARY KEY NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" varchar(500) NOT NULL,
    "body" text,
    "excerpt" text,
    "userId" text REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "externalUrl" varchar(2000),
    "imageUrl" text,
    "ogImageUrl" text,
    "sourceId" integer REFERENCES "FeedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "sourceAuthor" varchar(200),
    "published" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) with time zone,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "downvotes" integer DEFAULT 0 NOT NULL,
    "readTimeMins" integer,
    "clickCount" integer DEFAULT 0 NOT NULL,
    "slug" varchar(300),
    "canonicalUrl" text,
    "coverImage" text,
    "showComments" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for Content table
CREATE UNIQUE INDEX IF NOT EXISTS "Content_slug_key" ON "Content"("slug");
CREATE INDEX IF NOT EXISTS "Content_type_index" ON "Content"("type");
CREATE INDEX IF NOT EXISTS "Content_userId_index" ON "Content"("userId");
CREATE INDEX IF NOT EXISTS "Content_sourceId_index" ON "Content"("sourceId");
CREATE INDEX IF NOT EXISTS "Content_publishedAt_index" ON "Content"("publishedAt");
CREATE INDEX IF NOT EXISTS "Content_published_index" ON "Content"("published");

-- Create ContentVote table
CREATE TABLE IF NOT EXISTS "ContentVote" (
    "id" serial PRIMARY KEY NOT NULL,
    "contentId" text NOT NULL REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "voteType" "VoteType" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "ContentVote_contentId_userId_key" UNIQUE("contentId", "userId")
);

CREATE INDEX IF NOT EXISTS "ContentVote_contentId_index" ON "ContentVote"("contentId");

-- Create ContentBookmark table
CREATE TABLE IF NOT EXISTS "ContentBookmark" (
    "id" serial PRIMARY KEY NOT NULL,
    "contentId" text NOT NULL REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "ContentBookmark_contentId_userId_key" UNIQUE("contentId", "userId")
);

-- Create ContentTag table
CREATE TABLE IF NOT EXISTS "ContentTag" (
    "id" serial PRIMARY KEY NOT NULL,
    "contentId" text NOT NULL REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tagId" integer NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentTag_contentId_tagId_key" UNIQUE("contentId", "tagId")
);

-- Add columns to Discussion table
ALTER TABLE "Discussion" ADD COLUMN IF NOT EXISTS "contentId" text;
ALTER TABLE "Discussion" ADD COLUMN IF NOT EXISTS "upvotes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "Discussion" ADD COLUMN IF NOT EXISTS "downvotes" integer DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS "Discussion_contentId_index" ON "Discussion"("contentId");

-- Create DiscussionVote table
CREATE TABLE IF NOT EXISTS "DiscussionVote" (
    "id" serial PRIMARY KEY NOT NULL,
    "discussionId" integer NOT NULL REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "voteType" "VoteType" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "DiscussionVote_discussionId_userId_key" UNIQUE("discussionId", "userId")
);

CREATE INDEX IF NOT EXISTS "DiscussionVote_discussionId_index" ON "DiscussionVote"("discussionId");

-- Create ContentReport table
CREATE TABLE IF NOT EXISTS "ContentReport" (
    "id" serial PRIMARY KEY NOT NULL,
    "contentId" text REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "discussionId" integer REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "legacyPostId" text,
    "legacyArticleId" integer,
    "reporterId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "reason" "ReportReason" NOT NULL,
    "details" text,
    "status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
    "reviewedById" text REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "reviewedAt" timestamp(3) with time zone,
    "actionTaken" text,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "ContentReport_status_index" ON "ContentReport"("status");
CREATE INDEX IF NOT EXISTS "ContentReport_reporterId_index" ON "ContentReport"("reporterId");
CREATE INDEX IF NOT EXISTS "ContentReport_contentId_index" ON "ContentReport"("contentId");
CREATE INDEX IF NOT EXISTS "ContentReport_discussionId_index" ON "ContentReport"("discussionId");

-- Migrate existing discussion likes to votes (as upvotes)
INSERT INTO "DiscussionVote" ("discussionId", "userId", "voteType", "createdAt")
SELECT "discussionId", "userId", 'UP'::"VoteType", "createdAt"
FROM "DiscussionLike"
ON CONFLICT DO NOTHING;

-- Update Discussion upvotes count from likes
UPDATE "Discussion" d
SET "upvotes" = (
    SELECT COUNT(*) FROM "DiscussionLike" dl WHERE dl."discussionId" = d."id"
);
