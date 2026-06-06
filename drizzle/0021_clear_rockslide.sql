CREATE TYPE "public"."point_action" AS ENUM('post_published', 'comment_created', 'upvote_received', 'daily_active', 'shipped');--> statement-breakpoint
CREATE TABLE "point_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" "point_action" NOT NULL,
	"points" integer NOT NULL,
	"source_type" varchar(30),
	"source_id" text,
	"actor_id" text,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streak" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_active_on" timestamp(3) with time zone,
	"freezes_available" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_event" ADD CONSTRAINT "point_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_event" ADD CONSTRAINT "point_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak" ADD CONSTRAINT "user_streak_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "point_event_user_idx" ON "point_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "point_event_user_created_idx" ON "point_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_event_created_idx" ON "point_event" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "point_event_dedupe_idx" ON "point_event" USING btree ("user_id","action","source_id","actor_id");