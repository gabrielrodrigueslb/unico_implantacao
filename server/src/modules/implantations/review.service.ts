import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { deploymentService } from "../deployments/deployment.service";
import { implantationAccessWhere, type AuthenticatedUser } from "../../lib/access-control";

async function findImplantationWithOnboarding(implantationId: string, user: AuthenticatedUser) {
  const implantation = await prisma.implantation.findFirst({
    where: { AND: [{ id: implantationId }, implantationAccessWhere(user)] },
    include: { onboarding: true },
  });

  if (!implantation) {
    throw new NotFoundError("Implantação não encontrada");
  }

  if (!implantation.onboarding) {
    throw new NotFoundError("O cliente ainda não enviou o onboarding");
  }

  return implantation;
}

async function getReview(implantationId: string, user: AuthenticatedUser) {
  const implantation = await findImplantationWithOnboarding(implantationId, user);
  const onboarding = implantation.onboarding!;

  return {
    implantation: {
      id: implantation.id,
      companyName: implantation.companyName,
      instanceName: implantation.instanceName,
      status: implantation.status,
    },
    submittedAt: onboarding.submittedAt,
    clientResponses: onboarding.responses,
    reviewedResponses: onboarding.reviewedResponses,
  };
}

async function updateReviewResponses(
  implantationId: string,
  responses: Record<string, unknown>, user: AuthenticatedUser,
) {
  const implantation = await findImplantationWithOnboarding(implantationId, user);

  if (implantation.status !== "WAITING_REVIEW") {
    throw new ConflictError(
      "Só é possível editar as respostas enquanto a implantação aguarda revisão",
    );
  }

  return prisma.onboarding.update({
    where: { implantationId },
    data: { reviewedResponses: responses as Prisma.InputJsonValue },
  });
}

async function approve(implantationId: string, approvedBy: string, user: AuthenticatedUser) {
  const implantation = await findImplantationWithOnboarding(implantationId, user);

  if (implantation.status !== "WAITING_REVIEW") {
    throw new ConflictError(
      "Só é possível aprovar implantações que estejam aguardando revisão",
    );
  }

  const onboarding = implantation.onboarding!;
  const approvedPayload = onboarding.reviewedResponses ?? onboarding.responses;

  const lastSnapshot = await prisma.deploymentSnapshot.findFirst({
    where: { implantationId },
    orderBy: { version: "desc" },
  });
  const nextVersion = (lastSnapshot?.version ?? 0) + 1;

  const [snapshot] = await prisma.$transaction([
    prisma.deploymentSnapshot.create({
      data: {
        implantationId,
        version: nextVersion,
        payload: approvedPayload as Prisma.InputJsonValue,
        approvedBy,
      },
    }),
    prisma.implantation.update({
      where: { id: implantationId },
      data: { status: "APPROVED" },
    }),
  ]);

  // "Aprovar e iniciar implantação" é uma ação única: aprovar já dispara a automação.
  await deploymentService.startRun(implantationId, snapshot.id);

  return snapshot;
}

export const reviewService = { getReview, updateReviewResponses, approve };
