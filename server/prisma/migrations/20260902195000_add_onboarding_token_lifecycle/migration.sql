-- Tokens existentes precisam ser rotacionados por um administrador antes de voltar a funcionar.
ALTER TABLE "Implantation"
  ADD COLUMN "onboardingTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "onboardingTokenRevokedAt" TIMESTAMP(3);
