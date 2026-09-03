import type { Request, Response } from "express";
import { AppError } from "../../lib/errors";
import { deploymentService } from "./deployment.service";
import { DEPLOYMENT_JOB_TYPES, type DeploymentJobType } from "./deployment.types";

async function getLatest(req: Request, res: Response) {
  const run = await deploymentService.getLatestRun(req.params.implantationId, req.user!);
  return res.json(run);
}

async function retryJob(req: Request, res: Response) {
  const type = req.params.type as DeploymentJobType;

  if (!DEPLOYMENT_JOB_TYPES.includes(type)) {
    throw new AppError("Tipo de etapa inválido", 400);
  }

  const job = await deploymentService.retryJob(req.params.implantationId, type, req.user!);
  return res.json(job);
}

export const deploymentController = { getLatest, retryJob };
