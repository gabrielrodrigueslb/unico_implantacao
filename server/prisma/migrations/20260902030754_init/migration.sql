-- CreateEnum
CREATE TYPE "ImplantationStatus" AS ENUM ('ONBOARDING_PENDING', 'ONBOARDING_IN_PROGRESS', 'WAITING_REVIEW', 'APPROVED', 'QUEUED', 'RUNNING', 'PARTIALLY_FAILED', 'FAILED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Implantation" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "instanceBaseUrl" TEXT NOT NULL,
    "responsibleUserId" TEXT,
    "status" "ImplantationStatus" NOT NULL DEFAULT 'ONBOARDING_PENDING',
    "onboardingToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Implantation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Implantation_onboardingToken_key" ON "Implantation"("onboardingToken");
