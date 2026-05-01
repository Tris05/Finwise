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
                  <Card className="h-full border-none shadow-md hover:shadow-xl transition-all border-l-4">
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

                      <Button
                        className="w-full h-9 text-xs font-bold"
                        onClick={() => !isExisting && handleAddClick({ ...asset, asset_class: assetClass })}
                        disabled={isExisting}
                      >
                        {isExisting ? "Added" : "Add to Portfolio"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={goalPickerOpen} onOpenChange={setGoalPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalPickerOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAdd}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}