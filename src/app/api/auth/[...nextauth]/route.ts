import NextAuth, { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
// You'll need to implement these functions based on your database setup
import { getUserByEmail } from '@/lib/db/user';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await getUserByEmail(credentials.email as string);

                if (!user) {
                    return null;
                }

                const passwordMatch = await bcryptjs.compare(
                    credentials.password as string,
                    user.password as string
                );

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
        signOut: '/',
        error: '/error',
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions as NextAuthConfig);

export { handler as GET, handler as POST };
