"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { ConfirmPopover } from "../components/ConfirmPopover";
import { createId } from "../initial-data";
import type { OnboardingData, TagDraft } from "../types";

// Mesmo padrão de "adicionar" usado em motivos de encerramento
// (EditableChipList): campo + botão sempre visíveis, sem modal.
function TagList({
  tags,
  onToggle,
  onAdd,
  onRemove,
}: {
  tags: TagDraft[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<TagDraft | null>(null);

  function handleAdd() {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={`relative flex items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-3.5 text-sm font-medium transition-colors ${
                tag.enabled
                  ? "border-selected-border bg-selected text-accent"
                  : "border-border-soft text-brand/40 hover:border-brand/40"
              }`}
            >
              <button type="button" onClick={() => onToggle(tag.id)} className="outline-none">
                {tag.enabled ? "✓ " : ""}
                {tag.name}
              </button>
              <button
                type="button"
                onClick={() => setPendingRemoval(tag)}
                aria-label={`Remover ${tag.name}`}
                className="rounded-full p-0.5 opacity-60 transition-colors hover:bg-black/10 hover:text-red-500 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
              <ConfirmPopover
                open={pendingRemoval?.id === tag.id}
                onCancel={() => setPendingRemoval(null)}
                onConfirm={() => {
                  onRemove(tag.id);
                  setPendingRemoval(null);
                }}
                message={`Remover a etiqueta "${tag.name}"?`}
              />
            </motion.div>
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
          placeholder="Nome da nova etiqueta"
          className="w-full max-w-[240px] rounded-xl border border-border-soft bg-white px-3 py-2 text-sm text-brand outline-none placeholder:text-brand/40 focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-xl border border-brand/40 px-3 py-2 text-sm font-medium text-brand/80 hover:bg-brand-light"
        >
          <Plus className="size-3.5" />
          Adicionar
        </button>
      </div>
    </div>
  );
}

export function TagsStep({
  data,
  onChange,
}: {
  data: OnboardingData["customization"];
  onChange: (data: OnboardingData["customization"]) => void;
}) {
  function toggleContactTag(id: string) {
    onChange({
      ...data,
      contactTags: data.contactTags.map((tag) =>
        tag.id === id ? { ...tag, enabled: !tag.enabled } : tag,
      ),
    });
  }

  function addContactTag(name: string) {
    onChange({
      ...data,
      contactTags: [...data.contactTags, { id: createId("contact-tag"), name, enabled: true }],
    });
  }

  function removeContactTag(id: string) {
    onChange({ ...data, contactTags: data.contactTags.filter((tag) => tag.id !== id) });
  }

  function toggleChatTag(id: string) {
    onChange({
      ...data,
      chatTags: data.chatTags.map((tag) =>
        tag.id === id ? { ...tag, enabled: !tag.enabled } : tag,
      ),
    });
  }

  function addChatTag(name: string) {
    onChange({
      ...data,
      chatTags: [...data.chatTags, { id: createId("chat-tag"), name, enabled: true }],
    });
  }

  function removeChatTag(id: string) {
    onChange({ ...data, chatTags: data.chatTags.filter((tag) => tag.id !== id) });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-1 text-sm text-brand/40">Etiquetas de contato</h2>
        <p className="mb-3 text-xs text-brand/40">
          Associadas permanentemente ao cadastro do cliente.
        </p>
        <TagList
          tags={data.contactTags}
          onToggle={toggleContactTag}
          onAdd={addContactTag}
          onRemove={removeContactTag}
        />
      </div>

      <div>
        <h2 className="mb-1 text-sm text-brand/40">Etiquetas de chat</h2>
        <p className="mb-3 text-xs text-brand/40">
          Utilizadas durante um atendimento específico.
        </p>
        <TagList
          tags={data.chatTags}
          onToggle={toggleChatTag}
          onAdd={addChatTag}
          onRemove={removeChatTag}
        />
      </div>
    </div>
  );
}
