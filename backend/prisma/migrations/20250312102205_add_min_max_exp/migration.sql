/*
  Warnings:

  - You are about to drop the column `experienceLevel` on the `Session` table. All the data in the column will be lost.
  - Added the required column `maxExperience` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minExperience` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "experienceLevel",
ADD COLUMN     "maxExperience" INTEGER NOT NULL,
ADD COLUMN     "minExperience" INTEGER NOT NULL;
