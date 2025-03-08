/*
  Warnings:

  - You are about to drop the column `candidateId` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resumeId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resumeId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_candidateId_fkey";

-- DropIndex
DROP INDEX "Evaluation_candidateId_idx";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "candidateId",
ADD COLUMN     "resumeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_resumeId_key" ON "Evaluation"("resumeId");

-- CreateIndex
CREATE INDEX "Resume_candidateId_idx" ON "Resume"("candidateId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
