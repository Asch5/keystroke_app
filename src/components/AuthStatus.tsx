'use client';

import { useAppSelector } from '@/lib/redux/store';
import { useSession } from 'next-auth/react';

export default function AuthStatus() {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { status } = useSession();
    console.log('user', user);

    if (status === 'loading') {
        return (
            <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <p>Loading authentication status...</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
            <h2 className="text-lg font-bold mb-2">Authentication Status</h2>
            <p>Session Status: {status}</p>
            <p>
                Redux Auth State:{' '}
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </p>
            {user && (
                <div className="mt-2">
                    <p>User ID: {user.id}</p>
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                </div>
            )}
        </div>
    );
}
