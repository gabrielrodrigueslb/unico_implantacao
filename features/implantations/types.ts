export type ImplantationStatus =
  | "ONBOARDING_PENDING"
  | "ONBOARDING_IN_PROGRESS"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "QUEUED"
  | "RUNNING"
  | "PARTIALLY_FAILED"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED";

/** Converte os limites do plano da implantação para o formato usado pelo TeamStep do onboarding. */
export function implantationUserQuotas(
  implantation: Pick<Implantation, "adminQuota" | "supervisorQuota" | "agentQuota">,
) {
  const { adminQuota, supervisorQuota, agentQuota } = implantation;
  if (adminQuota === null || supervisorQuota === null || agentQuota === null) return null;
  return { administrador: adminQuota, supervisor: supervisorQuota, atendente: agentQuota };
}

export interface Implantation {
  id: string;
  companyName: string | null;
  /** Só dígitos, sem máscara — formatar na exibição com formatCNPJ. */
  cnpj: string | null;
  instanceName: string;
  instanceBaseUrl: string;
  responsibleUserId: string | null;
  /** Quem de fato conduziu a implantação — distinto de `responsibleUserId` (quem criou o registro). */
  implanterId: string | null;
  implanter: { id: string; name: string } | null;
  status: ImplantationStatus;
  onboardingToken: string;
  planId: number | null;
  planName: string | null;
  agentQuota: number | null;
  supervisorQuota: number | null;
  adminQuota: number | null;
  credentialsConfigured: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ImplantationsPage {
  data: Implantation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImplantationStats {
  byStatus: Partial<Record<ImplantationStatus, number>>;
  createdPerDay: { date: string; count: number }[];
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  currencyCode: string | null;
  agentQuota: number;
  supervisorQuota: number;
  adminQuota: number;
}

export interface ImplantationReview {
  implantation: {
    id: string;
    companyName: string | null;
    instanceName: string;
    status: ImplantationStatus;
  };
  submittedAt: string | null;
  /** Respostas originais enviadas pelo cliente — ver OnboardingData. */
  clientResponses: Record<string, unknown>;
  /** Ajustes feitos pelo implantador antes de aprovar, se houver. */
  reviewedResponses: Record<string, unknown> | null;
}

export type DeploymentJobType =
  | "CONFIGURE_QUEUES"
  | "CREATE_USERS"
  | "ASSIGN_USERS_TO_QUEUES"
  | "CONFIGURE_IVR"
  | "CREATE_CONTACT_TAGS"
  | "CREATE_CHAT_TAGS"
  | "CREATE_QUICK_REPLIES";

export type DeploymentJobStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export interface DeploymentJob {
  id: string;
  deploymentRunId: string;
  type: DeploymentJobType;
  status: DeploymentJobStatus;
  attempts: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  externalResourceId: string | null;
  metadata: unknown;
}

export type DeploymentRunStatus = "RUNNING" | "PARTIALLY_FAILED" | "FAILED" | "COMPLETED";

export interface DeploymentRun {
  id: string;
  implantationId: string;
  snapshotId: string;
  status: DeploymentRunStatus;
  startedAt: string;
  completedAt: string | null;
  jobs: DeploymentJob[];
}

/** Evento da timeline da aba "Atividade" — ver GET /implantations/:id/activity. */
export interface ActivityEvent {
  id: string;
  at: string;
  kind: "audit" | "deployment_run" | "deployment_job";
  /** Ação de auditoria (kind="audit") ou `DeploymentJobType` (kind="deployment_job") — mapear para rótulo pt-BR na UI. */
  label: string;
  actorName: string | null;
  status?: string;
  metadata?: unknown;
}
