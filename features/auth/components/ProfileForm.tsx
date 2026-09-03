"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "../api";
import type { AdminUser } from "../types";

export function ProfileForm({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, email });
      toast.success("Perfil atualizado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação não bate com a nova senha");
      return;
    }
    setSavingPassword(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      toast.success("Senha alterada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar a senha");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dados da conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-name">Nome</Label>
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={savingProfile} className="w-fit">
              {savingProfile ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPassword} className="w-fit">
              {savingPassword ? "Alterando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
