"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"

type AssessResponse = {
  emi: number
  affordability: "Low" | "Medium" | "High"
  risk: "Low" | "Medium" | "High"
  schedule: { month: number; balance: number }[]
  mitigations: string[]
}

export function LoanCalculator() {
  const [amount, setAmount] = useState(1000000)
  const [rate, setRate] = useState(10)
  const [tenure, setTenure] = useState(60)

  const assess = useMutation({
    mutationFn: async (): Promise<AssessResponse> => {
      const res = await fetch("/api/loan/assess", {
        method: "POST",
        body: JSON.stringify({ amount, rate, tenure }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Loan & EMI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm flex items-center">Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="Loan Amount"
            />
            <label className="text-sm flex items-center">Rate (%)</label>
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Rate" />
            <label className="text-sm flex items-center">Tenure (months)</label>
            <Input
              type="number"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              aria-label="Tenure"
            />
          </div>
          <Button onClick={() => assess.mutate()}>Assess</Button>
          {assess.data && (
            <div className="text-sm">
              <div>EMI: ₹{assess.data.emi.toLocaleString()}</div>
              <div>Affordability: {assess.data.affordability}</div>
              <div>Risk: {assess.data.risk}</div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-4">
        {assess.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Balance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={assess.data.schedule}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="balance" stroke="var(--chart-4)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mitigations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm list-disc pl-5">
                  {assess.data.mitigations.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
