'use client';

import { useSession } from 'next-auth/react';

export default function AuthStatus() {
    const { status, data: session } = useSession();
    const isAuthenticated = status === 'authenticated';
    const user = session?.user;

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
                Auth State:{' '}
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </p>
            {user && (
                <div className="mt-2">
                    <p>User ID: {user.id}</p>
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                </div>
            )}
            {process.env.NODE_ENV === 'production' && (
                <p>
                    Secret Loaded: {process.env.NEXTAUTH_SECRET ? '✅' : '❌'}
                </p>
            )}
        </div>
    );
}
