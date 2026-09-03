/**
 * Teste manual (não faz parte do build) que simula a instância do Atender Bem
 * via fetch mockado, para validar o AtenderBemClient sem depender de uma
 * instância real. Rodar com: npx tsx src/integrations/atender-bem/__manual-test.ts
 */
import { AtenderBemClient } from "./atender-bem.client";
import { AtenderBemAuthError } from "./atender-bem.errors";
import { createQueue, listQueues, updateQueue } from "./queues";
import { createUser, listUsers, updateUser } from "./users";
import { assignUserToQueues } from "./user-queues";
import { createIvr, getIvr, listIvrs, updateIvr } from "./ura";
import { createChatTag, createContactTag, listChatTags, listContactTags, updateContactTag } from "./tags";
import { createQuickReply, listAccessGroups, listQuickReplies } from "./quick-replies";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "OK  " : "FAIL"} ${label}`);
  if (!condition) failures++;
}

let loginCount = 0;
let queuesDb = [
  { id: 1, name: "WhatsApp Loja Centro", type: 21, ivrid: 0, enabled: 1, status: 1, webconfig: { queueId: 1 } },
];
let usersDb = [
  { id: 10, username: "atendente1", fullname: "Atendente Um", type: 2, queues: [] as number[] },
];
let ivrsDb = [
  { id: 5, name: "Boas Vindas", type: 1, initialtext: "node_1", options: "[]" },
];
let contactTagsDb: Record<string, unknown>[] = [];
let chatTagsDb: Record<string, unknown>[] = [];
let predefinedTextsDb: Record<string, unknown>[] = [];
const accessGroupsDb = [
  { id: 1, name: "Todos" },
  { id: 2, name: "Suporte" },
];
let nextTagId = 1;
let nextChatTagId = 1;
let nextTextId = 1;
let forceNext401 = false;

const originalFetch = globalThis.fetch;
// @ts-expect-error - substitui fetch global só para este teste manual
globalThis.fetch = async (input: string | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;

  if (url.pathname === "/login") {
    loginCount += 1;
    if (body.username === "wrong") {
      return new Response(JSON.stringify({ message: "invalid credentials" }), { status: 401 });
    }
    return new Response(JSON.stringify({ token: `token-${loginCount}` }), { status: 200 });
  }

  if (forceNext401) {
    forceNext401 = false;
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  }

  if (url.pathname === "/queues" && method === "GET") {
    return new Response(JSON.stringify(queuesDb), { status: 200 });
  }
  if (url.pathname === "/queues" && method === "POST") {
    const created = { id: 2, ...body };
    queuesDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/queues\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = queuesDb.find((queue) => queue.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.startsWith("/queues/") && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    queuesDb = queuesDb.map((q) => (q.id === id ? { ...body, id } : q));
    return new Response(JSON.stringify({ ...body, id }), { status: 200 });
  }

  if (url.pathname === "/users/getUsers") {
    return new Response(JSON.stringify(usersDb), { status: 200 });
  }
  if (url.pathname === "/users" && method === "POST") {
    const created = { id: 11, ...body };
    usersDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/users\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = usersDb.find((user) => user.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.startsWith("/users/") && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    usersDb = usersDb.map((u) => (u.id === id ? { ...body, id } : u));
    return new Response(JSON.stringify({ ...body, id }), { status: 200 });
  }

  if (url.pathname === "/ivrs/getResumedList") {
    return new Response(JSON.stringify(ivrsDb), { status: 200 });
  }
  if (url.pathname === "/ivrs/" && method === "POST") {
    const created = { id: 6, ...body };
    ivrsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/ivrs\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = ivrsDb.find((i) => i.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/ivrs\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const updated = { ...body, id };
    ivrsDb = ivrsDb.map((i) => (i.id === id ? updated : i));
    // A API real devolve uma lista para PUT /ivrs/:id.
    return new Response(JSON.stringify([updated]), { status: 200 });
  }

  if (url.pathname === "/partner/getAllAvailablePlans") {
    return new Response(JSON.stringify({ chatagents: 10, waqueues: 5 }), { status: 200 });
  }

  if (url.pathname === "/tags/" && method === "GET") {
    return new Response(JSON.stringify(contactTagsDb), { status: 200 });
  }
  if (url.pathname === "/tags/" && method === "POST") {
    const created = { id: nextTagId++, ...body };
    contactTagsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/tags\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = contactTagsDb.find((tag) => tag.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/tags\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const updated = { ...body, id };
    contactTagsDb = contactTagsDb.map((t) => (t.id === id ? updated : t));
    return new Response(JSON.stringify(updated), { status: 200 });
  }

  if (url.pathname === "/chattags/getChatTags") {
    return new Response(JSON.stringify(chatTagsDb), { status: 200 });
  }
  if (url.pathname === "/chattags/" && method === "POST") {
    const created = { id: nextChatTagId++, ...body };
    chatTagsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }

  if (url.pathname === "/predefinedtexts/textItens") {
    return new Response(JSON.stringify(predefinedTextsDb), { status: 200 });
  }
  if (url.pathname === "/contactsgroups/getGroups") {
    return new Response(JSON.stringify(accessGroupsDb), { status: 200 });
  }
  if (url.pathname === "/predefinedtexts" && method === "POST") {
    const created = { id: nextTextId++, ...body };
    predefinedTextsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }

  return new Response(JSON.stringify({ message: "not found in mock" }), { status: 404 });
};

async function main() {
  // baseUrl inválida
  try {
    new AtenderBemClient({
      baseUrl: "http://cliente.atenderbem.com",
      username: "x",
      password: "x",
      totpSecret: "JBSWY3DPEHPK3PXP",
    });
    check("rejeita baseUrl sem https", false);
  } catch {
    check("rejeita baseUrl sem https", true);
  }

  try {
    new AtenderBemClient({
      baseUrl: "https://cliente.outrodominio.com",
      username: "x",
      password: "x",
      totpSecret: "JBSWY3DPEHPK3PXP",
    });
    check("rejeita host fora de .atenderbem.com", false);
  } catch {
    check("rejeita host fora de .atenderbem.com", true);
  }

  const badClient = new AtenderBemClient({
    baseUrl: "https://cliente.atenderbem.com",
    username: "wrong",
    password: "x",
    totpSecret: "JBSWY3DPEHPK3PXP",
  });
  try {
    await badClient.getAvailablePlans();
    check("login com credenciais inválidas lança AtenderBemAuthError", false);
  } catch (err) {
    check(
      "login com credenciais inválidas lança AtenderBemAuthError",
      err instanceof AtenderBemAuthError,
    );
  }

  const client = new AtenderBemClient({
    baseUrl: "https://cliente.atenderbem.com",
    username: "service-account",
    password: "secret",
    totpSecret: "JBSWY3DPEHPK3PXP",
  });

  loginCount = 0;
  const plans = await client.getAvailablePlans<{ chatagents: number }>();
  check("getAvailablePlans retorna limites do plano", plans.chatagents === 10);
  check("login foi chamado (lazy) só quando necessário", loginCount === 1);

  const initialQueues = await listQueues(client);
  check("listQueues retorna filas existentes", initialQueues.length === 1);

  const created = await createQueue(client, { name: "Instagram", type: 12 });
  check(
    "createQueue aplica defaults (fila nasce desligada)",
    created.status === 1 && created.enabled === 0 && created.maxchatsperagent === 5,
  );

  const updatedQueue = await updateQueue(client, 1, { ivrid: 6 });
  check(
    "updateQueue preserva campos existentes e aplica só o patch",
    updatedQueue.name === "WhatsApp Loja Centro" && updatedQueue.ivrid === 6,
  );

  try {
    await updateQueue(client, 999, { ivrid: 1 });
    check("updateQueue de fila inexistente falha", false);
  } catch {
    check("updateQueue de fila inexistente falha", true);
  }

  const newUser = await createUser(client, {
    username: "atendente2",
    fullname: "Atendente Dois",
    password: "trocar-depois",
    type: 2,
  });
  check("createUser aplica defaults", newUser.status === 1 && newUser.sipuser === "");

  const assigned = await assignUserToQueues(client, 10, [1, 1, 2]);
  check(
    "assignUserToQueues deduplica e preserva o resto do usuário",
    JSON.stringify(assigned.queues) === JSON.stringify([1, 2]) &&
      assigned.username === "atendente1",
  );

  const idempotentAssign = await assignUserToQueues(client, 10, [1, 2]);
  check(
    "reexecutar assignUserToQueues é idempotente",
    JSON.stringify(idempotentAssign.queues) === JSON.stringify([1, 2]),
  );

  const ivr = await createIvr(client, { name: "Boas Vindas Loja" });
  check("createIvr aplica defaults", ivr.timeout === 300 && ivr.options === "[]");

  const readBack = await getIvr(client, 5);
  check("getIvr lê o fluxo pelo id", readBack.name === "Boas Vindas");

  const updatedIvr = await updateIvr(client, 5, { timeout: 600 });
  check(
    "updateIvr relê e reenvia o fluxo completo",
    updatedIvr.name === "Boas Vindas" && updatedIvr.timeout === 600,
  );

  // renovação de sessão em 401
  forceNext401 = true;
  const afterExpiry = await listQueues(client);
  check("sessão expirada (401) é renovada e a chamada é repetida", afterExpiry.length >= 1);
  check("login foi chamado de novo após 401", loginCount === 2);

  const contactTag = await createContactTag(client, {
    name: "Cliente VIP",
    bgcolor: "#C6265C",
    fgcolor: "#fff",
  });
  check(
    "createContactTag aplica defaults de escopo (contacttag: 1)",
    contactTag.contacttag === 1 && contactTag.faqtag === 0,
  );

  const updatedTag = await updateContactTag(client, contactTag.id, { bgcolor: "#000000" });
  check(
    "updateContactTag relê e preserva o nome ao aplicar o patch",
    updatedTag.name === "Cliente VIP" && updatedTag.bgcolor === "#000000",
  );

  const chatTag = await createChatTag(client, { name: "Aguardando retorno", color: "#FFF-#000-#FFF" });
  check("createChatTag aplica defaults (marker/priority)", chatTag.priority === 0 && !!chatTag.marker);

  const groups = await listAccessGroups(client);
  check("listAccessGroups lista os grupos da instância", groups.length === 2);

  const quickReply = await createQuickReply(client, {
    title: "Saudação",
    text: "Olá! Como posso ajudar?",
    accessgroups: groups.map((g) => g.id),
  });
  check(
    "createQuickReply grava título, texto e os grupos resolvidos",
    quickReply.title === "Saudação" && quickReply.accessgroups.length === 2,
  );

  check("listContactTags reflete a etiqueta criada", (await listContactTags(client)).length === 1);
  check("listChatTags reflete a etiqueta criada", (await listChatTags(client)).length === 1);
  check("listQuickReplies reflete a resposta criada", (await listQuickReplies(client)).length === 1);

  globalThis.fetch = originalFetch;

  console.log(`\n${failures === 0 ? "TODOS OS TESTES PASSARAM" : `${failures} TESTE(S) FALHARAM`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
