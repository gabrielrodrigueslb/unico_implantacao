import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { defaults, queues, ura } from "../../integrations/atender-bem";
import type { Processor } from "./types";

const dayHoursSchema = z.object({
  enabled: z.boolean().default(false),
  start: z.string().default("08:00"),
  end: z.string().default("18:00"),
});
type DayHours = z.infer<typeof dayHoursSchema>;

const queueSchema = z.object({
  name: z.string().min(1),
  offHoursMessage: z.string().default(""),
  waitingMessage: z.string().default(""),
  weekdayHours: dayHoursSchema,
  saturdayHours: dayHoursSchema,
  sundayHolidayHours: dayHoursSchema,
});
type QueueInput = z.infer<typeof queueSchema>;

const payloadSchema = z.object({
  service: z.object({ queues: z.array(queueSchema).default([]) }).default({ queues: [] }),
});

interface QueueJobMetadata {
  queues?: { name: string; id: number }[];
}

function parseTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map((part) => Number(part));
  return { hour: Number.isFinite(hour) ? hour : 0, minute: Number.isFinite(minute) ? minute : 0 };
}

// Ids fixos do template "Boas Vindas Básico" (ver defaults) — estáveis
// porque o template nunca muda; derivados uma única vez no load do módulo.
const TEMPLATE = defaults.IVR_TEMPLATES.boasVindasBasico;
const GREETING_NODE_ID = defaults.BOAS_VINDAS_BASICO_GREETING_NODE_ID;
const HOURS_NODE_ID = TEMPLATE.initialtext;
const HOURS_NODE_DEF = TEMPLATE.options.find((node) => node.id === HOURS_NODE_ID);
const LABEL_NODE_ID = HOURS_NODE_DEF?.out;
const GREETING_NODE_DEF = TEMPLATE.options.find((node) => node.id === GREETING_NODE_ID);
const END_NODE_ID = GREETING_NODE_DEF?.out;

if (!HOURS_NODE_DEF || !LABEL_NODE_ID || !GREETING_NODE_DEF || !END_NODE_ID) {
  throw new Error(
    "Template padrão de URA não tem os nós esperados — verifique defaults/ivr-boas-vindas-basico.json",
  );
}

interface LiveIvrNode {
  id: string;
  type: number;
  x?: number;
  y?: number;
  info?: string;
  configured?: boolean;
  config: Record<string, unknown>;
}

/**
 * `PUT /ivrs/:id` (confirmado direto na instância de testes) espera o
 * schema JÁ MIGRADO que o próprio Atender Bem usa internamente — diferente
 * do schema legado do nosso template (`config.times[]`, `out` no nível do
 * nó). Só `POST /ivrs/` faz essa migração automática na criação. Por isso
 * criar e atualizar usam schemas diferentes aqui:
 *   - criar: schema legado do template (POST migra sozinho)
 *   - atualizar: schema atual, mutando os nós já migrados de uma criação
 *     anterior (`config.nextElementId`, `config.options[]` com campos em
 *     camelCase)
 */
function buildTimeWindowLive(
  weekdayBegin: number,
  weekdayEnd: number,
  hours: DayHours,
  nextElementId: string,
) {
  const begin = parseTime(hours.start);
  const end = parseTime(hours.end);

  return {
    id: randomUUID(),
    type: 0,
    specificDate: new Date().toISOString(),
    weekDayBegin: weekdayBegin,
    weekDayEnd: weekdayEnd,
    hourBegin: begin.hour,
    minuteBegin: begin.minute,
    hourEnd: end.hour,
    minuteEnd: end.minute,
    nextElementId,
  };
}

function applyQueueToLiveOptions(options: LiveIvrNode[], queue: QueueInput): void {
  const greetingNode = options.find((n) => n.id === GREETING_NODE_ID);
  const hoursNode = options.find((n) => n.id === HOURS_NODE_ID);
  const labelNode = options.find((n) => n.id === LABEL_NODE_ID);

  if (!greetingNode || !hoursNode || !labelNode) {
    throw new Error(
      "URA existente não tem os nós esperados do template padrão — pode ter sido editada manualmente fora do fluxo original",
    );
  }

  greetingNode.config.text = queue.waitingMessage.trim() || greetingNode.config.text;

  const windows: ReturnType<typeof buildTimeWindowLive>[] = [];
  if (queue.weekdayHours.enabled) {
    windows.push(buildTimeWindowLive(1, 5, queue.weekdayHours, GREETING_NODE_ID));
  }
  if (queue.saturdayHours.enabled) {
    windows.push(buildTimeWindowLive(6, 6, queue.saturdayHours, GREETING_NODE_ID));
  }
  if (queue.sundayHolidayHours.enabled) {
    windows.push(buildTimeWindowLive(0, 0, queue.sundayHolidayHours, GREETING_NODE_ID));
  }
  hoursNode.config.options = windows;

  const offHoursMessage = queue.offHoursMessage.trim();
  const currentTarget = labelNode.config.nextElementId as string | undefined;
  const existingMessageNode =
    currentTarget && currentTarget !== END_NODE_ID
      ? options.find((n) => n.id === currentTarget)
      : undefined;

  if (offHoursMessage) {
    if (existingMessageNode) {
      existingMessageNode.config.text = offHoursMessage;
    } else {
      const newNode: LiveIvrNode = {
        id: randomUUID(),
        type: 0,
        x: labelNode.x ?? 0,
        y: (labelNode.y ?? 0) + 100,
        info: "",
        configured: true,
        config: { nextElementId: END_NODE_ID, text: offHoursMessage, fileChooseType: 0, fileId: "" },
      };
      labelNode.config.nextElementId = newNode.id;
      options.push(newNode);
    }
  } else {
    // Sem mensagem fora do horário: encerra direto, sem nó de texto extra.
    labelNode.config.nextElementId = END_NODE_ID;
  }
}

/** Só usado na criação — o template legado inteiro, que `POST /ivrs/` migra sozinho. */
function buildCreatePayload(queue: QueueInput) {
  const template = structuredClone(TEMPLATE);

  const greetingNode = template.options.find((node) => node.id === GREETING_NODE_ID)!;
  const hoursNode = template.options.find((node) => node.id === HOURS_NODE_ID)!;
  const labelNode = template.options.find((node) => node.id === LABEL_NODE_ID)!;

  greetingNode.config.text = queue.waitingMessage.trim() || greetingNode.config.text;

  const windows = [];
  if (queue.weekdayHours.enabled) {
    windows.push({
      id: randomUUID(),
      type: 0,
      date: new Date().toISOString(),
      weekdaybegin: 1,
      weekdayend: 5,
      hourbegin: parseTime(queue.weekdayHours.start).hour,
      minutebegin: parseTime(queue.weekdayHours.start).minute,
      hourend: parseTime(queue.weekdayHours.end).hour,
      minuteend: parseTime(queue.weekdayHours.end).minute,
      out: GREETING_NODE_ID,
    });
  }
  if (queue.saturdayHours.enabled) {
    windows.push({
      id: randomUUID(),
      type: 0,
      date: new Date().toISOString(),
      weekdaybegin: 6,
      weekdayend: 6,
      hourbegin: parseTime(queue.saturdayHours.start).hour,
      minutebegin: parseTime(queue.saturdayHours.start).minute,
      hourend: parseTime(queue.saturdayHours.end).hour,
      minuteend: parseTime(queue.saturdayHours.end).minute,
      out: GREETING_NODE_ID,
    });
  }
  if (queue.sundayHolidayHours.enabled) {
    windows.push({
      id: randomUUID(),
      type: 0,
      date: new Date().toISOString(),
      weekdaybegin: 0,
      weekdayend: 0,
      hourbegin: parseTime(queue.sundayHolidayHours.start).hour,
      minutebegin: parseTime(queue.sundayHolidayHours.start).minute,
      hourend: parseTime(queue.sundayHolidayHours.end).hour,
      minuteend: parseTime(queue.sundayHolidayHours.end).minute,
      out: GREETING_NODE_ID,
    });
  }
  hoursNode.config.times = windows;

  const offHoursMessage = queue.offHoursMessage.trim();
  if (offHoursMessage) {
    const offHoursMessageNode = {
      id: randomUUID(),
      type: 0,
      x: labelNode.x,
      y: labelNode.y + 100,
      out: labelNode.out,
      errorType: 0,
      configured: true,
      config: { ...greetingNode.config, text: offHoursMessage },
    };
    labelNode.out = offHoursMessageNode.id;
    template.options.push(offHoursMessageNode);
  }

  const { options, ...rest } = template;
  return { ...rest, name: `Boas vindas - ${queue.name}`, options: JSON.stringify(options) };
}

export const configureIvrProcessor: Processor = async ({ client, deploymentRunId, snapshotPayload }) => {
  const { service } = payloadSchema.parse(snapshotPayload);

  if (service.queues.length === 0) {
    return { metadata: { ivrs: [] } };
  }

  const queuesJob = await prisma.deploymentJob.findUnique({
    where: { deploymentRunId_type: { deploymentRunId, type: "CONFIGURE_QUEUES" } },
  });

  if (queuesJob?.status !== "SUCCESS") {
    throw new Error("Filas precisam ter sido criadas com sucesso antes de configurar a URA");
  }

  const createdQueues = (queuesJob.metadata as QueueJobMetadata | null)?.queues ?? [];
  const externalQueueIdByName = new Map(createdQueues.map((q) => [q.name, q.id]));

  const existingIvrs = await ura.listIvrs(client);
  const result: { queueName: string; ivrId: number; linkedToQueue: boolean }[] = [];

  for (const queue of service.queues) {
    const name = `Boas vindas - ${queue.name}`;
    const existing = existingIvrs.find((ivr) => ivr.name === name);

    let savedIvr;
    if (existing) {
      const current = await ura.getIvr(client, existing.id);
      const options: LiveIvrNode[] =
        typeof current.options === "string" ? JSON.parse(current.options) : (current.options as never);
      applyQueueToLiveOptions(options, queue);
      savedIvr = await ura.updateIvr(client, existing.id, { options: JSON.stringify(options) });
    } else {
      savedIvr = await ura.createIvr(client, buildCreatePayload(queue));
    }

    const externalQueueId = externalQueueIdByName.get(queue.name);
    if (externalQueueId) {
      await queues.updateQueue(client, externalQueueId, { ivrid: savedIvr.id });
    }

    result.push({
      queueName: queue.name,
      ivrId: savedIvr.id,
      linkedToQueue: Boolean(externalQueueId),
    });
  }

  return { metadata: { ivrs: result } };
};
