"use client"

import React from "react"
import { FinancialProfileForm } from "@/components/FinancialProfileForm"
import { motion } from "framer-motion"
import { Bot, Sparkles, Zap } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

function OptimizerContent() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login")
        }
    }, [user, authLoading, router])

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Zap className="w-8 h-8 animate-pulse text-primary" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="text-center mb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 uppercase tracking-wider"
                >
                    <Sparkles className="w-3 h-3" />
                    AI Powered Engines
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
                >
                    Agentic <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">Portfolio Optimization</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-2xl mx-auto"
                >
                    Leverage a multi-agent AI system that coordinates risk analysis, macro-economic research, and micro-asset selection to build your perfect strategy.
                </motion.p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { icon: Zap, title: "Reactive Bridge", desc: "Real-time communication between UI and Python agents." },
                    { icon: Bot, title: "Multi-Agent Logic", desc: "Specialized agents for Risk, Macro, and Micro levels." },
                    { icon: Sparkles, title: "PPO Hybrid", desc: "Markowitz optimization refined by Reinforcement Learning." }
                ].map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="p-4 rounded-xl border bg-background/40 backdrop-blur-sm hover:border-primary/50 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                            <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
            >
                <FinancialProfileForm />
            </motion.div>

            <footer className="mt-12 text-center text-xs text-muted-foreground">
                <p>© 2026 Finwise Agentic AI System. All strategies are generated using market-adjusted algorithms.</p>
            </footer>
        </div>
    )
}

export default function PortfolioOptimizerPage() {
    return (
        <AppShell>
            <OptimizerContent />
        </AppShell>
    )
}
