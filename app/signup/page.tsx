"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with name
      if (name) {
        await updateProfile(userCredential.user, {
          displayName: name,
        })
      }

      toast({ title: "Account created!", description: "Welcome to FinWise!" })
      router.push("/onboarding")

    } catch (error: any) {
      console.error("Signup error:", error)
      let errorMessage = "Failed to create account."

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use."
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters."
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address."
      }

      toast({
        title: "Signup failed",
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
            Create your FinWise account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleAuthButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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
