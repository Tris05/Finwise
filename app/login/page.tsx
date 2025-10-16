"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [tab, setTab] = useState("password")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({ title: "Welcome back!", description: "Logged in successfully." })
      router.push("/dashboard")
    }, 800)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            FinWise Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full bg-transparent">
            Continue with Google
          </Button>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="space-y-3">
              <form onSubmit={onSubmit} className="space-y-3">
                <Input type="email" placeholder="Email" required />
                <Input type="password" placeholder="Password" required />
                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="otp" className="space-y-3">
              <form onSubmit={onSubmit} className="space-y-3">
                <Input type="email" placeholder="Email" required />
                <Input type="text" placeholder="One-Time Password" required />
                <Button className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-center text-muted-foreground">
            Don’t have an account?{" "}
            <a className="text-primary underline" href="/signup">
              Create one
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
