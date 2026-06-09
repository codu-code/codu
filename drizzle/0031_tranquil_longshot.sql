CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD COLUMN "postId" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "externalUrlNormalized" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "moderationNote" text;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ContentReport_postId_index" ON "ContentReport" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "posts_external_url_normalized_idx" ON "posts" USING btree ("externalUrlNormalized");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON "posts" USING gin (lower("title") gin_trgm_ops);