import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { useFinancialData } from '@/components/providers/financial-data-provider';

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

export const useUserProfile = () => {
    const context = useFinancialData();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfileData>({
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
    });

    useEffect(() => {
        if (context && context.profile) {
            return;
        }

        if (!user) {
            setProfile(prev => ({ ...prev, loading: false }));
            return;
        }

        const requestsRef = collection(db, 'users', user.uid, 'portfolio_requests');
        const q = query(requestsRef, orderBy('created_at', 'desc'), limit(1));

        const unsubscribeRequests = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const latestDoc = snapshot.docs[0].data();
                const input = latestDoc.input || {};

                setProfile(prev => ({
                    ...prev,
                    annualIncome: input.user_profile?.annual_income || prev.annualIncome,
                    monthlySurplus: input.financial_details?.monthly_surplus || prev.monthlySurplus,
                    age: input.user_profile?.age || prev.age,
                    investmentHorizon: input.user_profile?.investment_horizon || prev.investmentHorizon,
                    loading: false
                }));
            } else {
                setProfile(prev => ({ ...prev, loading: false }));
            }
        });

        // Add a secondary listener for the profile document
        const profileDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap: any) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
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
                }));
            } else {
                // If doc doesn't exist, still use Auth fallbacks
                setProfile(prev => ({
                    ...prev,
                    name: user.displayName || prev.name,
                    email: user.email || prev.email,
                    phone: user.phoneNumber || prev.phone,
                }));
            }
        });

        return () => {
            unsubscribeRequests();
            unsubscribeProfile();
        };
    }, [user, context]);

    if (context && context.profile) {
        return context.profile;
    }

    return profile;
};
