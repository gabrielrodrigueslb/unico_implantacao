import type { AdminRole, Prisma } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  role: AdminRole;
}

/** ADMIN tem escopo operacional global; MEMBER só acessa implantações atribuídas a si. */
export function implantationAccessWhere(user: AuthenticatedUser): Prisma.ImplantationWhereInput {
  return user.role === "ADMIN" ? {} : { responsibleUserId: user.id };
}
