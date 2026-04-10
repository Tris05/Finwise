"use client"

import { AppShell } from "@/components/app-shell"

import { CreditCardRecommendations } from "@/components/credit-card-recommendations"

export default function CreditCardsPage() {
  return (
    <AppShell>
      <div className="space-y-8 p-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground">
            Find the perfect credit card for your spending habits and financial goals
          </p>
        </div>

        {/* Credit Card Recommendations */}
        <CreditCardRecommendations />
      </div>
    </AppShell>
  )
}
