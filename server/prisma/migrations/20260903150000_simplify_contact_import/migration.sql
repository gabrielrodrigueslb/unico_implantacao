-- Etapa de importação de contatos deixou de validar/analisar o conteúdo do
-- arquivo (não executamos nenhuma ação automática sobre ele) — colunas de
-- parsing (columns/totalRows/validRows/invalidRows/preview) não fazem mais
-- sentido, guardamos só os metadados do arquivo em si.
ALTER TABLE "ContactImport"
  DROP COLUMN "columns",
  DROP COLUMN "totalRows",
  DROP COLUMN "validRows",
  DROP COLUMN "invalidRows",
  DROP COLUMN "preview";
