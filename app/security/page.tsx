"use client"

import { AppShell } from "@/components/app-shell"
import { SecurityTimeline } from "@/components/security-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Shield, Lock, Bell } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"

export default function SecurityPage() {
  const { settings } = useUserProfile()

  const { data: logs, refetch } = useQuery({
    queryKey: ["security-logs"],
    queryFn: async () => {
      const res = await fetch("/api/security/logs", {
        headers: {
          'x-user-id': 'current-user'
        }
      })
      return res.json()
    },
  })

  // Log current login when page loads
  useEffect(() => {
    const logCurrentLogin = async () => {
      try {
        await fetch("/api/security/logs", {
          method: "POST",
          headers: {
            'x-user-id': 'current-user',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: "log",
            type: "login"
          })
        })
        // Refresh logs after logging current login
        refetch()
      } catch (error) {
        console.error("Failed to log login:", error)
      }
    }
    
    logCurrentLogin()
  }, [refetch])

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


  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security</h1>
            <p className="text-muted-foreground">
              Monitor your account activity and security settings
            </p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Shield className="h-3 w-3 mr-1" />
            Protected
          </Badge>
        </div>

        {/* Security Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SecurityTimeline />
          
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
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

        {/* Basic Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive security alerts via email</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Session Monitoring</Label>
                <p className="text-sm text-muted-foreground">Track active sessions and devices</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
