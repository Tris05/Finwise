import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface PortfolioRequest {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    input: any;
    output?: any;
    error?: string;
    created_at: any;
}

export const usePortfolioOptimizer = () => {
    const [loading, setLoading] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<PortfolioRequest | null>(null);
    const [error, setError] = useState<string | null>(null);

    const optimizePortfolio = async (inputData: any) => {
        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create a new request document
            const requestsRef = collection(db, 'users', user.uid, 'portfolio_requests');
            const docRef = await addDoc(requestsRef, {
                status: 'pending',
                input: inputData,
                created_at: serverTimestamp(),
            });

            // 2. Listen for changes to this document
            const unsubscribe = onSnapshot(docRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as PortfolioRequest;
                    const updatedRequest = { ...data, id: snapshot.id };
                    setCurrentRequest(updatedRequest);

                    if (data.status === 'completed') {
                        setLoading(false);
                        unsubscribe();
                    } else if (data.status === 'error') {
                        setLoading(false);
                        setError(data.error || 'An error occurred during optimization');
                        unsubscribe();
                    }
                }
            });

            return docRef.id;
        } catch (err: any) {
            setLoading(false);
            setError(err.message);
            console.error('Error triggering portfolio optimization:', err);
        }
    };

    return {
        optimizePortfolio,
        loading,
        currentRequest,
        error,
        reset: () => {
            setCurrentRequest(null);
            setError(null);
            setLoading(false);
        }
    };
};
