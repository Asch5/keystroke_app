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
                console.log('---------------credentials----------------');
                try {
                    // Validate credentials schema
                    const validatedCredentials =
                        credentialsSchema.parse(credentials);
                    console.log(
                        '-------validatedCredentials------------',
                        validatedCredentials
                    );
                    // Find user
                    const user = await prisma.user.findUnique({
                        where: { email: validatedCredentials.email },
                    });

                    console.log('user from db', user);

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
                    const { password: _, ...userWithoutPassword } = user;
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

export const {
    auth,
    handlers: { GET, POST },
    signOut,
    signIn,
} = NextAuth(authOptions);
