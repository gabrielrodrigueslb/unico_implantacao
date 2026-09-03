import { z } from "zod";
import { quickReplies } from "../../integrations/atender-bem";
import type { Processor } from "./types";

const payloadSchema = z.object({
  customization: z
    .object({
      quickReplies: z
        .array(
          z.object({
            shortcut: z.string().min(1),
            message: z.string().min(1),
            selected: z.boolean(),
          }),
        )
        .default([]),
    })
    .default({ quickReplies: [] }),
});

/**
 * O onboarding não coleta "grupos de acesso" (o Atender Bem exige pelo
 * menos a lista de accessgroups em cada resposta pré-definida). Sem uma
 * escolha do cliente, o default mais seguro é liberar para todos os grupos
 * já existentes na instância — o risco do extremo oposto (accessgroups
 * vazio) é a resposta ficar invisível para todo mundo.
 */
export const createQuickRepliesProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { customization } = payloadSchema.parse(snapshotPayload);
  const requested = customization.quickReplies.filter((reply) => reply.selected);

  if (requested.length === 0) {
    return { metadata: { quickReplies: [] } };
  }

  const [existing, allGroups] = await Promise.all([
    quickReplies.listQuickReplies(client),
    quickReplies.listAccessGroups(client),
  ]);
  const accessgroups = allGroups.map((group) => group.id);

  // Sincroniza o texto numa resposta já existente em vez de só confirmar o
  // id (mesmo motivo das etiquetas: editar a mensagem depois do primeiro
  // deploy precisa chegar na resposta real).
  const result: { title: string; id: number; created: boolean }[] = [];

  for (const reply of requested) {
    const found = existing.find((candidate) => candidate.title === reply.shortcut);

    if (found) {
      await quickReplies.updateQuickReply(client, found.id, { text: reply.message });
      result.push({ title: found.title, id: found.id, created: false });
      continue;
    }

    const created = await quickReplies.createQuickReply(client, {
      title: reply.shortcut,
      text: reply.message,
      accessgroups,
    });
    result.push({ title: created.title, id: created.id, created: true });
  }

  return { metadata: { quickReplies: result, accessgroups } };
};
