import type { AdminUser, Implantation, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../lib/errors";
import { encryptSecret } from "../../lib/crypto";
import { fetchAvailablePlans } from "../../integrations/atender-bem/partner-client";
import { parseInstanceUrl } from "./instance-url";
import { implantationAccessWhere, type AuthenticatedUser } from "../../lib/access-control";
import { onboardingTokenExpiresAt } from "../onboarding/onboarding.service";
import { AUDIT_ACTIONS } from "../audit-logs/audit-log.constants";
import { auditLogService } from "../audit-logs/audit-log.service";
import type {
  CreateImplantationInput,
  ListImplantationsQuery,
  UpdateImplantationInput,
} from "./implantation.schema";

type Actor = AuthenticatedUser & { name: string };

const implanterSelect = { implanter: { select: { id: true, name: true } } } satisfies Prisma.ImplantationInclude;

type ImplantationWithImplanter = Implantation & { implanter: Pick<AdminUser, "id" | "name"> | null };

/**
 * Nunca devolver a conta de serviço pela API — nem username, nem os campos
 * cifrados. `credentialsConfigured` é o suficiente para a interface saber
 * se falta cadastrar antes de aprovar.
 */
function sanitize(implantation: ImplantationWithImplanter) {
  const {
    serviceUsername: _serviceUsername,
    servicePasswordEncrypted: _servicePasswordEncrypted,
    serviceTotpSecretEncrypted: _serviceTotpSecretEncrypted,
    ...rest
  } = implantation;

  return {
    ...rest,
    credentialsConfigured: Boolean(
      implantation.serviceUsername &&
        implantation.servicePasswordEncrypted &&
        implantation.serviceTotpSecretEncrypted,
    ),
  };
}

function toPersistedCredentials<
  T extends { servicePassword?: string; serviceTotpSecret?: string; cnpj?: string },
>(data: T) {
  const { servicePassword, serviceTotpSecret, cnpj, ...rest } = data;

  return {
    ...rest,
    // Só dígitos — sem isso a busca por CNPJ formatado x sem formatação
    // (implantation.service.ts → list) não bateria com o valor salvo.
    ...(cnpj !== undefined ? { cnpj: cnpj.replace(/\D/g, "") || null } : {}),
    ...(servicePassword ? { servicePasswordEncrypted: encryptSecret(servicePassword) } : {}),
    ...(serviceTotpSecret
      ? { serviceTotpSecretEncrypted: encryptSecret(serviceTotpSecret) }
      : {}),
  };
}

async function create(data: CreateImplantationInput, actor: Actor) {
  const { instanceUrl, planId, ...rest } = data;

  let instanceName: string;
  let instanceBaseUrl: string;
  try {
    ({ instanceName, instanceBaseUrl } = parseInstanceUrl(instanceUrl));
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : "Link da instância inválido");
  }

  const plans = await fetchAvailablePlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    throw new AppError(`Plano ${planId} não encontrado`);
  }

  const implantation = await prisma.implantation.create({
    data: {
      ...toPersistedCredentials(rest),
      // O dono é sempre a sessão autenticada, nunca um id arbitrário enviado pelo cliente.
      responsibleUserId: actor.id,
      instanceName,
      instanceBaseUrl,
      planId: plan.id,
      planName: plan.name,
      agentQuota: plan.chatagents,
      supervisorQuota: plan.supervisors,
      adminQuota: plan.monitoringagents,
      status: "ONBOARDING_PENDING",
      onboardingTokenExpiresAt: onboardingTokenExpiresAt(),
    },
    include: implanterSelect,
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.IMPLANTATION_CREATED,
    entityType: "Implantation",
    entityId: implantation.id,
    metadata: { instanceName, companyName: implantation.companyName },
  });

  return sanitize(implantation);
}

/**
 * Listagem paginada — nunca varre a tabela inteira. `search` casa por
 * nome da empresa, nome da instância ou CNPJ (com ou sem máscara: o termo
 * digitado é normalizado pros mesmos dígitos que ficam salvos).
 */
async function list(query: ListImplantationsQuery, user: AuthenticatedUser) {
  const { page, pageSize, search } = query;
  const digitsOnly = search ? search.replace(/\D/g, "") : "";

  const searchWhere: Prisma.ImplantationWhereInput | undefined = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { instanceName: { contains: search, mode: "insensitive" } },
          ...(digitsOnly ? [{ cnpj: { contains: digitsOnly } }] : []),
        ],
      }
    : undefined;
  const where: Prisma.ImplantationWhereInput = {
    AND: [implantationAccessWhere(user), ...(searchWhere ? [searchWhere] : [])],
  };

  const [data, total] = await Promise.all([
    prisma.implantation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: implanterSelect,
    }),
    prisma.implantation.count({ where }),
  ]);

  return {
    data: data.map(sanitize),
    total,
    page,
    pageSize,
  };
}

/**
 * Indicadores do dashboard — contagem por status e criações por dia (90
 * dias). Consultas agregadas em vez de trazer a tabela inteira pro Node
 * pra somar, que não escalaria conforme o número de implantações cresce.
 */
async function stats(user: AuthenticatedUser) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [byStatusRaw, recentCreatedAt] = await Promise.all([
    prisma.implantation.groupBy({ by: ["status"], _count: { _all: true }, where: implantationAccessWhere(user) }),
    prisma.implantation.findMany({
      where: { AND: [implantationAccessWhere(user), { createdAt: { gte: ninetyDaysAgo } }] },
      select: { createdAt: true },
    }),
  ]);

  const byStatus = Object.fromEntries(byStatusRaw.map((row) => [row.status, row._count._all]));

  const countByDay = new Map<string, number>();
  for (const { createdAt } of recentCreatedAt) {
    const day = createdAt.toISOString().slice(0, 10);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }
  const createdPerDay = Array.from(countByDay, ([date, count]) => ({ date, count })).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return { byStatus, createdPerDay };
}

async function getById(id: string, user: AuthenticatedUser) {
  const implantation = await prisma.implantation.findFirst({
    where: { AND: [{ id }, implantationAccessWhere(user)] },
    include: implanterSelect,
  });

  if (!implantation) {
    throw new NotFoundError("Implantação não encontrada");
  }

  return sanitize(implantation);
}

/** Acesso de sistema para o worker, que não representa uma sessão de painel. */
async function getByIdForWorker(id: string) {
  const implantation = await prisma.implantation.findUnique({ where: { id } });
  if (!implantation) throw new NotFoundError("Implantação não encontrada");
  return implantation;
}

async function update(id: string, data: UpdateImplantationInput, actor: Actor) {
  const before = await getById(id, actor);

  const { implanterId, ...otherChanges } = data;

  const implantation = await prisma.implantation.update({
    where: { id },
    data: toPersistedCredentials({ ...otherChanges, ...(implanterId !== undefined ? { implanterId } : {}) }),
    include: implanterSelect,
  });

  if (implanterId !== undefined) {
    await auditLogService.record({
      actor,
      action: AUDIT_ACTIONS.IMPLANTATION_IMPLANTER_ASSIGNED,
      entityType: "Implantation",
      entityId: id,
      metadata: {
        previousImplanterName: before.implanter?.name ?? null,
        newImplanterName: implantation.implanter?.name ?? null,
      },
    });
  }

  if (Object.keys(otherChanges).length > 0) {
    await auditLogService.record({
      actor,
      action: AUDIT_ACTIONS.IMPLANTATION_UPDATED,
      entityType: "Implantation",
      entityId: id,
      metadata: { changedFields: Object.keys(otherChanges) },
    });
  }

  return sanitize(implantation);
}

async function cancel(id: string, actor: Actor) {
  await getById(id, actor);

  const implantation = await prisma.implantation.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: implanterSelect,
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.IMPLANTATION_CANCELLED,
    entityType: "Implantation",
    entityId: id,
  });

  return sanitize(implantation);
}

export interface ActivityEvent {
  id: string;
  at: Date;
  kind: "audit" | "deployment_run" | "deployment_job";
  label: string;
  actorName: string | null;
  status?: string;
  metadata?: unknown;
}

/**
 * Timeline única da implantação para a aba "Atividade": ações registradas
 * em auditoria (criada, aprovada, cancelada, implantador atribuído...) e o
 * andamento de cada etapa da automação em todas as execuções (inclusive
 * reprocessamentos). Implantações criadas antes deste recurso simplesmente
 * não têm o evento "criada" — não tentamos reconstruir histórico que nunca
 * foi gravado.
 */
async function activity(id: string, user: AuthenticatedUser): Promise<ActivityEvent[]> {
  await getById(id, user);

  const [logs, runs] = await Promise.all([
    auditLogService.listForEntity("Implantation", id),
    prisma.deploymentRun.findMany({
      where: { implantationId: id },
      orderBy: { createdAt: "asc" },
      include: { jobs: true },
    }),
  ]);

  const events: ActivityEvent[] = logs.map((log) => ({
    id: log.id,
    at: log.createdAt,
    kind: "audit",
    label: log.action,
    actorName: log.actorName,
    metadata: log.metadata,
  }));

  for (const run of runs) {
    events.push({
      id: `${run.id}-start`,
      at: run.startedAt,
      kind: "deployment_run",
      label: "Execução da automação iniciada",
      actorName: null,
      status: "RUNNING",
    });

    for (const job of run.jobs) {
      if (!job.startedAt) continue;
      events.push({
        id: job.id,
        at: job.finishedAt ?? job.startedAt,
        kind: "deployment_job",
        label: job.type,
        actorName: null,
        status: job.status,
        metadata: { attempts: job.attempts, error: job.error },
      });
    }

    if (run.completedAt) {
      events.push({
        id: `${run.id}-end`,
        at: run.completedAt,
        kind: "deployment_run",
        label: "Execução da automação concluída",
        actorName: null,
        status: run.status,
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export const implantationService = {
  create,
  list,
  stats,
  getById,
  getByIdForWorker,
  update,
  cancel,
  activity,
};
