import { z } from "zod";

const strongPassword = z.string().min(12, "A senha precisa ter ao menos 12 caracteres")
  .regex(/[A-Z]/, "A senha precisa ter uma letra maiúscula")
  .regex(/[a-z]/, "A senha precisa ter uma letra minúscula")
  .regex(/\d/, "A senha precisa ter um número")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter um símbolo");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").optional(),
  email: z.string().email("E-mail inválido").optional(),
  /** Só exigido/considerado quando `newPassword` vem preenchido. */
  currentPassword: z.string().optional(),
  newPassword: strongPassword.optional(),
});
