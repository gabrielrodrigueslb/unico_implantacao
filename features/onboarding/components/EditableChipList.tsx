"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";

/** Lista de textos livres com adicionar/remover — usada em motivos de encerramento etc. */
export function EditableChipList({
  items,
  onAdd,
  onRemove,
  addPlaceholder = "Adicionar...",
}: {
  items: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  addPlaceholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.span
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 rounded-full border border-border-soft bg-white px-3 py-1.5 text-sm text-brand"
            >
              {item.name}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-brand/40 hover:text-red-500"
              >
                <X className="size-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={addPlaceholder}
          className="w-full max-w-[240px] rounded-xl border border-border-soft bg-white px-3 py-2 text-sm text-brand outline-none placeholder:text-brand/40 focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-xl border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          <Plus className="size-3.5" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
