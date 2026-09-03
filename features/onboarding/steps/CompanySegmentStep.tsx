import { ChoiceCard } from "../components/ChoiceCard";
import { Reveal } from "../components/Reveal";
import { SEGMENT_OPTIONS, type OnboardingData } from "../types";

export function CompanySegmentStep({
  data,
  onChange,
}: {
  data: OnboardingData["company"];
  onChange: (data: OnboardingData["company"]) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-3.5 sm:grid-cols-2">
        {SEGMENT_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            icon={option.icon}
            title={option.title}
            subtitle={option.subtitle}
            selected={data.segment === option.value}
            onClick={() => onChange({ ...data, segment: option.value })}
          />
        ))}
      </div>

      <Reveal show={data.segment === "generico"}>
        <div className="flex w-full max-w-[400px] items-center gap-2 rounded-xl border border-border-soft py-3 pl-3 pr-5">
          <input
            value={data.otherSegmentLabel}
            onChange={(e) => onChange({ ...data, otherSegmentLabel: e.target.value })}
            placeholder="Qual seu segmento?"
            className="min-w-0 flex-1 bg-transparent text-base text-brand outline-none placeholder:text-brand/40"
          />
          <span className="text-sm font-bold text-red-500/60">*</span>
        </div>
      </Reveal>
    </div>
  );
}
