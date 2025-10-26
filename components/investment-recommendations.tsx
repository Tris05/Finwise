"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calculator,
  Brain,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Star,
  Zap
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Investment {
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
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Strong Buy' | 'Strong Sell'
  riskLevel: 'Low' | 'Medium' | 'High'
}

interface RecommendationAnalysis {
  symbol: string
  name: string
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  riskScore: number
  rewardScore: number
  timeHorizon: 'Short' | 'Medium' | 'Long'
  reasoning: string[]
  financialMetrics: {
    valuation: 'Undervalued' | 'Fair' | 'Overvalued'
    momentum: 'Strong' | 'Moderate' | 'Weak'
    fundamentals: 'Strong' | 'Moderate' | 'Weak'
    technical: 'Bullish' | 'Neutral' | 'Bearish'
  }
  riskFactors: string[]
  opportunityFactors: string[]
  targetPrice?: number
  stopLoss?: number
  portfolioImpact: 'High' | 'Medium' | 'Low'
  diversificationBenefit: number
}

interface InvestmentRecommendationsProps {
  investments: Investment[]
  onRefreshRecommendations: () => void
  isLoading?: boolean
}

// Advanced recommendation engine with comprehensive analysis
const generateRecommendations = (investments: Investment[]): RecommendationAnalysis[] => {
  return investments.map(investment => {
    const {
      symbol,
      name,
      currentPrice,
      gainPercent,
      dayChangePercent,
      pe,
      dividend,
      riskLevel,
      sector,
      currentValue,
      investedAmount
    } = investment

    // Calculate various metrics
    const isProfitable = gainPercent > 0
    const isRecentPositive = dayChangePercent > 0
    const portfolioWeight = (currentValue / investments.reduce((sum, inv) => sum + inv.currentValue, 0)) * 100
    
    // Risk assessment
    const riskScore = calculateRiskScore(investment)
    const rewardScore = calculateRewardScore(investment)
    
    // Determine action based on comprehensive analysis
    let action: 'BUY' | 'SELL' | 'HOLD'
    let confidence: number
    let reasoning: string[] = []
    let riskFactors: string[] = []
    let opportunityFactors: string[] = []

    // Financial metrics analysis
    const valuation = analyzeValuation(investment)
    const momentum = analyzeMomentum(investment)
    const fundamentals = analyzeFundamentals(investment)
    const technical = analyzeTechnical(investment)

    // Generate recommendations based on multiple factors
    if (riskScore < 3 && rewardScore > 7 && valuation === 'Undervalued' && fundamentals === 'Strong') {
      action = 'BUY'
      confidence = 85
      reasoning = [
        "Strong fundamental metrics with attractive valuation",
        "Low risk profile with high reward potential",
        "Positive momentum and technical indicators",
        "Sector outlook remains favorable"
      ]
      opportunityFactors = [
        "Undervalued compared to sector peers",
        "Strong balance sheet and cash flow",
        "Growing market share in sector",
        "Dividend yield provides downside protection"
      ]
    } else if (riskScore > 7 || (gainPercent > 50 && portfolioWeight > 15)) {
      action = 'SELL'
      confidence = 80
      reasoning = [
        "High risk exposure or overconcentration",
        "Significant gains suggest profit-taking opportunity",
        "Portfolio rebalancing needed",
        "Risk management priority"
      ]
      riskFactors = [
        "High portfolio concentration risk",
        "Valuation concerns at current levels",
        "Market volatility exposure",
        "Sector-specific headwinds"
      ]
    } else if (isProfitable && gainPercent < 20 && fundamentals === 'Strong') {
      action = 'HOLD'
      confidence = 75
      reasoning = [
        "Solid fundamentals support continued holding",
        "Moderate gains suggest room for further upside",
        "Risk-reward balance remains favorable",
        "No immediate catalysts for significant change"
      ]
      opportunityFactors = [
        "Consistent performance track record",
        "Strong management and business model",
        "Defensive characteristics in volatile markets",
        "Regular dividend income"
      ]
    } else {
      action = 'HOLD'
      confidence = 60
      reasoning = [
        "Mixed signals require monitoring",
        "Market conditions uncertain",
        "Wait for clearer directional signals",
        "Maintain current position"
      ]
    }

    // Additional risk factors based on investment characteristics
    if (riskLevel === 'High') {
      riskFactors.push("High volatility asset class")
    }
    if (typeof pe === 'number' && pe > 25) {
      riskFactors.push("High valuation multiples")
    }
    if (sector === 'Crypto') {
      riskFactors.push("Regulatory uncertainty", "High volatility")
    }

    // Time horizon determination
    let timeHorizon: 'Short' | 'Medium' | 'Long'
    if (action === 'SELL' || riskScore > 6) {
      timeHorizon = 'Short'
    } else if (action === 'BUY' && fundamentals === 'Strong') {
      timeHorizon = 'Long'
    } else {
      timeHorizon = 'Medium'
    }

    // Portfolio impact assessment
    let portfolioImpact: 'High' | 'Medium' | 'Low'
    if (portfolioWeight > 10) {
      portfolioImpact = 'High'
    } else if (portfolioWeight > 5) {
      portfolioImpact = 'Medium'
    } else {
      portfolioImpact = 'Low'
    }

    // Diversification benefit
    const diversificationBenefit = calculateDiversificationBenefit(investment, investments)

    return {
      symbol,
      name,
      action,
      confidence,
      riskScore,
      rewardScore,
      timeHorizon,
      reasoning,
      financialMetrics: {
        valuation,
        momentum,
        fundamentals,
        technical
      },
      riskFactors,
      opportunityFactors,
      targetPrice: action === 'BUY' ? currentPrice * 1.15 : undefined,
      stopLoss: action === 'SELL' ? currentPrice * 0.9 : undefined,
      portfolioImpact,
      diversificationBenefit
    }
  })
}

// Helper functions for analysis
const calculateRiskScore = (investment: Investment): number => {
  let score = 0
  
  // Risk level contribution
  switch (investment.riskLevel) {
    case 'Low': score += 2; break
    case 'Medium': score += 5; break
    case 'High': score += 8; break
  }
  
  // Volatility based on day change
  if (Math.abs(investment.dayChangePercent) > 5) score += 3
  else if (Math.abs(investment.dayChangePercent) > 2) score += 1
  
  // Sector risk
  if (investment.sector === 'Crypto') score += 4
  else if (investment.sector === 'Energy') score += 2
  
  // Valuation risk
  if (typeof investment.pe === 'number' && investment.pe > 30) score += 2
  
  return Math.min(score, 10)
}

const calculateRewardScore = (investment: Investment): number => {
  let score = 0
  
  // Performance contribution
  if (investment.gainPercent > 20) score += 3
  else if (investment.gainPercent > 10) score += 2
  else if (investment.gainPercent > 0) score += 1
  
  // Recent momentum
  if (investment.dayChangePercent > 2) score += 2
  else if (investment.dayChangePercent > 0) score += 1
  
  // Dividend yield
  if (typeof investment.dividend === 'number' && investment.dividend > 3) score += 2
  else if (typeof investment.dividend === 'number' && investment.dividend > 1) score += 1
  
  // Sector growth potential
  if (investment.sector === 'IT Services') score += 2
  else if (investment.sector === 'Banking') score += 1
  
  return Math.min(score, 10)
}

const analyzeValuation = (investment: Investment): 'Undervalued' | 'Fair' | 'Overvalued' => {
  if (typeof investment.pe === 'number') {
    if (investment.pe < 15) return 'Undervalued'
    if (investment.pe > 25) return 'Overvalued'
  }
  return 'Fair'
}

const analyzeMomentum = (investment: Investment): 'Strong' | 'Moderate' | 'Weak' => {
  if (investment.dayChangePercent > 2 && investment.gainPercent > 10) return 'Strong'
  if (investment.dayChangePercent < -2 && investment.gainPercent < -5) return 'Weak'
  return 'Moderate'
}

const analyzeFundamentals = (investment: Investment): 'Strong' | 'Moderate' | 'Weak' => {
  let score = 0
  
  if (investment.gainPercent > 0) score += 1
  if (typeof investment.dividend === 'number' && investment.dividend > 2) score += 1
  if (investment.riskLevel === 'Low') score += 1
  if (investment.sector === 'Banking' || investment.sector === 'IT Services') score += 1
  
  if (score >= 3) return 'Strong'
  if (score >= 2) return 'Moderate'
  return 'Weak'
}

const analyzeTechnical = (investment: Investment): 'Bullish' | 'Neutral' | 'Bearish' => {
  if (investment.dayChangePercent > 1 && investment.gainPercent > 5) return 'Bullish'
  if (investment.dayChangePercent < -1 && investment.gainPercent < -5) return 'Bearish'
  return 'Neutral'
}

const calculateDiversificationBenefit = (investment: Investment, allInvestments: Investment[]): number => {
  const sameSectorCount = allInvestments.filter(inv => inv.sector === investment.sector).length
  const totalCount = allInvestments.length
  return Math.max(0, 10 - (sameSectorCount / totalCount) * 10)
}

export function InvestmentRecommendations({ 
  investments, 
  onRefreshRecommendations, 
  isLoading = false 
}: InvestmentRecommendationsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const recommendations = generateRecommendations(investments)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <ArrowUpRight className="h-4 w-4" />
      case 'SELL': return <ArrowDownRight className="h-4 w-4" />
      case 'HOLD': return <Minus className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'SELL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'HOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'Strong': case 'Bullish': case 'Undervalued': return 'text-green-600 dark:text-green-400'
      case 'Moderate': case 'Neutral': case 'Fair': return 'text-yellow-600 dark:text-yellow-400'
      case 'Weak': case 'Bearish': case 'Overvalued': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Investment Recommendations</h2>
          <p className="text-muted-foreground">Comprehensive analysis with risk-reward assessment</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshRecommendations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getActionColor(rec.action)}>
                          {getActionIcon(rec.action)}
                          <span className="ml-1">{rec.action}</span>
                        </Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {rec.confidence}% Confidence
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCard(expandedCard === rec.symbol ? null : rec.symbol)}
                    >
                      {expandedCard === rec.symbol ? 'Show Less' : 'Show Details'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{rec.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{rec.symbol}</span>
                      <span>•</span>
                      <span>{rec.timeHorizon} Term</span>
                      <span>•</span>
                      <span>{rec.portfolioImpact} Portfolio Impact</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Risk-Reward Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk Score</span>
                        <span className="text-sm text-red-600 dark:text-red-400">{rec.riskScore}/10</span>
                      </div>
                      <Progress value={rec.riskScore * 10} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Reward Score</span>
                        <span className="text-sm text-green-600 dark:text-green-400">{rec.rewardScore}/10</span>
                      </div>
                      <Progress value={rec.rewardScore * 10} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Diversification</span>
                        <span className="text-sm text-blue-600 dark:text-blue-400">{rec.diversificationBenefit.toFixed(1)}/10</span>
                      </div>
                      <Progress value={rec.diversificationBenefit * 10} className="h-2" />
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className="text-xs text-muted-foreground mb-1">Valuation</div>
                      <div className={`font-semibold ${getMetricColor(rec.financialMetrics.valuation)}`}>
                        {rec.financialMetrics.valuation}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className="text-xs text-muted-foreground mb-1">Momentum</div>
                      <div className={`font-semibold ${getMetricColor(rec.financialMetrics.momentum)}`}>
                        {rec.financialMetrics.momentum}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className="text-xs text-muted-foreground mb-1">Fundamentals</div>
                      <div className={`font-semibold ${getMetricColor(rec.financialMetrics.fundamentals)}`}>
                        {rec.financialMetrics.fundamentals}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className="text-xs text-muted-foreground mb-1">Technical</div>
                      <div className={`font-semibold ${getMetricColor(rec.financialMetrics.technical)}`}>
                        {rec.financialMetrics.technical}
                      </div>
                    </div>
                  </div>

                  {/* Key Reasoning */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center">
                      <Brain className="h-4 w-4 mr-2" />
                      Analysis Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-green-600 dark:text-green-400">Key Reasons</h5>
                        <ul className="text-sm space-y-1">
                          {rec.reasoning.map((reason, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400">Risk Factors</h5>
                        <ul className="text-sm space-y-1">
                          {rec.riskFactors.map((risk, idx) => (
                            <li key={idx} className="flex items-start">
                              <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedCard === rec.symbol && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t"
                      >
                        {/* Opportunity Factors */}
                        {rec.opportunityFactors.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400">Opportunity Factors</h5>
                            <ul className="text-sm space-y-1">
                              {rec.opportunityFactors.map((factor, idx) => (
                                <li key={idx} className="flex items-start">
                                  <Star className="h-3 w-3 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Price Targets */}
                        {(rec.targetPrice || rec.stopLoss) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rec.targetPrice && (
                              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <div className="text-sm font-medium text-green-800 dark:text-green-400">Target Price</div>
                                <div className="text-lg font-bold text-green-900 dark:text-green-300">
                                  {formatINR(rec.targetPrice)}
                                </div>
                              </div>
                            )}
                            {rec.stopLoss && (
                              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <div className="text-sm font-medium text-red-800 dark:text-red-400">Stop Loss</div>
                                <div className="text-lg font-bold text-red-900 dark:text-red-300">
                                  {formatINR(rec.stopLoss)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          {rec.action === 'BUY' && (
                            <Button className="bg-green-600 hover:bg-green-700">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Execute Buy
                            </Button>
                          )}
                          {rec.action === 'SELL' && (
                            <Button variant="destructive">
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Execute Sell
                            </Button>
                          )}
                          <Button variant="outline">
                            <Calculator className="h-4 w-4 mr-2" />
                            Calculate Impact
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
