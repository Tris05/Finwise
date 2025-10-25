"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

export function SalaryResultCard({
  data,
}: {
  data: {
    before: { component: string; amount: number }[]
    after: { component: string; amount: number }[]
    taxSavings: number
    bullets: string[]
  }
}) {
  const chart = data.before.map((b) => ({
    component: b.component,
    before: b.amount,
    after: data.after.find((a) => a.component === b.component)?.amount ?? 0,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="component" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="before" fill="var(--chart-2)" />
              <Bar dataKey="after" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm">Estimated Tax Savings: ₹{data.taxSavings.toLocaleString()}</div>
        <ul className="list-disc pl-5 text-sm">
          {data.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
