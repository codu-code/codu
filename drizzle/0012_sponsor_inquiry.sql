-- Sponsor Inquiry System
-- Creates the sponsorship inquiry table with all fields

-- Create budget range enum
DO $$ BEGIN
    CREATE TYPE "SponsorBudgetRange" AS ENUM ('EXPLORING', 'UNDER_500', 'BETWEEN_500_2000', 'BETWEEN_2000_5000', 'OVER_5000');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sponsor inquiry status enum
DO $$ BEGIN
    CREATE TYPE "SponsorInquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SponsorInquiry table with all final fields
CREATE TABLE IF NOT EXISTS "SponsorInquiry" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company" VARCHAR(100),
    "phone" VARCHAR(50),
    "interests" TEXT,
    "budgetRange" "SponsorBudgetRange" DEFAULT 'EXPLORING',
    "goals" TEXT,
    "status" "SponsorInquiryStatus" DEFAULT 'PENDING' NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "SponsorInquiry_status_index" ON "SponsorInquiry" ("status");
CREATE INDEX IF NOT EXISTS "SponsorInquiry_email_index" ON "SponsorInquiry" ("email");
