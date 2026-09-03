"use client";

import { useState } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/onboarding-ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import {
  ROLE_LABELS,
  ROLES_REQUIRING_EXTENSION,
  type QueueDraft,
  type UserDraft,
  type UserQuotas,
  type UserRole,
} from "../types";
import { createId } from "../initial-data";
import { Field, Input } from "./FormField";
import { Reveal } from "./Reveal";
import { RoleIcon } from "./RoleIcon";

const ROLE_ORDER: UserRole[] = ["atendente", "supervisor", "administrador"];

/**
 * Cria (quando `editingUser` é `null`) ou edita um usuário. O clique em
 * "+ Adicionar" na barra rápida de TeamStep só abre este modal com cargo e
 * nome pré-preenchidos — o usuário só é de fato criado ao salvar aqui
 * dentro, como nas filas de atendimento.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  initialName,
  initialRole,
  queues,
  userQuotas,
  roleCounts,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserDraft | null;
  /** Nome já digitado na barra rápida — só usado para pré-preencher a criação. */
  initialName: string;
  /** Cargo já selecionado na barra rápida — só usado para pré-preencher a criação. */
  initialRole: UserRole;
  queues: QueueDraft[];
  userQuotas: UserQuotas;
  roleCounts: Record<UserRole, number>;
  onSave: (user: UserDraft) => void;
}) {
  const [draft, setDraft] = useState<UserDraft | null>(null);

  // Reinicializa o formulário toda vez que o modal abre — ajuste de estado
  // durante o render (não em efeito), como recomendado pelo React.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setDraft(
        editingUser ?? {
          id: createId("user"),
          name: initialName,
          username: "",
          extension: "",
          role: initialRole,
          queueIds: [],
        },
      );
    }
  }

  function update(patch: Partial<UserDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function toggleQueue(queueId: string) {
    if (!draft) return;
    const queueIds = draft.queueIds.includes(queueId)
      ? draft.queueIds.filter((id) => id !== queueId)
      : [...draft.queueIds, queueId];
    update({ queueIds });
  }

  function handleSave() {
    if (!draft || !canSave(draft)) return;
    onSave(draft);
    onOpenChange(false);
  }

  const hasRoom = (role: UserRole) => !userQuotas || roleCounts[role] < userQuotas[role];

  function requiresExtension(role: UserRole) {
    return (ROLES_REQUIRING_EXTENSION as readonly UserRole[]).includes(role);
  }

  function canSave(user: UserDraft) {
    if (!user.name.trim()) return false;
    if (requiresExtension(user.role) && !(user.extension ?? "").trim()) return false;
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {draft ? (
          <>
            <DialogHeader title={editingUser ? "Editar usuário" : "Novo usuário"} />
            <DialogBody className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <Input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </Field>
                <Field label="Usuário" hint="Login usado para acessar o Atender Bem.">
                  <Input
                    value={draft.username}
                    onChange={(e) => update({ username: e.target.value.replace(/\s/g, "") })}
                    placeholder="usuario.login"
                  />
                </Field>
              </div>

              <Field label="Perfil">
                <Select value={draft.role} onValueChange={(value) => update({ role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_ORDER.map((role) => {
                      const disabled = role !== draft.role && !hasRoom(role);
                      return (
                        <SelectItem key={role} value={role} disabled={disabled}>
                          <span className="flex items-center gap-2">
                            <RoleIcon role={role} className="size-3.5" />
                            {ROLE_LABELS[role]}
                            {disabled ? " (limite atingido)" : ""}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Reveal show={requiresExtension(draft.role)}>
                <Field label="Ramal" hint="Número do ramal telefônico deste usuário.">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={draft.extension}
                    onChange={(e) => update({ extension: e.target.value.replace(/\D/g, "") })}
                    placeholder="Ex: 1010"
                  />
                </Field>
              </Reveal>

              {/* Div (não Field/<label>) de propósito: o label envolveria vários
                  botões de fila e o navegador encaminharia qualquer clique
                  vazio para o primeiro deles. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-brand/40">Filas de acesso</span>
                {queues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {queues.map((queue) => {
                      const active = draft.queueIds.includes(queue.id);
                      return (
                        <button
                          key={queue.id}
                          type="button"
                          onClick={() => toggleQueue(queue.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            active
                              ? "border-brand bg-brand-light text-brand"
                              : "border-border-soft text-brand/50 hover:border-brand/40"
                          }`}
                        >
                          {queue.name || "Fila sem nome"}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-brand/40">
                    Cadastre filas na etapa anterior para vinculá-las a este usuário.
                  </p>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!canSave(draft)} className="flex-1">
                Salvar usuário
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
