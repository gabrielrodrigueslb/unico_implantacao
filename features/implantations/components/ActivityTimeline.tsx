import { Badge } from "@/components/ui/badge";
import { auditActionLabel } from "@/features/audit-logs/labels";
import { JOB_STATUS_BADGE_VARIANT, JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../status";
import type { ActivityEvent, DeploymentJobStatus, DeploymentJobType } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function eventLabel(event: ActivityEvent): string {
  if (event.kind === "audit") return auditActionLabel(event.label);
  if (event.kind === "deployment_job") return JOB_TYPE_LABELS[event.label as DeploymentJobType] ?? event.label;
  return event.label;
}

function eventBadge(event: ActivityEvent) {
  if (event.kind === "deployment_job" && event.status) {
    const status = event.status as DeploymentJobStatus;
    return <Badge variant={JOB_STATUS_BADGE_VARIANT[status]}>{JOB_STATUS_LABELS[status]}</Badge>;
  }
  return null;
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhuma atividade registrada ainda</p>
        <p className="text-sm text-muted-foreground">
          Ações feitas a partir de agora aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-5 border-l pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute top-1 -left-[25px] size-2.5 rounded-full border-2 border-background bg-muted-foreground" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{eventLabel(event)}</span>
            {eventBadge(event)}
          </div>
          <p className="text-xs text-muted-foreground">
            {dateTimeFormatter.format(new Date(event.at))}
            {event.actorName ? ` · ${event.actorName}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
