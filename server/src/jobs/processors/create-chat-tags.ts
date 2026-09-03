import { z } from "zod";
import { tags } from "../../integrations/atender-bem";
import type { Processor } from "./types";

// Aplicado às etiquetas que o cliente digitou do zero (sem vir de um pacote
// de segmento, que já traz color/marker reais do Atender Bem).
const DEFAULT_COLOR = "#2563EB-#FFFFFF-#2563EB";
const DEFAULT_MARKER = "🏷️";

const payloadSchema = z.object({
  customization: z
    .object({
      chatTags: z
        .array(
          z.object({
            name: z.string().min(1),
            enabled: z.boolean(),
            color: z.string().optional(),
            marker: z.string().optional(),
            description: z.string().optional(),
          }),
        )
        .default([]),
    })
    .default({ chatTags: [] }),
});

export const createChatTagsProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { customization } = payloadSchema.parse(snapshotPayload);
  const requested = customization.chatTags.filter((tag) => tag.enabled);

  if (requested.length === 0) {
    return { metadata: { chatTags: [] } };
  }

  // Sincroniza cor/marcador/descrição numa etiqueta já existente em vez de
  // só confirmar o id (mesmo motivo do contact tags: mudanças depois do
  // primeiro deploy precisam chegar na etiqueta real).
  const existing = await tags.listChatTags(client);
  const result: { name: string; id: number; created: boolean }[] = [];

  for (const tag of requested) {
    const color = tag.color ?? DEFAULT_COLOR;
    const marker = tag.marker ?? DEFAULT_MARKER;
    const description = tag.description ?? "";
    const found = existing.find((candidate) => candidate.name === tag.name);

    if (found) {
      await tags.updateChatTag(client, found.id, { color, marker, description });
      result.push({ name: found.name, id: found.id, created: false });
      continue;
    }

    const created = await tags.createChatTag(client, { name: tag.name, color, marker, description });
    result.push({ name: created.name, id: created.id, created: true });
  }

  return { metadata: { chatTags: result } };
};
