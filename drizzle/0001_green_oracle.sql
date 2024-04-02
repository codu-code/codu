ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "PostTag" DROP CONSTRAINT "PostTag_postId_fkey";
--> statement-breakpoint
ALTER TABLE "PostTag" DROP CONSTRAINT "PostTag_tagId_fkey";
--> statement-breakpoint
ALTER TABLE "PostTag" DROP CONSTRAINT "PostTag_tagId_Tag_id_fk";
--> statement-breakpoint
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_postId_fkey";
--> statement-breakpoint
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_postId_Post_id_fk";
--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";
--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";
--> statement-breakpoint
ALTER TABLE "Like" DROP CONSTRAINT "Like_commentId_fkey";
--> statement-breakpoint
ALTER TABLE "Like" DROP CONSTRAINT "Like_postId_fkey";
--> statement-breakpoint
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_commentId_fkey";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_notifierId_fkey";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_postId_fkey";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Flagged" DROP CONSTRAINT "Flagged_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_commentId_fkey";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_notifierId_fkey";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_postId_fkey";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_eventId_fkey";
--> statement-breakpoint
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_userId_fkey";
--> statement-breakpoint
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_eventId_Event_id_fk";
--> statement-breakpoint
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "BannedUsers" DROP CONSTRAINT "BannedUsers_bannedById_fkey";
--> statement-breakpoint
ALTER TABLE "BannedUsers" DROP CONSTRAINT "BannedUsers_userId_fkey";
--> statement-breakpoint
ALTER TABLE "BannedUsers" DROP CONSTRAINT "BannedUsers_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Event" DROP CONSTRAINT "Event_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "Event" DROP CONSTRAINT "Event_communityId_Community_id_fk";
--> statement-breakpoint
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_communityId_fkey";
--> statement-breakpoint
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_communityId_Community_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "VerificationToken_token_key";--> statement-breakpoint
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'Post'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "Post" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "excerpt" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "bio" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "Community" ALTER COLUMN "excerpt" SET DEFAULT '';--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'RSVP'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "RSVP" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'Membership'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "Membership" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Flagged" ADD CONSTRAINT "Flagged_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_eventId_Event_id_fk" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BannedUsers" ADD CONSTRAINT "BannedUsers_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_Community_id_fk" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Membership" ADD CONSTRAINT "Membership_communityId_Community_id_fk" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_identifier_unique" UNIQUE("identifier");--> statement-breakpoint
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_identifier_token_unique" UNIQUE("identifier","token");--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Flagged" ADD CONSTRAINT "Flagged_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Community" ADD CONSTRAINT "Community_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "BannedUsers" ADD CONSTRAINT "BannedUsers_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_id_unique" UNIQUE("id");