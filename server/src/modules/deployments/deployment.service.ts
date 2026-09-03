import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { deploymentQueue } from "../../jobs/deployment.queue";
import { implantationAccessWhere, type AuthenticatedUser } from "../../lib/access-control";
import {
  DEPLOYMENT_JOB_TYPES,
  JOB_DEPENDENCIES,
  type DeploymentJobType,
} from "./deployment.types";

async function startRun(implantationId: string, snapshotId: string) {
  const run = await prisma.deploymentRun.create({
    data: {
      implantationId,
      snapshotId,
      status: "RUNNING",
      jobs: { create: DEPLOYMENT_JOB_TYPES.map((type) => ({ type })) },
    },
    include: { jobs: true },
  });

  await prisma.implantation.update({
    where: { id: implantationId },
    data: { status: "QUEUED" },
  });

  await enqueueReadyJobs(run.id);

  return run;
}

async function enqueueReadyJobs(deploymentRunId: string) {
  const jobs = await prisma.deploymentJob.findMany({ where: { deploymentRunId } });
  const statusByType = new Map(jobs.map((job) => [job.type, job.status]));

  const readyJobs = jobs.filter((job) => {
    if (job.status !== "PENDING") return false;
    const deps = JOB_DEPENDENCIES[job.type as DeploymentJobType];
    return deps.every((dep) => statusByType.get(dep) === "SUCCESS");
  });

  for (const job of readyJobs) {
    await prisma.deploymentJob.update({
      where: { id: job.id },
      data: { status: "QUEUED" },
    });
    await deploymentQueue.add("run-job", { deploymentJobId: job.id });
  }
}

/** Marca como SKIPPED as etapas pendentes cuja dependência falhou. */
async function skipBlockedJobs(deploymentRunId: string) {
  const jobs = await prisma.deploymentJob.findMany({ where: { deploymentRunId } });
  const statusByType = new Map(jobs.map((job) => [job.type, job.status]));

  const blocked = jobs.filter((job) => {
    if (job.status !== "PENDING") return false;
    const deps = JOB_DEPENDENCIES[job.type as DeploymentJobType];
    return deps.some(
      (dep) => statusByType.get(dep) === "FAILED" || statusByType.get(dep) === "SKIPPED",
    );
  });

  for (const job of blocked) {
    await prisma.deploymentJob.update({
      where: { id: job.id },
      data: { status: "SKIPPED", error: "Etapa dependente falhou" },
    });
  }
}

async function finalizeRunIfDone(deploymentRunId: string) {
  const run = await prisma.deploymentRun.findUniqueOrThrow({
    where: { id: deploymentRunId },
    include: { jobs: true },
  });

  const stillInFlight = run.jobs.some((job) =>
    ["PENDING", "QUEUED", "RUNNING"].includes(job.status),
  );
  if (stillInFlight) return;

  const allSuccess = run.jobs.every((job) => job.status === "SUCCESS");
  const anySuccess = run.jobs.some((job) => job.status === "SUCCESS");
  const status = allSuccess ? "COMPLETED" : anySuccess ? "PARTIALLY_FAILED" : "FAILED";

  await prisma.deploymentRun.update({
    where: { id: deploymentRunId },
    data: { status, completedAt: new Date() },
  });

  await prisma.implantation.update({
    where: { id: run.implantationId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
}

/** Chamado pelo worker sempre que uma etapa termina (sucesso ou falha). */
async function onJobFinished(deploymentRunId: string) {
  await skipBlockedJobs(deploymentRunId);
  await enqueueReadyJobs(deploymentRunId);
  await finalizeRunIfDone(deploymentRunId);
}

/** Chamado pelo worker quando uma etapa começa a rodar de fato. */
async function markImplantationRunning(implantationId: string) {
  await prisma.implantation.updateMany({
    where: { id: implantationId, status: "QUEUED" },
    data: { status: "RUNNING" },
  });
}

async function getLatestRun(implantationId: string, user: AuthenticatedUser) {
  const run = await prisma.deploymentRun.findFirst({
    where: { implantationId, implantation: implantationAccessWhere(user) },
    orderBy: { createdAt: "desc" },
    include: { jobs: true },
  });

  if (!run) {
    throw new NotFoundError("Nenhuma implantação em execução foi encontrada");
  }

  return run;
}

async function retryJob(implantationId: string, type: DeploymentJobType, user: AuthenticatedUser) {
  const run = await getLatestRun(implantationId, user);
  const job = run.jobs.find((j) => j.type === type);

  if (!job) {
    throw new NotFoundError("Etapa não encontrada nesta execução");
  }

  if (job.status !== "FAILED") {
    throw new ConflictError("Só é possível reprocessar etapas com falha");
  }

  // Etapas que foram puladas por dependerem desta voltam a ficar pendentes,
  // para serem reavaliadas quando esta etapa for concluída com sucesso.
  const dependentTypes = DEPLOYMENT_JOB_TYPES.filter((candidate) =>
    JOB_DEPENDENCIES[candidate].includes(type),
  );
  await prisma.deploymentJob.updateMany({
    where: { deploymentRunId: run.id, type: { in: dependentTypes }, status: "SKIPPED" },
    data: { status: "PENDING", error: null },
  });

  const updatedJob = await prisma.deploymentJob.update({
    where: { id: job.id },
    data: { status: "QUEUED", error: null },
  });
  await deploymentQueue.add("run-job", { deploymentJobId: job.id });

  await prisma.deploymentRun.update({
    where: { id: run.id },
    data: { status: "RUNNING", completedAt: null },
  });
  await prisma.implantation.update({
    where: { id: implantationId },
    data: { status: "RUNNING", completedAt: null },
  });

  return updatedJob;
}

export const deploymentService = {
  startRun,
  onJobFinished,
  markImplantationRunning,
  getLatestRun,
  retryJob,
};
