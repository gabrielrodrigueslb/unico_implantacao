import { Minus, Plus } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldClasses =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-base text-brand outline-none transition-colors placeholder:text-brand/40 focus:border-accent";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  /**
   * Id do controle real dentro do campo. Sem isso, o navegador direciona
   * qualquer clique dentro do <label> para o primeiro elemento clicável que
   * encontrar — o que, em campos com mais de um controle (ex: NumberInput,
   * com botões de +/-), aciona o botão errado em vez de focar o input.
   */
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-sm text-brand/40">{label}</span>
      {children}
      {hint ? <span className="text-xs text-brand/40">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`${fieldClasses} resize-none ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

/** Campo numérico com botões de +/- ao lado, para valores curtos (contagens, limites). */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  function bump(delta: number) {
    const next = (Number(value) || 0) + delta;
    const clamped =
      min !== undefined && next < min ? min : max !== undefined && next > max ? max : next;
    onChange(String(clamped));
  }

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-xl border border-border-soft bg-white transition-colors focus-within:border-accent ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => bump(-step)}
        aria-label="Diminuir"
        className="flex w-10 shrink-0 items-center justify-center text-brand/40 transition-colors hover:bg-brand-light hover:text-brand"
      >
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full min-w-0 border-x border-border-soft bg-transparent px-2 py-3 text-center text-base text-brand outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => bump(step)}
        aria-label="Aumentar"
        className="flex w-10 shrink-0 items-center justify-center text-brand/40 transition-colors hover:bg-brand-light hover:text-brand"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
