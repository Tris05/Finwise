import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { useFinancialData } from '@/components/providers/financial-data-provider';

export type GoalType = "Emergency Fund" | "Home Purchase" | "Car Purchase" | "Education" | "Retirement" | "Vacation" | "Other";

// Map GoalType (used in Settings) → category (used in AddGoalModal/InvestmentGoals component)
export const goalTypeToCategory: Record<GoalType, string> = {
    "Emergency Fund": "Emergency",
    "Home Purchase": "House",
    "Car Purchase": "Other",
    "Education": "Education",
    "Retirement": "Retirement",
    "Vacation": "Travel",
    "Other": "Other",
}

export interface FinancialGoal {
    id: string;
    // The Settings form saves 'type'; the AddGoalModal saves 'category'. Both are present optionally.
    type?: GoalType;
    category?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    priority: "High" | "Medium" | "Low";
    // Optional — may be missing for goals added via Settings (before this update)
    monthlyContribution?: number;
    expectedReturn?: number;
    status?: string; // Computed on the fly in the component; stored for legacy compat
}

export const useFinancialGoals = () => {
    const context = useFinancialData();
    const { user } = useAuth();
    const [goals, setGoals] = useState<FinancialGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (context && context.goals) {
            return;
        }

        if (!user) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const goalsRef = collection(db, 'users', user.uid, 'goals');
        const q = query(goalsRef, orderBy('created_at', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const goalsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            } as FinancialGoal));
            setGoals(goalsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, context]);

    const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
        if (context && context.addGoal) {
            await context.addGoal(goal);
            return;
        }
        if (!user) return;
        const goalsRef = collection(db, 'users', user.uid, 'goals');
        await addDoc(goalsRef, {
            ...goal,
            created_at: serverTimestamp()
        });
    };

    const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
        if (context && context.updateGoal) {
            await context.updateGoal(id, updates);
            return;
        }
        if (!user) return;
        const goalRef = doc(db, 'users', user.uid, 'goals', id);
        await updateDoc(goalRef, updates);
    };

    const deleteGoal = async (id: string) => {
        if (context && context.deleteGoal) {
            await context.deleteGoal(id);
            return;
        }
        if (!user) return;
        const goalRef = doc(db, 'users', user.uid, 'goals', id);
        await deleteDoc(goalRef);
    };

    if (context && context.goals) {
        return { goals: context.goals, loading: false, addGoal, updateGoal, deleteGoal };
    }

    return { goals, loading, addGoal, updateGoal, deleteGoal };
};
