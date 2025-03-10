'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/lib/redux/store';
import { setUser, clearUser } from '@/lib/redux/features/authSlice';
import { getUserById } from '@/lib/db/user';
import { UserBasicData } from '@/types/user';

// Component to sync NextAuth session with Redux
function SessionSync() {
    const { data: session, status } = useSession();
    const dispatch = useAppDispatch();
    const [error, setError] = useState<string | null>(null);

    // useEffect(() => {
    //     if (status === 'loading') return;

    //     const syncUserData = async () => {
    //         try {
    //             if (status === 'authenticated' && session?.user) {
    //                 if (process.env.NODE_ENV === 'development') {
    //                     console.log('---Session authenticated:', session);
    //                 }

    //                 const user = await getUserById(session.user.id as string);

    //                 if (!user) {
    //                     console.error('User not found in database');
    //                     return;
    //                 }

    //                 const userBasicData: UserBasicData = {
    //                     id: user.id,
    //                     name: user.name,
    //                     email: user.email,
    //                     role: user.role,
    //                     status: user.status,
    //                     baseLanguageId: user.baseLanguageId,
    //                     targetLanguageId: user.targetLanguageId,
    //                 };

    //                 dispatch(setUser(userBasicData));
    //             } else if (status === 'unauthenticated') {
    //                 if (process.env.NODE_ENV === 'development') {
    //                     console.log('Session unauthenticated');
    //                 }
    //                 dispatch(clearUser());
    //             }
    //         } catch (err) {
    //             console.error('Error processing session:', err);
    //             setError(
    //                 err instanceof Error ? err.message : 'Unknown session error'
    //             );
    //             dispatch(clearUser());
    //         }
    //     };

    //     syncUserData();
    // }, [session, status, dispatch]);

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
