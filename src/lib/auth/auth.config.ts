'use server';

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// Define validation schema for credentials
const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id ?? '';
                token.role = user.role ?? 'user';
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role ?? 'user';
            }
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                try {
                    const validatedCredentials =
                        credentialsSchema.parse(credentials);
                    return {
                        id: '1', // This will be replaced by the actual user data in the main auth file
                        email: validatedCredentials.email,
                        role: 'user',
                    };
                } catch (
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    _error
                ) {
                    return null;
                }
            },
        }),
    ],
} satisfies NextAuthConfig;
