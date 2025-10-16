"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const [twoFA, setTwoFA] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setTwoFA(localStorage.getItem("twoFA") === "1")
    setTheme((localStorage.getItem("theme") as "light" | "dark") || "light")
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <QueryProvider>
      <AppShell>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <label className="text-sm flex items-center">Name</label>
              <Input defaultValue="FinWise User" aria-label="Name" />
              <label className="text-sm flex items-center">Email</label>
              <Input defaultValue="user@example.com" aria-label="Email" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Dark Mode</Label>
                <Switch id="theme" checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="twofa">Enable 2FA</Label>
                <Switch
                  id="twofa"
                  checked={twoFA}
                  onCheckedChange={(v) => {
                    setTwoFA(!!v)
                    localStorage.setItem("twoFA", v ? "1" : "0")
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
