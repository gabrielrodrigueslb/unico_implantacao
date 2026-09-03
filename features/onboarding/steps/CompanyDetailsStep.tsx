"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { lookupCnpj } from "../cnpj-lookup";
import { Field, Input } from "../components/FormField";
import { formatCNPJ, onlyDigits } from "../format";
import { ERP_OPTIONS, ERP_OTHER_VALUE, type OnboardingData } from "../types";

function isKnownErp(value: string): boolean {
  return (ERP_OPTIONS as readonly string[]).includes(value);
}

export function CompanyDetailsStep({
  data,
  onChange,
}: {
  data: OnboardingData["company"];
  onChange: (data: OnboardingData["company"]) => void;
}) {
  const lastLookedUpRef = useRef<string | null>(null);
  const [erpMode, setErpMode] = useState<"list" | "custom">(() =>
    data.erp && !isKnownErp(data.erp) ? "custom" : "list",
  );

  function update<K extends keyof OnboardingData["company"]>(
    key: K,
    value: OnboardingData["company"][K],
  ) {
    onChange({ ...data, [key]: value });
  }

  function handleErpChange(value: string) {
    if (value === ERP_OTHER_VALUE) {
      setErpMode("custom");
      update("erp", "");
    } else {
      setErpMode("list");
      update("erp", value);
    }
  }

  // Preenche razão social/nome fantasia em silêncio quando o CNPJ é
  // reconhecido — sem indicar ao cliente que isso está acontecendo.
  useEffect(() => {
    const digits = onlyDigits(data.cnpj);
    if (digits.length !== 14 || lastLookedUpRef.current === digits) return;

    lastLookedUpRef.current = digits;

    let cancelled = false;
    lookupCnpj(digits).then((result) => {
      if (cancelled || !result) return;
      onChange({
        ...data,
        legalName: result.legalName || data.legalName,
        tradeName: result.tradeName || data.tradeName,
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cnpj]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="CNPJ">
        <Input
          value={data.cnpj}
          onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          maxLength={18}
        />
      </Field>
      <Field label="Razão social">
        <Input
          value={data.legalName}
          onChange={(e) => update("legalName", e.target.value)}
          placeholder="Empresa LTDA"
        />
      </Field>
      <Field label="Nome fantasia / rede">
        <Input
          value={data.tradeName}
          onChange={(e) => update("tradeName", e.target.value)}
          placeholder="Nome da rede"
        />
      </Field>
      <Field label="E-mail de contato">
        <Input
          type="email"
          value={data.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          placeholder="voce@empresa.com"
        />
      </Field>
      <Field label="Sistema de gestão / ERP utilizado">
        <Select value={erpMode === "custom" ? ERP_OTHER_VALUE : data.erp} onValueChange={handleErpChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o sistema" />
          </SelectTrigger>
          <SelectContent>
            {ERP_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
            <SelectItem value={ERP_OTHER_VALUE}>Outro</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <AnimatePresence>
        {erpMode === "custom" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <Field label="Qual sistema vocês usam?">
              <Input
                value={data.erp}
                onChange={(e) => update("erp", e.target.value)}
                placeholder="Nome do sistema"
              />
            </Field>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
