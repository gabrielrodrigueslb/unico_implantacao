-- O Atender Bem cria um administrador padrão em toda instância. Os limites
-- existentes foram salvos com esse usuário incluído; normalizamos para o
-- número de administradores adicionais que o cliente pode cadastrar.
UPDATE "Implantation"
SET "adminQuota" = GREATEST("adminQuota" - 1, 0)
WHERE "adminQuota" IS NOT NULL;
