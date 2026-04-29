"use client"

import { useState, useEffect, useCallback } from "react"
import {
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    increment,
    getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"

export interface LearningStats {
    flashcardsCompleted: number
    quizzesCompleted: number
    totalLearningXP: number
    currentStreak: number
    longestStreak: number
}

export interface GameProgress {
    xp: number
    level: number
    badges: string[]
    streak: number
    learningStats: LearningStats
    weeklyXP: number
    monthlyXP: number
    lastWeekReset: string   // ISO date string
    lastMonthReset: string  // ISO date string
    loading: boolean
}

const DEFAULTS: Omit<GameProgress, "loading"> = {
    xp: 0,
    level: 1,
    badges: [],
    streak: 0,
    learningStats: {
        flashcardsCompleted: 0,
        quizzesCompleted: 0,
        totalLearningXP: 0,
        currentStreak: 0,
        longestStreak: 0,
    },
    weeklyXP: 0,
    monthlyXP: 0,
    lastWeekReset: new Date().toISOString(),
    lastMonthReset: new Date().toISOString(),
}

/** Check if two dates are in the same ISO calendar week (Mon–Sun) */
function sameWeek(a: Date, b: Date): boolean {
    const startOfWeek = (d: Date) => {
        const day = d.getDay() || 7
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 1)
    }
    return startOfWeek(a).getTime() === startOfWeek(b).getTime()
}

/** Check if two dates share the same calendar month */
function sameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Decide which badge to award based on activity */
function resolveBadge(type: "flashcard" | "quiz", xpTotal: number, current: string[]): string | null {
    if (type === "flashcard" && xpTotal >= 30 && !current.includes("Flashcard Master"))
        return "Flashcard Master"
    if (type === "quiz" && xpTotal >= 50 && !current.includes("Quiz Champion"))
        return "Quiz Champion"
    if (!current.includes("Starter"))
        return "Starter"
    return null
}

export function useGameProgress() {
    const { user } = useAuth()
    const [progress, setProgress] = useState<GameProgress>({ ...DEFAULTS, loading: true })

    useEffect(() => {
        if (!user) {
            setProgress({ ...DEFAULTS, loading: false })
            return
        }

        const ref = doc(db, "users", user.uid, "gameProgress", "data")

        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) {
                // First-time: seed from defaults
                await setDoc(ref, DEFAULTS)
                setProgress({ ...DEFAULTS, loading: false })
            } else {
                const data = snap.data() as Omit<GameProgress, "loading">

                // Check if weekly / monthly XP should be reset
                const now = new Date()
                let updates: Record<string, unknown> = {}

                if (data.lastWeekReset && !sameWeek(new Date(data.lastWeekReset), now)) {
                    updates.weeklyXP = 0
                    updates.lastWeekReset = now.toISOString()
                }
                if (data.lastMonthReset && !sameMonth(new Date(data.lastMonthReset), now)) {
                    updates.monthlyXP = 0
                    updates.lastMonthReset = now.toISOString()
                }
                if (Object.keys(updates).length > 0) {
                    await updateDoc(ref, updates)
                }

                setProgress({ ...DEFAULTS, ...data, ...updates, loading: false })
            }
        })

        return () => unsub()
    }, [user])

    /**
     * Called when user completes a flashcard or quiz.
     * Persists XP gain to Firestore.
     */
    const earnXP = useCallback(
        async (amount: number, type: "flashcard" | "quiz") => {
            if (!user) return
            const ref = doc(db, "users", user.uid, "gameProgress", "data")

            // Read current state to check badge eligibility
            const snap = await getDoc(ref)
            const current = snap.exists() ? (snap.data() as Omit<GameProgress, "loading">) : DEFAULTS
            const newTotalXP = (current.learningStats?.totalLearningXP ?? 0) + amount
            const newXP = (current.xp ?? 0) + amount
            const newLevel = Math.floor(newXP / 100) + 1

            const badge = resolveBadge(type, newTotalXP, current.badges ?? [])
            const newBadges = badge ? [...(current.badges ?? []), badge] : current.badges ?? []

            const update: Record<string, unknown> = {
                xp: newXP,
                level: newLevel,
                badges: newBadges,
                "learningStats.totalLearningXP": increment(amount),
                weeklyXP: increment(amount),
                monthlyXP: increment(amount),
            }

            if (type === "flashcard") {
                update["learningStats.flashcardsCompleted"] = increment(1)
            } else {
                update["learningStats.quizzesCompleted"] = increment(1)
            }

            if (snap.exists()) {
                await updateDoc(ref, update)
            } else {
                await setDoc(ref, { ...DEFAULTS, xp: newXP, level: newLevel, badges: newBadges, weeklyXP: amount, monthlyXP: amount })
            }
        },
        [user]
    )

    return { ...progress, earnXP }
}
