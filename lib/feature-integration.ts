/**
 * Intelligent Feature Integration System
 * Connects all Finwise features with smart data flow and user experience
 */

import { useAppState } from '@/lib/state-management'
import { useSmartNavigation } from '@/lib/smart-navigation'
import { useToast } from '@/hooks/use-toast'

export interface FeatureIntegration {
  name: string
  dependencies: string[]
  triggers: string[]
  actions: string[]
  dataFlow: string[]
}

export interface SmartAction {
  id: string
  name: string
  description: string
  icon: string
  category: 'investment' | 'learning' | 'advisor' | 'document' | 'loan' | 'salary'
  requiresAuth: boolean
  execute: () => void | Promise<void>
}

/**
 * Smart Feature Connector
 * Automatically connects related features based on user actions
 */
export function useFeatureConnector() {
  const { state, dispatch } = useAppState()
  const { navigate, navigateWithData } = useSmartNavigation()
  const { toast } = useToast()

  // Investment-related smart actions
  const investmentActions: SmartAction[] = [
    {
      id: 'analyze-portfolio',
      name: 'Analyze Portfolio',
      description: 'Get AI analysis of your investment portfolio',
      icon: 'BarChart3',
      category: 'investment',
      requiresAuth: true,
      execute: () => {
        const query = `Analyze my portfolio: ${state.investments.map(i => i.symbol).join(', ')}`
        navigate(`/advisor?q=${encodeURIComponent(query)}`)
      }
    },
    {
      id: 'rebalance-portfolio',
      name: 'Rebalance Portfolio',
      description: 'Get AI recommendations for portfolio rebalancing',
      icon: 'RefreshCw',
      category: 'investment',
      requiresAuth: true,
      execute: () => {
        dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'rebalance', open: true } })
      }
    },
    {
      id: 'add-investment',
      name: 'Add Investment',
      description: 'Add a new investment to your portfolio',
      icon: 'Plus',
      category: 'investment',
      requiresAuth: true,
      execute: () => {
        dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'addTransaction', open: true } })
      }
    },
    {
      id: 'learn-investing',
      name: 'Learn Investing',
      description: 'Improve your investment knowledge',
      icon: 'BookOpen',
      category: 'learning',
      requiresAuth: false,
      execute: () => {
        navigate('/learning?tab=flashcards')
        dispatch({ type: 'ADD_XP', payload: 10 })
      }
    }
  ]

  // Learning-related smart actions
  const learningActions: SmartAction[] = [
    {
      id: 'complete-flashcard',
      name: 'Complete Flashcard',
      description: 'Complete a financial literacy flashcard',
      icon: 'CheckCircle',
      category: 'learning',
      requiresAuth: false,
      execute: () => {
        dispatch({ type: 'ADD_XP', payload: 10 })
        toast({
          title: "Great job!",
          description: "You earned 10 XP points",
        })
      }
    },
    {
      id: 'take-quiz',
      name: 'Take Quiz',
      description: 'Test your financial knowledge',
      icon: 'Brain',
      category: 'learning',
      requiresAuth: false,
      execute: () => {
        navigate('/learning?tab=quizzes')
      }
    },
    {
      id: 'ask-advisor',
      name: 'Ask Advisor',
      description: 'Get personalized financial advice',
      icon: 'Bot',
      category: 'advisor',
      requiresAuth: true,
      execute: () => {
        navigate('/advisor')
        dispatch({ type: 'ADD_XP', payload: 5 })
      }
    }
  ]

  // Document-related smart actions
  const documentActions: SmartAction[] = [
    {
      id: 'analyze-document',
      name: 'Analyze Document',
      description: 'Get AI analysis of uploaded document',
      icon: 'FileText',
      category: 'document',
      requiresAuth: true,
      execute: () => {
        toast({
          title: "Document Analysis",
          description: "AI is analyzing your document...",
        })
        // Simulate document analysis
        setTimeout(() => {
          toast({
            title: "Analysis Complete",
            description: "Risk score: 70% - Moderate risk profile",
          })
        }, 2000)
      }
    },
    {
      id: 'get-recommendations',
      name: 'Get Recommendations',
      description: 'Get personalized recommendations based on document',
      icon: 'Lightbulb',
      category: 'advisor',
      requiresAuth: true,
      execute: () => {
        const query = "Based on my uploaded document, what financial recommendations do you have?"
        navigate(`/advisor?q=${encodeURIComponent(query)}`)
      }
    }
  ]

  // Loan-related smart actions
  const loanActions: SmartAction[] = [
    {
      id: 'calculate-emi',
      name: 'Calculate EMI',
      description: 'Calculate EMI for your loan',
      icon: 'Calculator',
      category: 'loan',
      requiresAuth: false,
      execute: () => {
        navigate('/loan')
      }
    },
    {
      id: 'compare-loans',
      name: 'Compare Loans',
      description: 'Compare loan options from different banks',
      icon: 'Compare',
      category: 'loan',
      requiresAuth: false,
      execute: () => {
        navigate('/loan?tab=comparison')
      }
    },
    {
      id: 'get-loan-advice',
      name: 'Get Loan Advice',
      description: 'Get AI advice on loan strategies',
      icon: 'Bot',
      category: 'advisor',
      requiresAuth: true,
      execute: () => {
        const query = "Help me choose the best loan option and repayment strategy"
        navigate(`/advisor?q=${encodeURIComponent(query)}`)
      }
    }
  ]

  // Salary-related smart actions
  const salaryActions: SmartAction[] = [
    {
      id: 'optimize-salary',
      name: 'Optimize Salary',
      description: 'Optimize your salary structure for tax benefits',
      icon: 'TrendingUp',
      category: 'salary',
      requiresAuth: true,
      execute: () => {
        navigate('/salary?tab=optimization')
      }
    },
    {
      id: 'plan-budget',
      name: 'Plan Budget',
      description: 'Create a comprehensive budget plan',
      icon: 'PieChart',
      category: 'salary',
      requiresAuth: true,
      execute: () => {
        navigate('/salary?tab=budgeting')
      }
    },
    {
      id: 'track-growth',
      name: 'Track Growth',
      description: 'Track your career and salary growth',
      icon: 'LineChart',
      category: 'salary',
      requiresAuth: true,
      execute: () => {
        navigate('/salary?tab=growth')
      }
    }
  ]

  // Credit card-related smart actions
  const creditCardActions: SmartAction[] = [
    {
      id: 'get-recommendations',
      name: 'Get Recommendations',
      description: 'Get AI-powered credit card recommendations',
      icon: 'CreditCard',
      category: 'advisor',
      requiresAuth: true,
      execute: () => {
        navigate('/credit-cards')
      }
    },
    {
      id: 'compare-cards',
      name: 'Compare Cards',
      description: 'Compare different credit card options',
      icon: 'Compare',
      category: 'advisor',
      requiresAuth: true,
      execute: () => {
        navigate('/credit-cards?tab=comparison')
      }
    }
  ]

  // Get all smart actions
  const getAllActions = (): SmartAction[] => {
    return [
      ...investmentActions,
      ...learningActions,
      ...documentActions,
      ...loanActions,
      ...salaryActions,
      ...creditCardActions
    ]
  }

  // Get actions by category
  const getActionsByCategory = (category: SmartAction['category']): SmartAction[] => {
    return getAllActions().filter(action => action.category === category)
  }

  // Get contextual actions based on current state
  const getContextualActions = (): SmartAction[] => {
    const actions: SmartAction[] = []
    
    // Add investment actions if user has investments
    if (state.investments.length > 0) {
      actions.push(...investmentActions)
    }
    
    // Add learning actions if user is learning
    if (state.learningProgress.xp > 0) {
      actions.push(...learningActions)
    }
    
    // Add salary actions if user is authenticated
    if (state.isAuthenticated) {
      actions.push(...salaryActions)
    }
    
    // Always add basic actions
    actions.push(...loanActions)
    actions.push(...creditCardActions)
    
    return actions
  }

  // Execute smart action
  const executeAction = async (actionId: string) => {
    const action = getAllActions().find(a => a.id === actionId)
    if (!action) {
      toast({
        title: "Action Not Found",
        description: "The requested action could not be found",
        variant: "destructive"
      })
      return
    }

    if (action.requiresAuth && !state.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use this feature",
        variant: "destructive"
      })
      navigate('/login')
      return
    }

    try {
      await action.execute()
      toast({
        title: "Action Completed",
        description: action.description,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      })
    }
  }

  return {
    getAllActions,
    getActionsByCategory,
    getContextualActions,
    executeAction,
    investmentActions,
    learningActions,
    documentActions,
    loanActions,
    salaryActions,
    creditCardActions
  }
}

/**
 * Smart Data Flow Manager
 * Manages data flow between different features
 */
export function useDataFlowManager() {
  const { state, dispatch } = useAppState()
  const { toast } = useToast()

  // Investment data flow
  const syncInvestmentData = (investment: any) => {
    // Update investment in state
    dispatch({ type: 'UPDATE_INVESTMENT', payload: { id: investment.id, updates: investment } })
    
    // Trigger related updates
    updatePortfolioMetrics()
    updateGoalProgress()
    updateLearningProgress('investment_activity')
  }

  // Goal data flow
  const syncGoalData = (goal: any) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, updates: goal } })
    updatePortfolioMetrics()
  }

  // Learning data flow
  const syncLearningData = (learningData: any) => {
    dispatch({ type: 'UPDATE_LEARNING_PROGRESS', payload: learningData })
    
    // Award badges based on progress
    checkAndAwardBadges()
  }

  // Transaction data flow
  const syncTransactionData = (transaction: any) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction })
    
    // Update related investments
    if (transaction.type === 'Buy' || transaction.type === 'Sell') {
      updateInvestmentFromTransaction(transaction)
    }
    
    // Update learning progress
    updateLearningProgress('transaction_completed')
  }

  // Helper functions
  const updatePortfolioMetrics = () => {
    // Calculate portfolio metrics
    const totalValue = state.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalGain = state.investments.reduce((sum, inv) => sum + inv.totalGain, 0)
    
    // Update dashboard metrics
    console.log('Portfolio updated:', { totalValue, totalGain })
  }

  const updateGoalProgress = () => {
    // Update goal progress based on current investments
    state.investmentGoals.forEach(goal => {
      const relevantInvestments = state.investments.filter(inv => 
        inv.category === goal.category || inv.sector === goal.category
      )
      const currentAmount = relevantInvestments.reduce((sum, inv) => sum + inv.currentValue, 0)
      
      if (currentAmount !== goal.currentAmount) {
        dispatch({ type: 'UPDATE_GOAL', payload: { 
          id: goal.id, 
          updates: { currentAmount } 
        }})
      }
    })
  }

  const updateLearningProgress = (activity: string) => {
    const xpRewards: Record<string, number> = {
      'investment_activity': 5,
      'transaction_completed': 3,
      'goal_achieved': 20,
      'quiz_completed': 15,
      'flashcard_completed': 10
    }
    
    const xp = xpRewards[activity] || 0
    if (xp > 0) {
      dispatch({ type: 'ADD_XP', payload: xp })
    }
  }

  const checkAndAwardBadges = () => {
    const { xp, level } = state.learningProgress
    const newBadges: string[] = []
    
    if (level >= 5 && !state.learningProgress.badges.includes('Investment Expert')) {
      newBadges.push('Investment Expert')
    }
    
    if (xp >= 500 && !state.learningProgress.badges.includes('Financial Guru')) {
      newBadges.push('Financial Guru')
    }
    
    if (newBadges.length > 0) {
      dispatch({ type: 'UPDATE_LEARNING_PROGRESS', payload: {
        badges: [...state.learningProgress.badges, ...newBadges]
      }})
      
      toast({
        title: "New Badge Earned!",
        description: `You earned: ${newBadges.join(', ')}`,
      })
    }
  }

  const updateInvestmentFromTransaction = (transaction: any) => {
    const investment = state.investments.find(inv => inv.symbol === transaction.asset)
    if (investment) {
      let newQuantity = investment.quantity
      let newInvestedAmount = investment.investedAmount
      
      if (transaction.type === 'Buy') {
        newQuantity += transaction.quantity
        newInvestedAmount += transaction.amount
      } else if (transaction.type === 'Sell') {
        newQuantity -= transaction.quantity
        newInvestedAmount -= transaction.amount
      }
      
      dispatch({ type: 'UPDATE_INVESTMENT', payload: {
        id: investment.id,
        updates: {
          quantity: newQuantity,
          investedAmount: newInvestedAmount,
          currentValue: newQuantity * investment.currentPrice
        }
      }})
    }
  }

  return {
    syncInvestmentData,
    syncGoalData,
    syncLearningData,
    syncTransactionData,
    updatePortfolioMetrics,
    updateGoalProgress,
    updateLearningProgress,
    checkAndAwardBadges
  }
}

/**
 * Smart Notification System
 * Provides contextual notifications based on user actions
 */
export function useSmartNotifications() {
  const { state } = useAppState()
  const { toast } = useToast()

  const sendContextualNotification = (context: string, data: any) => {
    switch (context) {
      case 'investment_added':
        toast({
          title: "Investment Added",
          description: `${data.symbol} has been added to your portfolio`,
        })
        break
        
      case 'goal_achieved':
        toast({
          title: "Goal Achieved!",
          description: `Congratulations! You've achieved your ${data.name} goal`,
        })
        break
        
      case 'learning_milestone':
        toast({
          title: "Learning Milestone",
          description: `You've completed ${data.completed} flashcards!`,
        })
        break
        
      case 'portfolio_rebalanced':
        toast({
          title: "Portfolio Rebalanced",
          description: "Your portfolio has been successfully rebalanced",
        })
        break
        
      case 'document_analyzed':
        toast({
          title: "Document Analyzed",
          description: `Risk score: ${data.riskScore}% - ${data.summary}`,
        })
        break
        
      default:
        toast({
          title: "Notification",
          description: "Something happened in your financial journey",
        })
    }
  }

  const sendProactiveNotification = () => {
    // Check for proactive notification opportunities
    if (state.investments.length > 0) {
      const totalGain = state.investments.reduce((sum, inv) => sum + inv.totalGain, 0)
      if (totalGain > 0) {
        toast({
          title: "Portfolio Update",
          description: `Your portfolio is up ₹${totalGain.toLocaleString()} today!`,
        })
      }
    }
  }

  return {
    sendContextualNotification,
    sendProactiveNotification
  }
}
