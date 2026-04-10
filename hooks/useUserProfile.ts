import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';

export interface UserProfileData {
    annualIncome: number | null;
    monthlySurplus: number | null;
    age: number | null;
    investmentHorizon: number | null;
    loading: boolean;
}

export const useUserProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfileData>({
        annualIncome: null,
        monthlySurplus: null,
        age: null,
        investmentHorizon: null,
        loading: true
    });

    useEffect(() => {
        if (!user) {
            setProfile(prev => ({ ...prev, loading: false }));
            return;
        }

        const requestsRef = collection(db, 'users', user.uid, 'portfolio_requests');
        const q = query(requestsRef, orderBy('created_at', 'desc'), limit(1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const latestDoc = snapshot.docs[0].data();
                const input = latestDoc.input || {};

                setProfile({
                    annualIncome: input.user_profile?.annual_income || null,
                    monthlySurplus: input.financial_details?.monthly_surplus || null,
                    age: input.user_profile?.age || null,
                    investmentHorizon: input.user_profile?.investment_horizon || null,
                    loading: false
                });
            } else {
                setProfile(prev => ({ ...prev, loading: false }));
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setProfile(prev => ({ ...prev, loading: false }));
        });

        return () => unsubscribe();
    }, [user]);

    return profile;
};
