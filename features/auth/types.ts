export type AdminRole = "ADMIN" | "MEMBER";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Administrador",
  MEMBER: "Membro",
};
