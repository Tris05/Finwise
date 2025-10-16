"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { LoanCalculator } from "@/components/loan-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts"

const gauge = [{ name: "EMI Stress", value: 62 }]

const compare = [
  { bank: "Bank A", rate: "10.1%", emi: "₹21,300" },
  { bank: "Bank B", rate: "10.6%", emi: "₹21,900" },
]

export default function LoanPage() {
  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <LoanCalculator />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>EMI Gauge</CardTitle>
              </CardHeader>
              <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={gauge} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0}>
                    <RadialBar minAngle={15} clockWise dataKey="value" fill="var(--chart-6)" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm mt-1">Stress: {gauge[0].value}% (target &lt; 40%)</div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Bank Comparison</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-3 gap-2 font-medium">
                  <div>Bank</div>
                  <div>Rate</div>
                  <div>EMI</div>
                </div>
                {compare.map((r) => (
                  <div key={r.bank} className="grid grid-cols-3 gap-2 border-b py-1.5">
                    <div>{r.bank}</div>
                    <div>{r.rate}</div>
                    <div>{r.emi}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Reduce tenure by 6 months to save approximately ₹5,600 in total interest.
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
