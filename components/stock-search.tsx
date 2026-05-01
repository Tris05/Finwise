"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Eye,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  currentPrice: number
  dayChange: number
  dayChangePercent: number
  currency: string
  marketCap: number
  sector: string
  industry: string
  pe?: number
  dividend: number
  volume: number
  avgVolume: number
  beta?: number
  website?: string
  description: string
  employees?: number
  city: string
  state: string
  country: string
  logoUrl?: string
  isValid: boolean
  week52High?: number
  week52Low?: number
}

interface DetailedStockData extends StockSearchResult {
  shortName: string
  previousClose: number
  open: number
  high: number
  low: number
  forwardPE?: number
  pegRatio?: number
  priceToBook?: number
  priceToSales?: number
  payoutRatio?: number
  volatility: number
  riskLevel: 'Low' | 'Medium' | 'High'
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell'
  volumeRatio: number
  debtToEquity?: number
  currentRatio?: number
  quickRatio?: number
  revenueGrowth?: number
  earningsGrowth?: number
  profitMargins?: number
  ma20: number
  ma50: number
  lastUpdated: string
}

interface StockSearchProps {
  onAddToWatchlist?: (stock: StockSearchResult) => void
  onAddToPortfolio?: (stock: StockSearchResult) => void
  onViewDetails?: (stock: StockSearchResult) => void
}

export function StockSearch({ onAddToWatchlist, onAddToPortfolio, onViewDetails }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (query.trim().length >= 2) {
            performSearch(query)
          } else {
            setSearchResults([])
          }
        }, 300)
      }
    })(),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_stocks',
          query: query,
          limit: 10
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSearchResults(result.data || [])
      } else {
        throw new Error(result.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])

      // Show a helpful message for common issues
      if (error instanceof Error && error.message.includes('500')) {
        setSearchError('Server error - please try again in a moment')
      }
    } finally {
      setIsSearching(false)
    }
  }

  
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return null
  }

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

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Live Stock Search</h2>
        <p className="text-muted-foreground">Search for any stock symbol or company name to get real-time data</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search stocks (e.g., AAPL, Microsoft, RELIANCE, TCS...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Error */}
      {searchError && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{searchError}</span>
        </div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold">Search Results</h3>
            {searchResults.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-semibold text-lg">{stock.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span className="font-mono">{stock.symbol}</span>
                              <span>•</span>
                              <span>{stock.exchange}</span>
                              <span>•</span>
                              <span>{stock.sector}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Price</div>
                            <div className="font-semibold">
                              {stock.currency === 'INR' ? formatINR(stock.currentPrice) : `$${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Change</div>
                            <div className={`font-semibold flex items-center space-x-1 ${getChangeColor(stock.dayChange)}`}>
                              {getChangeIcon(stock.dayChange)}
                              <span>{stock.dayChangePercent.toFixed(2)}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Volume</div>
                            <div className="font-semibold text-sm">
                              {stock.volume > 1000000
                                ? `${(stock.volume / 1000000).toFixed(1)}M`
                                : stock.volume > 1000
                                  ? `${(stock.volume / 1000).toFixed(1)}K`
                                  : stock.volume.toLocaleString()
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">52W Range</div>
                            <div className="font-semibold text-sm whitespace-nowrap">
                              {stock.currency === 'INR' ? formatINR(stock.week52Low || 0) : `$${(stock.week52Low || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} - {stock.currency === 'INR' ? formatINR(stock.week52High || 0) : `$${(stock.week52High || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails?.(stock)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="ml-2">Details</span>
                        </Button>

                        <div className="flex space-x-2">
                          {onAddToWatchlist && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddToWatchlist(stock)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {onAddToPortfolio && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddToPortfolio(stock)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      </div>
  )
}
