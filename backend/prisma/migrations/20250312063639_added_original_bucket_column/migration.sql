/*
  Warnings:

  - Added the required column `originalBucketId` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "originalBucketId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
