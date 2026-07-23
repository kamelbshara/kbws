-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InitiativeCategory" AS ENUM ('EDUCATIONAL', 'COMMUNITY', 'NATIONAL', 'INNOVATION', 'HEALTH_SAFETY', 'OTHER');

-- DropForeignKey
ALTER TABLE "AIGenerationLog" DROP CONSTRAINT "AIGenerationLog_lessonPlanId_fkey";

-- AlterTable
ALTER TABLE "AIGenerationLog" ADD COLUMN     "initiativeId" TEXT,
ALTER COLUMN "lessonPlanId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "InitiativeCategory" NOT NULL,
    "initialIdea" TEXT NOT NULL,
    "goal" TEXT,
    "targetGroup" TEXT,
    "baseline" TEXT,
    "status" "InitiativeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativePhase" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT,
    "responsible" TEXT,

    CONSTRAINT "InitiativePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeIndicator" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "targetValue" TEXT,
    "actualValue" TEXT,

    CONSTRAINT "InitiativeIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeEvidence" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "InitiativeEvidence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativePhase" ADD CONSTRAINT "InitiativePhase_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeIndicator" ADD CONSTRAINT "InitiativeIndicator_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeEvidence" ADD CONSTRAINT "InitiativeEvidence_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeEvidence" ADD CONSTRAINT "InitiativeEvidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
