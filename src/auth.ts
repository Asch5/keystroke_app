//adapter only works in node environment
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/core/lib/prisma';

// Define validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Auth configuration following NextAuth v5 structure
export const authConfig: NextAuthConfig = {
  // Use Prisma adapter for database session storage
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Add user ID and role to JWT token
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id ?? '';
        token.role = user.role ?? '';
      }
      return token;
    },
    // Add user ID and role to session
    session: async ({ session, token }) => {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role as string;
      }
      return session;
    },
    // Authorized callback for route protection

    authorized: ({
      auth,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      request,
    }) => {
      return !!auth?.user;
    },
  },
  // Configure session handling
  session: {
    strategy: 'jwt',
  },
  // Set auth secret from environment variables, providing a fallback
  secret: process.env.NEXTAUTH_SECRET!,
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign-in form
      name: 'Credentials',
      // Define credentials object structure
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials schema
          const validatedCredentials = credentialsSchema.parse(credentials);

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: validatedCredentials.email },
          });

          // Check if user exists and has password
          if (!user?.password) {
            return null;
          }

          // Verify password
          const isPasswordValid = await compare(
            validatedCredentials.password,
            user.password,
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user without password

          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
        } catch (error) {
          // Log error for debugging but return null to client
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
};

// Create auth handlers with NextAuth
export { handlers, auth, signIn, signOut } from '@/core/lib/auth/config';
