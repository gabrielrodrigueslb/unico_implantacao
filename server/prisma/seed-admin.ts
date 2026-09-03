import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

/**
 * Cria a primeira conta administrativa do painel — sem isso, ninguém
 * consegue logar para criar as demais pelo CRUD de usuários. Roda uma vez
 * (idempotente: não faz nada se já existir algum AdminUser) via
 * `npm run seed:admin`, lendo SEED_ADMIN_* do .env.
 */
async function main() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    console.log(`Já existem ${existing} conta(s) administrativa(s) — nada a fazer.`);
    return;
  }

  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD precisam estar no .env",
    );
  }

  await prisma.adminUser.create({
    data: { name, email, role: "ADMIN", passwordHash: await hashPassword(password) },
  });

  console.log(`Conta administrativa criada: ${email}`);
  console.log("Troque a senha padrão depois do primeiro login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
