import { Prisma } from "@prisma/client";
import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { AtenderBemClient } from "../integrations/atender-bem";
import { deploymentService } from "../modules/deployments/deployment.service";
import { implantationService } from "../modules/implantations/implantation.service";
import type {
  DeploymentJobData,
  DeploymentJobType,
} from "../modules/deployments/deployment.types";
import { processors } from "./processors";

/**
 * A automação sempre autentica com a conta de implantador da Unico
 * (PARTNER_ATENDERBEM_*, a mesma usada para consultar planos) — não pedimos
 * mais uma conta de serviço por instância. Só o endereço da instância vem
 * da implantação.
 */
async function buildClient(implantationId: string): Promise<AtenderBemClient> {
  const implantation = await implantationService.getByIdForWorker(implantationId);

  if (
    !env.PARTNER_ATENDERBEM_USERNAME ||
    !env.PARTNER_ATENDERBEM_PASSWORD ||
    !env.PARTNER_ATENDERBEM_TOTP_SECRET
  ) {
    throw new AppError(
      "Credenciais da conta de implantador (PARTNER_ATENDERBEM_*) não configuradas no servidor",
    );
  }

  return new AtenderBemClient({
    baseUrl: implantation.instanceBaseUrl,
    username: env.PARTNER_ATENDERBEM_USERNAME,
    password: env.PARTNER_ATENDERBEM_PASSWORD,
    totpSecret: env.PARTNER_ATENDERBEM_TOTP_SECRET,
  });
}

async function handleJob(job: Job<DeploymentJobData>) {
  const deploymentJob = await prisma.deploymentJob.findUniqueOrThrow({
    where: { id: job.data.deploymentJobId },
    include: { deploymentRun: { include: { snapshot: true } } },
  });
  const implantationId = deploymentJob.deploymentRun.implantationId;

  await prisma.deploymentJob.update({
    where: { id: deploymentJob.id },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });
  await deploymentService.markImplantationRunning(implantationId);

  try {
    const client = await buildClient(implantationId);
    const processor = processors[deploymentJob.type as DeploymentJobType];
    const result = await processor({
      implantationId,
      deploymentRunId: deploymentJob.deploymentRunId,
      snapshotPayload: deploymentJob.deploymentRun.snapshot.payload as Record<string, unknown>,
      client,
    });

    await prisma.deploymentJob.update({
      where: { id: deploymentJob.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        externalResourceId: result.externalResourceId,
        metadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    await prisma.deploymentJob.update({
      where: { id: deploymentJob.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
    });
  } finally {
    await deploymentService.onJobFinished(deploymentJob.deploymentRunId);
  }
}

export const deploymentWorker = new Worker<DeploymentJobData>(
  "deployment",
  handleJob,
  { connection: redisConnection, concurrency: 3 },
);

deploymentWorker.on("ready", () => {
  console.log("Worker de implantação pronto");
});

deploymentWorker.on("error", (error) => {
  console.error("Erro no worker de implantação", error);
});
