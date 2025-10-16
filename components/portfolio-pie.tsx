"use client"

import { useMemo, useState } from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts"
import { formatINR } from "@/lib/utils"

export type PortfolioSlice = { name: string; value: number; color?: string }

// Colorful palette using theme tokens with safe fallbacks
const BASE_COLORS = [
  "var(--chart-1, #42A5F5)",
  "var(--chart-2, #66BB6A)",
  "var(--chart-3, #FFD54F)",
  "var(--chart-4, #26C6DA)",
  "var(--chart-5, #AB47BC)",
  "var(--chart-6, #FF7043)",
]

function pct(val: number, total: number) {
  const p = total > 0 ? (val / total) * 100 : 0
  return Number.isFinite(p) ? p : 0
}

function isPercentTotal(total: number) {
  // treat as percentage when total is approximately 100
  return Math.abs(total - 100) <= 0.5
}

function formatValueDisplay(value: number, total: number) {
  return isPercentTotal(total) ? `${value.toFixed(1)}%` : formatINR(value)
}

function formatPercentDisplay(value: number, total: number) {
  return `${pct(value, total).toFixed(1)}%`
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: any[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const v: number = item?.value ?? 0
  const name: string = item?.name ?? item?.payload?.name ?? "Value"
  return (
    <div className="rounded-md border bg-background/95 px-2.5 py-1.5 text-xs shadow-xl">
      <div className="mb-0.5 font-medium">{name}</div>
      <div className="font-mono tabular-nums">
        {formatValueDisplay(v, total)} <span className="text-muted-foreground">({formatPercentDisplay(v, total)})</span>
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180
function renderLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (!percent || percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="pointer-events-none select-none"
      style={{ fontSize: 10, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function PortfolioPie({
  data,
  onSliceClick,
}: {
  data: PortfolioSlice[]
  onSliceClick?: (s: PortfolioSlice) => void
}) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Build colors from fixed palette with optional per-slice override
  const colors = useMemo(() => data.map((d, i) => d.color ?? BASE_COLORS[i % BASE_COLORS.length]), [data])

  const LegendContent = useMemo(
    () =>
      function LegendContentImpl() {
        return (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {data.map((d, i) => {
              const color = colors[i]
              const valLabel = formatValueDisplay(d.value, total)
              const pLabel = formatPercentDisplay(d.value, total)
              return (
                <div
                  key={d.name}
                  className="flex items-center gap-2 rounded-sm px-2 py-1 text-xs"
                  style={{ background: "transparent" }}
                >
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-mono tabular-nums">
                    {valLabel}
                    <span className="text-muted-foreground"> ({pLabel})</span>
                  </span>
                </div>
              )
            })}
          </div>
        )
      },
    [data, total, colors],
  )

  return (
    <div className="h-80 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            isAnimationActive
            animationBegin={120}
            animationDuration={800}
            animationEasing="ease-out"
            dataKey="value"
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={35}
            outerRadius={65}
            activeIndex={activeIndex ?? -1}
            activeShape={(props) => <Sector {...props} outerRadius={(props.outerRadius as number) + 5} />}
            onClick={(_, i) => onSliceClick?.(data[i])}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={colors[index]}
                stroke={"var(--card)"}
                strokeWidth={1}
                cursor="pointer"
              />
            ))}
          </Pie>

          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            fill="hsl(var(--foreground))"
            style={{ fontWeight: 600 }}
          >
            
          </text>

          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend content={LegendContent} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
