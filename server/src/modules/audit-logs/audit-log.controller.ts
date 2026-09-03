import type { Request, Response } from "express";
import { auditLogService } from "./audit-log.service";
import { listAuditLogsQuerySchema } from "./audit-log.schema";

async function list(req: Request, res: Response) {
  const query = listAuditLogsQuerySchema.parse(req.query);
  const result = await auditLogService.list(query);
  return res.json(result);
}

async function listActions(_req: Request, res: Response) {
  const actions = await auditLogService.listDistinctActions();
  return res.json(actions);
}

export const auditLogController = { list, listActions };
