ALTER TABLE "posts" ADD COLUMN "url_id" varchar(16);--> statement-breakpoint
CREATE UNIQUE INDEX "posts_url_id_key" ON "posts" USING btree ("url_id");