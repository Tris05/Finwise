"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  DollarSign,
  BarChart3,
  PieChart,
  Brain,
  RefreshCw,
  PlusCircle,
  Clock,
  ChevronRight,
  InfoIcon
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatINR } from "@/lib/utils"
import { motion } from "framer-motion"
import { useFinancialGoals } from "@/hooks/useFinancialGoals"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts"

interface InvestmentRecommendationsProps {
  recommendation: any
  onAddInvestment: (recommendation: any) => void
  onRunAgain: () => void
  isLoading?: boolean
  existingPortfolio?: any[]
}

export function InvestmentRecommendations({
  recommendation,
  onAddInvestment,
  onRunAgain,
  isLoading = false,
  existingPortfolio = []
}: InvestmentRecommendationsProps) {
  const { goals } = useFinancialGoals()
  const [goalPickerOpen, setGoalPickerOpen] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<any>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string>("none")

  const handleAddClick = (asset: any) => {
    setPendingAsset(asset)
    setSelectedGoalId("none")
    setGoalPickerOpen(true)
  }

  const handleConfirmAdd = () => {
    if (pendingAsset) {
      onAddInvestment({ ...pendingAsset, goalId: selectedGoalId === "none" ? null : selectedGoalId })
    }
    setGoalPickerOpen(false)
    setPendingAsset(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Our agents are analyzing the markets...</p>
      </div>
    )
  }

  if (!recommendation) {
    return (
      <Card className="border-dashed border-2 bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Brain className="w-12 h-12 text-muted-foreground/50" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No Recommendations Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Run the AI Optimizer to get personalized investment suggestions based on your profile and goals.
            </p>
          </div>
          <Button onClick={onRunAgain}>
            <Brain className="w-4 h-4 mr-2" />
            Start AI Optimizer
          </Button>
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

  const riskMetrics = output.risk_assessment?.risk_metrics || {}
  const stressTests = output.risk_assessment?.stress_test_results || {}

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Brain className="w-6 h-6 mr-2 text-primary" />
            AI Optimized Strategy
          </h2>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4 mr-1" />
            Generated {new Date(recommendation.timestamp).toLocaleString()}
            <Badge variant="outline" className="ml-3 bg-primary/5">
              Risk Profile: {output.meta_data?.risk_profile}
            </Badge>
          </div>
        </div>
        <Button onClick={onRunAgain} variant="outline" className="font-bold border-primary/20 hover:bg-primary/5">
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-run Optimizer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Macro Allocation Card */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-gradient-to-br from-card to-background">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-500" />
              Strategic Asset Allocation
            </CardTitle>
            <CardDescription>Target distribution across major asset classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {macroData.map((item, index) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-medium">{item.name}</span>
                      </span>
                      <span className="font-bold">{item.value.toFixed(0)}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" style={{ '--progress-background': COLORS[index % COLORS.length] } as any} />
                    <p className="text-[10px] text-muted-foreground italic leading-tight">{item.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics Card */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider>
              <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center text-sm">
                    <span>Expected Return</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3 h-3 ml-1.5 text-muted-foreground cursor-help opacity-40 group-hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] text-[11px]">
                        The average profit you can expect from this portfolio in a year, based on historical performance.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-lg font-bold text-green-600">{(Number(riskMetrics.expected_annual_return) * 100 || 0).toFixed(2)}%</span>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="flex items-center text-sm">
                    <span>Sharpe Ratio</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3 h-3 ml-1.5 text-muted-foreground cursor-help opacity-40 group-hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] text-[11px]">
                        Efficiency score: Returns relative to risk. Above 1 is good, above 2 is excellent.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-semibold">{(Number(riskMetrics.sharpe_ratio) || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="flex items-center text-sm">
                    <span>Volatility</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3 h-3 ml-1.5 text-muted-foreground cursor-help opacity-40 group-hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] text-[11px]">
                        The 'Bumpy Ride' factor. Higher volatility means more frequent value swings.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-medium">{(Number(riskMetrics.estimated_volatility) * 100 || 0).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="flex items-center text-sm">
                    <span>Diversification</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3 h-3 ml-1.5 text-muted-foreground cursor-help opacity-40 group-hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] text-[11px]">
                        Spread across assets. High score means you've avoided 'putting all eggs in one basket'.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    {(Number(riskMetrics.diversification_score) * 10 || 0).toFixed(1)}/10
                  </Badge>
                </div>
              </div>
            </TooltipProvider>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                <Target className="w-3 h-3 mr-1" />
                Stress Test Outcomes
              </h4>
              <TooltipProvider>
                {Object.entries(stressTests).slice(0, 3).map(([key, test]: [string, any]) => (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 group cursor-help transition-all hover:bg-secondary/20 p-1 rounded">
                        <div className="flex justify-between text-[11px]">
                          <span className="flex items-center">
                            {test.scenario}
                          </span>
                          <span className={(Number(test.portfolio_impact) || 0) < 0 ? "text-red-500" : "text-green-500 font-bold"}>
                            {((Number(test.portfolio_impact) || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.abs((Number(test.portfolio_impact) || 0) * 100)} className="h-1 bg-secondary" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px] text-[11px]">
                      Estimate of how the portfolio would crash or grow in this specific negative scenario.
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Explanation */}
      <Card className="border shadow-md bg-blue-50/30 dark:bg-blue-900/10">
        <CardContent className="p-4 flex items-start space-x-3">
          <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-bold text-blue-700 dark:text-blue-400">About this Distribution</h4>
            <p className="text-muted-foreground mt-1">
              The quantities and amounts below are calculated to fit your <strong>{formatINR(output.meta_data?.total_investment || 0)}</strong> target portfolio.
              While you can add individual assets, implementing the full recommended distribution ensures optimal diversification as per the AI strategy.
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Micro Recommendations */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary" />
          Recommended Picks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(output.micro_allocation || {}).flatMap(([assetClass, assets]: [string, any]) =>
            assets.map((asset: any, idx: number) => {
              const isExisting = existingPortfolio.some(p => p.symbol === asset.symbol)
              const isDebt = ['fd', 'ppf', 'bond', 'debt', 'fixed_income'].includes(assetClass.toLowerCase())

              return (
                <motion.div
                  key={`${assetClass}-${idx}`}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-none shadow-md hover:shadow-xl transition-all border-l-4" style={{ borderColor: COLORS[Object.keys(output.micro_allocation).indexOf(assetClass) % COLORS.length] }}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {assetClass}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatINR(asset.amount)}</div>
                          <div className="text-[10px] text-muted-foreground">Allocation</div>
                        </div>
                      </div>
                      <CardTitle className="text-base font-bold mt-2">{asset.name || asset.symbol}</CardTitle>
                      <CardDescription className="text-xs">{asset.symbol}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                        {asset.rationale}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t">
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-semibold">
                            {isDebt ? "Stable" : formatINR(asset.current_price || asset.price || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{isDebt ? "Term" : "Suggested Qty"}</div>
                          <div className="font-semibold">
                            {isDebt ? (asset.term || "N/A") : (asset.quantity?.toFixed(2) || 1)}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full h-9 text-xs font-bold"
                        onClick={() => !isExisting && handleAddClick({ ...asset, asset_class: assetClass })}
                        disabled={isExisting}
                        variant={isExisting ? "secondary" : "default"}
                      >
                        {isExisting ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Added to Portfolio
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 mr-2" />
                            Add to Portfolio
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Actionable Insights */}
      {output.actionable_advice && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              AI Investment Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">
              {output.actionable_advice.allocation_summary}
            </p>
            {output.actionable_advice.immediate_actions?.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase">Immediate Actions:</h4>
                <ul className="space-y-1">
                  {output.actionable_advice.immediate_actions.map((action: string, i: number) => (
                    <li key={i} className="text-xs flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1 text-primary" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal Assignment Dialog */}
      <Dialog open={goalPickerOpen} onOpenChange={setGoalPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Adding <strong>{pendingAsset?.name || pendingAsset?.symbol}</strong> to your portfolio.
              Optionally assign this investment to a financial goal.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Goal (Optional)</label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goals.map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name} ({g.priority})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalPickerOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAdd}>
              <PlusCircle className="w-3 h-3 mr-2" />
              Confirm Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
