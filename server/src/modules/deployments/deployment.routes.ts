import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { deploymentController } from "./deployment.controller";

export const deploymentRoutes = Router();

deploymentRoutes.get(
  "/:implantationId",
  asyncHandler(deploymentController.getLatest),
);
deploymentRoutes.post(
  "/:implantationId/jobs/:type/retry",
  asyncHandler(deploymentController.retryJob),
);
