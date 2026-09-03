import { getSegmentDefaults } from "./segment-defaults";
import type { CompanySegment, OnboardingData, QuickReplyDraft, TagDraft } from "./types";

let idCounter = 0;

export function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// Usadas quando o segmento não tem um pacote próprio (ver
// docs/default-profiles.md — "generico" não tem defaults dedicados).
const GENERIC_QUICK_REPLIES: Omit<QuickReplyDraft, "id" | "selected">[] = [
  {
    shortcut: "Saudação",
    message: "Olá! Tudo bem? Em que posso te ajudar hoje?",
  },
  {
    shortcut: "Aguarde",
    message: "Só um instante, já vou verificar isso para você.",
  },
  {
    shortcut: "Encerramento",
    message: "Fico à disposição! Tenha um ótimo dia. 😊",
  },
  {
    shortcut: "Pix",
    message: "Nossa chave Pix é ...",
  },
];

// Usadas quando o segmento não tem um pacote próprio de etiquetas
// (ver docs/default-profiles.md — "generico" não tem etiquetas dedicadas).
const GENERIC_CONTACT_TAGS: Omit<TagDraft, "id">[] = [
  { name: "Cliente VIP", enabled: true },
  { name: "Cliente PBM", enabled: false },
  { name: "Assinatura recorrente", enabled: false },
  { name: "Convênio empresa", enabled: false },
];

const GENERIC_CHAT_TAGS: Omit<TagDraft, "id">[] = [
  { name: "Aguardando receita", enabled: true },
  { name: "Entrega agendada", enabled: true },
  { name: "Reclamação em análise", enabled: false },
];

/**
 * Etiquetas sugeridas para o segmento escolhido: vêm pré-selecionadas
 * (é o default), mas continuam editáveis pelo cliente como qualquer
 * sugestão — habilitar/desabilitar, remover ou adicionar as suas.
 */
export function getSuggestedContactTags(segment: CompanySegment): Omit<TagDraft, "id">[] {
  const defaults = getSegmentDefaults(segment);
  if (defaults.contactTags.length === 0) return GENERIC_CONTACT_TAGS;
  return defaults.contactTags.map((tag) => ({
    name: tag.name,
    enabled: true,
    bgcolor: tag.bgcolor,
    fgcolor: tag.fgcolor,
  }));
}

export function getSuggestedChatTags(segment: CompanySegment): Omit<TagDraft, "id">[] {
  const defaults = getSegmentDefaults(segment);
  if (defaults.chatTags.length === 0) return GENERIC_CHAT_TAGS;
  return defaults.chatTags.map((tag) => ({
    name: tag.name,
    enabled: true,
    color: tag.color,
    marker: tag.marker,
    description: tag.description,
  }));
}

export function getSuggestedQuickReplies(
  segment: CompanySegment,
): Omit<QuickReplyDraft, "id">[] {
  const defaults = getSegmentDefaults(segment);
  if (defaults.quickReplies.length === 0) {
    return GENERIC_QUICK_REPLIES.map((reply) => ({ ...reply, selected: true }));
  }
  return defaults.quickReplies.map((reply) => ({ ...reply, selected: true }));
}

export function buildContactTags(segment: CompanySegment): TagDraft[] {
  return getSuggestedContactTags(segment).map((tag) => ({ ...tag, id: createId("contact-tag") }));
}

export function buildChatTags(segment: CompanySegment): TagDraft[] {
  return getSuggestedChatTags(segment).map((tag) => ({ ...tag, id: createId("chat-tag") }));
}

export function buildQuickReplies(segment: CompanySegment): QuickReplyDraft[] {
  return getSuggestedQuickReplies(segment).map((reply) => ({ ...reply, id: createId("reply") }));
}

export function createInitialData(): OnboardingData {
  // Nenhum segmento é escolhido ainda — usado só pra semear as sugestões
  // genéricas de personalização até o cliente selecionar um card.
  const segment: CompanySegment = "generico";

  return {
    company: {
      legalName: "",
      tradeName: "",
      segment: null,
      otherSegmentLabel: "",
      cnpj: "",
      storeCount: "",
      contactName: "",
      contactRole: "",
      contactEmail: "",
      contactPhone: "",
      erp: "",
    },
    service: {
      queues: [],
      businessHours: "",
      usesIvr: false,
      ivr: {
        greeting: "",
        menu: "",
        offHoursMessage: "",
      },
    },
    team: {
      users: [],
      usesPauseControl: false,
      pauseTypes: [],
      usesCustomDefaultPassword: false,
      defaultPassword: "",
    },
    customization: {
      quickReplies: buildQuickReplies(segment),
      contactTags: buildContactTags(segment),
      chatTags: buildChatTags(segment),
    },
    customers: {
      wantsImport: false,
      source: "",
      sourceOther: "",
      notes: "",
    },
    observations: "",
  };
}
