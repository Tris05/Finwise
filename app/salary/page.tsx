"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { SalaryOptimizerForm } from "@/components/salary-optimizer-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts"

const beforeAfter = [
  { label: "Basic", Before: 40000, After: 38000 },
  { label: "HRA", Before: 12000, After: 16000 },
  { label: "LTA", Before: 0, After: 3000 },
  { label: "Other", Before: 8000, After: 7000 },
]

export default function SalaryPage() {
  const totalBefore = beforeAfter.reduce((s, r) => s + r.Before, 0)
  const totalAfter = beforeAfter.reduce((s, r) => s + r.After, 0)
  const savings = totalBefore - totalAfter

  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <SalaryOptimizerForm />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Before vs After (Monthly)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfter}>
                    <XAxis dataKey="label" />
                    <Tooltip />
                    <Bar dataKey="Before" fill="var(--chart-6)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="After" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tip of the Day</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                💡 Increase HRA to reduce tax by ₹2,400. Consider NPS for additional 80CCD(1B) benefit.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div>Total Before: ₹{totalBefore.toLocaleString("en-IN")}</div>
                <div>Total After: ₹{totalAfter.toLocaleString("en-IN")}</div>
                <div className="font-medium" style={{ color: "var(--chart-2)" }}>
                  Total Savings: ₹{savings.toLocaleString("en-IN")}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
