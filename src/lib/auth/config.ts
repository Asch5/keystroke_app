import { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import credentialsProvider from './providers';
import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';

export const authConfig: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    pages: { signIn: '/login' },
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET!,
    providers: [credentialsProvider],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = user.role as string;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
};

const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export { handlers, auth, signIn, signOut };

// Separate edge-compatible config
export const edgeAuthConfig = {
    secret: process.env.NEXTAUTH_SECRET!,
    pages: { signIn: '/login' },
    session: { strategy: 'jwt' as const },
    callbacks: {
        jwt: ({ token, user }: { token: JWT; user?: User }) => ({
            ...token,
            id: user?.id as string,
            role: user?.role as string,
        }),
        session: ({ session, token }: { session: Session; token: JWT }) => ({
            ...session,
            user: {
                id: token.id as string,
                role: token.role as string,
            },
        }),
    },
};
