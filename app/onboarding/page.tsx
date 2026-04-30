"use client"

import { useRouter } from "next/navigation"
import { FinancialProfileForm } from "@/components/FinancialProfileForm"

export default function OnboardingPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to dashboard after the form completes and the user clicks 'View Recommendations'
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            Welcome to FinWise
          </h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your financial profile so our AI can personalize your experience.
          </p>
        </div>
        
        <FinancialProfileForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
