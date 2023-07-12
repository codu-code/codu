/*
  Warnings:

  - You are about to drop the column `allowComments` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "allowComments",
ADD COLUMN     "showComments" BOOLEAN NOT NULL DEFAULT true;
