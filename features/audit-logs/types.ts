export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogsPage {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
