"use client";

import { motion } from "motion/react";

export function ToggleQuestion({
  question,
  value,
  onChange,
}: {
  question: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border-soft bg-white px-4 py-3.5">
      <span className="text-sm font-medium text-brand">{question}</span>
      <div className="relative flex gap-1.5 rounded-full bg-brand-light p-1">
        <motion.span
          className="absolute inset-y-1 w-[calc(50%-6px)] rounded-full bg-brand"
          initial={false}
          animate={{ left: value ? 4 : "calc(50% + 2px)" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            value ? "text-white" : "text-brand/50 hover:text-brand"
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !value ? "text-white" : "text-brand/50 hover:text-brand"
          }`}
        >
          Não
        </button>
      </div>
    </div>
  );
}
