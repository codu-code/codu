CREATE TYPE "public"."job_status" AS ENUM('draft', 'pending_payment', 'pending', 'active', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full-time', 'part-time', 'freelancer', 'other');--> statement-breakpoint
CREATE TABLE "job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"company_name" varchar(100) NOT NULL,
	"company_logo" text,
	"job_title" varchar(100) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"job_description" text,
	"job_location" varchar(60) NOT NULL,
	"application_url" varchar(2000),
	"type" "job_type" NOT NULL,
	"remote" boolean DEFAULT false NOT NULL,
	"relocation" boolean DEFAULT false NOT NULL,
	"visa_sponsorship" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"ai_native" boolean DEFAULT false NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"price_cents" integer,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"payment_provider" varchar(30),
	"payment_ref" varchar(255),
	"paid_at" timestamp(3) with time zone,
	"approved_by_id" text,
	"approved_at" timestamp(3) with time zone,
	"rejection_reason" text,
	"published_at" timestamp(3) with time zone,
	"expires_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_slug_idx" ON "job" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "job_status_idx" ON "job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_featured_idx" ON "job" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "job_type_idx" ON "job" USING btree ("type");--> statement-breakpoint
CREATE INDEX "job_user_id_idx" ON "job" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_published_at_idx" ON "job" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "job_expires_at_idx" ON "job" USING btree ("expires_at");