import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/db/user';
import { compare } from 'bcryptjs';

export default Credentials({
    name: 'credentials',
    credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
        try {
            const email = credentials?.email as string;
            const password = credentials?.password as string;

            const user = await getUserByEmail(email);
            if (!user?.password) return null;

            const isValid = await compare(password, user.password);
            return isValid
                ? { id: user.id, email: user.email, role: user.role }
                : null;
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    },
});
