import { z } from "zod";

export const createImplantationSchema = z.object({
  // Não é necessário para gerar o link — o cliente preenche no onboarding.
  companyName: z.string().min(1).optional(),
  // Aceita com ou sem máscara — normalizado para só dígitos em
  // implantation.service.ts antes de salvar, pra busca funcionar igual.
  cnpj: z.string().optional(),
  // Aceita qualquer formato ("cliente", "cliente.atenderbem.com",
  // "https://cliente.atenderbem.com"...) — normalizado em
  // instance-url.ts para instanceName + instanceBaseUrl.
  instanceUrl: z.string().min(1, "Link da instância é obrigatório"),
  // Id de partner/getAllAvailablePlans — usado como ponto de partida dos
  // limites de usuário (admin/atendente/supervisor) usados na etapa de
  // equipe do onboarding. Os três campos abaixo, se enviados, sobrescrevem
  // os valores do plano nesta implantação (ver implantation.service.ts).
  planId: z.number().int().positive("Plano é obrigatório"),
  agentQuota: z.number().int().nonnegative().optional(),
  supervisorQuota: z.number().int().nonnegative().optional(),
  adminQuota: z.number().int().nonnegative().optional(),
  responsibleUserId: z.string().optional(),
  // Conta de serviço dedicada à automação nesta instância (não é o usuário
  // de nenhum atendente real). Opcional na criação — pode ser configurada
  // depois, antes da aprovação, via PATCH.
  serviceUsername: z.string().min(1).optional(),
  servicePassword: z.string().min(1).optional(),
  serviceTotpSecret: z.string().min(1).optional(),
});

export const updateImplantationSchema = createImplantationSchema
  // Quotas só se definem na criação do link, junto com o plano — não dá
  // pra editar depois por aqui (ver CreateImplantationSheet.tsx).
  .omit({ instanceUrl: true, planId: true, agentQuota: true, supervisorQuota: true, adminQuota: true })
  .partial()
  .extend({
    // Quem de fato conduziu a implantação — distinto de `responsibleUserId`.
    // `null` limpa a atribuição; ausente não mexe no valor atual.
    implanterId: z.string().nullable().optional(),
  });

export type CreateImplantationInput = z.infer<typeof createImplantationSchema>;
export type UpdateImplantationInput = z.infer<typeof updateImplantationSchema>;

export const listImplantationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // Limite alto pra não permitir varrer a tabela inteira de uma vez só
  // (ver docs/PROJECT.md — evitar problemas de performance conforme o
  // volume de implantações cresce).
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export type ListImplantationsQuery = z.infer<typeof listImplantationsQuerySchema>;
