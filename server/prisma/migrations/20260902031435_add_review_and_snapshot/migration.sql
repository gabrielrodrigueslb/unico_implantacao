-- AlterTable
ALTER TABLE "Onboarding" ADD COLUMN     "reviewedResponses" JSONB;

-- CreateTable
CREATE TABLE "DeploymentSnapshot" (
    "id" TEXT NOT NULL,
    "implantationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentSnapshot_implantationId_version_key" ON "DeploymentSnapshot"("implantationId", "version");

-- AddForeignKey
ALTER TABLE "DeploymentSnapshot" ADD CONSTRAINT "DeploymentSnapshot_implantationId_fkey" FOREIGN KEY ("implantationId") REFERENCES "Implantation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
