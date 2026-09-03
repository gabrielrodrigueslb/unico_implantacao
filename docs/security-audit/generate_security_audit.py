from pathlib import Path
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether,
)
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing, String


OUT_DIR = Path(__file__).resolve().parent
OUT_PDF = OUT_DIR / "relatorio-auditoria-seguranca.pdf"
CHART_DIR = OUT_DIR / ".charts"
CHART_DIR.mkdir(exist_ok=True)

COLORS = {
    "Crítica": "#B91C1C", "Alta": "#EA580C", "Média": "#D97706",
    "Baixa": "#2563EB", "Ponto forte": "#059669", "Ink": "#172033",
    "Muted": "#5D687A", "Panel": "#F4F7FB", "Line": "#D9E1EC",
}

FINDINGS = [
    ("A1", "Alta", "Isolamento/IDOR", "server/src/modules/implantations/implantation.service.ts:92-114,155-184; server/src/modules/deployments/deployment.service.ts:115-166; server/src/modules/implantations/review.service.ts:6-94", "O campo responsibleUserId existe no modelo, mas não é usado como filtro nas consultas nem é associado ao usuário autenticado. Qualquer MEMBER autenticado pode enumerar, ler, alterar, cancelar, revisar, aprovar ou reprocessar implantações de outros responsáveis ao conhecer o ID."),
    ("A2", "Média", "Autorização", "server/src/modules/implantations/review.controller.ts:22-25; server/src/modules/implantations/review.schema.ts:7-9; server/src/modules/implantations/review.service.ts:76-83", "A identidade do aprovador é recebida no corpo da requisição (approvedBy) e persistida sem ser comparada à sessão. Um usuário autenticado pode registrar a aprovação em nome de qualquer pessoa."),
    ("A3", "Média", "Link público/IDOR", "server/src/modules/onboarding/onboarding.routes.ts:7-12; server/src/modules/onboarding/onboarding.service.ts:8-18,52-109; server/prisma/schema.prisma:49-63", "O token de onboarding é a única credencial para leitura, escrita e envio do formulário público. O modelo e o serviço não têm expiração, revogação ou rotação; um link vazado permanece utilizável até a mudança de status."),
    ("A4", "Alta", "Segredos", "server/.env (permissões 664); .env.local (permissões 664)", "Arquivos de ambiente com credenciais reais (banco, Redis, JWT, chave de criptografia, parceiro/TOTP e seed administrativo) estão legíveis por grupo e outros usuários. Embora estejam no .gitignore e não exista Git nesta pasta, o modo atual expõe segredos a contas locais."),
    ("A5", "Alta", "Deploy/segredos", "docker-compose.yml:3-19", "O Compose fixa POSTGRES_PASSWORD=unico, publica PostgreSQL e Redis em todas as interfaces do host e não configura autenticação para Redis. Se iniciado em host alcançável por terceiros, há acesso remoto ao Redis e credenciais previsíveis para o banco."),
]

ISSUES = [
    ("[Segurança] Aplicar isolamento por responsável nas implantações", "security, alta", "A1", "Associar responsibleUserId ao req.user.id na criação e incluir o escopo em toda query de Implantation, Onboarding, DeploymentRun e DeploymentJob. ADMIN pode usar uma política explícita de acesso global.", ["MEMBER só lista seus próprios registros.", "GET/PATCH/cancel/review/approve e deployments recusam objetos de outro responsável com 403/404.", "Testes cobrem cada rota com dois usuários."]),
    ("[Segurança] Derivar o aprovador da sessão autenticada", "security, média", "A2", "Remover approvedBy do schema público e chamar approve(req.params.id, req.user!.id).", ["O corpo não aceita approvedBy.", "approvedBy gravado no snapshot coincide com req.user.id.", "Teste prova que valor enviado pelo cliente não altera a autoria."]),
    ("[Segurança] Expirar e revogar links de onboarding", "security, média", "A3", "Adicionar validade e revogação/rotação ao token, comparar no serviço e permitir emissão de novo link.", ["Token expirado retorna 401/404 e não lê nem escreve dados.", "Token revogado não funciona.", "Novo token invalida o anterior."]),
    ("[Segurança] Restringir leitura dos arquivos de ambiente", "security, alta", "A4", "Mover segredos para um cofre/secret manager quando aplicável e definir permissões 600 nos arquivos locais; rotacionar os valores presentes.", ["Arquivos de segredo têm proprietário-only (600) ou deixam de existir no host.", "Valores atuais foram rotacionados.", "Pipeline não imprime valores de ambiente."]),
    ("[Segurança] Remover credenciais e portas abertas do Compose", "security, alta", "A5", "Ler credenciais via variáveis sem default inseguro, exigir senha Redis e publicar portas apenas em 127.0.0.1 ou rede interna.", ["Compose não contém senha fixa.", "Redis exige autenticação.", "Portas não são expostas em interfaces públicas por padrão."]),
]


def hexcolor(name):
    return colors.HexColor(COLORS[name] if name in COLORS else name)


def make_charts():
    severidade = Drawing(215, 180)
    severidade.add(String(108, 168, "Por severidade", fontName="Helvetica-Bold", fontSize=10, fillColor=hexcolor("Ink"), textAnchor="middle"))
    pie = Pie(); pie.x = 47; pie.y = 20; pie.width = 120; pie.height = 120; pie.data = [3, 2]; pie.labels = ["Alta 60%", "Média 40%"]
    pie.slices[0].fillColor = hexcolor("Alta"); pie.slices[1].fillColor = hexcolor("Média"); pie.slices.strokeColor = colors.white; pie.slices.strokeWidth = 2
    pie.simpleLabels = False; pie.slices.labelRadius = 1.24; severidade.add(pie)
    pie.slices.fontSize = 6.5
    severidade.add(String(107, 77, "5", fontName="Helvetica-Bold", fontSize=18, fillColor=hexcolor("Ink"), textAnchor="middle"))
    severidade.add(String(107, 64, "achados", fontSize=6.5, fillColor=hexcolor("Muted"), textAnchor="middle"))

    categorias = Drawing(215, 180)
    categorias.add(String(108, 168, "Por categoria", fontName="Helvetica-Bold", fontSize=10, fillColor=hexcolor("Ink"), textAnchor="middle"))
    bar = VerticalBarChart(); bar.x = 24; bar.y = 38; bar.width = 174; bar.height = 105; bar.data = [[1, 1, 1, 1, 1]]
    bar.valueAxis.valueMin = 0; bar.valueAxis.valueMax = 1.35; bar.valueAxis.valueSteps = [0, 1]; bar.valueAxis.gridStrokeColor = hexcolor("Line")
    bar.categoryAxis.categoryNames = ["IDOR", "Aut.", "Link", "Seg.", "Deploy"]; bar.categoryAxis.labels.fontSize = 6
    bar.bars[0].fillColor = hexcolor("Alta"); bar.bars[0].strokeColor = None; categorias.add(bar)
    for i, color in enumerate(["Alta", "Média", "Média", "Alta", "Alta"]): bar.bars[(0, i)].fillColor = hexcolor(color)
    categorias.add(String(108, 15, "Um achado em cada categoria", fontSize=6.5, fillColor=hexcolor("Muted"), textAnchor="middle"))
    return severidade, categorias


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleAudit", parent=styles["Title"], fontSize=27, leading=33, textColor=hexcolor("Ink"), spaceAfter=14))
styles.add(ParagraphStyle(name="H1Audit", parent=styles["Heading1"], fontSize=17, leading=21, textColor=hexcolor("Ink"), spaceBefore=10, spaceAfter=9))
styles.add(ParagraphStyle(name="H2Audit", parent=styles["Heading2"], fontSize=12, leading=15, textColor=hexcolor("Ink"), spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyAudit", parent=styles["BodyText"], fontSize=9.2, leading=13, textColor=hexcolor("Ink"), spaceAfter=6))
styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=7.5, leading=10, textColor=hexcolor("Muted")))
styles.add(ParagraphStyle(name="Chip", parent=styles["BodyText"], fontSize=7.5, leading=9, alignment=TA_CENTER, textColor=colors.white, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="IssueCode", parent=styles["Code"], fontName="Courier", fontSize=6.5, leading=8.5, textColor=hexcolor("Ink")))


def P(text, style="BodyAudit"):
    return Paragraph(text.replace("\n", "<br/>"), styles[style])


def finding_table():
    rows = [[P("Severidade", "Small"), P("Arquivo:linha", "Small"), P("Descrição", "Small")]]
    for ident, severity, category, location, desc in FINDINGS:
        chip = Paragraph(severity.upper(), ParagraphStyle("chip-"+ident, parent=styles["Chip"], backColor=hexcolor(severity), borderPadding=3))
        rows.append([chip, P(location, "Small"), P(f"<b>{ident} - {category}.</b> {desc}", "Small")])
    t = Table(rows, colWidths=[2.0*cm, 6.3*cm, 8.3*cm], repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), hexcolor("Panel")), ("GRID", (0,0), (-1,-1), .35, hexcolor("Line")),
        ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(hexcolor("Line")); canvas.line(2*cm, A4[1]-1.4*cm, A4[0]-2*cm, A4[1]-1.4*cm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(hexcolor("Muted"))
    canvas.drawString(2*cm, A4[1]-1.05*cm, "Relatório de Auditoria de Segurança - unico_implantacao")
    canvas.drawRightString(A4[0]-2*cm, 1.05*cm, f"Página {doc.page}")
    canvas.line(2*cm, 1.35*cm, A4[0]-2*cm, 1.35*cm); canvas.restoreState()


def build():
    severidade, categorias = make_charts()
    doc = BaseDocTemplate(str(OUT_PDF), pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.85*cm, bottomMargin=1.75*cm)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([])
    doc.addPageTemplates([__import__('reportlab.platypus', fromlist=['PageTemplate']).PageTemplate(id="audit", frames=frame, onPage=header_footer)])
    story = []
    story += [Spacer(1, 2.0*cm), P("RELATÓRIO DE", "H2Audit"), P("Auditoria de Segurança", "TitleAudit"), P("unico_implantacao", "H1Audit"), Spacer(1, .35*cm)]
    story += [P(f"<b>Data:</b> {date.today().strftime('%d/%m/%Y')}")]
    story += [P("<b>Escopo:</b> aplicação Next.js, API Express, Prisma/PostgreSQL, Redis/BullMQ, Docker Compose, variáveis de ambiente e código de integração.")]
    story += [P("<b>Metodologia:</b> revisão estática das cinco categorias solicitadas. O isolamento foi mapeado ao campo responsibleUserId e à sessão AdminUser; permissões ao middleware requireAdmin; IDOR a todos os handlers Express; segredos aos arquivos de configuração e Compose; e XSS aos sinks de HTML/URL no React e às respostas do backend.")]
    story += [Spacer(1, .6*cm), P("Classificação: três achados altos e dois médios. Não foram encontrados achados críticos ou baixos.", "H2Audit"), PageBreak()]

    story += [P("Resumo executivo", "H1Audit"), P("Foram confirmados cinco riscos acionáveis. O risco principal é a ausência de escopo por responsável nas implantações: o campo responsável existe no banco, porém não controla as consultas. Em seguida, a superfície de configuração expõe serviços e segredos a usuários locais ou rede quando o Compose for usado fora de uma máquina isolada.")]
    story += [Table([[severidade, categorias]], colWidths=[8.1*cm,8.1*cm])]
    story += [P("Riscos centrais", "H2Audit"), P("A1 permite acesso cruzado entre responsáveis autenticados; A4 e A5 permitem comprometimento de infraestrutura e dados se permissões/portas estiverem no contexto errado; A2 enfraquece a trilha de auditoria; A3 prolonga o impacto de um link de onboarding vazado.")]
    story += [P("Pontos fortes verificados", "H1Audit")]
    strengths = [
        "<b>Autenticação:</b> requireAuth valida assinatura JWT e recarrega o usuário ativo do banco em cada requisição (server/src/middleware/auth.middleware.ts:23-39).",
        "<b>Gestão de usuários:</b> todas as rotas /users aplicam requireAuth e requireAdmin antes dos handlers (server/src/modules/users/user.routes.ts:8-16); o backend não depende apenas da UI.",
        "<b>Proteção de credenciais:</b> senhas de serviço são cifradas e removidas das respostas da API (server/src/modules/implantations/implantation.service.ts:13-49).",
        "<b>XSS:</b> a única ocorrência de dangerouslySetInnerHTML está em components/ui/chart.tsx:95-112 e é alimentada apenas por chartConfig constante em components/chart-area-interactive.tsx:33-37; não há fluxo de dados controlado pelo usuário. Não há renderização de HTML/Markdown, eval/new Function ou e-mail/template HTML no backend.",
        "<b>URLs externas:</b> a integração aceita somente HTTPS e host terminado em .atenderbem.com (server/src/integrations/atender-bem/atender-bem.client.ts:13-30).",
    ]
    for s in strengths: story.append(P("• " + s))
    story.append(PageBreak())

    story += [P("Achados detalhados", "H1Audit"), finding_table(), Spacer(1, .25*cm)]
    for ident, severity, category, location, desc in FINDINGS:
        story += [P(f"{ident} - {category} ({severity})", "H2Audit"), P(f"<b>Local:</b> {location}", "Small"), P(desc)]
        if ident == "A1": story.append(P("<b>Explorabilidade:</b> requer uma conta MEMBER válida e o ID alvo (obtível pela própria listagem sem filtro)."))
        if ident == "A2": story.append(P("<b>Explorabilidade:</b> requer sessão autenticada e uma implantação em WAITING_REVIEW; basta alterar approvedBy no JSON."))
        if ident == "A3": story.append(P("<b>Explorabilidade:</b> depende de vazamento/compartilhamento indevido do link; o token UUID não é enumerável de forma prática, mas é permanente no código atual."))
        if ident == "A4": story.append(P("<b>Explorabilidade:</b> qualquer conta local que pertença ao grupo do arquivo ou tenha leitura global pode copiar os valores. Valores foram deliberadamente omitidos deste relatório."))
        if ident == "A5": story.append(P("<b>Explorabilidade:</b> condicionada ao Compose em execução em host alcançável pela rede; Docker publica portas sem endereço de bind explícito."))
    story.append(PageBreak())

    story += [P("Recomendações priorizadas", "H1Audit")]
    recs = [
        ("P1", "Corrigir A1: instituir uma política central de escopo, com filtro por responsibleUserId em serviços e testes de acesso cruzado."),
        ("P1", "Corrigir A4 e rotacionar todos os valores atualmente presentes nos arquivos .env; restringir permissões a 600."),
        ("P1", "Corrigir A5: eliminar senha fixa, proteger Redis e restringir a exposição de portas."),
        ("P2", "Corrigir A2: fonte de verdade do aprovador deve ser req.user.id, nunca o corpo HTTP."),
        ("P2", "Corrigir A3: expiração, revogação e rotação de links públicos; registrar uso quando necessário."),
    ]
    for p, text in recs: story.append(P(f"<b>{p}</b> - {text}"))
    story += [P("Cobertura e limites", "H1Audit"), P("Foram percorridos todos os handlers da API Express: /health, /auth, /users, /implantations, /onboarding, /deployments e /plans. O diretório não possui .git; por isso não foi possível nem necessário verificar segredos em histórico. Não há CI, Helm ou Terraform no escopo. O repositório é Next.js 16.3.4/React 19 no frontend e Express/Prisma/PostgreSQL no backend.")]
    story.append(PageBreak())

    story += [P("ISSUES PARA O GITHUB", "H1Audit"), P("Textos prontos para copiar e colar. Os trechos de evidência não reproduzem segredos.")]
    for n, (title, labels, aid, fix, criteria) in enumerate(ISSUES, 1):
        finding = next(x for x in FINDINGS if x[0] == aid)
        block = f"--- ISSUE {n} ---\n# {title}\n\nLabels sugeridas: {labels}\n\n## Problema\n{finding[4]}\n\n## Evidência\n{finding[3]}\n\n## Impacto\n{finding[1]}: acesso indevido, adulteração de auditoria ou comprometimento de dados/infraestrutura, conforme o achado.\n\n## Sugestão de correção\n{fix}\n\n## Critérios de aceite\n" + "\n".join(f"- [ ] {x}" for x in criteria) + f"\n--- FIM ISSUE {n} ---"
        story += [KeepTogether([P(block, "IssueCode"), Spacer(1, .25*cm)])]
    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUT_PDF)
