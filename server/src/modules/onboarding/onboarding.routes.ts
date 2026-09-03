import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { onboardingController } from "./onboarding.controller";
import { uploadContactCsv } from "./contact-import.service";

export const onboardingRoutes = Router();

onboardingRoutes.get("/:token", asyncHandler(onboardingController.getByToken));
onboardingRoutes.put("/:token", asyncHandler(onboardingController.saveProgress));
onboardingRoutes.post(
  "/:token/contact-import",
  uploadContactCsv,
  asyncHandler(onboardingController.uploadContactImport),
);
onboardingRoutes.post(
  "/:token/submit",
  asyncHandler(onboardingController.submit),
);
