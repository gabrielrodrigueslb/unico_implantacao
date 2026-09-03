"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  count: {
    label: "Implantações criadas",
    color: "var(--accent)",
  },
} satisfies ChartConfig

/** Preenche os últimos 90 dias com a contagem já agregada vinda do servidor (dias sem implantação ficam em 0). */
function fillDailyCounts(createdPerDay: { date: string; count: number }[]) {
  const counts = new Map(createdPerDay.map((d) => [d.date, d.count]))

  const days: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    days.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return days
}

export function ChartAreaInteractive({
  createdPerDay,
}: {
  createdPerDay: { date: string; count: number }[]
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile)

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile) {
      setTimeRange("7d")
    }
  }

  const dailyCounts = React.useMemo(() => fillDailyCounts(createdPerDay), [createdPerDay])

  const filteredData = React.useMemo(() => {
    const days = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90
    return dailyCounts.slice(-days)
  }, [dailyCounts, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Implantações criadas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Novas solicitações de implantação ao longo do tempo
          </span>
          <span className="@[540px]/card:hidden">Novas solicitações</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecione o período"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="count"
              type="natural"
              fill="url(#fillCount)"
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
