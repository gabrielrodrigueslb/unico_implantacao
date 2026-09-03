"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { Field, Input } from "../components/FormField";
import { ChannelIcon } from "../components/ChannelIcon";
import { QueueFormDialog } from "../components/QueueFormDialog";
import { formatChannelIdentifier } from "../format";
import {
  CHANNEL_IDENTIFIER_LABELS,
  CHANNEL_IDENTIFIER_PLACEHOLDERS,
  CHANNEL_LABELS,
  type Channel,
  type OnboardingData,
  type QueueDraft,
} from "../types";

export function ServiceStep({
  data,
  onChange,
  companyName,
}: {
  data: OnboardingData["service"];
  onChange: (data: OnboardingData["service"]) => void;
  /** Nome da empresa (já digitado no onboarding), usado para preencher a mensagem de espera padrão. */
  companyName: string;
}) {
  const [draftChannel, setDraftChannel] = useState<Channel>("whatsapp");
  const [draftIdentifier, setDraftIdentifier] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<QueueDraft | null>(null);

  function openCreateDialog() {
    setEditingQueue(null);
    setDialogOpen(true);
  }

  function openEditDialog(queue: QueueDraft) {
    setEditingQueue(queue);
    setDialogOpen(true);
  }

  function handleSaveQueue(queue: QueueDraft) {
    const exists = data.queues.some((q) => q.id === queue.id);
    onChange({
      ...data,
      queues: exists
        ? data.queues.map((q) => (q.id === queue.id ? queue : q))
        : [...data.queues, queue],
    });
    setDraftIdentifier("");
  }

  function removeQueue(id: string) {
    onChange({ ...data, queues: data.queues.filter((q) => q.id !== id) });
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        

        <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
          <Field label="Canal de atendimento">
            <Select
              value={draftChannel}
              onValueChange={(value) => {
                setDraftChannel(value as Channel);
                setDraftIdentifier("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <ChannelIcon channel={value as Channel} />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={CHANNEL_IDENTIFIER_LABELS[draftChannel]}>
            <Input
              value={draftIdentifier}
              onChange={(e) => setDraftIdentifier(formatChannelIdentifier(draftChannel, e.target.value))}
              placeholder={CHANNEL_IDENTIFIER_PLACEHOLDERS[draftChannel]}
              className="h-[50px] py-0"
            />
          </Field>
          <Button
            type="button"
            variant="accent"
            onClick={openCreateDialog}
            className="h-[50px] justify-self-start px-6 py-0 text-base font-semibold items-center !gap-1"
          >
            <Plus size={18}/> Adicionar
          </Button>
        </div>
        
        <h2 className="mt-6 mb-1 text-sm text-brand/40">Filas de atendimento</h2>
        <div className="">
          {data.queues.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-soft px-4 py-8 text-center text-base text-brand/40">
              Sem fila de atendimento criada
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {data.queues.map((queue) => (
                  <motion.div
                    key={queue.id}
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand/70">
                          <ChannelIcon channel={queue.channel} className="size-3.5" />
                          {CHANNEL_LABELS[queue.channel]}
                        </span>
                        <span className="text-sm text-brand">{queue.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditDialog(queue)}
                          className="text-brand/40 hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQueue(queue.id)}
                          className="text-brand/40 hover:text-red-500"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <QueueFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          channel={draftChannel}
          initialIdentifier={draftIdentifier}
          companyName={companyName}
          existingQueues={data.queues}
          editingQueue={editingQueue}
          onSave={handleSaveQueue}
        />
      </div>
    </div>
  );
}
