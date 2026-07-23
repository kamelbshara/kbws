-- CreateEnum
CREATE TYPE "InsightScope" AS ENUM ('TEACHER', 'SCHOOL');

-- AlterTable
ALTER TABLE "AIGenerationLog" ADD COLUMN     "insightId" TEXT;

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "scope" "InsightScope" NOT NULL,
    "schoolId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_scope_schoolId_requestedById_idx" ON "Insight"("scope", "schoolId", "requestedById");

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
