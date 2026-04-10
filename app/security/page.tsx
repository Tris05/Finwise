"use client"

import { AppShell } from "@/components/app-shell"
import { SecurityTimeline } from "@/components/security-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"
import { useUserProfile } from "@/hooks/useUserProfile"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useQuery } from "@tanstack/react-query"

export default function SecurityPage() {
  const { settings } = useUserProfile()

  const { data: logs } = useQuery({
    queryKey: ["security-logs"],
    queryFn: async () => {
      const res = await fetch("/api/security/logs")
      return res.json()
    },
  })

  const anomaly = Array.isArray(logs) ? [
    { t: "Mon", a: logs.filter((l: any) => l.severity === "critical").length },
    { t: "Tue", a: 0 },
    { t: "Wed", a: logs.filter((l: any) => l.severity === "warning").length },
    { t: "Thu", a: 0 },
    { t: "Fri", a: 0 },
  ] : [
    { t: "Mon", a: 0 },
    { t: "Tue", a: 0 },
    { t: "Wed", a: 0 },
    { t: "Thu", a: 0 },
    { t: "Fri", a: 0 },
  ]

  const handleUpdate2FA = async (v: boolean) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        settings: {
          twoFA: v
        }
      }, { merge: true })
    } catch (error) {
      console.error("Error updating 2FA:", error)
    }
  }
  return (
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
              checked={settings.twoFA}
              onCheckedChange={handleUpdate2FA}
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
  )
}
