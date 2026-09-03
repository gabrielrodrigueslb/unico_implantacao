import type { ReactNode } from "react";
import { Textarea } from "../components/FormField";
import {
  CHANNEL_LABELS,
  ROLE_LABELS,
  SEGMENT_LABELS,
  type OnboardingData,
  type StepId,
} from "../types";

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-soft p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-accent hover:text-accent/80"
        >
          Editar
        </button>
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-brand/70">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-brand/40">{label}: </span>
      {value}
    </p>
  );
}

export function ReviewStep({
  data,
  observations,
  onObservationsChange,
  onEdit,
}: {
  data: OnboardingData;
  observations: string;
  onObservationsChange: (value: string) => void;
  onEdit: (step: StepId) => void;
}) {
  return (
      <div className="flex flex-col gap-4">
        <ReviewSection title="Responsável" onEdit={() => onEdit("companyContact")}>
          <Row label="Nome" value={data.company.contactName} />
          <Row label="Cargo" value={data.company.contactRole} />
          <Row label="Telefone" value={data.company.contactPhone} />
          <Row label="Lojas/unidades" value={data.company.storeCount} />
        </ReviewSection>

        <ReviewSection title="Segmento" onEdit={() => onEdit("companySegment")}>
          <Row
            label="Segmento"
            value={
              data.company.segment === "generico" && data.company.otherSegmentLabel
                ? data.company.otherSegmentLabel
                : data.company.segment
                  ? SEGMENT_LABELS[data.company.segment]
                  : ""
            }
          />
        </ReviewSection>

        <ReviewSection title="Empresa" onEdit={() => onEdit("companyDetails")}>
          <Row label="Razão social" value={data.company.legalName} />
          <Row label="Nome fantasia" value={data.company.tradeName} />
          <Row label="CNPJ" value={data.company.cnpj} />
          <Row label="E-mail" value={data.company.contactEmail} />
          <Row label="ERP" value={data.company.erp} />
        </ReviewSection>

        <ReviewSection title="Filas e atendimento" onEdit={() => onEdit("service")}>
          {data.service.queues.length === 0 ? (
            <p className="text-brand/40">Nenhuma fila cadastrada.</p>
          ) : (
            data.service.queues.map((queue) => (
              <Row
                key={queue.id}
                label={CHANNEL_LABELS[queue.channel]}
                value={queue.name || "Fila sem nome"}
              />
            ))
          )}
          <Row label="Horário" value={data.service.businessHours} />
          <Row label="URA" value={data.service.usesIvr ? "Sim" : "Não"} />
        </ReviewSection>

        <ReviewSection title="Equipe" onEdit={() => onEdit("team")}>
          {data.team.users.length === 0 ? (
            <p className="text-brand/40">Nenhum usuário cadastrado.</p>
          ) : (
            data.team.users.map((user) => (
              <Row
                key={user.id}
                label={ROLE_LABELS[user.role]}
                value={user.name || "Usuário sem nome"}
              />
            ))
          )}
          <Row
            label="Senha padrão dos novos usuários"
            value={data.team.usesCustomDefaultPassword ? "Personalizada" : "Padrão da Unico"}
          />
          <Row
            label="Controle de pausas"
            value={data.team.usesPauseControl ? "Sim" : "Não"}
          />
        </ReviewSection>

        <ReviewSection title="Personalização" onEdit={() => onEdit("quickReplies")}>
          <Row
            label="Respostas rápidas selecionadas"
            value={String(data.customization.quickReplies.filter((r) => r.selected).length)}
          />
          <Row
            label="Etiquetas de contato ativas"
            value={String(data.customization.contactTags.filter((t) => t.enabled).length)}
          />
          <Row
            label="Etiquetas de chat ativas"
            value={String(data.customization.chatTags.filter((t) => t.enabled).length)}
          />
        </ReviewSection>

        <ReviewSection title="Clientes" onEdit={() => onEdit("customers")}>
          <Row
            label="Importação de contatos"
            value={data.customers.wantsImport ? "Sim" : "Não"}
          />
          {data.customers.wantsImport ? (
            <Row label="Origem" value={data.customers.source} />
          ) : null}
        </ReviewSection>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-brand">Observações</h2>
          <Textarea
            value={observations}
            onChange={(e) => onObservationsChange(e.target.value)}
            placeholder="Alguma particularidade da sua operação que não perguntamos ainda?"
          />
        </div>
      </div>
  );
}
