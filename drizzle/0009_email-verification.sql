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
DO $$ BEGIN
 ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
