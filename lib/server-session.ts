import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";

/** Lê e valida a sessão a partir do cookie do painel (Server Components, layouts, Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Cabeçalho para repassar a sessão do painel em chamadas servidor-a-servidor
 * para a API (server/) — o cookie desta função é de outra origem, então a
 * API só o vê como um `Authorization: Bearer` (ver requireAuth no server).
 * Objeto vazio se não houver sessão: as rotas da API continuam recusando
 * (401) normalmente, só sem quebrar o `fetch`.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
