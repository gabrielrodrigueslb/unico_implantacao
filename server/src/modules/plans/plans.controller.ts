import type { Request, Response } from "express";
import { plansService } from "./plans.service";

async function list(_req: Request, res: Response) {
  const plans = await plansService.list();
  return res.json(plans);
}

export const plansController = { list };
