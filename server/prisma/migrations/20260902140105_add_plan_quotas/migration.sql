-- AlterTable
ALTER TABLE "Implantation" ADD COLUMN     "adminQuota" INTEGER,
ADD COLUMN     "agentQuota" INTEGER,
ADD COLUMN     "planId" INTEGER,
ADD COLUMN     "planName" TEXT,
ADD COLUMN     "supervisorQuota" INTEGER,
ALTER COLUMN "companyName" DROP NOT NULL;
