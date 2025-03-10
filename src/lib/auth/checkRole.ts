import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function checkRole(allowedRoles: string[]) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const userRole = session.user?.role || 'user';

    if (!allowedRoles.includes(userRole)) {
        redirect('/dashboard');
    }
}
