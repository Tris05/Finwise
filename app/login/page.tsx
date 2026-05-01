"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "Welcome back!", description: "Logged in successfully." })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Failed to log in. Please check your credentials."

      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password."
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email."
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later."
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 p-6">
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            FinWise Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleAuthButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-xs text-center text-muted-foreground">
            Don't have an account?{" "}
            <a className="text-primary underline" href="/signup">
              Create one
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
