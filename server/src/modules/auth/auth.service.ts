import type { AdminUser } from "@prisma/client";
import { AppError, UnauthorizedError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { hashPassword, signSessionToken, verifyPassword } from "../../lib/auth";
import type { loginSchema, updateProfileSchema } from "./auth.schema";
import type { z } from "zod";

function toSafeUser(user: AdminUser): Omit<AdminUser, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function login(data: z.infer<typeof loginSchema>) {
  const user = await prisma.adminUser.findUnique({ where: { email: data.email } });
  // Mesma mensagem para "não existe" e "senha errada" — não dar pista de
  // quais e-mails têm conta.
  if (!user || !user.active || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signSessionToken({ sub: updated.id, role: updated.role });
  return { token, user: toSafeUser(updated) };
}

async function updateProfile(userId: string, data: z.infer<typeof updateProfileSchema>) {
  const current = await prisma.adminUser.findUniqueOrThrow({ where: { id: userId } });

  if (data.newPassword) {
    if (!data.currentPassword || !(await verifyPassword(data.currentPassword, current.passwordHash))) {
      throw new AppError("Senha atual incorreta", 400);
    }
  }

  if (data.email && data.email !== current.email) {
    const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError("Já existe uma conta com este e-mail", 409);
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.newPassword ? { passwordHash: await hashPassword(data.newPassword) } : {}),
    },
  });

  return toSafeUser(updated);
}

export const authService = { login, updateProfile, toSafeUser };
