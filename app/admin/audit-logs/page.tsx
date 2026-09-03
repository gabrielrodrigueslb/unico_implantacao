import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { fetchAuditLogActions, fetchAuditLogs } from "@/features/audit-logs/api";
import { AuditLogFilters } from "@/features/audit-logs/components/AuditLogFilters";
import { AuditLogsTable } from "@/features/audit-logs/components/AuditLogsTable";
import { fetchMe } from "@/features/auth/api";
import { getAuthHeaders } from "@/lib/server-session";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const PAGE_SIZE = 30;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string; page?: string }>;
}) {
  const { search, action, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const headers = await getAuthHeaders();
  const me = await fetchMe(headers);

  if (me.role !== "ADMIN") {
    return (
      <>
        <SiteHeader title="Auditoria" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Só administradores podem ver o log de auditoria.
        </div>
      </>
    );
  }

  const [{ data: logs, total }, actions] = await Promise.all([
    fetchAuditLogs({ page, pageSize: PAGE_SIZE, search, action }, headers),
    fetchAuditLogActions(headers),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (action) query.set("action", action);
  const queryString = query.toString() ? `&${query}` : "";

  return (
    <>
      <SiteHeader title="Auditoria" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
            <AuditLogFilters actions={actions} />
          </div>
          <div className="flex items-center justify-between px-4 lg:px-6">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "registro encontrado" : "registros encontrados"}
            </p>
          </div>
          <div className="px-4 lg:px-6">
            <AuditLogsTable logs={logs} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 lg:px-6">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeftIcon />
                    Anterior
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/audit-logs?page=${page - 1}${queryString}`} />}
                  >
                    <ChevronLeftIcon />
                    Anterior
                  </Button>
                )}
                {page >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Próxima
                    <ChevronRightIcon />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/audit-logs?page=${page + 1}${queryString}`} />}
                  >
                    Próxima
                    <ChevronRightIcon />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
