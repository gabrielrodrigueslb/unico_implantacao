import Link from "next/link"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { fetchImplantations, fetchImplantationStats } from "@/features/implantations/api"
import { ImplantationsTable } from "@/features/implantations/components/ImplantationsTable"
import { getAuthHeaders } from "@/lib/server-session"

export default async function AdminDashboardPage() {
  const headers = await getAuthHeaders()
  const [stats, recent] = await Promise.all([
    fetchImplantationStats(headers),
    fetchImplantations({ page: 1, pageSize: 5 }, headers),
  ])

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards byStatus={stats.byStatus} />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive createdPerDay={stats.createdPerDay} />
            </div>
            <div className="flex flex-col gap-4 px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Últimas implantações</h2>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/admin/implantations" />}
                >
                  Ver todas
                </Button>
              </div>
              <ImplantationsTable implantations={recent.data} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
