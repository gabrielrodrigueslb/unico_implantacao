"use client";

import Image from "next/image";
import { CheckIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SEGMENT_OPTIONS, type OnboardingData } from "@/features/onboarding/types";

/**
 * Mesma escolha de segmento do onboarding do cliente, adaptada ao grid do
 * painel administrativo — cresce em até 4 colunas em vez de ficar solta no
 * meio do card, e deixa claro qual segmento está selecionado.
 */
export function CompanySegmentPicker({
  data,
  onChange,
}: {
  data: OnboardingData["company"];
  onChange: (data: OnboardingData["company"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SEGMENT_OPTIONS.map((option) => {
          const selected = data.segment === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...data, segment: option.value })}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-colors",
                selected
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-border hover:border-accent/40 hover:bg-muted",
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-accent text-white">
                  <CheckIcon className="size-2.5" />
                </span>
              )}
              <Image src={option.icon} alt="" width={40} height={40} className="shrink-0" />
              <div className="flex flex-col">
                <span className={cn("text-sm font-semibold", selected ? "text-accent" : "text-foreground")}>
                  {option.title}
                </span>
                <span className="text-xs text-muted-foreground">{option.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {data.segment === "generico" && (
        <Input
          value={data.otherSegmentLabel}
          onChange={(e) => onChange({ ...data, otherSegmentLabel: e.target.value })}
          placeholder="Qual o segmento?"
          className="max-w-xs"
        />
      )}
    </div>
  );
}
