"use client"

import { AppShell } from "@/components/app-shell"
import { SecurityTimeline } from "@/components/security-timeline"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"

export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(false)
  const anomaly = [
    { t: "Mon", a: 1 },
    { t: "Tue", a: 0 },
    { t: "Wed", a: 2 },
    { t: "Thu", a: 0 },
    { t: "Fri", a: 1 },
  ]
  useEffect(() => {
    const v = localStorage.getItem("twoFA") === "1"
    setTwoFA(v)
  }, [])
  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-2 gap-6">
          <SecurityTimeline />
          <Card>
            <CardHeader>
              <CardTitle>2FA Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Label htmlFor="twofa">Enable 2FA (TOTP/Email)</Label>
              <Switch
                id="twofa"
                checked={twoFA}
                onCheckedChange={(v) => {
                  setTwoFA(!!v)
                  localStorage.setItem("twoFA", v ? "1" : "0")
                }}
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Anomaly Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={anomaly}>
                  <XAxis dataKey="t" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="a" stroke="var(--chart-3)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
