import { z } from "zod";
import { pauseTypes } from "../../integrations/atender-bem";
import type { Processor } from "./types";

// O onboarding só pergunta nome e duração — os demais campos que o Atender
// Bem exige (vezes por dia, ação ao estourar o tempo) nascem com um default
// razoável e podem ser ajustados depois direto no painel do cliente.
const DEFAULT_TIMES_PER_DAY = 1;
/** 1 = Alertar o supervisor; 0 = Bloquear o agente. Alertar é o padrão menos disruptivo. */
const DEFAULT_ACTION = 1;

const payloadSchema = z.object({
  team: z
    .object({
      usesPauseControl: z.boolean().default(false),
      pauseTypes: z
        .array(z.object({ name: z.string().min(1), durationMinutes: z.string().default("") }))
        .default([]),
    })
    .default({ usesPauseControl: false, pauseTypes: [] }),
});

export const createPauseTypesProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { team } = payloadSchema.parse(snapshotPayload);

  if (!team.usesPauseControl || team.pauseTypes.length === 0) {
    return { metadata: { pauseTypes: [] } };
  }

  // Idempotente por nome — sincroniza duração numa pausa já existente em vez
  // de só confirmar o id (mesmo motivo de tags/respostas rápidas: mudanças
  // depois do primeiro deploy precisam chegar na pausa real).
  const existing = await pauseTypes.listPauseTypes(client);
  const result: { name: string; id: number; created: boolean }[] = [];

  for (const pause of team.pauseTypes) {
    const maxtime = Number(pause.durationMinutes);
    const found = existing.find((candidate) => candidate.text === pause.name);

    if (found) {
      await pauseTypes.updatePauseType(client, found.id, found, {
        ...(Number.isFinite(maxtime) && maxtime > 0 ? { maxtime } : {}),
      });
      result.push({ name: pause.name, id: found.id, created: false });
      continue;
    }

    const created = await pauseTypes.createPauseType(client, { text: pause.name });
    const updated = await pauseTypes.updatePauseType(client, created.id, created, {
      timesperday: DEFAULT_TIMES_PER_DAY,
      action: DEFAULT_ACTION,
      ...(Number.isFinite(maxtime) && maxtime > 0 ? { maxtime } : {}),
    });
    result.push({ name: pause.name, id: updated.id, created: true });
  }

  return { metadata: { pauseTypes: result } };
};
