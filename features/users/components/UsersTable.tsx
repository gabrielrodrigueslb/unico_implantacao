"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KeyIcon, MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ROLE_LABELS, type AdminUser } from "@/features/auth/types";
import { isStrongPassword, passwordRequirements } from "@/features/auth/password-strength";
import { deleteUser, resetUserPassword } from "../api";
import { UserFormSheet } from "./UserFormSheet";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  /** Só pra desativar as ações destrutivas na própria linha — a API já recusa de qualquer forma. */
  currentUserId: string;
}) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resettingUser) return;
    if (!isStrongPassword(newPassword)) {
      toast.error("A senha não atende aos requisitos de segurança");
      return;
    }
    setBusyId(resettingUser.id);
    try {
      await resetUserPassword(resettingUser.id, newPassword);
      toast.success("Senha redefinida");
      setResettingUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível redefinir a senha");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Remover o acesso de "${user.name}" ao painel?`)) return;
    setBusyId(user.id);
    try {
      await deleteUser(user.id);
      toast.success("Usuário removido");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o usuário");
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhum usuário cadastrado</p>
        <p className="text-sm text-muted-foreground">
          Crie o primeiro acesso adicional ao painel administrativo.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {ADMIN_ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "outline"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLoginAt ? dateFormatter.format(new Date(user.lastLoginAt)) : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" disabled={busyId === user.id}>
                            <MoreHorizontalIcon />
                            <span className="sr-only">Ações</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <PencilIcon />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResettingUser(user)}>
                          <KeyIcon />
                          Redefinir senha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isSelf}
                          onClick={() => handleDelete(user)}
                        >
                          <TrashIcon />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <UserFormSheet
        editingUser={editingUser}
        hideTrigger
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      />

      <Dialog
        open={resettingUser !== null}
        onOpenChange={(open) => {
          if (!open && !busyId) {
            setResettingUser(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              {resettingUser && (
                <DialogDescription>
                  Defina uma nova senha para {resettingUser.name}.
                </DialogDescription>
              )}
            </DialogHeader>
            <DialogBody>
              <Label htmlFor="reset-password">Nova senha</Label>
              <PasswordInput
                id="reset-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={12}
                required
                className="mt-2"
              />
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground" aria-live="polite">
                {passwordRequirements(newPassword).map(([label, passed]) => (
                  <li key={label} className={passed ? "text-success" : undefined}>{passed ? "✓" : "○"} {label}</li>
                ))}
              </ul>
            </DialogBody>
            <DialogFooter className="justify-end">
              <Button type="button" variant="outline" onClick={() => setResettingUser(null)} disabled={Boolean(busyId)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={Boolean(busyId)}>
                {busyId ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
