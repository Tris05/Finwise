"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-provider"
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore"

export interface UserProfileData {
    annualIncome: number | null;
    monthlySurplus: number | null;
    age: number | null;
    investmentHorizon: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    riskProfile: string | null;
    settings: {
        twoFA: boolean;
        theme: "light" | "dark";
        currency: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        }
    };
    loading: boolean;
}

export interface Investment {
    id: string
    symbol: string
    name: string
    type: string
    category: string
    quantity: number
    investedAmount: number
    currentPrice: number
    currentValue: number
    totalGain: number
    gainPercent: number
    dayChange: number
    dayChangePercent: number
    color: string
}

export type GoalType = "Emergency Fund" | "Home Purchase" | "Car Purchase" | "Education" | "Retirement" | "Vacation" | "Other";

export interface FinancialGoal {
    id: string;
    type?: GoalType;
    category?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    priority: "High" | "Medium" | "Low";
    monthlyContribution?: number;
    expectedReturn?: number;
    status?: string;
}

export interface LoanProfile {
    amount: number
    tenure: number
    rate: number
    type: string
    updatedAt?: string
}

interface FinancialDataContextType {
    profile: UserProfileData
    baseInvestments: any[]
    goals: FinancialGoal[]
    loanProfile: LoanProfile | null
    loading: boolean
    addGoal: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>
    updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
    saveLoanProfile: (data: Partial<LoanProfile>) => Promise<void>
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined)

const initialProfile: UserProfileData = {
    annualIncome: null,
    monthlySurplus: null,
    age: null,
    investmentHorizon: null,
    name: null,
    email: null,
    phone: null,
    city: null,
    riskProfile: "Moderate",
    settings: {
        twoFA: false,
        theme: "light",
        currency: "inr",
        notifications: {
            email: true,
            push: true,
            sms: false
        }
    },
    loading: true
}

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfileData>(initialProfile)
    const [baseInvestments, setBaseInvestments] = useState<any[]>([])
    const [goals, setGoals] = useState<FinancialGoal[]>([])
    const [loanProfile, setLoanProfile] = useState<LoanProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setProfile({ ...initialProfile, loading: false })
            setBaseInvestments([])
            setGoals([])
            setLoanProfile(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        // 1. User Profile: portfolio_requests (latest request for annualIncome, surplus, etc.)
        const requestsRef = collection(db, 'users', user.uid, 'portfolio_requests')
        const qRequests = query(requestsRef, orderBy('created_at', 'desc'), limit(1))
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            if (!snapshot.empty) {
                const latestDoc = snapshot.docs[0].data()
                const input = latestDoc.input || {}

                setProfile(prev => ({
                    ...prev,
                    annualIncome: input.user_profile?.annual_income || prev.annualIncome,
                    monthlySurplus: input.financial_details?.monthly_surplus || prev.monthlySurplus,
                    age: input.user_profile?.age || prev.age,
                    investmentHorizon: input.user_profile?.investment_horizon || prev.investmentHorizon,
                    loading: false
                }))
            } else {
                setProfile(prev => ({ ...prev, loading: false }))
            }
        })

        // 2. User Profile: main document for name, email, city, and annual_income/age overrides
        const profileDocRef = doc(db, 'users', user.uid)
        const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setProfile(prev => ({
                    ...prev,
                    name: data.profile?.name || user.displayName || prev.name,
                    email: data.profile?.email || user.email || prev.email,
                    phone: data.profile?.phone || user.phoneNumber || prev.phone,
                    city: data.profile?.city || prev.city,
                    riskProfile: data.profile?.riskProfile || prev.riskProfile,
                    annualIncome: data.profile?.annual_income || data.profile?.annualIncome || prev.annualIncome,
                    age: data.profile?.age || prev.age,
                    settings: {
                        ...prev.settings,
                        ...(data.settings || {})
                    }
                }))
            } else {
                setProfile(prev => ({
                    ...prev,
                    name: user.displayName || prev.name,
                    email: user.email || prev.email,
                    phone: user.phoneNumber || prev.phone,
                }))
            }
        })

        // 3. Investments subscription
        const portfolioRef = collection(db, "users", user.uid, "portfolio")
        const unsubscribeInvestments = onSnapshot(portfolioRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            }))
            setBaseInvestments(data)
        })

        // 4. Goals subscription
        const goalsRef = collection(db, 'users', user.uid, 'goals')
        const qGoals = query(goalsRef, orderBy('created_at', 'desc'))
        const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
            const goalsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            } as FinancialGoal))
            setGoals(goalsData)
        })

        // 5. Loan profile subscription
        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        const unsubscribeLoan = onSnapshot(loanRef, (docSnap) => {
            if (docSnap.exists()) {
                setLoanProfile(docSnap.data() as LoanProfile)
            } else {
                setLoanProfile(null)
            }
        })

        // Complete loading initialization
        setIsLoading(false)

        return () => {
            unsubscribeRequests()
            unsubscribeProfile()
            unsubscribeInvestments()
            unsubscribeGoals()
            unsubscribeLoan()
        }
    }, [user])

    const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
        if (!user) return
        const goalsRef = collection(db, 'users', user.uid, 'goals')
        await addDoc(goalsRef, {
            ...goal,
            created_at: serverTimestamp()
        })
    }

    const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
        if (!user) return
        const goalRef = doc(db, 'users', user.uid, 'goals', id)
        await updateDoc(goalRef, updates)
    }

    const deleteGoal = async (id: string) => {
        if (!user) return
        const goalRef = doc(db, 'users', user.uid, 'goals', id)
        await deleteDoc(goalRef)
    }

    const saveLoanProfile = async (data: Partial<LoanProfile>) => {
        if (!user) return
        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        await setDoc(loanRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true })
    }

    return (
        <FinancialDataContext.Provider
            value={{
                profile,
                baseInvestments,
                goals,
                loanProfile,
                loading: isLoading || profile.loading,
                addGoal,
                updateGoal,
                deleteGoal,
                saveLoanProfile
            }}
        >
            {children}
        </FinancialDataContext.Provider>
    )
}

export function useFinancialData() {
    const context = useContext(FinancialDataContext)
    return context
}
