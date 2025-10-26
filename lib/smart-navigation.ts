/**
 * Smart Navigation System for Finwise
 * Provides intelligent routing and cross-feature navigation
 */

import { useRouter, usePathname } from 'next/navigation'
import { useAppState } from '@/lib/state-management'
import { useToast } from '@/hooks/use-toast'

export interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string | number
  requiresAuth?: boolean
  subItems?: NavigationItem[]
}

export interface SmartNavigationOptions {
  showToast?: boolean
  trackAnalytics?: boolean
  updateState?: boolean
}

export function useSmartNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { state, dispatch } = useAppState()
  const { toast } = useToast()

  const navigate = (
    href: string, 
    options: SmartNavigationOptions = {}
  ) => {
    const { showToast = false, trackAnalytics = true, updateState = true } = options

    // Check authentication for protected routes
    if (href !== '/login' && href !== '/signup' && !state.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    // Update active tab state
    if (updateState) {
      const tabName = href.split('/')[1] || 'dashboard'
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tabName })
    }

    // Track analytics
    if (trackAnalytics) {
      // Analytics tracking would go here
      console.log(`Navigation: ${pathname} -> ${href}`)
    }

    // Show success toast
    if (showToast) {
      toast({
        title: "Navigating",
        description: `Taking you to ${href.split('/')[1] || 'dashboard'}`,
      })
    }

    // Perform navigation
    router.push(href)
  }

  const navigateWithData = (
    href: string, 
    data: any, 
    options: SmartNavigationOptions = {}
  ) => {
    // Store data in session storage for the next page
    if (data) {
      sessionStorage.setItem(`nav-data-${href}`, JSON.stringify(data))
    }
    navigate(href, options)
  }

  const navigateToInvestment = (investmentId?: string) => {
    const href = investmentId ? `/investments?focus=${investmentId}` : '/investments'
    navigate(href, { showToast: true })
  }

  const navigateToGoal = (goalId?: string) => {
    const href = goalId ? `/investments?tab=goals&focus=${goalId}` : '/investments?tab=goals'
    navigate(href, { showToast: true })
  }

  const navigateToTransaction = (transactionId?: string) => {
    const href = transactionId ? `/investments?tab=transactions&focus=${transactionId}` : '/investments?tab=transactions'
    navigate(href, { showToast: true })
  }

  const navigateToAdvisor = (query?: string) => {
    const href = query ? `/advisor?q=${encodeURIComponent(query)}` : '/advisor'
    navigate(href, { showToast: true })
  }

  const navigateToLearning = (type?: 'flashcards' | 'quizzes' | 'progress') => {
    const href = type ? `/learning?tab=${type}` : '/learning'
    navigate(href, { showToast: true })
  }

  const navigateToSettings = (section?: string) => {
    const href = section ? `/settings?section=${section}` : '/settings'
    navigate(href, { showToast: true })
  }

  const goBack = () => {
    router.back()
  }

  const refresh = () => {
    router.refresh()
  }

  return {
    navigate,
    navigateWithData,
    navigateToInvestment,
    navigateToGoal,
    navigateToTransaction,
    navigateToAdvisor,
    navigateToLearning,
    navigateToSettings,
    goBack,
    refresh,
    currentPath: pathname,
    isActive: (href: string) => pathname === href || pathname.startsWith(href + '/')
  }
}

/**
 * Smart Cross-Feature Navigation
 * Enables seamless navigation between related features
 */
export function useCrossFeatureNavigation() {
  const { navigate, navigateWithData } = useSmartNavigation()

  // Investment-related navigation
  const fromInvestmentToAdvisor = (investment: any) => {
    const query = `Tell me about ${investment.symbol} stock. Should I buy, hold, or sell?`
    navigateToAdvisor(query)
  }

  const fromInvestmentToGoal = (investment: any) => {
    navigateToGoal()
  }

  const fromInvestmentToTransaction = (investment: any) => {
    navigateToTransaction()
  }

  // Goal-related navigation
  const fromGoalToInvestment = (goal: any) => {
    const query = `Help me achieve my ${goal.name} goal of ₹${goal.targetAmount.toLocaleString()}`
    navigateToAdvisor(query)
  }

  const fromGoalToLearning = (goal: any) => {
    navigateToLearning('flashcards')
  }

  // Learning-related navigation
  const fromLearningToAdvisor = (topic: string) => {
    const query = `Explain ${topic} in simple terms with examples`
    navigateToAdvisor(query)
  }

  const fromLearningToInvestment = (topic: string) => {
    navigateToInvestment()
  }

  // Advisor-related navigation
  const fromAdvisorToInvestment = (recommendation: string) => {
    navigateToInvestment()
  }

  const fromAdvisorToLearning = (topic: string) => {
    navigateToLearning('flashcards')
  }

  // Document-related navigation
  const fromDocumentToAdvisor = (documentType: string) => {
    const query = `Analyze my ${documentType} and give me financial advice`
    navigateToAdvisor(query)
  }

  const fromDocumentToInvestment = (documentType: string) => {
    navigateToInvestment()
  }

  // Loan-related navigation
  const fromLoanToAdvisor = (loanType: string) => {
    const query = `Help me with ${loanType} loan options and strategies`
    navigateToAdvisor(query)
  }

  const fromLoanToInvestment = (loanType: string) => {
    navigateToInvestment()
  }

  // Salary-related navigation
  const fromSalaryToAdvisor = (salaryData: any) => {
    const query = `Help me optimize my salary of ₹${salaryData.monthlySalary.toLocaleString()}`
    navigateToAdvisor(query)
  }

  const fromSalaryToInvestment = (salaryData: any) => {
    navigateToInvestment()
  }

  return {
    // Investment flows
    fromInvestmentToAdvisor,
    fromInvestmentToGoal,
    fromInvestmentToTransaction,
    
    // Goal flows
    fromGoalToInvestment,
    fromGoalToLearning,
    
    // Learning flows
    fromLearningToAdvisor,
    fromLearningToInvestment,
    
    // Advisor flows
    fromAdvisorToInvestment,
    fromAdvisorToLearning,
    
    // Document flows
    fromDocumentToAdvisor,
    fromDocumentToInvestment,
    
    // Loan flows
    fromLoanToAdvisor,
    fromLoanToInvestment,
    
    // Salary flows
    fromSalaryToAdvisor,
    fromSalaryToInvestment
  }
}

/**
 * Breadcrumb Navigation
 * Provides context-aware breadcrumbs
 */
export function useBreadcrumbs() {
  const pathname = usePathname()
  const { state } = useAppState()

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    // Add home
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      isActive: pathname === '/dashboard'
    })

    // Add current page segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: index === segments.length - 1
      })
    })

    return breadcrumbs
  }

  return {
    breadcrumbs: getBreadcrumbs(),
    currentPage: pathname.split('/').pop() || 'dashboard'
  }
}

/**
 * Quick Actions Navigation
 * Provides quick access to common actions
 */
export function useQuickActions() {
  const { navigate } = useSmartNavigation()
  const { state } = useAppState()

  const quickActions = [
    {
      label: 'Add Investment',
      icon: 'Plus',
      action: () => navigate('/investments?action=add'),
      description: 'Add a new investment to your portfolio'
    },
    {
      label: 'Ask Advisor',
      icon: 'Bot',
      action: () => navigate('/advisor'),
      description: 'Get AI-powered financial advice'
    },
    {
      label: 'View Portfolio',
      icon: 'PieChart',
      action: () => navigate('/investments'),
      description: 'Check your investment portfolio'
    },
    {
      label: 'Add Goal',
      icon: 'Target',
      action: () => navigate('/investments?tab=goals&action=add'),
      description: 'Set a new financial goal'
    },
    {
      label: 'Learn',
      icon: 'BookOpen',
      action: () => navigate('/learning'),
      description: 'Improve your financial knowledge'
    },
    {
      label: 'Upload Document',
      icon: 'Upload',
      action: () => navigate('/documents'),
      description: 'Upload and analyze documents'
    }
  ]

  return {
    quickActions,
    executeQuickAction: (action: string) => {
      const quickAction = quickActions.find(a => a.label === action)
      if (quickAction) {
        quickAction.action()
      }
    }
  }
}
