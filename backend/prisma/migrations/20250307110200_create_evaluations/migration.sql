/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "createdAt";

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "keywordScore" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evaluation_candidateId_idx" ON "Evaluation"("candidateId");

-- CreateIndex
CREATE INDEX "Candidate_sessionId_idx" ON "Candidate"("sessionId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
