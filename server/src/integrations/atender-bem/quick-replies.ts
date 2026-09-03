import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemAccessGroup, AtenderBemPredefinedText } from "./atender-bem.types";

export interface CreatePredefinedTextInput {
  title: string;
  text: string;
  accessgroups: number[];
}

export async function listQuickReplies(
  client: AtenderBemClient,
): Promise<AtenderBemPredefinedText[]> {
  return client.request<AtenderBemPredefinedText[]>("GET", "/predefinedtexts/textItens");
}

export async function listAccessGroups(client: AtenderBemClient): Promise<AtenderBemAccessGroup[]> {
  return client.request<AtenderBemAccessGroup[]>("GET", "/contactsgroups/getGroups");
}

export async function createQuickReply(
  client: AtenderBemClient,
  data: CreatePredefinedTextInput,
): Promise<AtenderBemPredefinedText> {
  return client.request<AtenderBemPredefinedText>("POST", "/predefinedtexts", {
    buttons: [],
    ...data,
  });
}

/**
 * `GET /predefinedtexts/textItens` (lista) não devolve `description`,
 * `priority`, `sendtopbx` nem `pbxname` — campos presentes em
 * `GET /predefinedtexts/:id`. Sem essa correção, todo `updateQuickReply`
 * (ex.: reprocessamento só mudando o texto) apagava silenciosamente a config
 * de "enviar para o PBX" e o nome do PBX da resposta rápida. Usar sempre
 * `getQuickReply` para montar a base de um PUT, nunca `listQuickReplies` +
 * `find`.
 */
export async function getQuickReply(
  client: AtenderBemClient,
  textId: number,
): Promise<AtenderBemPredefinedText> {
  return client.request<AtenderBemPredefinedText>("GET", `/predefinedtexts/${textId}`);
}

export async function updateQuickReply(
  client: AtenderBemClient,
  textId: number,
  patch: Partial<AtenderBemPredefinedText>,
): Promise<AtenderBemPredefinedText> {
  const current = await getQuickReply(client, textId);

  return client.request<AtenderBemPredefinedText>("PUT", `/predefinedtexts/${textId}`, {
    ...current,
    ...patch,
  });
}

/** Destrutivo — o mapa de endpoints exige confirmação humana antes de chamar. */
export async function deleteQuickReply(client: AtenderBemClient, textId: number): Promise<void> {
  await client.request("DELETE", `/predefinedtexts/${textId}`);
}
