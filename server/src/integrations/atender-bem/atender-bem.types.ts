/**
 * O painel envia/recebe objetos amplos para filas, usuários e URAs. Tipamos
 * só os campos que o executor realmente lê ou decide, e preservamos o resto
 * via index signature — nunca reconstruir esses objetos do zero ao editar.
 */

export type AtenderBemQueue = {
  id: number;
  name: string;
  type: number;
  ivrid: number;
  enabled: number;
  status: number;
} & Record<string, unknown>;

export type AtenderBemUser = {
  id: number;
  username: string;
  fullname: string;
  type: number;
  queues?: number[];
} & Record<string, unknown>;

export type AtenderBemIvr = {
  id: number;
  name: string;
  type: number;
  initialtext: string;
  options: string | unknown[];
} & Record<string, unknown>;

export type AtenderBemContactTag = {
  id: number;
  name: string;
  bgcolor: string;
  fgcolor: string;
  contacttag: number;
  faqtag: number;
  dealtag: number;
  tasktag: number;
  tickettag: number;
} & Record<string, unknown>;

export type AtenderBemChatTag = {
  id: number;
  name: string;
  color: string;
  description: string;
  marker: string;
  priority: number;
} & Record<string, unknown>;

export type AtenderBemAccessGroup = {
  id: number;
  name: string;
} & Record<string, unknown>;

export type AtenderBemPredefinedText = {
  id: number;
  title: string;
  text: string;
  accessgroups: number[];
  buttons: unknown[];
} & Record<string, unknown>;

/**
 * "Motivo de pausa" no painel (Configurações → Pausas) — contrato
 * confirmado ao vivo em `/base/config/reasonslist` (POST/PUT/GET
 * `/reasons`). `action`: 1 = alerta o supervisor ao estourar o tempo, 0 =
 * bloqueia o agente de continuar pausado.
 */
export type AtenderBemPauseType = {
  id: number;
  text: string;
  maxtime: number;
  timesperday: number;
  status: number;
  action: number;
  stopmonitoring: number;
  queues: { id: number; name: string }[];
} & Record<string, unknown>;
