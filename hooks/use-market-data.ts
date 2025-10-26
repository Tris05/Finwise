"use client"

import { useState, useEffect, useCallback } from 'react'

interface MarketData {
  symbol: string
  name: string
  currentPrice: number
  dayChange: number
  dayChangePercent: number
  previousClose: number
  week52High: number
  week52Low: number
  marketCap: number
  pe: number | null
  dividend: number | null
  volatility: number
  riskLevel: 'Low' | 'Medium' | 'High'
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell'
  sector: string
  industry: string
  currency: string
  exchange: string
  lastUpdated: string
}

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

interface UseMarketDataReturn {
  investments: Investment[]
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  refreshData: () => Promise<void>
  updatePortfolio: (portfolio: Investment[]) => Promise<void>
}

export function useMarketData(initialPortfolio: Investment[]): UseMarketDataReturn {
  const [investments, setInvestments] = useState<Investment[]>(initialPortfolio)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchMarketData = useCallback(async (portfolio: Investment[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_portfolio',
          portfolio: portfolio
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch market data: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setInvestments(result.data || [])
        setLastUpdated(result.timestamp)
      } else {
        throw new Error(result.error || 'Failed to fetch market data')
      }
    } catch (err) {
      console.error('Error fetching market data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      // Keep existing data on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await fetchMarketData(investments)
  }, [fetchMarketData, investments])

  const updatePortfolio = useCallback(async (portfolio: Investment[]) => {
    await fetchMarketData(portfolio)
  }, [fetchMarketData])

  // Initial data fetch
  useEffect(() => {
    fetchMarketData(initialPortfolio)
  }, [fetchMarketData, initialPortfolio])

  return {
    investments,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    updatePortfolio
  }
}

// Hook for fetching individual stock data
export function useStockData(symbol: string) {
  const [stockData, setStockData] = useState<MarketData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStockData = useCallback(async () => {
    if (!symbol) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_stock',
          symbol: symbol
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch stock data: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setStockData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch stock data')
      }
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    fetchStockData()
  }, [fetchStockData])

  return {
    stockData,
    isLoading,
    error,
    refetch: fetchStockData
  }
}

// Hook for fetching multiple stocks data
export function useMultipleStocksData(symbols: string[]) {
  const [stocksData, setStocksData] = useState<Record<string, MarketData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStocksData = useCallback(async () => {
    if (!symbols.length) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_multiple',
          symbols: symbols
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch stocks data: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setStocksData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch stocks data')
      }
    } catch (err) {
      console.error('Error fetching stocks data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [symbols])

  useEffect(() => {
    fetchStocksData()
  }, [fetchStocksData])

  return {
    stocksData,
    isLoading,
    error,
    refetch: fetchStocksData
  }
}
