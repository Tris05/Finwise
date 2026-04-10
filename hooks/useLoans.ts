import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot, setDoc } from "firebase/firestore"

export interface LoanProfile {
    amount: number
    tenure: number
    rate: number
    type: string
    updatedAt?: string
}

export function useLoans() {
    const [loanProfile, setLoanProfile] = useState<LoanProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const user = auth.currentUser
        if (!user) {
            setLoading(false)
            return
        }

        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        const unsubscribe = onSnapshot(loanRef, (doc) => {
            if (doc.exists()) {
                setLoanProfile(doc.data() as LoanProfile)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const saveLoanProfile = async (data: Partial<LoanProfile>) => {
        const user = auth.currentUser
        if (!user) return

        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        await setDoc(loanRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true })
    }

    return {
        loanProfile,
        loading,
        saveLoanProfile
    }
}
