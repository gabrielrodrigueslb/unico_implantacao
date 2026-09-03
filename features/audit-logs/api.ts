import type { AuditLogsPage } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface FetchAuditLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
}

export async function fetchAuditLogs(
  params: FetchAuditLogsParams = {},
  headers?: HeadersInit,
): Promise<AuditLogsPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.action) query.set("action", params.action);

  const response = await fetch(`${API_BASE_URL}/audit-logs?${query}`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar os logs de auditoria");
  return response.json();
}

export async function fetchAuditLogActions(headers?: HeadersInit): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/audit-logs/actions`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar as ações de auditoria");
  return response.json();
}
