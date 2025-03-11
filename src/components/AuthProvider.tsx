'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * AuthProvider component to wrap the application with NextAuth SessionProvider
 * This enables authentication state to be accessible throughout the app
 */
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SessionProvider>{children}</SessionProvider>;
}
