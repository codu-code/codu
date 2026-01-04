-- Content Aggregator Migration
-- Adds tables for RSS feed sources, aggregated articles, votes, and bookmarks

-- Create enums
DO $$ BEGIN
    CREATE TYPE "FeedSourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create FeedSource table
CREATE TABLE IF NOT EXISTS "FeedSource" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "category" VARCHAR(50),
    "status" "FeedSourceStatus" DEFAULT 'ACTIVE' NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) WITH TIME ZONE,
    "lastSuccessAt" TIMESTAMP(3) WITH TIME ZONE,
    "errorCount" INTEGER DEFAULT 0 NOT NULL,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedSource_url_key" ON "FeedSource"("url");
CREATE INDEX IF NOT EXISTS "FeedSource_status_index" ON "FeedSource"("status");

-- Create AggregatedArticle table
CREATE TABLE IF NOT EXISTS "AggregatedArticle" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "sourceId" INTEGER NOT NULL REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "title" TEXT NOT NULL,
    "excerpt" VARCHAR(300),
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3) WITH TIME ZONE,
    "fetchedAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "upvotes" INTEGER DEFAULT 0 NOT NULL,
    "downvotes" INTEGER DEFAULT 0 NOT NULL,
    "clickCount" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "AggregatedArticle_url_key" ON "AggregatedArticle"("url");
CREATE INDEX IF NOT EXISTS "AggregatedArticle_sourceId_index" ON "AggregatedArticle"("sourceId");
CREATE INDEX IF NOT EXISTS "AggregatedArticle_publishedAt_index" ON "AggregatedArticle"("publishedAt");
CREATE INDEX IF NOT EXISTS "AggregatedArticle_upvotes_index" ON "AggregatedArticle"("upvotes");

-- Create AggregatedArticleTag junction table
CREATE TABLE IF NOT EXISTS "AggregatedArticleTag" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "articleId" INTEGER NOT NULL REFERENCES "AggregatedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tagId" INTEGER NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AggregatedArticleTag_articleId_tagId_key" ON "AggregatedArticleTag"("articleId", "tagId");

-- Create AggregatedArticleVote table
CREATE TABLE IF NOT EXISTS "AggregatedArticleVote" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "articleId" INTEGER NOT NULL REFERENCES "AggregatedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "voteType" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "AggregatedArticleVote_userId_articleId_key" ON "AggregatedArticleVote"("userId", "articleId");
CREATE INDEX IF NOT EXISTS "AggregatedArticleVote_articleId_index" ON "AggregatedArticleVote"("articleId");

-- Create AggregatedArticleBookmark table
CREATE TABLE IF NOT EXISTS "AggregatedArticleBookmark" (
    "id" SERIAL PRIMARY KEY NOT NULL UNIQUE,
    "articleId" INTEGER NOT NULL REFERENCES "AggregatedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "AggregatedArticleBookmark_userId_articleId_key" ON "AggregatedArticleBookmark"("userId", "articleId");
