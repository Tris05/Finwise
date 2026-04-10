"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"

export const useAgenticInsights = () => {
    const { user } = useAuth()
    const [insights, setInsights] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const requestsRef = collection(db, "users", user.uid, "portfolio_requests")
        const q = query(
            requestsRef,
            where("status", "==", "completed"),
            orderBy("created_at", "desc"),
            limit(1)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setInsights(snapshot.docs[0].data())
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    return {
        insights,
        score: insights?.output?.investment_score || 0,
        recommendations: insights?.output?.recommendations || [],
        analysis: insights?.output?.analysis || "",
        loading,
        hasData: !!insights
    }
}
