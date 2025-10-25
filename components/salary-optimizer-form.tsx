"use client"

import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { SalaryResultCard } from "./salary-result-card"

type OptimizeResponse = {
  before: { component: string; amount: number }[]
  after: { component: string; amount: number }[]
  taxSavings: number
  bullets: string[]
}

export function SalaryOptimizerForm() {
  const [ctc, setCtc] = useState(1200000)
  const [basicPct, setBasicPct] = useState(40)
  const [hraPct, setHraPct] = useState(40)
  const [lta, setLta] = useState(20000)

  const optimize = useMutation({
    mutationFn: async (): Promise<OptimizeResponse> => {
      const res = await fetch("/api/salary/optimize", {
        method: "POST",
        body: JSON.stringify({ ctc, basicPct, hraPct, lta }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Salary Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm flex items-center">CTC (₹)</label>
            <Input type="number" value={ctc} onChange={(e) => setCtc(Number(e.target.value))} aria-label="CTC" />
            <label className="text-sm flex items-center">Basic %</label>
            <Input
              type="number"
              value={basicPct}
              onChange={(e) => setBasicPct(Number(e.target.value))}
              aria-label="Basic Percent"
            />
            <label className="text-sm flex items-center">HRA %</label>
            <Input
              type="number"
              value={hraPct}
              onChange={(e) => setHraPct(Number(e.target.value))}
              aria-label="HRA Percent"
            />
            <label className="text-sm flex items-center">LTA (₹)</label>
            <Input type="number" value={lta} onChange={(e) => setLta(Number(e.target.value))} aria-label="LTA" />
          </div>
          <Button onClick={() => optimize.mutate()}>Optimize</Button>
        </CardContent>
      </Card>
      <div>{optimize.data && <SalaryResultCard data={optimize.data} />}</div>
    </div>
  )
}
