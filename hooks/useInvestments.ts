"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"
import { useMarketData } from "./use-market-data"

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

export const useInvestments = () => {
    const { user } = useAuth()
    const [baseInvestments, setBaseInvestments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const {
        investments: realTimeInvestments,
        isLoading: marketLoading,
        lastUpdated
    } = useMarketData(baseInvestments)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const portfolioRef = collection(db, "users", user.uid, "portfolio")
        const unsubscribe = onSnapshot(portfolioRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            }))
            setBaseInvestments(data)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    const totalValue = realTimeInvestments.reduce((sum, inv) => sum + (Number(inv.currentValue) || 0), 0)
    const totalInvested = realTimeInvestments.reduce((sum, inv) => sum + (Number(inv.investedAmount) || 0), 0)
    const totalGain = totalValue - totalInvested
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

    const dayChange = realTimeInvestments.reduce((sum, inv) => sum + ((Number(inv.dayChange) || 0) * (Number(inv.quantity) || 0)), 0)
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

    return {
        investments: realTimeInvestments,
        totalValue,
        totalGain,
        totalGainPercent,
        dayChange,
        dayChangePercent,
        loading: loading || marketLoading,
        lastUpdated
    }
}
