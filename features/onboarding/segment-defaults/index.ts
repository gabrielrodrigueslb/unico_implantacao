import farma from "./farma.json";
import matcon from "./matcon.json";
import pet from "./pet.json";
import type { CompanySegment } from "../types";

/**
 * Etiquetas reais de instâncias por segmento (ver docs/default-profiles.md),
 * decodificadas de base64 uma única vez e normalizadas aqui. São o valor
 * pré-selecionado (default) das etiquetas no onboarding — o cliente pode
 * habilitar, desabilitar ou adicionar as suas por cima, como qualquer
 * sugestão editável.
 */

export interface SegmentContactTagDefault {
  name: string;
  bgcolor: string;
  fgcolor: string;
}

export interface SegmentChatTagDefault {
  name: string;
  color: string;
  description: string;
  marker: string;
  priority: number;
}

/**
 * Farma/Matcon vieram como pares diretos "título: mensagem" no .odt. O Pet
 * é um guia com vários subtópicos por seção (rações, banho, vacinas...) que
 * um recorte automático por tópico arriscava misturar errado — por isso
 * cada seção (`→ Nome`) entra inteira como uma única resposta.
 */
export interface SegmentQuickReplyDefault {
  shortcut: string;
  message: string;
}

export interface SegmentDefaults {
  contactTags: SegmentContactTagDefault[];
  chatTags: SegmentChatTagDefault[];
  quickReplies: SegmentQuickReplyDefault[];
}

// "generico" não tem pacote próprio (ver docs/default-profiles.md) — é o
// fallback quando nenhum segmento com defaults reais foi selecionado.
const EMPTY_DEFAULTS: SegmentDefaults = { contactTags: [], chatTags: [], quickReplies: [] };

const SEGMENT_DEFAULTS: Record<CompanySegment, SegmentDefaults> = {
  farma,
  matcon,
  pet,
  generico: EMPTY_DEFAULTS,
};

export function getSegmentDefaults(segment: CompanySegment): SegmentDefaults {
  return SEGMENT_DEFAULTS[segment] ?? EMPTY_DEFAULTS;
}
