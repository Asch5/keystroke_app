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
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'user';

    if (!allowedRoles.includes(userRole)) {
        return fallback || null;
    }

    return <>{children}</>;
};
