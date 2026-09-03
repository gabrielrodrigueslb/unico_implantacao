import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemIvr } from "./atender-bem.types";

export interface CreateIvrInput extends Partial<AtenderBemIvr> {
  name: string;
}

export async function listIvrs(client: AtenderBemClient): Promise<AtenderBemIvr[]> {
  return client.request<AtenderBemIvr[]>("GET", "/ivrs/getResumedList");
}

export async function getIvr(client: AtenderBemClient, ivrId: number): Promise<AtenderBemIvr> {
  return client.request<AtenderBemIvr>("GET", `/ivrs/${ivrId}`);
}

export async function createIvr(
  client: AtenderBemClient,
  data: CreateIvrInput,
): Promise<AtenderBemIvr> {
  return client.request<AtenderBemIvr>("POST", "/ivrs/", {
    type: 1,
    initialtext: "node_1",
    options: "[]",
    timeout: 300,
    buttons: "[]",
    ...data,
  });
}

/**
 * Lê o fluxo completo e reenvia com o patch aplicado — nunca só os nós
 * alterados. Diferente de POST/GET, `PUT /ivrs/:id` devolve o objeto
 * atualizado dentro de um array (`[{...}]`) — confirmado direto na
 * instância de testes — por isso desembrulha aqui em vez de devolver a
 * resposta crua (senão `savedIvr.id` sai `undefined`).
 */
export async function updateIvr(
  client: AtenderBemClient,
  ivrId: number,
  patch: Partial<AtenderBemIvr>,
): Promise<AtenderBemIvr> {
  const current = await getIvr(client, ivrId);

  const response = await client.request<AtenderBemIvr[]>("PUT", `/ivrs/${ivrId}`, {
    ...current,
    ...patch,
  });

  return response[0];
}
