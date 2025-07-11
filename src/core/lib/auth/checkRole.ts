import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function checkRole(allowedRoles: string[]) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userRole = session.user?.role ?? 'user';

  if (!allowedRoles.includes(userRole)) {
    redirect('/dashboard');
  }
}
