-- Alter excerpt column from varchar(300) to text to allow longer excerpts
ALTER TABLE "AggregatedArticle" ALTER COLUMN "excerpt" TYPE text;
