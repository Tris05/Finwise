"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { RebalanceModal } from "@/components/rebalance-modal"
import { CreditCardList } from "@/components/credit-card-list"
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts"

const perf3m = [
  { m: "Aug", Stocks: 6, "Mutual Funds": 4, Gold: 2, Crypto: 8 },
  { m: "Sep", Stocks: 3, "Mutual Funds": 5, Gold: 3, Crypto: 2 },
  { m: "Oct", Stocks: 5, "Mutual Funds": 6, Gold: 4, Crypto: 3 },
]

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  )
}

export default function InvestmentsPage() {
  const [open, setOpen] = useState(false)
  return (
    <QueryProvider>
      <AppShell>
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="relative">
                <span>Smart Asset Allocation</span>
                <span className="absolute left-0 -bottom-1 h-0.5 w-24 bg-[var(--color-accent)]/70" />
              </CardTitle>
              <Button onClick={() => setOpen(true)}>Rebalance Portfolio</Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Reinforcement learning powered suggestions adapt to your behavior and market trends.
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag label="Stocks" color="var(--chart-4)" />
                <Tag label="Mutual Funds" color="var(--chart-2)" />
                <Tag label="Gold" color="var(--chart-3)" />
                <Tag label="Crypto" color="var(--chart-5)" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Credit Card Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <CreditCardList />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                Market Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">NIFTY 50: +0.8% • Top: INFY, RELIANCE</div>
              <div className="rounded-md border p-3">Gold (24K): ₹6,200/g • +0.3%</div>
              <div className="rounded-md border p-3">BTC: ₹57,20,000 • -1.2%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>3-Month Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf3m}>
                  <XAxis dataKey="m" />
                  <Tooltip />
                  <Bar dataKey="Stocks" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Mutual Funds" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gold" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Crypto" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <RebalanceModal open={open} onOpenChange={setOpen} />
      </AppShell>
    </QueryProvider>
  )
}
