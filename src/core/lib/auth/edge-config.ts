import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export const edgeAuthConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET!,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [], // Empty array for edge safety
  callbacks: {
    jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.email = user.email as string;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
