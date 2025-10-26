"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, RefreshCw, RotateCcw } from "lucide-react"
import { formatINR } from "@/lib/utils"

interface PortfolioOverviewProps {
  totalValue: number
  totalGain: number
  totalGainPercent: number
  dayChange: number
  dayChangePercent: number
  onRefresh?: () => void
  onRebalance?: () => void
  isLoading?: boolean
}

export function PortfolioOverview({
  totalValue,
  totalGain,
  totalGainPercent,
  dayChange,
  dayChangePercent,
  onRefresh,
  onRebalance,
  isLoading = false
}: PortfolioOverviewProps) {
  const isGain = totalGain >= 0
  const isDayGain = dayChange >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Portfolio Value */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full -translate-y-8 translate-x-8"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pr-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pr-4">
          <div className="text-2xl font-bold text-foreground break-words">{formatINR(totalValue)}</div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs text-muted-foreground">All time</span>
            <Badge 
              variant={isGain ? "default" : "destructive"} 
              className={`text-xs px-2 py-1 ${isGain ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
            >
              {isGain ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatINR(Math.abs(totalGain))} ({totalGainPercent.toFixed(2)}%)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Day's Change */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full -translate-y-8 translate-x-8"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pr-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's Change</CardTitle>
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pr-4">
          <div className={`text-2xl font-bold break-words ${isDayGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isDayGain ? '+' : ''}{formatINR(dayChange)}
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Today</span>
            <Badge 
              variant={isDayGain ? "default" : "destructive"} 
              className={`text-xs px-2 py-1 ${isDayGain ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
            >
              {isDayGain ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {dayChangePercent.toFixed(2)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Investment Goals Progress */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full -translate-y-8 translate-x-8"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pr-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Goals Progress</CardTitle>
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pr-4">
          <div className="text-2xl font-bold text-foreground">3/5</div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Goals achieved</span>
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              60% Complete
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Health */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full -translate-y-8 translate-x-8"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pr-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Health</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Good</Badge>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onRebalance && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRebalance}
                className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                title="Rebalance Portfolio"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pr-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">A+</div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Risk-adjusted returns</span>
            <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-400">
              Well Diversified
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
