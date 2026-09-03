import type { AdminUser } from "@prisma/client";
import { AppError, ConflictError, NotFoundError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/auth";
import type { createUserSchema, resetPasswordSchema, updateUserSchema } from "./user.schema";
import type { z } from "zod";

function toSafeUser(user: AdminUser): Omit<AdminUser, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function list() {
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(toSafeUser);
}

async function create(data: z.infer<typeof createUserSchema>) {
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
  return toSafeUser(user);
}

async function update(id: string, data: z.infer<typeof updateUserSchema>) {
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
  return toSafeUser(user);
}

async function resetPassword(id: string, data: z.infer<typeof resetPasswordSchema>) {
  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Usuário não encontrado");

  const user = await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(data.password) },
  });
  return toSafeUser(user);
}

async function remove(id: string, requestingUserId: string) {
  if (id === requestingUserId) {
    throw new AppError("Você não pode remover a própria conta", 400);
  }

  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Usuário não encontrado");

  if (current.role === "ADMIN") await assertNotLastAdmin(id);

  await prisma.adminUser.delete({ where: { id } });
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
