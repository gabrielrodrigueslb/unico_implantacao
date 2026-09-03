-- AlterTable
ALTER TABLE "Implantation" ADD COLUMN     "cnpj" TEXT;

-- CreateIndex
CREATE INDEX "Implantation_status_idx" ON "Implantation"("status");

-- CreateIndex
CREATE INDEX "Implantation_createdAt_idx" ON "Implantation"("createdAt");

-- CreateIndex
CREATE INDEX "Implantation_cnpj_idx" ON "Implantation"("cnpj");

-- CreateIndex
CREATE INDEX "Implantation_companyName_idx" ON "Implantation"("companyName");

-- CreateIndex
CREATE INDEX "Implantation_instanceName_idx" ON "Implantation"("instanceName");
