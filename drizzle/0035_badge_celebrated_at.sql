ALTER TABLE "user_badge" ADD COLUMN "celebrated_at" timestamp(3) with time zone;--> statement-breakpoint
-- Backfill: badges earned before this feature shipped must not retro-celebrate.
UPDATE "user_badge" SET "celebrated_at" = "awarded_at" WHERE "celebrated_at" IS NULL;
--> statement-breakpoint
-- The onboarding badge must exist wherever this migrates — the seed script
-- isn't part of the deploy pipeline.
INSERT INTO "badge" ("key", "name", "description", "emoji")
VALUES ('onboarding_complete', 'First Steps', 'Picked your topics, followed 3 builders, and joined the conversation.', '👣')
ON CONFLICT ("key") DO NOTHING;
