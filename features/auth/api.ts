import type { AdminUser } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Login roda em duas etapas porque o painel (Next.js) e a API (server/) são
 * origens diferentes: a chamada direto à API (com `credentials: "include"`)
 * faz o navegador guardar o cookie de sessão dela; o POST a `/api/session`
 * (mesma origem do painel) espelha o mesmo token num segundo cookie, que é
 * o único que o `proxy.ts` e os Server Components enxergam. Ver
 * lib/session.ts.
 */
export async function login(email: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível entrar"));
  }
  const { token, user } = await response.json();

  const sessionResponse = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!sessionResponse.ok) {
    throw new Error("Não foi possível iniciar a sessão do painel");
  }

  return user;
}

export async function logout(): Promise<void> {
  await Promise.all([
    fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }),
    fetch("/api/session", { method: "DELETE" }),
  ]);
}

export async function fetchMe(headers?: HeadersInit): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar o usuário logado");
  const { user } = await response.json();
  return user;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(data: UpdateProfileInput): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível salvar o perfil"));
  }
  const { user } = await response.json();
  return user;
}
