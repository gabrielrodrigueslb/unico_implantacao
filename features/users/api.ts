import type { AdminRole, AdminUser } from "@/features/auth/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: AdminRole;
  active?: boolean;
}

/** `headers` só é passado nas leituras feitas em Server Components (ver lib/server-session.ts). */
export async function fetchUsers(headers?: HeadersInit): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar os usuários");
  return response.json();
}

export async function createUser(data: CreateUserInput): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível criar o usuário"));
  }
  return response.json();
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível atualizar o usuário"));
  }
  return response.json();
}

export async function resetUserPassword(id: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível redefinir a senha"));
  }
  return response.json();
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Não foi possível remover o usuário"));
  }
}
