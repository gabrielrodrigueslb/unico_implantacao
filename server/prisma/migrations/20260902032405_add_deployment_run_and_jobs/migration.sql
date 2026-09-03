-- CreateEnum
CREATE TYPE "DeploymentRunStatus" AS ENUM ('RUNNING', 'PARTIALLY_FAILED', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeploymentJobType" AS ENUM ('CONFIGURE_QUEUES', 'CREATE_USERS', 'ASSIGN_USERS_TO_QUEUES', 'CONFIGURE_IVR', 'CREATE_CONTACT_TAGS', 'CREATE_CHAT_TAGS', 'CREATE_QUICK_REPLIES');

-- CreateEnum
CREATE TYPE "DeploymentJobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "DeploymentRun" (
    "id" TEXT NOT NULL,
    "implantationId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "status" "DeploymentRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentJob" (
    "id" TEXT NOT NULL,
    "deploymentRunId" TEXT NOT NULL,
    "type" "DeploymentJobType" NOT NULL,
    "status" "DeploymentJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "externalResourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentJob_deploymentRunId_type_key" ON "DeploymentJob"("deploymentRunId", "type");

-- AddForeignKey
ALTER TABLE "DeploymentRun" ADD CONSTRAINT "DeploymentRun_implantationId_fkey" FOREIGN KEY ("implantationId") REFERENCES "Implantation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentRun" ADD CONSTRAINT "DeploymentRun_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "DeploymentSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentJob" ADD CONSTRAINT "DeploymentJob_deploymentRunId_fkey" FOREIGN KEY ("deploymentRunId") REFERENCES "DeploymentRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
