ALTER TABLE "session" DROP CONSTRAINT "session_id_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN IF EXISTS "id";