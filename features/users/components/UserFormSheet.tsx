"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ROLE_LABELS, type AdminRole, type AdminUser } from "@/features/auth/types";
import { isStrongPassword, passwordRequirements } from "@/features/auth/password-strength";
import { createUser, updateUser } from "../api";

/**
 * Cria (sem `editingUser`) ou edita um usuário do painel. Redefinir senha é
 * uma ação à parte (ver ResetPasswordAction) — não cabe aqui porque editar
 * cadastro e trocar credencial são operações com riscos bem diferentes.
 */
export function UserFormSheet({
  editingUser,
  trigger,
  hideTrigger = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  editingUser?: AdminUser | null;
  /** Omitido no modo de edição — a linha da tabela controla `open` por fora. */
  trigger?: React.ReactNode;
  /** A instância usada só para editar (aberta pela linha da tabela) não deve ter gatilho próprio. */
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const [name, setName] = useState(editingUser?.name ?? "");
  const [email, setEmail] = useState(editingUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(editingUser?.role ?? "MEMBER");
  const [active, setActive] = useState(editingUser?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(editingUser?.name ?? "");
    setEmail(editingUser?.email ?? "");
    setPassword("");
    setRole(editingUser?.role ?? "MEMBER");
    setActive(editingUser?.active ?? true);
    setError(null);
  }

  // Recarrega o formulário toda vez que o sheet abre — ajuste de estado
  // durante o render (não em efeito), como no UserFormDialog do onboarding.
  // Sem isso, o `useState` acima só lê `editingUser` na primeira montagem:
  // como este componente já existe na árvore com `editingUser` nulo (a
  // tabela só troca a prop depois), editar sempre mostraria o formulário
  // vazio em vez dos dados do usuário clicado.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser && !isStrongPassword(password)) {
      setError("A senha inicial não atende aos requisitos de segurança.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { name, email, role, active });
        toast.success("Usuário atualizado");
      } else {
        await createUser({ name, email, password, role });
        toast.success("Usuário criado");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o usuário");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : hideTrigger ? null : !editingUser ? (
        <SheetTrigger
          render={
            <Button>
              <PlusIcon />
              Novo usuário
            </Button>
          }
        />
      ) : null}
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{editingUser ? "Editar usuário" : "Novo usuário"}</SheetTitle>
            <SheetDescription>
              {editingUser
                ? "Altera os dados de acesso ao painel administrativo."
                : "Cria uma nova conta de acesso ao painel administrativo."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-email">E-mail</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!editingUser && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-password">Senha inicial</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  required
                />
                <PasswordStrengthHint password={password} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-role">Perfil</Label>
              <Select value={role} onValueChange={(value) => setRole(value as AdminRole)}>
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue>{(value: AdminRole) => ADMIN_ROLE_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {ADMIN_ROLE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
                Conta ativa
              </label>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <SheetFooter className="flex-row justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>Cancelar</SheetClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PasswordStrengthHint({ password }: { password: string }) {
  const requirements = passwordRequirements(password);
  return (
    <ul className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
      {requirements.map(([label, passed]) => (
        <li key={label} className={passed ? "text-green-700" : undefined}>
          {passed ? "✓" : "○"} {label}
        </li>
      ))}
    </ul>
  );
}
