import { Field, Input } from "../components/FormField";
import { formatPhone } from "../format";
import type { OnboardingData } from "../types";

export function CompanyContactStep({
  data,
  onChange,
}: {
  data: OnboardingData["company"];
  onChange: (data: OnboardingData["company"]) => void;
}) {
  function update<K extends keyof OnboardingData["company"]>(
    key: K,
    value: OnboardingData["company"][K],
  ) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Responsável pelo preenchimento">
        <Input
          value={data.contactName}
          onChange={(e) => update("contactName", e.target.value)}
          placeholder="Nome completo"
        />
      </Field>
      <Field label="Cargo">
        <Input
          value={data.contactRole}
          onChange={(e) => update("contactRole", e.target.value)}
          placeholder="Ex: Gerente de atendimento"
        />
      </Field>
      <Field label="Telefone / WhatsApp">
        <Input
          value={data.contactPhone}
          onChange={(e) => update("contactPhone", formatPhone(e.target.value))}
          placeholder="(00) 00000-0000"
          inputMode="numeric"
          maxLength={15}
        />
      </Field>
      <Field label="Quantidade de lojas / unidades">
        <Input
          type="number"
          min={1}
          value={data.storeCount}
          onChange={(e) => update("storeCount", e.target.value)}
          placeholder="1"
        />
      </Field>
    </div>
  );
}
