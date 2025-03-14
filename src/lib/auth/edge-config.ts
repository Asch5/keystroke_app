import type { NextAuthConfig, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export const edgeAuthConfig: NextAuthConfig = {
    secret: process.env.NEXTAUTH_SECRET!,
    pages: { signIn: '/login' },
    session: { strategy: 'jwt' },
    providers: [], // Empty array for edge safety
    callbacks: {
        jwt({ token, user }): JWT {
            return {
                ...token,
                id: user?.id as string,
                role: user?.role as string,
            };
        },
        session({ session, token }): Session {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id as string,
                    role: token.role as string,
                },
            };
        },
    },
};
