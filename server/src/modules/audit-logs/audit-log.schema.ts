import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(30),
  /** Busca livre em ator, ação e tipo de entidade. */
  search: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  actorId: z.string().trim().optional(),
  action: z.string().trim().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
