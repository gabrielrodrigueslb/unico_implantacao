import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware";
import { userController } from "./user.controller";

export const userRoutes = Router();

userRoutes.use(requireAuth);

// Listar é liberado pra qualquer sessão autenticada — é o que alimenta o
// seletor de "implantador" na tela de implantação, que qualquer um usa. As
// ações que de fato mudam uma conta continuam só pra ADMIN (ver AdminRole
// em schema.prisma).
userRoutes.get("/", asyncHandler(userController.list));

userRoutes.post("/", requireAdmin, asyncHandler(userController.create));
userRoutes.put("/:id", requireAdmin, asyncHandler(userController.update));
userRoutes.post("/:id/reset-password", requireAdmin, asyncHandler(userController.resetPassword));
userRoutes.delete("/:id", requireAdmin, asyncHandler(userController.remove));
