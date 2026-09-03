import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemUser } from "./atender-bem.types";

export interface CreateUserInput {
  username: string;
  fullname: string;
  password: string;
  /** 0 = administrador, 1 = supervisor, 2 = agente. */
  type: 0 | 1 | 2;
  /** Ramal (sipuser) — obrigatório para administrador e supervisor (ver docs/atenderbem-endpoints.md). */
  sipuser?: string;
}

/**
 * Perfil operacional padrão para contas provisionadas pela implantação.
 *
 * Estes campos foram confirmados no formulário de permissões do AtenderBem
 * e no `PUT /users/:id`. Mantê-los centralizados garante que tanto uma conta
 * nova quanto uma conta já existente recebam exatamente o mesmo conjunto de
 * permissões necessário para operar chats e filas.
 */
export const OPERATIONAL_USER_DEFAULTS = {
  status: 1,
  chatenabled: 1,
  tasksenabled: 1,
  autologin: 1,
  canrequestaisummary: 1,
  ignorelimitsforblockedchats: 1,
  canreopenchat: 1,
  canreopenotherschat: 1,
  canopennewchat: 1,
  canuseinternalchat: 1,
} as const;

/**
 * `GET /users/getUsers` devolve os campos em camelCase (`userName`,
 * `fullName`) — inconsistente com o resto da API, que usa minúsculo
 * (`username`/`fullname`, tanto no `POST /users` quanto no usuário embutido
 * dentro de uma fila). Normalizamos aqui para minúsculo em todo lugar,
 * senão a checagem de idempotência (achar usuário existente por username)
 * nunca bate.
 */
function normalizeListedUser(raw: Record<string, unknown>): AtenderBemUser {
  const { userName, fullName, ...rest } = raw;

  return {
    ...rest,
    id: raw.id as number,
    username: (raw.username as string) ?? (userName as string) ?? "",
    fullname: (raw.fullname as string) ?? (fullName as string) ?? "",
    type: raw.type as number,
  } as AtenderBemUser;
}

export async function listUsers(client: AtenderBemClient): Promise<AtenderBemUser[]> {
  // /users/getUsers é a leitura confirmada; /users sozinho ainda não tem
  // verbo/contrato capturado.
  const raw = await client.request<Record<string, unknown>[]>(
    "GET",
    `/users/getUsers?t=${Date.now()}`,
  );
  return raw.map(normalizeListedUser);
}

export async function createUser(
  client: AtenderBemClient,
  data: CreateUserInput,
): Promise<AtenderBemUser> {
  return client.request<AtenderBemUser>("POST", "/users", {
    sipuser: "",
    sippass: "",
    changepass: 0,
    showscoreondashboard: 0,
    botkey: "",
    ...OPERATIONAL_USER_DEFAULTS,
    ...data,
  });
}

/**
 * Lê um usuário específico. Confirmado direto na instância de testes:
 * `GET /users/getUsers` (lista) devolve um formato reduzido e incompatível
 * com o que a escrita espera (sem `sipuser`/`status`/`queues` etc.) —
 * `GET /users/:id` é que devolve a representação completa. Usar sempre este
 * para montar a base de um PUT, nunca `listUsers` + `find`.
 */
export async function getUser(client: AtenderBemClient, userId: number): Promise<AtenderBemUser> {
  return client.request<AtenderBemUser>("GET", `/users/${userId}`);
}

/** Lê o usuário atual e reenvia a representação completa com o patch aplicado. */
export async function updateUser(
  client: AtenderBemClient,
  userId: number,
  patch: Partial<AtenderBemUser>,
): Promise<AtenderBemUser> {
  const current = await getUser(client, userId);

  return client.request<AtenderBemUser>("PUT", `/users/${userId}`, {
    ...current,
    ...patch,
  });
}
