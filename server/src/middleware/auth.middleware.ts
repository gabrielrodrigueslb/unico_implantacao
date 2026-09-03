import type { NextFunction, Request, Response } from "express";
import type { AdminUser } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Preenchido por `requireAuth` — nunca inclui `passwordHash`. */
      user?: Omit<AdminUser, "passwordHash">;
    }
  }
}

/**
 * Exige uma sessão válida. Recarrega o usuário do banco a cada request (em
 * vez de confiar só no payload do JWT) para que desativar/apagar um
 * AdminUser derrube o acesso imediatamente, sem precisar de uma tabela de
 * sessões revogáveis à parte.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    // Cookie — chamadas vindas direto do navegador (a maioria). Header
    // Authorization — chamadas servidor-a-servidor do Next.js (Server
    // Components), que não têm acesso ao cookie desta API por ser de outra
    // origem; ver lib/server-session.ts no frontend.
    const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const token = req.cookies?.[SESSION_COOKIE_NAME] ?? bearer;
    const payload = token ? verifySessionToken(token) : null;
    if (!payload) throw new UnauthorizedError();

    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) throw new UnauthorizedError();

    const { passwordHash: _passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    next(err);
  }
}

/** Usar sempre depois de `requireAuth` na cadeia de middlewares. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") throw new ForbiddenError();
  next();
}
