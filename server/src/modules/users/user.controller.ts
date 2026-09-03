import type { Request, Response } from "express";
import { userService } from "./user.service";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "./user.schema";

async function list(_req: Request, res: Response) {
  const users = await userService.list();
  return res.json(users);
}

async function create(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);
  const user = await userService.create(data);
  return res.status(201).json(user);
}

async function update(req: Request, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, data);
  return res.json(user);
}

async function resetPassword(req: Request, res: Response) {
  const data = resetPasswordSchema.parse(req.body);
  const user = await userService.resetPassword(req.params.id, data);
  return res.json(user);
}

async function remove(req: Request, res: Response) {
  await userService.remove(req.params.id, req.user!.id);
  return res.status(204).send();
}

export const userController = { list, create, update, resetPassword, remove };
