"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"

export const usePortfolioHistory = (days: number = 30) => {
    const { user } = useAuth()
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const historyRef = collection(db, "users", user.uid, "portfolio_history")
        const q = query(historyRef, orderBy("date", "asc"), limit(days))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: doc.data().date // For charts
            }))
            setHistory(data)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user, days])

    return { history, loading }
}
