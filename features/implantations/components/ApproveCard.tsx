"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { approveImplantation } from "../api";

export function ApproveCard({
  implantationId,
  approverName,
}: {
  implantationId: string;
  /** Informativo; a API deriva a autoria exclusivamente da sessão. */
  approverName: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(event: React.FormEvent) {
    event.preventDefault();
    if (!confirm("Aprovar esta implantação e iniciar a automação agora?")) return;

    setSubmitting(true);
    setError(null);
    try {
      await approveImplantation(implantationId);
      toast.success("Implantação aprovada — automação iniciada");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aprovar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-accent/40">
      <CardHeader>
        <CardTitle className="text-sm">Aprovar e iniciar implantação</CardTitle>
        <CardDescription>
          Revise todos os dados nas abas acima. Após aprovar, a automação é disparada
          imediatamente e as configurações passam a ser somente leitura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleApprove} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <p className="flex-1 text-sm text-muted-foreground">
            A aprovação será registrada automaticamente em nome de <strong className="text-foreground">{approverName}</strong>.
          </p>
          <Button type="submit" disabled={submitting}>
            <CheckIcon />
            {submitting ? "Aprovando..." : "Aprovar e iniciar implantação"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
