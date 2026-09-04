import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ForbiddenError } from "../lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originFromHeader(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * O cookie de sessão desta API é `SameSite=None` de propósito (painel e API
 * rodam em origens diferentes — ver SESSION_COOKIE_OPTIONS em lib/auth.ts),
 * o que o torna anexável por qualquer site em requisições "simples" (sem
 * preflight de CORS). O CORS por si só só impede a LEITURA da resposta por
 * JS de outra origem, não o disparo da requisição — por isso todo método
 * que muda estado exige aqui que o `Origin` (ou, na ausência dele, o
 * `Referer`) bata exatamente com FRONTEND_URL antes de chegar nas rotas.
 * Requisições legítimas do painel sempre mandam `Origin` (é fetch
 * cross-origin), então isso não afeta o uso normal.
 */
export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const trusted = originFromHeader(env.FRONTEND_URL);
  const origin = originFromHeader(req.headers.origin) ?? originFromHeader(req.headers.referer);

  if (!trusted || !origin || origin !== trusted) {
    throw new ForbiddenError("Origem da requisição não confiável");
  }

  next();
}
