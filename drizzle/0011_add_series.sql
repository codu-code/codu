--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Series" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" text NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);
-->statement-breakpoint

ALTER TABLE "Post" ADD COLUMN "seriesId" INTEGER;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Post" ADD CONSTRAINT "Post_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."Series" ("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$