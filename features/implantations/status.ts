import type { DeploymentJobStatus, DeploymentJobType, ImplantationStatus } from "./types";

/** Rótulo em pt-BR exibido para cada status — ver docs/PROJECT.md. */
export const STATUS_LABELS: Record<ImplantationStatus, string> = {
  ONBOARDING_PENDING: "Aguardando onboarding",
  ONBOARDING_IN_PROGRESS: "Onboarding em andamento",
  WAITING_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovada",
  QUEUED: "Em fila",
  RUNNING: "Em implantação",
  PARTIALLY_FAILED: "Falha parcial",
  FAILED: "Falha",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

/** Variante do Badge do shadcn usada para cada status. */
export const STATUS_BADGE_VARIANT: Record<
  ImplantationStatus,
  "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
> = {
  ONBOARDING_PENDING: "outline",
  ONBOARDING_IN_PROGRESS: "secondary",
  WAITING_REVIEW: "warning",
  APPROVED: "secondary",
  QUEUED: "secondary",
  RUNNING: "secondary",
  PARTIALLY_FAILED: "destructive",
  FAILED: "destructive",
  COMPLETED: "success",
  CANCELLED: "outline",
};

/** Agrupamento usado nos indicadores do dashboard — ver docs/PROJECT.md. */
export const STATUS_GROUPS = {
  aguardandoOnboarding: ["ONBOARDING_PENDING", "ONBOARDING_IN_PROGRESS"],
  aguardandoRevisao: ["WAITING_REVIEW"],
  emImplantacao: ["APPROVED", "QUEUED", "RUNNING"],
  comFalhas: ["FAILED", "PARTIALLY_FAILED"],
  concluidas: ["COMPLETED"],
} satisfies Record<string, ImplantationStatus[]>;

export function canCancel(status: ImplantationStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED";
}

/** Rótulo em pt-BR de cada etapa da automação — ver docs/PROJECT.md (pipeline inicial). */
export const JOB_TYPE_LABELS: Record<DeploymentJobType, string> = {
  CONFIGURE_QUEUES: "Configurar filas",
  CREATE_USERS: "Criar usuários",
  ASSIGN_USERS_TO_QUEUES: "Vincular usuários às filas",
  CONFIGURE_IVR: "Configurar URA",
  CREATE_CONTACT_TAGS: "Criar etiquetas de contato",
  CREATE_CHAT_TAGS: "Criar etiquetas de chat",
  CREATE_QUICK_REPLIES: "Criar respostas rápidas",
  CREATE_PAUSE_TYPES: "Criar motivos de pausa",
};

export const JOB_STATUS_LABELS: Record<DeploymentJobStatus, string> = {
  PENDING: "Pendente",
  QUEUED: "Em fila",
  RUNNING: "Executando",
  SUCCESS: "Concluída",
  FAILED: "Falhou",
  SKIPPED: "Pulada",
};

export const JOB_STATUS_BADGE_VARIANT: Record<
  DeploymentJobStatus,
  "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
> = {
  PENDING: "outline",
  QUEUED: "secondary",
  RUNNING: "secondary",
  SUCCESS: "success",
  FAILED: "destructive",
  SKIPPED: "outline",
};
