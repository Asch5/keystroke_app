import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { z } from 'zod';

// Define validation schema for credentials
const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const authOptions: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    // Validate credentials schema
                    const validatedCredentials =
                        credentialsSchema.parse(credentials);
                    // Find user
                    const user = await prisma.user.findUnique({
                        where: { email: validatedCredentials.email },
                    });

                    if (!user || !user.password) {
                        throw new Error('Invalid credentials');
                    }

                    // Compare passwords
                    const isPasswordValid = await compare(
                        validatedCredentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        throw new Error('Invalid credentials');
                    }

                    // Return user without password
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password: _password, ...userWithoutPassword } =
                        user;
                    return userWithoutPassword;
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        throw new Error('Invalid credentials format');
                    }
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id ?? '';
                token.role = user.role ?? 'user';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role ?? 'user';
            }
            return session;
        },
    },
};

// Only export the handlers that Next.js expects in route files
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
