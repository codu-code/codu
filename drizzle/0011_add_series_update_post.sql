-- Create Series table
CREATE TABLE IF NOT EXISTS "Series" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" text NOT NULL,
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
CREATE INDEX idx_post_series ON "Post"("seriesId");
CREATE INDEX idx_series_name ON "Series"("name");
ALTER TABLE series ADD CONSTRAINT unique_series_name_per_user UNIQUE (name, userId);