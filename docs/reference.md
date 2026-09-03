# Unico Implantação

## Visão geral

O projeto tem como objetivo automatizar e centralizar o processo de **setup, configuração e criação de novas instâncias do Atender Bem**.

Atualmente parte desse processo depende de coleta manual de informações e execução de diferentes etapas de configuração.

A proposta é transformar esse fluxo em uma experiência estruturada, composta por duas interfaces principais:

1. **Painel administrativo**, utilizado pela equipe interna responsável pelas implantações.
2. **Onboarding do cliente**, utilizado pelo cliente para fornecer as informações necessárias para configuração e personalização da sua instância.

O sistema deverá permitir acompanhar todo o ciclo de implantação, desde a criação da solicitação até a conclusão das configurações e provisionamento da instância.

---

## Logos da empresa: 
logo para fundo escuro: ![alt text](../public/logounico_branca.svg)

Logo para fundo Claro: ![alt text](../public/logounico_azul.svg)

# Stack inicial

## Front-end

* Next.js
* TypeScript
* Tailwind CSS

## Back-end

A definir entre:

* Next.js utilizando API Routes / Server Actions
* Node.js com API separada

A decisão deverá considerar principalmente a complexidade dos processos de implantação, execução de jobs e integrações externas.

## Banco de dados

* PostgreSQL

---

# Referências visuais

As referências de layout, experiência e estilização estão disponíveis em:

`/run/media/gabriel/hd linux/dev/unico_implantacao/docs/references`

Essas referências devem servir como direcionamento visual para construção das interfaces.

Não é necessário reproduzir os layouts exatamente. O objetivo é utilizar os mesmos conceitos de:

* hierarquia visual;
* simplicidade;
* experiência de onboarding;
* feedback de progresso;
* organização das informações.

---

# Estrutura do sistema

O projeto será dividido inicialmente em duas experiências principais.

## 1. Painel administrativo

Interface destinada à equipe interna responsável pelo processo de implantação.

### Gestão de implantações

O administrador deverá conseguir:

* visualizar todas as solicitações de implantação;
* criar uma nova solicitação;
* editar uma solicitação;
* excluir/cancelar uma solicitação;
* visualizar os detalhes completos de uma implantação;
* acompanhar o progresso da implantação.

Cada solicitação deverá representar uma nova implantação de cliente.

---

## Acompanhamento do processo

Cada implantação possuirá diferentes etapas de execução.

Exemplos:

* aguardando preenchimento do cliente;
* dados recebidos;
* validação das informações;
* criação/configuração da instância;
* configuração de integrações;
* personalização;
* validações finais;
* implantação concluída.

Cada etapa poderá possuir estados como:

* `pending` — aguardando execução;
* `running` — em execução;
* `success` — executada com sucesso;
* `failed` — execução com falha.

A interface administrativa deverá apresentar esses estados de forma visual e facilitar a identificação de problemas.

---

## Reprocessamento de etapas

Quando alguma etapa automática apresentar erro, deverá ser possível:

* visualizar o erro ocorrido;
* identificar em qual etapa ocorreu;
* executar novamente somente a etapa que apresentou falha.

Não deverá ser necessário reiniciar todo o processo de implantação.

Sempre que possível, os processos devem ser construídos de forma **idempotente**, permitindo reexecuções sem gerar dados duplicados ou inconsistências.

---

## Visualização das informações do cliente

O administrador deverá conseguir consultar todas as informações fornecidas pelo cliente durante o onboarding.

Essas informações serão utilizadas para configurar e personalizar a nova instância.

---

# Criação de uma solicitação de implantação

O administrador poderá iniciar uma nova implantação informando os dados iniciais necessários.

Exemplos:

* empresa;
* responsável;
* contato;
* tipo de implantação;
* configurações ou integrações necessárias.

Após a criação da solicitação, o sistema deverá gerar um **link exclusivo de onboarding**.

Exemplo conceitual:

`/onboarding/{token}`

O link será enviado ao cliente para que ele complete as informações necessárias.

O identificador utilizado no link não deve expor IDs sequenciais ou informações sensíveis da implantação.

Preferencialmente deverá ser utilizado um token seguro ou UUID associado à solicitação.

---

# 2. Tela do cliente

A tela do cliente deverá funcionar como um **onboarding de aplicação**, evitando a experiência de um formulário longo tradicional.

O objetivo é dividir as informações necessárias em pequenas etapas, tornando o preenchimento mais simples e intuitivo.

Uma versão inicial do formulário existente pode ser encontrada em:

https://formulario-configuracao-unico-conta.vercel.app/

Essa implementação deve ser considerada apenas como referência das informações atualmente coletadas.

A nova interface deverá substituir o formulário extenso por uma experiência de onboarding mais moderna.

---

# Experiência de onboarding

O fluxo deve apresentar as informações progressivamente.

Exemplo:

### Etapa 1 — Boas-vindas

Apresentação rápida do processo e do que será necessário para realizar a implantação.

### Etapa 2 — Empresa

Informações gerais da empresa.

### Etapa 3 — Usuários e responsáveis

Dados das pessoas responsáveis pela operação.

### Etapa 4 — Integrações

Informações e credenciais necessárias para os sistemas que serão integrados.

### Etapa 5 — Personalização

Configurações específicas da instância.

### Etapa 6 — Revisão

Resumo das informações fornecidas antes do envio.

### Etapa 7 — Conclusão

Confirmação de que os dados foram enviados e que a implantação será iniciada.

---

# Diretrizes de UX

A experiência do cliente deve ser:

* simples;
* intuitiva;
* visualmente agradável;
* rápida de preencher;
* responsiva;
* sem aparência de formulário burocrático.

Deve existir uma indicação clara do progresso.

Exemplo:

`Empresa → Integrações → Configuração → Revisão`

O usuário deve entender facilmente:

* onde está;
* quanto falta;
* o que precisa preencher;
* por que determinada informação está sendo solicitada.

---

# Salvamento do progresso

Idealmente, o onboarding deverá salvar o progresso do cliente durante o preenchimento.

Dessa forma, caso ele feche a página ou precise buscar alguma informação antes de continuar, poderá retornar pelo mesmo link sem perder os dados já informados.

---

# Campos condicionais

O onboarding poderá possuir etapas e campos dinâmicos.

Exemplo:

Se o cliente selecionar que utiliza determinada integração:

`ERP: Trier`

o sistema deverá exibir apenas os campos necessários para configurar essa integração.

Se determinada integração não for utilizada, seus campos não precisam aparecer.

Isso evita apresentar dezenas de informações desnecessárias para todos os clientes.

---

# Fluxo macro

```text
ADMIN
  ↓
Cria solicitação de implantação
  ↓
Sistema gera link/token de onboarding
  ↓
Cliente recebe o link
  ↓
CLIENTE
  ↓
Preenche onboarding
  ↓
Revisa informações
  ↓
Envia configuração
  ↓
ADMIN
  ↓
Solicitação fica pronta para implantação
  ↓
Processos de configuração são executados
  ↓
Cada etapa registra seu status
  ↓
Falha ──────→ Reprocessar etapa
  ↓
Sucesso
  ↓
Instância configurada
  ↓
Implantação concluída
```

---

# Entidades iniciais

Algumas entidades que provavelmente existirão no domínio:

## Implantation

Representa uma solicitação de implantação.

Possíveis informações:

* id;
* empresa;
* responsável;
* status geral;
* data de criação;
* data de conclusão;
* token de onboarding.

## Onboarding

Armazena as informações fornecidas pelo cliente.

## ImplantationStep

Representa cada etapa necessária para implantação.

Exemplo:

```text
CREATE_INSTANCE
CONFIGURE_DATABASE
CONFIGURE_INTEGRATION
CREATE_USERS
CUSTOMIZE_INSTANCE
FINAL_VALIDATION
```

Cada etapa poderá armazenar:

* status;
* início da execução;
* fim da execução;
* erro;
* tentativas;
* logs básicos.

---

# Auditoria

Como o processo poderá executar configurações importantes automaticamente, é importante registrar:

* quem criou a implantação;
* quem alterou informações;
* quando o cliente enviou os dados;
* quais processos foram executados;
* quando foram executados;
* resultado de cada execução;
* erros encontrados;
* reprocessamentos realizados.

---

# Segurança

Informações sensíveis fornecidas durante o onboarding devem receber tratamento adequado.

Principalmente:

* credenciais de integrações;
* tokens;
* senhas;
* chaves de API.

Esses dados não devem ser expostos diretamente na interface administrativa após o armazenamento.

Também deve existir controle sobre validade e acesso ao link de onboarding.

---

# Objetivo da primeira versão

A primeira versão deverá permitir completar o seguinte fluxo:

**Administrador cria implantação → cliente recebe link → cliente realiza onboarding → administrador recebe os dados → sistema acompanha e executa as etapas de implantação → administrador consegue identificar e reprocessar falhas.**

Funcionalidades adicionais poderão ser adicionadas posteriormente.

---

# Decisões técnicas pendentes

Ainda deverão ser avaliados:

* utilização de Next.js full-stack ou backend Node.js separado;
* estratégia para execução de processos assíncronos;
* utilização ou não de filas/jobs;
* modelo de provisionamento das novas instâncias;
* formato de armazenamento de credenciais;
* duração e regras de expiração dos links de onboarding;
* estratégia de autenticação do painel administrativo;
* possibilidade de edição das respostas pelo cliente após envio.
