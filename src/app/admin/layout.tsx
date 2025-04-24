'use client';

import { PageBreadcrumb } from '@/components/navigation/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoleGate } from '@/components/auth/RoleGate';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getNavigationLinks } from '@/lib/utils/navigation';
import SideNav from '@/components/dashboard/sidenav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Custom fallback component that uses client-side navigation
  const Fallback = () => {
    useEffect(() => {
      router.push('/dashboard');
    }, []);
    return null; // or a loading indicator if you prefer
  };

  return (
    <RoleGate allowedRoles={['admin']} fallback={<Fallback />}>
      <div className="flex h-screen flex-col md:flex-row">
        <div>
          <SideNav links={getNavigationLinks(pathname)} />
        </div>
        <main className="flex-1">
          <ScrollArea className="h-full">
            <div className="flex-1 p-8 pt-6">
              <PageBreadcrumb />
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>
    </RoleGate>
  );
}
