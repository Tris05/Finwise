"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, CreditCard, FileText, PieChart, Shield, Trophy, Wallet, LucideCrown, Handshake } from "lucide-react"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Home() {

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient themed gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[var(--color-primary)]/15 via-transparent to-[var(--color-accent)]/20" />
      
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-4)" }} />
                AI-powered finance, India-first
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">About FinWise</span>
              <span className="block text-foreground/70 text-lg md:text-2xl font-normal mt-3">
                Your go-to personal finance companion — simple, smart, transparent
              </span>
            </h1>
            <p className="text-muted-foreground max-w-prose">
              In a world where financial choices are complex and scattered, FinWise unifies investing,
              saving, credit planning, salary optimization, and learning into one secure, AI-driven
              experience.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">I already have an account</Button>
              </Link>
            </div>
          </div>

          <div className="relative h-92 md:h-106 rounded-xl overflow-hidden">
            <Image src="/finwise-logo.png" alt="FinWise preview" fill priority className="object-contain" />
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="container mx-auto px-4 pb-6">
        <Card className="border-dashed">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2">
              
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              <LucideCrown className="h-6 w-6" />
              Our Vision
            </h2>
            </div>
            <p className="mt-2 text-muted-foreground max-w-7xl">
              To help every individual take control of their financial journey with clarity, confidence,
              and literacy — turning decision-making into an empowering, everyday habit.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* What We Offer */}
      <section className="container mx-auto px-4 py-10">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">What We Offer</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={PieChart} title="Smart Asset Allocation" desc="AI-powered diversification across stocks, mutual funds, PPF, FDs, gold, and crypto." color="var(--chart-4)" />
          <FeatureCard icon={CreditCard} title="Intelligent Credit Insights" desc="Explainable card and loan picks using XGBoost + SHAP." color="var(--chart-2)" />
          <FeatureCard icon={Bot} title="AI Financial Advisor" desc="24/7 LLM + RAG assistant for context-aware guidance." color="var(--chart-5)" />
          <FeatureCard icon={FileText} title="Document Intelligence" desc="Automated extraction from salary slips, credit reports, and more." color="var(--chart-3)" />
          <FeatureCard icon={Wallet} title="Salary Optimization" desc="Tax-efficient structures and long-term planning insights." color="var(--chart-1)" />
          <FeatureCard icon={Trophy} title="Gamified Financial Learning" desc="Interactive modules, rewards, and progress tracking." color="var(--chart-6)" />
          <FeatureCard icon={Shield} title="Security & Trust" desc="2FA, JWT sessions, TOTP, anomaly detection for peace of mind." color="var(--color-primary)" />
        </div>
      </section>

      {/* Mission CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10" />
          <CardContent className="relative p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              <Handshake className="h-6 w-6" />
              Our Mission
            </h2>
            <p className="mt-2 text-muted-foreground max-w-7xl">
              To bridge the gap between financial literacy and action — building an ecosystem where
              technology doesn’t replace human judgment but amplifies it through personalized, explainable
              intelligence.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/signup">
                <Button>Start your journey</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sign in</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md p-2" style={{ background: `${color}20`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground mt-1">{desc}</div>
        </div>
      </div>
    </div>
  )
}


