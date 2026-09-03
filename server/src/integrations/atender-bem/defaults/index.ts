import ivrBoasVindasBasico from "./ivr-boas-vindas-basico.json";

/**
 * Templates reais exportados de uma instância (ver docs/default-profiles.md),
 * decodificados de base64 para JSON uma única vez e guardados aqui como
 * fonte de verdade. Usar sempre este arquivo em vez de reconstruir o grafo
 * do zero — ele já é uma URA funcional testada em produção.
 */
export const IVR_TEMPLATES = {
  boasVindasBasico: ivrBoasVindasBasico,
};

/**
 * Id do nó de saudação dentro do template `boasVindasBasico`, identificado
 * ao decodificar o arquivo original — é o único nó cujo texto o executor
 * substitui pela mensagem que o cliente escreveu no onboarding.
 */
export const BOAS_VINDAS_BASICO_GREETING_NODE_ID = "a3924dfa0";
