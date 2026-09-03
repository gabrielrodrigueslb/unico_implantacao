-- CreateTable
CREATE TABLE "Onboarding" (
    "id" TEXT NOT NULL,
    "implantationId" TEXT NOT NULL,
    "currentStep" TEXT,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "lastSavedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Onboarding_implantationId_key" ON "Onboarding"("implantationId");

-- AddForeignKey
ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_implantationId_fkey" FOREIGN KEY ("implantationId") REFERENCES "Implantation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
