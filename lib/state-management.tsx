/**
 * Unified State Management System for Finwise
 * Centralizes all application state with smart caching and persistence
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'

// ===== TYPES =====
export interface User {
  id: string
  email: string
  displayName: string
  profilePicture?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  twoFactorEnabled: boolean
  budgetCategories: BudgetCategory[]
  careerGoals: CareerGoal[]
}

export interface BudgetCategory {
  id: string
  name: string
  percentage: number
  description: string
  type: 'needs' | 'wants' | 'savings'
}

export interface CareerGoal {
  id: string
  title: string
  description: string
  targetSalary: number
  targetDate: string
  currentProgress: number
  skills: string[]
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate?: string
  completed?: boolean
}

export interface Investment {
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
  lastUpdated: string
}

export interface Transaction {
  id: string
  date: string
  type: 'Buy' | 'Sell' | 'Dividend' | 'Interest'
  asset: string
  quantity: number
  price: number
  amount: number
  status: 'Completed' | 'Pending' | 'Failed'
  category: string
  notes?: string
}

export interface InvestmentGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: 'High' | 'Medium' | 'Low'
  isActive: boolean
  category: 'retirement' | 'house' | 'education' | 'emergency' | 'vacation'
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  annualFee: number
  rewards: string[]
  whyRecommended: string
  approvalProbability: number
}

export interface Loan {
  id: string
  type: 'home' | 'car' | 'education' | 'personal'
  amount: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
  remainingBalance: number
  bankName: string
  status: 'active' | 'paid_off' | 'defaulted'
  startDate: string
  endDate: string
}

export interface LearningProgress {
  xp: number
  level: number
  badges: string[]
  streak: number
  learningStats: {
    flashcardsCompleted: number
    quizzesCompleted: number
    totalLearningXP: number
    currentStreak: number
    longestStreak: number
  }
}

export interface SecurityLog {
  id: string
  timestamp: string
  location: string
  device: string
  severity: 'info' | 'warning' | 'critical'
  acknowledged: boolean
}

export interface AppState {
  // User & Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Financial Data
  investments: Investment[]
  transactions: Transaction[]
  investmentGoals: InvestmentGoal[]
  creditCards: CreditCard[]
  loans: Loan[]
  
  // Learning & Gamification
  learningProgress: LearningProgress
  
  // Security
  securityLogs: SecurityLog[]
  
  // UI State
  sidebarCollapsed: boolean
  activeTab: string
  modals: {
    addTransaction: boolean
    addGoal: boolean
    editGoal: boolean
    sellInvestment: boolean
    rebalance: boolean
  }
  
  // Market Data
  marketData: {
    lastUpdated: string | null
    isLoading: boolean
    error: string | null
  }
}

// ===== ACTIONS =====
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_INVESTMENTS'; payload: Investment[] }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: { id: string; updates: Partial<Investment> } }
  | { type: 'REMOVE_INVESTMENT'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'ADD_GOAL'; payload: InvestmentGoal }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<InvestmentGoal> } }
  | { type: 'REMOVE_GOAL'; payload: string }
  | { type: 'UPDATE_LEARNING_PROGRESS'; payload: Partial<LearningProgress> }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof AppState['modals']; open: boolean } }
  | { type: 'UPDATE_MARKET_DATA'; payload: { lastUpdated: string; isLoading: boolean; error: string | null } }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }

// ===== REDUCER =====
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'UPDATE_INVESTMENTS':
      return { ...state, investments: action.payload }
    
    case 'ADD_INVESTMENT':
      return { ...state, investments: [...state.investments, action.payload] }
    
    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.map(inv =>
          inv.id === action.payload.id ? { ...inv, ...action.payload.updates } : inv
        )
      }
    
    case 'REMOVE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.filter(inv => inv.id !== action.payload)
      }
    
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        )
      }
    
    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      }
    
    case 'ADD_GOAL':
      return { ...state, investmentGoals: [...state.investmentGoals, action.payload] }
    
    case 'UPDATE_GOAL':
      return {
        ...state,
        investmentGoals: state.investmentGoals.map(goal =>
          goal.id === action.payload.id ? { ...goal, ...action.payload.updates } : goal
        )
      }
    
    case 'REMOVE_GOAL':
      return {
        ...state,
        investmentGoals: state.investmentGoals.filter(goal => goal.id !== action.payload)
      }
    
    case 'UPDATE_LEARNING_PROGRESS':
      return {
        ...state,
        learningProgress: { ...state.learningProgress, ...action.payload }
      }
    
    case 'ADD_XP':
      const newXP = state.learningProgress.xp + action.payload
      const newLevel = Math.floor(newXP / 100) + 1
      return {
        ...state,
        learningProgress: {
          ...state.learningProgress,
          xp: newXP,
          level: newLevel
        }
      }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.open
        }
      }
    
    case 'UPDATE_MARKET_DATA':
      return {
        ...state,
        marketData: {
          ...state.marketData,
          ...action.payload
        }
      }
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          preferences: { ...state.user.preferences, ...action.payload }
        } : null
      }
    
    default:
      return state
  }
}

// ===== INITIAL STATE =====
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  investments: [],
  transactions: [],
  investmentGoals: [],
  creditCards: [],
  loans: [],
  learningProgress: {
    xp: 0,
    level: 1,
    badges: [],
    streak: 0,
    learningStats: {
      flashcardsCompleted: 0,
      quizzesCompleted: 0,
      totalLearningXP: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  },
  securityLogs: [],
  sidebarCollapsed: false,
  activeTab: 'dashboard',
  modals: {
    addTransaction: false,
    addGoal: false,
    editGoal: false,
    sellInvestment: false,
    rebalance: false
  },
  marketData: {
    lastUpdated: null,
    isLoading: false,
    error: null
  }
}

// ===== CONTEXT =====
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// ===== PROVIDER =====
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { toast } = useToast()

  // Persist critical state to localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('finwise-user', JSON.stringify(state.user))
    }
    if (state.investments.length > 0) {
      localStorage.setItem('finwise-investments', JSON.stringify(state.investments))
    }
    if (state.transactions.length > 0) {
      localStorage.setItem('finwise-transactions', JSON.stringify(state.transactions))
    }
  }, [state.user, state.investments, state.transactions])

  // Load persisted state on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('finwise-user')
      const savedInvestments = localStorage.getItem('finwise-investments')
      const savedTransactions = localStorage.getItem('finwise-transactions')
      
      if (savedUser) {
        dispatch({ type: 'SET_USER', payload: JSON.parse(savedUser) })
      }
      if (savedInvestments) {
        dispatch({ type: 'UPDATE_INVESTMENTS', payload: JSON.parse(savedInvestments) })
      }
      if (savedTransactions) {
        dispatch({ type: 'ADD_TRANSACTION', payload: JSON.parse(savedTransactions)[0] })
      }
    } catch (error) {
      console.error('Error loading persisted state:', error)
      toast({
        title: "Error",
        description: "Failed to load saved data",
        variant: "destructive"
      })
    }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ===== HOOKS =====
export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}

export function useInvestments() {
  const { state, dispatch } = useAppState()
  return {
    investments: state.investments,
    addInvestment: (investment: Investment) => dispatch({ type: 'ADD_INVESTMENT', payload: investment }),
    updateInvestment: (id: string, updates: Partial<Investment>) => 
      dispatch({ type: 'UPDATE_INVESTMENT', payload: { id, updates } }),
    removeInvestment: (id: string) => dispatch({ type: 'REMOVE_INVESTMENT', payload: id }),
    updateInvestments: (investments: Investment[]) => 
      dispatch({ type: 'UPDATE_INVESTMENTS', payload: investments })
  }
}

export function useTransactions() {
  const { state, dispatch } = useAppState()
  return {
    transactions: state.transactions,
    addTransaction: (transaction: Transaction) => dispatch({ type: 'ADD_TRANSACTION', payload: transaction }),
    updateTransaction: (id: string, updates: Partial<Transaction>) => 
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates } }),
    removeTransaction: (id: string) => dispatch({ type: 'REMOVE_TRANSACTION', payload: id })
  }
}

export function useGoals() {
  const { state, dispatch } = useAppState()
  return {
    goals: state.investmentGoals,
    addGoal: (goal: InvestmentGoal) => dispatch({ type: 'ADD_GOAL', payload: goal }),
    updateGoal: (id: string, updates: Partial<InvestmentGoal>) => 
      dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } }),
    removeGoal: (id: string) => dispatch({ type: 'REMOVE_GOAL', payload: id })
  }
}

export function useLearning() {
  const { state, dispatch } = useAppState()
  return {
    progress: state.learningProgress,
    addXP: (xp: number) => dispatch({ type: 'ADD_XP', payload: xp }),
    updateProgress: (updates: Partial<LearningProgress>) => 
      dispatch({ type: 'UPDATE_LEARNING_PROGRESS', payload: updates })
  }
}

export function useModals() {
  const { state, dispatch } = useAppState()
  return {
    modals: state.modals,
    openModal: (modal: keyof AppState['modals']) => 
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open: true } }),
    closeModal: (modal: keyof AppState['modals']) => 
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open: false } }),
    toggleModal: (modal: keyof AppState['modals']) => 
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open: !state.modals[modal] } })
  }
}

export function useUser() {
  const { state, dispatch } = useAppState()
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    updatePreferences: (preferences: Partial<UserPreferences>) => 
      dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences })
  }
}
