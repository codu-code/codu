-- Add upvotes and downvotes columns to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "upvotes" integer NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "downvotes" integer NOT NULL DEFAULT 0;

-- Migrate existing likes to upvotes (since likes are positive votes)
UPDATE "Post" SET "upvotes" = "likes" WHERE "likes" > 0;

-- Create PostVote table for tracking individual votes
CREATE TABLE IF NOT EXISTS "PostVote" (
    "id" serial PRIMARY KEY NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "PostVote_postId_userId_key" UNIQUE("postId", "userId")
);

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_postId_Post_id_fk"
        FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_userId_user_id_fk"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "PostVote_postId_index" ON "PostVote"("postId");

-- Migrate existing likes from Like table to PostVote table as upvotes
INSERT INTO "PostVote" ("postId", "userId", "voteType", "createdAt")
SELECT "postId", "userId", 'UP'::"VoteType", CURRENT_TIMESTAMP
FROM "Like"
WHERE "postId" IS NOT NULL
ON CONFLICT ("postId", "userId") DO NOTHING;
