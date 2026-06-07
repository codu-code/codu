ALTER TYPE "public"."point_action" ADD VALUE 'referral';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_code" varchar(16);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "invited_by" text;--> statement-breakpoint
CREATE UNIQUE INDEX "User_referral_code_key" ON "user" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "User_invited_by_idx" ON "user" USING btree ("invited_by");