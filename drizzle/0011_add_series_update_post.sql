-- Create Series table
CREATE TABLE IF NOT EXISTS "Series" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);
-- Update Post table to add seriesId column
ALTER TABLE "Post"
ADD COLUMN "seriesId" INTEGER
ADD CONSTRAINT fk_post_series
    FOREIGN KEY ("seriesId")
    REFERENCES "Series" ("id")
    ON DELETE SET NULL;