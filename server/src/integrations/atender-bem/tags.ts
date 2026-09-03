import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemChatTag, AtenderBemContactTag } from "./atender-bem.types";

export interface CreateContactTagInput {
  name: string;
  bgcolor: string;
  fgcolor: string;
}

export interface CreateChatTagInput {
  name: string;
  color: string;
  description?: string;
  marker?: string;
}

export async function listContactTags(client: AtenderBemClient): Promise<AtenderBemContactTag[]> {
  return client.request<AtenderBemContactTag[]>("GET", "/tags/");
}

export async function createContactTag(
  client: AtenderBemClient,
  data: CreateContactTagInput,
): Promise<AtenderBemContactTag> {
  return client.request<AtenderBemContactTag>("POST", "/tags/", {
    contacttag: 1,
    faqtag: 0,
    dealtag: 0,
    tasktag: 0,
    tickettag: 0,
    ...data,
  });
}

/**
 * `GET /tags/` (lista) devolve um subconjunto de campos — falta `lastbisync`,
 * por exemplo. `GET /tags/:id` devolve a representação completa. Usar sempre
 * este para montar a base de um PUT, nunca `listContactTags` + `find`.
 */
export async function getContactTag(
  client: AtenderBemClient,
  tagId: number,
): Promise<AtenderBemContactTag> {
  return client.request<AtenderBemContactTag>("GET", `/tags/${tagId}`);
}

export async function updateContactTag(
  client: AtenderBemClient,
  tagId: number,
  patch: Partial<AtenderBemContactTag>,
): Promise<AtenderBemContactTag> {
  const current = await getContactTag(client, tagId);

  return client.request<AtenderBemContactTag>("PUT", `/tags/${tagId}`, {
    ...current,
    ...patch,
  });
}

/** Destrutivo — o mapa de endpoints exige confirmação humana antes de chamar. */
export async function deleteContactTag(client: AtenderBemClient, tagId: number): Promise<void> {
  await client.request("DELETE", `/tags/${tagId}`);
}

export async function listChatTags(client: AtenderBemClient): Promise<AtenderBemChatTag[]> {
  return client.request<AtenderBemChatTag[]>("GET", `/chattags/getChatTags?t=${Date.now()}`);
}

export async function createChatTag(
  client: AtenderBemClient,
  data: CreateChatTagInput,
): Promise<AtenderBemChatTag> {
  return client.request<AtenderBemChatTag>("POST", "/chattags/", {
    priority: 0,
    fk_automation: 0,
    description: "",
    marker: "🏷️",
    ...data,
  });
}

/**
 * `GET /chattags/getChatTags` (lista) não devolve `reexecuteoninit` nem
 * `lastbisync` — campos presentes em `GET /chattags/:id`. Sem essa correção,
 * todo `updateChatTag` (ex.: reprocessamento mudando cor/descrição) apagava
 * silenciosamente a config de "reexecutar automação ao iniciar" da etiqueta.
 * Usar sempre `getChatTag` para montar a base de um PUT, nunca
 * `listChatTags` + `find`.
 */
export async function getChatTag(
  client: AtenderBemClient,
  chatTagId: number,
): Promise<AtenderBemChatTag> {
  return client.request<AtenderBemChatTag>("GET", `/chattags/${chatTagId}`);
}

export async function updateChatTag(
  client: AtenderBemClient,
  chatTagId: number,
  patch: Partial<AtenderBemChatTag>,
): Promise<AtenderBemChatTag> {
  const current = await getChatTag(client, chatTagId);

  return client.request<AtenderBemChatTag>("PUT", `/chattags/${chatTagId}`, {
    ...current,
    ...patch,
  });
}

/** Destrutivo — o mapa de endpoints exige confirmação humana antes de chamar. */
export async function deleteChatTag(client: AtenderBemClient, chatTagId: number): Promise<void> {
  await client.request("DELETE", `/chattags/${chatTagId}`);
}
