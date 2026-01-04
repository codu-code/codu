-- Add ogImageUrl column to AggregatedArticle for storing Open Graph images fetched from article URLs
ALTER TABLE "AggregatedArticle" ADD COLUMN IF NOT EXISTS "ogImageUrl" text;
