import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  REDIS_URL: z.string().min(1, "REDIS_URL é obrigatório"),
  PORT: z.coerce.number().default(4000),
  // Chave AES-256 em base64 (32 bytes decodificados) usada para cifrar as
  // credenciais da conta de serviço do Atender Bem. Gerar com:
  // openssl rand -base64 32
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, "base64").length === 32, {
      message: "CREDENTIALS_ENCRYPTION_KEY deve ser uma chave base64 de 32 bytes (openssl rand -base64 32)",
    }),
  // Conta de parceiro/revenda usada só para consultar o catálogo de planos
  // (partner/getAllAvailablePlans) — não é a conta de serviço de nenhuma
  // instância de cliente. Opcionais aqui para não derrubar o boot do server;
  // a rota de planos valida e retorna erro claro se faltar alguma.
  PARTNER_ATENDERBEM_BASE_URL: z.string().optional(),
  PARTNER_ATENDERBEM_USERNAME: z.string().optional(),
  PARTNER_ATENDERBEM_PASSWORD: z.string().optional(),
  PARTNER_ATENDERBEM_TOTP_SECRET: z.string().optional(),
  // Login do painel administrativo (AdminUser) — ver server/src/lib/auth.ts.
  JWT_SECRET: z.string().min(16, "JWT_SECRET é obrigatório (openssl rand -base64 48)"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL é obrigatório"),
  // Usados só pelo script `npm run seed:admin` — opcionais para não derrubar
  // o boot do server (o script re-lê e valida sozinho).
  SEED_ADMIN_NAME: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
