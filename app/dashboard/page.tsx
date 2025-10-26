"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { RebalanceModal } from "@/components/rebalance-modal"
import { GamificationCard } from "@/components/gamification-card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { formatINR } from "@/lib/utils"
import { 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award, 
  Zap, 
  Shield, 
  CreditCard, 
  Bot, 
  FileText, 
  Landmark, 
  GraduationCap,
  ArrowRight,
  Star,
  Sparkles,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Plus,
  Eye,
  Settings
} from "lucide-react"


// Realistic portfolio data with actual Indian companies
const portfolioData = [
  { name: "Jan 2024", value: 1245000, gain: 45000, date: "2024-01-01" },
  { name: "Feb 2024", value: 1289000, gain: 44000, date: "2024-02-01" },
  { name: "Mar 2024", value: 1321000, gain: 32000, date: "2024-03-01" },
  { name: "Apr 2024", value: 1358000, gain: 37000, date: "2024-04-01" },
  { name: "May 2024", value: 1412000, gain: 54000, date: "2024-05-01" },
  { name: "Jun 2024", value: 1389000, gain: -23000, date: "2024-06-01" },
  { name: "Jul 2024", value: 1445000, gain: 56000, date: "2024-07-01" },
  { name: "Aug 2024", value: 1492000, gain: 47000, date: "2024-08-01" },
  { name: "Sep 2024", value: 1528000, gain: 36000, date: "2024-09-01" },
  { name: "Oct 2024", value: 1564000, gain: 36000, date: "2024-10-01" },
  { name: "Nov 2024", value: 1591000, gain: 27000, date: "2024-11-01" },
  { name: "Dec 2024", value: 1642300, gain: 51300, date: "2024-12-01" },
]

const weeklyPerformance = [
  { day: "Mon", value: 1564000, change: 1.2, volume: "2.4M" },
  { day: "Tue", value: 1582000, change: 1.8, volume: "3.1M" },
  { day: "Wed", value: 1578000, change: -0.4, volume: "2.8M" },
  { day: "Thu", value: 1601000, change: 2.3, volume: "4.2M" },
  { day: "Fri", value: 1595000, change: -0.6, volume: "3.7M" },
  { day: "Sat", value: 1612000, change: 1.7, volume: "2.9M" },
  { day: "Sun", value: 1642300, change: 3.0, volume: "1.8M" },
]

// Realistic investment holdings
const investmentHoldings = [
  { name: "Reliance Industries", symbol: "RELIANCE", value: 245000, change: 2.1, shares: 100, price: 2450.50, sector: "Energy" },
  { name: "TCS", symbol: "TCS", value: 192500, change: -0.8, shares: 50, price: 3850.00, sector: "IT" },
  { name: "HDFC Bank", symbol: "HDFC", value: 165000, change: 1.5, shares: 100, price: 1650.00, sector: "Banking" },
  { name: "Infosys", symbol: "INFY", value: 128000, change: 0.9, shares: 80, price: 1600.00, sector: "IT" },
  { name: "ICICI Bank", symbol: "ICICIBANK", value: 98000, change: 2.3, shares: 100, price: 980.00, sector: "Banking" },
  { name: "Bharti Airtel", symbol: "BHARTIARTL", value: 87000, change: -1.2, shares: 100, price: 870.00, sector: "Telecom" },
]

// Realistic mutual funds
const mutualFunds = [
  { name: "HDFC Top 100 Fund", value: 185000, change: 1.8, nav: 45.67, units: 4050.25, category: "Large Cap" },
  { name: "SBI Bluechip Fund", value: 142000, change: 2.1, nav: 67.89, units: 2091.45, category: "Large Cap" },
  { name: "Axis Midcap Fund", value: 98000, change: 3.2, nav: 89.45, units: 1095.67, category: "Mid Cap" },
  { name: "Franklin India Taxshield", value: 75000, change: 1.5, nav: 234.56, units: 319.78, category: "ELSS" },
]

// Realistic goals
const financialGoals = [
  { name: "Home Purchase", target: 5000000, current: 3250000, deadline: "Dec 2025", progress: 65, priority: "High" },
  { name: "Child Education", target: 2000000, current: 450000, deadline: "Jan 2030", progress: 22.5, priority: "Medium" },
  { name: "Retirement Fund", target: 10000000, current: 1200000, deadline: "Jan 2040", progress: 12, priority: "High" },
  { name: "Emergency Fund", target: 500000, current: 350000, deadline: "Jun 2025", progress: 70, priority: "High" },
]

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  const kpis = [
    { 
      label: "Total Portfolio Value", 
      value: formatINR(1642300), 
      delta: "+12.4%", 
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
      change: "+₹1,82,300",
      period: "YTD"
    },
    { 
      label: "Today's Performance", 
      value: formatINR(51300), 
      delta: "+3.0%", 
      trend: "up",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
      change: "Best day this month",
      period: "Today"
    },
    { 
      label: "Top Performing Stock", 
      value: "Reliance Industries", 
      delta: "+2.1%", 
      trend: "up",
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
      change: "₹2,450.50",
      period: "Live"
    },
    { 
      label: "Investment Score", 
      value: "847/1000", 
      delta: "Excellent", 
      trend: "up",
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
      change: "+23 points",
      period: "This month"
    },
  ]

  const alerts = [
    { 
      type: "warning", 
      icon: Info, 
      text: "SIP of ₹15,000 for HDFC Top 100 Fund due in 2 days", 
      time: "2 hours ago",
      amount: "₹15,000",
      action: "Auto-debit enabled"
    },
    { 
      type: "danger", 
      icon: AlertCircle, 
      text: "HDFC Credit Card bill of ₹45,670 due tomorrow", 
      time: "1 hour ago",
      amount: "₹45,670",
      action: "Pay now"
    },
    { 
      type: "success", 
      icon: CheckCircle2, 
      text: "Reliance Industries gained 2.1% today - ₹5,130 profit", 
      time: "30 minutes ago",
      amount: "+₹5,130",
      action: "View details"
    },
    { 
      type: "info", 
      icon: Target, 
      text: "Emergency Fund goal 70% complete - ₹3.5L saved", 
      time: "4 hours ago",
      amount: "₹3,50,000",
      action: "Track progress"
    },
  ]

  const features = [
    {
      title: "AI Financial Advisor",
      description: "Get personalized financial advice powered by advanced AI",
      icon: Bot,
      color: "bg-gradient-to-br from-blue-500 to-purple-600",
      href: "/advisor",
      stats: "95% accuracy"
    },
    {
      title: "Smart Investments",
      description: "Track and manage your investment portfolio with real-time data",
      icon: Wallet,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      href: "/investments",
      stats: "₹15.5L portfolio"
    },
    {
      title: "Credit Card Recommendations",
      description: "AI-powered credit card suggestions based on your spending patterns",
      icon: CreditCard,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      href: "/credit-cards",
      stats: "3 cards recommended"
    },
    {
      title: "Document Management",
      description: "Secure storage and organization of all your financial documents",
      icon: FileText,
      color: "bg-gradient-to-br from-indigo-500 to-blue-600",
      href: "/documents",
      stats: "12 documents"
    },
    {
      title: "Loan Management",
      description: "Track and optimize your loans with smart repayment strategies",
      icon: Landmark,
      color: "bg-gradient-to-br from-teal-500 to-cyan-600",
      href: "/loan",
      stats: "2 active loans"
    },
    {
      title: "Learning Hub",
      description: "Master financial literacy with interactive courses and quizzes",
      icon: GraduationCap,
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
      href: "/learning",
      stats: "8 courses completed"
    }
  ]

  return (
    <QueryProvider>
      <AppShell>
        <div className="space-y-8">
          {/* Hero Section with Advanced Animations */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl"
          >
            {/* Animated Background Elements */}
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"
            />
            
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-8 w-8 text-yellow-300" />
                </motion.div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Welcome to Finwise
                </h1>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-blue-100 mb-6 max-w-2xl"
              >
                Your comprehensive financial companion powered by AI. Track investments, get smart recommendations, and achieve your financial goals.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                    <Activity className="h-5 w-5 mr-2" />
                    View Portfolio
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    className="bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-blue-600 font-semibold shadow-lg transition-all duration-300"
                    onClick={() => window.location.href = '/advisor'}
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    Ask AI Advisor
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced KPI Cards with Advanced Animations */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.1 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.03, 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                className="group cursor-pointer"
              >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                  {/* Animated gradient background */}
                  <motion.div 
                    className={`absolute inset-0 ${kpi.bgColor} opacity-60`}
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Floating particles effect */}
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full"
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: index * 0.5 
                    }}
                  />
                  
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        className={`p-3 rounded-xl ${kpi.bgColor} shadow-lg`}
                        whileHover={{ rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                      </motion.div>
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className={`bg-white/90 text-gray-700 shadow-sm ${
                            kpi.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {kpi.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {kpi.delta}
                        </Badge>
                      </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                      <motion.p 
                        className="text-sm text-muted-foreground font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {kpi.label}
                      </motion.p>
                      
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        {kpi.value}
                      </motion.p>
                      
                      <motion.div 
                        className="flex items-center justify-between text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <span className="text-muted-foreground">{kpi.change}</span>
                        <span className="font-medium text-blue-600">{kpi.period}</span>
                      </motion.div>
                    </div>
            </CardContent>
          </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="lg:col-span-2"
            >
              <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 backdrop-blur-sm">
                <CardHeader className="flex items-center justify-between pb-4">
                  <motion.div 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BarChart3 className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-xl font-bold">Portfolio Overview</CardTitle>
                      <p className="text-sm text-muted-foreground">Real-time performance tracking</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      onClick={() => setOpen(true)} 
                      variant="outline" 
                      size="sm"
                      className="bg-white/80 hover:bg-white shadow-md"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Rebalance
                    </Button>
                  </motion.div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Portfolio Growth Chart with Enhanced Animations */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Portfolio Growth</h3>
                      <p className="text-sm text-muted-foreground">12-month performance trend</p>
                    </div>
                    
                    <motion.div 
                      className="h-80 w-full rounded-lg bg-white/50 dark:bg-slate-800/50 p-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <YAxis 
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'value' ? formatINR(value) : formatINR(value),
                              name === 'value' ? 'Portfolio Value' : 'Gain/Loss'
                            ]}
                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)"
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gamification & Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <GamificationCard />
              
              <Card>
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Quick Actions
              </CardTitle>
            </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Investment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Set New Goal
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Find Credit Card
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Bot className="h-4 w-4 mr-2" />
                    Ask AI Advisor
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Powerful Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="group cursor-pointer"
                >
                  <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className={`h-2 ${feature.color}`}></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${feature.color} text-white`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {feature.stats}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                        Explore feature
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
          </motion.div>

          {/* Alerts & Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Alerts & Notifications
                </CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert, index) => {
                    const Icon = alert.icon
                    const styles = {
                      danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
                      warning: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
                      success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                    }
                    
                return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                        className={`rounded-lg border p-4 ${styles[alert.type as keyof typeof styles]}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.text}</p>
                            <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                          </div>
                  </div>
                      </motion.div>
                )
              })}
                </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>
        
        <RebalanceModal open={open} onOpenChange={setOpen} />
      </AppShell>
    </QueryProvider>
  )
}
