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
import { SellInvestmentModal } from "@/components/sell-investment-modal"
import { InvestmentRecommendations } from "@/components/investment-recommendations"
import { InvestmentInsights } from "@/components/investment-insights"
import { StockSearch } from "@/components/stock-search"
import { useMarketData } from "@/hooks/use-market-data"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Wifi, WifiOff, RefreshCw, Sparkles, PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
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
  serverTimestamp
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect } from "react"

// Sample data - in a real app, this would come from your backend

// Initial empty portfolio
const initialInvestments: any[] = []

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

const sampleTransactions = [
  {
    id: "1",
    date: "2024-01-15",
    type: "Buy" as const,
    asset: "RELIANCE.NS",
    quantity: 10,
    price: 2450,
    amount: 24500,
    status: "Completed" as const,
    category: "Equity" as const
  },
  {
    id: "2",
    date: "2024-01-14",
    type: "Buy" as const,
    asset: "HDFCBANK.NS",
    quantity: 5,
    price: 1650,
    amount: 8250,
    status: "Completed" as const,
    category: "Equity" as const
  },
  {
    id: "3",
    date: "2024-01-13",
    type: "Dividend" as const,
    asset: "TCS.NS",
    quantity: 20,
    price: 0,
    amount: 1200,
    status: "Completed" as const,
    category: "Equity" as const
  },
  {
    id: "4",
    date: "2024-01-12",
    type: "Buy" as const,
    asset: "Gold ETF",
    quantity: 5,
    price: 6200,
    amount: 31000,
    status: "Completed" as const,
    category: "Commodity" as const
  },
  {
    id: "5",
    date: "2024-01-11",
    type: "Buy" as const,
    asset: "Bitcoin",
    quantity: 0.1,
    price: 4500000,
    amount: 450000,
    status: "Completed" as const,
    category: "Crypto" as const
  }
]

const marketAssets = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2450.50,
    change: 25.30,
    changePercent: 1.04,
    volume: 1500000,
    marketCap: 1650000000000,
    category: "Equity" as const,
    isWatched: true,
    isOwned: true
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3850.75,
    change: -15.25,
    changePercent: -0.39,
    volume: 800000,
    marketCap: 1400000000000,
    category: "Equity" as const,
    isWatched: true,
    isOwned: false
  },
  {
    symbol: "HDFC",
    name: "HDFC Bank",
    price: 1650.20,
    change: 8.50,
    changePercent: 0.52,
    volume: 1200000,
    marketCap: 1200000000000,
    category: "Equity" as const,
    isWatched: false,
    isOwned: true
  },
  {
    symbol: "GOLD",
    name: "Gold (24K)",
    price: 6234,
    change: -45.67,
    changePercent: -0.73,
    volume: 50000,
    marketCap: 0,
    category: "Commodity" as const,
    isWatched: true,
    isOwned: true
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 4500000,
    change: 125000,
    changePercent: 2.86,
    volume: 1000,
    marketCap: 8500000000000,
    category: "Crypto" as const,
    isWatched: true,
    isOwned: true
  }
]

const investmentGoals = [
  {
    id: "1",
    name: "Retirement Fund",
    targetAmount: 10000000,
    currentAmount: 2500000,
    targetDate: "2045-12-31",
    category: "Retirement" as const,
    priority: "High" as const,
    status: "On Track" as const,
    monthlyContribution: 25000,
    expectedReturn: 12
  },
  {
    id: "2",
    name: "House Purchase",
    targetAmount: 5000000,
    currentAmount: 1200000,
    targetDate: "2027-06-30",
    category: "House" as const,
    priority: "High" as const,
    status: "Behind" as const,
    monthlyContribution: 15000,
    expectedReturn: 10
  },
  {
    id: "3",
    name: "Child Education",
    targetAmount: 2000000,
    currentAmount: 800000,
    targetDate: "2030-06-30",
    category: "Education" as const,
    priority: "Medium" as const,
    status: "On Track" as const,
    monthlyContribution: 10000,
    expectedReturn: 11
  }
]

const performanceData = [
  { month: "Jan", value: 1100000, benchmark: 1050000 },
  { month: "Feb", value: 1120000, benchmark: 1070000 },
  { month: "Mar", value: 1150000, benchmark: 1090000 },
  { month: "Apr", value: 1180000, benchmark: 1110000 },
  { month: "May", value: 1200000, benchmark: 1130000 },
  { month: "Jun", value: 1220000, benchmark: 1150000 },
  { month: "Jul", value: 1235000, benchmark: 1170000 },
  { month: "Aug", value: 1240000, benchmark: 1180000 },
  { month: "Sep", value: 1245000, benchmark: 1190000 },
  { month: "Oct", value: 1250000, benchmark: 1200000 }
]

export default function InvestmentsPage() {
  const { toast } = useToast()

  // UI States
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false)
  const [rebalanceOpen, setRebalanceOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [sellInvestmentOpen, setSellInvestmentOpen] = useState(false)
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false)

  // Data States
  const [investments, setInvestments] = useState<any[]>(initialInvestments)
  const [latestRecommendation, setLatestRecommendation] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [marketAssetsState, setMarketAssets] = useState<any[]>(marketAssets)

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
            id: doc.id,
            ...doc.data()
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
            id: doc.id,
            ...doc.data()
          }))
          setTransactions(transactionsData)
        }))

        // Subscribe to Goals
        const goalsRef = collection(db, "users", user.uid, "goals")
        unsubs.push(onSnapshot(goalsRef, (snapshot) => {
          const goalsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setGoals(goalsData)
        }))

        // Subscribe to Watchlist
        const watchlistRef = collection(db, "users", user.uid, "watchlist")
        unsubs.push(onSnapshot(watchlistRef, (snapshot) => {
          const watchedSymbols = snapshot.docs.map(doc => doc.id)
          setMarketAssets(prev => prev.map(asset => ({
            ...asset,
            isWatched: watchedSymbols.includes(asset.symbol)
          })))
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

  // Simulate real-time market data updates
  const simulateMarketUpdate = () => {
    setIsMarketDataLoading(true)
    setTimeout(() => {
      setMarketAssets(prev => prev.map(asset => {
        const randomChange = (Math.random() - 0.5) * 0.02 // ±1% change
        const newPrice = asset.price * (1 + randomChange)
        const change = newPrice - asset.price
        const changePercent = (change / asset.price) * 100


        return {
          ...asset,
          price: newPrice,
          change: change,
          changePercent: changePercent
        }
      }))
      setIsMarketDataLoading(false)
    }, 1000)
  }

  const handleAssetClick = (asset: any) => {
    // Show detailed asset information in a modal or navigate to details
    const details = `
Asset Details:
Symbol: ${asset.symbol}
Name: ${asset.name}
Current Price: ${formatINR(asset.currentPrice)}
Day Change: ${asset.dayChangePercent.toFixed(2)}%
Sector: ${asset.sector}
Market Cap: ${asset.marketCap}
P/E Ratio: ${asset.pe}
Dividend Yield: ${asset.dividend}%
Risk Level: ${asset.riskLevel}
Recommendation: ${asset.recommendation}
    `


    toast({
      title: `${asset.symbol} Details`,
      description: details,
      duration: 5000,
    })
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
      // 1. Save to Transactions collection
      const transactionsRef = collection(db, "users", userId, "transactions")
      await addDoc(transactionsRef, {
        ...newTransaction,
        created_at: serverTimestamp()
      })

      // 2. Sync to Portfolio holdings
      const portfolioRef = collection(db, "users", userId, "portfolio")
      const q = query(portfolioRef, where("symbol", "==", newTransaction.asset))
      const querySnapshot = await getDocs(q)
      
      const isStable = ['debt', 'stable', 'fixed income', 'fd', 'ppf'].includes(newTransaction.category.toLowerCase())
      
      if (newTransaction.type === "Buy" || newTransaction.type === "Dividend" || newTransaction.type === "Bonus") {
        if (!querySnapshot.empty) {
          // Update existing holding
          const portfolioDoc = querySnapshot.docs[0]
          const existingData = portfolioDoc.data()
          await updateDoc(portfolioDoc.ref, {
            quantity: (Number(existingData.quantity) || 0) + (Number(newTransaction.quantity) || 0),
            investedAmount: (Number(existingData.investedAmount) || 0) + (Number(newTransaction.amount) || 0),
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
            lastSync: serverTimestamp()
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

  const handleEditTransaction = (transactionId: string) => {
    console.log("Edit transaction:", transactionId)
    // TODO: Implement edit transaction functionality
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

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      "Date,Type,Asset,Quantity,Price,Amount,Status,Category",
      ...transactions.map(t =>
        `${t.date},${t.type},${t.asset},${t.quantity},${t.price},${t.amount},${t.status},${t.category}`
      )
    ].join('\n')


    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
    // Show asset details in a modal or navigate to details page
    alert(`Asset Details:\n\nSymbol: ${asset.symbol}\nName: ${asset.name}\nPrice: ${formatINR(asset.price)}\nChange: ${asset.changePercent.toFixed(2)}%\nCategory: ${asset.category}\nMarket Cap: ${formatINR(asset.marketCap)}`)
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
        investedAmount: recommendation.amount || 0,
        currentPrice: recommendation.current_price || recommendation.price || 0,
        created_at: serverTimestamp(),
        color: "#3B82F6", // Default color
        sector: recommendation.sector || "Unknown",
        rationale: recommendation.rationale || "",
        rate: recommendation.rate || (recommendation.current_price === "Stable" ? 0.07 : 0),
        tenure: recommendation.term || recommendation.tenure || "N/A",
        purchaseDate: new Date().toISOString()
      })

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

  const handleAddToWatchlist = (stock: any) => {
    // Add to watchlist state
    setMarketAssets(prev =>
      prev.map(asset =>
        asset.symbol === stock.symbol
          ? { ...asset, isWatched: true }
          : asset
      )
    )


    // Show success toast
    toast({
      title: "Added to Watchlist",
      description: `${stock.symbol} has been added to your watchlist`,
    })
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
        />

        {/* Performance Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Portfolio Performance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your portfolio vs benchmark over time</p>
            </div>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Your Portfolio"
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Benchmark"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio Allocation Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Portfolio Allocation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Click on any slice to view investments in that category</p>
            </div>
          </CardHeader>
          <CardContent>
            <PortfolioPie
              data={portfolioAllocation as any[]}
              onSliceClick={handlePieSliceClick}
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="portfolio"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Search Stocks
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Transactions
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
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <RealInvestmentTracker
              investments={realTimeInvestments}
              onInvestmentClick={handleAssetClick}
              onAddInvestment={() => setAddTransactionOpen(true)}
              onSellInvestment={handleSellInvestment}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-6">
            <StockSearch
              onAddToWatchlist={handleAddToWatchlist}
              onAddToPortfolio={handleAddToPortfolio}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6 mt-6">
            <InvestmentRecommendations
              recommendation={latestRecommendation}
              onAddInvestment={handleAIRecommendationAdd}
              isLoading={isLoading || isMarketDataFetching}
              onRunAgain={() => setIsOptimizerOpen(true)}
              existingPortfolio={realTimeInvestments}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 mt-6">
            <InvestmentTransactions
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onExport={handleExport}
            />
          </TabsContent>

          <TabsContent value="market" className="space-y-6 mt-6">
            <MarketWatchlist
              assets={marketAssetsState}
              onToggleWatch={handleToggleWatch}
              onBuyAsset={handleBuyAsset}
              onViewDetails={handleViewDetails}
              onRefresh={simulateMarketUpdate}
              isLoading={isMarketDataLoading}
            />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 mt-6">
            <InvestmentGoals
              goals={goals}
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-8 mt-6">
            <div className="space-y-8">
              {/* Main AI Insights */}
              <InvestmentInsights recommendation={latestRecommendation} />

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
        onOpenChange={setAddTransactionOpen}
        onAddTransaction={handleAddTransactionSubmit}
      />
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
    </AppShell>
  )
}
