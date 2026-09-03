"use client";

import { useEffect, useRef } from "react";

/**
 * Confirmação pequena, ancorada no próprio botão que a abriu — para ações
 * destrutivas de baixo risco (remover um item de uma lista) onde um modal
 * grande e centralizado é desproporcional. Fecha ao clicar fora ou Esc.
 */
export function ConfirmPopover({
  open,
  onCancel,
  onConfirm,
  message,
  confirmLabel = "Remover",
  align = "end",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message: string;
  confirmLabel?: string;
  align?: "start" | "end";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute bottom-full z-20 mb-2 w-52 rounded-xl border border-border-soft bg-card p-3 shadow-lg ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      <p className="text-xs leading-snug text-brand/70">{message}</p>
      <div className="mt-2.5 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand/50 transition-colors hover:bg-brand-light"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
