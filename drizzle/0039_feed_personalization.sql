CREATE TYPE "public"."topic_pref" AS ENUM('follow', 'mute');--> statement-breakpoint
CREATE TABLE "user_topic_affinity" (
	"user_id" text NOT NULL,
	"topic_id" integer NOT NULL,
	"score" real NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_topic_affinity_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "user_topic_pref" (
	"user_id" text NOT NULL,
	"topic_id" integer NOT NULL,
	"pref" "topic_pref" NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_topic_pref_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "user_topic_affinity" ADD CONSTRAINT "user_topic_affinity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topic_affinity" ADD CONSTRAINT "user_topic_affinity_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topic_pref" ADD CONSTRAINT "user_topic_pref_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topic_pref" ADD CONSTRAINT "user_topic_pref_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_topic_affinity_user_id_idx" ON "user_topic_affinity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_topic_pref_user_id_idx" ON "user_topic_pref" USING btree ("user_id");