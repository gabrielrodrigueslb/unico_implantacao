import { z } from "zod";

const strongPassword = z.string().min(12, "A senha precisa ter ao menos 12 caracteres")
  .regex(/[A-Z]/, "A senha precisa ter uma letra maiúscula")
  .regex(/[a-z]/, "A senha precisa ter uma letra minúscula")
  .regex(/\d/, "A senha precisa ter um número")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter um símbolo");

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: strongPassword,
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("E-mail inválido").optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  active: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: strongPassword,
});
