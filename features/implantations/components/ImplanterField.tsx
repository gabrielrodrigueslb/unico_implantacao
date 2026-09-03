"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AdminUser } from "@/features/auth/types";
import { updateImplantation } from "../api";

const UNASSIGNED = "__unassigned__";

/** Quem de fato conduziu a implantação — separado de "responsável" (quem criou o registro). */
export function ImplanterField({
  implantationId,
  implanterId,
  users,
}: {
  implantationId: string;
  implanterId: string | null;
  users: AdminUser[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(value: string | null) {
    if (!value) return;
    setSaving(true);
    try {
      await updateImplantation(implantationId, {
        implanterId: value === UNASSIGNED ? null : value,
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o implantador");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select value={implanterId ?? UNASSIGNED} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-8 w-full max-w-[220px] text-sm">
        <SelectValue placeholder="Não atribuído">
          {(value: string) =>
            value === UNASSIGNED ? "Não atribuído" : (users.find((u) => u.id === value)?.name ?? value)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Não atribuído</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
