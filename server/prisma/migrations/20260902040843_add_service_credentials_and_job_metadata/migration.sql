-- AlterTable
ALTER TABLE "DeploymentJob" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Implantation" ADD COLUMN     "servicePasswordEncrypted" TEXT,
ADD COLUMN     "serviceTotpSecretEncrypted" TEXT,
ADD COLUMN     "serviceUsername" TEXT;
