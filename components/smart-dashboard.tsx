/**
 * Smart Dashboard Component
 * Integrates all Finwise features with intelligent data flow and beautiful UI
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award, 
  Zap, 
  Shield, 
  CreditCard, 
  FileText, 
  Landmark, 
  GraduationCap,
  ArrowRight,
  Star,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Plus,
  Eye,
  Settings,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useAppState } from "@/lib/state-management"
import { useSmartNavigation } from "@/lib/smart-navigation"
import { useFeatureConnector } from "@/lib/feature-integration"
import { useToast } from "@/hooks/use-toast"

interface SmartKPICardProps {
  label: string
  value: string | number
  delta: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  change: string
  period: string
  onClick?: () => void
  isLoading?: boolean
}

function SmartKPICard({ 
  label, 
  value, 
  delta, 
  trend, 
  icon: Icon, 
  color, 
  bgColor, 
  change, 
  period,
  onClick,
  isLoading = false
}: SmartKPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`${bgColor} border-0 cursor-pointer transition-all duration-300 hover:shadow-lg`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-center space-x-2">
                <h3 className={`text-2xl font-bold ${color}`}>
                  {isLoading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    value
                  )}
                </h3>
                <Badge 
                  variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {delta}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{change}</p>
              <p className="text-xs font-medium text-muted-foreground">{period}</p>
            </div>
            <div className={`p-3 rounded-full ${bgColor}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface SmartFeatureCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href: string
  stats: string
  onClick?: () => void
  isActive?: boolean
}

function SmartFeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  href, 
  stats, 
  onClick,
  isActive = false
}: SmartFeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isActive ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {stats}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <div className="flex items-center text-xs text-primary">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface SmartAlertProps {
  id: string
  title: string
  description: string
  type: "info" | "warning" | "success" | "error"
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
}

function SmartAlert({ title, description, type, action, onDismiss }: SmartAlertProps) {
  const getIcon = () => {
    switch (type) {
      case "success": return CheckCircle
      case "warning": return AlertTriangle
      case "error": return AlertTriangle
      default: return Info
    }
  }

  const getColor = () => {
    switch (type) {
      case "success": return "text-green-600 bg-green-50 border-green-200"
      case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "error": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-blue-600 bg-blue-50 border-blue-200"
    }
  }

  const Icon = getIcon()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border ${getColor()}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Icon className="h-5 w-5 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
              {action && (
                <Button size="sm" variant="outline" onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
            </div>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                ×
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SmartDashboard() {
  const { state, dispatch } = useAppState()
  const { navigate, navigateWithData } = useSmartNavigation()
  const { getContextualActions, executeAction } = useFeatureConnector()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("overview")
  const [alerts, setAlerts] = useState([
    {
      id: "1",
      title: "Portfolio Rebalancing Recommended",
      description: "Your portfolio allocation has drifted from target. Consider rebalancing.",
      type: "warning" as const,
      action: {
        label: "Rebalance Now",
        onClick: () => executeAction('rebalance-portfolio')
      }
    },
    {
      id: "2", 
      title: "New Learning Content Available",
      description: "Check out the latest flashcards on tax planning strategies.",
      type: "info" as const,
      action: {
        label: "Start Learning",
        onClick: () => navigate('/learning?tab=flashcards')
      }
    },
    {
      id: "3",
      title: "Goal Progress Update",
      description: "You're 75% towards your retirement goal. Great progress!",
      type: "success" as const,
      action: {
        label: "View Goals",
        onClick: () => navigate('/investments?tab=goals')
      }
    }
  ])

  // Calculate portfolio metrics
  const portfolioValue = state.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalGain = state.investments.reduce((sum, inv) => sum + inv.totalGain, 0)
  const gainPercent = portfolioValue > 0 ? (totalGain / (portfolioValue - totalGain)) * 100 : 0

  // Calculate learning progress
  const learningProgress = (state.learningProgress.xp % 100) / 100 * 100

  // Smart KPIs
  const kpis = [
    { 
      label: "Total Portfolio Value", 
      value: formatINR(portfolioValue || 1642300), 
      delta: `+${gainPercent.toFixed(1)}%`, 
      trend: gainPercent >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
      change: `+${formatINR(totalGain || 182300)}`,
      period: "YTD",
      onClick: () => navigate('/investments')
    },
    { 
      label: "Learning Progress", 
      value: `${state.learningProgress.level}`, 
      delta: `${state.learningProgress.xp} XP`, 
      trend: "up",
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
      change: `${state.learningProgress.badges.length} badges`,
      period: "Current",
      onClick: () => navigate('/learning')
    },
    { 
      label: "Active Goals", 
      value: state.investmentGoals.filter(g => g.isActive).length, 
      delta: "On Track", 
      trend: "up",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
      change: "75% avg progress",
      period: "This Month",
      onClick: () => navigate('/investments?tab=goals')
    },
    { 
      label: "Investment Score", 
      value: "847/1000",
      delta: "+12 points", 
      trend: "up",
      icon: Star,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
      change: "Excellent",
      period: "This Week",
      onClick: () => navigate('/advisor')
    }
  ]

  // Smart features
  const features = [
    {
      title: "AI Financial Advisor",
      description: "Get personalized financial advice powered by advanced AI",
      icon: Bot,
      color: "bg-gradient-to-br from-blue-500 to-purple-600",
      href: "/advisor",
      stats: "95% accuracy",
      onClick: () => navigate('/advisor')
    },
    {
      title: "Smart Investments",
      description: "Track and manage your investment portfolio with real-time data",
      icon: Wallet,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      href: "/investments",
      stats: `${state.investments.length} investments`,
      onClick: () => navigate('/investments')
    },
    {
      title: "Credit Card Recommendations",
      description: "AI-powered credit card suggestions based on your spending patterns",
      icon: CreditCard,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      href: "/credit-cards",
      stats: "3 cards recommended",
      onClick: () => navigate('/credit-cards')
    },
    {
      title: "Document Management",
      description: "Secure storage and organization of all your financial documents",
      icon: FileText,
      color: "bg-gradient-to-br from-indigo-500 to-blue-600",
      href: "/documents",
      stats: "12 documents",
      onClick: () => navigate('/documents')
    },
    {
      title: "Loan Management",
      description: "Track and optimize your loans with smart repayment strategies",
      icon: Landmark,
      color: "bg-gradient-to-br from-teal-500 to-cyan-600",
      href: "/loan",
      stats: "2 active loans",
      onClick: () => navigate('/loan')
    },
    {
      title: "Learning Hub",
      description: "Master financial literacy with interactive courses and quizzes",
      icon: GraduationCap,
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
      href: "/learning",
      stats: `${state.learningProgress.badges.length} badges`,
      onClick: () => navigate('/learning')
    }
  ]

  // Quick actions
  const quickActions = getContextualActions().slice(0, 6)

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight"
          >
            Welcome back! 👋
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-2 text-lg text-blue-100"
          >
            Your comprehensive financial companion powered by AI. Track investments, get smart recommendations, and achieve your financial goals.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 flex gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                onClick={() => navigate('/investments')}
              >
                <Activity className="h-5 w-5 mr-2" />
                View Portfolio
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-blue-600 font-semibold shadow-lg transition-all duration-300"
                onClick={() => navigate('/advisor')}
              >
                <Bot className="h-5 w-5 mr-2" />
                Ask AI Advisor
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Smart KPIs */}
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
          >
            <SmartKPICard {...kpi} />
          </motion.div>
        ))}
      </motion.div>

      {/* Smart Alerts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Smart Alerts</h2>
          <Badge variant="secondary">{alerts.length} alerts</Badge>
        </div>
        <AnimatePresence>
          {alerts.map((alert) => (
            <SmartAlert
              key={alert.id}
              {...alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Smart Features */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Smart Features</h2>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.4 + index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <SmartFeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <Badge variant="outline">AI Powered</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.5 + index * 0.05,
                type: "spring",
                stiffness: 200
              }}
            >
              <Card 
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                onClick={() => executeAction(action.id)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className="mx-auto w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">{action.icon}</span>
                  </div>
                  <h3 className="text-sm font-medium">{action.name}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
