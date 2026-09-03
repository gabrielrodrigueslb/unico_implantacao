import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { authController } from "./auth.controller";

export const authRoutes = Router();

// Públicas — é aqui que a sessão nasce, não pode exigir a própria sessão.
authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.post("/logout", asyncHandler(authController.logout));

authRoutes.get("/me", requireAuth, asyncHandler(authController.me));
authRoutes.put("/me", requireAuth, asyncHandler(authController.updateMe));
