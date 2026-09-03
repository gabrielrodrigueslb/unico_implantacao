import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAdmin } from "../../middleware/auth.middleware";
import { auditLogController } from "./audit-log.controller";

export const auditLogRoutes = Router();

// Auditoria cruza dados de todo mundo — só ADMIN. A aba "Atividade" de uma
// implantação específica não usa esta rota (ver implantation.routes.ts:
// GET /implantations/:id/activity), então continua visível pra quem já
// pode ver aquela implantação.
auditLogRoutes.use(requireAdmin);

auditLogRoutes.get("/", asyncHandler(auditLogController.list));
auditLogRoutes.get("/actions", asyncHandler(auditLogController.listActions));
