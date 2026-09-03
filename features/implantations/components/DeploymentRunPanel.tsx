"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { retryDeploymentJob } from "../api";
import { JOB_STATUS_BADGE_VARIANT, JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../status";
import type { DeploymentRun } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function DeploymentRunPanel({
  implantationId,
  run,
}: {
  implantationId: string;
  run: DeploymentRun;
}) {
  const router = useRouter();
  const [retryingType, setRetryingType] = useState<string | null>(null);

  async function handleRetry(type: (typeof run.jobs)[number]["type"]) {
    setRetryingType(type);
    try {
      await retryDeploymentJob(implantationId, type);
      toast.success("Etapa reenviada para processamento");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível reprocessar a etapa");
    } finally {
      setRetryingType(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Execução da automação
          <Badge variant={run.status === "COMPLETED" ? "success" : run.status === "FAILED" || run.status === "PARTIALLY_FAILED" ? "destructive" : "secondary"}>
            {run.status === "RUNNING" && "Em execução"}
            {run.status === "COMPLETED" && "Concluída"}
            {run.status === "PARTIALLY_FAILED" && "Falha parcial"}
            {run.status === "FAILED" && "Falhou"}
          </Badge>
          {run.status === "RUNNING" && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Atualizando automaticamente
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y p-0">
        {run.jobs.map((job) => (
          <div key={job.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{JOB_TYPE_LABELS[job.type]}</span>
              {job.error && <span className="text-xs text-destructive">{job.error}</span>}
              {job.finishedAt && !job.error && (
                <span className="text-xs text-muted-foreground">
                  Concluída em {dateTimeFormatter.format(new Date(job.finishedAt))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={JOB_STATUS_BADGE_VARIANT[job.status]}>
                {job.status === "RUNNING" && <Loader2Icon className="animate-spin" />}
                {JOB_STATUS_LABELS[job.status]}
              </Badge>
              {job.status === "FAILED" && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={retryingType === job.type}
                  onClick={() => handleRetry(job.type)}
                >
                  <RefreshCcwIcon />
                  <span className="sr-only">Reprocessar</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
