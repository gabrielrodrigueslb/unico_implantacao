import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { fetchImplantations, fetchPlans } from "@/features/implantations/api"
import { CreateImplantationSheet } from "@/features/implantations/components/CreateImplantationSheet"
import { ImplantationsTable } from "@/features/implantations/components/ImplantationsTable"
import { RunStatusPoller } from "@/features/implantations/components/RunStatusPoller"
import { SearchBar } from "@/features/implantations/components/SearchBar"
import { getAuthHeaders } from "@/lib/server-session"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const PAGE_SIZE = 20

export default async function ImplantationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const headers = await getAuthHeaders()
  const [{ data: implantations, total }, plans] = await Promise.all([
    fetchImplantations({ page, pageSize: PAGE_SIZE, search: q }, headers),
    fetchPlans(headers),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const query = q ? `&q=${encodeURIComponent(q)}` : ""

  return (
    <>
      <RunStatusPoller
        active={implantations.some((i) => i.status === "QUEUED" || i.status === "RUNNING")}
      />
      <SiteHeader title="Implantações" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
            <SearchBar />
            <CreateImplantationSheet plans={plans} />
          </div>
          <div className="flex items-center justify-between px-4 lg:px-6">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "implantação encontrada" : "implantações encontradas"}
            </p>
          </div>
          <div className="px-4 lg:px-6">
            <ImplantationsTable implantations={implantations} />
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
                    render={<Link href={`/admin/implantations?page=${page - 1}${query}`} />}
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
                    render={<Link href={`/admin/implantations?page=${page + 1}${query}`} />}
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
  )
}
