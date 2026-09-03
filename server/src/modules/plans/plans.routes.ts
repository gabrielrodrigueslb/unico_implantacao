import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { plansController } from "./plans.controller";

export const plansRoutes = Router();

// GET /plans — lista os planos do Atender Bem (id, limites de usuário por
// tipo, preço). Usado hoje via API para escolher o planId ao criar uma
// implantação; vai alimentar um select quando o painel de admin existir.
plansRoutes.get("/", asyncHandler(plansController.list));
