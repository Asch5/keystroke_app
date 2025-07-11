import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { NextAuthConfig, type Session, type User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import credentialsProvider from '@/core/lib/auth/providers';
import { prisma } from '@/core/lib/prisma';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? '',
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
        session.user.id = token.id;
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
  secret: process.env.NEXTAUTH_SECRET ?? '',
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
        id: token.id,
        role: token.role as string,
      },
    }),
  },
};
