ALTER TABLE "user" ADD COLUMN "topics" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarded_at" timestamp(3) with time zone;