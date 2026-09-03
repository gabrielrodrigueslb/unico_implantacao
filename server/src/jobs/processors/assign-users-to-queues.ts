import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { userQueues } from "../../integrations/atender-bem";
import type { Processor } from "./types";

const payloadSchema = z.object({
  service: z
    .object({
      queues: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
    })
    .default({ queues: [] }),
  team: z
    .object({
      users: z
        .array(
          z.object({
            username: z.string().min(1),
            queueIds: z.array(z.string()).default([]),
          }),
        )
        .default([]),
    })
    .default({ users: [] }),
});

interface QueueJobMetadata {
  queues?: { name: string; id: number }[];
}

interface UserJobMetadata {
  users?: { username: string; id: number }[];
}

/**
 * Correlaciona os ids locais do onboarding (rascunho no navegador) com os
 * ids reais criados no Atender Bem pelas etapas CONFIGURE_QUEUES e
 * CREATE_USERS, lidas do `metadata` desses jobs irmãos nesta mesma execução.
 * A dependência declarada em deployment.types.ts garante que este processor
 * só roda depois das duas terem sucesso.
 */
export const assignUsersToQueuesProcessor: Processor = async ({
  client,
  deploymentRunId,
  snapshotPayload,
}) => {
  const { service, team } = payloadSchema.parse(snapshotPayload);

  const usersWithQueues = team.users.filter((user) => user.queueIds.length > 0);
  if (usersWithQueues.length === 0) {
    return { metadata: { assignments: [] } };
  }

  const [queuesJob, usersJob] = await Promise.all([
    prisma.deploymentJob.findUnique({
      where: { deploymentRunId_type: { deploymentRunId, type: "CONFIGURE_QUEUES" } },
    }),
    prisma.deploymentJob.findUnique({
      where: { deploymentRunId_type: { deploymentRunId, type: "CREATE_USERS" } },
    }),
  ]);

  if (queuesJob?.status !== "SUCCESS" || usersJob?.status !== "SUCCESS") {
    throw new Error("Filas e usuários precisam ter sido criados com sucesso antes do vínculo");
  }

  const createdQueues = (queuesJob.metadata as QueueJobMetadata | null)?.queues ?? [];
  const createdUsers = (usersJob.metadata as UserJobMetadata | null)?.users ?? [];

  const queueNameByLocalId = new Map(service.queues.map((queue) => [queue.id, queue.name]));
  const externalQueueIdByName = new Map(createdQueues.map((queue) => [queue.name, queue.id]));
  const externalUserIdByUsername = new Map(createdUsers.map((user) => [user.username, user.id]));

  const assignments: { username: string; queueIds: number[] }[] = [];

  for (const user of usersWithQueues) {
    const externalUserId = externalUserIdByUsername.get(user.username);
    if (!externalUserId) {
      throw new Error(`Usuário ${user.username} não foi encontrado entre os usuários criados`);
    }

    const externalQueueIds = user.queueIds.map((localQueueId) => {
      const name = queueNameByLocalId.get(localQueueId);
      const externalId = name ? externalQueueIdByName.get(name) : undefined;

      if (!externalId) {
        throw new Error(
          `Não foi possível resolver a fila "${name ?? localQueueId}" para o usuário ${user.username}`,
        );
      }

      return externalId;
    });

    await userQueues.assignUserToQueues(client, externalUserId, externalQueueIds);
    assignments.push({ username: user.username, queueIds: externalQueueIds });
  }

  return { metadata: { assignments } };
};
