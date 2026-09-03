import type { Request, Response } from "express";
import { implantationService } from "./implantation.service";
import {
  createImplantationSchema,
  listImplantationsQuerySchema,
  updateImplantationSchema,
} from "./implantation.schema";
import { onboardingService } from "../onboarding/onboarding.service";
import { contactImportService } from "../onboarding/contact-import.service";

async function create(req: Request, res: Response) {
  const data = createImplantationSchema.parse(req.body);
  const implantation = await implantationService.create(data, req.user!);
  return res.status(201).json(implantation);
}

async function list(req: Request, res: Response) {
  const query = listImplantationsQuerySchema.parse(req.query);
  const result = await implantationService.list(query, req.user!);
  return res.json(result);
}

async function stats(_req: Request, res: Response) {
  const result = await implantationService.stats(_req.user!);
  return res.json(result);
}

async function getById(req: Request, res: Response) {
  const implantation = await implantationService.getById(req.params.id, req.user!);
  return res.json(implantation);
}

async function update(req: Request, res: Response) {
  const data = updateImplantationSchema.parse(req.body);
  const implantation = await implantationService.update(req.params.id, data, req.user!);
  return res.json(implantation);
}

async function cancel(req: Request, res: Response) {
  const implantation = await implantationService.cancel(req.params.id, req.user!);
  return res.json(implantation);
}

async function rotateOnboardingToken(req: Request, res: Response) {
  await implantationService.getById(req.params.id, req.user!);
  const token = await onboardingService.rotateToken(req.params.id);
  return res.json(token);
}

async function activity(req: Request, res: Response) {
  const events = await implantationService.activity(req.params.id, req.user!);
  return res.json(events);
}

async function contactImport(req: Request, res: Response) {
  await implantationService.getById(req.params.id, req.user!);
  return res.json(await contactImportService.getByImplantation(req.params.id));
}

async function downloadContactImport(req: Request, res: Response) {
  await implantationService.getById(req.params.id, req.user!);
  const file = await contactImportService.downloadByImplantation(req.params.id);
  return res.download(file.filePath, file.originalName, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}

export const implantationController = {
  create,
  list,
  stats,
  getById,
  update,
  cancel,
  rotateOnboardingToken,
  activity,
  contactImport,
  downloadContactImport,
};
