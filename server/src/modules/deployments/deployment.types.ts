export const DEPLOYMENT_JOB_TYPES = [
  "CONFIGURE_QUEUES",
  "CREATE_USERS",
  "ASSIGN_USERS_TO_QUEUES",
  "CONFIGURE_IVR",
  "CREATE_CONTACT_TAGS",
  "CREATE_CHAT_TAGS",
  "CREATE_QUICK_REPLIES",
] as const;

export type DeploymentJobType = (typeof DEPLOYMENT_JOB_TYPES)[number];

/**
 * Filas e usuários precisam existir antes de vincular usuários às filas.
 * A URA é por fila e precisa do id real da fila (criada em CONFIGURE_QUEUES)
 * para poder vincular (`queue.ivrid`) depois de criar o fluxo.
 */
export const JOB_DEPENDENCIES: Record<DeploymentJobType, DeploymentJobType[]> = {
  CONFIGURE_QUEUES: [],
  CREATE_USERS: [],
  ASSIGN_USERS_TO_QUEUES: ["CONFIGURE_QUEUES", "CREATE_USERS"],
  CONFIGURE_IVR: ["CONFIGURE_QUEUES"],
  CREATE_CONTACT_TAGS: [],
  CREATE_CHAT_TAGS: [],
  CREATE_QUICK_REPLIES: [],
};

export interface DeploymentJobData {
  deploymentJobId: string;
}
