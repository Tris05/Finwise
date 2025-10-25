"use client"

interface BudgetCategory {
  id: string
  name: string
  percentage: number
  description?: string
}

interface CareerGoal {
  id: string
  title: string
  description: string
  targetSalary: number
  targetDate: string
  currentProgress: number
  skills: string[]
  milestones: CareerMilestone[]
}

interface CareerMilestone {
  id: string
  title: string
  description: string
  targetDate: string
  completed: boolean
}

interface UserPreferences {
  budgetCategories: {
    needs: BudgetCategory[]
    wants: BudgetCategory[]
    savings: BudgetCategory[]
  }
  careerGoals: CareerGoal[]
}

const STORAGE_KEY = 'finwise-user-preferences'

export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save user preferences:', error)
  }
}

export function loadUserPreferences(): UserPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as UserPreferences
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error)
  }
  return null
}

export function getDefaultBudgetCategories() {
  return {
    needs: [
      { id: "1", name: "Rent/Mortgage", percentage: 40, description: "Housing expenses" },
      { id: "2", name: "Groceries", percentage: 25, description: "Food and household items" },
      { id: "3", name: "Utilities", percentage: 15, description: "Electricity, water, internet" },
      { id: "4", name: "EMI Payments", percentage: 15, description: "Loan payments" },
      { id: "5", name: "Insurance", percentage: 5, description: "Health and life insurance" }
    ],
    wants: [
      { id: "6", name: "Entertainment", percentage: 30, description: "Movies, games, subscriptions" },
      { id: "7", name: "Dining Out", percentage: 25, description: "Restaurants and cafes" },
      { id: "8", name: "Shopping", percentage: 20, description: "Clothes, gadgets, personal items" },
      { id: "9", name: "Travel", percentage: 15, description: "Vacations and trips" },
      { id: "10", name: "Hobbies", percentage: 10, description: "Personal interests and activities" }
    ],
    savings: [
      { id: "11", name: "Emergency Fund", percentage: 40, description: "6 months of expenses" },
      { id: "12", name: "Investments", percentage: 40, description: "SIPs, mutual funds, stocks" },
      { id: "13", name: "Goals", percentage: 15, description: "Specific financial goals" },
      { id: "14", name: "Retirement", percentage: 5, description: "Long-term retirement planning" }
    ]
  }
}

export function getDefaultCareerGoals(): CareerGoal[] {
  return [
    {
      id: "1",
      title: "Senior Software Engineer",
      description: "Become a senior software engineer with expertise in full-stack development",
      targetSalary: 1800000,
      targetDate: "2025-12-31",
      currentProgress: 60,
      skills: ["React", "Node.js", "Python", "AWS"],
      milestones: [
        {
          id: "1-1",
          title: "Complete Advanced React Course",
          description: "Master React hooks, context, and performance optimization",
          targetDate: "2024-06-30",
          completed: true
        },
        {
          id: "1-2",
          title: "Get AWS Certification",
          description: "Obtain AWS Solutions Architect certification",
          targetDate: "2024-09-30",
          completed: false
        },
        {
          id: "1-3",
          title: "Lead a Major Project",
          description: "Take ownership of a significant project from start to finish",
          targetDate: "2024-12-31",
          completed: false
        }
      ]
    }
  ]
}

export function initializeUserPreferences(): UserPreferences {
  const stored = loadUserPreferences()
  if (stored) {
    return stored
  }
  
  return {
    budgetCategories: getDefaultBudgetCategories(),
    careerGoals: getDefaultCareerGoals()
  }
}

export type { BudgetCategory, CareerGoal, CareerMilestone, UserPreferences }
