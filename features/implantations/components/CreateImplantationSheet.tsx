"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { formatCNPJ } from "@/features/onboarding/format";
import { createImplantation, fullOnboardingLink } from "../api";
import type { Plan } from "../types";

export function CreateImplantationSheet({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setInstanceUrl("");
    setPlanId(null);
    setCompanyName("");
    setCnpj("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!planId) {
      setError("Selecione o plano contratado");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const implantation = await createImplantation({
        instanceUrl,
        planId: Number(planId),
        companyName: companyName.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
      });
      setOpen(false);
      reset();
      router.refresh();
      try {
        await navigator.clipboard.writeText(fullOnboardingLink(implantation.onboardingToken));
        toast.success("Implantação criada e link de onboarding copiado");
      } catch {
        toast.success("Implantação criada");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a implantação");
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
      <SheetTrigger
        render={
          <Button>
            <PlusIcon />
            Nova implantação
          </Button>
        }
      />
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Nova solicitação de implantação</SheetTitle>
            <SheetDescription>
              A instância já deve existir no Atender Bem. Informe o link dela e o plano
              contratado para gerar o link de onboarding do cliente.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instanceUrl">Link da instância</Label>
              <Input
                id="instanceUrl"
                placeholder="cliente.atenderbem.com"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="planId">Plano contratado</Label>
              <Select value={planId} onValueChange={(value) => setPlanId(value)}>
                <SelectTrigger id="planId" className="w-full">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Empresa (opcional)</Label>
              <Input
                id="companyName"
                placeholder="Preenchido pelo cliente se deixado em branco"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                maxLength={18}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <SheetFooter className="flex-row justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </SheetClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar implantação"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
