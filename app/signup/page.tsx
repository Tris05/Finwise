"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({ title: "Account created!", description: "You can now log in." })
      router.push("/dashboard")
    }, 900)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            Create your FinWise account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full bg-transparent">
            Continue with Google 
          </Button>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input type="text" placeholder="Full Name" required />
            <Input type="email" placeholder="Email" required />
            <Input type="password" placeholder="Password" required />
            <Input type="password" placeholder="Confirm Password" required />
            <Button className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Sign up"}
            </Button>
          </form>
          <div className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <a className="text-primary underline" href="/login">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
