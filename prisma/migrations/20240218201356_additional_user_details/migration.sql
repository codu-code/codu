/*
  Warnings:

  - Made the column `eventDate` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "eventDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Membership" ALTER COLUMN "isEventOrganiser" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "course" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "levelOfStudy" TEXT,
ADD COLUMN     "professionalOrStudent" TEXT,
ADD COLUMN     "surname" TEXT,
ADD COLUMN     "workplace" TEXT;
