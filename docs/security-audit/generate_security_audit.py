#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera docs/security-audit/relatorio-auditoria-seguranca.pdf a partir dos
achados fixados neste script (ver ACHADOS abaixo). Reexecutar depois de
alterar achados ou paleta:

    docs/security-audit/.venv/bin/python docs/security-audit/generate_security_audit.py

Ambiente isolado: docs/security-audit/.venv (venv Python, reportlab + matplotlib).
Não requer nada instalado globalmente.
"""
import io
import os
from datetime import date

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, HRFlowable, NextPageTemplate, ListFlowable, ListItem,
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")

PROJECT_NAME = "Unico Implantação"
REPORT_TITLE = f"Relatório de Auditoria de Segurança — {PROJECT_NAME}"
TODAY = date(2026, 9, 3).strftime("%d/%m/%Y")

# ---------------------------------------------------------------- paleta ----
SEVERITY_COLORS = {
    "crítica": "#B91C1C",
    "alta": "#EA580C",
    "média": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#6B7280",
}
STRONG_COLOR = "#059669"
INK = "#1F2937"
MUTED = "#6B7280"
LINE = "#E5E7EB"
BG_SOFT = "#F8FAFC"

# --------------------------------------------------------------- achados ----
# category: 1 banco sem tranca / 2 permissão no navegador / 3 IDOR / 4 chaves
# expostas / 5 inputs sem tratamento (XSS) / extra: fora das 5 categorias
FINDINGS = [
    {
        "id": "F1",
        "category": "2",
        "cat_label": "Permissão definida no navegador",
        "severity": "média",
        "file": "server/src/modules/implantations/implantation.schema.ts",
        "lines": "21, 30-39",
        "title": "PATCH /implantations/:id permite reatribuir responsibleUserId sem checagem de papel",
        "desc": (
            "updateImplantationSchema herda responsibleUserId de createImplantationSchema e não o "
            "omite (só omite instanceUrl/planId/quotas). Em implantation.service.ts (update, linhas "
            "211-221) o valor enviado pelo cliente é gravado sem nenhuma verificação de AdminRole — "
            "diferente de outras operações do mesmo módulo (quotas só na criação, implanterId "
            "auditado à parte) e do padrão do restante do backend, onde toda operação que reatribui "
            "posse de um recurso é ADMIN-only (ver users.routes.ts)."
        ),
        "why": (
            "Qualquer sessão MEMBER que já tenha acesso a uma implantação (a sua própria, via "
            "implantationAccessWhere) pode, com um único PATCH, transferir a posse dela para o id de "
            "qualquer outro AdminUser — inclusive sem o consentimento do destinatário — bastando "
            "conhecer/adivinhar um id de usuário (visível hoje em GET /users, liberado a qualquer "
            "sessão autenticada). O efeito é uma escrita de controle de acesso que deveria ser "
            "privilégio de ADMIN, mas está liberada para qualquer papel."
        ),
        "evidence": (
            'export const updateImplantationSchema = createImplantationSchema\n'
            '  .omit({ instanceUrl: true, planId: true, agentQuota: true, supervisorQuota: true, adminQuota: true })\n'
            '  .partial()\n'
            '  .extend({ implanterId: z.string().nullable().optional() });\n'
            '// responsibleUserId NÃO está na lista de omit — continua editável por qualquer papel.'
        ),
        "impact": "Reatribuição não autorizada de posse de implantações entre contas do painel (MEMBER→qualquer).",
        "fix": (
            "Restringir a chave responsibleUserId no PATCH a sessões ADMIN (checagem explícita no "
            "controller/service, no mesmo padrão de requireAdmin usado em users.routes.ts), ou "
            "removê-la do updateImplantationSchema e criar uma rota dedicada de reatribuição."
        ),
        "acceptance": [
            "MEMBER autenticado recebe 403 ao enviar responsibleUserId em PATCH /implantations/:id",
            "ADMIN continua conseguindo reatribuir normalmente",
            "Mudança coberta por teste automatizado (ou manual documentado) e registrada em audit-log",
        ],
        "fix_applied": (
            "implantation.service.ts (update) agora lança ForbiddenError (403) quando "
            "responsibleUserId é enviado por um actor com role diferente de ADMIN, antes de "
            "qualquer escrita no banco. ADMIN continua reatribuindo normalmente."
        ),
    },
    {
        "id": "F2",
        "category": "4",
        "cat_label": "Chaves expostas / credenciais padrão",
        "severity": "média",
        "file": "server/src/jobs/processors/create-users.ts",
        "lines": "33",
        "title": "Senha padrão fixa no código-fonte para todos os usuários do Atender Bem provisionados",
        "desc": (
            "UNICO_DEFAULT_PASSWORD = \"Unico@2026\" é usada como senha de todo usuário criado na "
            "instância do cliente sempre que o onboarding não define uma senha padrão customizada "
            "(usesCustomDefaultPassword=false, o padrão do schema). O valor é idêntico em toda "
            "implantação e está em texto plano no repositório."
        ),
        "why": (
            "Qualquer pessoa com acesso ao código-fonte (histórico de commits, contratados, ex-"
            "funcionários) conhece a senha inicial de todo atendente/supervisor/administrador criado "
            "em qualquer instância de cliente que não tenha customizado a senha padrão no onboarding — "
            "um alvo de credential-stuffing/força bruta trivial contra o Atender Bem do cliente até que "
            "cada usuário troque a própria senha."
        ),
        "evidence": (
            '// Decisão de produto: se o cliente não definir uma senha padrão própria no\n'
            '// onboarding, todo novo usuário nasce com esta senha e deve trocá-la depois.\n'
            'const UNICO_DEFAULT_PASSWORD = "Unico@2026";'
        ),
        "impact": "Acesso não autorizado a contas de atendimento do cliente na instância Atender Bem provisionada.",
        "fix": (
            "Gerar uma senha aleatória por usuário (ou por implantação) em vez de uma constante global, "
            "entregá-la por um canal fora do código-fonte (ex.: exibida uma única vez para o "
            "implantador, ou enviada ao responsável do cliente), e forçar troca no primeiro login se o "
            "Atender Bem suportar esse flag."
        ),
        "acceptance": [
            "Senha padrão deixa de ser uma constante idêntica entre implantações",
            "Novo mecanismo documentado em docs/ e testado numa implantação de homologação",
            "Segredo não aparece mais em texto plano no código-fonte",
        ],
        "fix_applied": (
            "create-users.ts agora gera uma senha aleatória forte por execução (generateDefaultPassword, "
            "12 caracteres com maiúscula/minúscula/número/símbolo garantidos) em vez da constante fixa. "
            "A senha gerada só é devolvida no metadata da etapa (aba Atividade) quando de fato foi usada "
            "para criar algum usuário nesta execução — visível apenas a quem já tem acesso à implantação."
        ),
    },
    {
        "id": "F3",
        "category": "extra",
        "cat_label": "Fora das 5 categorias — CSRF",
        "severity": "alta",
        "file": "server/src/lib/auth.ts; server/src/app.ts",
        "lines": "46-52 (auth.ts); 20 (app.ts)",
        "title": "Ausência de proteção CSRF em endpoints de escrita com cookie SameSite=None",
        "desc": (
            "O cookie de sessão da API (unico_admin_session) é emitido com SameSite=\"none\" + Secure "
            "por design (painel e API rodam em origens diferentes — ver comentário em auth.ts). O CORS "
            "(app.ts) restringe a origem para leitura de resposta, mas não impede o disparo da "
            "requisição em si: métodos/; content-types 'simples' (POST sem preflight) chegam ao "
            "Express com o cookie anexado mesmo vindos de um site de terceiros. Não há CSRF token, "
            "verificação de Origin/Referer, nem SameSite=Lax/Strict como mitigação alternativa."
        ),
        "why": (
            "Endpoints POST que não exigem corpo JSON específico — POST /implantations/:id/cancel, "
            "POST /implantations/:id/approve, POST /implantations/:id/onboarding-token/rotate, POST "
            "/deployments/:id/jobs/:type/retry, POST /auth/logout — podem ser disparados por um "
            "formulário HTML autoenviado em qualquer site, usando o cookie SameSite=None da vítima já "
            "autenticada no painel. Rotas que exigem corpo JSON estrito (ex.: criação de usuário) não "
            "são exploráveis da mesma forma porque express.json() só interpreta Content-Type "
            "application/json, que um <form> comum não envia."
        ),
        "evidence": (
            'export const SESSION_COOKIE_OPTIONS = {\n'
            '  httpOnly: true,\n'
            '  secure: true,\n'
            '  sameSite: "none" as const,\n'
            '  ...\n'
            '};\n'
            '// app.ts: app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));\n'
            '// CORS restringe LEITURA da resposta, não o disparo da requisição.'
        ),
        "impact": "Cancelamento/aprovação de implantações, rotação de token de onboarding ou logout forçado sem ação intencional do usuário autenticado.",
        "fix": (
            "Adicionar um token CSRF (double-submit cookie ou header customizado verificado no "
            "servidor) nas rotas de escrita, ou validar o header Origin/Referer contra FRONTEND_URL "
            "antes de processar métodos mutantes."
        ),
        "acceptance": [
            "POST/PATCH/DELETE autenticados exigem CSRF token válido ou Origin confiável",
            "Requisição forjada de origem externa recebe 403",
            "Fluxo legítimo do painel Next.js continua funcionando sem fricção adicional para o usuário",
        ],
        "fix_applied": (
            "Novo middleware requireTrustedOrigin (server/src/middleware/csrf.middleware.ts), aplicado "
            "globalmente em app.ts antes de todas as rotas: para todo método que não seja GET/HEAD/OPTIONS, "
            "exige que o header Origin (ou Referer como fallback) bata exatamente com FRONTEND_URL, "
            "rejeitando com 403 caso contrário. O painel Next.js sempre envia Origin em fetch cross-origin, "
            "então o fluxo legítimo não é afetado."
        ),
    },
    {
        "id": "F4",
        "category": "extra",
        "cat_label": "Fora das 5 categorias — força bruta",
        "severity": "média",
        "file": "server/src/modules/auth/auth.routes.ts; server/src/app.ts",
        "lines": "9 (auth.routes.ts)",
        "title": "POST /auth/login sem rate limiting nem bloqueio por tentativas",
        "desc": (
            "Não há express-rate-limit, slow-down ou qualquer contador de tentativas no app.ts ou nas "
            "rotas de auth. package.json do server não lista nenhuma dependência de rate limiting."
        ),
        "why": (
            "Um atacante pode tentar senhas indefinidamente contra qualquer e-mail de AdminUser "
            "conhecido (ex.: admin@unicocontato.com.br, visível no seed) sem qualquer atraso, CAPTCHA "
            "ou bloqueio, facilitando força bruta/credential stuffing contra o painel administrativo."
        ),
        "evidence": (
            'authRoutes.post("/login", asyncHandler(authController.login));\n'
            '// nenhum middleware de limitação antes deste handler'
        ),
        "impact": "Comprometimento de conta do painel administrativo por força bruta de senha.",
        "fix": (
            "Adicionar rate limiting por IP/e-mail (ex.: express-rate-limit) e um atraso ou bloqueio "
            "temporário após N tentativas falhas consecutivas para a mesma conta."
        ),
        "acceptance": [
            "Tentativas de login acima de um limite configurável retornam 429",
            "Bloqueio não impede logins legítimos em uso normal",
        ],
        "fix_applied": (
            "Dependência express-rate-limit adicionada ao server/. POST /auth/login agora passa por "
            "loginRateLimit (auth.routes.ts): 10 tentativas por IP a cada 15 minutos, retornando 429 "
            "acima do limite."
        ),
    },
    {
        "id": "F5",
        "category": "extra",
        "cat_label": "Fora das 5 categorias — reverse tabnabbing",
        "severity": "baixa",
        "file": "features/implantations/components/ImplantationsTable.tsx; app/admin/implantations/[id]/page.tsx",
        "lines": "135 (ImplantationsTable.tsx); 85, 95 (page.tsx)",
        "title": "Links target=\"_blank\" sem rel=\"noopener noreferrer\"",
        "desc": (
            "Os links para a instância do cliente e para o link de onboarding abrem em nova aba "
            "(target=\"_blank\") sem rel=\"noopener noreferrer\". O next/link do Next 16 não adiciona "
            "esse atributo automaticamente."
        ),
        "why": (
            "A aba aberta (instanceBaseUrl é sempre https://<subdomínio>.atenderbem.com, validado "
            "pelo backend — risco baixo aqui, mas é o padrão a corrigir) mantém acesso via "
            "window.opener à página original, permitindo em tese redirecionar a aba de origem "
            "(reverse tabnabbing) caso o destino seja malicioso."
        ),
        "evidence": 'render={<Link href={implantation.instanceBaseUrl} target="_blank" />}',
        "impact": "Baixo neste caso concreto (destino validado), mas é uma prática insegura a padronizar.",
        "fix": 'Adicionar rel="noopener noreferrer" em todo target="_blank".',
        "acceptance": ["Todo Link/<a> com target=\"_blank\" no projeto tem rel=\"noopener noreferrer\""],
        "fix_applied": (
            "rel=\"noopener noreferrer\" adicionado aos três links target=\"_blank\" identificados "
            "(ImplantationsTable.tsx e app/admin/implantations/[id]/page.tsx). Grep confirmou não haver "
            "mais nenhum target=\"_blank\" sem o atributo no projeto."
        ),
    },
]

STRENGTHS = [
    {
        "title": "Isolamento por posse (categoria 1) aplicado de ponta a ponta",
        "detail": (
            "lib/access-control.ts define implantationAccessWhere(user) — ADMIN vê tudo, MEMBER só "
            "responsibleUserId = si mesmo. Usado consistentemente em implantation.service.ts "
            "(list, stats, getById, activity), review.service.ts (findImplantationWithOnboarding) e "
            "deployment.service.ts (getLatestRun). Todas as rotas de escrita (update, cancel, "
            "approve, retryJob, activity, contact-import) chamam getById()/findImplantationWithOnboarding() "
            "primeiro, herdando o filtro — nenhum caminho encontrado que leia ou altere uma implantação "
            "sem passar por ele."
        ),
    },
    {
        "title": "Backend revalida papel em toda rota sensível (categoria 2)",
        "detail": (
            "requireAdmin em users.routes.ts (criar/editar/reset de senha/excluir) e em "
            "audit-log.routes.ts. As páginas Next.js /admin/users e /admin/audit-logs também "
            "reverificam me.role === \"ADMIN\" no servidor antes de buscar dados — a UI do sidebar "
            "esconde por conveniência, mas não é a única barreira."
        ),
    },
    {
        "title": "IDOR (categoria 3): nenhum handler encontrado sem checagem de posse",
        "detail": (
            "Varredura de todos os *.routes.ts e *.controller.ts do backend: toda busca por :id passa "
            "por findFirst com implantationAccessWhere ou é ADMIN-only. Upload/download de importação "
            "de contatos usa nomes de arquivo gerados por randomUUID() (contact-import.service.ts) — "
            "sem travessia de diretório possível mesmo que o nome original seja hostil, pois é "
            "sempre path.basename()'d e nunca usado como caminho de leitura."
        ),
    },
    {
        "title": "Sem segredos hardcoded nem defaults inseguros (categoria 4)",
        "detail": (
            "config/env.ts valida com zod e falha o boot se JWT_SECRET, CREDENTIALS_ENCRYPTION_KEY "
            "ou DATABASE_URL estiverem ausentes — sem fallback tipo `?? \"default\"`. .env e .env.local "
            "estão no .gitignore e confirmadamente nunca foram commitados (git log/ls-files vazios). "
            "docker-compose.yml exige POSTGRES_PASSWORD/REDIS_PASSWORD via ${VAR:?erro} — não sobe "
            "sem senha explícita. CI/CD (.github/workflows) usa exclusivamente GitHub Secrets, nunca "
            "grava segredo em log ou no repositório (script usa `umask 077` ao escrever server/.env)."
        ),
    },
    {
        "title": "Sem XSS: toda entrada não confiável passa por interpolação JSX (categoria 5)",
        "detail": (
            "As respostas do onboarding público (não autenticado, origem menos confiável) são "
            "renderizadas em OnboardingReview.tsx e ReviewEditor.tsx exclusivamente como filhos de "
            "JSX ({value}), que o React escapa por padrão. Único dangerouslySetInnerHTML do projeto "
            "é components/ui/chart.tsx, que injeta apenas nomes de cores de configuração estática do "
            "próprio código (shadcn), nunca dado de usuário. instanceBaseUrl usado em href é sempre "
            "reconstruído como https://<subdomínio-validado>.atenderbem.com (instance-url.ts), "
            "impedindo esquemas javascript: mesmo vindo de um campo de texto livre."
        ),
    },
]

METHOD_NOTE = (
    "Stack detectada: monorepo com painel Next.js 16 / React 19 (app router) consumindo uma API "
    "própria em Express + TypeScript (server/), Prisma + PostgreSQL como ORM/banco, Redis + BullMQ "
    "para filas de deploy, autenticação por JWT em cookie httpOnly (própria, sem Supabase/RLS). "
    "Mapeamento das 5 categorias para esta stack: (1) \"banco sem tranca\" → não há RLS (não é "
    "Supabase); o isolamento é feito manualmente por código via implantationAccessWhere() em "
    "lib/access-control.ts, aplicado a cada query Prisma sensível — auditado logo abaixo. "
    "(2) \"permissão no navegador\" → checagem de AdminRole (ADMIN/MEMBER) feita tanto no middleware "
    "Express (requireAdmin) quanto, quando aplicável, em Server Components do Next.js — cruzado com a "
    "UI que esconde itens do sidebar por role. (3) IDOR → todo handler de rota Express com :id foi "
    "percorrido individualmente (não por amostragem). (4) Chaves expostas → grep no código-fonte "
    "rastreado pelo git, histórico do git, docker-compose.yml, workflows do GitHub Actions e arquivos "
    "de config; .env não versionados foram lidos apenas para confirmar que não vazam para o "
    "repositório. (5) XSS → sinks de HTML não escapado (dangerouslySetInnerHTML) e uso de href/src "
    "com dado dinâmico no frontend Next.js; não há template de e-mail nem renderização HTML no "
    "backend Express (API é JSON-only)."
)

# ----------------------------------------------------------------- estilos ----
styles = getSampleStyleSheet()
def style(name, **kw):
    base = dict(fontName="Helvetica", textColor=colors.HexColor(INK), leading=14)
    base.update(kw)
    return ParagraphStyle(name, parent=styles["Normal"], **base)

S_COVER_TITLE = style("CoverTitle", fontName="Helvetica-Bold", fontSize=26, leading=32, textColor=colors.HexColor("#0F172A"))
S_COVER_SUB = style("CoverSub", fontSize=13, textColor=colors.HexColor(MUTED), leading=18)
S_COVER_META = style("CoverMeta", fontSize=10.5, textColor=colors.HexColor(INK), leading=16)
S_H1 = style("H1", fontName="Helvetica-Bold", fontSize=17, spaceBefore=4, spaceAfter=10, textColor=colors.HexColor("#0F172A"))
S_H2 = style("H2", fontName="Helvetica-Bold", fontSize=12.5, spaceBefore=12, spaceAfter=6, textColor=colors.HexColor("#0F172A"))
S_BODY = style("Body", fontSize=9.7, spaceAfter=6, alignment=TA_LEFT)
S_BODY_SM = style("BodySm", fontSize=8.8, spaceAfter=4, alignment=TA_LEFT, textColor=colors.HexColor(INK))
S_MUTED = style("Muted", fontSize=8.8, textColor=colors.HexColor(MUTED))
S_CODE = ParagraphStyle("Code", parent=styles["Code"], fontName="Courier", fontSize=7.6, leading=10.2,
                         textColor=colors.HexColor("#111827"), backColor=colors.HexColor("#F1F5F9"))
S_CARD_TITLE = style("CardTitle", fontName="Helvetica-Bold", fontSize=10.3, spaceAfter=3)
S_LABEL = style("Label", fontName="Helvetica-Bold", fontSize=8.6, textColor=colors.HexColor(MUTED))
S_ISSUE = ParagraphStyle("Issue", parent=styles["Code"], fontName="Courier", fontSize=7.4, leading=9.6,
                          textColor=colors.HexColor("#E2E8F0"))

def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def _chip(text, color):
    t = Table([[Paragraph(f'<font color="white"><b>{text}</b></font>', style("chip", fontSize=7.6, textColor=colors.white, alignment=TA_CENTER))]],
              colWidths=[2.4*cm], rowHeights=[0.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(color)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t

def severity_chip(sev):
    return _chip(sev.upper(), SEVERITY_COLORS.get(sev, MUTED))

def fixed_chip():
    return _chip("CORRIGIDO", STRONG_COLOR)

def status_chips(f):
    """Chip de severidade + selo verde de corrigido, empilhados numa coluna."""
    cells = [[severity_chip(f["severity"])]]
    if f.get("fix_applied"):
        cells.append([Spacer(1, 0.12 * cm)])
        cells.append([fixed_chip()])
    return Table(cells, colWidths=[2.6 * cm])

# --------------------------------------------------------------- gráficos ----
def donut_severity_chart():
    order = ["alta", "média", "baixa", "informativa", "crítica"]
    counts = {}
    for f in FINDINGS:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    labels, sizes, colors_list = [], [], []
    for sev in order:
        if counts.get(sev):
            labels.append(sev.capitalize())
            sizes.append(counts[sev])
            colors_list.append(SEVERITY_COLORS[sev])

    fig, ax = plt.subplots(figsize=(4.3, 3.4), dpi=200)
    wedges, _ = ax.pie(sizes, colors=colors_list, startangle=90, counterclock=False,
                        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2))
    ax.text(0, 0.08, str(sum(sizes)), ha="center", va="center", fontsize=22, fontweight="bold", color=INK)
    ax.text(0, -0.18, "achados", ha="center", va="center", fontsize=9, color=MUTED)
    ax.legend(wedges, [f"{l} ({s})" for l, s in zip(labels, sizes)], loc="center left",
              bbox_to_anchor=(1.02, 0.5), frameon=False, fontsize=9)
    ax.set(aspect="equal")
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf

def bar_category_chart():
    cat_labels = {
        "1": "1. Banco sem\ntranca",
        "2": "2. Permissão no\nnavegador",
        "3": "3. IDOR",
        "4": "4. Chaves\nexpostas",
        "5": "5. Inputs sem\ntratamento (XSS)",
        "extra": "Fora das 5\ncategorias",
    }
    order = ["1", "2", "3", "4", "5", "extra"]
    counts = {k: 0 for k in order}
    worst = {k: None for k in order}
    sev_rank = {"crítica": 4, "alta": 3, "média": 2, "baixa": 1, "informativa": 0}
    for f in FINDINGS:
        counts[f["category"]] += 1
        cur = worst[f["category"]]
        if cur is None or sev_rank[f["severity"]] > sev_rank[cur]:
            worst[f["category"]] = f["severity"]

    labels = [cat_labels[k] for k in order]
    values = [counts[k] for k in order]
    bar_colors = [SEVERITY_COLORS.get(worst[k], "#CBD5E1") if counts[k] else "#E2E8F0" for k in order]

    fig, ax = plt.subplots(figsize=(7.6, 3.5), dpi=200)
    x = range(len(labels))
    bars = ax.bar(x, values, color=bar_colors, width=0.56, zorder=3)
    for xi, v in zip(x, values):
        ax.text(xi, v + 0.05, str(v), ha="center", va="bottom", fontsize=10, fontweight="bold", color=INK)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, fontsize=8.3, color=INK)
    ax.set_ylim(0, max(values + [1]) + 1)
    ax.set_yticks(range(0, max(values + [1]) + 2))
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.tick_params(left=False)
    ax.yaxis.grid(True, color=LINE, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf

# --------------------------------------------------------------- template ----
PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

def header_footer(canvas: pdfcanvas.Canvas, doc, is_cover=False):
    canvas.saveState()
    if not is_cover:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor(MUTED))
        canvas.drawString(MARGIN, PAGE_H - 1.25 * cm, REPORT_TITLE)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.25 * cm, TODAY)
        canvas.setStrokeColor(colors.HexColor(LINE))
        canvas.line(MARGIN, PAGE_H - 1.4 * cm, PAGE_W - MARGIN, PAGE_H - 1.4 * cm)

        canvas.line(MARGIN, 1.4 * cm, PAGE_W - MARGIN, 1.4 * cm)
        canvas.drawString(MARGIN, 1.05 * cm, "Relatório de Auditoria de Segurança")
        canvas.drawRightString(PAGE_W - MARGIN, 1.05 * cm, f"Página {doc.page}")
    canvas.restoreState()

def on_cover(canvas, doc):
    header_footer(canvas, doc, is_cover=True)

def on_page(canvas, doc):
    header_footer(canvas, doc, is_cover=False)

doc = BaseDocTemplate(OUT_PATH, pagesize=A4,
                       leftMargin=MARGIN, rightMargin=MARGIN,
                       topMargin=MARGIN, bottomMargin=MARGIN,
                       title=REPORT_TITLE, author="Auditoria de Segurança (Claude Code)")

frame_cover = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN, id="cover")
frame_normal = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN - 0.3 * cm, id="normal")

doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[frame_cover], onPage=on_cover),
    PageTemplate(id="Normal", frames=[frame_normal], onPage=on_page),
])

story = []

# ------------------------------------------------------------------ capa ----
story.append(Spacer(1, 3.5 * cm))
story.append(Paragraph("RELATÓRIO DE AUDITORIA DE SEGURANÇA", S_COVER_SUB))
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph(PROJECT_NAME, S_COVER_TITLE))
story.append(Spacer(1, 0.5 * cm))
story.append(HRFlowable(width="100%", thickness=1.4, color=colors.HexColor("#0F172A")))
story.append(Spacer(1, 1 * cm))

meta_rows = [
    ["Data do relatório", TODAY],
    ["Escopo auditado", "Painel Next.js (app/, components/, features/, lib/, hooks/) e API Express/Prisma (server/src) — código-fonte completo do repositório, configs de deploy (docker-compose.yml, .github/workflows) e histórico do git."],
    ["Metodologia", "Revisão manual, arquivo por arquivo, das 5 categorias solicitadas (isolamento de posse, permissão client-side, IDOR, segredos expostos, XSS), mapeadas para a stack detectada — ver nota metodológica abaixo."],
    ["Autor", "Auditoria assistida por IA (Claude Code) — achados verificados em código real, sem execução de exploits contra ambiente vivo."],
]
meta_table = Table(
    [[Paragraph(f"<b>{k}</b>", S_COVER_META), Paragraph(v, S_COVER_META)] for k, v in meta_rows],
    colWidths=[4.2 * cm, 10.8 * cm],
)
meta_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor(LINE)),
]))
story.append(meta_table)
story.append(Spacer(1, 1 * cm))

note_box = Table([[Paragraph(f"<b>Nota metodológica — mapeamento para a stack</b><br/><br/>{esc(METHOD_NOTE)}", S_BODY_SM)]],
                  colWidths=[15 * cm])
note_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(BG_SOFT)),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor(LINE)),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story.append(note_box)

story.append(NextPageTemplate("Normal"))
story.append(PageBreak())

# --------------------------------------------------------- resumo executivo ----
story.append(Paragraph("Resumo executivo", S_H1))

sev_counts = {}
for f in FINDINGS:
    sev_counts[f["severity"]] = sev_counts.get(f["severity"], 0) + 1
order = ["crítica", "alta", "média", "baixa", "informativa"]
count_cells = []
for sev in order:
    n = sev_counts.get(sev, 0)
    cell = Table([[Paragraph(f'<font color="white"><b>{n}</b></font>', style("n", fontSize=18, alignment=TA_CENTER, textColor=colors.white))],
                  [Paragraph(f'<font color="white">{sev.upper()}</font>', style("l", fontSize=7.6, alignment=TA_CENTER, textColor=colors.white))]],
                 colWidths=[2.9 * cm], rowHeights=[1.1 * cm, 0.55 * cm])
    cell.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(SEVERITY_COLORS[sev]) if n else colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    count_cells.append(cell)
summary_row = Table([count_cells], colWidths=[3 * cm] * 5, hAlign="LEFT")
summary_row.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2)]))
story.append(summary_row)
story.append(Spacer(1, 0.4 * cm))
fixed_count = sum(1 for f in FINDINGS if f.get("fix_applied"))
story.append(Paragraph(
    f"{len(FINDINGS)} achados verificados no total. Nenhum achado crítico ou alta severidade nas 5 "
    "categorias centrais do escopo — o único item de severidade alta encontrado (CSRF) está fora "
    "delas, listado à parte na seção de achados adicionais.",
    S_BODY,
))
if fixed_count:
    status_note = Table([[Paragraph(
        f'<font color="{STRONG_COLOR}"><b>✓ Status: {fixed_count}/{len(FINDINGS)} achados corrigidos</b></font> '
        "— todas as correções abaixo já foram aplicadas ao código nesta mesma revisão (ver selo "
        "\"CORRIGIDO\" e o bloco \"Correção aplicada\" em cada achado detalhado).",
        S_BODY_SM)]], colWidths=[16.2 * cm])
    status_note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#BBF7D0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 0.15 * cm))
    story.append(status_note)

donut_buf = donut_severity_chart()
bar_buf = bar_category_chart()

charts_table = Table([[Image(donut_buf, width=8.2 * cm, height=6.4 * cm),
                        Image(bar_buf, width=8.2 * cm, height=6.4 * cm)]],
                      colWidths=[8.3 * cm, 8.3 * cm])
charts_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(Spacer(1, 0.2 * cm))
story.append(Paragraph("<b>Achados por severidade</b>  ·  <b>Achados por categoria (cor = maior severidade)</b>", S_MUTED))
story.append(charts_table)

story.append(Spacer(1, 0.4*cm))

# ------------------------------------------------------------- pontos fortes ----
story.append(Paragraph("Pontos fortes (verificados e corretos)", S_H1))
strength_flow = []
for s in STRENGTHS:
    row = Table([[Paragraph("✓", style("check", fontSize=13, textColor=colors.HexColor(STRONG_COLOR), fontName="Helvetica-Bold")),
                  Paragraph(f"<b>{esc(s['title'])}</b><br/>{esc(s['detail'])}", S_BODY_SM)]],
                colWidths=[0.8 * cm, 14.7 * cm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BBF7D0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    strength_flow.append(row)
    strength_flow.append(Spacer(1, 0.22 * cm))
story.extend(strength_flow)

story.append(PageBreak())

# ------------------------------------------------------------- pontos fracos ----
story.append(Paragraph("Pontos fracos — riscos centrais (já corrigidos)", S_H1))
weak_summary = [
    "MEMBER podia reatribuir a posse de uma implantação (responsibleUserId) sem checagem de papel — a única lacuna encontrada no modelo de permissões, que é ADMIN-only em todo o resto do backend. Corrigido: agora exige ADMIN.",
    "Uma senha padrão fixa no código provisionava contas reais de atendimento no Atender Bem do cliente sempre que o onboarding não definia senha própria. Corrigido: senha gerada aleatoriamente por execução.",
    "Fora do escopo das 5 categorias, mas relevante: ausência de proteção CSRF (cookie SameSite=None sem token) e de rate limiting no login. Corrigido: verificação de Origin/Referer e rate limit adicionados.",
]
story.append(ListFlowable([ListItem(Paragraph(esc(t), S_BODY)) for t in weak_summary], bulletType="bullet", start="•"))

story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph("Achados detalhados por categoria", S_H1))

CATEGORY_TITLES = {
    "1": "Categoria 1 — Banco sem tranca (isolamento de posse/tenant)",
    "2": "Categoria 2 — Permissão definida no navegador",
    "3": "Categoria 3 — IDOR",
    "4": "Categoria 4 — Chaves expostas / credenciais padrão",
    "5": "Categoria 5 — Inputs sem tratamento (XSS)",
    "extra": "Achados adicionais (fora das 5 categorias solicitadas, verificados durante a auditoria)",
}
CATEGORY_EMPTY = {
    "1": "Nenhum achado explorável nesta categoria — cobertura auditada na seção de pontos fortes.",
    "3": "Nenhum achado de IDOR isolado — o único caso de posse mal controlada foi classificado na categoria 2 (é uma falha de checagem de papel, não de busca por id sem filtro).",
    "5": "Nenhum achado de XSS — toda saída dinâmica passa por escaping automático do React; ver pontos fortes.",
}

for cat in ["1", "2", "3", "4", "5", "extra"]:
    cat_findings = [f for f in FINDINGS if f["category"] == cat]
    story.append(Paragraph(CATEGORY_TITLES[cat], S_H2))
    if not cat_findings:
        story.append(Paragraph(CATEGORY_EMPTY.get(cat, "Nenhum achado."), S_MUTED))
        continue

    header = Table([[Paragraph("<b>Sev.</b>", S_LABEL), Paragraph("<b>Arquivo:linha</b>", S_LABEL), Paragraph("<b>Descrição</b>", S_LABEL)]],
                    colWidths=[2.6 * cm, 5.2 * cm, 7.7 * cm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(header)

    for f in cat_findings:
        row = Table([[status_chips(f),
                      Paragraph(f"{esc(f['file'])}<br/><font color='{MUTED}'>:{esc(f['lines'])}</font>", S_BODY_SM),
                      Paragraph(f"<b>{esc(f['title'])}</b><br/>{esc(f['desc'])}", S_BODY_SM)]],
                    colWidths=[2.6 * cm, 5.2 * cm, 7.7 * cm])
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor(LINE)),
        ]))
        story.append(row)

        fix_applied_html = (
            f"<br/><br/><font color='{STRONG_COLOR}'><b>✓ Correção aplicada:</b></font> {esc(f['fix_applied'])}"
            if f.get("fix_applied") else ""
        )
        detail = Table([[Paragraph(
            f"<b>Por que é explorável:</b> {esc(f['why'])}<br/><br/>"
            f"<b>Evidência:</b><br/><font face='Courier' size='7.6'>{esc(f['evidence']).replace(chr(10), '<br/>')}</font><br/><br/>"
            f"<b>Impacto:</b> {esc(f['impact'])}<br/><br/>"
            f"<b>Correção sugerida:</b> {esc(f['fix'])}"
            f"{fix_applied_html}",
            S_BODY_SM)]], colWidths=[15.5 * cm])
        detail.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4") if f.get("fix_applied") else colors.HexColor(BG_SOFT)),
            ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LINEBELOW", (0, 0), (-1, -1), 0.6, colors.HexColor(LINE)),
        ]))
        story.append(detail)
        story.append(Spacer(1, 0.15 * cm))

story.append(PageBreak())

# --------------------------------------------------------- recomendações ----
story.append(Paragraph("Recomendações priorizadas — todas aplicadas", S_H1))
recommendations = [
    ("P1", "Restringir a alteração de responsibleUserId em PATCH /implantations/:id a sessões ADMIN.", "F1"),
    ("P1", "Adicionar proteção CSRF (token ou verificação de Origin) nas rotas de escrita da API.", "F3"),
    ("P2", "Substituir a senha padrão fixa de usuários provisionados por um valor gerado por implantação/usuário.", "F2"),
    ("P2", "Adicionar rate limiting e bloqueio por tentativas em POST /auth/login.", "F4"),
    ("P3", "Adicionar rel=\"noopener noreferrer\" em todos os links target=\"_blank\".", "F5"),
]
rec_table = Table(
    [[Paragraph("<b>Prior.</b>", S_LABEL), Paragraph("<b>Ação</b>", S_LABEL), Paragraph("<b>Achado</b>", S_LABEL), Paragraph("<b>Status</b>", S_LABEL)]] +
    [[Paragraph(f"<b>{p}</b>", S_BODY_SM), Paragraph(esc(a), S_BODY_SM), Paragraph(fid, S_BODY_SM),
      Paragraph(f'<font color="{STRONG_COLOR}"><b>✓ Corrigido</b></font>', S_BODY_SM)] for p, a, fid in recommendations],
    colWidths=[1.6 * cm, 9.9 * cm, 2 * cm, 2.2 * cm],
)
rec_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor(LINE)),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor(BG_SOFT)]),
]))
story.append(rec_table)

story.append(PageBreak())

# ------------------------------------------------------------ issues github ----
story.append(Paragraph("Issues para o GitHub", S_H1))
story.append(Paragraph(
    "Texto completo em Markdown, pronto para copiar e colar na criação de cada issue.",
    S_MUTED,
))
story.append(Spacer(1, 0.2 * cm))

def issue_markdown(idx, title, labels, problem, evidence_lines, impact, fix, acceptance):
    lines = []
    lines.append(f"--- ISSUE {idx} ---")
    lines.append(f"### {title}")
    lines.append("")
    lines.append(f"**Labels:** {', '.join(labels)}")
    lines.append("")
    lines.append("**Descrição do problema**")
    lines.append(problem)
    lines.append("")
    lines.append("**Evidência**")
    lines.append("```")
    lines.extend(evidence_lines)
    lines.append("```")
    lines.append("")
    lines.append("**Impacto**")
    lines.append(impact)
    lines.append("")
    lines.append("**Sugestão de correção**")
    lines.append(fix)
    lines.append("")
    lines.append("**Critérios de aceite**")
    for c in acceptance:
        lines.append(f"- [ ] {c}")
    lines.append("")
    lines.append(f"--- FIM ISSUE {idx} ---")
    return lines

issue_defs = [
    (1, f"[Segurança] {FINDINGS[0]['title']}", ["security", "media"], FINDINGS[0]),
    (2, f"[Segurança] {FINDINGS[1]['title']}", ["security", "media"], FINDINGS[1]),
    (3, f"[Segurança] {FINDINGS[2]['title']}", ["security", "alta"], FINDINGS[2]),
    (4, f"[Segurança] {FINDINGS[3]['title']}", ["security", "media"], FINDINGS[3]),
    (5, f"[Segurança] {FINDINGS[4]['title']}", ["security", "baixa"], FINDINGS[4]),
]

for idx, title, labels, f in issue_defs:
    md_lines = issue_markdown(
        idx, title, labels,
        problem=f"{f['desc']}\n\n{f['why']}\n\nArquivo: `{f['file']}:{f['lines']}`",
        evidence_lines=[f"{f['file']}:{f['lines']}", "", f["evidence"]],
        impact=f["impact"],
        fix=f["fix"],
        acceptance=f["acceptance"],
    )
    block_text = "<br/>".join(esc(l) if l not in ("```",) else l for l in md_lines)
    block_text = block_text.replace("```", "")
    box = Table([[Paragraph(block_text, S_ISSUE)]], colWidths=[16.2 * cm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0B1220")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#E2E8F0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(KeepTogether([box, Spacer(1, 0.35 * cm)]))

doc.build(story)
print(f"PDF gerado em: {OUT_PATH}")
