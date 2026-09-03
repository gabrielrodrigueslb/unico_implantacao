CREATE TABLE "ContactImport" (
  "id" TEXT NOT NULL,
  "onboardingId" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "storageName" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "columns" TEXT[] NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "validRows" INTEGER NOT NULL,
  "invalidRows" INTEGER NOT NULL,
  "preview" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContactImport_onboardingId_key" ON "ContactImport"("onboardingId");
CREATE UNIQUE INDEX "ContactImport_storageName_key" ON "ContactImport"("storageName");
ALTER TABLE "ContactImport" ADD CONSTRAINT "ContactImport_onboardingId_fkey"
  FOREIGN KEY ("onboardingId") REFERENCES "Onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
