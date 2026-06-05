import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { useFinancialData } from "@/components/providers/financial-data-provider"

export interface LoanProfile {
    amount: number
    tenure: number
    rate: number
    type: string
    updatedAt?: string
}

export function useLoans() {
    const context = useFinancialData()
    const [loanProfile, setLoanProfile] = useState<LoanProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (context && context.loanProfile !== undefined) {
            return
        }

        const user = auth.currentUser
        if (!user) {
            setLoading(false)
            return
        }

        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        const unsubscribe = onSnapshot(loanRef, (docSnap) => {
            if (docSnap.exists()) {
                setLoanProfile(docSnap.data() as LoanProfile)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [context])

    const saveLoanProfile = async (data: Partial<LoanProfile>) => {
        if (context && context.saveLoanProfile) {
            await context.saveLoanProfile(data)
            return
        }

        const user = auth.currentUser
        if (!user) return

        const loanRef = doc(db, "users", user.uid, "loan_data", "current")
        await setDoc(loanRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true })
    }

    if (context && context.loanProfile !== undefined) {
        return {
            loanProfile: context.loanProfile,
            loading: false,
            saveLoanProfile
        }
    }

    return {
        loanProfile,
        loading,
        saveLoanProfile
    }
}
