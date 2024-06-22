ALTER TABLE "BannedUsers" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Flagged" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint