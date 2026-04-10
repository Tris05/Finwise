"use client"

import React, { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calculator,
    Target,
    TrendingUp,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    Info,
    Plus,
    Trash2,
    Briefcase,
    AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePortfolioOptimizer } from "@/hooks/usePortfolioOptimizer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useInvestments } from "@/hooks/useInvestments"
import { useFinancialGoals, FinancialGoal, GoalType } from "@/hooks/useFinancialGoals"
import { useLoans } from "@/hooks/useLoans"
import { db, auth } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useEffect } from "react"

const formSchema = z.object({
    user_profile: z.object({
        risk_score: z.number().min(0).max(1),
        investment_horizon: z.number().min(1).max(50),
        age: z.number().min(18).max(100),
        annual_income: z.number().min(0),
        preferences: z.array(z.string()).optional(),
        constraints: z.object({
            max_crypto: z.number().min(0).max(1),
            max_single_stock: z.number().min(0).max(1),
            min_fixed_income: z.number().min(0).max(1),
            investment_style: z.enum(["conservative", "moderate", "aggressive"]),
            exclude_sectors: z.array(z.string()).optional(),
            preferred_stocks: z.array(z.string()).optional()
        })
    }),
    financial_details: z.object({
        total_assets: z.number().min(1000),
        monthly_surplus: z.number().min(0).optional(),
        emergency_fund: z.number().min(0).optional(),
        existing_investments: z.object({
            stocks: z.number().default(0),
            mutual_funds: z.number().default(0),
            fd: z.number().default(0),
            ppf: z.number().default(0),
            crypto: z.number().default(0),
            commodities: z.number().default(0)
        }),
        debts: z.object({
            loans: z.number().optional().default(0),
            credit_cards: z.number().optional().default(0)
        })
    }),
    goals: z.array(z.object({
        name: z.string().min(1, "Goal name required"),
        target_amount: z.number().min(1000),
        time_horizon: z.number().min(1),
        priority: z.enum(["low", "medium", "high"])
    })),
    market_preferences: z.object({
        preferred_exchanges: z.array(z.string()).default(["NSE"]),
        currency: z.string().default("INR"),
        update_frequency: z.enum(["daily", "weekly", "monthly"]).default("monthly")
    })
})

type FormValues = z.infer<typeof formSchema>

const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100

export const FinancialProfileForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [step, setStep] = useState(1)
    const [totalSteps] = useState(6)
    const { optimizePortfolio, loading, currentRequest, error: optimizerError } = usePortfolioOptimizer()
    const { annualIncome, age, riskProfile } = useUserProfile()
    const { investments, totalValue } = useInvestments()
    const { goals: savedGoals, addGoal, loading: goalsLoading } = useFinancialGoals()
    const { loanProfile } = useLoans()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            user_profile: {
                risk_score: 0.5,
                investment_horizon: 10,
                age: 30,
                annual_income: 1000000,
                preferences: ["growth"],
                constraints: {
                    max_crypto: 0.1,
                    max_single_stock: 0.15,
                    min_fixed_income: 0.2,
                    investment_style: "moderate",
                    exclude_sectors: [],
                    preferred_stocks: []
                }
            },
            financial_details: {
                total_assets: 500000,
                monthly_surplus: 50000,
                emergency_fund: 200000,
                existing_investments: {
                    stocks: 0,
                    mutual_funds: 0,
                    fd: 0,
                    ppf: 0,
                    crypto: 0,
                    commodities: 0
                },
                debts: {
                    loans: 0,
                    credit_cards: 0
                }
            },
            goals: [
                { name: "Retirement", target_amount: 10000000, time_horizon: 30, priority: "high" }
            ],
            market_preferences: {
                preferred_exchanges: ["NSE"],
                currency: "INR",
                update_frequency: "monthly"
            }
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "goals"
    })

    // Prepopulate form data
    useEffect(() => {
        if (!annualIncome && !age && investments.length === 0) return

        const riskScoreMap: Record<string, number> = {
            "Conservative": 0.3,
            "Moderate": 0.6,
            "Aggressive": 0.9
        }

        const holdings = {
            stocks: round(investments.filter(i => /stocks?|equity/i.test((i.category as string) || "") || /stocks?|equity/i.test((i.type as string) || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0)),
            mutual_funds: round(investments.filter(i => /mutual\s*funds?|mf|sip/i.test((i.type as string) || "") || /mutual\s*funds?|mf/i.test(i.name || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0)),
            crypto: round(investments.filter(i => /crypto|bitcoin|eth|sol/i.test((i.category as string) || "") || /crypto/i.test((i.type as string) || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0)),
            fd: round(investments.filter(i => /fd|fixed\s*deposit|term\s*deposit/i.test((i.type as string) || "") || /fd|fixed\s*deposit|term\s*deposit/i.test(i.name || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0)),
            ppf: round(investments.filter(i => /ppf|provident\s*fund/i.test((i.type as string) || "") || /ppf|provident\s*fund/i.test(i.name || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0)),
            commodities: round(investments.filter(i => /commodit|gold|silver|metal/i.test((i.category as string) || "") || /gold|silver/i.test(i.symbol || "")).reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0))
        }

        form.reset({
            ...form.getValues(),
            user_profile: {
                ...form.getValues().user_profile,
                annual_income: annualIncome || form.getValues().user_profile.annual_income,
                age: age || form.getValues().user_profile.age,
                risk_score: riskProfile ? riskScoreMap[riskProfile] || 0.5 : 0.5,
                constraints: {
                    ...form.getValues().user_profile.constraints,
                    investment_style: (riskProfile?.toLowerCase() as any) || "moderate"
                }
            },
            financial_details: {
                ...form.getValues().financial_details,
                total_assets: round(totalValue || form.getValues().financial_details.total_assets),
                existing_investments: holdings,
                debts: {
                    ...form.getValues().financial_details.debts,
                    loans: round(loanProfile?.amount || form.getValues().financial_details.debts.loans)
                }
            },
            goals: savedGoals.length > 0 ? savedGoals.map(g => ({
                name: g.name,
                target_amount: g.targetAmount,
                time_horizon: Math.ceil((new Date(g.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365)) || 1,
                priority: (g.priority.toLowerCase() as any) || "medium"
            })) : form.getValues().goals
        })
    }, [annualIncome, age, riskProfile, investments, totalValue, savedGoals, loanProfile])

    const onSubmit = async (values: FormValues) => {
        const user = auth.currentUser
        if (!user) return

        try {
            // 1. Save updated profile info
            const userRef = doc(db, "users", user.uid)
            await setDoc(userRef, {
                profile: {
                    annual_income: values.user_profile.annual_income,
                    age: values.user_profile.age,
                }
            }, { merge: true })

            // 2. Save/Sync Goals
            // For simplicity, we add new goals that don't exist by name
            for (const goal of values.goals) {
                const exists = savedGoals.find(g => g.name.toLowerCase() === goal.name.toLowerCase())
                if (!exists) {
                    await addGoal({
                        name: goal.name,
                        targetAmount: goal.target_amount,
                        currentAmount: 0,
                        targetDate: new Date(new Date().getFullYear() + goal.time_horizon, 0, 1).toISOString(),
                        priority: (goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)) as any,
                        type: "Other"
                    })
                }
            }

            // 3. Run Optimization
            await optimizePortfolio(values)
        } catch (err) {
            console.error("Error saving form data:", err)
        }
    }

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    if (currentRequest?.status === "completed") {
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Strategy Unlocked!</CardTitle>
                    <CardDescription>
                        Our Multi-Agent system has finalized your investment roadmap.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <h4 className="font-semibold mb-2 text-sm">Execution Protocol Ready</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {currentRequest.output?.macro_allocation ?
                                `Your allocation involves ${Object.keys(currentRequest.output.macro_allocation).length} asset classes.` :
                                "Your personalized strategy is ready to view."
                            }
                        </p>
                    </div>
                    <Button
                        className="w-full h-10 text-sm font-bold shadow-lg shadow-primary/20"
                        onClick={() => onSuccess?.()}
                    >
                        View Recommendations
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-10 flex flex-col items-center gap-4">
                <div className="w-full overflow-hidden rounded-full bg-secondary h-2.5 flex">
                    <motion.div
                        className="bg-primary h-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        initial={{ width: "16%" }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
                <div className="flex gap-4">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step === i + 1 ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                        <TrendingUp className="w-5 h-5" />
                                        <span>Identity & Income</span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold">Foundation</CardTitle>
                                    <CardDescription>Basic demographics to anchor your financial profile.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="age" className="text-sm font-medium">Your Age</Label>
                                            <Input id="age" type="number" placeholder="30" className="h-12 bg-secondary/30" {...form.register("user_profile.age", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="income" className="text-sm font-medium">Gross Annual Income (₹)</Label>
                                            <Input id="income" type="number" placeholder="12,00,000" className="h-12 bg-secondary/30" {...form.register("user_profile.annual_income", { valueAsNumber: true })} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 flex gap-3">
                                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Your age helps us determine the 'Senior Citizen' status for fixed income optimization (&gt;= 60 years).
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="button" onClick={nextStep} className="w-full h-12 text-md font-bold">
                                        Next: Strategy Stance <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span>Market Stance</span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold">Risk & Time</CardTitle>
                                    <CardDescription>Define how aggressive your agents should be.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm font-medium">Investment Horizon</Label>
                                            <Badge variant="secondary" className="px-3 py-1">{form.watch("user_profile.investment_horizon")} Years</Badge>
                                        </div>
                                        <Slider
                                            defaultValue={[form.getValues("user_profile.investment_horizon")]}
                                            max={50}
                                            min={1}
                                            step={1}
                                            onValueChange={(vals) => form.setValue("user_profile.investment_horizon", vals[0])}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm font-medium">Risk Score (0.0 to 1.0)</Label>
                                            <Badge className={`px-3 py-1 ${form.watch("user_profile.risk_score") > 0.7 ? "bg-red-500" : "bg-primary"}`}>
                                                {form.watch("user_profile.risk_score").toFixed(1)}
                                            </Badge>
                                        </div>
                                        <Slider
                                            defaultValue={[form.getValues("user_profile.risk_score")]}
                                            max={1}
                                            min={0}
                                            step={0.1}
                                            onValueChange={(vals) => form.setValue("user_profile.risk_score", vals[0])}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Investment Style</Label>
                                        <Select
                                            defaultValue={form.getValues("user_profile.constraints.investment_style")}
                                            onValueChange={(val: any) => form.setValue("user_profile.constraints.investment_style", val)}
                                        >
                                            <SelectTrigger className="h-12 bg-secondary/30">
                                                <SelectValue placeholder="Select Style" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="conservative">Conservative (Focus on low drawdown)</SelectItem>
                                                <SelectItem value="moderate">Moderate (Standard growth/risk balance)</SelectItem>
                                                <SelectItem value="aggressive">Aggressive (High growth, high volatility)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 h-12">
                                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1 h-12 font-bold">
                                        Next: Liquidity <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                        <Calculator className="w-5 h-5" />
                                        <span>Assets & Flow</span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold">Liquidity Check</CardTitle>
                                    <CardDescription>Understanding your current cash flow and deployable capital.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Amount to Invest Now (₹)</Label>
                                        <Input type="number" className="h-14 text-xl font-bold bg-primary/5 border-primary/20" {...form.register("financial_details.total_assets", { valueAsNumber: true })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Monthly Surplus (₹)</Label>
                                            <Input type="number" className="h-12 bg-secondary/30" {...form.register("financial_details.monthly_surplus", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Emergency Fund (₹)</Label>
                                            <Input type="number" className="h-12 bg-secondary/30" {...form.register("financial_details.emergency_fund", { valueAsNumber: true })} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 h-12">
                                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1 h-12 font-bold">
                                        Next: Current Holdings <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                        <Briefcase className="w-5 h-5" />
                                        <span>Portfolio context</span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold">Existing Holdings</CardTitle>
                                    <CardDescription>What assets do you already own? (Optional but recommended)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Stocks (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.stocks", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Crypto (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.crypto", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">FD (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.fd", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">PPF (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.ppf", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Mutual Funds (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.mutual_funds", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Commodities (₹)</Label>
                                            <Input type="number" className="bg-secondary/20" {...form.register("financial_details.existing_investments.commodities", { valueAsNumber: true })} />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-border/50">
                                        <Label className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-4 h-4" /> Outstanding Debts
                                        </Label>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Loans (Home/Auto/Personal)</Label>
                                                <Input type="number" className="bg-red-500/5 border-red-500/10" {...form.register("financial_details.debts.loans", { valueAsNumber: true })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Credit Card Dues</Label>
                                                <Input type="number" className="bg-red-500/5 border-red-500/10" {...form.register("financial_details.debts.credit_cards", { valueAsNumber: true })} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 h-12">
                                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1 h-12 font-bold">
                                        Next: Financial Goals <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                            <Target className="w-5 h-5" />
                                            <span>Financial Ambitions</span>
                                        </div>
                                        <CardTitle className="text-3xl font-extrabold">Your Goals</CardTitle>
                                    </div>
                                    <Button type="button" size="sm" onClick={() => append({ name: "", target_amount: 0, time_horizon: 1, priority: "medium" })} variant="outline">
                                        <Plus className="w-4 h-4 mr-1" /> Add Goal
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-4 rounded-xl border bg-secondary/10 space-y-4 relative group">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Goal Name</Label>
                                                    <Input placeholder="e.g. Dream House" {...form.register(`goals.${index}.name` as const)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Target (₹)</Label>
                                                    <Input type="number" {...form.register(`goals.${index}.target_amount` as const, { valueAsNumber: true })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horizon (Years)</Label>
                                                    <Input type="number" {...form.register(`goals.${index}.time_horizon` as const, { valueAsNumber: true })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Priority</Label>
                                                    <Select onValueChange={(val: any) => form.setValue(`goals.${index}.priority`, val)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">High</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="low">Low</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                                <CardFooter className="flex gap-4 border-t pt-6">
                                    <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 h-12">
                                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1 h-12 font-bold">
                                        Next: Final Review <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 6 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-background to-primary/5">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span>Global Configuration</span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold">Final Review</CardTitle>
                                    <CardDescription>Confirming your constraints before activating the agents.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase text-muted-foreground font-bold">Investable Capital</span>
                                            <p className="text-xl font-bold text-primary">₹{form.watch("financial_details.total_assets")?.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase text-muted-foreground font-bold">Risk Model</span>
                                            <p className="text-xl font-bold capitalize">{form.watch("user_profile.constraints.investment_style")}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold flex items-center justify-between">
                                            Sector Exclusions
                                            <Badge variant="outline" className="text-[10px] uppercase">Optional</Badge>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["Tobacco", "Gambling", "Defense", "Fossil Fuels"].map(sector => (
                                                <div key={sector} className="flex items-center space-x-2 border p-2 rounded-lg bg-secondary/10">
                                                    <Checkbox
                                                        id={sector}
                                                        onCheckedChange={(checked) => {
                                                            const current = form.getValues("user_profile.constraints.exclude_sectors") || []
                                                            if (checked) {
                                                                form.setValue("user_profile.constraints.exclude_sectors", [...current, sector.toLowerCase()])
                                                            } else {
                                                                form.setValue("user_profile.constraints.exclude_sectors", current.filter(s => s !== sector.toLowerCase()))
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={sector} className="text-xs cursor-pointer">{sector}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold flex items-center justify-between">
                                            Preferred Stocks
                                            <Badge variant="outline" className="text-[10px] uppercase">Optional</Badge>
                                        </Label>
                                        <Input
                                            placeholder="e.g. RELIANCE.NS, TCS.NS (Comma separated)"
                                            className="bg-secondary/20"
                                            onChange={(e) => {
                                                const stocks = e.target.value.split(',').map(s => s.trim()).filter(s => s !== "")
                                                form.setValue("user_profile.constraints.preferred_stocks", stocks)
                                            }}
                                        />
                                    </div>

                                    {optimizerError && (
                                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex gap-2 items-center">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            {optimizerError}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={prevStep} disabled={loading} className="flex-1 h-12">
                                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] h-14 bg-gradient-to-r from-primary via-blue-600 to-indigo-700 hover:scale-[1.02] transition-transform font-black text-lg shadow-xl shadow-primary/30 group"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                <span>Orchestrating Agents...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Run AI Optimization</span>
                                                <Zap className="ml-2 w-5 h-5 fill-current group-hover:animate-pulse" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    )
}

const Zap = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
)
