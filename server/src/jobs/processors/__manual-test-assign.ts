/**
 * Teste manual de ASSIGN_USERS_TO_QUEUES — precisa do Postgres do
 * docker-compose no ar, porque o processor lê o metadata dos jobs irmãos
 * via Prisma. Fetch continua mockado (não precisa de instância real).
 *   npx tsx src/jobs/processors/__manual-test-assign.ts
 */
import { prisma } from "../../lib/prisma";
import { AtenderBemClient } from "../../integrations/atender-bem";
import { assignUsersToQueuesProcessor } from "./assign-users-to-queues";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "OK  " : "FAIL"} ${label}`);
  if (!condition) failures++;
}

const putCalls: { userId: number; queues: number[] }[] = [];

// @ts-expect-error - substitui fetch global só para este teste manual
globalThis.fetch = async (input: string | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;

  if (url.pathname === "/login") {
    return new Response(JSON.stringify({ token: "token-1" }), { status: 200 });
  }
  if (url.pathname === "/users/getUsers") {
    return new Response(
      JSON.stringify([
        { id: 100, username: "atendente1@empresa.com", fullname: "Atendente Um", queues: [] },
        { id: 101, username: "atendente2@empresa.com", fullname: "Atendente Dois", queues: [] },
      ]),
      { status: 200 },
    );
  }
  if (url.pathname.match(/^\/users\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const user = [
      { id: 100, username: "atendente1@empresa.com", fullname: "Atendente Um", queues: [] },
      { id: 101, username: "atendente2@empresa.com", fullname: "Atendente Dois", queues: [] },
    ].find((candidate) => candidate.id === id);
    return new Response(JSON.stringify(user), { status: user ? 200 : 404 });
  }
  if (url.pathname.match(/^\/users\/\d+$/) && method === "PUT") {
    const userId = Number(url.pathname.split("/")[2]);
    putCalls.push({ userId, queues: body.queues });
    return new Response(JSON.stringify({ ...body, id: userId }), { status: 200 });
  }

  return new Response(JSON.stringify({ message: "not found in mock" }), { status: 404 });
};

async function main() {
  const implantation = await prisma.implantation.create({
    data: {
      companyName: "Teste Assign",
      instanceName: "teste-assign",
      instanceBaseUrl: "https://teste-assign.atenderbem.com",
    },
  });
  const snapshot = await prisma.deploymentSnapshot.create({
    data: { implantationId: implantation.id, version: 1, payload: {}, approvedBy: "teste" },
  });
  const run = await prisma.deploymentRun.create({
    data: { implantationId: implantation.id, snapshotId: snapshot.id },
  });

  // Jobs irmãos já concluídos, como estariam numa execução real chegando
  // nesta etapa (a dependência garante essa ordem).
  await prisma.deploymentJob.create({
    data: {
      deploymentRunId: run.id,
      type: "CONFIGURE_QUEUES",
      status: "SUCCESS",
      metadata: {
        queues: [
          { name: "WhatsApp Loja Centro", id: 200 },
          { name: "Instagram da rede", id: 201 },
        ],
      },
    },
  });
  await prisma.deploymentJob.create({
    data: {
      deploymentRunId: run.id,
      type: "CREATE_USERS",
      status: "SUCCESS",
      metadata: {
        users: [
          { username: "atendente1@empresa.com", id: 100, created: true },
          { username: "atendente2@empresa.com", id: 101, created: true },
        ],
      },
    },
  });

  const client = new AtenderBemClient({
    baseUrl: "https://teste-assign.atenderbem.com",
    username: "service-account",
    password: "secret",
    totpSecret: "JBSWY3DPEHPK3PXP",
  });

  const result = await assignUsersToQueuesProcessor({
    implantationId: implantation.id,
    deploymentRunId: run.id,
    client,
    snapshotPayload: {
      service: {
        queues: [
          { id: "queue-local-1", name: "WhatsApp Loja Centro" },
          { id: "queue-local-2", name: "Instagram da rede" },
        ],
      },
      team: {
        users: [
          { username: "atendente1@empresa.com", queueIds: ["queue-local-1"] },
          { username: "atendente2@empresa.com", queueIds: ["queue-local-1", "queue-local-2"] },
        ],
      },
    },
  });

  const assignments = result.metadata?.assignments as { username: string; queueIds: number[] }[];
  check(
    "resolve o id local da fila para o id real do Atender Bem",
    assignments[0].username === "atendente1@empresa.com" &&
      JSON.stringify(assignments[0].queueIds) === JSON.stringify([200]),
  );
  check(
    "usuário com múltiplas filas recebe todos os ids resolvidos",
    JSON.stringify(assignments[1].queueIds) === JSON.stringify([200, 201]),
  );
  check(
    "chamou PUT /users/:id com o conjunto certo de filas",
    putCalls.some((c) => c.userId === 100 && JSON.stringify(c.queues) === JSON.stringify([200])) &&
      putCalls.some(
        (c) => c.userId === 101 && JSON.stringify(c.queues) === JSON.stringify([200, 201]),
      ),
  );

  // etapa anterior falhou -> deve bloquear com erro claro, não adivinhar
  await prisma.deploymentJob.updateMany({
    where: { deploymentRunId: run.id, type: "CREATE_USERS" },
    data: { status: "FAILED" },
  });
  try {
    await assignUsersToQueuesProcessor({
      implantationId: implantation.id,
      deploymentRunId: run.id,
      client,
      snapshotPayload: {
        service: { queues: [{ id: "queue-local-1", name: "WhatsApp Loja Centro" }] },
        team: { users: [{ username: "atendente1@empresa.com", queueIds: ["queue-local-1"] }] },
      },
    });
    check("bloqueia se a etapa de usuários não teve sucesso", false);
  } catch (err) {
    check(
      "bloqueia se a etapa de usuários não teve sucesso",
      err instanceof Error && err.message.includes("sucesso"),
    );
  }

  await prisma.deploymentJob.deleteMany({ where: { deploymentRunId: run.id } });
  await prisma.deploymentRun.deleteMany({ where: { implantationId: implantation.id } });
  await prisma.deploymentSnapshot.deleteMany({ where: { implantationId: implantation.id } });
  await prisma.implantation.delete({ where: { id: implantation.id } });

  console.log(`\n${failures === 0 ? "TODOS OS TESTES PASSARAM" : `${failures} TESTE(S) FALHARAM`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().finally(() => prisma.$disconnect());
