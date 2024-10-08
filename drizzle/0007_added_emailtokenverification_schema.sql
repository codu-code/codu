CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"email" text NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "EmailVerificationToken_token_unique" UNIQUE("token"),
	CONSTRAINT "EmailVerificationToken_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "BannedUsers_userId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Bookmark_userId_postId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Community_id_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Community_slug_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Event_id_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Event_slug_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Like_userId_commentId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Like_userId_postId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Post_id_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Post_slug_key";--> statement-breakpoint
DROP INDEX IF EXISTS "PostTag_tagId_postId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Tag_title_key";--> statement-breakpoint
DROP INDEX IF EXISTS "User_username_key";--> statement-breakpoint
DROP INDEX IF EXISTS "User_email_key";--> statement-breakpoint
DROP INDEX IF EXISTS "User_username_id_idx";--> statement-breakpoint
ALTER TABLE "BannedUsers" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Flagged" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "BannedUsers_userId_key" ON "BannedUsers" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_userId_postId_key" ON "Bookmark" USING btree ("postId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Community_id_key" ON "Community" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Community_slug_key" ON "Community" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Event_id_key" ON "Event" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_commentId_key" ON "Like" USING btree ("userId","commentId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_postId_key" ON "Like" USING btree ("userId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Post_id_key" ON "Post" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "PostTag_tagId_postId_key" ON "PostTag" USING btree ("tagId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_title_key" ON "Tag" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "user" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "User_username_id_idx" ON "user" USING btree ("id","username");