"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { RebalanceModal } from "@/components/rebalance-modal"
import { PortfolioOverview } from "@/components/portfolio-overview"
import { PortfolioPie } from "@/components/portfolio-pie"
import { RealInvestmentTracker } from "@/components/real-investment-tracker"
import { InvestmentTransactions } from "@/components/investment-transactions"
import { MarketWatchlist } from "@/components/market-watchlist"
import { InvestmentGoals } from "@/components/investment-goals"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { AddGoalModal } from "@/components/add-goal-modal"
import { EditGoalModal } from "@/components/edit-goal-modal"
import { EditTransactionModal } from "@/components/edit-transaction-modal"
import { SellInvestmentModal } from "@/components/sell-investment-modal"
import { AssetDetailsModal } from "@/components/asset-details-modal"
import { InvestmentRecommendations } from "@/components/investment-recommendations"
import { InvestmentInsights } from "@/components/investment-insights"
import { StockSearch } from "@/components/stock-search"
import { useMarketData } from "@/hooks/use-market-data"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart, ReferenceLine } from "recharts"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Wifi, WifiOff, RefreshCw, Sparkles, PlusCircle, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { EditHoldingModal } from "@/components/edit-holding-modal"
import { FinancialProfileForm } from "@/components/FinancialProfileForm"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect } from "react"

const LIVE_REFRESH_MS = 60000
const MOMENTUM_REFRESH_MS = 300000 // 5 minutes
const MAX_LIVE_POINTS = 120
const MARKET_INDICATORS = [
  { key: "nifty", label: "Nifty 50", symbol: "^NSEI", color: "#3B82F6" },
  { key: "sensex", label: "Sensex", symbol: "^BSESN", color: "#10B981" },
  { key: "gold", label: "Gold", symbol: "GC=F", color: "#F59E0B" },
  { key: "btc", label: "Bitcoin", symbol: "BTC-USD", color: "#8B5CF6" },
] as const

// Calculate real portfolio data from investments
const calculatePortfolioData = (investments: any[]) => {
  const totalValue = investments.reduce((sum, inv) => sum + (Number(inv.currentValue) || 0), 0)
  const totalInvested = investments.reduce((sum, inv) => sum + (Number(inv.investedAmount) || 0), 0)
  const totalGain = investments.reduce((sum, inv) => sum + (Number(inv.totalGain) || 0), 0)

  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const dayChange = investments.reduce((sum, inv) => sum + ((Number(inv.dayChange) || 0) * (Number(inv.quantity) || 0)), 0)
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

  return {
    totalValue,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent
  }
}

// Calculate portfolio allocation data for pie chart
const calculatePortfolioAllocation = (investments: any[]) => {
  const allocation = investments.reduce((acc, investment) => {
    const category = investment.category
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, color: investment.color }
    }
    acc[category].value += investment.currentValue
    return acc
  }, {} as Record<string, { name: string; value: number; color: string }>)


  return Object.values(allocation)
}

export default function InvestmentsPage() {
  const { toast } = useToast()

  // UI States
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false)
  const [rebalanceOpen, setRebalanceOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [assetDetailsOpen, setAssetDetailsOpen] = useState(false)
  const [assetForDetails, setAssetForDetails] = useState<any>(null)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [sellInvestmentOpen, setSellInvestmentOpen] = useState(false)
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false)
  const [editTransactionOpen, setEditTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [editHoldingOpen, setEditHoldingOpen] = useState(false)
  const [holdingForEdit, setHoldingForEdit] = useState<any>(null)
  const [assignGoalOpen, setAssignGoalOpen] = useState(false)
  const [holdingForGoalAssign, setHoldingForGoalAssign] = useState<any>(null)
  const [assignGoalPick, setAssignGoalPick] = useState<string>("none")

  // Data States
  const [investments, setInvestments] = useState<any[]>([])
  const [latestRecommendation, setLatestRecommendation] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [marketAssetsState, setMarketAssets] = useState<any[]>([])
  const [historyData, setHistoryData] = useState<any[]>([])
  const [liveChartData, setLiveChartData] = useState<any[]>([])
  const [indicatorBaselines, setIndicatorBaselines] = useState<Record<string, number>>({})
  const [latestIndicators, setLatestIndicators] = useState<Record<string, { price: number; dayChangePercent: number; currency: string }>>({})
  const [marketOpenData, setMarketOpenData] = useState<Record<string, { price: number; dayChangePercent: number; currency: string }>>({})
  const [momentumChartData, setMomentumChartData] = useState<any[]>([])

  // Fetch market data for a given list of symbols
  const fetchMarketAssetsData = async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) {
      setMarketAssets([])
      return
    }

    setIsMarketDataLoading(true)
    try {
      const res = await fetch('/api/market-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_portfolio',
          portfolio: symbols.map(s => ({
            symbol: s,
            type: 'stock',
            quantity: 1,
            investedAmount: 1
          }))
        })
      })
      const json = await res.json()
      if (json.success && json.data) {
        setMarketAssets(json.data.map((d: any) => ({
          symbol: d.symbol,
          name: d.name,
          price: d.currentPrice,
          currency: d.currency || "USD",
          change: d.dayChange,
          changePercent: d.dayChangePercent,
          volume: d.volume,
          marketCap: d.marketCap,
          category: d.sector || 'Equity',
          isWatched: true,
          isOwned: false // Computed dynamically in component if needed
        })))
      }
    } catch (error) {
      console.error("Failed to fetch market assets data:", error)
    } finally {
      setIsMarketDataLoading(false)
    }
  }

  // Auth & Sync
  useEffect(() => {
    let unsubs: (() => void)[] = []

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Unsubscribe from previous listeners
      unsubs.forEach(unsub => unsub())
      unsubs = []

      if (user) {
        setUserId(user.uid)

        // Subscribe to Portfolio
        const portfolioRef = collection(db, "users", user.uid, "portfolio")
        unsubs.push(onSnapshot(portfolioRef, (snapshot) => {
          const portfolioData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          }))
          setInvestments(portfolioData)
        }))

        // Subscribe to Latest Recommendation
        const requestsRef = collection(db, "users", user.uid, "portfolio_requests")
        const qRecs = query(requestsRef, where("status", "==", "completed"), orderBy("created_at", "desc"), limit(1))
        unsubs.push(onSnapshot(qRecs, (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data()
            setLatestRecommendation({
              id: snapshot.docs[0].id,
              ...data,
              timestamp: data.created_at?.toDate() || new Date()
            })
          }
        }))

        // Subscribe to Transactions
        const transactionsRef = collection(db, "users", user.uid, "transactions")
        const qTransactions = query(transactionsRef, orderBy("date", "desc"))
        unsubs.push(onSnapshot(qTransactions, (snapshot) => {
          const transactionsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          }))
          setTransactions(transactionsData)
        }))

        // Subscribe to Goals
        const goalsRef = collection(db, "users", user.uid, "goals")
        unsubs.push(onSnapshot(goalsRef, (snapshot) => {
          const goalsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          }))
          setGoals(goalsData)
        }))

        // Subscribe to Watchlist
        const watchlistRef = collection(db, "users", user.uid, "watchlist")
        unsubs.push(onSnapshot(watchlistRef, (snapshot) => {
          const watchedSymbols = snapshot.docs.map(doc => doc.id)
          fetchMarketAssetsData(watchedSymbols)
        }))

        // Subscribe to Portfolio History
        const historyRef = collection(db, "users", user.uid, "portfolio_history")
        const qHistoryAll = query(historyRef, orderBy("date", "asc"))
        unsubs.push(onSnapshot(qHistoryAll, (snapshot) => {
          const hData = snapshot.docs.map(doc => doc.data())
          setHistoryData(hData)
        }))

        // Trigger Portfolio Snapshot
        const checkSnapshot = async () => {
          const historyRef = collection(db, "users", user.uid, "portfolio_history")
          const today = new Date().toISOString().split('T')[0]

          // Use a simple getDoc-like query to check if today exists
          const qHistory = query(historyRef, where("date", "==", today), limit(1))
          unsubs.push(onSnapshot(qHistory, (snapshot) => {
            if (snapshot.empty && investments.length >= 0) {
              // We need to be careful with the dependency here. 
              // Usually we'd use getDocs once, but onSnapshot works if we only add if empty.
              addDoc(historyRef, {
                date: today,
                value: calculatePortfolioData(investments).totalValue,
                invested: investments.reduce((sum, inv) => sum + (Number(inv.investedAmount) || 0), 0),
                gain: calculatePortfolioData(investments).totalGain,
                created_at: serverTimestamp()
              })
            }
          }))
        }
        checkSnapshot()
      } else {
        setUserId(null)
        setInvestments([])
        setLatestRecommendation(null)
        setTransactions([])
        setGoals([])
      }
    })

    return () => {
      unsubscribeAuth()
      unsubs.forEach(unsub => unsub())
    }
  }, [])

  // Use real-time market data
  const {
    investments: realTimeInvestments,
    isLoading: isMarketDataFetching,
    error: marketDataError,
    lastUpdated,
    refreshData: refreshMarketData
  } = useMarketData(investments)

  // Calculate portfolio data from real-time investments
  const portfolioData = calculatePortfolioData(realTimeInvestments)
  const portfolioAllocation = calculatePortfolioAllocation(realTimeInvestments)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refreshMarketData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh market data properly instead of faking it
  const refreshMarketDataHandler = async () => {
    if (!userId) return
    const symbols = marketAssetsState.map(a => a.symbol)
    await fetchMarketAssetsData(symbols)
  }

  const fetchIndicators = async () => {
    try {
      const responses = await Promise.all(
        MARKET_INDICATORS.map(async (indicator) => {
          const response = await fetch('/api/market-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_stock',
              symbol: indicator.symbol
            })
          })
          const result = await response.json()
          if (result.success && result.data?.currentPrice) {
            return {
              key: indicator.key,
              price: Number(result.data.currentPrice),
              dayChangePercent: Number(result.data.dayChangePercent || 0),
              currency: String(result.data.currency || "USD")
            }
          }
          return null
        })
      )

      const validResponses = responses.filter(Boolean) as { key: string; price: number; dayChangePercent: number; currency: string }[]
      if (validResponses.length === 0) return

      const latestMap = validResponses.reduce((acc, item) => {
        acc[item.key] = { price: item.price, dayChangePercent: item.dayChangePercent, currency: item.currency }
        return acc
      }, {} as Record<string, { price: number; dayChangePercent: number; currency: string }>)
      setLatestIndicators(latestMap)

      setIndicatorBaselines((prev) => {
        const next = { ...prev }
        validResponses.forEach((item) => {
          if (!next[item.key] && item.price > 0) {
            next[item.key] = item.price
          }
        })

        const point: Record<string, any> = {
          t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }
        MARKET_INDICATORS.forEach((indicator) => {
          point[`${indicator.key}Price`] = null
          point[`${indicator.key}Move`] = null
          point[`${indicator.key}DayMove`] = null
        })
        validResponses.forEach((item) => {
          const baseline = next[item.key] || item.price || 1
          const movePct = ((item.price - baseline) / baseline) * 100
          point[`${item.key}Price`] = Number(item.price.toFixed(2))
          point[`${item.key}Move`] = Number(movePct.toFixed(2))
          point[`${item.key}DayMove`] = Number(item.dayChangePercent.toFixed(2))
        })

        setLiveChartData((prevPoints) => [...prevPoints, point].slice(-MAX_LIVE_POINTS))
        return next
      })
    } catch (error) {
      console.error("Failed to fetch market indicators:", error)
    }
  }

  useEffect(() => {
    // Preload data immediately for instant chart display
    preloadHistoricalData()

    // Start real data fetching
    void fetchIndicators()
    const interval = setInterval(() => {
      void fetchIndicators()
    }, LIVE_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  // Fetch market open data for momentum streams
  const fetchMarketOpenData = async () => {
    try {
      const responses = await Promise.allSettled(
        MARKET_INDICATORS.map(async (indicator) => {
          const response = await fetch(`/api/market-data?symbol=${indicator.symbol}&type=quote`)
          if (!response.ok) return null
          const data = await response.json()
          if (data.error) return null
          return {
            key: indicator.key,
            price: data.price || 0,
            dayChangePercent: data.dayChangePercent || 0,
            currency: data.currency || "INR"
          }
        })
      )

      const validResponses = responses
        .filter((result) => result.status === 'fulfilled' && (result as any).value !== null)
        .map((result) => (result as any).value) as { key: string; price: number; dayChangePercent: number; currency: string }[]
      if (validResponses.length === 0) return

      // Store market open data (only set if not already set)
      setMarketOpenData((prev) => {
        if (Object.keys(prev).length === 0) {
          const marketOpenMap = validResponses.reduce((acc, item) => {
            acc[item.key] = { price: item.price, dayChangePercent: item.dayChangePercent, currency: item.currency }
            return acc
          }, {} as Record<string, { price: number; dayChangePercent: number; currency: string }>)
          return marketOpenMap
        }
        return prev
      })

      // Create momentum chart data point
      const point: Record<string, any> = {
        t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      validResponses.forEach((item) => {
        point[`${item.key}DayMove`] = Number(item.dayChangePercent.toFixed(2))
      })

      setMomentumChartData((prevPoints) => [...prevPoints, point].slice(-50)) // Keep last 50 points
    } catch (error) {
      console.error("Failed to fetch market open data:", error)
    }
  }

  // Preload historical data for immediate chart display
  const preloadHistoricalData = () => {
    const now = new Date()
    const marketOpenTime = new Date(now)
    marketOpenTime.setHours(9, 15, 0, 0) // Indian market opens at 9:15 AM

    // Generate historical data points for Live Market Pulse (last 30 points, 1 minute intervals)
    const liveHistoricalData = []
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000)
      const point: Record<string, any> = {
        t: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }

      // Generate realistic mock data for each indicator
      MARKET_INDICATORS.forEach((indicator) => {
        const baseChange = Math.random() * 2 - 1 // Random between -1 and 1
        const volatility = indicator.key === 'btc' ? 3 : indicator.key === 'gold' ? 1.5 : 0.8
        const change = baseChange * volatility
        point[`${indicator.key}Move`] = Number(change.toFixed(2))
        point[`${indicator.key}DayMove`] = Number(change.toFixed(2))
      })

      liveHistoricalData.push(point)
    }
    setLiveChartData(liveHistoricalData)

    // Generate historical data for Momentum Streams with hour markers
    const momentumHistoricalData = []
    const marketStartTime = new Date(now)
    marketStartTime.setHours(9, 15, 0, 0)

    // Generate data points including hour markers
    const hourMarkers = ['10:15', '11:15', '12:15', '1:15', '2:15', '3:15']
    const currentTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Add data points from market open to current time
    let dataPointTime = new Date(marketStartTime)
    let pointIndex = 0

    while (dataPointTime <= now && pointIndex < 50) {
      const timeStr = dataPointTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const point: Record<string, any> = {
        t: timeStr,
      }

      // Generate realistic cumulative growth data
      const hoursFromOpen = (dataPointTime.getTime() - marketStartTime.getTime()) / (1000 * 60 * 60)
      MARKET_INDICATORS.forEach((indicator) => {
        const baseGrowth = Math.sin(hoursFromOpen * 0.5) * 2 + Math.random() * 0.5
        const volatility = indicator.key === 'btc' ? 3 : indicator.key === 'gold' ? 1.5 : 0.8
        const change = baseGrowth * volatility * Math.min(hoursFromOpen / 6, 1)
        point[`${indicator.key}DayMove`] = Number(change.toFixed(2))
      })

      momentumHistoricalData.push(point)

      // Add extra points at hour markers for clarity
      if (hourMarkers.includes(timeStr)) {
        const markerPoint = { ...point }
        momentumHistoricalData.push(markerPoint)
      }

      dataPointTime = new Date(dataPointTime.getTime() + 5 * 60000) // 5 minute intervals
      pointIndex++
    }
    setMomentumChartData(momentumHistoricalData)

    // Initialize market open data with mock values
    const mockMarketOpen = MARKET_INDICATORS.reduce((acc, indicator) => {
      acc[indicator.key] = {
        price: indicator.key === 'nifty' ? 19500 + Math.random() * 1000 :
          indicator.key === 'sensex' ? 65000 + Math.random() * 2000 :
            indicator.key === 'gold' ? 62000 + Math.random() * 1000 :
              45000 + Math.random() * 5000, // BTC
        dayChangePercent: Math.random() * 2 - 1,
        currency: indicator.key === 'btc' ? 'USD' : 'INR'
      }
      return acc
    }, {} as Record<string, { price: number; dayChangePercent: number; currency: string }>)
    setMarketOpenData(mockMarketOpen)
  }

  // Separate useEffect for momentum streams (5 minutes)
  useEffect(() => {
    void fetchMarketOpenData()
    const interval = setInterval(() => {
      void fetchMarketOpenData()
    }, MOMENTUM_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  const formatIndicatorPrice = (price: number | undefined, currency: string | undefined) => {
    if (price == null || !Number.isFinite(price)) return "—"
    if (currency === "INR") return formatINR(price)
    if (currency === "USD") return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    return `${currency || "USD"} ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }

  const handleAssetClick = (_asset: any) => {
    // Intentionally no toast popup. Card details are shown inline in the portfolio tracker.
  }

  const handleRebalance = () => {
    setRebalanceOpen(true)
  }

  const handleAddTransaction = () => {
    setAddTransactionOpen(true)
  }

  const handleAddTransactionSubmit = async (newTransaction: any) => {
    if (!userId) return

    try {
      const { id: _omitClientId, ...transactionPayload } = newTransaction

      // 1. Save to Transactions collection (never persist client-generated id — must match Firestore doc id)
      const transactionsRef = collection(db, "users", userId, "transactions")
      await addDoc(transactionsRef, {
        ...transactionPayload,
        created_at: serverTimestamp()
      })

      // 2. Sync to Portfolio holdings
      const portfolioRef = collection(db, "users", userId, "portfolio")
      const q = query(portfolioRef, where("symbol", "==", newTransaction.asset))
      const querySnapshot = await getDocs(q)

      const isStable = ['debt', 'stable', 'fixed income', 'fd', 'ppf'].includes(newTransaction.category.toLowerCase())
      const goalIdForHolding = newTransaction.goalId || null

      if (newTransaction.type === "Buy" || newTransaction.type === "Dividend" || newTransaction.type === "Bonus") {
        if (!querySnapshot.empty) {
          // Update existing holding
          const portfolioDoc = querySnapshot.docs[0]
          const existingData = portfolioDoc.data()
          await updateDoc(portfolioDoc.ref, {
            quantity: (Number(existingData.quantity) || 0) + (Number(newTransaction.quantity) || 0),
            investedAmount: (Number(existingData.investedAmount) || 0) + (Number(newTransaction.amount) || 0),
            ...(goalIdForHolding ? { goalId: goalIdForHolding } : {}),
            updated_at: serverTimestamp()
          })
        } else {
          // Create new holding
          await addDoc(portfolioRef, {
            symbol: newTransaction.asset,
            name: newTransaction.asset, // Fallback to symbol
            type: newTransaction.category === 'Crypto' ? 'Crypto' :
              isStable ? 'Stable' : 'Stock',
            category: newTransaction.category,
            quantity: newTransaction.quantity,
            investedAmount: newTransaction.amount,
            currentPrice: newTransaction.price,
            currentValue: newTransaction.amount,
            totalGain: 0,
            gainPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            color: "#3B82F6",
            created_at: serverTimestamp(),
            lastSync: serverTimestamp(),
            ...(goalIdForHolding ? { goalId: goalIdForHolding } : {}),
          })
        }
      } else if (newTransaction.type === "Sell") {
        if (!querySnapshot.empty) {
          const portfolioDoc = querySnapshot.docs[0]
          const existingData = portfolioDoc.data()
          const newQty = (Number(existingData.quantity) || 0) - (Number(newTransaction.quantity) || 0)

          if (newQty <= 0.0001) {
            // Remove from portfolio if quantity is zero
            await deleteDoc(portfolioDoc.ref)
          } else {
            // Proportional reduction of investedAmount (cost basis)
            const oldQty = Number(existingData.quantity) || 1
            const oldInvested = Number(existingData.investedAmount) || 0
            const newInvested = oldInvested * (newQty / oldQty)

            await updateDoc(portfolioDoc.ref, {
              quantity: newQty,
              investedAmount: newInvested,
              updated_at: serverTimestamp()
            })
          }
        }
      }

      // Explicit goal balance update (sign depends on transaction type)
      if (newTransaction.goalId) {
        const amt = Number(newTransaction.amount) || 0
        const type = newTransaction.type as string
        const increasesGoal = ["Buy", "Dividend", "Bonus", "Interest"].includes(type)
        const decreasesGoal = type === "Sell"
        const delta = increasesGoal ? amt : decreasesGoal ? -amt : 0
        if (delta !== 0) {
          const goalRef = doc(db, "users", userId, "goals", newTransaction.goalId)
          await updateDoc(goalRef, {
            currentAmount: increment(delta),
            updated_at: serverTimestamp()
          })
        }
      }

      setAddTransactionOpen(false)
      toast({
        title: "Transaction Recorded",
        description: `Successfully added ${newTransaction.asset} and updated your portfolio.`
      })
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Failed to save transaction and update portfolio.",
        variant: "destructive"
      })
    }
  }

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction)
    setEditTransactionOpen(true)
  }

  const handleEditTransactionSave = async (updated: any, original: any) => {
    if (!userId) return
    try {
      // Update transaction ledger
      const txRef = doc(db, "users", userId, "transactions", original.id)
      await updateDoc(txRef, {
        asset: updated.asset,
        type: updated.type,
        quantity: updated.quantity,
        price: updated.price,
        amount: updated.amount,
        date: updated.date,
        category: updated.category,
        notes: updated.notes,
        updated_at: serverTimestamp()
      })

      // Update portfolio cost basis with delta
      const portfolioRef = collection(db, "users", userId, "portfolio")
      const q = query(portfolioRef, where("symbol", "==", updated.asset))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const portfolioDoc = snap.docs[0]
        const existing = portfolioDoc.data()
        const qtyDelta = updated.quantity - original.quantity
        const amountDelta = updated.amount - original.amount
        await updateDoc(portfolioDoc.ref, {
          quantity: Math.max(0, (Number(existing.quantity) || 0) + qtyDelta),
          investedAmount: Math.max(0, (Number(existing.investedAmount) || 0) + amountDelta),
          updated_at: serverTimestamp()
        })
      }

      toast({ title: "Transaction Updated", description: "Changes saved successfully." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to update transaction.", variant: "destructive" })
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!userId) return

    try {
      const docRef = doc(db, "users", userId, "transactions", transactionId)
      await deleteDoc(docRef)
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been removed."
      })
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive"
      })
    }
  }

  const handleOpenEditHolding = (inv: any) => {
    setHoldingForEdit(inv)
    setEditHoldingOpen(true)
  }

  const handleSaveEditHolding = async (payload: { quantity: number; investedAmount: number; notes: string }) => {
    if (!userId || !holdingForEdit) return
    try {
      await updateDoc(doc(db, "users", userId, "portfolio", holdingForEdit.id), {
        quantity: payload.quantity,
        investedAmount: payload.investedAmount,
        notes: payload.notes,
        updated_at: serverTimestamp(),
      })
      toast({ title: "Position updated", description: "Your holding has been saved." })
      setHoldingForEdit(null)
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to update holding.", variant: "destructive" })
      throw e
    }
  }

  const handleOpenAssignGoal = (inv: any) => {
    setHoldingForGoalAssign(inv)
    setAssignGoalPick(inv.goalId ? String(inv.goalId) : "none")
    setAssignGoalOpen(true)
  }

  const handleSaveAssignGoal = async () => {
    if (!userId || !holdingForGoalAssign) return
    try {
      await updateDoc(doc(db, "users", userId, "portfolio", holdingForGoalAssign.id), {
        goalId: assignGoalPick === "none" ? null : assignGoalPick,
        updated_at: serverTimestamp(),
      })
      toast({ title: "Goal updated", description: "This holding is linked to your selected goal." })
      setAssignGoalOpen(false)
      setHoldingForGoalAssign(null)
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to assign goal.", variant: "destructive" })
    }
  }

  const handleExport = () => {
    try {
      const w = window.open('', '_blank');
      if (!w) {
        toast({ title: 'Error', description: 'Please allow popups to generate the report.', variant: 'destructive' })
        return;
      }

      const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      const isGain = portfolioData.totalGain >= 0;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>FinWise Investment Report</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; line-height: 1.5; padding: 40px; margin: 0; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #1e3a8a; margin: 0 0 5px 0; font-size: 28px; }
            .meta { color: #6b7280; font-size: 14px; }
            .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; flex: 1; }
            .card-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: bold; color: #0f172a; }
            .text-green { color: #16a34a; }
            .text-red { color: #dc2626; }
            h2 { color: #1e293b; font-size: 20px; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              .card { border: 1px solid #cbd5e1; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FinWise Financial Analyst Report</h1>
            <div class="meta">Generated for Portfolio ID: ${userId || 'Guest'} | Date: ${today}</div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Portfolio Value</div>
              <div class="card-value">${formatINR(portfolioData.totalValue)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Unrealized Gain</div>
              <div class="card-value ${isGain ? 'text-green' : 'text-red'}">
                ${isGain ? '+' : ''}${formatINR(portfolioData.totalGain)} (${portfolioData.totalGainPercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <h2>Current Holdings Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Asset / Symbol</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Current Price</th>
                <th>Total Value</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              ${realTimeInvestments.length > 0 ? realTimeInvestments.map(inv => {
        const qty = Number(inv.quantity) || 0
        const price = Number(inv.currentPrice) || 0
        const value = qty * price || Number(inv.currentValue) || Number(inv.investedAmount) || 0
        const invested = Number(inv.investedAmount) || 0
        const gain = value - invested
        return `
                <tr>
                  <td><strong>${inv.symbol}</strong><br><span style="font-size:12px;color:#64748b">${inv.name || inv.symbol}</span></td>
                  <td>${inv.category || 'N/A'}</td>
                  <td>${qty.toFixed(4)}</td>
                  <td>${price > 0 ? formatINR(price) : 'N/A'}</td>
                  <td>${value > 0 ? formatINR(value) : formatINR(invested)}</td>
                  <td class="${gain >= 0 ? 'text-green' : 'text-red'}">
                    ${gain >= 0 ? '+' : ''}${formatINR(gain)}
                  </td>
                </tr>`
      }).join('') : '<tr><td colspan="6" style="text-align:center">No active holdings.</td></tr>'}
            </tbody>
          </table>

          <h2>Recent Transaction Ledger</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.length > 0 ? transactions.slice(0, 50).map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td><strong>${t.type}</strong></td>
                  <td>${t.asset}</td>
                  <td>${t.quantity}</td>
                  <td>${formatINR(t.price)}</td>
                  <td>${formatINR(t.amount)}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center">No transaction history.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>This report is generated dynamically via FinWise AI Systems. Not to be construed as direct financial advice.</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error(e);
      toast({ title: "Export Failed", description: "Could not generate report." })
    }
  }

  const handleToggleWatch = async (symbol: string) => {
    if (!userId) return

    const asset = marketAssetsState.find(a => a.symbol === symbol)
    const isCurrentlyWatched = asset?.isWatched

    try {
      const docRef = doc(db, "users", userId, "watchlist", symbol)
      if (isCurrentlyWatched) {
        await deleteDoc(docRef)
        toast({ title: "Removed from Watchlist", description: `${symbol} removed.` })
      } else {
        const { setDoc } = await import("firebase/firestore")
        await setDoc(docRef, {
          symbol,
          added_at: serverTimestamp()
        })
        toast({ title: "Added to Watchlist", description: `${symbol} added.` })
      }
    } catch (error) {
      console.error("Error toggling watch:", error)
    }
  }

  const handleBuyAsset = (asset: any) => {
    // Add the asset to investments
    const newInvestment = {
      id: Date.now().toString(),
      symbol: asset.symbol,
      name: asset.name,
      type: (asset.category === 'Crypto' ? 'Crypto' : 'Stock') as "Crypto" | "Stock",
      category: asset.category as "Equity" | "Commodity" | "Crypto" | "Mutual Fund" | "Stable",
      currentPrice: asset.price,
      quantity: 0, // Will be set in the modal
      investedAmount: 0,
      currentValue: 0,
      totalGain: 0,
      gainPercent: 0,
      dayChange: asset.change,
      dayChangePercent: asset.changePercent,
      color: "#3B82F6",
      currency: asset.currency || "USD",
      sector: asset.category,
      marketCap: asset.marketCap.toString(),
      pe: 0,
      dividend: 0,
      recommendation: "Buy" as const,
      riskLevel: "Medium" as const
    }


    // Open add transaction modal with this asset
    setSelectedAsset(newInvestment)
    setAddTransactionOpen(true)
    console.log("Buy asset:", asset)
  }

  const handleViewDetails = (asset: any) => {
    // Show asset details in a modal
    setAssetForDetails(asset)
    setAssetDetailsOpen(true)
    console.log("View details:", asset)
  }

  const handleAddGoal = () => {
    setAddGoalOpen(true)
  }

  const handleAddGoalSubmit = async (newGoal: any) => {
    if (!userId) return

    try {
      const goalsRef = collection(db, "users", userId, "goals")
      await addDoc(goalsRef, {
        ...newGoal,
        id: undefined, // Let Firestore generate ID
        created_at: serverTimestamp()
      })
      setAddGoalOpen(false)
      toast({
        title: "Goal Created",
        description: `${newGoal.name} has been added to your financial targets.`
      })
    } catch (error) {
      console.error("Error adding goal:", error)
      toast({
        title: "Error",
        description: "Failed to create goal.",
        variant: "destructive"
      })
    }
  }

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal)
    setEditGoalOpen(true)
  }

  const handleUpdateGoal = async (updatedGoal: any) => {
    if (!userId) return

    try {
      const docRef = doc(db, "users", userId, "goals", updatedGoal.id)
      await updateDoc(docRef, {
        ...updatedGoal,
        updated_at: serverTimestamp()
      })
      setEditGoalOpen(false)
      setSelectedGoal(null)
      toast({
        title: "Goal Updated",
        description: "Changes have been saved."
      })
    } catch (error) {
      console.error("Error updating goal:", error)
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!userId) return

    try {
      const docRef = doc(db, "users", userId, "goals", goalId)
      await deleteDoc(docRef)
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed from your list."
      })
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive"
      })
    }
  }

  const handlePieSliceClick = (slice: any) => {
    console.log("Pie slice clicked:", slice)
    // Filter investments by category
    const filteredInvestments = investments.filter((inv: any) => inv.category === slice.name)
    console.log("Filtered investments:", filteredInvestments)
  }

  const handleAIRecommendationAdd = async (recommendation: any) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add investments to your portfolio.",
        variant: "destructive"
      })
      return
    }

    try {
      // Logic for limits (e.g., max 1 stock)
      if (recommendation.asset_class === 'stocks') {
        const existingStocks = investments.filter(inv => inv.type === 'Stock')
        if (existingStocks.length >= 1) {
          toast({
            title: "Limit Reached",
            description: "You can only have one stock in your portfolio. Please sell your existing stock first.",
            variant: "destructive"
          })
          return
        }
      }

      const portfolioRef = collection(db, "users", userId, "portfolio")
      const amount = Number(recommendation.amount) || 0
      const linkedGoalId = recommendation.goalId || null

      await addDoc(portfolioRef, {
        symbol: recommendation.symbol || recommendation.name,
        name: recommendation.name,
        type: recommendation.asset_class === 'stocks' ? 'Stock' :
          recommendation.asset_class === 'crypto' ? 'Crypto' :
            recommendation.asset_class === 'mutual_funds' ? 'Mutual Fund' : 'Commodity',
        category: recommendation.asset_class === 'stocks' ? 'Equity' :
          recommendation.asset_class === 'crypto' ? 'Crypto' :
            recommendation.asset_class === 'mutual_funds' ? 'Mutual Fund' : 'Commodity',
        quantity: recommendation.quantity || 1,
        investedAmount: amount,
        currentPrice: recommendation.current_price || recommendation.price || 0,
        created_at: serverTimestamp(),
        color: "#3B82F6", // Default color
        sector: recommendation.sector || "Unknown",
        rationale: recommendation.rationale || "",
        rate: recommendation.rate || (recommendation.current_price === "Stable" ? 0.07 : 0),
        tenure: recommendation.term || recommendation.tenure || "N/A",
        purchaseDate: new Date().toISOString(),
        ...(linkedGoalId ? { goalId: linkedGoalId } : {}),
      })

      if (linkedGoalId && amount > 0) {
        const goalRef = doc(db, "users", userId, "goals", linkedGoalId)
        await updateDoc(goalRef, {
          currentAmount: increment(amount),
          updated_at: serverTimestamp()
        })
      }

      toast({
        title: "Success",
        description: `${recommendation.name} added to your portfolio.`
      })
    } catch (error) {
      console.error("Error adding to portfolio:", error)
      toast({
        title: "Error",
        description: "Failed to add investment to portfolio.",
        variant: "destructive"
      })
    }
  }

  const handleSellInvestment = (investment: any) => {
    setSelectedInvestment(investment)
    setSellInvestmentOpen(true)
  }

  const handleSellInvestmentSubmit = async (sellData: any) => {
    if (!userId || !selectedInvestment) return

    try {
      // 1. Add sell transaction
      const transactionsRef = collection(db, "users", userId, "transactions")
      await addDoc(transactionsRef, {
        date: sellData.date,
        type: "Sell",
        asset: selectedInvestment.id, // Reference to original investment maybe? Or just symbol.
        symbol: selectedInvestment.symbol,
        quantity: sellData.quantity,
        price: sellData.price,
        amount: sellData.amount,
        status: "Completed",
        category: selectedInvestment.category,
        notes: sellData.notes,
        created_at: serverTimestamp()
      })

      // 2. Update portfolio
      const investmentRef = doc(db, "users", userId, "portfolio", selectedInvestment.id)
      const remainingQuantity = (Number(selectedInvestment.quantity) || 0) - (Number(sellData.quantity) || 0)

      if (remainingQuantity <= 0.0001) {
        await deleteDoc(investmentRef)
      } else {
        await updateDoc(investmentRef, {
          quantity: remainingQuantity,
          updated_at: serverTimestamp()
        })
      }

      setSellInvestmentOpen(false)
      setSelectedInvestment(null)
      toast({
        title: "Investment Sold",
        description: `Successfully sold ${sellData.quantity} of ${selectedInvestment.symbol}.`
      })
    } catch (error) {
      console.error("Error selling investment:", error)
      toast({
        title: "Error",
        description: "Failed to process sale.",
        variant: "destructive"
      })
    }
  }

  const handleRefreshRecommendations = () => {
    setIsLoading(true)


    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Recommendations Updated",
        description: "AI has refreshed your personalized investment recommendations",
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleAddToWatchlist = async (stock: any) => {
    if (!userId) {
      toast({ title: "Authentication Required", description: "Please sign in to add to your watchlist.", variant: "destructive" })
      return
    }

    try {
      const { setDoc } = await import("firebase/firestore")
      const docRef = doc(db, "users", userId, "watchlist", stock.symbol)
      await setDoc(docRef, {
        symbol: stock.symbol,
        added_at: serverTimestamp()
      })
      toast({
        title: "Added to Watchlist",
        description: `${stock.symbol} has been added to your watchlist`,
      })
    } catch (error) {
      console.error("Error adding to watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to add to watchlist.",
        variant: "destructive"
      })
    }
  }

  const handleAddToPortfolio = (stock: any) => {
    // Open add transaction modal with stock data
    const newInvestment = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      name: stock.name,
      type: 'Stock' as const,
      category: 'Equity' as const,
      currentPrice: stock.currentPrice,
      quantity: 0,
      investedAmount: 0,
      currentValue: 0,
      totalGain: 0,
      gainPercent: 0,
      dayChange: stock.dayChange,
      dayChangePercent: stock.dayChangePercent,
      color: "#3B82F6",
      currency: stock.currency || "USD",
      sector: stock.sector,
      marketCap: stock.marketCap.toString(),
      pe: stock.pe || 0,
      dividend: stock.dividend || 0,
      recommendation: "Buy" as const,
      riskLevel: "Medium" as const
    }


    setSelectedAsset(newInvestment)
    setAddTransactionOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-8 p-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
              <p className="text-muted-foreground">Track your investments, analyze performance, and manage your financial goals</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isOptimizerOpen} onOpenChange={setIsOptimizerOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Optimizer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-max min-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>AI Portfolio Optimizer</DialogTitle>
                    <DialogDescription>
                      Fill out your financial profile to get personalized AI investment recommendations.
                    </DialogDescription>
                  </DialogHeader>
                  <FinancialProfileForm onSuccess={() => setIsOptimizerOpen(false)} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              {marketDataError && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Data Error</span>
                </div>
              )}
              {!marketDataError && lastUpdated && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Live Data</span>
                </div>
              )}
              {lastUpdated && (
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <PortfolioOverview
          totalValue={portfolioData.totalValue}
          totalGain={portfolioData.totalGain}
          totalGainPercent={portfolioData.totalGainPercent}
          dayChange={portfolioData.dayChange}
          dayChangePercent={portfolioData.dayChangePercent}
          onRefresh={handleRefresh}
          onRebalance={handleRebalance}
          isLoading={isLoading || isMarketDataFetching}
          goals={goals}
        />

        {/* Live Indicator Trend Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 mb-8">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Live Market Pulse</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Continuously streaming indicator movement with smooth curves (refreshes every {LIVE_REFRESH_MS / 1000}s)</p>
            </div>
          </CardHeader>
          <CardContent className="h-[32rem] pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {MARKET_INDICATORS.map((indicator) => {
                const current = latestIndicators[indicator.key]
                const isUp = (current?.dayChangePercent ?? 0) >= 0
                return (
                  <div key={indicator.key} className="rounded-lg border bg-background/70 backdrop-blur px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{indicator.label}</span>
                      <span className={`h-2 w-2 rounded-full ${isUp ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                    </div>
                    <div className="text-sm font-semibold mt-1">
                      {formatIndicatorPrice(current?.price, current?.currency)}
                    </div>
                    <div className={`text-xs mt-0.5 ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
                      {isUp ? "+" : ""}{(current?.dayChangePercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                )
              })}
            </div>
            <ResponsiveContainer width="100%" height="100%" className="mb-4">
              <LineChart data={liveChartData}>
                <defs>
                  <linearGradient id="niftyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sensexGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="btcGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-muted-foreground"
                  tick={{ dy: 15 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="niftyMove"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  name="Nifty 50 %"
                />
                <Line
                  type="monotone"
                  dataKey="sensexMove"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  name="Sensex %"
                />
                <Line
                  type="monotone"
                  dataKey="goldMove"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  name="Gold %"
                />
                <Line
                  type="monotone"
                  dataKey="btcMove"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  name="Bitcoin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Momentum Streams */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Live Momentum Streams</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Growth/decline from market open to now (refreshes every 5 minutes)</p>
            </div>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momentumChartData}>
                <defs>
                  <linearGradient id="niftyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="sensexArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="btcArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <Tooltip formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]} />
                {/* Hour markers from market open (9:15 AM) */}
                <ReferenceLine x="10:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine x="11:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine x="12:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine x="1:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine x="2:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine x="3:15" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="niftyDayMove" stroke="#3B82F6" fill="url(#niftyArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="sensexDayMove" stroke="#10B981" fill="url(#sensexArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="goldDayMove" stroke="#F59E0B" fill="url(#goldArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="btcDayMove" stroke="#8B5CF6" fill="url(#btcArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="portfolio"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Market
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Goals
            </TabsTrigger>

          </TabsList>

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <RealInvestmentTracker
              investments={realTimeInvestments}
              onInvestmentClick={handleAssetClick}
              onAddInvestment={() => setAddTransactionOpen(true)}
              onSellInvestment={handleSellInvestment}
              goals={goals.map((g) => ({ id: g.id, name: g.name }))}
              onEditPosition={handleOpenEditHolding}
              onAssignGoal={handleOpenAssignGoal}
            />
            <div className="mt-8">
              <InvestmentTransactions
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6 mt-6">
            <StockSearch
              onAddToWatchlist={handleAddToWatchlist}
              onAddToPortfolio={handleAddToPortfolio}
              onViewDetails={handleViewDetails}
            />
            <div className="mt-8">
              <MarketWatchlist
                assets={marketAssetsState}
                onToggleWatch={handleToggleWatch}
                onBuyAsset={handleBuyAsset}
                onViewDetails={handleViewDetails}
                onRefresh={refreshMarketDataHandler}
                isLoading={isMarketDataLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 mt-6">
            <InvestmentGoals />
          </TabsContent>

          <TabsContent value="ai" className="space-y-8 mt-6">
            <div className="space-y-8">
              {/* Main AI Insights */}
              <InvestmentInsights recommendation={latestRecommendation} />

              {/* AI Recommendations */}
              <InvestmentRecommendations
                recommendation={latestRecommendation}
                onAddInvestment={handleAIRecommendationAdd}
                isLoading={isLoading || isMarketDataFetching}
                onRunAgain={() => setIsOptimizerOpen(true)}
                existingPortfolio={realTimeInvestments}
              />

              {/* Additional Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/10 dark:to-gray-950/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold">AI Recommendations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Personalized investment suggestions</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div
                        className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                        onClick={() => {
                          const query = "Help me increase my equity allocation. What stocks should I consider?"
                          window.location.href = `/advisor?q=${encodeURIComponent(query)}`
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Consider increasing equity allocation</div>
                            <div className="text-xs text-muted-foreground mt-1">Your current equity allocation is below recommended levels for your age.</div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                        onClick={() => {
                          const query = "Help me add international diversification to my portfolio. What international funds should I consider?"
                          window.location.href = `/advisor?q=${encodeURIComponent(query)}`
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Add international diversification</div>
                            <div className="text-xs text-muted-foreground mt-1">Consider adding international funds to reduce country-specific risk.</div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
                        onClick={() => {
                          setRebalanceOpen(true)
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Rebalance quarterly</div>
                            <div className="text-xs text-muted-foreground mt-1">Your portfolio has drifted from target allocation.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <RebalanceModal open={rebalanceOpen} onOpenChange={setRebalanceOpen} />
      <AddTransactionModal
        open={addTransactionOpen}
        onOpenChange={(open) => {
          setAddTransactionOpen(open)
          if (!open) setSelectedAsset(null)
        }}
        onAddTransaction={handleAddTransactionSubmit}
        goals={goals.map((g) => ({ id: g.id, name: g.name }))}
        initialAsset={
          selectedAsset
            ? {
              symbol: selectedAsset.symbol,
              category: selectedAsset.category,
              currentPrice: Number(selectedAsset.currentPrice) || undefined,
              currency: selectedAsset.currency || "USD",
            }
            : null
        }
      />
      <EditHoldingModal
        open={editHoldingOpen}
        onOpenChange={(open) => {
          setEditHoldingOpen(open)
          if (!open) setHoldingForEdit(null)
        }}
        investment={
          holdingForEdit
            ? {
              id: holdingForEdit.id,
              symbol: holdingForEdit.symbol,
              name: holdingForEdit.name,
              quantity: Number(holdingForEdit.quantity) || 0,
              investedAmount: Number(holdingForEdit.investedAmount) || 0,
              notes: holdingForEdit.notes,
            }
            : null
        }
        onSave={handleSaveEditHolding}
      />
      <Dialog
        open={assignGoalOpen}
        onOpenChange={(open) => {
          setAssignGoalOpen(open)
          if (!open) setHoldingForGoalAssign(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to goal</DialogTitle>
            <DialogDescription>
              {holdingForGoalAssign
                ? `Link ${holdingForGoalAssign.symbol} to a goal, or choose none.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Goal</Label>
            <Select value={assignGoalPick} onValueChange={setAssignGoalPick}>
              <SelectTrigger>
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignGoalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveAssignGoal()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddGoalModal
        open={addGoalOpen}
        onOpenChange={setAddGoalOpen}
        onAddGoal={handleAddGoalSubmit}
      />
      <EditGoalModal
        open={editGoalOpen}
        onOpenChange={setEditGoalOpen}
        goal={selectedGoal}
        onUpdateGoal={handleUpdateGoal}
      />
      <SellInvestmentModal
        open={sellInvestmentOpen}
        onOpenChange={setSellInvestmentOpen}
        investment={selectedInvestment}
        onSellInvestment={handleSellInvestmentSubmit}
      />
      <EditTransactionModal
        open={editTransactionOpen}
        onOpenChange={setEditTransactionOpen}
        transaction={editingTransaction}
        onSave={handleEditTransactionSave}
      />
      <AssetDetailsModal
        isOpen={assetDetailsOpen}
        onClose={() => setAssetDetailsOpen(false)}
        asset={assetForDetails}
      />
    </AppShell>
  )
}
