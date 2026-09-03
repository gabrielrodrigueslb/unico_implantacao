import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware";
import { userController } from "./user.controller";

export const userRoutes = Router();

// CRUD de contas do painel administrativo — só ADMIN gerencia outros
// usuários (ver AdminRole em schema.prisma).
userRoutes.use(requireAuth, requireAdmin);

userRoutes.get("/", asyncHandler(userController.list));
userRoutes.post("/", asyncHandler(userController.create));
userRoutes.put("/:id", asyncHandler(userController.update));
userRoutes.post("/:id/reset-password", asyncHandler(userController.resetPassword));
userRoutes.delete("/:id", asyncHandler(userController.remove));
