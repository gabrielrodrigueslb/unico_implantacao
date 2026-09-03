import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auditActionLabel, entityTypeLabel } from "../labels";
import type { AuditLog } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Resumo de uma linha em texto — metadata é livre por ação, não vale a pena tabelar campo a campo. */
function summarizeMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhum registro encontrado</p>
        <p className="text-sm text-muted-foreground">Ajuste a busca ou o filtro de ação.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Quem</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Onde</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const detail = summarizeMetadata(log.metadata);
            return (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {dateTimeFormatter.format(new Date(log.createdAt))}
                </TableCell>
                <TableCell className="font-medium">{log.actorName}</TableCell>
                <TableCell>{auditActionLabel(log.action)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {log.entityType === "Implantation" && log.entityId ? (
                    <Link
                      href={`/admin/implantations/${log.entityId}`}
                      className="hover:underline"
                    >
                      {entityTypeLabel(log.entityType)}
                    </Link>
                  ) : (
                    entityTypeLabel(log.entityType)
                  )}
                </TableCell>
                <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                  {detail ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
