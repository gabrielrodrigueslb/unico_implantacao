import type { AdminUser } from "@prisma/client";
import { AppError, ConflictError, NotFoundError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/auth";
import type { AuthenticatedUser } from "../../lib/access-control";
import { AUDIT_ACTIONS } from "../audit-logs/audit-log.constants";
import { auditLogService } from "../audit-logs/audit-log.service";
import type { createUserSchema, resetPasswordSchema, updateUserSchema } from "./user.schema";
import type { z } from "zod";

type Actor = AuthenticatedUser & { name: string };

function toSafeUser(user: AdminUser): Omit<AdminUser, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function list() {
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(toSafeUser);
}

async function create(data: z.infer<typeof createUserSchema>, actor: Actor) {
  const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError("Já existe uma conta com este e-mail");

  const user = await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    },
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.USER_CREATED,
    entityType: "AdminUser",
    entityId: user.id,
    metadata: { name: user.name, email: user.email, role: user.role },
  });

  return toSafeUser(user);
}

async function update(id: string, data: z.infer<typeof updateUserSchema>, actor: Actor) {
  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Usuário não encontrado");

  if (data.email && data.email !== current.email) {
    const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError("Já existe uma conta com este e-mail");
  }

  // Sem essa checagem, o último admin poderia se rebaixar (ou ser
  // rebaixado) e ninguém mais conseguiria gerenciar usuários.
  if ((data.role === "MEMBER" || data.active === false) && current.role === "ADMIN") {
    await assertNotLastAdmin(id);
  }

  const user = await prisma.adminUser.update({ where: { id }, data });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.USER_UPDATED,
    entityType: "AdminUser",
    entityId: user.id,
    metadata: { changes: data, targetName: user.name },
  });

  return toSafeUser(user);
}

async function resetPassword(id: string, data: z.infer<typeof resetPasswordSchema>, actor: Actor) {
  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Usuário não encontrado");

  const user = await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(data.password) },
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
    entityType: "AdminUser",
    entityId: user.id,
    metadata: { targetName: user.name },
  });

  return toSafeUser(user);
}

async function remove(id: string, actor: Actor) {
  if (id === actor.id) {
    throw new AppError("Você não pode remover a própria conta", 400);
  }

  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Usuário não encontrado");

  if (current.role === "ADMIN") await assertNotLastAdmin(id);

  await prisma.adminUser.delete({ where: { id } });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.USER_DELETED,
    entityType: "AdminUser",
    entityId: id,
    metadata: { targetName: current.name, targetEmail: current.email },
  });
}

async function assertNotLastAdmin(excludingId: string) {
  const otherActiveAdmins = await prisma.adminUser.count({
    where: { role: "ADMIN", active: true, id: { not: excludingId } },
  });
  if (otherActiveAdmins === 0) {
    throw new ConflictError("Precisa sobrar pelo menos um administrador ativo");
  }
}

export const userService = { list, create, update, resetPassword, remove };
