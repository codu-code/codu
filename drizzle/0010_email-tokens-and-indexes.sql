CREATE TABLE IF NOT EXISTS "EmailChangeHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"oldEmail" text NOT NULL,
	"newEmail" text NOT NULL,
	"changedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "EmailChangeRequest" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"newEmail" text NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "EmailChangeRequest_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP TABLE "EmailVerificationToken";--> statement-breakpoint
DROP TABLE "verificationToken";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EmailChangeHistory" ADD CONSTRAINT "EmailChangeHistory_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EmailChangeRequest" ADD CONSTRAINT "EmailChangeRequest_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Comment_postId_index" ON "Comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_index" ON "Notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_slug_index" ON "Post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Post_userId_index" ON "Post" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "User_username_index" ON "user" USING btree ("username");