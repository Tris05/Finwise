"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Shield,
    Target,
    PieChart,
    Brain,
    AlertCircle
} from "lucide-react"
import {
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Tooltip as ReTooltip
} from "recharts"

interface InvestmentInsightsProps {
    recommendation: any
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#0EA5E9', '#8B5CF6']

export function InvestmentInsights({ recommendation }: InvestmentInsightsProps) {
    if (!recommendation) {
        return (
            <Card className="border-dashed border-2 bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Brain className="w-12 h-12 text-muted-foreground/50" />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">No AI Analysis Available</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Run the AI Optimizer to generate a deep analysis of your current portfolio and target strategy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const output = recommendation.output?.portfolio_recommendation
    if (!output) return null

    const macroData = Object.entries(output.macro_allocation || {}).map(([key, value]: [string, any]) => ({
        name: key.toUpperCase(),
        value: value.percentage * 100,
        amount: value.amount,
        rationale: value.rationale
    }))

    const riskMetrics = output.risk_assessment?.risk_metrics || {}
    const stressTests = riskMetrics.stress_test_results || output.risk_assessment?.stress_test_results || {}

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Risk Metrics */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-background overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-green-500" />
                            Portfolio Risk Profile
                        </CardTitle>
                        <CardDescription>AI evaluation of strategy sustainability</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-5 rounded-2xl bg-secondary/10 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Sharpe Ratio</div>
                                    <div className="text-3xl font-black mt-0.5">{riskMetrics.sharpe_ratio?.toFixed(2) || "N/A"}</div>
                                </div>
                                <Badge className={`px-3 py-1 text-xs font-bold ${(riskMetrics.sharpe_ratio || 0) > 1.5 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"}`}>
                                    {(riskMetrics.sharpe_ratio || 0) > 1.5 ? "Excellent" : "Healthy"}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Estimated Volatility</span>
                                    <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{(riskMetrics.estimated_volatility * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={(riskMetrics.estimated_volatility || 0) * 100} className="h-2" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Diversification Score</span>
                                    <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{(riskMetrics.diversification_score * 10).toFixed(1)}/10</span>
                                </div>
                                <Progress value={(riskMetrics.diversification_score || 0) * 100} className="h-2 bg-blue-100 dark:bg-blue-900/30" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                                Stress Test Outcomes
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(stressTests).length > 0 ? Object.entries(stressTests).map(([key, value]: [string, any]) => {
                                    const scenarioMap: Record<string, string> = {
                                        market_crash_scenario: "Market Crash (-20%)",
                                        inflation_shock: "High Inflation Spike",
                                        interest_rate_rise: "Interest Rate Hike",
                                        commodity_price_surge: "Commodity Volatility",
                                        liquidity_crisis: "Liquidity Shortfall"
                                    }
                                    const impactValue = typeof value === 'number' ? value : (value.portfolio_impact || 0)
                                    const scenarioName = typeof value === 'object' ? value.scenario : (scenarioMap[key] || key.replace(/_/g, ' '))

                                    return (
                                        <div key={key} className="p-3 rounded-xl border bg-card/30 text-xs border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-colors">
                                            <div className="flex justify-between font-bold mb-2">
                                                <span className="truncate mr-2">{scenarioName}</span>
                                                <span className={impactValue < 0 ? "text-red-500" : "text-green-500"}>
                                                    {(impactValue * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={Math.abs(impactValue * 100)} className="h-1 bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                    )
                                }) : (
                                    <div className="text-xs text-muted-foreground italic text-center py-4">
                                        No stress test data available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Strategic Allocation */}
                <Card className="lg:col-span-2 border-none shadow-lg bg-white dark:bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center">
                            <PieChart className="w-5 h-5 mr-2 text-blue-500" />
                            Target Strategic Allocation
                        </CardTitle>
                        <CardDescription>Capital distribution across major asset classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-center">
                            <div className="xl:col-span-2 flex flex-col items-center">
                                <div className="h-64 w-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={macroData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={85}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {macroData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ReTooltip />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Target</span>
                                        <span className="text-2xl font-black">100%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {macroData.map((item, index) => (
                                    <div key={item.name} className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all group">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center text-sm font-bold truncate">
                                                <div className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                {item.name}
                                            </div>
                                            <Badge variant="secondary" className="font-black text-xs">{item.value.toFixed(0)}%</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                                            {item.rationale}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


        </div>
    )
}
