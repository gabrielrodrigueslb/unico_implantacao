import type { AtenderBemClient } from "./atender-bem.client";
import type { AtenderBemQueue } from "./atender-bem.types";

export interface CreateQueueInput {
  name: string;
  /** Ver "Tipos de fila observados" em docs/atenderbem-endpoints.md. */
  type: number;
}

/**
 * `GET /queues` sem parâmetros vem paginado com um limite pequeno (~30) —
 * confirmado comparando com o painel real: instâncias com muitas filas
 * (ids na casa das centenas) não apareciam na resposta padrão. `limit=1000`
 * corrige isso (verificado: devolveu as 205 filas da instância de testes,
 * incluindo as mais recentes). Sem essa correção, a checagem de
 * idempotência em CONFIGURE_QUEUES não achava filas já criadas e duplicava
 * a cada reprocessamento.
 */
export async function listQueues(client: AtenderBemClient): Promise<AtenderBemQueue[]> {
  return client.request<AtenderBemQueue[]>("GET", "/queues?limit=1000");
}

/** Lê uma fila específica — usado para reaplicar patch preservando o resto do objeto. */
export async function getQueue(client: AtenderBemClient, queueId: number): Promise<AtenderBemQueue> {
  return client.request<AtenderBemQueue>("GET", `/queues/${queueId}`);
}

export async function createQueue(
  client: AtenderBemClient,
  data: CreateQueueInput,
): Promise<AtenderBemQueue> {
  // A fila nasce desligada; habilitar/conectar o canal é uma etapa à parte.
  return client.request<AtenderBemQueue>("POST", "/queues", {
    status: 1,
    enabled: 0,
    maxchatsperagent: 5,
    ivrid: 0,
    ...data,
  });
}

/**
 * Lê a fila atual e reenvia o objeto completo com o patch aplicado por cima
 * — um payload mínimo pode zerar configurações e webhooks existentes.
 */
export async function updateQueue(
  client: AtenderBemClient,
  queueId: number,
  patch: Partial<AtenderBemQueue>,
): Promise<AtenderBemQueue> {
  const current = await getQueue(client, queueId);

  return client.request<AtenderBemQueue>("PUT", `/queues/${queueId}`, {
    ...current,
    ...patch,
  });
}
