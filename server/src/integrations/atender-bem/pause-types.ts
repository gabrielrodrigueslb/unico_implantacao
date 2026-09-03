import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemPauseType } from "./atender-bem.types";

export interface CreatePauseTypeInput {
  text: string;
}

/**
 * `status=1&limit=500` — só motivos ativos (excluir é soft-delete: vira
 * `status:0` com o texto marcado " - Excluído", confirmado ao vivo). O
 * limite alto evita truncar numa instância com muitos motivos cadastrados,
 * mesmo padrão de `queues.listQueues`.
 */
export async function listPauseTypes(client: AtenderBemClient): Promise<AtenderBemPauseType[]> {
  return client.request<AtenderBemPauseType[]>("GET", "/reasons/?status=1&limit=500");
}

/**
 * A criação só aceita o nome — os demais campos (tempo máximo, vezes por
 * dia, ação) nascem com o default do Atender Bem e são ajustados no PUT
 * logo em seguida. Confirmado ao vivo: `POST /reasons` com só `{text}`.
 */
export async function createPauseType(
  client: AtenderBemClient,
  data: CreatePauseTypeInput,
): Promise<AtenderBemPauseType> {
  return client.request<AtenderBemPauseType>("POST", "/reasons", data);
}

/**
 * Diferente de tags/filas/usuários, `GET /reasons/` (lista) já devolve a
 * representação completa — confirmado comparando com o corpo aceito pelo
 * PUT ao vivo — então não precisa de um `getPauseType` à parte para montar
 * a base da atualização.
 */
export async function updatePauseType(
  client: AtenderBemClient,
  pauseTypeId: number,
  current: AtenderBemPauseType,
  patch: Partial<AtenderBemPauseType>,
): Promise<AtenderBemPauseType> {
  return client.request<AtenderBemPauseType>("PUT", `/reasons/${pauseTypeId}`, {
    ...current,
    ...patch,
  });
}
