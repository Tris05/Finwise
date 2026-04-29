"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal, Star, AlertTriangle, CheckCircle, XCircle, Plus, Filter, Search } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RealInvestment {
  id: string
  symbol: string
  name: string
  type: 'Stock' | 'Crypto' | 'Commodity' | 'Mutual Fund' | 'Bond' | 'Real Estate'
  category: 'Equity' | 'Crypto' | 'Commodity' | 'Debt' | 'Real Estate'
  currentPrice: number
  quantity: number
  investedAmount: number
  currentValue: number
  totalGain: number
  gainPercent: number
  dayChange: number
  dayChangePercent: number
  color: string
  sector: string
  marketCap: string
  pe: number | string
  dividend: number | string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Unknown'
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Strong Buy' | 'Strong Sell'
  rate?: number
  tenure?: number | string
  rationale?: string
  volume?: number
  week52High?: number
  week52Low?: number
}

interface RealInvestmentTrackerProps {
  investments: RealInvestment[]
  onInvestmentClick?: (investment: RealInvestment) => void
  onAddInvestment?: () => void
  onSellInvestment?: (investment: RealInvestment) => void
}

export function RealInvestmentTracker({
  investments,
  onInvestmentClick,
  onAddInvestment,
  onSellInvestment
}: RealInvestmentTrackerProps) {
  const [showValues, setShowValues] = useState(true)
  const [selectedInvestment, setSelectedInvestment] = useState<RealInvestment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRecommendation, setFilterRecommendation] = useState<string>("all")

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || investment.type === filterType
    const matchesRecommendation = filterRecommendation === "all" || investment.recommendation === filterRecommendation

    return matchesSearch && matchesType && matchesRecommendation
  })

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Buy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Buy': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Sell': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'Strong Sell': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Stock': return '📈'
      case 'Crypto': return '₿'
      case 'Commodity': return '🥇'
      case 'Mutual Fund': return '📊'
      case 'Bond': return '📋'
      case 'Real Estate': return '🏠'
      default: return '💰'
    }
  }

  const totalPortfolioValue = (investments || []).reduce((sum, inv) => sum + (Number(inv.currentValue) || 0), 0)
  const totalGain = (investments || []).reduce((sum, inv) => sum + (Number(inv.totalGain) || 0), 0)
  const investedPrincipal = (investments || []).reduce((sum, inv) => sum + (Number(inv.investedAmount) || 0), 0)
  const totalGainPercent = investedPrincipal !== 0 ? (totalGain / investedPrincipal) * 100 : 0

  const bestPerformer = investments.length > 0
    ? investments.reduce((best, inv) => (inv.gainPercent || 0) > (best.gainPercent || 0) ? inv : best)
    : null

  return (
    <div className="space-y-8">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Total Portfolio</h3>
                <p className="text-sm text-muted-foreground">Current value</p>
              </div>
            </div>
            <div className="text-2xl font-bold">{formatINR(totalPortfolioValue)}</div>
            <div className="text-sm text-muted-foreground">
              {investments.length} investments
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Total Gain</h3>
                <p className="text-sm text-muted-foreground">All time profit</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatINR(totalGain)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              +{(totalGainPercent || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Best Performer</h3>
                <p className="text-sm text-muted-foreground">Top gainer today</p>
              </div>
            </div>
            <div className="text-lg font-bold">
              {bestPerformer ? bestPerformer.symbol : "N/A"}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {bestPerformer
                ? `+${(bestPerformer.gainPercent || 0).toFixed(2)}%`
                : "0.00%"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold">Risk Level</h3>
                <p className="text-sm text-muted-foreground">Portfolio risk</p>
              </div>
            </div>
            <div className="text-2xl font-bold">Medium</div>
            <div className="text-sm text-muted-foreground">
              Balanced portfolio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Stock">Stocks</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
            <SelectItem value="Commodity">Commodity</SelectItem>
            <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
            <SelectItem value="Bond">Bond</SelectItem>
            <SelectItem value="Real Estate">Real Estate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRecommendation} onValueChange={setFilterRecommendation}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Recommendation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Strong Buy">Strong Buy</SelectItem>
            <SelectItem value="Buy">Buy</SelectItem>
            <SelectItem value="Hold">Hold</SelectItem>
            <SelectItem value="Sell">Sell</SelectItem>
            <SelectItem value="Strong Sell">Strong Sell</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="h-9 w-9 p-0"
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button onClick={onAddInvestment} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestments.map((investment) => {
          const isDebt = ['bond', 'debt', 'fixed income', 'fd', 'ppf'].includes(investment.type?.toLowerCase() || '') ||
            investment.symbol.toLowerCase().includes('fd-') ||
            investment.symbol.toLowerCase().includes('ppf')
          const isGain = (investment.totalGain || 0) >= 0
          const isDayGain = isDebt ? true : (investment.dayChange || 0) >= 0
          const displayDayChange = isDebt ? 0 : (investment.dayChange || 0)
          const displayDayChangePercent = isDebt ? 0 : (investment.dayChangePercent || 0)
          const currentValue = investment.currentValue || investment.investedAmount || 0

          return (
            <Card
              key={investment.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              onClick={() => {
                setSelectedInvestment(investment)
                onInvestmentClick?.(investment)
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getTypeIcon(investment.type)}</div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {investment.symbol}
                      </h3>
                      <p className="text-sm text-muted-foreground">{investment.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getRecommendationColor(investment.recommendation)}`}>
                          {investment.recommendation}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getRiskColor(investment.riskLevel)}`}>
                          {investment.riskLevel} Risk
                        </Badge>
                      </div>
                      {investment.rationale && (
                        <div className="mt-3 text-[11px] text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded border-l-2 border-primary/40">
                          {investment.rationale}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Position</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSellInvestment?.(investment)}>
                        Sell Position
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Price</div>
                      <div className="font-semibold">{formatINR(investment.currentPrice)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Quantity</div>
                      <div className="font-semibold">{investment.quantity}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Invested</div>
                      <div className="font-semibold">{formatINR(investment.investedAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Value</div>
                      <div className="font-semibold">{formatINR(currentValue)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
                      <div className={`flex items-center text-sm font-medium ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isGain ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {formatINR(Math.abs(investment.totalGain || 0))} ({(investment.gainPercent || 0).toFixed(2)}%)
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Today's Change</span>
                      <div className={`flex items-center text-sm font-medium ${isDayGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isDebt ? null : (isDayGain ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />)}
                        {isDebt ? "Stable" : `${formatINR(Math.abs(displayDayChange))} (${(displayDayChangePercent || 0).toFixed(2)}%)`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sector</span>
                      <span className="font-medium">{investment.sector}</span>
                    </div>
                    {isDebt && (investment.rate || investment.tenure) && (
                      <div className="flex items-center justify-between text-sm py-1 px-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Interest Rate</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{((investment.rate || 0.07) * 100).toFixed(1)}% p.a.</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Duration</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{investment.tenure || 'N/A'} Years</span>
                        </div>
                      </div>
                    )}
                    {!isDebt && investment.volume !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-medium">
                          {investment.volume > 1000000
                            ? `${(investment.volume / 1000000).toFixed(1)}M`
                            : investment.volume > 1000
                              ? `${(investment.volume / 1000).toFixed(1)}K`
                              : investment.volume.toLocaleString()
                          }
                        </span>
                      </div>
                    )}
                    {!isDebt && investment.week52High !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">52W Range</span>
                        <span className="font-medium whitespace-nowrap">
                          {formatINR(investment.week52Low || 0)} - {formatINR(investment.week52High || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Investment Details */}
      {selectedInvestment && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="flex items-center justify-between pb-4">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{getTypeIcon(selectedInvestment.type)}</div>
              <div>
                <CardTitle className="text-2xl">{selectedInvestment.symbol}</CardTitle>
                <p className="text-muted-foreground">{selectedInvestment.name}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className={`text-sm ${getRecommendationColor(selectedInvestment.recommendation)}`}>
                    {selectedInvestment.recommendation}
                  </Badge>
                  <Badge variant="outline" className={`text-sm ${getRiskColor(selectedInvestment.riskLevel)}`}>
                    {selectedInvestment.riskLevel} Risk
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {selectedInvestment.sector}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedInvestment(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                <div className="text-xl font-bold">{formatINR(selectedInvestment.currentPrice)}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Quantity</div>
                <div className="text-xl font-bold">{selectedInvestment.quantity}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                <div className="text-xl font-bold">{formatINR(selectedInvestment.currentValue)}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Total Gain</div>
                <div className={`text-xl font-bold ${selectedInvestment.totalGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatINR(selectedInvestment.totalGain)}
                </div>
              </div>
            </div>

            {selectedInvestment.rationale && (
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Investment Rationale & Rating</h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                  "{selectedInvestment.rationale}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Return</span>
                    <span className={`font-medium ${(selectedInvestment.gainPercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(selectedInvestment.gainPercent || 0) >= 0 ? '+' : ''}{(selectedInvestment.gainPercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  {!(selectedInvestment.type?.toLowerCase().includes('fd') || selectedInvestment.type?.toLowerCase().includes('ppf')) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day Change</span>
                      <span className={`font-medium ${selectedInvestment.dayChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedInvestment.dayChange >= 0 ? '+' : ''}{formatINR(selectedInvestment.dayChange)}
                      </span>
                    </div>
                  )}
                  {selectedInvestment.marketCap && selectedInvestment.marketCap !== "0" && selectedInvestment.marketCap !== "N/A" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span className="font-medium">{selectedInvestment.marketCap}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Investment Analysis</h4>
                <div className="space-y-3">
                  {selectedInvestment.recommendation && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analyst Recommendation</span>
                      <Badge variant="outline" className={getRecommendationColor(selectedInvestment.recommendation)}>
                        {selectedInvestment.recommendation}
                      </Badge>
                    </div>
                  )}
                  {selectedInvestment.riskLevel && (selectedInvestment.riskLevel as string) !== "Unknown" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Level</span>
                      <Badge variant="outline" className={getRiskColor(selectedInvestment.riskLevel)}>
                        {selectedInvestment.riskLevel}
                      </Badge>
                    </div>
                  )}
                  {!selectedInvestment.type?.toLowerCase().includes('fd') && !selectedInvestment.type?.toLowerCase().includes('ppf') && selectedInvestment.volume !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-medium">
                        {selectedInvestment.volume > 1000000
                          ? `${(selectedInvestment.volume / 1000000).toFixed(1)}M`
                          : selectedInvestment.volume > 1000
                            ? `${(selectedInvestment.volume / 1000).toFixed(1)}K`
                            : selectedInvestment.volume.toLocaleString()
                        }
                      </span>
                    </div>
                  )}
                  {!selectedInvestment.type?.toLowerCase().includes('fd') && !selectedInvestment.type?.toLowerCase().includes('ppf') && selectedInvestment.week52High !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52-Week Range</span>
                      <span className="font-medium whitespace-nowrap">
                        {formatINR(selectedInvestment.week52Low || 0)} - {formatINR(selectedInvestment.week52High || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
