ALTER TABLE "Account" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "Session" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "User" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "VerificationToken" RENAME TO "verificationToken";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "Account_id_unique";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "Session_id_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "User_id_unique";--> statement-breakpoint
ALTER TABLE "verificationToken" DROP CONSTRAINT "VerificationToken_identifier_token_unique";--> statement-breakpoint
ALTER TABLE "BannedUsers" DROP CONSTRAINT "BannedUsers_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "BannedUsers" DROP CONSTRAINT "BannedUsers_bannedById_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_notifierId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_notifierId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "Account_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "Session_userId_User_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "Session_sessionToken_key";--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ALTER COLUMN "expires" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BannedUsers" ADD CONSTRAINT "BannedUsers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BannedUsers" ADD CONSTRAINT "BannedUsers_bannedById_user_id_fk" FOREIGN KEY ("bannedById") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Flagged" ADD CONSTRAINT "Flagged_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Flagged" ADD CONSTRAINT "Flagged_notifierId_user_id_fk" FOREIGN KEY ("notifierId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_notifierId_user_id_fk" FOREIGN KEY ("notifierId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_id_unique" UNIQUE("id");