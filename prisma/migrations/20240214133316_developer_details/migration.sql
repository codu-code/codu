/*
  Warnings:

  - Made the column `eventDate` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "eventDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Membership" ALTER COLUMN "isEventOrganiser" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DeveloperDetails" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "professionalOrStudent" TEXT NOT NULL,
    "workplace" TEXT,
    "jobTitle" TEXT,
    "levelOfStudy" TEXT,
    "course" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeveloperDetails" ADD CONSTRAINT "DeveloperDetails_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
