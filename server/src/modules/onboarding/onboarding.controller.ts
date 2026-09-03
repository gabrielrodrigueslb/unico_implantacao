import type { Request, Response } from "express";
import { onboardingService } from "./onboarding.service";
import { saveOnboardingSchema } from "./onboarding.schema";

async function getByToken(req: Request, res: Response) {
  const onboarding = await onboardingService.getByToken(req.params.token);
  return res.json(onboarding);
}

async function saveProgress(req: Request, res: Response) {
  const data = saveOnboardingSchema.parse(req.body);
  const onboarding = await onboardingService.saveProgress(req.params.token, data);
  return res.json(onboarding);
}

async function submit(req: Request, res: Response) {
  const onboarding = await onboardingService.submit(req.params.token);
  return res.json(onboarding);
}

export const onboardingController = { getByToken, saveProgress, submit };
