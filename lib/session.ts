import jwt from "jsonwebtoken";

/**
 * Cookie de sessão do PAINEL (Next.js), separado do cookie que a API
 * (server/) seta na própria origem dela. O navegador nunca envia um cookie
 * de outra origem para o Next.js — sem este segundo cookie, nem o `proxy.ts`
 * nem os Server Components conseguiriam saber se o usuário está logado. Os
 * dois carregam o mesmo JWT, só duplicado por origem — ver
 * app/api/session/route.ts e features/auth/api.ts (login).
 */
export const SESSION_COOKIE_NAME = "unico_panel_session";

const JWT_SECRET = process.env.JWT_SECRET;

export interface SessionPayload {
  sub: string;
  role: "ADMIN" | "MEMBER";
}

/** `null` em vez de lançar — token ausente/expirado/adulterado é só "não autenticado". */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado no frontend (precisa ser igual ao do server/)");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !("sub" in decoded) || !("role" in decoded)) return null;
    return { sub: decoded.sub as string, role: decoded.role as SessionPayload["role"] };
  } catch {
    return null;
  }
}
