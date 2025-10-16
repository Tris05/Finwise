"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { PortfolioPie } from "@/components/portfolio-pie"
import { RebalanceModal } from "@/components/rebalance-modal"
import { GamificationCard } from "@/components/gamification-card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import { formatINR } from "@/lib/utils"
import { AlertCircle, Info, CheckCircle2 } from "lucide-react"

const sample = [
  { name: "Stocks", value: 40 },
  { name: "Mutual Funds", value: 25 },
  { name: "PPF", value: 10 },
  { name: "FD", value: 10 },
  { name: "Gold", value: 10 },
  { name: "Crypto", value: 5 },
]

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const kpis = [
    { label: "Portfolio Value", value: formatINR(1250000), delta: "+8.3%" },
    { label: "Today’s Gain", value: formatINR(7600), delta: "+0.6%" },
    { label: "Top Performing Asset", value: "Stocks", delta: "+2.1%" },
    { label: "XP Gained This Week", value: "120 XP", delta: "" },
    { label: "Portfolio Growth %", value: "12.4%", delta: "" },
  ]
  const miniTrend = [
    { d: "Mon", v: 12 },
    { d: "Tue", v: 14 },
    { d: "Wed", v: 13 },
    { d: "Thu", v: 16 },
    { d: "Fri", v: 15 },
  ]

  const alerts = [
    { type: "warning", icon: Info, text: "Upcoming SIP in 3 days" },
    { type: "danger", icon: AlertCircle, text: "Credit card bill due in 2 days" },
    { type: "success", icon: CheckCircle2, text: "Goal “Travel” is 65% funded" },
  ]

  return (
    <QueryProvider>
      <AppShell>
        <div className="grid xl:grid-cols-3 gap-4 md:gap-5">
          <Card className="xl:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                Portfolio Summary
              </CardTitle>
              <Button onClick={() => setOpen(true)}>Rebalance Portfolio</Button>
            </CardHeader>
            <CardContent>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <PortfolioPie data={sample} />
              </motion.div>
            </CardContent>
          </Card>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <GamificationCard />
          </motion.div>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-5 gap-3">
              {kpis.map((k) => (
                <motion.div key={k.label} whileHover={{ scale: 1.02 }} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="text-lg font-semibold">{k.value}</div>
                  {k.delta && (
                    <div className="text-xs" style={{ color: "var(--chart-2)" }}>
                      {k.delta}
                    </div>
                  )}
                </motion.div>
              ))}
              <div className="md:col-span-2 h-28 rounded-md border p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={miniTrend}>
                    <XAxis dataKey="d" />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="v" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              {alerts.map((a, i) => {
                const Icon = a.icon
                const styles =
                  a.type === "danger"
                    ? { bg: "var(--alert-danger-bg)", fg: "var(--alert-danger-fg)" }
                    : a.type === "warning"
                      ? { bg: "var(--alert-warning-bg)", fg: "var(--alert-warning-fg)" }
                      : { bg: "var(--alert-success-bg)", fg: "var(--alert-success-fg)" }
                return (
                  <div
                    key={i}
                    className="rounded-md border px-3 py-2 text-sm flex items-center gap-2"
                    style={{ background: styles.bg, color: styles.fg, borderColor: "transparent" }}
                  >
                    <Icon size={16} />
                    <span>{a.text}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
        <RebalanceModal open={open} onOpenChange={setOpen} />
      </AppShell>
    </QueryProvider>
  )
}
