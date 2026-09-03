import type { Request, Response } from "express";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../../lib/auth";
import { authService } from "./auth.service";
import { loginSchema, updateProfileSchema } from "./auth.schema";

async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const { token, user } = await authService.login(data);
  res.cookie(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  // O token também vai no corpo (além do cookie httpOnly desta API) porque o
  // painel Next.js roda em outra origem e precisa dele para montar sua
  // própria sessão (ver app/api/session/route.ts no frontend) — sem isso,
  // nem o middleware de proteção de rota nem as páginas renderizadas no
  // servidor conseguem enxergar o cookie desta API.
  return res.json({ token, user });
}

async function logout(_req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { ...SESSION_COOKIE_OPTIONS, maxAge: undefined });
  return res.status(204).send();
}

async function me(req: Request, res: Response) {
  return res.json({ user: req.user });
}

async function updateMe(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user!.id, data);
  return res.json({ user });
}

export const authController = { login, logout, me, updateMe };
