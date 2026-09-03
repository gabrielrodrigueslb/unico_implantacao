# Unico Implantação

## Visão geral

O **Unico Implantação** tem como objetivo automatizar, centralizar e dar rastreabilidade ao processo de configuração de novas instâncias do **Atender Bem**.

Atualmente parte desse processo depende de coleta manual de informações, conferência humana e execução manual de diversas configurações dentro de cada instância.

A proposta é transformar esse fluxo em uma experiência estruturada, composta por duas interfaces principais:

1. **Painel administrativo**, utilizado pela equipe interna responsável pelas implantações.
2. **Onboarding do cliente**, utilizado pelo cliente para fornecer as informações necessárias para configuração e personalização da sua instância.

A criação da instância do Atender Bem continuará sendo realizada manualmente pela equipe responsável.

Após a criação da instância, o novo sistema será responsável por:

- cadastrar a solicitação de implantação;
- disponibilizar um onboarding personalizado ao cliente;
- armazenar as informações fornecidas;
- permitir revisão e correção pelo implantador;
- exigir aprovação explícita antes da automação;
- executar automaticamente as configurações aprovadas;
- acompanhar o status de cada etapa;
- permitir reprocessamento isolado em caso de falha.

---

# Princípios de desenvolvimento

O projeto deve priorizar código **simples, legível, previsível e fácil de manter**.

A arquitetura não deverá utilizar abstrações apenas por convenção ou antecipar problemas que ainda não existem.

A regra principal do projeto é:

> Fazer o simples funcionar bem.

Antes de criar uma nova abstração, deve existir uma resposta clara para:

> Qual problema real esta abstração resolve?

Se a resposta for apenas:

- "para organizar melhor";
- "talvez precisemos no futuro";
- "é mais arquitetural";
- "é o padrão que normalmente usam";

preferir não criar naquele momento.

Abstrações deverão surgir quando existir uma necessidade concreta.

Duplicar poucas linhas simples pode ser preferível a criar uma abstração prematura e difícil de entender.

---

## Backend

Utilizar preferencialmente o fluxo:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Prisma / Integration / Queue
```

### Routes

Responsáveis somente por:

- definição dos endpoints;
- middlewares;
- validações de rota quando necessário;
- chamada do controller.

Exemplo:

```ts
router.post(
  '/implantations',
  authenticationMiddleware,
  implantationController.create,
);
```

### Controllers

Responsáveis pela camada HTTP.

Devem:

- receber `request`;
- acessar params/query/body;
- chamar o service;
- retornar a resposta HTTP.

Controllers não devem possuir regra de negócio relevante.

Exemplo:

```ts
async function create(req: Request, res: Response) {
  const data = createImplantationSchema.parse(req.body);

  const implantation = await implantationService.create(data);

  return res.status(201).json(implantation);
}
```

### Services

Responsáveis pelas regras de negócio.

Podem acessar diretamente:

- Prisma;
- integrações;
- filas;
- outros services quando realmente necessário.

Exemplo:

```ts
async function create(data: CreateImplantationInput) {
  return prisma.implantation.create({
    data: {
      companyName: data.companyName,
      instanceBaseUrl: data.instanceBaseUrl,
      status: 'ONBOARDING_PENDING',
      onboardingToken: crypto.randomUUID(),
    },
  });
}
```

### Prisma

O Prisma poderá ser utilizado diretamente dentro dos services.

Não criar camada de repository apenas para encapsular chamadas simples do Prisma.

Evitar estruturas como:

```text
Controller
  ↓
UseCase
  ↓
Service
  ↓
Repository
  ↓
PrismaRepository
  ↓
Prisma
```

quando não existir uma necessidade concreta.

### Integrations

Comunicação com sistemas externos deverá ficar isolada em módulos próprios.

Exemplo:

```text
integrations/
  atender-bem/
```

As integrações devem abstrair detalhes de HTTP, autenticação e transformação de payloads externos, sem criar camadas extras sem necessidade.

### Jobs

Jobs/processors devem ser pequenos e objetivos.

Responsabilidades principais:

- receber o job;
- carregar os dados necessários;
- chamar a integração;
- atualizar status;
- registrar resultado ou erro.

Evitar colocar lógica HTTP diretamente nos processors.

---

## Frontend

O frontend seguirá a mesma filosofia de simplicidade.

Priorizar:

- componentes pequenos;
- composição;
- organização por feature;
- estado local sempre que possível;
- hooks apenas quando houver lógica reutilizável;
- chamadas HTTP centralizadas por feature;
- componentes compartilhados apenas quando realmente compartilhados.

Evitar:

- Context API para estado que pode ser local;
- excesso de providers;
- hooks que apenas encapsulam uma única função sem ganho real;
- abstrações utilizadas apenas uma vez;
- componentes genéricos prematuros;
- componentes gigantes;
- lógica de negócio espalhada pela interface.

---

# Logos da empresa

Logo para fundo escuro:

`../public/logounico_branca.svg`

Logo para fundo claro:

`../public/logounico_azul.svg`

---

# Stack inicial

## Front-end

- Next.js
- TypeScript
- Tailwind CSS

## Back-end

Direcionamento inicial:

- Node.js;
- TypeScript;
- API REST;
- estrutura simples baseada em `routes → controllers → services`.

O backend será separado do frontend principalmente por causa da necessidade de:

- execução assíncrona;
- filas;
- workers;
- retries;
- comunicação com múltiplas instâncias;
- autenticação no Atender Bem;
- logs;
- auditoria;
- controle de dependências entre processos.

## Banco de dados

- PostgreSQL
- Prisma ORM

## Processamento assíncrono

Direcionamento inicial:

- Redis
- BullMQ

---

# Estrutura sugerida do backend

A estrutura deverá ser simples e organizada por domínio.

```text
src/
├── server.ts
├── app.ts
│
├── config/
│   ├── env.ts
│   ├── redis.ts
│   └── database.ts
│
├── modules/
│   ├── implantations/
│   │   ├── implantation.routes.ts
│   │   ├── implantation.controller.ts
│   │   ├── implantation.service.ts
│   │   ├── implantation.schema.ts
│   │   └── implantation.types.ts
│   │
│   ├── onboarding/
│   │   ├── onboarding.routes.ts
│   │   ├── onboarding.controller.ts
│   │   ├── onboarding.service.ts
│   │   ├── onboarding.schema.ts
│   │   └── onboarding.types.ts
│   │
│   └── deployments/
│       ├── deployment.routes.ts
│       ├── deployment.controller.ts
│       ├── deployment.service.ts
│       └── deployment.types.ts
│
├── integrations/
│   └── atender-bem/
│       ├── atender-bem.client.ts
│       ├── atender-bem.auth.ts
│       ├── queues.ts
│       ├── users.ts
│       ├── user-queues.ts
│       ├── ura.ts
│       ├── tags.ts
│       └── quick-replies.ts
│
├── jobs/
│   ├── deployment.queue.ts
│   └── processors/
│       ├── configure-queues.ts
│       ├── create-users.ts
│       ├── assign-users-to-queues.ts
│       ├── configure-ura.ts
│       ├── create-contact-tags.ts
│       ├── create-chat-tags.ts
│       └── create-quick-replies.ts
│
└── lib/
    ├── prisma.ts
    ├── logger.ts
    └── errors.ts
```

Pastas adicionais só deverão ser criadas quando existir uma necessidade real.

Não criar `shared`, `common`, `utils`, `repositories`, `use-cases`, `adapters`, `factories` ou estruturas semelhantes preventivamente.

---

# Estrutura sugerida do frontend

```text
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   └── implantations/
│   │
│   └── onboarding/
│       └── [token]/
│
├── features/
│   ├── implantations/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   │
│   └── onboarding/
│       ├── components/
│       ├── steps/
│       ├── hooks/
│       ├── api.ts
│       ├── schemas.ts
│       └── types.ts
│
├── components/
│   └── ui/
│
└── lib/
    └── api.ts
```

Não criar arquivos vazios apenas para seguir essa estrutura.

As pastas devem existir conforme o projeto precisar delas.

---

# Referências visuais

As referências de layout, experiência e estilização estão disponíveis em:

`/run/media/gabriel/hd linux/dev/unico_implantacao/docs/references`

Essas referências devem servir como direcionamento visual para construção das interfaces.

Não é necessário reproduzir os layouts exatamente.

O objetivo é utilizar os mesmos conceitos de:

- hierarquia visual;
- simplicidade;
- experiência de onboarding;
- feedback de progresso;
- organização das informações;
- visual profissional;
- baixa sensação de formulário burocrático.

Também existe uma implementação inicial do formulário em:

https://formulario-configuracao-unico-conta.vercel.app/

Essa implementação deve ser utilizada principalmente como referência dos dados atualmente coletados, e não como referência obrigatória de UX.

---

# Estrutura do sistema

O projeto será dividido inicialmente em duas experiências principais:

1. Painel administrativo.
2. Onboarding do cliente.

---

# 1. Painel administrativo

Interface destinada à equipe interna responsável pelo processo de implantação.

## Dashboard

O dashboard deverá apresentar uma visão geral das implantações.

Indicadores iniciais:

- aguardando onboarding;
- onboarding em andamento;
- aguardando revisão;
- aprovadas;
- em implantação;
- com falhas;
- concluídas.

Exemplo:

```text
Aguardando onboarding | Aguardando revisão | Em implantação | Com falhas | Concluídas
```

O estado **Aguardando revisão** deverá possuir destaque, pois representa uma ação pendente da equipe de implantação.

---

# Gestão de implantações

O administrador/implantador deverá conseguir:

- visualizar todas as solicitações;
- criar uma nova solicitação;
- editar uma solicitação;
- cancelar uma solicitação;
- acessar os detalhes completos;
- acompanhar o onboarding;
- revisar os dados fornecidos pelo cliente;
- alterar dados antes da implantação;
- aprovar a implantação;
- acompanhar a execução automática;
- visualizar erros;
- reprocessar etapas com falha;
- consultar logs e histórico.

Cada solicitação representa uma implantação de cliente.

---

# Criação de uma solicitação de implantação

A instância do Atender Bem será criada manualmente antes do início da automação.

Após a criação, o implantador deverá cadastrar a solicitação no Unico Implantação.

Dados iniciais possíveis:

- empresa;
- nome da instância;
- URL/base URL da instância;
- responsável interno;
- responsável do cliente;
- contato;
- usuário utilizado para configuração;
- credencial necessária para autenticação;
- observações internas.

Após o cadastro, o sistema deverá gerar um link exclusivo de onboarding.

Exemplo:

```text
/onboarding/{token}
```

O identificador não deverá expor IDs sequenciais ou dados sensíveis.

Preferencialmente deverá ser utilizado:

- UUID;
- token aleatório seguro;
- outro identificador não previsível.

---

# 2. Onboarding do cliente

A tela do cliente deverá funcionar como um onboarding de aplicação.

O objetivo é evitar a apresentação de um formulário longo e burocrático.

As informações deverão ser apresentadas progressivamente, divididas em etapas menores e contextuais.

A interface deve ser:

- simples;
- intuitiva;
- responsiva;
- visualmente agradável;
- rápida de preencher;
- clara quanto ao progresso;
- dinâmica;
- sem excesso de campos simultâneos.

---

# Dados coletados no onboarding

A nova aplicação deverá preservar as informações necessárias do formulário atual, porém reorganizando a experiência.

---

## Etapa 1 — Empresa

Coleta dos dados gerais da empresa e do responsável.

Campos atuais/relevantes:

- razão social;
- nome fantasia/rede;
- CNPJ;
- quantidade de lojas/unidades;
- responsável pelo preenchimento;
- cargo;
- e-mail de contato;
- telefone/WhatsApp;
- sistema de gestão/ERP utilizado;
- data prevista de início;
- outras informações gerais necessárias.

---

## Etapa 2 — Canais e filas de atendimento

Configuração das filas que deverão existir no Atender Bem.

Uma empresa poderá possuir múltiplas filas.

Exemplos:

- WhatsApp Loja Centro;
- WhatsApp Loja Bairro;
- Instagram da rede;
- Facebook;
- Telegram;
- outros canais suportados.

Cada fila poderá possuir configurações próprias.

O cliente deverá conseguir:

- adicionar fila;
- editar fila;
- remover fila;
- duplicar fila;
- configurar informações específicas da fila.

As informações coletadas deverão posteriormente alimentar o processo automático de criação/configuração das filas.

---

## Etapa 3 — Usuários e permissões

Definição dos usuários que deverão existir na nova instância.

O onboarding deverá permitir cadastrar múltiplos usuários.

Perfis iniciais:

### Administrador

Possui acesso às configurações administrativas permitidas.

### Supervisor

Acompanha as filas às quais possuir acesso.

### Atendente

Realiza atendimentos nas filas em que estiver alocado.

O onboarding também deverá coletar a relação entre:

```text
Usuário → Filas
```

Essa relação será utilizada posteriormente durante a etapa automática de vinculação dos usuários às filas.

---

## Etapa 4 — Horários e pausas

Configuração do controle de pausas utilizado pelos atendentes.

Primeiramente deverá ser perguntado se a empresa utilizará controle de pausas.

Caso a resposta seja negativa, os campos relacionados deverão permanecer ocultos.

Caso seja positiva, deverá ser possível cadastrar os tipos de pausa necessários.

A experiência deve priorizar campos condicionais.

---

## Etapa 5 — URA e mensagens de atendimento

Coleta das informações necessárias para criação/configuração da URA.

O cliente deverá conseguir informar as mensagens personalizadas utilizadas no fluxo.

A interface poderá apresentar:

- mensagens sugeridas;
- campos editáveis;
- preview;
- estrutura do fluxo quando necessário.

Essas informações serão utilizadas posteriormente pela automação responsável pela criação/configuração da URA.

---

## Etapa 6 — Respostas rápidas / mensagens pré-definidas

Configuração das mensagens prontas utilizadas pelos atendentes.

O sistema deverá apresentar sugestões previamente cadastradas.

O cliente poderá:

- selecionar sugestões;
- remover sugestões;
- editar mensagens;
- adicionar novas mensagens personalizadas.

Variáveis poderão ser utilizadas quando suportadas pelo Atender Bem.

Exemplos:

```text
!Saudacao!
!nome!
```

Para mensagens personalizadas poderá existir uma estrutura semelhante a:

```text
Nome do atalho = mensagem
```

Exemplo:

```text
Pix = Nossa chave Pix é ...
```

---

## Etapa 7 — Etiquetas

Configuração das etiquetas utilizadas na instância.

### Etiquetas de contato

Etiquetas permanentes associadas ao cadastro do cliente.

Exemplos:

- Cliente VIP;
- Cliente PBM;
- Assinatura recorrente;
- Convênio empresa.

### Etiquetas de chat

Etiquetas utilizadas durante um atendimento.

Exemplos:

- Aguardando receita;
- Entrega agendada;
- Reclamação em análise.

O onboarding deverá possuir sugestões iniciais.

O cliente poderá:

- habilitar;
- desabilitar;
- editar;
- adicionar novas etiquetas.

---

## Etapa 8 — Agenda e importação de contatos

Deverá ser perguntado se o cliente deseja importar uma base de contatos.

Caso não deseje, a etapa poderá ser ignorada.

Caso deseje, poderão ser solicitadas informações como:

- origem da base;
- quantidade aproximada de contatos;
- responsável pelo envio;
- arquivo;
- observações.

Idealmente, o próprio onboarding deverá permitir upload da planilha.

---

## Etapa 9 — Observações

Campo destinado a particularidades da operação que não foram contempladas nas etapas anteriores.

---

# Organização visual sugerida do onboarding

Apesar da quantidade de configurações, não é necessário apresentar nove grandes etapas visualmente.

As informações poderão ser agrupadas.

Exemplo:

```text
1. Sobre sua empresa
2. Como vocês atendem
3. Sua equipe
4. Personalize o atendimento
5. Seus clientes
6. Revisão
```

### 1. Sobre sua empresa

- empresa;
- responsável;
- ERP;
- informações gerais.

### 2. Como vocês atendem

- canais;
- filas;
- horários;
- URA.

### 3. Sua equipe

- usuários;
- perfis;
- usuários por fila;
- pausas.

### 4. Personalize seu atendimento

- respostas rápidas;
- mensagens;
- etiquetas.

### 5. Seus clientes

- importação de agenda;
- contatos.

### 6. Revisão

- resumo de todas as configurações.

---

# Salvamento do progresso

O onboarding deverá salvar o progresso do cliente.

Caso o cliente feche a página, deverá ser possível continuar posteriormente utilizando o mesmo link.

Status possíveis:

```text
ONBOARDING_PENDING
ONBOARDING_IN_PROGRESS
```

O salvamento poderá ser realizado:

- automaticamente;
- ao avançar etapas;
- em intervalos definidos.

---

# Campos condicionais

O onboarding deverá ser dinâmico.

Campos e etapas desnecessárias não deverão ser exibidos.

Exemplo:

```text
Utiliza controle de pausas? Não
```

Os campos de pausa não são exibidos.

Outro exemplo:

```text
Deseja importar contatos? Não
```

A etapa relacionada à importação pode ser ignorada.

---

# Conclusão do onboarding

Quando o cliente finalizar o onboarding, **a implantação não deverá começar automaticamente**.

A solicitação deverá entrar no status:

```text
WAITING_REVIEW
```

Nesse momento, o implantador deverá revisar todas as informações antes de autorizar a automação.

---

# Revisão pelo implantador

A tela administrativa deverá possuir uma experiência específica de revisão.

As informações deverão ser organizadas por domínio.

Exemplo:

```text
Empresa
Filas
Usuários
URA
Etiquetas
Mensagens
Agenda
Observações
```

O implantador deverá conseguir visualizar tudo que foi informado pelo cliente.

---

# Edição pelo implantador

Antes da aprovação, o implantador poderá alterar as informações.

Exemplos:

- corrigir nome de usuário;
- alterar uma fila;
- remover configuração indevida;
- ajustar uma mensagem;
- alterar associação usuário/fila;
- adicionar/remover etiquetas;
- corrigir informações operacionais.

Sempre que possível, deverá existir rastreabilidade entre:

- valor informado pelo cliente;
- valor alterado pelo implantador;
- valor final aprovado.

---

# Aprovação da implantação

Após revisar as informações, o implantador poderá executar a ação:

```text
Aprovar e iniciar implantação
```

Essa ação deverá ser explícita.

Somente após a aprovação os jobs poderão ser criados e enviados para processamento.

A aprovação deverá registrar:

- usuário que aprovou;
- data e hora;
- versão dos dados;
- alterações realizadas;
- snapshot da configuração aprovada.

---

# Snapshot da configuração

Os jobs não deverão consumir diretamente dados mutáveis do onboarding.

Ao aprovar a implantação, o sistema deverá gerar um snapshot imutável da configuração aprovada.

Exemplo:

```json
{
  "queues": [],
  "users": [],
  "userQueueAssignments": [],
  "ura": {},
  "contactTags": [],
  "chatTags": [],
  "quickReplies": []
}
```

Esse snapshot será a fonte de dados da execução automática.

---

# Estados da implantação

## `ONBOARDING_PENDING`

Onboarding ainda não iniciado.

## `ONBOARDING_IN_PROGRESS`

Cliente iniciou, mas ainda não concluiu.

## `WAITING_REVIEW`

Cliente concluiu e aguarda revisão do implantador.

## `APPROVED`

Dados revisados e aprovados.

## `QUEUED`

Jobs enviados para processamento.

## `RUNNING`

Implantação em execução.

## `PARTIALLY_FAILED`

Uma ou mais etapas apresentaram falha, mas outras foram concluídas.

## `FAILED`

Uma falha crítica impediu a continuidade.

## `COMPLETED`

Todos os processos necessários foram concluídos com sucesso.

## `CANCELLED`

Implantação cancelada.

---

# Fluxo macro

```text
Equipe cria manualmente a instância no Atender Bem
        ↓
Implantador cria solicitação no Unico Implantação
        ↓
Informa dados da instância
        ↓
Sistema gera link de onboarding
        ↓
Cliente inicia onboarding
        ↓
ONBOARDING_IN_PROGRESS
        ↓
Cliente preenche configurações
        ↓
Cliente revisa
        ↓
Cliente finaliza
        ↓
WAITING_REVIEW
        ↓
Implantador revisa
        ↓
Implantador pode editar informações
        ↓
Implantador aprova
        ↓
Sistema cria snapshot aprovado
        ↓
APPROVED
        ↓
Jobs são gerados
        ↓
QUEUED
        ↓
Automação executada
        ↓
RUNNING
        ↓
Sucesso / Falha parcial / Falha
        ↓
COMPLETED
```

---

# Pipeline inicial de implantação

A criação da instância não faz parte da pipeline automática.

Após aprovação, deverão ser executados inicialmente:

1. criar/configurar filas;
2. criar usuários;
3. identificar os usuários criados;
4. vincular usuários às filas;
5. criar/configurar URA com mensagens personalizadas;
6. criar etiquetas de contato;
7. criar etiquetas de chat;
8. criar mensagens pré-definidas/respostas rápidas.

Algumas etapas poderão ser executadas em paralelo quando não possuírem dependências.

---

# Comunicação com o Atender Bem

As configurações serão realizadas utilizando os endpoints internos utilizados pelo próprio Atender Bem.

Esses endpoints serão levantados durante o desenvolvimento.

A aplicação deverá possuir uma integração centralizada responsável pela comunicação.

Exemplo:

```text
AtenderBemClient
```

Responsabilidades:

- autenticar na instância;
- obter Bearer Token;
- renovar autenticação;
- realizar requisições;
- padronizar erros;
- transformar payloads quando necessário.

Os services e processors não deverão duplicar regras de autenticação ou chamadas HTTP.

---

# Autenticação na instância

Fluxo conceitual:

```text
Worker recebe job
      ↓
Carrega implantação
      ↓
AtenderBemClient
      ↓
Existe token válido?
   ↙              ↘
 Sim             Não
  ↓               ↓
Usar token     Realizar login
                  ↓
              Obter Bearer
                  ↓
              Executar request
```

O Bearer será tratado como credencial temporária.

---

# Execução através de fila

Os processos automáticos deverão ser executados através de jobs.

Fluxo:

```text
DeploymentService
      ↓
BullMQ
      ↓
Redis
      ↓
Worker
      ↓
Processor
      ↓
AtenderBemClient
      ↓
Atender Bem
```

---

# Dependências iniciais

Filas e usuários precisam existir antes da associação.

```text
CONFIGURE_QUEUES ──────┐
                       ├──→ ASSIGN_USERS_TO_QUEUES
CREATE_USERS ──────────┘
```

Jobs independentes poderão ser paralelizados posteriormente se houver benefício real.

Não adicionar paralelismo apenas por otimização prematura.

---

# Acompanhamento da execução

Cada processo deverá possuir seu próprio estado.

Estados sugeridos:

```text
pending
queued
running
success
failed
retrying
skipped
```

A interface administrativa deverá apresentar esses estados de forma visual.

---

# Reprocessamento de etapas

Uma falha não deverá exigir a execução completa da implantação novamente.

Exemplo:

```text
Filas                    SUCCESS
Usuários                 SUCCESS
Usuários → Filas         SUCCESS
URA                      FAILED
Etiquetas                SUCCESS
Mensagens rápidas        SUCCESS
```

Nesse cenário, deverá ser possível executar novamente somente a etapa da URA.

Sempre que possível, os processos deverão ser idempotentes.

---

# Registro de recursos externos

Será necessário armazenar os IDs retornados pelo Atender Bem.

Exemplo:

```text
Usuário local
        ↓
CREATE_USER
        ↓
Atender Bem retorna ID
        ↓
Salvar externalUserId
        ↓
ASSIGN_USER_TO_QUEUE utiliza esse ID
```

Isso poderá ser utilizado para:

- filas;
- usuários;
- etiquetas;
- URA;
- mensagens;
- outros recursos.

---

# Entidades iniciais

## Implantation

Representa uma solicitação de implantação.

Possíveis campos:

- id;
- companyName;
- instanceName;
- instanceBaseUrl;
- responsibleUserId;
- status;
- onboardingToken;
- createdAt;
- updatedAt;
- completedAt.

---

## Onboarding

Representa o processo de preenchimento realizado pelo cliente.

Possíveis campos:

- id;
- implantationId;
- status;
- startedAt;
- submittedAt;
- currentStep;
- lastSavedAt.

---

## OnboardingResponse

Armazena as informações fornecidas pelo cliente.

Poderá ser dividido por domínio ou utilizar JSON em partes onde isso simplifique o modelo.

Evitar normalização excessiva quando não trouxer ganho prático.

---

## DeploymentSnapshot

Representa a versão imutável das configurações aprovadas.

Possíveis campos:

- id;
- implantationId;
- version;
- payload;
- approvedBy;
- approvedAt;
- createdAt.

---

## DeploymentRun

Representa uma execução da implantação.

Possíveis campos:

- id;
- implantationId;
- snapshotId;
- status;
- startedAt;
- completedAt;
- createdAt.

---

## DeploymentJob

Representa uma etapa da execução.

Possíveis campos:

- id;
- deploymentRunId;
- type;
- status;
- attempts;
- startedAt;
- finishedAt;
- error;
- metadata;
- externalResourceId.

---

# Auditoria

O sistema deverá registrar:

- quem criou a implantação;
- quem alterou os dados;
- quando o onboarding foi iniciado;
- quando foi concluído;
- alterações feitas pelo implantador;
- quem aprovou;
- quando aprovou;
- snapshot aprovado;
- jobs executados;
- tentativas;
- erros;
- reprocessamentos;
- conclusão da implantação.

---

# Segurança

Informações sensíveis deverão receber tratamento adequado.

Principalmente:

- usuários administrativos;
- senhas;
- tokens;
- chaves;
- credenciais de integração.

Esses dados não deverão ser apresentados em texto puro na interface.

Também deverão existir regras para:

- criptografia;
- controle de acesso;
- expiração de onboarding;
- revogação de link;
- auditoria;
- proteção de credenciais.

---

# Documentação dos endpoints do Atender Bem

Os endpoints serão levantados gradualmente durante o desenvolvimento.

Sugestão:

```text
docs/
  atender-bem-api/
    authentication.md
    queues.md
    users.md
    user-queues.md
    ura.md
    contact-tags.md
    chat-tags.md
    quick-replies.md
```

Para cada endpoint documentar:

- nome;
- objetivo;
- método HTTP;
- endpoint;
- autenticação;
- headers;
- params;
- query;
- body;
- response;
- IDs retornados;
- erros conhecidos;
- dependências;
- comportamento em retry;
- comportamento em duplicidade.

---

# Objetivo da primeira versão

A primeira versão deverá permitir completar o fluxo:

```text
Criar instância manualmente
→ cadastrar implantação
→ gerar onboarding
→ cliente preencher
→ implantador revisar
→ implantador ajustar se necessário
→ implantador aprovar
→ gerar snapshot
→ criar jobs
→ configurar instância automaticamente
→ acompanhar execução
→ reprocessar falhas isoladamente
→ concluir implantação
```

---

# Fora do escopo inicial

Evitar adicionar funcionalidades antes de existir necessidade real.

Inicialmente não é prioridade:

- microserviços;
- event sourcing;
- CQRS;
- arquitetura hexagonal completa;
- repository pattern genérico;
- use cases para CRUD simples;
- factories sem múltiplas implementações;
- abstração de banco;
- sistema genérico de workflows;
- engine própria de filas;
- arquitetura multi-provider para integrações;
- state management global complexo no frontend.

Essas abordagens poderão ser consideradas futuramente somente se o projeto realmente exigir.

---

# Decisões técnicas pendentes

Ainda deverão ser avaliados:

- framework HTTP definitivo do backend;
- autenticação do painel administrativo;
- modelo definitivo de armazenamento das credenciais;
- estratégia de criptografia;
- duração do link de onboarding;
- expiração/revogação do token;
- concorrência dos workers;
- políticas de retry;
- timeout dos endpoints;
- comportamento em caso de indisponibilidade da instância;
- forma de armazenamento dos logs;
- upload/importação da agenda;
- quais configurações poderão ser reeditadas após aprovação;
- quais etapas poderão executar em paralelo;
- payloads e respostas reais dos endpoints do Atender Bem.