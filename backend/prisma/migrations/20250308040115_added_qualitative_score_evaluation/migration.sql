/*
  Warnings:

  - Added the required column `qualitativeScore` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "qualitativeScore" DOUBLE PRECISION NOT NULL;
