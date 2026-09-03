import { createInitialData } from "@/features/onboarding/initial-data";
import type { OnboardingData } from "@/features/onboarding/types";

/** Preenche `id` em itens de listas antigas que foram salvas sem esse campo
 * (seeds de teste, registros manuais) — usados como React key na revisão e
 * como identidade estável nos steps de edição (adicionar/remover/editar). */
function withIds<T extends { id?: string }>(items: T[] | undefined, prefix: string): (T & { id: string })[] {
  return (items ?? []).map((item, index) => ({
    ...item,
    id: item.id || `${prefix}-${index}`,
  }));
}

/**
 * Respostas salvas por implantações antigas (seeds de teste, registros
 * anteriores a um novo campo) podem não ter todas as chaves de
 * OnboardingData. Mescla nível a nível com os defaults do onboarding para
 * que os steps reaproveitados na revisão sempre recebam um objeto completo.
 */
export function mergeOnboardingData(partial: Partial<OnboardingData>): OnboardingData {
  const base = createInitialData();

  return {
    company: { ...base.company, ...partial.company },
    service: {
      ...base.service,
      ...partial.service,
      queues: withIds(partial.service?.queues, "queue"),
      ivr: { ...base.service.ivr, ...partial.service?.ivr },
    },
    team: {
      ...base.team,
      ...partial.team,
      users: withIds(partial.team?.users, "user"),
      pauseTypes: withIds(partial.team?.pauseTypes, "pause"),
    },
    customization: {
      ...base.customization,
      ...partial.customization,
      quickReplies: withIds(partial.customization?.quickReplies, "reply"),
      contactTags: withIds(partial.customization?.contactTags, "contact-tag"),
      chatTags: withIds(partial.customization?.chatTags, "chat-tag"),
    },
    customers: { ...base.customers, ...partial.customers },
    observations: partial.observations ?? base.observations,
  };
}
