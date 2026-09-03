"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { CopyIcon, ExternalLinkIcon, EyeIcon, MoreHorizontalIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cancelImplantation, fullOnboardingLink, onboardingLink } from "../api";
import { canCancel } from "../status";
import type { Implantation } from "../types";
import { StatusBadge } from "./StatusBadge";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function ImplantationsTable({ implantations }: { implantations: Implantation[] }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCopyLink(token: string) {
    try {
      await navigator.clipboard.writeText(fullOnboardingLink(token));
      toast.success("Link de onboarding copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancelar esta solicitação de implantação?")) return;
    setCancellingId(id);
    try {
      await cancelImplantation(id);
      toast.success("Solicitação cancelada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cancelar");
    } finally {
      setCancellingId(null);
    }
  }

  if (implantations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhuma implantação cadastrada</p>
        <p className="text-sm text-muted-foreground">
          Crie uma nova implantação para gerar o link de onboarding do cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa / instância</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {implantations.map((implantation) => (
            <TableRow key={implantation.id}>
              <TableCell>
                <Link
                  href={`/admin/implantations/${implantation.id}`}
                  className="flex flex-col hover:underline"
                >
                  <span className="font-medium">
                    {implantation.companyName ?? implantation.instanceName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {implantation.instanceName}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={implantation.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {implantation.planName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(new Date(implantation.createdAt))}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Ações</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      render={<Link href={`/admin/implantations/${implantation.id}`} />}
                    >
                      <EyeIcon />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <Link
                          href={onboardingLink(implantation.onboardingToken)}
                          target="_blank"
                        />
                      }
                    >
                      <ExternalLinkIcon />
                      Ver onboarding
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCopyLink(implantation.onboardingToken)}
                    >
                      <CopyIcon />
                      Copiar link
                    </DropdownMenuItem>
                    {canCancel(implantation.status) && (
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={cancellingId === implantation.id}
                        onClick={() => handleCancel(implantation.id)}
                      >
                        <XIcon />
                        Cancelar solicitação
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
