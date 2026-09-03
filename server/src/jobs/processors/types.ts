import type { AtenderBemClient } from "../../integrations/atender-bem";

export interface ProcessorContext {
  implantationId: string;
  deploymentRunId: string;
  snapshotPayload: Record<string, unknown>;
  client: AtenderBemClient;
}

export interface ProcessorResult {
  externalResourceId?: string;
  /** Dados estruturados para as etapas seguintes correlacionarem (ids criados etc). Nunca segredos. */
  metadata?: Record<string, unknown>;
}

export type Processor = (context: ProcessorContext) => Promise<ProcessorResult>;
