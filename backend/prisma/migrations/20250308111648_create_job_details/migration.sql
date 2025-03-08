/*
  Warnings:

  - Added the required column `department` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `educationRequired` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employmentType` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceLevel` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "educationPreferred" TEXT,
ADD COLUMN     "educationRequired" TEXT NOT NULL,
ADD COLUMN     "employmentType" TEXT NOT NULL,
ADD COLUMN     "experienceLevel" TEXT NOT NULL,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "preferredSkills" TEXT[],
ADD COLUMN     "requiredSkills" TEXT[],
ADD COLUMN     "responsibilities" TEXT[];
