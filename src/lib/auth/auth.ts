'use server';

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail } from '../db/user';

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const email = credentials?.email;
                    const password = credentials?.password;

                    if (
                        !email ||
                        !password ||
                        typeof email !== 'string' ||
                        typeof password !== 'string'
                    ) {
                        return null;
                    }

                    const user = await getUserByEmail(email);

                    if (!user || !user.password) return null;

                    const isPasswordValid = await compare(
                        password,
                        user.password
                    );

                    if (!isPasswordValid) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
});
