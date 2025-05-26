'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export const RoleGate = ({
  children,
  allowedRoles,
  fallback,
}: RoleGateProps) => {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || 'user';

  // Wait for session to be loaded before making role decision
  if (status === 'loading') {
    return null; // or a loading spinner
  }

  if (!allowedRoles.includes(userRole)) {
    return fallback || null;
  }

  return <>{children}</>;
};
