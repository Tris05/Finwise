"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
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
import { StockSearch } from "@/components/stock-search"
import { useMarketData } from "@/hooks/use-market-data"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Sample data - in a real app, this would come from your backend

const realInvestments = [
  {
    id: "1",
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    type: "Stock" as const,
    category: "Equity" as const,
    currentPrice: 2450.50,
    quantity: 150,
    investedAmount: 350000,
    currentValue: 367575,
    totalGain: 17575,
    gainPercent: 5.02,
    dayChange: 25.30,
    dayChangePercent: 1.04,
    color: "#3B82F6",
    sector: "Energy",
    marketCap: "₹16.5L Cr",
    pe: 12.5,
    dividend: 2.1,
    recommendation: "Hold",
    riskLevel: "Medium"
  },
  {
    id: "2",
    symbol: "TCS",
    name: "Tata Consultancy Services",
    type: "Stock" as const,
    category: "Equity" as const,
    currentPrice: 3850.75,
    quantity: 50,
    investedAmount: 180000,
    currentValue: 192537.50,
    totalGain: 12537.50,
    gainPercent: 6.97,
    dayChange: -15.25,
    dayChangePercent: -0.39,
    color: "#10B981",
    sector: "IT Services",
    marketCap: "₹14L Cr",
    pe: 28.2,
    dividend: 1.8,
    recommendation: "Buy",
    riskLevel: "Low"
  },
  {
    id: "3",
    symbol: "HDFC",
    name: "HDFC Bank Ltd",
    type: "Stock" as const,
    category: "Equity" as const,
    currentPrice: 1650.20,
    quantity: 100,
    investedAmount: 155000,
    currentValue: 165020,
    totalGain: 10020,
    gainPercent: 6.46,
    dayChange: 8.50,
    dayChangePercent: 0.52,
    color: "#F59E0B",
    sector: "Banking",
    marketCap: "₹12L Cr",
    pe: 15.8,
    dividend: 2.5,
    recommendation: "Strong Buy",
    riskLevel: "Low"
  },
  {
    id: "4",
    symbol: "GOLD",
    name: "Gold (24K) - Physical",
    type: "Commodity" as const,
    category: "Commodity" as const,
    currentPrice: 6234,
    quantity: 20,
    investedAmount: 120000,
    currentValue: 124680,
    totalGain: 4680,
    gainPercent: 3.9,
    dayChange: -45.67,
    dayChangePercent: -0.73,
    color: "#F59E0B",
    sector: "Precious Metals",
    marketCap: "N/A",
    pe: "N/A",
    dividend: "N/A",
    recommendation: "Hold",
    riskLevel: "Low"
  },
  {
    id: "5",
    symbol: "BTC",
    name: "Bitcoin",
    type: "Crypto" as const,
    category: "Crypto" as const,
    currentPrice: 4500000,
    quantity: 0.1,
    investedAmount: 400000,
    currentValue: 450000,
    totalGain: 50000,
    gainPercent: 12.5,
    dayChange: 125000,
    dayChangePercent: 2.86,
    color: "#8B5CF6",
    sector: "Cryptocurrency",
    marketCap: "₹85L Cr",
    pe: "N/A",
    dividend: "N/A",
    recommendation: "Hold",
    riskLevel: "High"
  },
  {
    id: "6",
    symbol: "ETH",
    name: "Ethereum",
    type: "Crypto" as const,
    category: "Crypto" as const,
    currentPrice: 280000,
    quantity: 0.5,
    investedAmount: 120000,
    currentValue: 140000,
    totalGain: 20000,
    gainPercent: 16.67,
    dayChange: 8500,
    dayChangePercent: 3.13,
    color: "#6366F1",
    sector: "Cryptocurrency",
    marketCap: "₹33L Cr",
    pe: "N/A",
    dividend: "N/A",
    recommendation: "Buy",
    riskLevel: "High"
  },
  {
    id: "7",
    symbol: "SBI",
    name: "State Bank of India",
    type: "Stock" as const,
    category: "Equity" as const,
    currentPrice: 580.25,
    quantity: 200,
    investedAmount: 110000,
    currentValue: 116050,
    totalGain: 6050,
    gainPercent: 5.5,
    dayChange: 12.50,
    dayChangePercent: 2.2,
    color: "#EF4444",
    sector: "Banking",
    marketCap: "₹5.2L Cr",
    pe: 8.5,
    dividend: 3.2,
    recommendation: "Buy",
    riskLevel: "Medium"
  },
  {
    id: "8",
    symbol: "AXIS",
    name: "Axis Bank Ltd",
    type: "Stock" as const,
    category: "Equity" as const,
    currentPrice: 1080.50,
    quantity: 80,
    investedAmount: 85000,
    currentValue: 86440,
    totalGain: 1440,
    gainPercent: 1.69,
    dayChange: -5.25,
    dayChangePercent: -0.48,
    color: "#06B6D4",
    sector: "Banking",
    marketCap: "₹3.2L Cr",
    pe: 12.1,
    dividend: 1.5,
    recommendation: "Hold",
    riskLevel: "Medium"
  }
]

// Calculate real portfolio data from investments
const calculatePortfolioData = (investments: any[]) => {
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalGain = investments.reduce((sum, inv) => sum + inv.totalGain, 0)
  const totalGainPercent = (totalGain / (totalValue - totalGain)) * 100
  const dayChange = investments.reduce((sum, inv) => sum + (inv.dayChange * inv.quantity), 0)
  const dayChangePercent = (dayChange / totalValue) * 100
  
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
    asset: "RELIANCE",
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
    asset: "HDFC Bank",
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
    asset: "TCS",
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
  const [rebalanceOpen, setRebalanceOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [sellInvestmentOpen, setSellInvestmentOpen] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState(null)
  const [transactions, setTransactions] = useState(sampleTransactions)
  const [goals, setGoals] = useState(investmentGoals)
  const [marketAssetsState, setMarketAssets] = useState(marketAssets)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false)

  // Use real-time market data
  const {
    investments: realTimeInvestments,
    isLoading: isMarketDataFetching,
    error: marketDataError,
    lastUpdated,
    refreshData: refreshMarketData
  } = useMarketData(realInvestments)

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

  const handleAddTransactionSubmit = (newTransaction: any) => {
    setTransactions(prev => [newTransaction, ...prev])
    setAddTransactionOpen(false)
  }

  const handleEditTransaction = (transactionId: string) => {
    console.log("Edit transaction:", transactionId)
    // TODO: Implement edit transaction functionality
  }

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== transactionId))
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

  const handleToggleWatch = (symbol: string) => {
    setMarketAssets(prev => 
      prev.map(asset => 
        asset.symbol === symbol 
          ? { ...asset, isWatched: !asset.isWatched }
          : asset
      )
    )
    console.log("Toggle watch:", symbol)
  }

  const handleBuyAsset = (asset: any) => {
    // Add the asset to investments
    const newInvestment = {
      id: Date.now().toString(),
      symbol: asset.symbol,
      name: asset.name,
      type: asset.category === 'Crypto' ? 'Crypto' : 'Stock' as const,
      category: asset.category as const,
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

  const handleAddGoalSubmit = (newGoal: any) => {
    setGoals(prev => [newGoal, ...prev])
    setAddGoalOpen(false)
  }

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal)
    setEditGoalOpen(true)
  }

  const handleUpdateGoal = (updatedGoal: any) => {
    setGoals(prev => prev.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal))
    setEditGoalOpen(false)
    setSelectedGoal(null)
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
  }

  const handlePieSliceClick = (slice: any) => {
    console.log("Pie slice clicked:", slice)
    // Filter investments by category
    const filteredInvestments = realInvestments.filter(inv => inv.category === slice.name)
    console.log("Filtered investments:", filteredInvestments)
  }

  const handleSellInvestment = (investment: any) => {
    setSelectedInvestment(investment)
    setSellInvestmentOpen(true)
  }

  const handleSellInvestmentSubmit = (sellData: any) => {
    // Add sell transaction
    const sellTransaction = {
      id: Date.now().toString(),
      date: sellData.date,
      type: "Sell",
      asset: sellData.symbol,
      quantity: sellData.quantity,
      price: sellData.price,
      amount: sellData.amount,
      status: "Completed",
      category: "Equity", // This should be determined from the investment
      notes: sellData.notes
    }
    
    setTransactions(prev => [sellTransaction, ...prev])
    setSellInvestmentOpen(false)
    setSelectedInvestment(null)
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
    <QueryProvider>
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
                data={portfolioAllocation} 
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
                investments={realTimeInvestments}
                onRefreshRecommendations={handleRefreshRecommendations}
                isLoading={isLoading || isMarketDataFetching}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                  <CardHeader className="pb-4">
                    <div>
                      <CardTitle className="text-xl font-semibold">Risk Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Your portfolio risk assessment</p>
                    </div>
            </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <div>
                          <div className="font-medium">Portfolio Risk Score</div>
                          <div className="text-sm text-muted-foreground">Based on asset allocation</div>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1">
                          Low Risk
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <div>
                          <div className="font-medium">Diversification Score</div>
                          <div className="text-sm text-muted-foreground">Asset class distribution</div>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1">
                          Well Diversified
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                        <div>
                          <div className="font-medium">Volatility</div>
                          <div className="text-sm text-muted-foreground">Price fluctuation level</div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1">
                          Moderate
                        </Badge>
                      </div>
                    </div>
            </CardContent>
          </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold">AI Recommendations</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Personalized investment suggestions</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshRecommendations}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
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
    </QueryProvider>
  )
}
