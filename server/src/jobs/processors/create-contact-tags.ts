import { z } from "zod";
import { tags } from "../../integrations/atender-bem";
import type { Processor } from "./types";

// Cor aplicada às etiquetas que o cliente digitou do zero (sem vir de um
// pacote de segmento, que já traz bgcolor/fgcolor reais do Atender Bem).
const DEFAULT_BG_COLOR = "#2563EB";
const DEFAULT_FG_COLOR = "#FFFFFF";

const payloadSchema = z.object({
  customization: z
    .object({
      contactTags: z
        .array(
          z.object({
            name: z.string().min(1),
            enabled: z.boolean(),
            bgcolor: z.string().optional(),
            fgcolor: z.string().optional(),
          }),
        )
        .default([]),
    })
    .default({ contactTags: [] }),
});

export const createContactTagsProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { customization } = payloadSchema.parse(snapshotPayload);
  const requested = customization.contactTags.filter((tag) => tag.enabled);

  if (requested.length === 0) {
    return { metadata: { contactTags: [] } };
  }

  // Idempotente por nome — e sincroniza cor numa etiqueta já existente em
  // vez de só confirmar o id (senão uma cor trocada depois do primeiro
  // deploy nunca chegava na etiqueta real).
  const existing = await tags.listContactTags(client);
  const result: { name: string; id: number; created: boolean }[] = [];

  for (const tag of requested) {
    const bgcolor = tag.bgcolor ?? DEFAULT_BG_COLOR;
    const fgcolor = tag.fgcolor ?? DEFAULT_FG_COLOR;
    const found = existing.find((candidate) => candidate.name === tag.name);

    if (found) {
      await tags.updateContactTag(client, found.id, { bgcolor, fgcolor });
      result.push({ name: found.name, id: found.id, created: false });
      continue;
    }

    const created = await tags.createContactTag(client, { name: tag.name, bgcolor, fgcolor });
    result.push({ name: created.name, id: created.id, created: true });
  }

  return { metadata: { contactTags: result } };
};
