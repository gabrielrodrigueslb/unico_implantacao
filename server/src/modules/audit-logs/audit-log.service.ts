import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthenticatedUser } from "../../lib/access-control";
import type { AuditAction } from "./audit-log.constants";
import type { ListAuditLogsQuery } from "./audit-log.schema";

export interface RecordAuditLogInput {
  /** `null` para ações do próprio sistema (worker), sem sessão de painel por trás. */
  actor: AuthenticatedUser & { name: string };
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Nunca deve derrubar a ação principal por causa de um problema de log —
 * por isso o `catch` aqui em vez de deixar o erro propagar. Chamar sempre
 * depois que a ação principal já foi persistida com sucesso.
 */
async function record(input: RecordAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorName: input.actor.name,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("Falha ao gravar log de auditoria", err);
  }
}

async function listForEntity(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
}

/** Busca global — só ADMIN, ver audit-log.routes.ts. */
async function list(query: ListAuditLogsQuery) {
  const { page, pageSize, search, entityType, entityId, actorId, action } = query;

  const where: Prisma.AuditLogWhereInput = {
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
    ...(search
      ? {
          OR: [
            { actorName: { contains: search, mode: "insensitive" } },
            { action: { contains: search, mode: "insensitive" } },
            { entityType: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

/** Para popular um filtro de "ação" na busca sem hardcodear no frontend. */
async function listDistinctActions(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });
  return rows.map((row) => row.action);
}

export const auditLogService = { record, listForEntity, list, listDistinctActions };
