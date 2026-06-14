CREATE TYPE "public"."report_source" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."tag_source" AS ENUM('ai', 'manual');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('active', 'pending');--> statement-breakpoint
CREATE TABLE "post_metadata" (
	"post_id" uuid PRIMARY KEY NOT NULL,
	"sentiment" "sentiment",
	"sentiment_score" real,
	"quality_score" real,
	"quality_reason" text,
	"model_id" text,
	"analyzed_at" timestamp(3) with time zone,
	"schema_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_topic" (
	"post_id" uuid NOT NULL,
	"topic_id" integer NOT NULL,
	"confidence" real,
	"source" "tag_source" DEFAULT 'ai' NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "post_topic_post_id_topic_id_pk" PRIMARY KEY("post_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"label" varchar(80) NOT NULL,
	"status" "topic_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "reporter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "moderated_at" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "source" "report_source" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "post_metadata" ADD CONSTRAINT "post_metadata_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_topic" ADD CONSTRAINT "post_topic_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_topic" ADD CONSTRAINT "post_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_metadata_analyzed_at_idx" ON "post_metadata" USING btree ("analyzed_at");--> statement-breakpoint
CREATE INDEX "post_topic_topic_id_idx" ON "post_topic" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "post_topic_source_idx" ON "post_topic" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_slug_key" ON "topic" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "topic_status_idx" ON "topic" USING btree ("status");--> statement-breakpoint
-- Seed the controlled topic vocabulary (idempotent). The nightly review cron
-- maps AI-suggested topics to these slugs; the model may propose new ones into
-- `status = 'pending'` for admin approval.
INSERT INTO "topic" ("slug", "label", "status") VALUES
	('ai-agents', 'AI Agents', 'active'),
	('rag', 'RAG', 'active'),
	('prompt-engineering', 'Prompt Engineering', 'active'),
	('evals', 'Evals', 'active'),
	('llm-apps', 'LLM Apps', 'active'),
	('fine-tuning', 'Fine-tuning', 'active'),
	('vector-databases', 'Vector Databases', 'active'),
	('ai-coding-tools', 'AI Coding Tools', 'active'),
	('mcp', 'MCP', 'active'),
	('open-models', 'Open Models', 'active'),
	('computer-vision', 'Computer Vision', 'active'),
	('voice-ai', 'Voice AI', 'active'),
	('nextjs', 'Next.js', 'active'),
	('react', 'React', 'active'),
	('typescript', 'TypeScript', 'active'),
	('python', 'Python', 'active'),
	('frontend', 'Frontend', 'active'),
	('backend', 'Backend', 'active'),
	('databases', 'Databases', 'active'),
	('devops', 'DevOps', 'active'),
	('web-performance', 'Web Performance', 'active'),
	('css', 'CSS', 'active'),
	('security', 'Security', 'active'),
	('data-engineering', 'Data Engineering', 'active'),
	('mobile', 'Mobile', 'active'),
	('open-source', 'Open Source', 'active'),
	('indie-hacking', 'Indie Hacking', 'active'),
	('build-in-public', 'Build in Public', 'active'),
	('saas', 'SaaS', 'active'),
	('bootstrapping', 'Bootstrapping', 'active'),
	('fundraising', 'Fundraising', 'active'),
	('growth-marketing', 'Growth & Marketing', 'active'),
	('product', 'Product', 'active'),
	('design', 'Design', 'active'),
	('career', 'Career', 'active'),
	('startups', 'Startups', 'active'),
	('no-code', 'No-code', 'active')
ON CONFLICT ("slug") DO NOTHING;