import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AdminRole } from "@prisma/client";

/** Nome do cookie de sessão do painel administrativo. */
export const SESSION_COOKIE_NAME = "unico_admin_session";

/** 7 dias — condizente com um painel interno de baixo risco (não é o login do cliente). */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  sub: string;
  role: AdminRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

/** `null` em vez de lançar — token ausente/expirado/adulterado é só "não autenticado". */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !("sub" in decoded) || !("role" in decoded)) return null;
    return { sub: decoded.sub as string, role: decoded.role as AdminRole };
  } catch {
    return null;
  }
}

/**
 * `SameSite=None` + `Secure` — o painel (Next.js) e esta API rodam em
 * origens diferentes (portas diferentes já contam como origens diferentes),
 * então o cookie é sempre cross-site. `Secure` exige HTTPS, mas navegadores
 * tratam `http://localhost` como contexto seguro, então funciona em dev.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: SESSION_TTL_SECONDS * 1000,
  path: "/",
};
