import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { onboardingController } from "./onboarding.controller";

export const onboardingRoutes = Router();

onboardingRoutes.get("/:token", asyncHandler(onboardingController.getByToken));
onboardingRoutes.put("/:token", asyncHandler(onboardingController.saveProgress));
onboardingRoutes.post(
  "/:token/submit",
  asyncHandler(onboardingController.submit),
);
