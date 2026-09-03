import { Field, Input, Textarea } from "../components/FormField";
import { Reveal } from "../components/Reveal";
import { ToggleQuestion } from "../components/ToggleQuestion";
import type { OnboardingData } from "../types";
import { useState } from "react";

export function CustomersStep({
  data,
  onChange,
  onUpload,
}: {
  data: OnboardingData["customers"];
  onChange: (data: OnboardingData["customers"]) => void;
  onUpload?: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <ToggleQuestion
        question="Deseja importar uma base de contatos?"
        value={data.wantsImport}
        onChange={(wantsImport) => onChange({ ...data, wantsImport })}
      />

      <Reveal show={data.wantsImport}>
        <div className="grid gap-4 rounded-xl bg-brand-light p-4 sm:grid-cols-2">
          <Field label="Origem da base">
            <Input
              value={data.source}
              onChange={(e) => onChange({ ...data, source: e.target.value })}
              placeholder="Ex: Planilha do ERP, agenda atual..."
            />
          </Field>
          <Field label="Quantidade aproximada de contatos">
            <Input
              type="number"
              min={1}
              value={data.approxCount}
              onChange={(e) => onChange({ ...data, approxCount: e.target.value })}
              placeholder="Ex: 3000"
            />
          </Field>
          <Field label="Responsável pelo envio">
            <Input
              value={data.responsible}
              onChange={(e) => onChange({ ...data, responsible: e.target.value })}
              placeholder="Nome do responsável"
            />
          </Field>
          <Field label="Arquivo da base de contatos">
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={!onUpload || uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file || !onUpload) return;
                setError(null); setUploading(true);
                try { await onUpload(file); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar o CSV."); }
                finally { setUploading(false); event.target.value = ""; }
              }}
              className="w-full rounded-xl border border-border-soft bg-white px-4 py-2.5 text-sm text-brand/60 file:mr-3 file:rounded-full file:border-0 file:bg-selected file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
            />
            <p className="mt-1 text-xs text-muted-foreground">CSV de até 10 MB, com nome, telefone/WhatsApp ou e-mail.</p>
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Enviando e validando arquivo…</p>}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {data.contactImport && <p className="mt-1 text-xs text-emerald-700">{data.contactImport.originalName}: {data.contactImport.validRows} contatos válidos para revisão.</p>}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Observações">
              <Textarea
                value={data.notes}
                onChange={(e) => onChange({ ...data, notes: e.target.value })}
                placeholder="Alguma particularidade sobre essa base?"
              />
            </Field>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
