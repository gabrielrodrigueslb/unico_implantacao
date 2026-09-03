import type { AtenderBemClient } from "./atender-bem.client";
import { updateUser } from "./users";
import type { AtenderBemUser } from "./atender-bem.types";

/**
 * Vincula um usuário ao conjunto final de filas (substitui, não soma —
 * reprocessar não deve duplicar vínculos). `updateUser` já lê o usuário
 * atual e preserva o restante do objeto.
 */
export async function assignUserToQueues(
  client: AtenderBemClient,
  userId: number,
  queueIds: number[],
): Promise<AtenderBemUser> {
  const uniqueQueueIds = Array.from(new Set(queueIds));
  return updateUser(client, userId, { queues: uniqueQueueIds });
}
