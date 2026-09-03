import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { Field, Input, Textarea } from "../components/FormField";
import { Reveal } from "../components/Reveal";
import { ToggleQuestion } from "../components/ToggleQuestion";
import { CONTACT_SOURCE_OPTIONS, CONTACT_SOURCE_OTHER_VALUE, type OnboardingData } from "../types";
import { useState } from "react";

function isKnownSource(value: string): boolean {
  return (CONTACT_SOURCE_OPTIONS as readonly string[]).includes(value);
}

/** Passo a passo para exportar contatos do Android — só aparece quando a origem é WhatsApp. */
function WhatsappExportGuide() {
  return (
    <div className="rounded-xl border border-selected-border bg-selected p-4 text-sm text-brand">
      <p className="font-medium">Como exportar seus contatos (Android)</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-brand/70">
        <li>
          Baixe o aplicativo <span className="font-medium text-brand">Contact to Excel</span> na
          Play Store.
        </li>
        <li>Ao abri-lo, toque em &quot;Exportar contatos&quot; e conceda as permissões pedidas.</li>
        <li>Marque a opção de exportar no formato XLSX.</li>
        <li>Anexe aqui a planilha gerada.</li>
      </ol>
      <p className="mt-2 text-xs text-brand/50">
        Obs: a planilha pode ser enviada posteriormente ao seu implantador para ser adicionada ao
        sistema.
      </p>
    </div>
  );
}

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
  const [sourceMode, setSourceMode] = useState<"list" | "custom">(() =>
    data.source && !isKnownSource(data.source) ? "custom" : "list",
  );

  function handleSourceChange(value: string) {
    if (value === CONTACT_SOURCE_OTHER_VALUE) {
      setSourceMode("custom");
      onChange({ ...data, source: "", sourceOther: "" });
    } else {
      setSourceMode("list");
      onChange({ ...data, source: value, sourceOther: "" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleQuestion
        question="Deseja importar uma base de contatos?"
        value={data.wantsImport}
        onChange={(wantsImport) => onChange({ ...data, wantsImport })}
      />

      <Reveal show={data.wantsImport}>
        <div className="flex flex-col gap-4 rounded-xl bg-brand-light p-4">
          <p className="text-xs text-brand/50">
            Etapa opcional — não é necessária para concluir o onboarding. Você pode enviar a
            planilha de contatos agora ou depois, diretamente ao seu implantador.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Origem da base">
              <Select
                value={sourceMode === "custom" ? CONTACT_SOURCE_OTHER_VALUE : data.source}
                onValueChange={handleSourceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={CONTACT_SOURCE_OTHER_VALUE}>Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {sourceMode === "custom" && (
              <Field label="Qual outra origem?">
                <Input
                  value={data.sourceOther}
                  onChange={(e) => onChange({ ...data, sourceOther: e.target.value })}
                  placeholder="De onde vêm esses contatos?"
                />
              </Field>
            )}

            <div className="sm:col-span-2">
              <Field label="Arquivo da base de contatos">
                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={!onUpload || uploading}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file || !onUpload) return;
                    setError(null); setUploading(true);
                    try { await onUpload(file); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar o arquivo."); }
                    finally { setUploading(false); event.target.value = ""; }
                  }}
                  className="w-full rounded-xl border border-border-soft bg-card px-4 py-2.5 text-sm text-brand/60 file:mr-3 file:rounded-full file:border-0 file:bg-selected file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  CSV ou XLSX de até 10 MB. Não é necessário seguir um formato específico — o
                  arquivo é apenas anexado para revisão posterior do implantador.
                </p>
                {uploading && <p className="mt-1 text-xs text-muted-foreground">Enviando arquivo…</p>}
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                {data.contactImport && <p className="mt-1 text-xs text-emerald-700">{data.contactImport.originalName} anexado.</p>}
              </Field>
            </div>
          </div>

          {data.source === "WhatsApp" && <WhatsappExportGuide />}

          <Field label="Observações">
            <Textarea
              value={data.notes}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
              placeholder="Alguma particularidade sobre essa base?"
            />
          </Field>
        </div>
      </Reveal>
    </div>
  );
}
