'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/lib/redux/store';
import { setUser, clearUser } from '@/lib/redux/features/authSlice';

// Component to sync NextAuth session with Redux
function SessionSync() {
    const { data: session, status } = useSession();
    const dispatch = useAppDispatch();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        try {
            if (status === 'authenticated' && session?.user) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Session authenticated:', session);
                }

                const userData = {
                    id: session.user.id as string,
                    name: session.user.name as string,
                    email: session.user.email as string,
                };

                // Add role if it exists
                if ('role' in session.user) {
                    Object.assign(userData, { role: session.user.role });
                }

                dispatch(setUser(userData));
            } else if (status === 'unauthenticated') {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Session unauthenticated');
                }
                dispatch(clearUser());
            }
        } catch (err) {
            console.error('Error processing session:', err);
            setError(
                err instanceof Error ? err.message : 'Unknown session error'
            );
            dispatch(clearUser());
        }
    }, [session, status, dispatch]);

    if (error) {
        return (
            <div className="text-red-500">Authentication error: {error}</div>
        );
    }

    return null;
}

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
            <SessionSync />
            {children}
        </SessionProvider>
    );
}
