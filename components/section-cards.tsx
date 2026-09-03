import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { STATUS_GROUPS } from "@/features/implantations/status"
import type { ImplantationStats } from "@/features/implantations/types"

const TONE_CLASSES = {
  neutral: "text-foreground",
  accent: "text-accent",
  warning: "text-warning",
  destructive: "text-destructive",
  success: "text-success",
} as const

const CARDS: {
  key: keyof typeof STATUS_GROUPS
  label: string
  tone: keyof typeof TONE_CLASSES
  highlight?: boolean
}[] = [
  { key: "aguardandoOnboarding", label: "Aguardando onboarding", tone: "neutral" },
  { key: "aguardandoRevisao", label: "Aguardando revisão", tone: "warning", highlight: true },
  { key: "emImplantacao", label: "Em implantação", tone: "accent" },
  { key: "comFalhas", label: "Com falhas", tone: "destructive" },
  { key: "concluidas", label: "Concluídas", tone: "success" },
]

export function SectionCards({ byStatus }: { byStatus: ImplantationStats["byStatus"] }) {
  const counts = Object.fromEntries(
    Object.entries(STATUS_GROUPS).map(([key, statuses]) => [
      key,
      statuses.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0),
    ]),
  )

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @6xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card">
      {CARDS.map((card) => (
        <Card
          key={card.key}
          className={cn(
            "@container/card",
            card.highlight && counts[card.key] > 0 && "ring-2 ring-warning",
          )}
        >
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
                TONE_CLASSES[card.tone],
              )}
            >
              {counts[card.key]}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
