CREATE TYPE "public"."tag_merge_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "tag_merge_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_tag_id" integer NOT NULL,
	"target_tag_id" integer NOT NULL,
	"similarity_score" integer NOT NULL,
	"reason" text,
	"status" "tag_merge_suggestion_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "tag_merge_suggestions_source_target_key" UNIQUE("source_tag_id","target_tag_id")
);
--> statement-breakpoint
ALTER TABLE "Tag" ALTER COLUMN "title" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "Tag" ADD COLUMN "slug" varchar(50);--> statement-breakpoint
ALTER TABLE "Tag" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "Tag" ADD COLUMN "post_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tag_merge_suggestions" ADD CONSTRAINT "tag_merge_suggestions_source_tag_id_Tag_id_fk" FOREIGN KEY ("source_tag_id") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_merge_suggestions" ADD CONSTRAINT "tag_merge_suggestions_target_tag_id_Tag_id_fk" FOREIGN KEY ("target_tag_id") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_merge_suggestions" ADD CONSTRAINT "tag_merge_suggestions_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tag_merge_suggestions_source_tag_idx" ON "tag_merge_suggestions" USING btree ("source_tag_id");--> statement-breakpoint
CREATE INDEX "tag_merge_suggestions_target_tag_idx" ON "tag_merge_suggestions" USING btree ("target_tag_id");--> statement-breakpoint
CREATE INDEX "tag_merge_suggestions_status_idx" ON "tag_merge_suggestions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag" USING btree ("slug");